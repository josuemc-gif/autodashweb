import { Navigation, Route } from 'lucide-react'
import { BotonTrayecto } from '../panel/boton_trayecto/boton_trayecto'
import './trayectos.css'

export function SeccionTrayectos({ trips, tripStarted, toggleTrip, startGps, setView }) {
  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> REGISTRO DE ACTIVIDAD</div>
          <h1>Trayectos<span>.</span></h1>
          <p>Distancias registradas desde la ubicación de tu dispositivo.</p>
        </div>
        <BotonTrayecto iniciado={tripStarted} alAlternar={toggleTrip} />
      </div>

      <div className="history-summary">
        <article className="panel">
          <span className="section-kicker">TRAYECTOS GUARDADOS</span>
          <strong>{trips.length}</strong>
        </article>
        <article className="panel">
          <span className="section-kicker">DISTANCIA REGISTRADA</span>
          <strong>{trips.reduce((total, trip) => total + Number(trip.distance), 0).toFixed(2)} <small>km</small></strong>
        </article>
        <article className="panel">
          <span className="section-kicker">CONSUMO</span>
          <strong className="history-unavailable">Requiere conexión</strong>
        </article>
      </div>

      <article className="panel history-table">
        <div className="section-title">
          <div><span className="section-kicker">HISTORIAL</span><h2>Todos tus trayectos</h2></div>
        </div>

        {trips.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>FECHA</th><th>DISTANCIA</th><th>DURACIÓN</th><th>CONSUMO</th></tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id}>
                    <td>{trip.date}</td>
                    <td>{trip.distance} km</td>
                    <td>{trip.duration}</td>
                    <td>{trip.consumption}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon"><Route size={20} /></span>
            <strong>Tu primer trayecto empieza aquí</strong>
            <span>Inicia un trayecto con el GPS activo para guardar la distancia recorrida.</span>
            <button className="secondary-button" onClick={() => { setView('dashboard'); startGps() }}><Navigation size={15} /> Activar GPS</button>
          </div>
        )}
      </article>
    </section>
  )
}
