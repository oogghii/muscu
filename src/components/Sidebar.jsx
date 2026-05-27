export default function Sidebar({ current, navigate, hasActive }) {
  const items = [
    { id: 'dashboard', icon: '🏠', label: 'Accueil'     },
    { id: 'session',   icon: '💪', label: 'Séance'      },
    { id: 'history',   icon: '📅', label: 'Historique'  },
    { id: 'stats',     icon: '📊', label: 'Stats'       },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__logo-gym">GYM</span>
        <span className="sidebar__logo-streak">STREAK</span>
      </div>

      <div className="sidebar__user">
        <div className="sidebar__avatar">R</div>
        <div>
          <div className="sidebar__name">Raphaël</div>
          <div className="sidebar__tagline">En route 💪</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {items.map(item => (
          <button
            key={item.id}
            className={`sidebar__item${current === item.id ? ' active' : ''}`}
            onClick={() => navigate(item.id)}
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span className="sidebar__label">{item.label}</span>
            {item.id === 'session' && hasActive && <span className="sidebar__dot" />}
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">GymStreak v0.1</div>
    </aside>
  )
}
