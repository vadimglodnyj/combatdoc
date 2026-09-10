import { PrismaClient } from '@prisma/client';
import { segmentDedupeKey } from './turso-care';

/** Drop identical segments and extra open rows (one open segment per episode). */
export async function collapseDuplicateCareSegments(prisma: PrismaClient): Promise<number> {
  let removed = 0;
  const all = await prisma.careSegment.findMany({ orderBy: { createdAt: 'asc' } });
  const seen = new Set<string>();
  for (const segment of all) {
    const key = segmentDedupeKey(segment);
    if (seen.has(key)) {
      await prisma.careSegment.delete({ where: { id: segment.id } });
      removed += 1;
      continue;
    }
    seen.add(key);
  }

  const stillOpen = await prisma.careSegment.findMany({
    where: { dateTo: null },
    orderBy: { createdAt: 'asc' },
  });
  const openByEpisode = new Set<string>();
  for (const segment of stillOpen) {
    if (openByEpisode.has(segment.episodeId)) {
      await prisma.careSegment.delete({ where: { id: segment.id } });
      removed += 1;
      continue;
    }
    openByEpisode.add(segment.episodeId);
  }
  return removed;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const removed = await collapseDuplicateCareSegments(prisma);
    console.log(`Прибрано дублів сегментів: ${removed}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
