'use strict'

/**
 * Geometric pattern generator
 * Types: grid, hex, triangles, dots, circles, diagonal-lines, cross-hatch,
 *        chevron, diamonds, truchet
 */

function applyGeometry(ctx, width, height, options = {}) {
  const {
    type = 'grid',
    size = 40,
    color = '#ffffff',
    opacity = 0.15,
    lineWidth = 1,
    filled = false,
    angle = 0,
    blendMode = 'source-over',
  } = options

  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity))
  ctx.globalCompositeOperation = blendMode
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lineWidth

  switch (type) {
    case 'grid':        _grid(ctx, width, height, size); break
    case 'hex':         _hex(ctx, width, height, size, filled); break
    case 'triangles':   _triangles(ctx, width, height, size, filled); break
    case 'dots':        _dots(ctx, width, height, size); break
    case 'circles':     _circles(ctx, width, height, size); break
    case 'lines':       _lines(ctx, width, height, size, angle); break
    case 'cross-hatch': _crosshatch(ctx, width, height, size); break
    case 'chevron':     _chevron(ctx, width, height, size); break
    case 'diamonds':    _diamonds(ctx, width, height, size, filled); break
    case 'truchet':     _truchet(ctx, width, height, size, options.seed || 0); break
  }

  ctx.restore()
}

// --- Grid ---
function _grid(ctx, width, height, size) {
  ctx.beginPath()
  for (let x = 0; x <= width; x += size) {
    ctx.moveTo(x, 0); ctx.lineTo(x, height)
  }
  for (let y = 0; y <= height; y += size) {
    ctx.moveTo(0, y); ctx.lineTo(width, y)
  }
  ctx.stroke()
}

// --- Hexagonal grid ---
function _hex(ctx, width, height, size, filled) {
  const w = size * 2
  const h = Math.sqrt(3) * size
  const cols = Math.ceil(width / (w * 0.75)) + 2
  const rows = Math.ceil(height / h) + 2

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const x = col * w * 0.75
      const y = row * h + (col % 2 === 0 ? 0 : h / 2)
      _hexPath(ctx, x, y, size)
      filled ? ctx.fill() : ctx.stroke()
    }
  }
}

function _hexPath(ctx, cx, cy, r) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
}

// --- Triangles ---
function _triangles(ctx, width, height, size, filled) {
  const h = (Math.sqrt(3) / 2) * size
  const rows = Math.ceil(height / h) + 1
  const cols = Math.ceil(width / size) + 1

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * size - (row % 2 === 0 ? 0 : size / 2)
      const y = row * h
      // upward triangle
      ctx.beginPath()
      ctx.moveTo(x, y + h)
      ctx.lineTo(x + size / 2, y)
      ctx.lineTo(x + size, y + h)
      ctx.closePath()
      filled ? ctx.fill() : ctx.stroke()
    }
  }
}

// --- Dot grid ---
function _dots(ctx, width, height, size) {
  const r = size * 0.08
  for (let y = size / 2; y < height + size; y += size) {
    for (let x = size / 2; x < width + size; x += size) {
      ctx.beginPath()
      ctx.arc(x, y, Math.max(r, 1.5), 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

// --- Circle rings ---
function _circles(ctx, width, height, size) {
  for (let y = size / 2; y < height + size; y += size) {
    for (let x = size / 2; x < width + size; x += size) {
      ctx.beginPath()
      ctx.arc(x, y, size * 0.4, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

// --- Diagonal lines ---
function _lines(ctx, width, height, size, angle) {
  const rad = (angle * Math.PI) / 180
  const diag = Math.sqrt(width * width + height * height)
  const cx = width / 2
  const cy = height / 2

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rad)

  const start = -diag
  const end = diag
  ctx.beginPath()
  for (let x = start; x <= end; x += size) {
    ctx.moveTo(x, -diag)
    ctx.lineTo(x, diag)
  }
  ctx.stroke()
  ctx.restore()
}

// --- Cross-hatch ---
function _crosshatch(ctx, width, height, size) {
  _lines(ctx, width, height, size, 45)
  _lines(ctx, width, height, size, -45)
}

// --- Chevron ---
function _chevron(ctx, width, height, size) {
  const rows = Math.ceil(height / size) + 2
  const cols = Math.ceil(width / size) + 2

  ctx.beginPath()
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const x = col * size
      const y = row * size * 1.2
      ctx.moveTo(x, y + size * 0.6)
      ctx.lineTo(x + size / 2, y)
      ctx.lineTo(x + size, y + size * 0.6)
    }
  }
  ctx.stroke()
}

// --- Diamonds ---
function _diamonds(ctx, width, height, size, filled) {
  const half = size / 2
  const cols = Math.ceil(width / size) + 2
  const rows = Math.ceil(height / size) + 2

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const x = col * size + (row % 2 === 0 ? 0 : half)
      const y = row * size

      ctx.beginPath()
      ctx.moveTo(x + half, y)
      ctx.lineTo(x + size, y + half)
      ctx.lineTo(x + half, y + size)
      ctx.lineTo(x, y + half)
      ctx.closePath()
      filled ? ctx.fill() : ctx.stroke()
    }
  }
}

// --- Truchet tiles (randomized quarter-circle connectors) ---
function _truchet(ctx, width, height, size, seed) {
  const cols = Math.ceil(width / size) + 1
  const rows = Math.ceil(height / size) + 1
  let s = (seed * 1664525 + 1013904223) >>> 0

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      s = (s * 1664525 + 1013904223) >>> 0
      const flip = (s & 1) === 0
      const x = col * size
      const y = row * size

      ctx.beginPath()
      if (flip) {
        ctx.arc(x,        y,        size / 2, 0,          Math.PI / 2)
        ctx.moveTo(x + size, y + size / 2)
        ctx.arc(x + size, y + size, size / 2, Math.PI,    Math.PI * 1.5)
      } else {
        ctx.arc(x + size, y,        size / 2, Math.PI / 2, Math.PI)
        ctx.moveTo(x + size / 2, y + size)
        ctx.arc(x,        y + size, size / 2, 0,           -Math.PI / 2, true)
      }
      ctx.stroke()
    }
  }
}

module.exports = { applyGeometry }
