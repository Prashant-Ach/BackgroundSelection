'use strict'

/**
 * TextureGen — fluent API for generating wallpapers, textures and banners
 *
 * Usage:
 *   const { TextureGen, PRESETS, BANNER_SIZES } = require('./src')
 *
 *   const gen = new TextureGen({ width: 1200, height: 630 })
 *   await gen
 *     .background('#0a0a0a')
 *     .gradient({ type: 'radial', stops: ['#6366f1', '#06070a'], centerX: 0.3 })
 *     .noise({ type: 'fbm', scale: 3, opacity: 0.3 })
 *     .pattern({ type: 'hex', size: 40, opacity: 0.12 })
 *     .grain({ intensity: 0.08 })
 *     .vignette({ strength: 0.6 })
 *     .save('output/banner.png')
 */

const { createCanvas } = require('@napi-rs/canvas')
const { applyGradient }                             = require('./generators/gradient')
const { applyNoise }                                 = require('./generators/noise')
const { applyGeometry }                              = require('./generators/geometry')
const {
  applyGrain, applyVignette, applyGlow, applyBlur,
  applyDuotone, applyScanlines, applyChromaticAberration,
}                                                    = require('./generators/effects')
const { exportAs, exportSizes, exportCSS, BANNER_SIZES } = require('./exporter')
const { PRESETS }                                    = require('./presets')

class TextureGen {
  /**
   * @param {object} options
   *   width   — canvas width  (default 1200)
   *   height  — canvas height (default 630)
   */
  constructor({ width = 1200, height = 630 } = {}) {
    this.width  = width
    this.height = height
    this.canvas = createCanvas(width, height)
    this.ctx    = this.canvas.getContext('2d')
    this._layers = []   // layer log for CSS export
  }

  // ---------------------------------------------------------------------------
  // Layer methods (all return `this` for chaining)
  // ---------------------------------------------------------------------------

  /** Fill with a solid color */
  background(color = '#000000') {
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.width, this.height)
    return this
  }

  /**
   * Add a gradient layer
   * @param {object} options  — type, stops, angle, opacity, centerX, centerY, blendMode
   */
  gradient(options = {}) {
    applyGradient(this.ctx, this.width, this.height, options)
    this._layers.push({ type: 'gradient', options })
    return this
  }

  /**
   * Add a noise texture layer
   * @param {object} options  — type ('perlin'|'fbm'|'voronoi'|'ridged'|'turbulence'),
   *                            scale, opacity, octaves, color, colorB, invert, seed
   */
  noise(options = {}) {
    applyNoise(this.ctx, this.width, this.height, options)
    this._layers.push({ type: 'noise', options })
    return this
  }

  /**
   * Add a geometric pattern layer
   * @param {object} options  — type ('grid'|'hex'|'triangles'|'dots'|'circles'|
   *                            'lines'|'cross-hatch'|'chevron'|'diamonds'|'truchet'),
   *                            size, color, opacity, lineWidth, filled, angle
   */
  pattern(options = {}) {
    applyGeometry(this.ctx, this.width, this.height, options)
    this._layers.push({ type: 'pattern', options })
    return this
  }

  /** Film grain overlay */
  grain(options = {}) {
    applyGrain(this.ctx, this.width, this.height, options)
    this._layers.push({ type: 'grain', options })
    return this
  }

  /** Dark radial falloff toward edges */
  vignette(options = {}) {
    applyVignette(this.ctx, this.width, this.height, options)
    this._layers.push({ type: 'vignette', options })
    return this
  }

  /** Soft radial light bloom */
  glow(options = {}) {
    applyGlow(this.ctx, this.width, this.height, options)
    this._layers.push({ type: 'glow', options })
    return this
  }

  /** Gaussian blur */
  blur(options = {}) {
    applyBlur(this.ctx, this.width, this.height, options)
    return this
  }

  /** Map luminance to two colors */
  duotone(options = {}) {
    applyDuotone(this.ctx, this.width, this.height, options)
    this._layers.push({ type: 'duotone', options })
    return this
  }

  /** CRT-style horizontal scanlines */
  scanlines(options = {}) {
    applyScanlines(this.ctx, this.width, this.height, options)
    this._layers.push({ type: 'scanlines', options })
    return this
  }

  /** RGB channel split */
  chromaticAberration(options = {}) {
    applyChromaticAberration(this.ctx, this.width, this.height, options)
    return this
  }

  // ---------------------------------------------------------------------------
  // Preset loader
  // ---------------------------------------------------------------------------

  /**
   * Apply a named preset
   * @param {string} name  — preset name (see PRESETS)
   */
  preset(name) {
    const layers = PRESETS[name]
    if (!layers) throw new Error(`Unknown preset "${name}". Available: ${Object.keys(PRESETS).join(', ')}`)

    for (const layer of layers) {
      switch (layer.type) {
        case 'background':           this.background(layer.color); break
        case 'gradient':             this.gradient(layer.options); break
        case 'noise':                this.noise(layer.options); break
        case 'pattern':              this.pattern(layer.options); break
        case 'grain':                this.grain(layer.options); break
        case 'vignette':             this.vignette(layer.options); break
        case 'glow':                 this.glow(layer.options); break
        case 'blur':                 this.blur(layer.options); break
        case 'duotone':              this.duotone(layer.options); break
        case 'scanlines':            this.scanlines(layer.options); break
        case 'chromaticAberration':  this.chromaticAberration(layer.options); break
      }
    }
    return this
  }

  // ---------------------------------------------------------------------------
  // Export methods
  // ---------------------------------------------------------------------------

  /**
   * Save to file
   * @param {string} filePath
   * @param {object} options  — format, quality
   */
  async save(filePath, options = {}) {
    const ext = filePath.split('.').pop().toLowerCase()
    const format = options.format || (ext === 'jpg' || ext === 'jpeg' ? 'jpg' : ext === 'webp' ? 'webp' : 'png')
    return exportAs(this.canvas, { ...options, format, path: filePath })
  }

  /**
   * Export to buffer / base64 / dataUrl without writing to disk
   * @param {object} options  — format ('png'|'jpg'|'webp'), quality
   */
  async toBuffer(options = {}) {
    return exportAs(this.canvas, options)
  }

  /**
   * Export the same texture at multiple banner sizes
   * @param {Array<string|object>} sizes  — names from BANNER_SIZES or custom { name, width, height, path? }
   * @param {string} outDir  — directory to write files
   * @param {object} options  — format, quality
   */
  async toBannerSizes(sizes, outDir = '.', options = {}) {
    const path = require('path')
    const resolved = sizes.map(s => {
      if (typeof s === 'string') {
        const preset = BANNER_SIZES[s]
        if (!preset) throw new Error(`Unknown size "${s}". Available: ${Object.keys(BANNER_SIZES).join(', ')}`)
        const fmt = options.format || 'png'
        return { ...preset, path: path.join(outDir, `${s}.${fmt}`) }
      }
      return s
    })
    return exportSizes(this.canvas, resolved, options)
  }

  /** Get CSS background string for gradient layers */
  toCSS() {
    return exportCSS(this._layers)
  }

  /** Reset canvas to blank state */
  reset() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this._layers = []
    return this
  }
}

module.exports = { TextureGen, PRESETS, BANNER_SIZES }
