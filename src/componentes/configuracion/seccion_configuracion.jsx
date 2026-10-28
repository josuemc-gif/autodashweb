import { Check, Compass, Contrast, Moon, ShieldCheck, Settings2 } from 'lucide-react'
import './configuracion.css'

export function SeccionConfiguracion({
  device,
  setDevice,
  darkMode,
  setDarkMode,
  highContrast,
  setHighContrast,
  largeText,
  setLargeText,
  voiceEnabled,
  alternarVoz,
}) {
  return (
    <section className="module-page settings-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> PERSONALIZA TU ESPACIO</div>
          <h1>Configuración<span>.</span></h1>
          <p>Adapta la interfaz y los controles a tu dispositivo.</p>
        </div>
        <span className="board-count"><Settings2 size={15} /> Preferencias</span>
      </div>

      <article className="panel settings-section">
        <div className="section-title">
          <div><span className="section-kicker">PANTALLA</span><h2>Tipo de dispositivo</h2></div>
          <span className="title-icon"><Compass size={18} /></span>
        </div>
        <p className="settings-description">El diseño se ajusta automáticamente al espacio disponible.</p>
        <div className="device-options">
          {[
            { id: 'tablet', name: 'Tableta', detail: 'Vista amplia para el vehículo', icon: '▭' },
            { id: 'phone', name: 'Teléfono', detail: 'Controles compactos', icon: '▯' },
            { id: 'computer', name: 'Computadora', detail: 'Panel completo de escritorio', icon: '▱' },
          ].map((option) => (
            <button key={option.id} className={`device-option${device === option.id ? ' chosen' : ''}`} onClick={() => setDevice(option.id)}>
              <span className="device-illustration">{option.icon}</span>
              <span><strong>{option.name}</strong><small>{option.detail}</small></span>
              <span className="radio-indicator">{device === option.id && <Check size={12} />}</span>
            </button>
          ))}
        </div>
      </article>

      <article className="panel settings-section accessibility-section">
        <div className="section-title">
          <div><span className="section-kicker">ACCESIBILIDAD Y APARIENCIA</span><h2>Accesibilidad</h2></div>
          <span className="title-icon"><ShieldCheck size={18} /></span>
        </div>

        <div className="setting-row">
          <span className="setting-icon"><Moon size={17} /></span>
          <span className="setting-copy"><strong>Modo oscuro</strong><small>Usa una paleta oscura en todo el panel.</small></span>
          <button role="switch" aria-checked={darkMode} className={`toggle${darkMode ? ' on' : ''}`} onClick={() => setDarkMode(!darkMode)} aria-label="Activar modo oscuro"><i /></button>
        </div>

        <div className="setting-row">
          <span className="setting-icon"><Contrast size={17} /></span>
          <span className="setting-copy"><strong>Alto contraste</strong><small>Refuerza la diferencia entre texto y fondo.</small></span>
          <button role="switch" aria-checked={highContrast} className={`toggle${highContrast ? ' on' : ''}`} onClick={() => setHighContrast(!highContrast)} aria-label="Activar alto contraste"><i /></button>
        </div>

        <div className="setting-row">
          <span className="setting-icon"><span className="text-badge">A</span></span>
          <span className="setting-copy"><strong>Texto grande</strong><small>Aumenta la legibilidad en pantallas pequeñas.</small></span>
          <button role="switch" aria-checked={largeText} className={`toggle${largeText ? ' on' : ''}`} onClick={() => setLargeText(!largeText)} aria-label="Activar texto grande"><i /></button>
        </div>

        <div className="setting-row">
          <span className="setting-icon"><span className="voice-badge">🔊</span></span>
          <span className="setting-copy"><strong>Voz asistida</strong><small>Emite avisos por voz al iniciar o completar un trayecto.</small></span>
          <button role="switch" aria-checked={voiceEnabled} className={`toggle${voiceEnabled ? ' on' : ''}`} onClick={alternarVoz} aria-label="Activar voz asistida"><i /></button>
        </div>
      </article>
    </section>
  )
}
