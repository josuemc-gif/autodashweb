import { useEffect, useState } from 'react'

export function useBateriaTelefono() {
  const [bateria, setBateria] = useState(null)
  const [disponibilidad, setDisponibilidad] = useState(() => (
    typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function'
      ? 'loading'
      : 'unsupported'
  ))

  useEffect(() => {
    if (typeof navigator.getBattery !== 'function') return undefined

    let activa = true
    let administradorBateria

    const actualizarBateria = () => {
      if (!activa || !administradorBateria) return
      setBateria({ level: administradorBateria.level, charging: administradorBateria.charging })
    }

    navigator.getBattery().then((administrador) => {
      if (!activa) return
      administradorBateria = administrador
      actualizarBateria()
      administradorBateria.addEventListener('levelchange', actualizarBateria)
      administradorBateria.addEventListener('chargingchange', actualizarBateria)
      setDisponibilidad('available')
    }).catch(() => {
      if (activa) setDisponibilidad('unavailable')
    })

    return () => {
      activa = false
      if (administradorBateria) {
        administradorBateria.removeEventListener('levelchange', actualizarBateria)
        administradorBateria.removeEventListener('chargingchange', actualizarBateria)
      }
    }
  }, [])

  return { bateria, disponibilidad }
}
