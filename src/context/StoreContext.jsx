import { createContext, useContext, useState, useCallback } from 'react'

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
  const [settings, setSettings] = useLocalStorage('gs_settings', { weeklyGoal: 4 })

  const startSession = useCallback(() => {
    setActiveSession({
      id: Date.now().toString(36),
      startTime: new Date().toISOString(),
      emoji: null,
      humeur: [],
      corps: [],
      energie: null,
      sommeil: null,
      perf: null,
      note: '',
    })
  }, [setActiveSession])

  const updateActiveSession = useCallback((updates) => {
    setActiveSession(prev => prev ? { ...prev, ...updates } : prev)
  }, [setActiveSession])

  const endSession = useCallback((endTime) => {
    if (!activeSession) return null
    const completed = { ...activeSession, endTime: endTime || new Date().toISOString() }
    setSessions(prev => [...prev, completed])
    setActiveSession(null)
    return completed
  }, [activeSession, setSessions, setActiveSession])

  const updateSession = useCallback((id, updates) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [setSessions])

  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [setSettings])

  const deleteSession = useCallback((id) => {
    setSessions(prev => prev.filter(s => s.id !== id))
  }, [setSessions])

  return (
    <StoreCtx.Provider value={{
      sessions, activeSession, settings,
      startSession, endSession, updateActiveSession,
      updateSession, updateSettings, deleteSession,
    }}>
      {children}
    </StoreCtx.Provider>
  )
}

export const useStore = () => {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
