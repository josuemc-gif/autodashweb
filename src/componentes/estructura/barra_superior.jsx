import { Bell, ChevronRight, Menu } from 'lucide-react'

export function BarraSuperior({ viewLabel, gpsStatus, statusText, setMenuOpen }) {
  return (
    <header className="topbar">
      <button className="icon-button menu-toggle" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}>
        <Menu size={20} />
      </button>

      <div className="breadcrumbs">
        Mi vehículo
        <ChevronRight size={14} />
        <strong>{viewLabel}</strong>
      </div>

      <div className="topbar-actions">
        <span className={`connection-pill${gpsStatus === 'active' ? ' connected' : ''}`}>
          <i />
          {statusText}
        </span>
        <button className="icon-button notification-button" aria-label="Notificaciones">
          <Bell size={18} />
          <i />
        </button>
        <span className="today-date">
          {new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}
        </span>
      </div>
    </header>
  )
}
