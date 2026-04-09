'use strict'

const { createCanvas } = require('@napi-rs/canvas')

/**
 * Post-processing effects
 * grain, vignette, glow, blur, duotone, scanlines, chromatic aberration
 *
 * NOTE: putImageData ignores globalAlpha / globalCompositeOperation.
 * Any effect that uses pixel manipulation draws to a temp canvas first,
 * then composites onto the main canvas via drawImage.
 */

// ---------------------------------------------------------------------------
// Grain — randomized pixel noise overlaid on canvas
// ---------------------------------------------------------------------------
function applyGrain(ctx, width, height, options = {}) {
  const {
    intensity = 0.15,
    monochrome = true,
    blendMode = 'overlay',
  } = options

  const tmp  = createCanvas(width, height)
  const tctx = tmp.getContext('2d')
  const imageData = tctx.createImageData(width, height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    if (monochrome) {
      const v = (Math.random() * 2 - 1) * intensity * 255
      data[i] = data[i + 1] = data[i + 2] = Math.round(128 + v)
    } else {
      data[i    ] = Math.round(128 + (Math.random() * 2 - 1) * intensity * 255)
      data[i + 1] = Math.round(128 + (Math.random() * 2 - 1) * intensity * 255)
      data[i + 2] = Math.round(128 + (Math.random() * 2 - 1) * intensity * 255)
    }
    data[i + 3] = Math.round(intensity * 180)
  }

  tctx.putImageData(imageData, 0, 0)

  ctx.save()
  ctx.globalCompositeOperation = blendMode
  ctx.drawImage(tmp, 0, 0)
  ctx.restore()
}

// ---------------------------------------------------------------------------
// Vignette — dark radial falloff toward edges
// ---------------------------------------------------------------------------
function applyVignette(ctx, width, height, options = {}) {
  const {
    strength = 0.6,
    color = '#000000',
    feather = 0.5,     // 0 = hard edge, 1 = very soft
    shape = 'ellipse', // 'ellipse' | 'square'
    blendMode = 'source-over',
  } = options

  const cx = width / 2
  const cy = height / 2
  const rx = cx * (1 + feather)
  const ry = cy * (1 + feather)
  const r = Math.sqrt(rx * rx + ry * ry) * 0.85

  const rgb = _hexToRgb(color)

  ctx.save()
  ctx.globalCompositeOperation = blendMode

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  grad.addColorStop(0,   `rgba(${rgb.r},${rgb.g},${rgb.b},0)`)
  grad.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`)
  grad.addColorStop(1,   `rgba(${rgb.r},${rgb.g},${rgb.b},${strength})`)

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

// ---------------------------------------------------------------------------
// Glow — soft radial light bloom from a center point
// ---------------------------------------------------------------------------
function applyGlow(ctx, width, height, options = {}) {
  const {
    x = 0.5,
    y = 0.5,
    color = '#ffffff',
    radius = 0.5,     // fraction of image diagonal
    intensity = 0.4,
    blendMode = 'screen',
  } = options

  const cx = width * x
  const cy = height * y
  const diag = Math.sqrt(width * width + height * height)
  const r = diag * radius
  const rgb = _hexToRgb(color)

  ctx.save()
  ctx.globalCompositeOperation = blendMode

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  grad.addColorStop(0,   `rgba(${rgb.r},${rgb.g},${rgb.b},${intensity})`)
  grad.addColorStop(0.4, `rgba(${rgb.r},${rgb.g},${rgb.b},${intensity * 0.4})`)
  grad.addColorStop(1,   `rgba(${rgb.r},${rgb.g},${rgb.b},0)`)

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

// ---------------------------------------------------------------------------
// Blur — apply Gaussian blur (uses canvas filter API)
// NOTE: in node-canvas ctx.filter is supported since v2.x
// ---------------------------------------------------------------------------
function applyBlur(ctx, width, height, options = {}) {
  const { radius = 8 } = options
  // Capture current canvas, apply blur filter, redraw
  ctx.save()
  ctx.filter = `blur(${radius}px)`
  // Re-draw the current canvas onto itself with blur
  const tmp = ctx.canvas
  ctx.drawImage(tmp, 0, 0)
  ctx.filter = 'none'
  ctx.restore()
}

// ---------------------------------------------------------------------------
// Duotone — map luminance to two colors (shadow color → highlight color)
// ---------------------------------------------------------------------------
function applyDuotone(ctx, width, height, options = {}) {
  const {
    shadowColor  = '#1a1a2e',
    highlightColor = '#e94560',
    opacity = 1,
  } = options

  // Read existing canvas pixels, map to duotone, write back in-place
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const dark  = _hexToRgb(shadowColor)
  const light = _hexToRgb(highlightColor)

  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
    data[i    ] = Math.round(dark.r + (light.r - dark.r) * lum)
    data[i + 1] = Math.round(dark.g + (light.g - dark.g) * lum)
    data[i + 2] = Math.round(dark.b + (light.b - dark.b) * lum)
    data[i + 3] = Math.round(data[i + 3] * opacity)
  }

  // Use temp canvas to respect any compositing (duotone replaces directly)
  const tmp  = createCanvas(width, height)
  tmp.getContext('2d').putImageData(imageData, 0, 0)
  ctx.save()
  ctx.drawImage(tmp, 0, 0)
  ctx.restore()
}

// ---------------------------------------------------------------------------
// Scanlines — horizontal CRT-style stripes
// ---------------------------------------------------------------------------
function applyScanlines(ctx, width, height, options = {}) {
  const {
    spacing = 4,
    opacity = 0.12,
    color = '#000000',
    blendMode = 'multiply',
  } = options

  const rgb = _hexToRgb(color)
  ctx.save()
  ctx.globalCompositeOperation = blendMode
  ctx.globalAlpha = opacity
  ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`

  for (let y = 0; y < height; y += spacing) {
    ctx.fillRect(0, y, width, Math.max(1, spacing / 2))
  }
  ctx.restore()
}

// ---------------------------------------------------------------------------
// Chromatic aberration — split RGB channels slightly
// ---------------------------------------------------------------------------
function applyChromaticAberration(ctx, width, height, options = {}) {
  const { offset = 3, opacity = 0.6 } = options

  const imageData = ctx.getImageData(0, 0, width, height)
  const src = new Uint8ClampedArray(imageData.data)
  const dst = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4

      // Red channel shifted left
      const rx = Math.max(0, x - offset)
      const ri = (y * width + rx) * 4
      dst[i] = Math.round(dst[i] * (1 - opacity) + src[ri] * opacity)

      // Blue channel shifted right
      const bx = Math.min(width - 1, x + offset)
      const bi = (y * width + bx) * 4
      dst[i + 2] = Math.round(dst[i + 2] * (1 - opacity) + src[bi + 2] * opacity)
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

// ---------------------------------------------------------------------------
// helper
// ---------------------------------------------------------------------------
function _hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

module.exports = {
  applyGrain,
  applyVignette,
  applyGlow,
  applyBlur,
  applyDuotone,
  applyScanlines,
  applyChromaticAberration,
}
