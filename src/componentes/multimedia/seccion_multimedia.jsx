import { Bluetooth, ChevronLeft, ChevronRight, Music2, Pause, Play, Volume2 } from 'lucide-react'
import './multimedia.css'

export function SeccionMultimedia({ track, setTrack, playing, setPlaying }) {
  const playlist = ['Ruta de mañana', 'Kilómetros de calma', 'Camino abierto']

  return (
    <section className="module-page media-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> CENTRO MULTIMEDIA</div>
          <h1>Multimedia<span>.</span></h1>
          <p>Controla la reproducción de audio desde tu panel.</p>
        </div>
        <span className="board-count"><Bluetooth size={15} /> Audio local</span>
      </div>

      <div className="media-layout">
        <article className="panel media-player">
          <div className="album-art">
            <span className="album-sun" />
            <span className="album-horizon" />
            <span className="album-disc"><Music2 size={26} /></span>
            <small>A U T O D A S H&nbsp; R A D I O</small>
          </div>

          <div className="track-info">
            <span className="section-kicker">LISTA DE DEMOSTRACIÓN</span>
            <h2>{playlist[track]}</h2>
            <p>AutoDash Radio · Reproducción de muestra</p>
          </div>

          <div className="audio-progress"><span /><i /></div>
          <div className="audio-times"><span>1:24</span><span>4:08</span></div>

          <div className="player-controls">
            <button className="icon-button" aria-label="Pista anterior" onClick={() => setTrack((track + 2) % 3)}>
              <ChevronLeft size={20} />
            </button>
            <button className="play-button" aria-label={playing ? 'Pausar' : 'Reproducir'} onClick={() => setPlaying(!playing)}>
              {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button className="icon-button" aria-label="Pista siguiente" onClick={() => setTrack((track + 1) % 3)}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="volume-control">
            <Volume2 size={16} />
            <input type="range" aria-label="Volumen" min="0" max="100" defaultValue="65" />
          </div>

          <p className="media-disclaimer">Controles de interfaz demostrativos. Para reproducir audio real, conecta una fuente multimedia.</p>
        </article>

        <article className="panel playlist-panel">
          <div className="section-title">
            <div><span className="section-kicker">TU SELECCIÓN</span><h2>Reproducir después</h2></div>
            <span className="playlist-count">03 pistas</span>
          </div>

          {playlist.map((name, index) => (
            <button key={name} className={`playlist-item${track === index ? ' selected' : ''}`} onClick={() => { setTrack(index); setPlaying(true) }}>
              <span className="playlist-number">{track === index && playing ? <span className="playing-bars"><i /><i /><i /></span> : `0${index + 1}`}</span>
              <span className="playlist-song"><strong>{name}</strong><small>AutoDash Radio</small></span>
              <span className="playlist-duration">4:08</span>
            </button>
          ))}
        </article>
      </div>
    </section>
  )
}
