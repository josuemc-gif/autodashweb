import { Bluetooth, ChevronDown, ChevronRight, Gauge, Settings2 } from 'lucide-react'
import './estructura.css'

export function BarraLateral({ navigation, view, setView, menuOpen, setMenuOpen }) {
  return (
    <aside className={`sidebar${menuOpen ? ' sidebar-open' : ''}`}>
      <a className="brand" href="#panel" onClick={() => setView('dashboard')} aria-label="AutoDash, ir al panel">
        <span className="brand-mark"><Gauge size={21} strokeWidth={2.2} /></span>
        <span>auto<span>dash</span><small>VEHICLE COMPANION</small></span>
      </a>

      <div className="side-label">ESPACIO DEL CONDUCTOR</div>
      <nav aria-label="Navegación principal">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`nav-link${view === id ? ' active' : ''}`}
            onClick={() => {
              setView(id)
              setMenuOpen(false)
            }}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {id === 'dashboard' && <span className="live-dot" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="vehicle-connect">
          <div className="connect-icon"><Bluetooth size={17} /></div>
          <div>
            <strong>Carrito</strong>
            <span><i /> Sin conectar</span>
          </div>
          <ChevronRight size={16} />
        </div>

        <button className="nav-link settings-link" onClick={() => { setView('settings'); setMenuOpen(false) }}>
          <Settings2 size={18} />
          <span>Configuración</span>
        </button>

        <div className="profile">
          <div className="avatar">CD</div>
          <div>
            <strong>Conductor</strong>
            <span>Perfil personal</span>
          </div>
          <ChevronDown size={15} />
        </div>
      </div>
    </aside>
  )
}
