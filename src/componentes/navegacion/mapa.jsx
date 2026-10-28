import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, MapPin, Route } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatearDuracion } from '../../utilidades/formateadores'
import './navegacion.css'

export function Mapa({ position, destination, onRouteReady, gpsStatus }) {
  const [mapNode, setMapNode] = useState(null)
  const mapStateRef = useRef(null)
  const [routeSummary, setRouteSummary] = useState(null)
  const [routeError, setRouteError] = useState('')
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    if (!mapNode) return undefined

    const map = L.map(mapNode, { zoomControl: false }).setView([20, 0], 2)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    const vehicleIcon = L.divIcon({
      className: 'vehicle-marker',
      html: '<span></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    })

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
    if (!mapState) return undefined

    if (!destination?.origin || !Number.isFinite(destination.lat) || !Number.isFinite(destination.lon)) {
      if (mapState.route) mapState.map.removeLayer(mapState.route)
      mapState.route = null
      return undefined
    }

    let cancelled = false

    const fetchRoute = async () => {
      setRouteError('')
      setRouteSummary(null)
      setRouteLoading(true)

      try {
        const routeResponse = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${destination.origin.lng},${destination.origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`,
        )

        if (!routeResponse.ok) throw new Error('No se pudo calcular la ruta.')

        const routeData = await routeResponse.json()
        if (!routeData.routes?.length) throw new Error('No hay una ruta disponible para ese destino.')

        if (cancelled) return

        if (mapState.route) mapState.map.removeLayer(mapState.route)

        const line = L.geoJSON(routeData.routes[0].geometry, {
          style: { color: '#4285f4', weight: 6, opacity: 0.95 },
        }).addTo(mapState.map)

        mapState.route = line
        mapState.map.fitBounds(line.getBounds(), { padding: [36, 36] })

        const duration = Math.max(1, Math.round(routeData.routes[0].duration / 60))
        const arrival = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(
          new Date(Date.now() + duration * 60000),
        )

        const summary = {
          distance: (routeData.routes[0].distance / 1000).toFixed(1),
          duration,
          durationLabel: formatearDuracion(duration),
          arrival,
          name: destination.name,
        }

        setRouteSummary(summary)
        onRouteReady?.(summary)
      } catch (error) {
        if (!cancelled) setRouteError(error.message)
      } finally {
        if (!cancelled) setRouteLoading(false)
      }
    }

    fetchRoute()
    return () => {
      cancelled = true
    }
  }, [destination, onRouteReady])

  return (
    <div className="map-frame">
      <div className="map-canvas" ref={setMapNode} />

      {!position && (
        <div className="map-notice">
          <MapPin size={16} />
          {gpsStatus === 'insecure' ? 'El GPS requiere una dirección HTTPS.' : 'Activa el GPS para centrar el mapa y calcular rutas.'}
        </div>
      )}

      {routeLoading && destination?.origin && (
        <div className="route-loading">
          <LoaderCircle size={15} className="spin" />
          Calculando ruta y hora de llegada…
        </div>
      )}

      {routeSummary && destination?.name === routeSummary.name && (
        <div className="route-summary">
          <Route size={16} />
          <span className="route-arrival">
            <strong>{routeSummary.arrival}</strong>
            <small>Hora estimada de llegada</small>
          </span>
          <span className="route-separator" />
          <span className="route-duration">
            <strong>{routeSummary.durationLabel}</strong>
            <small>{routeSummary.distance} km</small>
          </span>
          <small className="route-destination-name">{routeSummary.name}</small>
        </div>
      )}

      {routeError && <div className="route-error">{routeError}</div>}
    </div>
  )
}
