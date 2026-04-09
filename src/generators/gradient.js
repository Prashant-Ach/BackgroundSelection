'use strict'

/**
 * Gradient generator — linear, radial, conic, mesh
 * Supports multi-stop color arrays or { pos, color } stop objects
 */

function applyGradient(ctx, width, height, options = {}) {
  const {
    type = 'linear',
    stops = ['#000000', '#ffffff'],
    angle = 135,
    opacity = 1,
    centerX = 0.5,
    centerY = 0.5,
    blendMode = 'source-over',
  } = options

  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity))
  ctx.globalCompositeOperation = blendMode

  switch (type) {
    case 'linear':   return _linear(ctx, width, height, stops, angle), ctx.restore()
    case 'radial':   return _radial(ctx, width, height, stops, centerX, centerY), ctx.restore()
    case 'conic':    return _conic(ctx, width, height, stops, centerX, centerY), ctx.restore()
    case 'diagonal': return _linear(ctx, width, height, stops, 45), ctx.restore()
    case 'mesh':     return _mesh(ctx, width, height, options.colors || stops), ctx.restore()
    default:         return _linear(ctx, width, height, stops, angle), ctx.restore()
  }
}

function _linear(ctx, width, height, stops, angle) {
  const rad = (angle * Math.PI) / 180
  const cx = width / 2
  const cy = height / 2
  const len = Math.sqrt(width * width + height * height) / 2
  const x1 = cx - Math.cos(rad) * len
  const y1 = cy - Math.sin(rad) * len
  const x2 = cx + Math.cos(rad) * len
  const y2 = cy + Math.sin(rad) * len

  const grad = ctx.createLinearGradient(x1, y1, x2, y2)
  _addStops(grad, stops)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)
}

function _radial(ctx, width, height, stops, cx, cy) {
  const x = width * cx
  const y = height * cy
  const r = Math.sqrt(width * width + height * height) * 0.6

  const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
  _addStops(grad, stops)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)
}

function _conic(ctx, width, height, stops, cx, cy) {
  const x = width * cx
  const y = height * cy
  const r = Math.sqrt(width * width + height * height)
  const STEPS = 720

  for (let i = 0; i < STEPS; i++) {
    const t = i / STEPS
    const a1 = t * Math.PI * 2 - Math.PI / 2
    const a2 = ((i + 1) / STEPS) * Math.PI * 2 - Math.PI / 2

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r)
    ctx.lineTo(x + Math.cos(a2) * r, y + Math.sin(a2) * r)
    ctx.closePath()
    ctx.fillStyle = _interpolateStops(stops, t)
    ctx.fill()
  }
}

function _mesh(ctx, width, height, colors) {
  // 2x2 mesh gradient via 4 corner radial blends
  const corners = [
    { x: 0,     y: 0,      color: colors[0] || '#000' },
    { x: width, y: 0,      color: colors[1] || '#000' },
    { x: 0,     y: height, color: colors[2] || '#000' },
    { x: width, y: height, color: colors[3] || '#000' },
  ]

  const r = Math.sqrt(width * width + height * height)

  corners.forEach(({ x, y, color }) => {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    const rgb = _hexToRgb(color)
    grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.85)`)
    grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`)
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  })

  ctx.globalCompositeOperation = 'source-over'
}

// --- helpers ---

function _addStops(gradient, stops) {
  stops.forEach((stop, i) => {
    if (typeof stop === 'string') {
      gradient.addColorStop(i / Math.max(stops.length - 1, 1), stop)
    } else {
      gradient.addColorStop(stop.pos ?? i / Math.max(stops.length - 1, 1), stop.color)
    }
  })
}

function _interpolateStops(stops, t) {
  const normalized = stops.map((s, i) => ({
    pos: typeof s === 'string' ? i / Math.max(stops.length - 1, 1) : (s.pos ?? i / Math.max(stops.length - 1, 1)),
    color: typeof s === 'string' ? s : s.color,
  }))

  for (let i = 0; i < normalized.length - 1; i++) {
    const a = normalized[i]
    const b = normalized[i + 1]
    if (t >= a.pos && t <= b.pos) {
      const frac = (t - a.pos) / (b.pos - a.pos)
      const ca = _hexToRgb(a.color)
      const cb = _hexToRgb(b.color)
      const r = Math.round(ca.r + (cb.r - ca.r) * frac)
      const g = Math.round(ca.g + (cb.g - ca.g) * frac)
      const b_ = Math.round(ca.b + (cb.b - ca.b) * frac)
      return `rgb(${r},${g},${b_})`
    }
  }
  return typeof stops[stops.length - 1] === 'string'
    ? stops[stops.length - 1]
    : stops[stops.length - 1].color
}

function _hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/**
 * Generate a CSS gradient string from options (for CSS export)
 */
function toCSSGradient(options = {}) {
  const { type = 'linear', stops = [], angle = 135, centerX = 0.5, centerY = 0.5 } = options

  const stopStr = stops.map((s, i) => {
    const color = typeof s === 'string' ? s : s.color
    const pos = typeof s === 'string'
      ? `${Math.round((i / Math.max(stops.length - 1, 1)) * 100)}%`
      : `${Math.round((s.pos ?? 0) * 100)}%`
    return `${color} ${pos}`
  }).join(', ')

  switch (type) {
    case 'linear':
      return `linear-gradient(${angle}deg, ${stopStr})`
    case 'radial':
      return `radial-gradient(circle at ${Math.round(centerX * 100)}% ${Math.round(centerY * 100)}%, ${stopStr})`
    case 'conic':
      return `conic-gradient(from 0deg at ${Math.round(centerX * 100)}% ${Math.round(centerY * 100)}%, ${stopStr})`
    default:
      return `linear-gradient(${angle}deg, ${stopStr})`
  }
}

module.exports = { applyGradient, toCSSGradient, _hexToRgb }
