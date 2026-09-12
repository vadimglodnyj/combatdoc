import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { BOP2_UNITS } from './unit-dictionary';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@combatdoc.local' },
    update: {},
    create: {
      email: 'admin@combatdoc.local',
      password: hashedPassword,
      role: 'ADMIN',
      fullName: 'Системний адміністратор',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  const ranks = [
    { code: 'SOL', name: 'Солдат', sortOrder: 1 },
    { code: 'JSER', name: 'Молодший сержант', sortOrder: 2 },
    { code: 'SER', name: 'Сержант', sortOrder: 3 },
    { code: 'SSER', name: 'Старший сержант', sortOrder: 4 },
    { code: 'MST', name: 'Майстер-сержант', sortOrder: 5 },
    { code: 'JLT', name: 'Молодший лейтенант', sortOrder: 6 },
    { code: 'LT', name: 'Лейтенант', sortOrder: 7 },
    { code: 'SLT', name: 'Старший лейтенант', sortOrder: 8 },
    { code: 'CPT', name: 'Капітан', sortOrder: 9 },
    { code: 'MAJ', name: 'Майор', sortOrder: 10 },
    { code: 'LCOL', name: 'Підполковник', sortOrder: 11 },
    { code: 'COL', name: 'Полковник', sortOrder: 12 },
  ];

  for (const rank of ranks) {
    await prisma.rank.upsert({
      where: { code: rank.code },
      update: {},
      create: rank,
    });
  }

  console.log('✅ Ranks seeded');

  const units = [
    { code: 'U3029', name: 'в/ч 3029', shortName: '3029', sortOrder: 1 },
    { code: 'U1', name: 'Підрозділ 1', shortName: 'Підр-1', sortOrder: 2 },
    { code: 'U2', name: 'Підрозділ 2', shortName: 'Підр-2', sortOrder: 3 },
    { code: 'U3', name: 'Підрозділ 3', shortName: 'Підр-3', sortOrder: 4 },
    { code: 'U4', name: 'Підрозділ 4', shortName: 'Підр-4', sortOrder: 5 },
    { code: 'U5', name: 'Підрозділ 5', shortName: 'Підр-5', sortOrder: 6 },
    { code: 'U6', name: 'Підрозділ 6', shortName: 'Підр-6', sortOrder: 7 },
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      update: {},
      create: unit,
    });
  }

  // Canonical 2-й БОП subunits (from the штат) so imports reuse proper
  // names/short codes instead of creating ad-hoc units.
  let bopSort = 10;
  for (const unit of BOP2_UNITS) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      update: { name: unit.name, shortName: unit.signature },
      create: {
        code: unit.code,
        name: unit.name,
        shortName: unit.signature,
        sortOrder: bopSort++,
      },
    });
  }

  console.log('✅ Units seeded');

  const facilities = [
    { code: 'MPB', name: 'Медична рота', shortName: 'МПБ', popularity: 100 },
    {
      code: 'ZOKL',
      name: 'Запорізька обласна клінічна лікарня',
      shortName: 'ЗОКЛ',
      popularity: 90,
    },
    {
      code: 'DUTMO',
      name: 'ДУ ТМО МВС Запорізька',
      shortName: 'ДУ ТМО',
      popularity: 85,
    },
    {
      code: 'MLE',
      name: 'Військовий госпіталь (МЛЕ/ШМД)',
      shortName: 'МЛЕ',
      popularity: 80,
    },
    { code: 'CITY9', name: '9 міська лікарня', shortName: '9 міська', popularity: 70 },
  ];

  for (const facility of facilities) {
    await prisma.facility.upsert({
      where: { code: facility.code },
      update: {},
      create: facility,
    });
  }

  console.log('✅ Facilities seeded');

  const practitionerRoles = [
    { code: 'THER', name: 'Терапевт', popularity: 100 },
    { code: 'SURG', name: 'Хірург', popularity: 90 },
    { code: 'TRAUM', name: 'Травматолог', popularity: 85 },
    { code: 'NEURO', name: 'Невролог', popularity: 80 },
    { code: 'ENT', name: 'ЛОР', popularity: 75 },
    { code: 'OPHT', name: 'Офтальмолог', popularity: 70 },
    { code: 'CARD', name: 'Кардіолог', popularity: 65 },
    { code: 'PSYCH', name: 'Психіатр', popularity: 60 },
    { code: 'FELD', name: 'Фельдшер', popularity: 95 },
    { code: 'HEAD_MPB', name: 'Начальник МПБ', popularity: 98 },
  ];

  for (const role of practitionerRoles) {
    await prisma.practitionerRole.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }

  console.log('✅ Practitioner roles seeded');

  // Seed demo ServiceMembers and Episodes
  const soldierRank = await prisma.rank.findUnique({ where: { code: 'SOL' } });
  const sergeantRank = await prisma.rank.findUnique({ where: { code: 'SER' } });
  const firstUnit = await prisma.unit.findUnique({ where: { code: 'U1' } });
  const secondUnit = await prisma.unit.findUnique({ where: { code: 'U2' } });

  if (!soldierRank || !sergeantRank || !firstUnit || !secondUnit) {
    throw new Error('Dictionaries (ranks/units) must be seeded before demo data');
  }

  const demoMembers = [
    {
      lastName: 'Коваленко',
      firstName: 'Іван',
      middleName: 'Петрович',
      rankId: soldierRank.id,
      unitId: firstUnit.id,
      serviceType: 'CONTRACT',
      fullPosition: 'Стрілець 1 відділення',
      unitShortName: firstUnit.shortName,
      birthDate: new Date('1995-03-15'),
      phone: '+380501234567',
    },
    {
      lastName: 'Шевченко',
      firstName: 'Олексій',
      middleName: 'Миколайович',
      rankId: sergeantRank.id,
      unitId: secondUnit.id,
      serviceType: 'CONTRACT',
      fullPosition: 'Командир відділення',
      unitShortName: secondUnit.shortName,
      birthDate: new Date('1992-07-22'),
      phone: '+380502345678',
    },
  ];

  const createdMembers = [];
  for (const member of demoMembers) {
    // ServiceMember has no unique constraint on ПІБ, so match manually to keep seed idempotent
    const existing = await prisma.serviceMember.findFirst({
      where: {
        lastName: member.lastName,
        firstName: member.firstName,
        middleName: member.middleName,
      },
    });

    createdMembers.push(existing ?? (await prisma.serviceMember.create({ data: member })));
  }

  console.log('✅ Demo service members seeded');

  const combatDiagnosis = 'Осколкове поранення м\'яких тканин правого стегна';
  const existingCombat = await prisma.episode.findFirst({
    where: { serviceMemberId: createdMembers[0].id, diagnosis: combatDiagnosis },
  });

  if (!existingCombat) {
    const combatEpisode = await prisma.episode.create({
      data: {
        serviceMemberId: createdMembers[0].id,
        nature: 'COMBAT',
        diagnosis: combatDiagnosis,
        startDate: new Date('2024-09-01'),
        isActive: true,
      },
    });

    await prisma.injuryCertificate.create({
      data: {
        episodeId: combatEpisode.id,
        status: 'MISSING',
      },
    });

    await prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        patientId: createdMembers[0].id,
        episodeId: combatEpisode.id,
        userId: admin.id,
        action: `Створено бойовий епізод: ${combatEpisode.diagnosis}`,
      },
    });
  }

  const somaticDiagnosis = 'Гострий бронхіт';
  const existingSomatic = await prisma.episode.findFirst({
    where: { serviceMemberId: createdMembers[1].id, diagnosis: somaticDiagnosis },
  });

  if (!existingSomatic) {
    const somaticEpisode = await prisma.episode.create({
      data: {
        serviceMemberId: createdMembers[1].id,
        nature: 'SOMATIC',
        diagnosis: somaticDiagnosis,
        startDate: new Date('2024-08-20'),
        endDate: new Date('2024-09-05'),
        isActive: false,
      },
    });

    await prisma.journalEntry.create({
      data: {
        type: 'CLINICAL',
        patientId: createdMembers[1].id,
        episodeId: somaticEpisode.id,
        userId: admin.id,
        action: `Створено небойовий епізод: ${somaticEpisode.diagnosis}`,
      },
    });
  }

  console.log('✅ Demo episodes seeded (1 COMBAT with missing cert, 1 SOMATIC closed)');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('👤 Default admin credentials:');
  console.log('   Email: admin@combatdoc.local');
  console.log('   Password: admin123');
  console.log('');
  console.log('⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
