import { Navigation, Pause } from 'lucide-react'
import './boton_trayecto.css'

export function BotonTrayecto({ iniciado, alAlternar, resaltarFinalizacion = false }) {
  return (
    <button className={`trip-button${iniciado && resaltarFinalizacion ? ' trip-active' : ''}`} onClick={alAlternar}>
      {iniciado
        ? <><Pause size={16} fill="currentColor" /> Finalizar trayecto</>
        : <><Navigation size={16} /> Iniciar trayecto</>}
    </button>
  )
}
