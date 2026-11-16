export type Muscle = 'piept' | 'spate' | 'picioare' | 'umeri' | 'brate' | 'abdomen'

export type ExerciseDef = { id: string; name: string; muscle: Muscle }

export type RoutineExercise = {
  uid: string
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  notes: string
}

export type Routine = { id: string; name: string; short: string; exercises: RoutineExercise[] }

export type SplitPreset = 'ppl' | 'ul' | 'ppl-ul' | 'custom'
export type CycleType = 'fixed' | 'rolling'

export type PlanDay = { id: string; routineId: string | null; lastRoutineId: string }

export type Plan = { preset: SplitPreset; cycleType: CycleType; days: PlanDay[] }

export type SetEntry = { kg: number; reps: number }

export type SessionRecord = { date: string; sets: Record<string, SetEntry[]>; volume: number }

export type LiveSet = { kg: string; reps: string; done: boolean }

export type Session = {
  routineId: string
  startedAt: number | null
  exercises: RoutineExercise[]
  logs: Record<string, LiveSet[]>
}

export type WeightEntry = { id: string; date: string; kg: number }

export type Objective = 'cut' | 'bulk' | 'recomp'
export type Experience = 'incepator' | 'intermediar' | 'avansat'
export type Sex = 'M' | 'F'

export type Profile = {
  age: number
  height: number
  sex: Sex
  experience: Experience
  objective: Objective
  targetWeight: number
  pace: number
  workoutsPerWeek: number
}

export type Lift = { id: string; name: string; current: number; target: number }

export type FinishedSummary = {
  routineName: string
  volume: number
  setsDone: number
  durationMin: number
}

export type FitnessState = {
  profile: Profile
  weights: WeightEntry[]
  plan: Plan
  routines: Record<string, Routine>
  history: Record<string, SessionRecord>
  activity: string[]
  queueIndex: number
  session: Session
  lifts: Lift[]
  lastFinished: FinishedSummary | null
}
