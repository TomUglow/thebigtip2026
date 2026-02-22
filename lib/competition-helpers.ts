import { prisma } from '@/lib/prisma'

/**
 * Compute display prize pool for competitions.
 * - Paid entry (entryFee > 0): sum of successful payments
 * - Free entry (entryFee = 0): use stored prizePool
 */
export async function getPrizePoolForCompetitions<
  T extends { id: string; entryFee: number; prizePool: number }
>(competitions: T[]): Promise<Map<string, number>> {
  const paidIds = competitions.filter((c) => c.entryFee > 0).map((c) => c.id)
  if (paidIds.length === 0) {
    return new Map(competitions.map((c) => [c.id, c.prizePool]))
  }

  const sums = await prisma.payment.groupBy({
    by: ['competitionId'],
    where: {
      competitionId: { in: paidIds },
      status: 'succeeded',
    },
    _sum: { amount: true },
  })

  const sumMap = new Map(sums.map((s) => [s.competitionId, s._sum.amount ?? 0]))
  const result = new Map<string, number>()

  for (const c of competitions) {
    if (c.entryFee > 0) {
      result.set(c.id, sumMap.get(c.id) ?? 0)
    } else {
      result.set(c.id, c.prizePool)
    }
  }
  return result
}

/** Get display prize pool for a single competition */
export async function getPrizePoolForCompetition(
  competitionId: string,
  entryFee: number,
  prizePool: number
): Promise<number> {
  if (entryFee > 0) {
    const result = await prisma.payment.aggregate({
      where: {
        competitionId,
        status: 'succeeded',
      },
      _sum: { amount: true },
    })
    return result._sum.amount ?? 0
  }
  return prizePool
}
