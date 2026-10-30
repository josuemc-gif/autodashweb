import { useEffect, useState } from 'react'
import { LockKeyhole, Search, Video } from 'lucide-react'

const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY

const videoPlayerStyles = `
  .media-tools { display: grid; gap: 13px; margin-top: 13px; }
  .media-panel { min-width: 0; padding: 16px; }
  .media-panel-heading { margin-bottom: 12px; }
  .media-panel-heading h2 { margin-top: 4px; font-family: var(--display); font-size: 15px; }
  .media-panel-heading p { margin-top: 4px; color: var(--ink-faint); font-size: 11px; line-height: 1.5; }
  .youtube-search-form { display: flex; gap: 8px; }
  .youtube-search-input { width: 100%; min-width: 0; min-height: 44px; border: 1px solid var(--line); border-radius: 5px; background: var(--surface, white); padding: 0 12px; color: var(--ink); font: inherit; font-size: 13px; }
  .youtube-search-button { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 5px; background: var(--teal); padding: 0 15px; color: white; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
  .youtube-search-button:disabled, .youtube-result:disabled { cursor: not-allowed; opacity: .55; }
  .youtube-key-notice, .youtube-status, .youtube-error, .media-lock { margin: 10px 0 0; border-radius: 5px; padding: 10px 12px; font-size: 11px; line-height: 1.5; }
  .youtube-key-notice { background: #fff8ed; color: #765c37; }
  .youtube-status { color: var(--ink-faint); }
  .youtube-error { background: #fff0ef; color: #8d3932; }
  .youtube-results { display: grid; gap: 8px; margin-top: 12px; }
  .youtube-result { display: flex; width: 100%; min-width: 0; align-items: center; gap: 12px; border: 1px solid var(--line); border-radius: 5px; background: transparent; padding: 8px; text-align: left; cursor: pointer; }
  .youtube-result:hover:not(:disabled), .youtube-result.selected { border-color: var(--teal); background: var(--surface, white); }
  .youtube-thumbnail { width: 120px; aspect-ratio: 16 / 9; flex: 0 0 auto; border-radius: 3px; background: #e9efec; object-fit: cover; }
  .youtube-result-copy { display: grid; min-width: 0; gap: 5px; }
  .youtube-result-copy strong { overflow: hidden; color: var(--ink); font-size: 12px; line-height: 1.4; text-overflow: ellipsis; }
  .youtube-result-copy small { overflow: hidden; color: var(--ink-faint); font-size: 10px; text-overflow: ellipsis; }
  .youtube-player-frame { position: relative; display: grid; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; place-items: center; border-radius: 5px; background: #111817; }
  .youtube-player-preview { display: block; width: 100%; height: 100%; object-fit: cover; }
  .youtube-player-caption { position: absolute; right: 0; bottom: 0; left: 0; background: linear-gradient(transparent, rgb(0 0 0 / 80%)); padding: 28px 12px 10px; color: white; font-size: 12px; }
  .youtube-player-empty { display: grid; justify-items: center; gap: 10px; padding: 20px; color: #d3ddda; text-align: center; }
  .youtube-player-empty p { margin: 0; font-size: 13px; }
  .youtube-selected-title { margin: 10px 0 0; color: var(--ink); font-size: 13px; font-weight: 600; line-height: 1.5; }
  .youtube-open-link { display: inline-flex; min-height: 40px; align-items: center; justify-content: center; margin-top: 10px; border-radius: 5px; background: var(--teal); padding: 0 12px; color: white; font-size: 12px; font-weight: 600; text-decoration: none; }
  .youtube-open-link:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
  .media-lock { display: flex; align-items: center; gap: 8px; background: #fff4e5; color: #765c37; }
  .youtube-search-button:focus-visible, .youtube-search-input:focus-visible, .youtube-result:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
  @media (max-width: 600px) {
    .media-panel { padding: 12px; }
    .youtube-search-form { align-items: stretch; flex-direction: column; }
    .youtube-search-button { width: 100%; }
    .youtube-thumbnail { width: 96px; }
  }
`

