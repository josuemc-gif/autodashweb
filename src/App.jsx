import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity, BatteryCharging, Bell, Bluetooth, Check, ChevronDown,
  ChevronLeft, ChevronRight, CloudDrizzle, CloudSun, Compass, Contrast,
  Gauge, Headphones, LoaderCircle, MapPin, MapPinned, Menu, Mic2, Music2,
  Moon, Navigation, Pause, Play, Plus, Route, Settings2, ShieldCheck, Sun,
  Thermometer, Volume2, Wind, Wrench,
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

const navigation = [
  { id: 'dashboard', label: 'Panel', icon: Gauge },
  { id: 'map', label: 'Navegación', icon: MapPinned },
  { id: 'history', label: 'Trayectos', icon: Activity },
  { id: 'maintenance', label: 'Mantenimiento', icon: Wrench },
  { id: 'media', label: 'Multimedia', icon: Headphones },
]

const initialTasks = [
  { id: 1, title: 'Revisar presión de neumáticos', detail: 'Inspección · cada 30 días', status: 'Pendiente' },
  { id: 2, title: 'Comprobar luces delanteras', detail: 'Seguridad · cada 60 días', status: 'Pendiente' },
  { id: 3, title: 'Limpiar cadena y transmisión', detail: 'Mecánica · cada 500 km', status: 'En curso' },
  { id: 4, title: 'Ajustar freno trasero', detail: 'Seguridad · 18 sep 2026', status: 'Completado' },
]

const columns = ['Pendiente', 'En curso', 'Completado']

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`
}

function greetingFor(date) {
  if (date.getHours() < 12) return 'Buenos días'
  if (date.getHours() < 19 || (date.getHours() === 19 && date.getMinutes() === 0)) return 'Buenas tardes'
  return 'Buenas noches'
}

function distanceBetween(from, to) {
  const radians = (degrees) => degrees * Math.PI / 180
  const latitudeDelta = radians(to.lat - from.lat)
  const longitudeDelta = radians(to.lng - from.lng)
  const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(longitudeDelta / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function MapView({ position, destination, onRouteReady }) {
  const [mapNode, setMapNode] = useState(null)
  const mapStateRef = useRef(null)
  const [routeSummary, setRouteSummary] = useState(null)
  const [routeError, setRouteError] = useState('')
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    if (!mapNode) return
    const map = L.map(mapNode, { zoomControl: false }).setView([20, 0], 2)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 19,
    }).addTo(map)
    const vehicleIcon = L.divIcon({ className: 'vehicle-marker', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] })
    mapStateRef.current = { map, marker: null, route: null, vehicleIcon }
    requestAnimationFrame(() => map.invalidateSize())
    return () => map.remove()
  }, [mapNode])

  useEffect(() => {
    const mapState = mapStateRef.current
    if (!mapState || !position) return
    const point = [position.lat, position.lng]
    if (mapState.marker) mapState.marker.setLatLng(point)
    else mapState.marker = L.marker(point, { icon: mapState.vehicleIcon }).addTo(mapState.map)
    if (!mapState.route) mapState.map.setView(point, Math.max(mapState.map.getZoom(), 14))
  }, [position])

  useEffect(() => {
    const mapState = mapStateRef.current
    if (!mapState) return
    if (!destination?.origin || !Number.isFinite(destination.lat) || !Number.isFinite(destination.lon)) {
      if (mapState.route) mapState.map.removeLayer(mapState.route)
      mapState.route = null
      return
    }
    let cancelled = false
    const fetchRoute = async () => {
      setRouteError('')
      setRouteSummary(null)
      setRouteLoading(true)
      try {
        const routeResponse = await fetch(`https://router.project-osrm.org/route/v1/driving/${destination.origin.lng},${destination.origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`)
        if (!routeResponse.ok) throw new Error('No se pudo calcular la ruta.')
        const routeData = await routeResponse.json()
        if (!routeData.routes?.length) throw new Error('No hay una ruta disponible para ese destino.')
        if (cancelled) return
        if (mapState.route) mapState.map.removeLayer(mapState.route)
        const line = L.geoJSON(routeData.routes[0].geometry, { style: { color: '#4285f4', weight: 6, opacity: 0.95 } }).addTo(mapState.map)
        mapState.route = line
        mapState.map.fitBounds(line.getBounds(), { padding: [36, 36] })
        const duration = Math.max(1, Math.round(routeData.routes[0].duration / 60))
        const arrival = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(new Date(Date.now() + duration * 60000))
        const summary = { distance: (routeData.routes[0].distance / 1000).toFixed(1), duration, durationLabel: formatDuration(duration), arrival, name: destination.name }
        setRouteSummary(summary)
        onRouteReady(summary)
      } catch (error) {
        if (!cancelled) setRouteError(error.message)
      } finally {
        if (!cancelled) setRouteLoading(false)
      }
    }
    fetchRoute()
    return () => { cancelled = true }
  }, [destination, onRouteReady])

  return (
    <div className="map-frame">
      <div className="map-canvas" ref={setMapNode} />
      {!position && <div className="map-notice"><MapPin size={16} /> {gpsStatus === 'insecure' ? 'El GPS requiere una dirección HTTPS.' : 'Activa el GPS para centrar el mapa y calcular rutas.'}</div>}
      {routeLoading && destination?.origin && <div className="route-loading"><LoaderCircle size={15} className="spin" /> Calculando ruta y hora de llegada…</div>}
      {routeSummary && destination?.name === routeSummary.name && <div className="route-summary"><Route size={16} /><span className="route-arrival"><strong>{routeSummary.arrival}</strong><small>Hora estimada de llegada</small></span><span className="route-separator" /><span className="route-duration"><strong>{routeSummary.durationLabel}</strong><small>{routeSummary.distance} km</small></span><small className="route-destination-name">{routeSummary.name}</small></div>}
      {routeError && <div className="route-error">{routeError}</div>}
    </div>
  )
}

