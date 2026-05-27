export default function BottomNav({ current, navigate, hasActive }) {
  const items = [
    { id: 'dashboard', icon: '🏠', label: 'Accueil' },
    { id: 'session',   icon: '💪', label: 'Séance'  },
    { id: 'history',   icon: '📅', label: 'Historique' },
    { id: 'stats',     icon: '📊', label: 'Stats'   },
  ]

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.id}
          className={`bottom-nav__item${current === item.id ? ' active' : ''}`}
          onClick={() => navigate(item.id)}
        >
          {item.id === 'session' && hasActive && <span className="nav-dot" />}
          <span className="bottom-nav__icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
