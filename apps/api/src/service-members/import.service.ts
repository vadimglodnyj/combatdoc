import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ServiceMembersService } from './service-members.service';
import {
  ImportRow,
  ImportPreviewResponse,
  ImportApplyRequest,
  ImportApplyResponse,
} from './dto/import-preview.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class ImportService {
  private lastPreviewRows: ImportRow[] = [];

  constructor(
    private prisma: PrismaService,
    private serviceMembersService: ServiceMembersService,
  ) {}

  async previewImport(buffer: Buffer): Promise<ImportPreviewResponse> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (rawData.length < 2) {
      throw new BadRequestException('Excel file is empty or has no data rows');
    }

    const rows: ImportRow[] = [];
    const duplicatesMap = new Map<string, number>();

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const importRow = this.parseRow(row, i + 1);
      
      if (importRow.lastName && importRow.firstName && importRow.middleName) {
        const normalized = this.serviceMembersService.normalizeFullName(
          importRow.lastName,
          importRow.firstName,
          importRow.middleName,
        );
        duplicatesMap.set(normalized, (duplicatesMap.get(normalized) || 0) + 1);
      }

      rows.push(importRow);
    }

    await this.checkExistingMembers(rows);

    const validRows = rows.filter((r) => r.errors.length === 0);
    const invalidRows = rows.filter((r) => r.errors.length > 0);

    const duplicates = Array.from(duplicatesMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([name, count]) => ({ normalizedName: name, count }));

    this.lastPreviewRows = rows;

    return {
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      rows,
      duplicates,
    };
  }

  private parseRow(row: any[], rowNumber: number): ImportRow {
    const errors: string[] = [];
    const warnings: string[] = [];

    const getValue = (index: number): string => {
      const val = row[index];
      if (val === undefined || val === null || val === '') return '';
      const str = String(val).trim();
      if (str === '#NAME?' || str.startsWith('#')) return '';
      return str;
    };

    const lastName = getValue(3) || getValue(2);
    const firstName = getValue(4) || getValue(3);
    const middleName = getValue(5) || getValue(4);
    const unit = getValue(0) || getValue(1);
    const position = getValue(6) || getValue(5);
    const rankStaff = getValue(7) || getValue(6);
    const rankActual = getValue(8) || getValue(7);
    const serviceType = getValue(9) || getValue(8);
    const unitShort = getValue(10) || getValue(9);

    if (!lastName || !firstName || !middleName) {
      errors.push('Відсутнє ПІБ (прізвище/ім\'я/по батькові)');
    }

    if (!unit && !unitShort) {
      warnings.push('Відсутня інформація про підрозділ');
    }

    if (!rankActual && !rankStaff) {
      warnings.push('Відсутнє звання');
    }

    if (!position) {
      warnings.push('Відсутня посада');
    }

    return {
      rowNumber,
      lastName,
      firstName,
      middleName,
      unit,
      position,
      rankStaff,
      rankActual,
      serviceType,
      unitShort,
      errors,
      warnings,
    };
  }

  private async checkExistingMembers(rows: ImportRow[]) {
    for (const row of rows) {
      if (!row.lastName || !row.firstName || !row.middleName) continue;

      const existing = await this.serviceMembersService.findByNormalizedName(
        row.lastName,
        row.firstName,
        row.middleName,
      );

      if (existing.length > 0) {
        row.warnings.push(
          `Військовослужбовець з таким ПІБ вже існує (ID: ${existing[0].id})`,
        );
      }
    }
  }

  async applyImport(
    dto: ImportApplyRequest,
    userId: string,
  ): Promise<ImportApplyResponse> {
    if (!this.lastPreviewRows || this.lastPreviewRows.length === 0) {
      throw new BadRequestException('No preview data available. Run preview first.');
    }

    const rowsToImport = dto.rows.map((rowNum) =>
      this.lastPreviewRows.find((r) => r.rowNumber === rowNum),
    ).filter((r) => r && r.errors.length === 0) as ImportRow[];

    const ranks = await this.prisma.rank.findMany();
    const units = await this.prisma.unit.findMany();

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rowsToImport) {
      try {
        const existing = await this.serviceMembersService.findByNormalizedName(
          row.lastName,
          row.firstName,
          row.middleName,
        );

        const rank = this.findBestRank(ranks, row.rankActual || row.rankStaff || '');
        const unit = this.findBestUnit(units, row.unit || '', row.unitShort || '');

        if (!rank) {
          errors.push(`Рядок ${row.rowNumber}: Не знайдено звання для "${row.rankActual || row.rankStaff}"`);
          skipped++;
          continue;
        }

        if (!unit) {
          errors.push(`Рядок ${row.rowNumber}: Не знайдено підрозділ для "${row.unit}"`);
          skipped++;
          continue;
        }

        const data = {
          lastName: row.lastName,
          firstName: row.firstName,
          middleName: row.middleName,
          rankId: rank.id,
          unitId: unit.id,
          serviceType: row.serviceType || 'Контракт',
          fullPosition: row.position || 'Не вказано',
          unitShortName: row.unitShort || unit.shortName || unit.name,
        };

        if (existing.length > 0 && dto.overwriteExisting) {
          await this.serviceMembersService.update(existing[0].id, data, userId);
          updated++;
        } else if (existing.length === 0) {
          await this.serviceMembersService.create(data as any, userId);
          created++;
        } else {
          skipped++;
        }
      } catch (error: any) {
        errors.push(`Рядок ${row.rowNumber}: ${error.message}`);
        skipped++;
      }
    }

    this.lastPreviewRows = [];

    return { created, updated, skipped, errors };
  }

  private findBestRank(ranks: any[], searchTerm: string): any | null {
    if (!searchTerm) return null;
    
    const normalized = searchTerm.toLowerCase().trim();
    
    return (
      ranks.find((r) => r.name.toLowerCase() === normalized) ||
      ranks.find((r) => r.code.toLowerCase() === normalized) ||
      ranks.find((r) => r.name.toLowerCase().includes(normalized)) ||
      ranks.find((r) => normalized.includes(r.name.toLowerCase())) ||
      null
    );
  }

  private findBestUnit(units: any[], fullName: string, shortName: string): any | null {
    if (!fullName && !shortName) return null;

    const searchTerms = [fullName, shortName].filter(Boolean).map((t) => t.toLowerCase().trim());

    for (const term of searchTerms) {
      const found =
        units.find((u) => u.name.toLowerCase() === term) ||
        units.find((u) => u.shortName?.toLowerCase() === term) ||
        units.find((u) => u.code.toLowerCase() === term) ||
        units.find((u) => u.name.toLowerCase().includes(term)) ||
        units.find((u) => term.includes(u.name.toLowerCase()));

      if (found) return found;
    }

    const unitNumberMatch = searchTerms[0]?.match(/\d+/);
    if (unitNumberMatch) {
      const found = units.find((u) => u.name.includes(unitNumberMatch[0]) || u.code.includes(unitNumberMatch[0]));
      if (found) return found;
    }

    return units[0];
  }
}