export function SeccionVideos({ isVideoPlayerLocked = false }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchRevision, setSearchRevision] = useState(0)
  const [searchResults, setSearchResults] = useState([])
  const [searchStatus, setSearchStatus] = useState('idle')
  const [searchError, setSearchError] = useState('')
  const [selectedYouTubeVideo, setSelectedYouTubeVideo] = useState(null)

  useEffect(() => {
    const query = searchQuery.trim()
    if (isVideoPlayerLocked || !query || !youtubeApiKey) return undefined

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setSearchStatus('loading')
      setSearchError('')

      try {
        const parameters = new URLSearchParams({
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: '10',
          key: youtubeApiKey,
        })
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${parameters}`, {
          signal: controller.signal,
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || `La búsqueda falló (HTTP ${response.status}).`)
        }

        const results = (data.items || [])
          .filter((item) => item.id?.videoId && item.snippet)
          .map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
          }))
        setSearchResults(results)
        setSearchStatus(results.length ? 'success' : 'empty')
      } catch (error) {
        if (error.name === 'AbortError') return
        setSearchStatus('error')
        setSearchError(error.message || 'No se pudo conectar con YouTube. Inténtalo de nuevo.')
      }
    }, 450)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [searchQuery, searchRevision, isVideoPlayerLocked])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    if (isVideoPlayerLocked) return
    setSearchResults([])
    setSearchStatus('waiting')
    setSearchQuery((query) => query.trim())
    setSearchRevision((revision) => revision + 1)
  }

  const handleSearchChange = (event) => {
    setSearchQuery(event.currentTarget.value)
    setSearchResults([])
    setSearchError('')
    setSearchStatus(event.currentTarget.value.trim() ? 'waiting' : 'idle')
  }

  const handleYouTubeSelection = (result) => {
    if (isVideoPlayerLocked) return
    setSelectedYouTubeVideo(result)
  }

  const missingApiKey = Boolean(searchQuery.trim()) && !youtubeApiKey && !isVideoPlayerLocked
  const visibleSearchError = missingApiKey
    ? 'Configura VITE_YOUTUBE_API_KEY en el entorno de Vite para habilitar la búsqueda.'
    : searchError

  return (
    <>
      <style>{videoPlayerStyles}</style>
      {isVideoPlayerLocked && (
        <p className="media-lock" role="alert">
          <LockKeyhole size={16} />
          Multimedia bloqueada por el sistema de seguridad.
        </p>
      )}

      <div className="media-tools">
        <article className="panel media-panel">
          <div className="media-panel-heading">
            <span className="section-kicker">BÚSQUEDA DE YOUTUBE</span>
            <h2>Encuentra un video</h2>
            <p>Los resultados se cargan desde YouTube Data API v3.</p>
          </div>

          <form className="youtube-search-form" onSubmit={handleSearchSubmit}>
            <input
              className="youtube-search-input"
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Busca una canción o un video"
              aria-label="Buscar videos de YouTube"
              disabled={isVideoPlayerLocked}
            />
            <button
              className="youtube-search-button"
              type="submit"
              disabled={isVideoPlayerLocked || !searchQuery.trim()}
            >
              <Search size={16} />
              Buscar
            </button>
          </form>

          {!youtubeApiKey && (
            <p className="youtube-key-notice" role="note">
              Para habilitar la búsqueda, configura VITE_YOUTUBE_API_KEY en el entorno de Vite. Si se usa en el navegador, la clave será visible para los usuarios.
            </p>
          )}
          {!isVideoPlayerLocked && searchStatus === 'waiting' && <p className="youtube-status" role="status">Esperando para buscar…</p>}
          {!isVideoPlayerLocked && searchStatus === 'loading' && <p className="youtube-status" role="status">Buscando videos…</p>}
          {searchStatus === 'empty' && <p className="youtube-status" role="status">No se encontraron videos. Prueba otra búsqueda.</p>}
          {(searchStatus === 'error' || missingApiKey) && <p className="youtube-error" role="alert">{visibleSearchError}</p>}

          {searchResults.length > 0 && (
            <div className="youtube-results" aria-label="Resultados de búsqueda">
              {searchResults.map((result) => (
                <button
                  className={`youtube-result${selectedYouTubeVideo?.id === result.id ? ' selected' : ''}`}
                  key={result.id}
                  type="button"
                  disabled={isVideoPlayerLocked}
                  onClick={() => handleYouTubeSelection(result)}
                >
                  {result.thumbnail && <img className="youtube-thumbnail" src={result.thumbnail} alt="" loading="lazy" />}
                  <span className="youtube-result-copy">
                    <strong>{result.title}</strong>
                    <small>{result.channel}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="panel media-panel">
          <div className="media-panel-heading">
            <span className="section-kicker">REPRODUCCIÓN EN YOUTUBE</span>
            <h2>{selectedYouTubeVideo ? 'Video seleccionado' : 'Elige un video'}</h2>
          </div>
          <div className="youtube-player-frame">
            {selectedYouTubeVideo ? (
              selectedYouTubeVideo.thumbnail ? (
                <>
                  <img className="youtube-player-preview" src={selectedYouTubeVideo.thumbnail} alt="" />
                  <span className="youtube-player-caption">El video se abrirá en YouTube.</span>
                </>
              ) : (
                <div className="youtube-player-empty">
                  <Video size={28} aria-hidden="true" />
                  <p>Vista previa no disponible.</p>
                </div>
              )
            ) : (
              <div className="youtube-player-empty">
                <Video size={28} aria-hidden="true" />
                <p>Busca y selecciona un video para abrirlo en YouTube.</p>
              </div>
            )}
          </div>
          {selectedYouTubeVideo && <p className="youtube-selected-title">{selectedYouTubeVideo.title}</p>}
          {selectedYouTubeVideo && !isVideoPlayerLocked && (
            <a
              className="youtube-open-link"
              href={`https://www.youtube.com/watch?v=${encodeURIComponent(selectedYouTubeVideo.id)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Reproducir en YouTube
            </a>
          )}
          {isVideoPlayerLocked && (
            <p className="youtube-status" role="note">
              La aplicación bloquea las búsquedas y selecciones de videos.
            </p>
          )}
        </article>
      </div>
    </>
  )
}
