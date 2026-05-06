import {
  differenceInCalendarDays,
  format,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
  subMonths,
  subWeeks,
} from 'date-fns'

export type ProfitTransactionRecord = {
  amount: number
  date: Date
  type: 'income' | 'expense' | string
}

export type GoalProgressProject = {
  id: string
  monthlyGoal: number
}

export type GoalProgressIncome = {
  projectId: string | null
  total: number
}

export type GoalProgressPoint = {
  projectId: string
  goal: number
  current: number
  progress: number
}

type ProfitSeriesOptions = {
  interval: 'week' | 'month'
  periods: number
  today?: Date
}

type ProfitSeriesPoint = {
  key: string
  income: number
  expense: number
  profit: number
}

function getPeriodStart(value: Date, interval: 'week' | 'month'): Date {
  return interval === 'week' ? startOfISOWeek(value) : startOfMonth(value)
}

function getPeriodKey(value: Date, interval: 'week' | 'month'): string {
  return interval === 'week'
    ? format(value, "RRRR-'W'II")
    : format(value, 'yyyy-MM')
}

function getUniqueActivityDays(activityDates: Date[]): Date[] {
  return Array.from(
    new Map(
      activityDates.map((value) => {
        const day = startOfDay(value)
        return [format(day, 'yyyy-MM-dd'), day] as const
      }),
    ).values(),
  )
}

export function calculateActivityStreak(
  activityDates: Date[],
  options: { today?: Date } = {},
): number {
  if (activityDates.length === 0) return 0

  const today = startOfDay(options.today ?? new Date())
  const uniqueDays = getUniqueActivityDays(activityDates).sort(
    (left, right) => right.getTime() - left.getTime(),
  )

  const latestActivity = uniqueDays[0]
  const latestDelta = differenceInCalendarDays(today, latestActivity)

  if (latestDelta !== 0) {
    return 0
  }

  let streak = 1

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const dayDelta = differenceInCalendarDays(
      uniqueDays[index - 1],
      uniqueDays[index],
    )

    if (dayDelta !== 1) {
      break
    }

    streak += 1
  }

  return streak
}

export function calculateMaxActivityStreak(activityDates: Date[]): number {
  if (activityDates.length === 0) return 0

  const uniqueDays = getUniqueActivityDays(activityDates).sort(
    (left, right) => left.getTime() - right.getTime(),
  )

  let currentStreak = 1
  let maxStreak = 1

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const dayDelta = differenceInCalendarDays(
      uniqueDays[index],
      uniqueDays[index - 1],
    )

    currentStreak = dayDelta === 1 ? currentStreak + 1 : 1
    maxStreak = Math.max(maxStreak, currentStreak)
  }

  return maxStreak
}

export function buildProfitSeries(
  transactions: ProfitTransactionRecord[],
  options: ProfitSeriesOptions,
): ProfitSeriesPoint[] {
  const { interval, periods } = options
  const today = options.today ?? new Date()
  const latestPeriodStart = getPeriodStart(today, interval)
  const periodStarts = Array.from({ length: periods }, (_, index) => {
    const offset = periods - index - 1
    return interval === 'week'
      ? startOfISOWeek(subWeeks(latestPeriodStart, offset))
      : startOfMonth(subMonths(latestPeriodStart, offset))
  })

  const series = periodStarts.map((periodStart) => ({
    key: getPeriodKey(periodStart, interval),
    income: 0,
    expense: 0,
    profit: 0,
  }))

  const seriesIndex = new Map(series.map((point, index) => [point.key, index]))

  transactions.forEach((transaction) => {
    const key = getPeriodKey(getPeriodStart(transaction.date, interval), interval)
    const targetIndex = seriesIndex.get(key)

    if (targetIndex === undefined) {
      return
    }

    if (transaction.type === 'expense') {
      series[targetIndex].expense += transaction.amount
      series[targetIndex].profit -= transaction.amount
      return
    }

    series[targetIndex].income += transaction.amount
    series[targetIndex].profit += transaction.amount
  })

  return series
}

export function buildGoalProgress(
  projects: GoalProgressProject[],
  incomeByProject: GoalProgressIncome[],
): GoalProgressPoint[] {
  const incomeTotalsByProjectId = new Map(
    incomeByProject
      .filter(
        (item): item is GoalProgressIncome & { projectId: string } =>
          typeof item.projectId === 'string',
      )
      .map((item) => [item.projectId, item.total]),
  )

  return projects.map((project) => {
    const current = incomeTotalsByProjectId.get(project.id) ?? 0
    const progress =
      project.monthlyGoal > 0 ? (current / project.monthlyGoal) * 100 : 0

    return {
      projectId: project.id,
      goal: project.monthlyGoal,
      current,
      progress: Math.min(100, Math.round(progress)),
    }
  })
}