function App() {
  const [view, setView] = useState('dashboard')
  const [device, setDevice] = useState(() => localStorage.getItem('autodash-device') || 'tablet')
  const [position, setPosition] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('idle')
  const [speed, setSpeed] = useState(0)
  const [phoneBattery, setPhoneBattery] = useState(null)
  const [batteryAvailability, setBatteryAvailability] = useState(() => typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function' ? 'loading' : 'unsupported')
  const [savedTrip] = useState(() => {
    try { return JSON.parse(localStorage.getItem('autodash-active-trip')) } catch { return null }
  })
  const [distance, setDistance] = useState(() => Number(savedTrip?.distance) || 0)
  const [weather, setWeather] = useState(null)
  const [destinationInput, setDestinationInput] = useState('')
  const [destination, setDestination] = useState('')
  const [destinationSuggestions, setDestinationSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('autodash-tasks')) || initialTasks } catch { return initialTasks }
  })
  const [trips, setTrips] = useState(() => {
    try { return JSON.parse(localStorage.getItem('autodash-trips')) || [] } catch { return [] }
  })
  const [playing, setPlaying] = useState(false)
  const [track, setTrack] = useState(0)
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('autodash-contrast') === 'true')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('autodash-dark-mode') === 'true')
  const [largeText, setLargeText] = useState(() => localStorage.getItem('autodash-large-text') === 'true')
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('autodash-voice') === 'true')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [tripStarted, setTripStarted] = useState(() => Boolean(savedTrip?.startedAt))
  const [tripStartedAt, setTripStartedAt] = useState(() => savedTrip?.startedAt || null)
  const [clock, setClock] = useState(() => new Date())
  const tripStartedRef = useRef(tripStarted)
  const lastPositionRef = useRef(null)
  const watchIdRef = useRef(null)
  const destinationRef = useRef(destination)
  const weatherLatitude = position ? Number(position.lat.toFixed(2)) : null
  const weatherLongitude = position ? Number(position.lng.toFixed(2)) : null

  useEffect(() => {
    if (typeof navigator.getBattery !== 'function') return undefined

    let active = true
    let batteryManager
    const updateBattery = () => {
      if (!active || !batteryManager) return
      setPhoneBattery({ level: batteryManager.level, charging: batteryManager.charging })
    }

    navigator.getBattery().then((battery) => {
      if (!active) return
      batteryManager = battery
      updateBattery()
      batteryManager.addEventListener('levelchange', updateBattery)
      batteryManager.addEventListener('chargingchange', updateBattery)
      setBatteryAvailability('available')
    }).catch(() => {
      if (active) setBatteryAvailability('unavailable')
    })

    return () => {
      active = false
      if (batteryManager) {
        batteryManager.removeEventListener('levelchange', updateBattery)
        batteryManager.removeEventListener('chargingchange', updateBattery)
      }
    }
  }, [])

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
    const query = destinationInput.trim()
    if (view !== 'map' || query.length < 3 || destination?.name === query) return undefined

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setSuggestionsLoading(true)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=es&q=${encodeURIComponent(query)}`, { signal: controller.signal })
        if (!response.ok) throw new Error('No se pudo buscar ese lugar.')
        const results = await response.json()
        setDestinationSuggestions(results.map((place) => ({
          name: place.name || place.display_name.split(',')[0],
          detail: place.display_name,
          lat: Number(place.lat),
          lon: Number(place.lon),
        })))
        setActiveSuggestion(-1)
      } catch (error) {
        if (error.name !== 'AbortError') setDestinationSuggestions([])
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false)
      }
    }, 1000)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [destination?.name, destinationInput, view])

  useEffect(() => {
    if (weatherLatitude === null || weatherLongitude === null) return
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${weatherLatitude}&longitude=${weatherLongitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=precipitation_probability&timezone=auto`
    fetch(url).then((response) => response.json()).then((data) => {
      const currentHour = `${data.current.time.slice(0, 13)}:00`
      const probabilityIndex = data.hourly.time.findIndex((time) => time === currentHour)
      setWeather({ ...data.current, precipitation_probability: data.hourly.precipitation_probability[probabilityIndex] ?? null })
    }).catch(() => setWeather(null))
  }, [weatherLatitude, weatherLongitude])

  useEffect(() => {
    localStorage.setItem('autodash-tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    destinationRef.current = destination
  }, [destination])

  useEffect(() => {
    localStorage.setItem('autodash-device', device)
    localStorage.setItem('autodash-contrast', String(highContrast))
    localStorage.setItem('autodash-dark-mode', String(darkMode))
    localStorage.setItem('autodash-large-text', String(largeText))
    localStorage.setItem('autodash-voice', String(voiceEnabled))
  }, [device, highContrast, darkMode, largeText, voiceEnabled])

  const speak = useCallback((message) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const announcement = new SpeechSynthesisUtterance(message)
    announcement.lang = 'es-ES'
    window.speechSynthesis.speak(announcement)
  }, [voiceEnabled])

  const announceRoute = useCallback((summary) => {
    speak(`Ruta calculada a ${summary.name}. ${summary.distance} kilómetros, aproximadamente ${summary.duration} minutos`)
  }, [speak])

  function toggleVoice() {
    const nextVoiceEnabled = !voiceEnabled
    setVoiceEnabled(nextVoiceEnabled)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      if (nextVoiceEnabled) {
        const announcement = new SpeechSynthesisUtterance('Indicaciones por voz activadas')
        announcement.lang = 'es-ES'
        window.speechSynthesis.speak(announcement)
      }
    }
  }

  function startGps() {
    if (!window.isSecureContext) {
      setGpsStatus('insecure')
      return
    }
    if (!navigator.geolocation) {
      setGpsStatus('unsupported')
      return
    }
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    setGpsStatus('searching')
    watchIdRef.current = navigator.geolocation.watchPosition((result) => {
      const nextPosition = { lat: result.coords.latitude, lng: result.coords.longitude, accuracy: result.coords.accuracy, timestamp: result.timestamp || Date.now() }
      if (destinationRef.current && !destinationRef.current.origin) {
        setDestination({ ...destinationRef.current, origin: nextPosition })
      }
      const previousPosition = lastPositionRef.current
      const elapsedSeconds = previousPosition ? (nextPosition.timestamp - previousPosition.timestamp) / 1000 : 0
      const segment = previousPosition ? distanceBetween(previousPosition, nextPosition) : 0
      const noiseThreshold = previousPosition ? Math.max(3, Math.min(10, (nextPosition.accuracy + previousPosition.accuracy) * 0.15)) : 3
      const reliableSegment = previousPosition && elapsedSeconds > 0 && nextPosition.accuracy <= 100 && previousPosition.accuracy <= 100 && segment < 1000
      if (tripStartedRef.current && reliableSegment && segment > noiseThreshold) {
        setDistance((current) => current + segment / 1000)
      }
      const reportedSpeed = result.coords.speed
      if (Number.isFinite(reportedSpeed) && reportedSpeed >= 0) setSpeed(reportedSpeed * 3.6)
      else if (reliableSegment && nextPosition.accuracy <= 50 && previousPosition.accuracy <= 50) {
        const estimatedSpeed = segment <= noiseThreshold ? 0 : segment / elapsedSeconds * 3.6
        setSpeed(estimatedSpeed <= 200 ? estimatedSpeed : 0)
      } else setSpeed(0)
      lastPositionRef.current = nextPosition
      setPosition(nextPosition)
      setGpsStatus('active')
    }, (error) => setGpsStatus(error.code === 1 ? 'denied' : 'error'), { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 })
  }

  useEffect(() => () => {
    if (watchIdRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current)
  }, [])

  useEffect(() => {
    if (!tripStarted || !tripStartedAt) {
      localStorage.removeItem('autodash-active-trip')
      return
    }
    localStorage.setItem('autodash-active-trip', JSON.stringify({ startedAt: tripStartedAt, distance }))
  }, [distance, tripStarted, tripStartedAt])

  function toggleTrip() {
    if (!tripStarted) {
      setDistance(0)
      lastPositionRef.current = null
      tripStartedRef.current = true
      setTripStarted(true)
      setTripStartedAt(Date.now())
      speak('Trayecto iniciado')
      if (gpsStatus !== 'active') startGps()
      return
    }
    tripStartedRef.current = false
    const elapsedMinutes = tripStartedAt ? Math.max(1, Math.round((Date.now() - tripStartedAt) / 60000)) : 0
    const trip = { id: Date.now(), date: new Date(tripStartedAt || Date.now()).toLocaleString('es'), distance: distance.toFixed(2), duration: `${elapsedMinutes} min`, consumption: 'Sin datos del vehículo' }
    speak(`Trayecto finalizado. Distancia recorrida: ${distance.toFixed(2)} kilómetros`)
    const updatedTrips = [trip, ...trips]
    setTrips(updatedTrips)
    localStorage.setItem('autodash-trips', JSON.stringify(updatedTrips))
    setTripStarted(false)
    setTripStartedAt(null)
  }

  function moveTask(taskId, status) {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status } : task))
  }

  const statusText = { idle: 'GPS desconectado', searching: 'Buscando señal GPS…', active: 'GPS conectado', denied: 'Permiso de ubicación denegado', error: 'No se pudo obtener la ubicación', unsupported: 'GPS no compatible con este navegador', insecure: 'GPS requiere HTTPS' }[gpsStatus]
  const weatherStatus = weather ? 'Actualizado con tu ubicación' : 'Activa el GPS para consultar el clima local'

  function chooseDestination(place) {
    setDestinationInput(place.name)
    setDestination({ ...place, origin: position })
    setDestinationSuggestions([])
    setSuggestionsOpen(false)
    setActiveSuggestion(-1)
  }

  function handleDestinationKeyDown(event) {
    if (event.key === 'ArrowDown' && destinationSuggestions.length) {
      event.preventDefault()
      setSuggestionsOpen(true)
      setActiveSuggestion((current) => (current + 1) % destinationSuggestions.length)
    } else if (event.key === 'ArrowUp' && destinationSuggestions.length) {
      event.preventDefault()
      setActiveSuggestion((current) => current <= 0 ? destinationSuggestions.length - 1 : current - 1)
    } else if (event.key === 'Enter' && suggestionsOpen && destinationSuggestions.length) {
      event.preventDefault()
      chooseDestination(destinationSuggestions[Math.max(0, activeSuggestion)])
    } else if (event.key === 'Escape') {
      setSuggestionsOpen(false)
    }
  }

  return (
    <div className={`app-shell device-${device}${highContrast ? ' high-contrast' : ''}${darkMode ? ' dark-mode' : ''}${largeText ? ' large-text' : ''}`}>
      <aside className={`sidebar${menuOpen ? ' sidebar-open' : ''}`}>
        <a className="brand" href="#panel" onClick={() => setView('dashboard')} aria-label="AutoDash, ir al panel">
          <span className="brand-mark"><Gauge size={21} strokeWidth={2.2} /></span>
          <span>auto<span>dash</span><small>VEHICLE COMPANION</small></span>
        </a>
        <div className="side-label">ESPACIO DEL CONDUCTOR</div>
        <nav aria-label="Navegación principal">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`nav-link${view === id ? ' active' : ''}`} onClick={() => { setView(id); setMenuOpen(false) }}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{id === 'dashboard' && <span className="live-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="vehicle-connect"><div className="connect-icon"><Bluetooth size={17} /></div><div><strong>Carrito</strong><span><i /> Sin conectar</span></div><ChevronRight size={16} /></div>
          <button className="nav-link settings-link" onClick={() => { setView('settings'); setMenuOpen(false) }}><Settings2 size={18} /><span>Configuración</span></button>
          <div className="profile"><div className="avatar">CD</div><div><strong>Conductor</strong><span>Perfil personal</span></div><ChevronDown size={15} /></div>
        </div>
      </aside>

      {menuOpen && <button className="mobile-scrim" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}
      <main id="panel" className="main-area">
        <header className="topbar">
          <button className="icon-button menu-toggle" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumbs">Mi vehículo <ChevronRight size={14} /> <strong>{navigation.find((item) => item.id === view)?.label || 'Configuración'}</strong></div>
          <div className="topbar-actions"><span className={`connection-pill${gpsStatus === 'active' ? ' connected' : ''}`}><i />{statusText}</span><button className="icon-button notification-button" aria-label="Notificaciones"><Bell size={18} /><i /></button><span className="today-date">{new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span></div>
        </header>

        <div className="page-content">
          {gpsStatus === 'insecure' && <div className="gps-security-notice" role="alert"><ShieldCheck size={17} /><span>Chrome bloquea la ubicación en esta dirección HTTP. Publica el sitio en Netlify y ábrelo con su dirección HTTPS; después, permite la ubicación en el navegador.</span></div>}
          {view === 'dashboard' && <>
            <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> TU VIAJE, DE UN VISTAZO</div><h1>{greetingFor(clock)}, conductor<span>.</span></h1><p>Esto es lo que pasa con tu carrito ahora.</p></div><button className={`trip-button${tripStarted ? ' trip-active' : ''}`} onClick={toggleTrip}>{tripStarted ? <><Pause size={16} fill="currentColor" /> Finalizar trayecto</> : <><Navigation size={16} /> Iniciar trayecto</>}</button></section>
            <section className="metric-grid" aria-label="Datos actuales del vehículo">
              <article className="metric-card speed-card"><div className="metric-top"><span className="metric-label">VELOCIDAD ACTUAL</span><span className="metric-icon"><Gauge size={18} /></span></div><div className="speed-display"><strong>{Math.round(speed)}</strong><span>km/h</span></div><div className="speed-meter"><span style={{ width: `${Math.min(speed / 1.2, 100)}%` }} /></div><div className="metric-foot"><span><i className={`signal-dot${gpsStatus === 'active' ? '' : ' inactive'}`} /> {gpsStatus === 'active' ? 'GPS en tiempo real' : 'GPS sin conexión'}</span><span>máx. 120 km/h</span></div></article>
              <article className="metric-card"><div className="metric-top"><span className="metric-label">BATERÍA DEL TELÉFONO</span><span className="metric-icon battery-color"><BatteryCharging size={18} /></span></div><div className="battery-row"><strong>{phoneBattery ? Math.round(phoneBattery.level * 100) : '--'}<small>%</small></strong><span className="source-tag">{batteryAvailability === 'available' ? 'TELÉFONO' : batteryAvailability === 'unsupported' ? 'NO DISPONIBLE' : 'LEYENDO…'}</span></div><div className="battery-track"><span style={{ width: `${phoneBattery ? Math.round(phoneBattery.level * 100) : 0}%` }} /></div><div className="metric-foot"><span>Estado de carga</span><strong>{phoneBattery ? phoneBattery.charging ? 'Cargando' : 'En uso' : '--'}</strong></div><div className="metric-note">{batteryAvailability === 'unsupported' ? 'Este navegador no comparte el nivel de batería' : batteryAvailability === 'unavailable' ? 'No se pudo leer la batería del teléfono' : 'Actualización en tiempo real'}</div></article>
              <article className="metric-card"><div className="metric-top"><span className="metric-label">DISTANCIA DEL TRAYECTO</span><span className="metric-icon distance-color"><Route size={18} /></span></div><div className="distance-display"><strong>{distance.toFixed(2)}</strong><span>km</span></div><div className="metric-foot"><span>{tripStarted ? 'Trayecto en curso' : 'Inicia un trayecto para registrar'}</span><span className="muted-number">{trips.length} guardados</span></div></article>
            </section>

            <section className="content-grid">
              <article className="panel weather-panel"><div className="section-title"><div><span className="section-kicker">CONDICIONES LOCALES</span><h2>Clima en ruta</h2></div><span className="title-icon weather-title-icon"><CloudSun size={19} /></span></div><div className="weather-status">{weatherStatus}</div><div className="weather-main"><div className="weather-symbol"><Sun size={32} strokeWidth={1.5} /></div><div className="temperature">{weather ? `${Math.round(weather.temperature_2m)}°` : '--°'}<span>{weather ? 'Actual' : 'Sin ubicación'}</span></div></div><div className="weather-details"><div><Thermometer size={15} /><span>Humedad</span><strong>{weather ? `${weather.relative_humidity_2m}%` : '--'}</strong></div><div><Wind size={15} /><span>Viento</span><strong>{weather ? `${Math.round(weather.wind_speed_10m)} km/h` : '--'}</strong></div><div><CloudDrizzle size={15} /><span>Prob. lluvia</span><strong>{weather?.precipitation_probability != null ? `${weather.precipitation_probability}%` : '--'}</strong></div></div><button className="text-action" onClick={startGps}><MapPin size={14} /> {position ? `${position.lat.toFixed(3)}, ${position.lng.toFixed(3)}` : 'Permitir ubicación'} <ChevronRight size={14} /></button></article>
              <article className="panel map-preview"><div className="section-title"><div><span className="section-kicker">UBICACIÓN DEL CARRITO</span><h2>Tu posición</h2></div><button className="subtle-button" onClick={() => setView('map')}>Abrir mapa <ChevronRight size={15} /></button></div><div className="map-preview-art"><div className="map-grid-lines" /><div className="map-route route-one" /><div className="map-route route-two" /><span className="map-road-label road-a">AV. PRINCIPAL</span><span className="map-road-label road-b">CALLE 8</span><span className="map-pin-center"><MapPin size={19} fill="currentColor" /></span><span className="map-coordinates">{position ? `${position.lat.toFixed(4)}°, ${position.lng.toFixed(4)}°` : 'Esperando señal GPS'}</span></div><div className="map-foot"><span><i className={gpsStatus === 'active' ? 'signal-dot' : 'signal-dot inactive'} /> {gpsStatus === 'active' ? 'Posición actualizada' : 'Ubicación sin conectar'}</span><button className="text-action" onClick={() => setView('map')}>Navegar <ChevronRight size={14} /></button></div></article>
            </section>

            <section className="panel recent-panel"><div className="section-title"><div><span className="section-kicker">ACTIVIDAD</span><h2>Últimos trayectos</h2></div><button className="subtle-button" onClick={() => setView('history')}>Ver historial <ChevronRight size={15} /></button></div>{trips.length ? <div className="trip-list">{trips.slice(0, 3).map((trip) => <div className="trip-row" key={trip.id}><span className="trip-row-icon"><Route size={16} /></span><strong>{trip.date}</strong><span>{trip.distance} km</span><span className="trip-consumption">{trip.consumption}</span></div>)}</div> : <div className="empty-inline"><span className="empty-icon"><Route size={17} /></span><span>Aún no hay trayectos registrados. Inicia uno para empezar tu historial.</span></div>}</section>
          </>}

          {view === 'map' && <section className="module-page"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> GPS Y RUTAS</div><h1>Navegación<span>.</span></h1><p>Escribe un destino y elige una sugerencia para trazar la ruta.</p></div><button className="secondary-button" onClick={startGps}><MapPin size={16} /> {position ? 'Actualizar GPS' : 'Activar GPS'}</button></div><form className="route-search" onSubmit={(event) => { event.preventDefault(); if (destinationSuggestions.length) chooseDestination(destinationSuggestions[Math.max(0, activeSuggestion)]) }}><div className="route-origin"><span className="origin-dot" /><div><small>ORIGEN</small><strong>{position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Esperando ubicación GPS'}</strong></div></div><div className="route-divider"><span /></div><div className="destination-field"><MapPin size={17} /><div className="destination-autocomplete"><input value={destinationInput} onChange={(event) => { setDestinationInput(event.target.value); setDestination(''); setSuggestionsOpen(true) }} onFocus={() => setSuggestionsOpen(true)} onKeyDown={handleDestinationKeyDown} role="combobox" aria-autocomplete="list" aria-expanded={suggestionsOpen && destinationSuggestions.length > 0} aria-controls="destination-suggestions" aria-activedescendant={activeSuggestion >= 0 ? `destination-option-${activeSuggestion}` : undefined} placeholder="¿A dónde quieres ir?" aria-label="Destino" />{suggestionsOpen && destinationInput.trim().length >= 3 && <div id="destination-suggestions" className="destination-suggestions" role="listbox">{suggestionsLoading ? <div className="suggestion-status"><LoaderCircle size={15} className="spin" /> Buscando lugares…</div> : destinationSuggestions.length ? destinationSuggestions.map((place, index) => <button key={`${place.lat}-${place.lon}`} id={`destination-option-${index}`} type="button" role="option" aria-selected={index === activeSuggestion} className={`suggestion-option${index === activeSuggestion ? ' highlighted' : ''}`} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseDestination(place)}><MapPin size={16} /><span><strong>{place.name}</strong><small>{place.detail}</small></span></button>) : <div className="suggestion-status">No se encontraron lugares. Prueba otra búsqueda.</div>}</div>}</div><button type="submit" className="trip-button"><Route size={16} /> Trazar ruta</button></div></form>{destination && !position && <div className="route-gps-prompt"><MapPin size={15} /> Destino seleccionado: {destination.name}. Activa el GPS para calcular la ruta y la hora de llegada.</div>}<MapView position={position} destination={destination} onRouteReady={announceRoute} /></section>}

          {view === 'history' && <section className="module-page"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> REGISTRO DE ACTIVIDAD</div><h1>Trayectos<span>.</span></h1><p>Distancias registradas desde la ubicación de tu dispositivo.</p></div><button className="trip-button" onClick={toggleTrip}>{tripStarted ? <><Pause size={16} /> Finalizar trayecto</> : <><Navigation size={16} /> Iniciar trayecto</>}</button></div><div className="history-summary"><article className="panel"><span className="section-kicker">TRAYECTOS GUARDADOS</span><strong>{trips.length}</strong></article><article className="panel"><span className="section-kicker">DISTANCIA REGISTRADA</span><strong>{trips.reduce((total, trip) => total + Number(trip.distance), 0).toFixed(2)} <small>km</small></strong></article><article className="panel"><span className="section-kicker">CONSUMO</span><strong className="history-unavailable">Requiere conexión</strong></article></div><article className="panel history-table"><div className="section-title"><div><span className="section-kicker">HISTORIAL</span><h2>Todos tus trayectos</h2></div></div>{trips.length ? <div className="table-scroll"><table><thead><tr><th>FECHA</th><th>DISTANCIA</th><th>DURACIÓN</th><th>CONSUMO</th></tr></thead><tbody>{trips.map((trip) => <tr key={trip.id}><td>{trip.date}</td><td>{trip.distance} km</td><td>{trip.duration}</td><td>{trip.consumption}</td></tr>)}</tbody></table></div> : <div className="empty-state"><span className="empty-icon"><Route size={20} /></span><strong>Tu primer trayecto empieza aquí</strong><span>Inicia un trayecto con el GPS activo para guardar la distancia recorrida.</span><button className="secondary-button" onClick={() => { setView('dashboard'); startGps() }}><MapPin size={15} /> Activar GPS</button></div>}</article></section>}

          {view === 'maintenance' && <section className="module-page"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> CUIDADO DEL VEHÍCULO</div><h1>Mantenimiento<span>.</span></h1><p>Organiza las revisiones y reparaciones de tu carrito.</p></div><span className="board-count"><Wrench size={15} /> {tasks.length} tareas</span></div><div className="kanban-board">{columns.map((column) => <section className="kanban-column" key={column}><div className="kanban-heading"><span className={`column-dot ${column.toLowerCase().replace(' ', '-')}`} /><h2>{column}</h2><span className="column-count">{tasks.filter((task) => task.status === column).length}</span></div>{tasks.filter((task) => task.status === column).map((task) => <article className="task-card" key={task.id}><span className="task-type"><Wrench size={13} /> VEHÍCULO</span><h3>{task.title}</h3><p>{task.detail}</p><label className="task-move">Mover a <select aria-label={`Estado de ${task.title}`} value={task.status} onChange={(event) => moveTask(task.id, event.target.value)}>{columns.map((option) => <option key={option}>{option}</option>)}</select></label></article>)}{!tasks.some((task) => task.status === column) && <div className="column-empty">Sin tareas</div>}</section>)}</div></section>}

          {view === 'media' && <section className="module-page media-page"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> CENTRO MULTIMEDIA</div><h1>Multimedia<span>.</span></h1><p>Controla la reproducción de audio desde tu panel.</p></div><span className="board-count"><Bluetooth size={15} /> Audio local</span></div><div className="media-layout"><article className="panel media-player"><div className="album-art"><span className="album-sun" /><span className="album-horizon" /><span className="album-disc"><Music2 size={26} /></span><small>A U T O D A S H&nbsp; R A D I O</small></div><div className="track-info"><span className="section-kicker">LISTA DE DEMOSTRACIÓN</span><h2>{['Ruta de mañana', 'Kilómetros de calma', 'Camino abierto'][track]}</h2><p>AutoDash Radio · Reproducción de muestra</p></div><div className="audio-progress"><span /><i /></div><div className="audio-times"><span>1:24</span><span>4:08</span></div><div className="player-controls"><button className="icon-button" aria-label="Pista anterior" onClick={() => setTrack((track + 2) % 3)}><ChevronLeft size={20} /></button><button className="play-button" aria-label={playing ? 'Pausar' : 'Reproducir'} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button><button className="icon-button" aria-label="Pista siguiente" onClick={() => setTrack((track + 1) % 3)}><ChevronRight size={20} /></button></div><div className="volume-control"><Volume2 size={16} /><input type="range" aria-label="Volumen" min="0" max="100" defaultValue="65" /></div><p className="media-disclaimer">Controles de interfaz demostrativos. Para reproducir audio real, conecta una fuente multimedia.</p></article><article className="panel playlist-panel"><div className="section-title"><div><span className="section-kicker">TU SELECCIÓN</span><h2>Reproducir después</h2></div><span className="playlist-count">03 pistas</span></div>{['Ruta de mañana', 'Kilómetros de calma', 'Camino abierto'].map((name, index) => <button key={name} className={`playlist-item${track === index ? ' selected' : ''}`} onClick={() => { setTrack(index); setPlaying(true) }}><span className="playlist-number">{track === index && playing ? <span className="playing-bars"><i /><i /><i /></span> : `0${index + 1}`}</span><span className="playlist-song"><strong>{name}</strong><small>AutoDash Radio</small></span><span className="playlist-duration">4:08</span></button>)}</article></div></section>}

          {view === 'settings' && <section className="module-page settings-page"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> PERSONALIZA TU ESPACIO</div><h1>Configuración<span>.</span></h1><p>Adapta la interfaz y los controles a tu dispositivo.</p></div><span className="board-count"><Settings2 size={15} /> Preferencias</span></div><article className="panel settings-section"><div className="section-title"><div><span className="section-kicker">PANTALLA</span><h2>Tipo de dispositivo</h2></div><span className="title-icon"><Compass size={18} /></span></div><p className="settings-description">El diseño se ajusta automáticamente al espacio disponible.</p><div className="device-options">{[{ id: 'tablet', name: 'Tableta', detail: 'Vista amplia para el vehículo', icon: '▭' }, { id: 'phone', name: 'Teléfono', detail: 'Controles compactos', icon: '▯' }, { id: 'computer', name: 'Computadora', detail: 'Panel completo de escritorio', icon: '▱' }].map((option) => <button key={option.id} className={`device-option${device === option.id ? ' chosen' : ''}`} onClick={() => setDevice(option.id)}><span className="device-illustration">{option.icon}</span><span><strong>{option.name}</strong><small>{option.detail}</small></span><span className="radio-indicator">{device === option.id && <Check size={12} />}</span></button>)}</div></article><article className="panel settings-section accessibility-section"><div className="section-title"><div><span className="section-kicker">ACCESIBILIDAD Y APARIENCIA</span><h2>Accesibilidad</h2></div><span className="title-icon"><ShieldCheck size={18} /></span></div><div className="setting-row"><span className="setting-icon"><Moon size={17} /></span><span className="setting-copy"><strong>Modo oscuro</strong><small>Usa una paleta oscura en todo el panel.</small></span><button role="switch" aria-checked={darkMode} className={`toggle${darkMode ? ' on' : ''}`} onClick={() => setDarkMode(!darkMode)} aria-label="Activar modo oscuro"><i /></button></div><div className="setting-row"><span className="setting-icon"><Contrast size={17} /></span><span className="setting-copy"><strong>Alto contraste</strong><small>Refuerza la diferencia entre texto y fondo.</small></span><button role="switch" aria-checked={highContrast} className={`toggle${highContrast ? ' on' : ''}`} onClick={() => setHighContrast(!highContrast)} aria-label="Activar alto contraste"><i /></button></div><div className="setting-row"><span className="setting-icon"><Plus size={17} /></span><span className="setting-copy"><strong>Texto grande</strong><small>Aumenta el tamaño de los textos de la interfaz.</small></span><button role="switch" aria-checked={largeText} className={`toggle${largeText ? ' on' : ''}`} onClick={() => setLargeText(!largeText)} aria-label="Activar texto grande"><i /></button></div><div className="setting-row"><span className="setting-icon"><Mic2 size={17} /></span><span className="setting-copy"><strong>Indicaciones por voz</strong><small>Lee los avisos de trayecto y los resultados de ruta.</small></span><button role="switch" aria-checked={voiceEnabled} className={`toggle${voiceEnabled ? ' on' : ''}`} onClick={toggleVoice} aria-label="Activar indicaciones por voz"><i /></button></div>{voiceEnabled && <div className="voice-note"><Volume2 size={15} /> La síntesis de voz anunciará inicio y fin de trayectos, y rutas calculadas.</div>}</article><article className="panel settings-section"><div className="section-title"><div><span className="section-kicker">CONEXIONES</span><h2>Sensores del vehículo</h2></div><span className="title-icon"><Bluetooth size={18} /></span></div><div className="sensor-row"><span className="sensor-indicator" /><span><strong>Carrito</strong><small>Velocidad del motor, batería y consumo</small></span><span className="source-tag">SIN CONECTAR</span><button className="secondary-button" onClick={() => setSettingsOpen(!settingsOpen)}><Bluetooth size={15} /> Conectar</button></div>{settingsOpen && <div className="bluetooth-note">La Web Bluetooth API requiere Chrome o Edge, HTTPS y un dispositivo compatible. El carrito aún no está conectado a un sensor.</div>}</article></section>}
        </div>
        <footer className="app-footer"><span><span className="footer-mark"><Gauge size={13} /></span> AUTODASH <span className="footer-separator">·</span> CONDUCCIÓN CONSCIENTE</span><span>Los datos GPS requieren permiso del navegador. Batería y consumo requieren sensor conectado.</span></footer>
      </main>
      <nav className="mobile-nav" aria-label="Navegación móvil">{navigation.slice(0, 4).map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon size={19} /><span>{label}</span></button>)}<button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}><Settings2 size={19} /><span>Ajustes</span></button></nav>
    </div>
  )
}

export default App