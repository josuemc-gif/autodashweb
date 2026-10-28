import { LoaderCircle, MapPin } from 'lucide-react'
import { Mapa } from './mapa'
import './navegacion.css'

export function SeccionNavegacion({
  position,
  gpsStatus,
  destinationInput,
  setDestinationInput,
  destinationSuggestions,
  suggestionsLoading,
  suggestionsOpen,
  setSuggestionsOpen,
  activeSuggestion,
  chooseDestination,
  handleDestinationKeyDown,
  startGps,
  destination,
  onRouteReady,
}) {
  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> GPS Y RUTAS</div>
          <h1>Navegación<span>.</span></h1>
          <p>Escribe un destino y elige una sugerencia para trazar la ruta.</p>
        </div>
        <button className="secondary-button" onClick={startGps}><MapPin size={16} /> {position ? 'Actualizar GPS' : 'Activar GPS'}</button>
      </div>

      <form className="route-search" onSubmit={(event) => {
        event.preventDefault()
        if (destinationSuggestions.length) {
          chooseDestination(destinationSuggestions[Math.max(0, activeSuggestion)])
        }
      }}>
        <div className="route-origin">
          <span className="origin-dot" />
          <div>
            <small>ORIGEN</small>
            <strong>{position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Esperando ubicación GPS'}</strong>
          </div>
        </div>
        <div className="route-divider"><span /></div>
        <div className="destination-field">
          <MapPin size={17} />
          <div className="destination-autocomplete">
            <input
              value={destinationInput}
              onChange={(event) => {
                setDestinationInput(event.target.value)
                setSuggestionsOpen(true)
              }}
              onKeyDown={handleDestinationKeyDown}
              placeholder="Busca un destino"
            />
            {suggestionsOpen && destinationSuggestions.length > 0 && (
              <div className="destination-suggestions" role="listbox">
                {destinationSuggestions.map((place, index) => (
                  <button
                    key={`${place.name}-${index}`}
                    type="button"
                    className={`suggestion-option${index === activeSuggestion ? ' highlighted' : ''}`}
                    onClick={() => chooseDestination(place)}
                    role="option"
                    aria-selected={index === activeSuggestion}
                  >
                    <span><strong>{place.name}</strong><small>{place.detail}</small></span>
                    <MapPin size={15} />
                    </button>
                ))}
              </div>
            )}
            {suggestionsLoading && <div className="suggestion-status"><LoaderCircle size={14} className="spin" /> Buscando lugares…</div>}
          </div>
        </div>
      </form>

      <div className="map-panel">
        <Mapa position={position} destination={destination} onRouteReady={onRouteReady} gpsStatus={gpsStatus} />
      </div>
    </section>
  )
}
