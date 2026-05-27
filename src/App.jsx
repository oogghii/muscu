import { useState } from 'react'
import { useStore } from './context/StoreContext'
import Dashboard from './pages/Dashboard'
import ActiveSession from './pages/ActiveSession'
import History from './pages/History'
import Stats from './pages/Stats'
import BottomNav from './components/BottomNav'
import Sidebar from './components/Sidebar'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const { activeSession } = useStore()

  return (
    <div className="app-layout">
      <Sidebar current={page} navigate={setPage} hasActive={!!activeSession} />

      <main key={page} className="app-main fade-up">
        {page === 'dashboard' && <Dashboard navigate={setPage} />}
        {page === 'session'   && <ActiveSession navigate={setPage} />}
        {page === 'history'   && <History navigate={setPage} />}
        {page === 'stats'     && <Stats navigate={setPage} />}
      </main>

      <BottomNav current={page} navigate={setPage} hasActive={!!activeSession} />
    </div>
  )
}
