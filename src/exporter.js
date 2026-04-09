'use strict'

/**
 * Exporter — PNG, JPG, WebP, base64, CSS background string
 * sharp is used for format conversion and compression when available
 */

const fs = require('fs')
const path = require('path')
const { toCSSGradient } = require('./generators/gradient')

let sharp
try { sharp = require('sharp') } catch (_) { sharp = null }

/**
 * Export canvas to various formats
 *
 * @param {Canvas} canvas   node-canvas Canvas instance
 * @param {object} options
 *   format   — 'png' | 'jpg' | 'webp'  (default: 'png')
 *   path     — file path to write (optional)
 *   quality  — 1-100 for jpg/webp (default: 90)
 * @returns {{ buffer, base64, dataUrl, path? }}
 */
async function exportAs(canvas, options = {}) {
  const { format = 'png', path: outPath, quality = 90 } = options

  // @napi-rs/canvas uses .encode(); node-canvas uses .toBuffer()
  const pngBuffer = typeof canvas.encode === 'function'
    ? await canvas.encode('png')
    : canvas.toBuffer('image/png')

  let buffer
  let mime

  if (format === 'jpg' || format === 'jpeg') {
    mime = 'image/jpeg'
    buffer = sharp
      ? await sharp(pngBuffer).jpeg({ quality, mozjpeg: true }).toBuffer()
      : (typeof canvas.encode === 'function'
          ? await canvas.encode('jpeg')
          : canvas.toBuffer('image/jpeg', { quality: quality / 100 }))
  } else if (format === 'webp') {
    mime = 'image/webp'
    buffer = sharp
      ? await sharp(pngBuffer).webp({ quality }).toBuffer()
      : (typeof canvas.encode === 'function'
          ? await canvas.encode('webp')
          : (() => { throw new Error('sharp required for WebP without @napi-rs/canvas') })())
  } else {
    mime = 'image/png'
    buffer = sharp
      ? await sharp(pngBuffer).png({ compressionLevel: 8 }).toBuffer()
      : pngBuffer
  }

  if (outPath) {
    const dir = path.dirname(outPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(outPath, buffer)
  }

  const base64 = buffer.toString('base64')
  const dataUrl = `${mime};base64,${base64}`

  return {
    buffer,
    base64,
    dataUrl: `data:${dataUrl}`,
    ...(outPath ? { path: path.resolve(outPath) } : {}),
  }
}

/**
 * Export multiple sizes in one call
 *
 * @param {Canvas} canvas
 * @param {Array<{ name, width, height, path? }>} sizes
 * @param {object} options  — format, quality
 */
async function exportSizes(canvas, sizes, options = {}) {
  if (!sharp) throw new Error('sharp is required for multi-size export. Run: npm install sharp')
  const { format = 'png', quality = 90 } = options
  const srcBuffer = typeof canvas.encode === 'function'
    ? await canvas.encode('png')
    : canvas.toBuffer('image/png')

  const results = []
  for (const size of sizes) {
    let s = sharp(srcBuffer).resize(size.width, size.height, { fit: 'fill' })
    if (format === 'jpg' || format === 'jpeg') s = s.jpeg({ quality, mozjpeg: true })
    else if (format === 'webp') s = s.webp({ quality })
    else s = s.png({ compressionLevel: 8 })

    const buf = await s.toBuffer()

    if (size.path) {
      const dir = path.dirname(size.path)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(size.path, buf)
    }

    results.push({
      name: size.name,
      width: size.width,
      height: size.height,
      buffer: buf,
      base64: buf.toString('base64'),
      ...(size.path ? { path: path.resolve(size.path) } : {}),
    })
  }

  return results
}

/**
 * Export as CSS background string
 *
 * @param {Array<object>} layers  — layer config objects from TextureGen
 * @returns {string}  CSS background property value (multiple layers)
 */
function exportCSS(layers = []) {
  const cssParts = []

  for (const layer of layers) {
    if (layer.type === 'gradient' && layer.options) {
      cssParts.push(toCSSGradient(layer.options))
    }
    // noise/geometry/effects can't be expressed as CSS, skip
  }

  if (cssParts.length === 0) return ''
  return `background: ${cssParts.join(',\n  ')};`
}

// Pre-built banner size presets
const BANNER_SIZES = {
  'app-store':    { width: 1024, height: 500,  name: 'App Store Feature' },
  'play-store':   { width: 1024, height: 500,  name: 'Play Store Feature' },
  'og-image':     { width: 1200, height: 630,  name: 'OG / Social Share' },
  'twitter':      { width: 1500, height: 500,  name: 'Twitter Header' },
  'linkedin':     { width: 1584, height: 396,  name: 'LinkedIn Banner' },
  'youtube':      { width: 2560, height: 1440, name: 'YouTube Channel Art' },
  'facebook':     { width: 820,  height: 312,  name: 'Facebook Cover' },
  'wallpaper-hd': { width: 1920, height: 1080, name: 'HD Wallpaper' },
  'wallpaper-4k': { width: 3840, height: 2160, name: '4K Wallpaper' },
  'wallpaper-mobile': { width: 1080, height: 1920, name: 'Mobile Wallpaper' },
}

module.exports = { exportAs, exportSizes, exportCSS, BANNER_SIZES }
