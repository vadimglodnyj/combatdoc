import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, EpisodeNature, CareSegmentType } from '@prisma/client';
import { parseDump, SqlRow } from './turso-sql';

const prisma = new PrismaClient();

const DEFAULT_DUMP_DIR = __dirname;

const RANK_ALIASES: Record<string, string> = {
  солдат: 'SOL',
  'ст солдат': 'SOL',
  'старший солдат': 'SOL',
  'молодший сержант': 'JSER',
  сержант: 'SER',
  'старший сержант': 'SSER',
  'майстер-сержант': 'MST',
  'майстер сержант': 'MST',
  'головний сержант': 'MST',
  'штаб-сержант': 'SSER',
  'молодший лейтенант': 'JLT',
  лейтенант: 'LT',
  'старший лейтенант': 'SLT',
  капітан: 'CPT',
  майор: 'MAJ',
  підполковник: 'LCOL',
  полковник: 'COL',
};

const CARE_MAP: Record<string, CareSegmentType | 'CONSULTATION' | 'SKIP'> = {
  inpatient: 'HOSP',
  hosp: 'HOSP',
  hospital: 'HOSP',
  day_hospital: 'DAY',
  day: 'DAY',
  outpatient: 'AMB',
  amb: 'AMB',
  rehab: 'REHAB',
  abroad: 'ABROAD',
  mpbr: 'MPBR',
  mpb: 'CONSULTATION',
  phys_exempt: 'PHYS',
  phys: 'PHYS',
  vlk: 'SKIP',
  vlk_leave: 'VLK_LEAVE',
  vacation: 'VLK_LEAVE',
  referral: 'CONSULTATION',
  consultation: 'CONSULTATION',
  exam: 'CONSULTATION',
};

type Stats = {
  membersCreated: number;
  membersUpdated: number;
  membersSkipped: number;
  episodesCreated: number;
  episodesSkipped: number;
  certs: number;
  segments: number;
  consultations: number;
  journal: number;
};

function cell(row: SqlRow, ...keys: string[]): string {
  for (const key of keys) {
    const found = Object.keys(row).find((k) => k.toLowerCase() === key.toLowerCase());
    if (!found) continue;
    const value = row[found];
    if (value === null || value === undefined) continue;
    return String(value).trim();
  }
  return '';
}

function isDeleted(row: SqlRow): boolean {
  const deleted = cell(row, 'deleted_at');
  return Boolean(deleted && deleted !== 'null');
}

function parsePib(pib: string): { lastName: string; firstName: string; middleName: string } | null {
  const parts = pib.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (parts.length < 2) return null;
  return {
    lastName: parts[0],
    firstName: parts[1],
    middleName: parts.slice(2).join(' ') || '—',
  };
}

function parseDate(raw: string): Date | null {
  const text = raw.trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const dmy = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-zа-яіїєґ0-9]+/gi, ' ')
    .trim();
}

function mapCause(raw: string, needsCert: string): EpisodeNature {
  const text = `${raw} ${needsCert}`.toLowerCase();
  if (
    /\bcombat\b/.test(text) ||
    text.includes('бойов') ||
    text.includes('поранен') ||
    text.includes('травм') ||
    needsCert === '1' ||
    needsCert.toLowerCase() === 'true'
  ) {
    return 'COMBAT';
  }
  return 'SOMATIC';
}

function mapServiceType(raw: string): string {
  const text = raw.toLowerCase();
  if (text.includes('мобіл')) return 'Мобілізований';
  if (text.includes('строков')) return 'Строкова';
  if (text.includes('контракт')) return 'Контракт';
  return raw || 'Контракт';
}

function mapCare(raw: string): CareSegmentType | 'CONSULTATION' | 'SKIP' {
  const key = normalizeKey(raw).replace(/\s/g, '_');
  return CARE_MAP[key] || CARE_MAP[raw.toLowerCase()] || 'SKIP';
}

