import {
  BatteryCharging,
  ChevronRight,
  CloudDrizzle,
  CloudSun,
  Gauge,
  MapPin,
  Route,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react'
import { BotonTrayecto } from './boton_trayecto/boton_trayecto'
import './panel.css'

export function SeccionPanel({
  greeting,
  tripStarted,
  speed,
  gpsStatus,
  phoneBattery,
  batteryAvailability,
  distance,
  trips,
  weather,
  weatherStatus,
  position,
  alternarTrayecto,
  startGps,
  setView,
}) {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> TU VIAJE, DE UN VISTAZO</div>
          <h1>{greeting}, conductor<span>.</span></h1>
          <p>Esto es lo que pasa con tu carrito ahora.</p>
        </div>

        <BotonTrayecto iniciado={tripStarted} alAlternar={alternarTrayecto} resaltarFinalizacion />
      </section>

      <section className="metric-grid" aria-label="Datos actuales del vehículo">
        <article className="metric-card speed-card">
          <div className="metric-top"><span className="metric-label">VELOCIDAD ACTUAL</span><span className="metric-icon"><Gauge size={18} /></span></div>
          <div className="speed-display"><strong>{Math.round(speed)}</strong><span>km/h</span></div>
          <div className="speed-meter"><span style={{ width: `${Math.min(speed / 1.2, 100)}%` }} /></div>
          <div className="metric-foot">
            <span><i className={`signal-dot${gpsStatus === 'active' ? '' : ' inactive'}`} /> {gpsStatus === 'active' ? 'GPS en tiempo real' : 'GPS sin conexión'}</span>
            <span>máx. 120 km/h</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top"><span className="metric-label">BATERÍA DEL TELÉFONO</span><span className="metric-icon battery-color"><BatteryCharging size={18} /></span></div>
          <div className="battery-row">
            <strong>{phoneBattery ? Math.round(phoneBattery.level * 100) : '--'}<small>%</small></strong>
            <span className="source-tag">{batteryAvailability === 'available' ? 'TELÉFONO' : batteryAvailability === 'unsupported' ? 'NO DISPONIBLE' : 'LEYENDO…'}</span>
          </div>
          <div className="battery-track"><span style={{ width: `${phoneBattery ? Math.round(phoneBattery.level * 100) : 0}%` }} /></div>
          <div className="metric-foot">
            <span>Estado de carga</span>
            <strong>{phoneBattery ? (phoneBattery.charging ? 'Cargando' : 'En uso') : '--'}</strong>
          </div>
          <div className="metric-note">
            {batteryAvailability === 'unsupported' ? 'Este navegador no comparte el nivel de batería' : batteryAvailability === 'unavailable' ? 'No se pudo leer la batería del teléfono' : 'Actualización en tiempo real'}
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top"><span className="metric-label">DISTANCIA DEL TRAYECTO</span><span className="metric-icon distance-color"><Route size={18} /></span></div>
          <div className="distance-display"><strong>{distance.toFixed(2)}</strong><span>km</span></div>
          <div className="metric-foot">
            <span>{tripStarted ? 'Trayecto en curso' : 'Inicia un trayecto para registrar'}</span>
            <span className="muted-number">{trips.length} guardados</span>
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel weather-panel">
          <div className="section-title">
            <div><span className="section-kicker">CONDICIONES LOCALES</span><h2>Clima en ruta</h2></div>
            <span className="title-icon weather-title-icon"><CloudSun size={19} /></span>
          </div>
          <div className="weather-status">{weatherStatus}</div>
          <div className="weather-main">
            <div className="weather-symbol"><Sun size={32} strokeWidth={1.5} /></div>
            <div className="temperature">{weather ? `${Math.round(weather.temperature_2m)}°` : '--°'}<span>{weather ? 'Actual' : 'Sin ubicación'}</span></div>
          </div>
          <div className="weather-details">
            <div><Thermometer size={15} /><span>Humedad</span><strong>{weather ? `${weather.relative_humidity_2m}%` : '--'}</strong></div>
            <div><Wind size={15} /><span>Viento</span><strong>{weather ? `${Math.round(weather.wind_speed_10m)} km/h` : '--'}</strong></div>
            <div><CloudDrizzle size={15} /><span>Prob. lluvia</span><strong>{weather?.precipitation_probability != null ? `${weather.precipitation_probability}%` : '--'}</strong></div>
          </div>
          <button className="text-action" onClick={startGps}><MapPin size={14} /> {position ? `${position.lat.toFixed(3)}, ${position.lng.toFixed(3)}` : 'Permitir ubicación'} <ChevronRight size={14} /></button>
        </article>

        <article className="panel map-preview">
          <div className="section-title">
            <div><span className="section-kicker">UBICACIÓN DEL CARRITO</span><h2>Tu posición</h2></div>
            <button className="subtle-button" onClick={() => setView('map')}>Abrir mapa <ChevronRight size={15} /></button>
          </div>
          <div className="map-preview-art">
            <div className="map-grid-lines" />
            <div className="map-route route-one" />
            <div className="map-route route-two" />
            <span className="map-road-label road-a">AV. PRINCIPAL</span>
            <span className="map-road-label road-b">CALLE 8</span>
            <span className="map-pin-center"><MapPin size={19} fill="currentColor" /></span>
            <span className="map-coordinates">{position ? `${position.lat.toFixed(4)}°, ${position.lng.toFixed(4)}°` : 'Esperando señal GPS'}</span>
          </div>
          <div className="map-foot">
            <span><i className={gpsStatus === 'active' ? 'signal-dot' : 'signal-dot inactive'} /> {gpsStatus === 'active' ? 'Posición actualizada' : 'Ubicación sin conectar'}</span>
            <button className="text-action" onClick={() => setView('map')}>Navegar <ChevronRight size={14} /></button>
          </div>
        </article>
      </section>

      <section className="panel recent-panel">
        <div className="section-title">
          <div><span className="section-kicker">ACTIVIDAD</span><h2>Últimos trayectos</h2></div>
          <button className="subtle-button" onClick={() => setView('history')}>Ver historial <ChevronRight size={15} /></button>
        </div>
        {trips.length ? (
          <div className="trip-list">
            {trips.slice(0, 3).map((trip) => (
              <div className="trip-row" key={trip.id}>
                <span className="trip-row-icon"><Route size={16} /></span>
                <strong>{trip.date}</strong>
                <span>{trip.distance} km</span>
                <span className="trip-consumption">{trip.consumption}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-inline">
            <span className="empty-icon"><Route size={17} /></span>
            <span>Aún no hay trayectos registrados. Inicia uno para empezar tu historial.</span>
          </div>
        )}
      </section>
    </>
  )
}
