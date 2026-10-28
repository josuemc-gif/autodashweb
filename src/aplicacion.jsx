import { useCallback, useEffect, useState } from 'react'
import { Activity, Gauge, Headphones, MapPinned, ShieldCheck, Wrench } from 'lucide-react'
import './estilos/globales.css'
import { BarraLateral } from './componentes/estructura/barra_lateral'
import { BarraSuperior } from './componentes/estructura/barra_superior'
import { SeccionPanel } from './componentes/panel/seccion_panel'
import { SeccionNavegacion } from './componentes/navegacion/seccion_navegacion'
import { SeccionTrayectos } from './componentes/trayectos/seccion_trayectos'
import { SeccionMantenimiento } from './componentes/mantenimiento/seccion_mantenimiento'
import { SeccionMultimedia } from './componentes/multimedia/seccion_multimedia'
import { SeccionConfiguracion } from './componentes/configuracion/seccion_configuracion'
import { useSeguimientoTrayecto } from './servicios/seguimiento_trayecto'
import { consultarClima } from './servicios/clima'
import { useBateriaTelefono } from './servicios/bateria_telefono'
import { useBuscadorDestinos } from './servicios/buscador_destinos'
import { usePreferencias } from './servicios/preferencias'
import { useTareasMantenimiento } from './servicios/tareas_mantenimiento'
import { saludoPorHora } from './utilidades/formateadores'
import './estilos/tema.css'
import './estilos/adaptable.css'

const navigation = [
  { id: 'dashboard', label: 'Panel', icon: Gauge },
  { id: 'map', label: 'Navegación', icon: MapPinned },
  { id: 'history', label: 'Trayectos', icon: Activity },
  { id: 'maintenance', label: 'Mantenimiento', icon: Wrench },
  { id: 'media', label: 'Multimedia', icon: Headphones },
]

function Aplicacion() {
  const [view, setView] = useState('dashboard')
  const { bateria: phoneBattery, disponibilidad: batteryAvailability } = useBateriaTelefono()
  const [weather, setWeather] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [track, setTrack] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [clock, setClock] = useState(() => new Date())
  const {
    dispositivo: device,
    setDispositivo: setDevice,
    altoContraste: highContrast,
    setAltoContraste: setHighContrast,
    modoOscuro: darkMode,
    setModoOscuro: setDarkMode,
    textoGrande: largeText,
    setTextoGrande: setLargeText,
    vozActivada: voiceEnabled,
    alternarVoz: toggleVoice,
  } = usePreferencias()
  const { tareas: tasks, cambiarEstadoTarea: moveTask } = useTareasMantenimiento()
  const busqueda = useBuscadorDestinos(view)
  const speak = useCallback((message) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const announcement = new SpeechSynthesisUtterance(message)
    announcement.lang = 'es-ES'
    window.speechSynthesis.speak(announcement)
  }, [voiceEnabled])
  const {
    posicion: position,
    estadoGps: gpsStatus,
    velocidad: speed,
    distancia: distance,
    trayectos: trips,
    trayectoIniciado: tripStarted,
    iniciarGps: startGps,
    alternarTrayecto: toggleTrip,
  } = useSeguimientoTrayecto({ anunciar: speak, alCambiarPosicion: busqueda.actualizarPosicion })
  const weatherLatitude = position ? Number(position.lat.toFixed(2)) : null
  const weatherLongitude = position ? Number(position.lng.toFixed(2)) : null

  useEffect(() => {
    let timeout
    const updateClock = () => {
      setClock(new Date())
      timeout = window.setTimeout(updateClock, 60000 - Date.now() % 60000 + 20)
    }
    timeout = window.setTimeout(updateClock, 60000 - Date.now() % 60000 + 20)
    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (weatherLatitude === null || weatherLongitude === null) return
    consultarClima(weatherLatitude, weatherLongitude)
      .then(setWeather)
      .catch(() => setWeather(null))
  }, [weatherLatitude, weatherLongitude])

  const announceRoute = useCallback((summary) => {
    speak(`Ruta calculada a ${summary.name}. ${summary.distance} kilómetros, aproximadamente ${summary.duration} minutos`)
  }, [speak])

  const statusText = { idle: 'GPS desconectado', searching: 'Buscando señal GPS…', active: 'GPS conectado', denied: 'Permiso de ubicación denegado', error: 'No se pudo obtener la ubicación', unsupported: 'GPS no compatible con este navegador', insecure: 'GPS requiere HTTPS' }[gpsStatus]
  const weatherStatus = weather ? 'Actualizado con tu ubicación' : 'Activa el GPS para consultar el clima local'

  return (
    <div className={`app-shell device-${device}${highContrast ? ' high-contrast' : ''}${darkMode ? ' dark-mode' : ''}${largeText ? ' large-text' : ''}`}>
      <BarraLateral navigation={navigation} view={view} setView={setView} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {menuOpen && <button className="mobile-scrim" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}

      <main id="panel" className="main-area">
        <BarraSuperior viewLabel={navigation.find((item) => item.id === view)?.label || 'Configuración'} gpsStatus={gpsStatus} statusText={statusText} setMenuOpen={setMenuOpen} />

        <div className="page-content">
          {gpsStatus === 'insecure' && (
            <div className="gps-security-notice" role="alert">
              <ShieldCheck size={17} />
              <span>Chrome bloquea la ubicación en esta dirección HTTP. Publica el sitio en Netlify y ábrelo con su dirección HTTPS; después, permite la ubicación en el navegador.</span>
            </div>
          )}

          {view === 'dashboard' && (
            <SeccionPanel
              greeting={saludoPorHora(clock)}
              tripStarted={tripStarted}
              speed={speed}
              gpsStatus={gpsStatus}
              phoneBattery={phoneBattery}
              batteryAvailability={batteryAvailability}
              distance={distance}
              trips={trips}
              weather={weather}
              weatherStatus={weatherStatus}
              position={position}
              alternarTrayecto={toggleTrip}
              startGps={startGps}
              setView={setView}
            />
          )}

          {view === 'map' && (
            <SeccionNavegacion
              position={position}
              gpsStatus={gpsStatus}
              destinationInput={busqueda.entrada}
              setDestinationInput={busqueda.cambiarEntrada}
              destinationSuggestions={busqueda.sugerencias}
              suggestionsLoading={busqueda.buscando}
              suggestionsOpen={busqueda.sugerenciasAbiertas}
              setSuggestionsOpen={busqueda.setSugerenciasAbiertas}
              activeSuggestion={busqueda.sugerenciaActiva}
              chooseDestination={busqueda.seleccionarDestino}
              handleDestinationKeyDown={busqueda.manejarTeclasDestino}
              startGps={startGps}
              destination={busqueda.destino}
              onRouteReady={announceRoute}
            />
          )}

          {view === 'history' && <SeccionTrayectos trips={trips} tripStarted={tripStarted} toggleTrip={toggleTrip} startGps={startGps} setView={setView} />}
          {view === 'maintenance' && <SeccionMantenimiento tasks={tasks} moveTask={moveTask} />}
          {view === 'media' && <SeccionMultimedia track={track} setTrack={setTrack} playing={playing} setPlaying={setPlaying} />}
          {view === 'settings' && (
            <SeccionConfiguracion
              device={device}
              setDevice={setDevice}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              highContrast={highContrast}
              setHighContrast={setHighContrast}
              largeText={largeText}
              setLargeText={setLargeText}
              voiceEnabled={voiceEnabled}
              alternarVoz={toggleVoice}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default Aplicacion
