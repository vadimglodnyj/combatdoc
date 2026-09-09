import { Component } from '@angular/core';
import { NzUploadFile, NzUploadChangeParam } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ServiceMemberService } from '../../core/services/service-member.service';
import { ImportPreview, ImportRow } from '../../core/models/service-member.model';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss'],
})
export class ImportComponent {
  uploading = false;
  preview?: ImportPreview;
  selectedRows: Set<number> = new Set();
  overwriteExisting = false;
  applyLoading = false;
  applyResult?: any;

  constructor(
    private serviceMemberService: ServiceMemberService,
    private message: NzMessageService,
  ) {}

  beforeUpload = (file: NzUploadFile): boolean => {
    const isExcel =
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel';
    
    if (!isExcel) {
      this.message.error('Можна завантажувати тільки Excel файли (.xlsx, .xls)');
      return false;
    }

    const isLt10M = (file.size || 0) / 1024 / 1024 < 10;
    if (!isLt10M) {
      this.message.error('Файл повинен бути менше 10MB');
      return false;
    }

    return true;
  };

  handleChange = (info: NzUploadChangeParam): void => {
    if (info.file.status === 'uploading') {
      this.uploading = true;
    }

    if (info.file.status === 'done') {
      this.uploading = false;
      this.preview = info.file.response;
      this.selectAllValid();
      this.message.success('Файл завантажено і проаналізовано');
    } else if (info.file.status === 'error') {
      this.uploading = false;
      this.message.error('Помилка завантаження файлу');
    }
  };

  selectAllValid(): void {
    if (!this.preview) return;
    this.selectedRows.clear();
    this.preview.rows
      .filter((r) => r.errors.length === 0)
      .forEach((r) => this.selectedRows.add(r.rowNumber));
  }

  selectNone(): void {
    this.selectedRows.clear();
  }

  toggleRow(rowNumber: number): void {
    if (this.selectedRows.has(rowNumber)) {
      this.selectedRows.delete(rowNumber);
    } else {
      this.selectedRows.add(rowNumber);
    }
  }

  isRowSelected(rowNumber: number): boolean {
    return this.selectedRows.has(rowNumber);
  }

  applyImport(): void {
    if (this.selectedRows.size === 0) {
      this.message.warning('Оберіть хоча б один рядок для імпорту');
      return;
    }

    this.applyLoading = true;
    const rows = Array.from(this.selectedRows);

    this.serviceMemberService.importApply(rows, this.overwriteExisting).subscribe({
      next: (result) => {
        this.applyResult = result;
        this.applyLoading = false;
        this.message.success(
          `Імпорт завершено: створено ${result.created}, оновлено ${result.updated}`,
        );
      },
      error: (err) => {
        this.applyLoading = false;
        this.message.error(err.error?.message || 'Помилка імпорту');
      },
    });
  }

  reset(): void {
    this.preview = undefined;
    this.selectedRows.clear();
    this.applyResult = undefined;
  }

  getFullName(row: ImportRow): string {
    return `${row.lastName} ${row.firstName} ${row.middleName}`.trim();
  }

  getToken(): string {
    return localStorage.getItem('access_token') || '';
  }
}
