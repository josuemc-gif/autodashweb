import { useEffect, useRef, useState } from 'react'
import { Bluetooth, ExternalLink, FolderOpen, Music2, Pause, Play, Search, Square, Volume2 } from 'lucide-react'
import { SeccionVideos } from './seccion_videos'
import './multimedia.css'

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

function getSongTitle(fileName) {
  return fileName.replace(/\.[^/.]+$/, '')
}

function getPlainText(value) {
  if (!value) return ''
  return new DOMParser().parseFromString(value, 'text/html').body.textContent.trim()
}

export function SeccionMultimedia({ isVideoPlayerLocked = false }) {
  const audioRef = useRef(null)
  const fileInputRef = useRef(null)
  const searchControllerRef = useRef(null)
  const [songs, setSongs] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [selectedOnlineTrack, setSelectedOnlineTrack] = useState(null)
  const [search, setSearch] = useState('')
  const [catalogQuery, setCatalogQuery] = useState('')
  const [catalogResults, setCatalogResults] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.65)
  const [message, setMessage] = useState('')

  const selectedSong = songs[selectedIndex]
  const hasSelection = Boolean(selectedSong || selectedOnlineTrack)
  const filteredSongs = songs
    .map((file, index) => ({ file, index }))
    .filter(({ file }) => file.name.toLowerCase().includes(search.trim().toLowerCase()))

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    let localUrl
    if (selectedOnlineTrack) {
      audio.src = selectedOnlineTrack.audioUrl
    } else if (selectedSong) {
      localUrl = URL.createObjectURL(selectedSong)
      audio.src = localUrl
    } else {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      return undefined
    }

    audio.load()
    return () => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      if (localUrl) URL.revokeObjectURL(localUrl)
    }
  }, [selectedSong, selectedOnlineTrack])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => () => searchControllerRef.current?.abort(), [])

  function addSongs(event) {
    const selectedFiles = Array.from(event.target.files || [])
    if (!selectedFiles.length) return

    const firstNewIndex = songs.length
    setSongs((currentSongs) => [...currentSongs, ...selectedFiles])
    if (selectedIndex < 0 && !selectedOnlineTrack) setSelectedIndex(firstNewIndex)
    setMessage('')
    event.target.value = ''
  }

  function resetPlaybackState() {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setMessage('')
  }

  function selectSong(index) {
    setSelectedIndex(index)
    setSelectedOnlineTrack(null)
    resetPlaybackState()
  }

  function selectOnlineTrack(track) {
    setSelectedOnlineTrack(track)
    setSelectedIndex(-1)
    resetPlaybackState()
  }

  async function searchCatalog(event) {
    event.preventDefault()
    const term = catalogQuery.trim()
    if (!term) {
      setCatalogError('Escribe una canción o artista para buscar.')
      setCatalogResults([])
      return
    }

    searchControllerRef.current?.abort()
    const controller = new AbortController()
    searchControllerRef.current = controller
    setCatalogLoading(true)
    setCatalogError('')

    const parameters = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: `${term} filetype:audio`,
      gsrnamespace: '6',
      gsrlimit: '25',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      format: 'json',
      origin: '*',
    })

    try {
      const response = await fetch(`https://commons.wikimedia.org/w/api.php?${parameters}`, {
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`La búsqueda respondió con el estado ${response.status}.`)

      const data = await response.json()
      const results = Object.values(data.query?.pages || [])
        .map((page) => {
          const file = page.imageinfo?.[0]
          const extension = page.title.split('.').pop()?.toLowerCase()
          if (!file?.url || !['ogg', 'mp3', 'wav', 'flac', 'm4a'].includes(extension)) return null
          return {
            trackId: page.pageid,
            trackName: getSongTitle(page.title.replace(/^File:/, '')),
            artistName: getPlainText(file.extmetadata?.Artist?.value) || 'Artista no especificado',
            audioUrl: file.url,
            trackViewUrl: file.descriptionurl,
            license: getPlainText(file.extmetadata?.LicenseShortName?.value) || 'Consulta la página del archivo',
            licenseUrl: file.extmetadata?.LicenseUrl?.value,
          }
        })
        .filter(Boolean)
      setCatalogResults(results)
      if (!results.length) setCatalogError('No encontramos archivos de música compatibles con esa búsqueda.')
    } catch (error) {
      if (error.name !== 'AbortError') {
        setCatalogResults([])
        setCatalogError('No se pudo buscar música. Revisa tu conexión e inténtalo de nuevo.')
      }
    } finally {
      if (!controller.signal.aborted) setCatalogLoading(false)
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current
    if (!audio || !hasSelection) return

    if (audio.paused) {
      try {
        await audio.play()
        setMessage('')
      } catch {
        setPlaying(false)
        setMessage('No se pudo reproducir este audio. Puede que el formato no sea compatible o que la vista previa no esté disponible.')
      }
    } else {
      audio.pause()
    }
  }

  function stopPlayback() {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setCurrentTime(0)
  }

  function seek(event) {
    const time = Number(event.target.value)
    if (audioRef.current) audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  const currentTitle = selectedOnlineTrack?.trackName || (selectedSong && getSongTitle(selectedSong.name))
  const currentArtist = selectedOnlineTrack?.artistName

  return (
    <section className="module-page media-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> CENTRO MULTIMEDIA</div>
          <h1>Multimedia<span>.</span></h1>
          <p>Busca música de uso libre o reproduce archivos de audio de tu dispositivo.</p>
        </div>
        <span className="board-count"><Bluetooth size={15} /> Música libre y audio local</span>
      </div>

      <div className="media-layout">
        <article className="panel media-player">
          <div className="album-art">
            <span className="album-sun" />
            <span className="album-horizon" />
            <span className="album-disc"><Music2 size={26} /></span>
            <small>A U T O D A S H&nbsp; R A D I O</small>
          </div>

          <div className="track-info" aria-live="polite">
            <span className="section-kicker">{selectedOnlineTrack ? 'AUDIO LIBRE EN LÍNEA' : selectedSong ? 'ARCHIVO DE TU DISPOSITIVO' : 'REPRODUCTOR DE AUDIO'}</span>
            <h2>{currentTitle || 'Selecciona una canción'}</h2>
            <p>{selectedOnlineTrack
              ? `${currentArtist} · ${selectedOnlineTrack.license}`
              : selectedSong ? `Archivo: ${selectedSong.name}` : 'Busca música en línea o añade archivos desde tu dispositivo.'}</p>
            {selectedOnlineTrack?.trackViewUrl && (
              <a className="media-store-link" href={selectedOnlineTrack.trackViewUrl} target="_blank" rel="noreferrer">
                Ver archivo y atribución <ExternalLink size={12} />
              </a>
            )}
          </div>

          <audio
            ref={audioRef}
            preload="metadata"
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => {
              if (hasSelection) {
                setPlaying(false)
                setMessage('No se puede reproducir este audio. Comprueba el formato o intenta con otra vista previa.')
              }
            }}
          />

          <div className="audio-progress">
            <input
              type="range"
              aria-label="Progreso de reproducción"
              min="0"
              max={duration || 0}
              step="0.1"
              value={Math.min(currentTime, duration || 0)}
              onChange={seek}
              disabled={!hasSelection || !duration}
            />
          </div>
          <div className="audio-times"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>

          <div className="player-controls">
            <button className="icon-button" aria-label="Detener audio" onClick={stopPlayback} disabled={!hasSelection}>
              <Square size={17} fill="currentColor" />
            </button>
            <button className="play-button" aria-label={playing ? 'Pausar' : 'Reproducir'} onClick={togglePlayback} disabled={!hasSelection}>
              {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
          </div>

          <div className="volume-control">
            <Volume2 size={16} />
            <input type="range" aria-label="Volumen" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
          </div>
          {message && <p className="media-message" role="alert">{message}</p>}
          <p className="media-disclaimer">El catálogo contiene archivos de audio con licencia abierta de Wikimedia Commons; se requiere conexión a Internet y se muestra la atribución disponible.</p>
        </article>

        <article className="panel playlist-panel">
          <div className="section-title">
            <div><span className="section-kicker">CATÁLOGO EN LÍNEA</span><h2>Buscar música</h2></div>
            <span className="playlist-count">Wikimedia Commons</span>
          </div>

          <form className="media-search-form" onSubmit={searchCatalog}>
            <label className="media-search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Busca por título o artista"
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
                aria-label="Buscar audio libre por título o artista"
              />
            </label>
            <button className="secondary-button media-search-button" type="submit" disabled={catalogLoading}>
              {catalogLoading ? 'Buscando…' : 'Buscar'}
            </button>
          </form>

          {catalogError && <p className="media-search-status" role="status">{catalogError}</p>}
          {catalogResults.length > 0 && (
            <div className="media-playlist media-catalog-results" aria-label="Resultados de música en línea">
              {catalogResults.map((track) => (
                <div className={`playlist-item media-catalog-item${selectedOnlineTrack?.trackId === track.trackId ? ' selected' : ''}`} key={track.trackId}>
                  <button
                    className="media-track-select"
                    onClick={() => selectOnlineTrack(track)}
                    aria-label={`Reproducir ${track.trackName} de ${track.artistName}`}
                    aria-current={selectedOnlineTrack?.trackId === track.trackId ? 'true' : undefined}
                  >
                    <span className="playlist-number"><Music2 size={14} /></span>
                    <span className="playlist-song"><strong>{track.trackName}</strong><small>{track.artistName}</small></span>
                  </button>
                  {track.trackViewUrl && <a className="media-track-link" href={track.trackViewUrl} target="_blank" rel="noreferrer" aria-label={`Ver licencia y detalles de ${track.trackName} en Wikimedia Commons`}><ExternalLink size={14} /></a>}
                </div>
              ))}
            </div>
          )}

          <div className="media-library-heading">
            <div><span className="section-kicker">TU DISPOSITIVO</span><h2>Archivos locales</h2></div>
            <span className="playlist-count">{songs.length} {songs.length === 1 ? 'pista' : 'pistas'}</span>
          </div>
          <label className="media-search">
            <Search size={16} />
            <input type="search" placeholder="Filtrar archivos locales" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Filtrar archivos locales" />
          </label>

          <input
            ref={fileInputRef}
            className="media-file-input"
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus"
            multiple
            onChange={addSongs}
            aria-label="Seleccionar archivos de audio"
          />
          <button className="secondary-button media-add-button" onClick={() => fileInputRef.current?.click()}>
            <FolderOpen size={16} /> Añadir audio
          </button>

          <div className="media-playlist">
            {filteredSongs.map(({ file, index }) => (
              <button
                key={`${file.name}-${file.lastModified}-${index}`}
                className={`playlist-item${!selectedOnlineTrack && selectedIndex === index ? ' selected' : ''}`}
                onClick={() => selectSong(index)}
                aria-current={!selectedOnlineTrack && selectedIndex === index ? 'true' : undefined}
              >
                <span className="playlist-number">{!selectedOnlineTrack && selectedIndex === index && playing ? <span className="playing-bars"><i /><i /><i /></span> : <Music2 size={14} />}</span>
                <span className="playlist-song"><strong>{getSongTitle(file.name)}</strong><small>{file.name}</small></span>
              </button>
            ))}
            {songs.length === 0 && <p className="media-empty">Añade archivos si quieres reproducir música guardada en tu dispositivo.</p>}
            {songs.length > 0 && filteredSongs.length === 0 && <p className="media-empty">No se encontraron archivos con esa búsqueda.</p>}
          </div>
        </article>
      </div>

      <SeccionVideos isVideoPlayerLocked={isVideoPlayerLocked} />
    </section>
  )
}