export function resolveDumpPath(dir = DEFAULT_DUMP_DIR, explicit?: string): string {
  if (explicit) return explicit;
  if (process.env.TURSO_DUMP_PATH) return process.env.TURSO_DUMP_PATH;
  const files = fs
    .readdirSync(dir)
    .filter((name) => /\.sql$/i.test(name) && /turso|dump|journal/i.test(name))
    .sort();
  if (!files.length) {
    throw new Error(
      `Немає SQL-дампа в ${dir}. Покладіть turso_journal.*.sql у apps/api/prisma (файл у git не потрапить).`,
    );
  }
  return path.join(dir, files[files.length - 1]);
}

async function main() {
  const dumpPath = resolveDumpPath(DEFAULT_DUMP_DIR, process.argv[2]);
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Файл не знайдено: ${dumpPath}`);
  }

  console.log(`📥 Читаю дамп (локально, не з git): ${dumpPath}`);
  const sql = fs.readFileSync(dumpPath, 'utf8');
  const dump = parseDump(sql);

  const patients = (dump.tables.patients?.rows || []).filter((row) => !isDeleted(row));
  const treatments = (dump.tables.treatments?.rows || []).filter((row) => !isDeleted(row));
  const injuryCases = (dump.tables.injury_cases?.rows || []).filter((row) => !isDeleted(row));
  const media = (dump.tables.treatment_media?.rows || []).filter((row) => !isDeleted(row));
  const visits = (dump.tables.outpatient_entries?.rows || []).filter((row) => !isDeleted(row));

  console.log(
    `Таблиці: patients=${patients.length}, treatments=${treatments.length}, injury_cases=${injuryCases.length}, visits=${visits.length}`,
  );

  const admin = await prisma.user.findFirst({
    where: { email: 'admin@combatdoc.local' },
  });
  if (!admin) {
    throw new Error('Спочатку виконайте pnpm db:seed (немає admin@combatdoc.local)');
  }

  const ranks = await prisma.rank.findMany();
  const units = await prisma.unit.findMany();
  const defaultRank =
    ranks.find((r) => r.code === 'SOL') ||
    ranks[0] ||
    (await prisma.rank.create({
      data: { code: 'UNK', name: 'Невідомо', sortOrder: 99 },
    }));
  const defaultUnit =
    units.find((u) => u.code === 'U3029') ||
    units[0] ||
    (await prisma.unit.create({
      data: { code: 'U3029', name: 'в/ч 3029', shortName: '3029', sortOrder: 1 },
    }));
  const defaultFacility =
    (await prisma.facility.findFirst({ where: { code: 'MPB' } })) ||
    (await prisma.facility.create({
      data: { code: 'MPB', name: 'Медична рота', shortName: 'МПБ', popularity: 100 },
    }));
  const defaultRole =
    (await prisma.practitionerRole.findFirst({ where: { code: 'THER' } })) ||
    (await prisma.practitionerRole.create({
      data: { code: 'THER', name: 'Терапевт', popularity: 100 },
    }));

  const stats: Stats = {
    membersCreated: 0,
    membersUpdated: 0,
    membersSkipped: 0,
    episodesCreated: 0,
    episodesSkipped: 0,
    certs: 0,
    segments: 0,
    consultations: 0,
    journal: 0,
  };

  const memberByOldId = new Map<string, string>();
  const episodeByOldTreatmentId = new Map<string, string>();

  function resolveRankId(raw: string): string {
    const key = normalizeKey(raw);
    const code = RANK_ALIASES[key];
    const byCode = code && ranks.find((r) => r.code === code);
    if (byCode) return byCode.id;
    const byName = ranks.find((r) => normalizeKey(r.name) === key || key.includes(normalizeKey(r.name)));
    return byName?.id || defaultRank.id;
  }

  function resolveUnitId(unitShort: string, rankUnit: string): { id: string; short?: string } {
    const blob = `${unitShort} ${rankUnit}`;
    const num = blob.match(/(?:підр|підрозділ|рота)?\s*([1-6])\b/i);
    if (num) {
      const code = `U${num[1]}`;
      const unit = units.find((u) => u.code === code);
      if (unit) return { id: unit.id, short: unit.shortName || unitShort || undefined };
    }
    if (/3029/.test(blob)) {
      const unit = units.find((u) => u.code === 'U3029');
      if (unit) return { id: unit.id, short: unitShort || unit.shortName || undefined };
    }
    const byShort = units.find(
      (u) => u.shortName && normalizeKey(u.shortName) === normalizeKey(unitShort),
    );
    if (byShort) return { id: byShort.id, short: unitShort || byShort.shortName || undefined };
    return { id: defaultUnit.id, short: unitShort || undefined };
  }

  for (const row of patients) {
    const pib = cell(row, 'pib', 'full_name', 'name');
    const parsed = parsePib(pib);
    if (!parsed) {
      stats.membersSkipped += 1;
      continue;
    }
    const oldId = cell(row, 'id', 'sync_id') || pib;
    const rankRaw = cell(row, 'rank', 'rank_unit');
    const unitInfo = resolveUnitId(cell(row, 'unit_short'), cell(row, 'rank_unit'));
    const data = {
      lastName: parsed.lastName,
      firstName: parsed.firstName,
      middleName: parsed.middleName,
      rankId: resolveRankId(rankRaw),
      unitId: unitInfo.id,
      serviceType: mapServiceType(cell(row, 'service_category', 'kategoriia')),
      fullPosition: cell(row, 'position', 'rank_unit') || '—',
      unitShortName: unitInfo.short,
      birthDate: parseDate(cell(row, 'birth_date')),
      phone: cell(row, 'phone') || null,
      taxId: cell(row, 'ipn') || null,
      recruitmentOffice: cell(row, 'komisariat') || null,
      recruitmentDate: parseDate(cell(row, 'enlistment_date')),
    };

    const existing = await prisma.serviceMember.findFirst({
      where: {
        lastName: { equals: parsed.lastName, mode: 'insensitive' },
        firstName: { equals: parsed.firstName, mode: 'insensitive' },
        middleName: { equals: parsed.middleName, mode: 'insensitive' },
      },
    });

    const member = existing
      ? await prisma.serviceMember.update({ where: { id: existing.id }, data })
      : await prisma.serviceMember.create({ data });

    if (existing) stats.membersUpdated += 1;
    else stats.membersCreated += 1;
    memberByOldId.set(String(oldId), member.id);
    if (cell(row, 'id')) memberByOldId.set(cell(row, 'id'), member.id);
  }

  const injuryById = new Map<string, SqlRow>();
  for (const row of injuryCases) {
    injuryById.set(cell(row, 'id'), row);
  }
  const certMediaByTreatment = new Set<string>();
  const certMediaByInjury = new Set<string>();
  for (const row of media) {
    const kind = cell(row, 'kind').toLowerCase();
    if (kind && kind !== 'injury_cert') continue;
    if (cell(row, 'treatment_id')) certMediaByTreatment.add(cell(row, 'treatment_id'));
    if (cell(row, 'injury_case_id')) certMediaByInjury.add(cell(row, 'injury_case_id'));
  }

  for (const row of treatments) {
    const patientId = cell(row, 'patient_id');
    const memberId = memberByOldId.get(patientId);
    if (!memberId) {
      stats.episodesSkipped += 1;
      continue;
    }
    const diagnosis = cell(row, 'title', 'diagnosis') || 'Без діагнозу';
    const startDate = parseDate(cell(row, 'started_on', 'created_at')) || new Date();
    const endDate = parseDate(cell(row, 'closed_on'));
    const nature = mapCause(cell(row, 'cause'), cell(row, 'needs_injury_cert'));
    const isActive = !endDate && cell(row, 'status').toLowerCase() !== 'closed';

    const existing = await prisma.episode.findFirst({
      where: { serviceMemberId: memberId, diagnosis, startDate },
    });
    if (existing) {
      episodeByOldTreatmentId.set(cell(row, 'id'), existing.id);
      stats.episodesSkipped += 1;
      continue;
    }

    const episode = await prisma.episode.create({
      data: {
        serviceMemberId: memberId,
        nature,
        diagnosis,
        startDate,
        endDate,
        isActive,
      },
    });
    episodeByOldTreatmentId.set(cell(row, 'id'), episode.id);
    stats.episodesCreated += 1;

    if (nature === 'COMBAT') {
      const injuryId = cell(row, 'injury_case_id');
      const hasFile =
        certMediaByTreatment.has(cell(row, 'id')) ||
        (injuryId && injuryId !== '0' && certMediaByInjury.has(injuryId));
      await prisma.injuryCertificate.create({
        data: {
          episodeId: episode.id,
          status: hasFile ? 'PENDING' : 'MISSING',
          filePath: hasFile ? cell(row, 'notes') || null : null,
        },
      });
      stats.certs += 1;
    }

    await prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        action: `Імпорт епізоду з Turso: ${diagnosis}`,
        patientId: memberId,
        episodeId: episode.id,
        userId: admin.id,
        metadata: { tursoTreatmentId: cell(row, 'id') },
      },
    });
    stats.journal += 1;
  }

  const facilityCache = new Map<string, string>();
  const episodeMemberCache = new Map<string, string>();

  async function resolveFacilityId(name: string): Promise<string> {
    if (!name) return defaultFacility.id;
    const key = name.toLowerCase();
    const cached = facilityCache.get(key);
    if (cached) return cached;
    const found = await prisma.facility.findFirst({
      where: {
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          { shortName: { contains: name, mode: 'insensitive' } },
        ],
      },
    });
    const id = found?.id || defaultFacility.id;
    facilityCache.set(key, id);
    return id;
  }

  for (const row of visits) {
    const episodeId = episodeByOldTreatmentId.get(cell(row, 'treatment_id'));
    if (!episodeId) continue;
    const care = mapCare(cell(row, 'care_type', 'kind', 'type'));
    const from = parseDate(cell(row, 'visit_date', 'date', 'start_on', 'leave_start', 'created_at'));
    if (!from) continue;
    const to = parseDate(cell(row, 'end_on', 'leave_end', 'closed_on'));
    const diagnosis = cell(row, 'diagnosis', 'title') || null;
    const notes = cell(row, 'note', 'notes') || null;
    const lpz = cell(row, 'lpz', 'from_lpz');
    const facilityId = await resolveFacilityId(lpz);

    if (care === 'CONSULTATION') {
      await prisma.consultation.create({
        data: {
          episodeId,
          kind: 'VISIT',
          status: 'DONE',
          facilityId,
          practitionerRoleId: defaultRole.id,
          completedDate: from,
          notes: [lpz, notes].filter(Boolean).join(' · ') || null,
        },
      });
      stats.consultations += 1;
    } else if (care !== 'SKIP') {
      await prisma.careSegment.create({
        data: {
          episodeId,
          type: care,
          dateFrom: from,
          dateTo: to,
          facilityId,
          diagnosis,
          notes,
        },
      });
      stats.segments += 1;
    }

    let memberId = episodeMemberCache.get(episodeId);
    if (!memberId) {
      memberId = (await prisma.episode.findUnique({ where: { id: episodeId } }))?.serviceMemberId;
      if (memberId) episodeMemberCache.set(episodeId, memberId);
    }
    await prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        action: `Імпорт запису журналу (${cell(row, 'care_type') || 'visit'})`,
        patientId: memberId,
        episodeId,
        userId: admin.id,
        metadata: { tursoVisitId: cell(row, 'id'), lpz },
      },
    });
    stats.journal += 1;
  }

  console.log('🎉 Імпорт завершено (дамп не змінювався і не комітиться):');
  console.log(JSON.stringify(stats, null, 2));
}

main()
  .catch((err) => {
    console.error('❌ Імпорт не вдався:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
