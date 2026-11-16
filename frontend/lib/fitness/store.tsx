'use client'

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { previousSets, queuedRoutineId, setsVolume, startOfDay, toISODate, workoutSequence } from './calc'
import { createInitialState, daysFromTemplate, EXERCISES, PRESET_DAYS, uid } from './mock-data'
import type {
  CycleType,
  FitnessState,
  LiveSet,
  Profile,
  RoutineExercise,
  Session,
  SetEntry,
  SplitPreset,
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Action =
  | { type: 'hydrate'; payload: Partial<FitnessState> }
  | { type: 'logWeight'; kg: number }
  | { type: 'updateWeight'; id: string; kg: number }
  | { type: 'deleteWeight'; id: string }
  | { type: 'setProfile'; patch: Partial<Profile> }
  | { type: 'setLiftTarget'; id: string; target: number }
  | { type: 'setPreset'; preset: SplitPreset }
  | { type: 'setCycleType'; cycleType: CycleType }
  | { type: 'setCycleLength'; length: number }
  | { type: 'setDayRoutine'; index: number; routineId: string }
  | { type: 'toggleRest'; index: number }
  | { type: 'updateExercise'; routineId: string; uid: string; patch: Partial<RoutineExercise> }
  | { type: 'moveExercise'; routineId: string; uid: string; dir: -1 | 1 }
  | { type: 'removeExercise'; routineId: string; uid: string }
  | { type: 'addExercise'; routineId: string; exerciseId: string }
  | { type: 'startSession' }
  | { type: 'switchRoutine'; routineId: string }
  | { type: 'updateSet'; uid: string; index: number; patch: Partial<LiveSet> }
  | { type: 'toggleSet'; uid: string; index: number }
  | { type: 'addSet'; uid: string }
  | { type: 'finishSession' }
  | { type: 'dismissSummary' }

function buildSession(state: Omit<FitnessState, 'session'>, routineId: string | null): Session {
  const id = routineId ?? Object.keys(state.routines)[0]
  const routine = state.routines[id]
  const exercises = routine.exercises.map((e) => ({ ...e }))
  const logs: Record<string, LiveSet[]> = {}
  for (const e of exercises) {
    const prev = previousSets(state.history, id, e.exerciseId)
    logs[e.uid] = Array.from({ length: e.sets }, (_, i) => {
      const ref = prev?.[i] ?? prev?.[prev.length - 1]
      return { kg: ref ? String(ref.kg) : '', reps: '', done: false }
    })
  }
  return { routineId: id, startedAt: null, exercises, logs }
}

const sessionIsIdle = (s: Session) => s.startedAt === null && !Object.values(s.logs).some((l) => l.some((x) => x.done))

function withIdleResync(state: FitnessState): FitnessState {
  const seq = workoutSequence(state)
  const queueIndex = seq.length ? state.queueIndex % seq.length : 0
  const next = { ...state, queueIndex }
  if (!sessionIsIdle(state.session)) return next
  const stillValid = state.routines[state.session.routineId]
  const targetId = queuedRoutineId(next) ?? (stillValid ? state.session.routineId : null)
  return { ...next, session: buildSession(next, targetId) }
}

function mapRoutine(state: FitnessState, routineId: string, fn: (list: RoutineExercise[]) => RoutineExercise[]) {
  const r = state.routines[routineId]
  return withIdleResync({ ...state, routines: { ...state.routines, [routineId]: { ...r, exercises: fn(r.exercises) } } })
}

function reducer(state: FitnessState, action: Action): FitnessState {
  const today = toISODate(startOfDay(new Date()))
  switch (action.type) {
    case 'hydrate': {
      const merged: FitnessState = {
        ...state,
        ...action.payload,
        profile: { ...state.profile, ...(action.payload.profile ?? {}) },
      }
      return { ...merged, session: buildSession(merged, queuedRoutineId(merged)) }
    }
    case 'logWeight': {
      const existing = state.weights.find((w) => w.date === today)
      const weights = existing
        ? state.weights.map((w) => (w.date === today ? { ...w, kg: action.kg } : w))
        : [...state.weights, { id: uid('w'), date: today, kg: action.kg }]
      return { ...state, weights }
    }
    case 'updateWeight':
      return { ...state, weights: state.weights.map((w) => (w.id === action.id ? { ...w, kg: action.kg } : w)) }
    case 'deleteWeight':
      if (state.weights.length <= 1) return state
      return { ...state, weights: state.weights.filter((w) => w.id !== action.id) }
    case 'setProfile':
      return { ...state, profile: { ...state.profile, ...action.patch } }
    case 'setLiftTarget':
      return { ...state, lifts: state.lifts.map((l) => (l.id === action.id ? { ...l, target: action.target } : l)) }
    case 'setPreset': {
      if (action.preset === 'custom') return { ...state, plan: { ...state.plan, preset: 'custom' } }
      const days = daysFromTemplate(PRESET_DAYS[action.preset])
      return withIdleResync({ ...state, queueIndex: 0, plan: { preset: action.preset, cycleType: 'fixed', days } })
    }
    case 'setCycleType': {
      let days = state.plan.days
      if (action.cycleType === 'fixed' && days.length !== 7) {
        days = days.length > 7 ? days.slice(0, 7) : [...days, ...daysFromTemplate(Array(7 - days.length).fill(null))]
      }
      return withIdleResync({ ...state, plan: { ...state.plan, cycleType: action.cycleType, days } })
    }
    case 'setCycleLength': {
      const n = Math.min(10, Math.max(2, action.length))
      const cur = state.plan.days
      const days = n <= cur.length ? cur.slice(0, n) : [...cur, ...daysFromTemplate(Array(n - cur.length).fill(null))]
      return withIdleResync({ ...state, plan: { ...state.plan, days, preset: 'custom' } })
    }
    case 'setDayRoutine': {
      const days = state.plan.days.map((d, i) =>
        i === action.index ? { ...d, routineId: action.routineId, lastRoutineId: action.routineId } : d,
      )
      return withIdleResync({ ...state, plan: { ...state.plan, days, preset: 'custom' } })
    }
    case 'toggleRest': {
      const days = state.plan.days.map((d, i) =>
        i === action.index ? { ...d, routineId: d.routineId ? null : d.lastRoutineId } : d,
      )
      return withIdleResync({ ...state, plan: { ...state.plan, days, preset: 'custom' } })
    }
    case 'updateExercise':
      return mapRoutine(state, action.routineId, (list) =>
        list.map((e) => (e.uid === action.uid ? { ...e, ...action.patch } : e)),
      )
    case 'moveExercise':
      return mapRoutine(state, action.routineId, (list) => {
        const i = list.findIndex((e) => e.uid === action.uid)
        const j = i + action.dir
        if (i < 0 || j < 0 || j >= list.length) return list
        const copy = [...list]
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
        return copy
      })
    case 'removeExercise':
      return mapRoutine(state, action.routineId, (list) => list.filter((e) => e.uid !== action.uid))
    case 'addExercise':
      return mapRoutine(state, action.routineId, (list) => [
        ...list,
        { uid: uid(action.exerciseId), exerciseId: action.exerciseId, sets: 3, repMin: 8, repMax: 10, notes: '' },
      ])
    case 'startSession':
      if (state.session.startedAt) return state
      return { ...state, session: { ...state.session, startedAt: Date.now() } }
    case 'switchRoutine':
      return { ...state, session: buildSession(state, action.routineId) }
    case 'updateSet': {
      const logs = { ...state.session.logs }
      logs[action.uid] = logs[action.uid].map((s, i) => (i === action.index ? { ...s, ...action.patch } : s))
      return { ...state, session: { ...state.session, logs } }
    }
    case 'toggleSet': {
      const ex = state.session.exercises.find((e) => e.uid === action.uid)
      if (!ex) return state
      const prev = previousSets(state.history, state.session.routineId, ex.exerciseId)
      const logs = { ...state.session.logs }
      logs[action.uid] = logs[action.uid].map((s, i) => {
        if (i !== action.index) return s
        if (s.done) return { ...s, done: false }
        const ref = prev?.[i] ?? prev?.[prev.length - 1]
        return {
          kg: s.kg || (ref ? String(ref.kg) : '0'),
          reps: s.reps || String(ref?.reps ?? ex.repMin),
          done: true,
        }
      })
      return {
        ...state,
        session: { ...state.session, logs, startedAt: state.session.startedAt ?? Date.now() },
      }
    }
    case 'addSet': {
      const logs = { ...state.session.logs }
      const list = logs[action.uid]
      const last = list[list.length - 1]
      logs[action.uid] = [...list, { kg: last?.kg ?? '', reps: '', done: false }]
      return { ...state, session: { ...state.session, logs } }
    }
    case 'finishSession': {
      const { session } = state
      const routine = state.routines[session.routineId]
      const prevRecord = state.history[session.routineId]
      const sets: Record<string, SetEntry[]> = {}
      let volume = 0
      let setsDone = 0
      for (const e of session.exercises) {
        const done = (session.logs[e.uid] ?? [])
          .filter((s) => s.done)
          .map((s) => ({ kg: Number(s.kg) || 0, reps: Number(s.reps) || 0 }))
        setsDone += done.length
        volume += setsVolume(done)
        sets[e.exerciseId] = done.length ? done : (prevRecord?.sets[e.exerciseId] ?? [])
      }
      const seq = workoutSequence(state)
      const activity = state.activity.includes(today) ? state.activity : [...state.activity, today]
      const base = {
        ...state,
        history: { ...state.history, [session.routineId]: { date: today, sets, volume } },
        activity,
        queueIndex: seq.length ? (state.queueIndex + 1) % seq.length : 0,
        lastFinished: {
          routineName: routine?.name ?? 'Antrenament',
          volume,
          setsDone,
          durationMin: session.startedAt ? Math.max(1, Math.round((Date.now() - session.startedAt) / 60000)) : 0,
        },
      }
      return { ...base, session: buildSession(base, queuedRoutineId(base)) }
    }
    case 'dismissSummary':
      return { ...state, lastFinished: null }
  }
}

function init(): FitnessState {
  const base = createInitialState()
  return { ...base, session: buildSession(base, queuedRoutineId(base)) }
}

type Ctx = { state: FitnessState; dispatch: React.Dispatch<Action> }
const FitnessContext = createContext<Ctx | null>(null)

export function FitnessProvider({ children, token }: { children: ReactNode; token: string }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const hydratedRef = useRef(false)
  const lastFinishedRef = useRef(state.lastFinished)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function loadFromBackend() {
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const [profileRes, workoutsRes] = await Promise.all([
          fetch(`${API_URL}/api/profile`, { headers }),
          fetch(`${API_URL}/api/workouts`, { headers }),
        ])

        if (profileRes.status === 401 || profileRes.status === 403) {
          localStorage.removeItem('fitness_token')
          localStorage.removeItem('fitness_user')
          window.location.reload()
          return
        }

        const profileData = profileRes.ok ? await profileRes.json() : null
        const workoutsData = workoutsRes.ok ? await workoutsRes.json() : []

        if (cancelled) return

        const payload: Partial<FitnessState> = {}

        if (profileData) {
          if (profileData.appState) {
            Object.assign(payload, profileData.appState)
          } else {
            payload.profile = {
              ...state.profile,
              targetWeight: profileData.targetWeight ?? state.profile.targetWeight,
            }
            if (Array.isArray(profileData.weightHistory) && profileData.weightHistory.length > 0) {
              payload.weights = profileData.weightHistory
            }
          }
        }

        if (Array.isArray(workoutsData) && workoutsData.length > 0) {
          const sorted = [...workoutsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          const activitySet = new Set<string>(payload.activity ?? [])
          const historyMap = { ...(payload.history ?? {}) }

          for (const w of sorted) {
            if (w.date) activitySet.add(w.date)
            if (w.routineId && !historyMap[w.routineId] && w.rawSets) {
              historyMap[w.routineId] = {
                date: w.date,
                sets: w.rawSets,
                volume: w.volume ?? 0,
              }
            }
          }

          payload.activity = Array.from(activitySet)
          payload.history = historyMap
        }

        dispatch({ type: 'hydrate', payload })
        hydratedRef.current = true
      } catch {
        hydratedRef.current = true
      }
    }

    loadFromBackend()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token || !hydratedRef.current) return

    const timeout = setTimeout(() => {
      const { session: _s, lastFinished: _lf, ...persistableState } = state
      fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetWeight: state.profile.targetWeight,
          weightHistory: state.weights,
          appState: persistableState,
        }),
      }).catch(() => {})
    }, 600)

    return () => clearTimeout(timeout)
  }, [
    token,
    state.profile,
    state.weights,
    state.plan,
    state.routines,
    state.history,
    state.activity,
    state.queueIndex,
    state.lifts,
  ])

  useEffect(() => {
    if (!token || !hydratedRef.current) return
    if (!state.lastFinished || state.lastFinished === lastFinishedRef.current) return
    lastFinishedRef.current = state.lastFinished

    const lastRoutineEntry = Object.entries(state.history).sort(
      (a, b) => new Date(b[1].date).getTime() - new Date(a[1].date).getTime(),
    )[0]

    if (!lastRoutineEntry) return
    const [routineId, record] = lastRoutineEntry
    const routine = state.routines[routineId]

    const exercises = Object.entries(record.sets).map(([exerciseId, setList]) => {
      const def = EXERCISES.find((e) => e.id === exerciseId)
      const bestSet = setList.reduce((best, cur) => (cur.kg > best.kg ? cur : best), setList[0] ?? { kg: 0, reps: 0 })
      const routineEx = routine?.exercises.find((e) => e.exerciseId === exerciseId)
      return {
        exerciseId,
        name: def?.name ?? exerciseId,
        weight: bestSet.kg,
        reps: bestSet.reps,
        targetReps: routineEx?.repMax ?? 10,
        sets: setList,
      }
    })

    fetch(`${API_URL}/api/workouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: routine?.name ?? state.lastFinished.routineName,
        routineId,
        date: record.date,
        volume: record.volume,
        rawSets: record.sets,
        exercises,
      }),
    }).catch(() => {})
  }, [token, state.lastFinished, state.history, state.routines])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>
}

export function useFitness() {
  const ctx = useContext(FitnessContext)
  if (!ctx) throw new Error('useFitness must be used inside FitnessProvider')
  return ctx
}