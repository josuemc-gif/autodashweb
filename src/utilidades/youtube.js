const videoIdPattern = /^[A-Za-z0-9_-]{11}$/
const youtubeHosts = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'www.youtu.be',
])

export function getYouTubeVideoId(value) {
  if (typeof value !== 'string') return null

  const candidate = value.trim()
  if (videoIdPattern.test(candidate)) return candidate

  let url
  try {
    url = new URL(candidate)
  } catch {
    return null
  }

  if (!youtubeHosts.has(url.hostname.toLowerCase())) return null

  const segments = url.pathname.split('/').filter(Boolean)
  let videoId

  if (url.hostname.endsWith('youtu.be')) {
    videoId = segments[0]
  } else if (segments[0] === 'watch') {
    videoId = url.searchParams.get('v')
  } else if (segments[0] === 'attribution_link') {
    const destination = url.searchParams.get('u')
    if (!destination) return null
    try {
      return getYouTubeVideoId(new URL(destination, url.origin).href)
    } catch {
      return null
    }
  } else if (['embed', 'shorts', 'live', 'v'].includes(segments[0])) {
    videoId = segments[1]
  }

  return videoIdPattern.test(videoId || '') ? videoId : null
}

export function getYouTubeEmbedUrl(videoId, origin) {
  const normalizedId = getYouTubeVideoId(videoId)
  if (!normalizedId) throw new Error('El identificador del video de YouTube no es válido.')

  const parameters = new URLSearchParams({
    enablejsapi: '1',
    origin,
    playsinline: '1',
    rel: '0',
  })

  return `https://www.youtube.com/embed/${normalizedId}?${parameters}`
}
