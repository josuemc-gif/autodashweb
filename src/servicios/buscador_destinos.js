import { useCallback, useEffect, useRef, useState } from 'react'
import { buscarDestinos } from './busqueda_destinos'

export function useBuscadorDestinos(vista) {
  const [destino, setDestino] = useState('')
  const [entrada, setEntrada] = useState('')
  const [sugerencias, setSugerencias] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [sugerenciasAbiertas, setSugerenciasAbiertas] = useState(false)
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1)
  const posicionRef = useRef(null)

  useEffect(() => {
    const consulta = entrada.trim()
    if (vista !== 'map' || consulta.length < 3 || destino?.name === consulta) return undefined

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setBuscando(true)
      try {
        const resultados = await buscarDestinos(consulta, controller.signal)
        if (controller.signal.aborted) return
        setSugerencias(resultados)
        setSugerenciaActiva(-1)
      } catch (error) {
        if (error.name !== 'AbortError') setSugerencias([])
      } finally {
        if (!controller.signal.aborted) setBuscando(false)
      }
    }, 1000)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [destino?.name, entrada, vista])

  function seleccionarDestino(lugar) {
    setEntrada(lugar.name)
    setDestino({ ...lugar, origin: posicionRef.current })
    setSugerencias([])
    setSugerenciasAbiertas(false)
    setSugerenciaActiva(-1)
  }

  function cambiarEntrada(valor) {
    setEntrada(valor)
    setSugerenciasAbiertas(true)
  }

  function manejarTeclasDestino(evento) {
    if (evento.key === 'ArrowDown' && sugerencias.length) {
      evento.preventDefault()
      setSugerenciasAbiertas(true)
      setSugerenciaActiva((actual) => (actual + 1) % sugerencias.length)
    } else if (evento.key === 'ArrowUp' && sugerencias.length) {
      evento.preventDefault()
      setSugerenciaActiva((actual) => (actual <= 0 ? sugerencias.length - 1 : actual - 1))
    } else if (evento.key === 'Enter' && sugerenciasAbiertas && sugerencias.length) {
      evento.preventDefault()
      seleccionarDestino(sugerencias[Math.max(0, sugerenciaActiva)])
    } else if (evento.key === 'Escape') {
      setSugerenciasAbiertas(false)
    }
  }

  const actualizarPosicion = useCallback((posicion) => {
    posicionRef.current = posicion
    setDestino((actual) => actual && !actual.origin ? { ...actual, origin: posicion } : actual)
  }, [])

  return {
    destino,
    entrada,
    cambiarEntrada,
    sugerencias,
    buscando,
    sugerenciasAbiertas,
    setSugerenciasAbiertas,
    sugerenciaActiva,
    seleccionarDestino,
    manejarTeclasDestino,
    actualizarPosicion,
  }
}
