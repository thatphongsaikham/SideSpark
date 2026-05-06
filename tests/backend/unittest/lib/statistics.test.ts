import { describe, expect, it } from 'vitest'
import {
  buildGoalProgress,
  buildProfitSeries,
  calculateActivityStreak,
  calculateMaxActivityStreak,
  type ProfitTransactionRecord,
} from '@/lib/statistics'

function createTransaction(
  overrides: Partial<ProfitTransactionRecord>,
): ProfitTransactionRecord {
  return {
    type: 'income',
    amount: 0,
    date: new Date(2026, 4, 20, 12),
    ...overrides,
  }
}

describe('statistics helpers', () => {
  it('counts the current streak across consecutive active days and ignores duplicate activity on the same day', () => {
    const streak = calculateActivityStreak(
      [
        new Date(2026, 4, 20, 10),
        new Date(2026, 4, 20, 18),
        new Date(2026, 4, 19, 9),
        new Date(2026, 4, 18, 15),
      ],
      { today: new Date(2026, 4, 20, 23) },
    )

    expect(streak).toBe(3)
  })

  it('returns zero immediately when today has no activity', () => {
    const streak = calculateActivityStreak(
      [
        new Date(2026, 4, 19, 10),
        new Date(2026, 4, 18, 9),
      ],
      { today: new Date(2026, 4, 20, 12) },
    )

    expect(streak).toBe(0)
  })

  it('tracks the longest streak in history even after the current streak resets', () => {
    const maxStreak = calculateMaxActivityStreak([
      new Date(2026, 4, 1, 10),
      new Date(2026, 4, 2, 10),
      new Date(2026, 4, 3, 10),
      new Date(2026, 4, 5, 10),
      new Date(2026, 4, 6, 10),
      new Date(2026, 4, 9, 10),
      new Date(2026, 4, 9, 15),
    ])

    expect(maxStreak).toBe(3)
  })

  it('builds a zero-filled monthly profit series for the requested period', () => {
    const monthlySeries = buildProfitSeries(
      [
        createTransaction({
          date: new Date(2026, 3, 15, 12),
          type: 'income',
          amount: 2000,
        }),
        createTransaction({
          date: new Date(2026, 3, 20, 12),
          type: 'expense',
          amount: 500,
        }),
        createTransaction({
          date: new Date(2026, 4, 10, 12),
          type: 'income',
          amount: 1500,
        }),
      ],
      {
        interval: 'month',
        periods: 3,
        today: new Date(2026, 4, 20, 12),
      },
    )

    expect(monthlySeries).toEqual([
      { key: '2026-03', income: 0, expense: 0, profit: 0 },
      { key: '2026-04', income: 2000, expense: 500, profit: 1500 },
      { key: '2026-05', income: 1500, expense: 0, profit: 1500 },
    ])
  })

  it('builds a zero-filled weekly profit series for the requested period', () => {
    const weeklySeries = buildProfitSeries(
      [
        createTransaction({
          date: new Date(2026, 4, 6, 12),
          type: 'income',
          amount: 900,
        }),
        createTransaction({
          date: new Date(2026, 4, 14, 12),
          type: 'expense',
          amount: 200,
        }),
        createTransaction({
          date: new Date(2026, 4, 15, 12),
          type: 'income',
          amount: 1200,
        }),
      ],
      {
        interval: 'week',
        periods: 3,
        today: new Date(2026, 4, 20, 12),
      },
    )

    expect(weeklySeries).toEqual([
      { key: '2026-W19', income: 900, expense: 0, profit: 900 },
      { key: '2026-W20', income: 1200, expense: 200, profit: 1000 },
      { key: '2026-W21', income: 0, expense: 0, profit: 0 },
    ])
  })

  it('builds project goal progress from the same income totals shown on the dashboard', () => {
    const goalsProgress = buildGoalProgress(
      [
        { id: 'project-1', monthlyGoal: 10000 },
        { id: 'project-2', monthlyGoal: 4000 },
      ],
      [
        { projectId: 'project-1', total: 1500 },
        { projectId: 'project-2', total: 5000 },
        { projectId: null, total: 900 },
      ],
    )

    expect(goalsProgress).toEqual([
      {
        projectId: 'project-1',
        goal: 10000,
        current: 1500,
        progress: 15,
      },
      {
        projectId: 'project-2',
        goal: 4000,
        current: 5000,
        progress: 100,
      },
    ])
  })
})
