export type WorkoutAssignment = {
  workout?: import("./workouts").BuiltWorkout;
  id: string;
  title: string;
  detail: string;
  description: string;
  focusId: string;
  durationMinutes: number | null;
  progressionLevel?: number;
  prescriptionVersion?: number;
  recoveryWeek?: boolean;
  selectionReason?: string;
};

export type TrainingDayPlan = {
  dateKey: string;
  date: Date;
  isToday: boolean;
  workout: WorkoutAssignment | null;
};

export type WeeklyTrainingPlan = {
  startDate: Date;
  endDate: Date;
  days: TrainingDayPlan[];
};

export type WorkoutAssignmentsByDate = Readonly<
  Record<string, WorkoutAssignment | undefined>
>;

export const REST_DAY_WORKOUT: WorkoutAssignment = {
  id: "rest-day",
  title: "Rest Day",
  detail: "Recovery",
  description:
    "No workout is assigned. Prioritize recovery, normal daily movement and preparation for the next session.",
  focusId: "recovery",
  durationMinutes: null,
};

/**
 * Builds the local Monday-to-Sunday calendar week. Workout assignments are
 * keyed by YYYY-MM-DD so a future workout library or prescription engine can
 * fill individual days without changing the calendar UI.
 */
export function buildWeeklyTrainingPlan(
  referenceDate: Date = new Date(),
  assignments: WorkoutAssignmentsByDate = {}
): WeeklyTrainingPlan {
  const today = startOfLocalDay(referenceDate);
  const mondayOffset = (today.getDay() + 6) % 7;
  const startDate = addLocalDays(today, -mondayOffset);
  const todayKey = toLocalDateKey(today);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addLocalDays(startDate, index);
    const dateKey = toLocalDateKey(date);

    return {
      dateKey,
      date,
      isToday: dateKey === todayKey,
      workout: assignments[dateKey] ?? null,
    };
  });

  return {
    startDate,
    endDate: days[6].date,
    days,
  };
}

export function resolveDayWorkout(day: TrainingDayPlan): WorkoutAssignment {
  return day.workout ?? REST_DAY_WORKOUT;
}

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, numberOfDays: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + numberOfDays);
}
