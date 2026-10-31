import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getYouTubeEmbedUrl, getYouTubeVideoId } from './youtube.js'

const videoId = 'dQw4w9WgXcQ'

describe('getYouTubeVideoId', () => {
  it('accepts a video ID returned by YouTube Data API', () => {
    assert.equal(getYouTubeVideoId(videoId), videoId)
  })

  it('extracts IDs from standard, short, embed, shorts, and live URLs', () => {
    const links = [
      `https://www.youtube.com/watch?v=${videoId}&list=PL123`,
      `https://youtu.be/${videoId}?si=share`,
      `https://youtube.com/embed/${videoId}`,
      `https://m.youtube.com/shorts/${videoId}`,
      `https://www.youtube.com/live/${videoId}?feature=share`,
      `https://www.youtube.com/attribution_link?u=%2Fwatch%3Fv%3D${videoId}`,
    ]

    for (const link of links) assert.equal(getYouTubeVideoId(link), videoId)
  })

  it('rejects non-YouTube hosts and malformed IDs', () => {
    assert.equal(getYouTubeVideoId(`https://example.com/watch?v=${videoId}`), null)
    assert.equal(getYouTubeVideoId('https://youtu.be/short'), null)
    assert.equal(getYouTubeVideoId('https://www.youtube.com/attribution_link?u=http%3A%2F%2F%5B'), null)
    assert.equal(getYouTubeVideoId('not a video URL'), null)
  })
})

describe('getYouTubeEmbedUrl', () => {
  it('creates an official embed URL with the API and origin parameters', () => {
    const url = new URL(getYouTubeEmbedUrl(videoId, 'https://autodash.example'))

    assert.equal(url.origin, 'https://www.youtube.com')
    assert.equal(url.pathname, `/embed/${videoId}`)
    assert.equal(url.searchParams.get('enablejsapi'), '1')
    assert.equal(url.searchParams.get('origin'), 'https://autodash.example')
    assert.equal(url.searchParams.get('playsinline'), '1')
  })
})
