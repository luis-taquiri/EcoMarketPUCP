import { db } from "./db";

export async function getImpactSummary(userId: string) {
  const completedWhere = {
    status: "COMPLETED",
    OR: [{ requesterId: userId }, { receiverId: userId }],
  };
  const [totals, completed, delivered] = await db.$transaction([
    db.impactEntry.aggregate({
      where: { userId },
      _sum: { paperSheets: true, co2Grams: true },
      _count: true,
    }),
    db.trade.count({ where: completedWhere }),
    db.listing.count({ where: { userId, status: "EXCHANGED" } }),
  ]);
  return {
    sheets: totals._sum.paperSheets || 0,
    co2Kg: (totals._sum.co2Grams || 0) / 1000,
    estimated: totals._count,
    withoutEstimate: Math.max(0, delivered - totals._count),
    completed,
  };
}
