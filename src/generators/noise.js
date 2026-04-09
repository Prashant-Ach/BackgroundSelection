'use strict'

/**
 * Noise texture generator
 * Implements: Perlin noise, fractal Brownian motion (fBm), Voronoi/cellular noise
 * No external dependencies — pure JS implementation
 */

// ---------------------------------------------------------------------------
// Perlin noise core (classic 2D)
// ---------------------------------------------------------------------------

class PerlinNoise {
  constructor(seed = 0) {
    this._perm = new Uint8Array(512)
    this._init(seed)
  }

  _init(seed) {
    const p = Array.from({ length: 256 }, (_, i) => i)
    // deterministic shuffle via LCG
    let s = (seed * 1664525 + 1013904223) >>> 0
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0
      const j = s % (i + 1)
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    for (let i = 0; i < 512; i++) this._perm[i] = p[i & 255]
  }

  _grad(hash, x, y) {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
  }

  _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10) }
  _lerp(a, b, t) { return a + t * (b - a) }

  get(x, y) {
    const xi = Math.floor(x) & 255
    const yi = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const u = this._fade(xf)
    const v = this._fade(yf)

    const aa = this._perm[this._perm[xi    ] + yi    ]
    const ab = this._perm[this._perm[xi    ] + yi + 1]
    const ba = this._perm[this._perm[xi + 1] + yi    ]
    const bb = this._perm[this._perm[xi + 1] + yi + 1]

    return this._lerp(
      this._lerp(this._grad(aa, xf,     yf    ), this._grad(ba, xf - 1, yf    ), u),
      this._lerp(this._grad(ab, xf,     yf - 1), this._grad(bb, xf - 1, yf - 1), u),
      v
    )
  }

  /** Fractal Brownian Motion — layered octaves for more organic texture */
  fbm(x, y, { octaves = 4, lacunarity = 2.0, gain = 0.5 } = {}) {
    let value = 0
    let amplitude = 0.5
    let frequency = 1
    for (let i = 0; i < octaves; i++) {
      value += this.get(x * frequency, y * frequency) * amplitude
      amplitude *= gain
      frequency *= lacunarity
    }
    // normalize to roughly [0, 1]
    return value * 0.5 + 0.5
  }
}

// ---------------------------------------------------------------------------
// Voronoi / cellular noise
// ---------------------------------------------------------------------------

function voronoi(x, y, seed = 0) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  let minDist = Infinity

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = xi + dx
      const cy = yi + dy
      // deterministic point per cell
      const px = cx + _hash2(cx, cy, seed)
      const py = cy + _hash2(cx, cy, seed + 1)
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
      if (dist < minDist) minDist = dist
    }
  }
  return Math.min(minDist, 1)
}

function _hash2(x, y, seed) {
  let h = (x * 1619 + y * 31337 + seed * 1234567) >>> 0
  h = ((h >>> 16) ^ h) * 0x45d9f3b >>> 0
  h = ((h >>> 16) ^ h) * 0x45d9f3b >>> 0
  h = (h >>> 16) ^ h
  return (h & 0xFFFF) / 0xFFFF
}

// ---------------------------------------------------------------------------
// Canvas renderer
// ---------------------------------------------------------------------------

function applyNoise(ctx, width, height, options = {}) {
  const {
    type = 'perlin',
    scale = 4,
    opacity = 0.5,
    octaves = 4,
    color = null,        // null = grayscale; '#hex' = tinted
    colorB = null,       // second color for 2-color blend
    invert = false,
    seed = 0,
    blendMode = 'source-over',
  } = options

  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity))
  ctx.globalCompositeOperation = blendMode

  const imageData = ctx.createImageData(width, height)
  const data = imageData.data
  const perlin = new PerlinNoise(seed)

  const rgbA = color ? _hexToRgb(color) : null
  const rgbB = colorB ? _hexToRgb(colorB) : null

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * scale
      const ny = (y / height) * scale

      let v
      switch (type) {
        case 'fbm':
          v = perlin.fbm(nx, ny, { octaves })
          break
        case 'voronoi':
          v = voronoi(nx, ny, seed)
          break
        case 'ridged':
          v = 1 - Math.abs(perlin.get(nx, ny) * 2)
          v = Math.max(0, Math.min(1, v))
          break
        case 'turbulence':
          v = _turbulence(perlin, nx, ny, octaves)
          break
        default: // 'perlin'
          v = perlin.get(nx, ny) * 0.5 + 0.5
      }

      if (invert) v = 1 - v
      v = Math.max(0, Math.min(1, v))

      const idx = (y * width + x) * 4
      if (rgbA && rgbB) {
        data[idx    ] = Math.round(rgbA.r + (rgbB.r - rgbA.r) * v)
        data[idx + 1] = Math.round(rgbA.g + (rgbB.g - rgbA.g) * v)
        data[idx + 2] = Math.round(rgbA.b + (rgbB.b - rgbA.b) * v)
      } else if (rgbA) {
        data[idx    ] = rgbA.r
        data[idx + 1] = rgbA.g
        data[idx + 2] = rgbA.b
      } else {
        const c = Math.round(v * 255)
        data[idx] = data[idx + 1] = data[idx + 2] = c
      }
      data[idx + 3] = 255
    }
  }

  // putImageData ignores globalAlpha / globalCompositeOperation, so we
  // write the pixels to a temp canvas first, then drawImage onto main canvas.
  const { createCanvas } = require('@napi-rs/canvas')
  const tmp = createCanvas(width, height)
  tmp.getContext('2d').putImageData(imageData, 0, 0)

  ctx.drawImage(tmp, 0, 0)
  ctx.restore()
}

function _turbulence(perlin, x, y, octaves) {
  let v = 0
  let amplitude = 0.5
  let frequency = 1
  for (let i = 0; i < octaves; i++) {
    v += Math.abs(perlin.get(x * frequency, y * frequency)) * amplitude
    amplitude *= 0.5
    frequency *= 2
  }
  return Math.min(v, 1)
}

function _hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

module.exports = { applyNoise, PerlinNoise, voronoi }
