import { useEffect, useState } from 'react'

export function usePreferencias() {
  const [dispositivo, setDispositivo] = useState(() => localStorage.getItem('autodash-device') || 'tablet')
  const [altoContraste, setAltoContraste] = useState(() => localStorage.getItem('autodash-contrast') === 'true')
  const [modoOscuro, setModoOscuro] = useState(() => localStorage.getItem('autodash-dark-mode') === 'true')
  const [textoGrande, setTextoGrande] = useState(() => localStorage.getItem('autodash-large-text') === 'true')
  const [vozActivada, setVozActivada] = useState(() => localStorage.getItem('autodash-voice') === 'true')

  useEffect(() => {
    localStorage.setItem('autodash-device', dispositivo)
    localStorage.setItem('autodash-contrast', String(altoContraste))
    localStorage.setItem('autodash-dark-mode', String(modoOscuro))
    localStorage.setItem('autodash-large-text', String(textoGrande))
    localStorage.setItem('autodash-voice', String(vozActivada))
  }, [dispositivo, altoContraste, modoOscuro, textoGrande, vozActivada])

  function alternarVoz() {
    const siguienteEstado = !vozActivada
    setVozActivada(siguienteEstado)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      if (siguienteEstado) {
        const anuncio = new SpeechSynthesisUtterance('Indicaciones por voz activadas')
        anuncio.lang = 'es-ES'
        window.speechSynthesis.speak(anuncio)
      }
    }
  }

  return {
    dispositivo,
    setDispositivo,
    altoContraste,
    setAltoContraste,
    modoOscuro,
    setModoOscuro,
    textoGrande,
    setTextoGrande,
    vozActivada,
    alternarVoz,
  }
}
