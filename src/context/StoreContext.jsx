import { createContext, useContext, useState, useCallback } from 'react'

const DEFAULT_EXERCISES = [
  'Développé couché', 'Squat', 'Soulevé de terre', 'Tractions',
  'Dips', 'Curl biceps', 'Rowing barre', 'OHP', 'Leg press', 'Pec deck',
]

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : init
    } catch {
      return init
    }
  })

  const setter = useCallback((updater) => {
    setVal(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* quota exceeded */ }
      return next
    })
  }, [key])

  return [val, setter]
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [sessions, setSessions] = useLocalStorage('gs_sessions', [])
  const [activeSession, setActiveSession] = useLocalStorage('gs_active', null)
  const [settings, setSettings] = useLocalStorage('gs_settings', { bodyWeight: 75, weeklyGoal: 4 })

  const startSession = useCallback(() => {
    setActiveSession({
      id: Date.now().toString(36),
      startTime: new Date().toISOString(),
      exercises: [],
    })
  }, [setActiveSession])

  const endSession = useCallback((endTime) => {
    if (!activeSession) return null
    const completed = { ...activeSession, endTime: endTime || new Date().toISOString() }
    setSessions(prev => [...prev, completed])
    setActiveSession(null)
    return completed
  }, [activeSession, setSessions, setActiveSession])

  const addExercise = useCallback((name) => {
    setActiveSession(prev => {
      if (!prev || prev.exercises.find(e => e.name === name)) return prev
      return { ...prev, exercises: [...prev.exercises, { name, sets: [] }] }
    })
  }, [setActiveSession])

  const logSet = useCallback((exerciseName, set) => {
    setActiveSession(prev => {
      if (!prev) return prev
      return {
        ...prev,
        exercises: prev.exercises.map(e =>
          e.name === exerciseName ? { ...e, sets: [...e.sets, set] } : e
        ),
      }
    })
  }, [setActiveSession])

  const removeSet = useCallback((exerciseName, idx) => {
    setActiveSession(prev => {
      if (!prev) return prev
      return {
        ...prev,
        exercises: prev.exercises.map(e =>
          e.name === exerciseName
            ? { ...e, sets: e.sets.filter((_, i) => i !== idx) }
            : e
        ),
      }
    })
  }, [setActiveSession])

  const removeExercise = useCallback((name) => {
    setActiveSession(prev => {
      if (!prev) return prev
      return { ...prev, exercises: prev.exercises.filter(e => e.name !== name) }
    })
  }, [setActiveSession])

  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [setSettings])

  const deleteSession = useCallback((id) => {
    setSessions(prev => prev.filter(s => s.id !== id))
  }, [setSessions])

  return (
    <StoreCtx.Provider value={{
      sessions, activeSession, settings, DEFAULT_EXERCISES,
      startSession, endSession,
      addExercise, logSet, removeSet, removeExercise,
      updateSettings, deleteSession,
    }}>
      {children}
    </StoreCtx.Provider>
  )
}

export const useStore = () => useContext(StoreCtx)
