import type {
  ExerciseDef,
  FitnessState,
  Lift,
  Muscle,
  PlanDay,
  Routine,
  RoutineExercise,
  SplitPreset,
} from './types'

export const MUSCLE_LABELS: Record<Muscle, string> = {
  piept: 'Piept',
  spate: 'Spate',
  picioare: 'Picioare',
  umeri: 'Umeri',
  brate: 'Brațe',
  abdomen: 'Abdomen',
}

export const EXERCISES: ExerciseDef[] = [
  { id: 'bench', name: 'Împins la piept cu bara', muscle: 'piept' },
  { id: 'db-press', name: 'Împins înclinat cu gantere', muscle: 'piept' },
  { id: 'dips', name: 'Flotări la paralele', muscle: 'piept' },
  { id: 'ohp', name: 'Presă militară', muscle: 'umeri' },
  { id: 'lateral', name: 'Ridicări laterale', muscle: 'umeri' },
  { id: 'facepull', name: 'Face pull la scripete', muscle: 'umeri' },
  { id: 'row', name: 'Ramat cu haltera', muscle: 'spate' },
  { id: 'pullup', name: 'Tracțiuni cu greutate', muscle: 'spate' },
  { id: 'latpull', name: 'Tras la helcometru', muscle: 'spate' },
  { id: 'deadlift', name: 'Îndreptări', muscle: 'spate' },
  { id: 'curl', name: 'Flexii biceps cu bara', muscle: 'brate' },
  { id: 'hammer', name: 'Flexii ciocan cu gantere', muscle: 'brate' },
  { id: 'triceps', name: 'Extensii triceps la scripete', muscle: 'brate' },
  { id: 'squat', name: 'Genuflexiuni cu bara', muscle: 'picioare' },
  { id: 'rdl', name: 'Îndreptări românești', muscle: 'picioare' },
  { id: 'legpress', name: 'Presă picioare', muscle: 'picioare' },
  { id: 'legcurl', name: 'Flexii femurali la aparat', muscle: 'picioare' },
  { id: 'calf', name: 'Ridicări pe vârfuri', muscle: 'picioare' },
  { id: 'crunch', name: 'Abdomene la scripete', muscle: 'abdomen' },
]

export const EXERCISE_MAP = Object.fromEntries(EXERCISES.map((e) => [e.id, e])) as Record<string, ExerciseDef>

let uidCounter = 0
export const uid = (prefix = 'x') => `${prefix}-${++uidCounter}-${Math.random().toString(36).slice(2, 7)}`

const ex = (exerciseId: string, sets: number, repMin: number, repMax: number, notes = ''): RoutineExercise => ({
  uid: `${exerciseId}-${sets}-${repMin}-${Math.random().toString(36).slice(2, 6)}`,
  exerciseId,
  sets,
  repMin,
  repMax,
  notes,
})

export function createRoutines(): Record<string, Routine> {
  const list: Routine[] = [
    {
      id: 'push-a',
      name: 'Push Day A',
      short: 'Push A',
      exercises: [
        ex('bench', 3, 6, 8, 'Omoplații retrași, pauză scurtă pe piept.'),
        ex('db-press', 3, 8, 10, 'Bancă la 30°.'),
        ex('ohp', 3, 6, 8),
        ex('lateral', 3, 12, 15, 'Control pe faza negativă.'),
        ex('dips', 2, 8, 12),
        ex('triceps', 3, 10, 12),
      ],
    },
    {
      id: 'pull-a',
      name: 'Pull Day A',
      short: 'Pull A',
      exercises: [
        ex('row', 4, 6, 8, 'Trunchi la ~45°, fără elan.'),
        ex('pullup', 3, 6, 10),
        ex('latpull', 3, 10, 12),
        ex('facepull', 3, 12, 15),
        ex('curl', 3, 8, 10),
        ex('hammer', 2, 10, 12),
      ],
    },
    {
      id: 'legs-a',
      name: 'Legs Day A',
      short: 'Legs A',
      exercises: [
        ex('squat', 4, 5, 7, 'Adâncime sub paralel.'),
        ex('rdl', 3, 8, 10),
        ex('legpress', 3, 10, 12),
        ex('legcurl', 3, 10, 12),
        ex('calf', 4, 12, 15),
      ],
    },
    {
      id: 'upper-b',
      name: 'Upper Day B',
      short: 'Upper B',
      exercises: [
        ex('db-press', 4, 8, 10),
        ex('latpull', 4, 10, 12),
        ex('ohp', 3, 8, 10),
        ex('row', 3, 8, 10),
        ex('lateral', 3, 12, 15),
        ex('curl', 2, 10, 12),
      ],
    },
    {
      id: 'lower-b',
      name: 'Lower Day B',
      short: 'Lower B',
      exercises: [
        ex('deadlift', 3, 4, 6, 'Centură la seriile grele.'),
        ex('legpress', 3, 10, 12),
        ex('legcurl', 3, 10, 12),
        ex('calf', 3, 12, 15),
        ex('crunch', 3, 12, 15),
      ],
    },
  ]
  return Object.fromEntries(list.map((r) => [r.id, r]))
}

export const PRESET_LABELS: Record<SplitPreset, string> = {
  ppl: 'Push / Pull / Legs',
  ul: 'Upper / Lower',
  'ppl-ul': 'PPL + Upper/Lower',
  custom: 'Custom',
}

export const PRESET_DAYS: Record<Exclude<SplitPreset, 'custom'>, (string | null)[]> = {
  ppl: ['push-a', 'pull-a', 'legs-a', null, 'push-a', 'pull-a', 'legs-a'],
  ul: ['upper-b', 'lower-b', null, 'upper-b', 'lower-b', null, null],
  'ppl-ul': ['push-a', 'pull-a', 'legs-a', null, 'upper-b', 'lower-b', null],
}

export function daysFromTemplate(template: (string | null)[]): PlanDay[] {
  return template.map((routineId, i) => ({
    id: `day-${i}-${Math.random().toString(36).slice(2, 6)}`,
    routineId,
    lastRoutineId: routineId ?? 'push-a',
  }))
}

export const WEEKDAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică']

const LIFTS: Lift[] = [
  { id: 'bench', name: 'Împins la piept', current: 0, target: 100 },
  { id: 'squat', name: 'Genuflexiuni', current: 0, target: 140 },
  { id: 'deadlift', name: 'Îndreptări', current: 0, target: 180 },
]

export function createInitialState(): Omit<FitnessState, 'session'> {
  const routines = createRoutines()
  return {
    profile: {
      age: 20,
      height: 175,
      sex: 'M',
      experience: 'intermediar',
      objective: 'recomp',
      targetWeight: 75,
      pace: 0.5,
      workoutsPerWeek: 5,
    },
    weights: [],
    plan: { preset: 'ppl-ul', cycleType: 'fixed', days: daysFromTemplate(PRESET_DAYS['ppl-ul']) },
    routines,
    history: {},
    activity: [],
    queueIndex: 0,
    lifts: LIFTS,
    lastFinished: null,
  }
}