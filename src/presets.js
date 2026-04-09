'use strict'

/**
 * Ready-made texture/wallpaper presets
 * Each preset is an array of layer descriptors that TextureGen can apply
 */

const PRESETS = {

  // --- Atmospheric ---

  aurora: [
    { type: 'background', color: '#050a14' },
    { type: 'noise',     options: { type: 'fbm', scale: 2, opacity: 0.9, color: '#0d2240', colorB: '#0a0a0a', octaves: 5 } },
    { type: 'gradient',  options: { type: 'linear', stops: ['#00c6a700', '#00c6a740', '#00c6a700'], angle: 100, opacity: 0.7 } },
    { type: 'gradient',  options: { type: 'linear', stops: ['#7c3aed00', '#7c3aed50', '#7c3aed00'], angle: 80,  opacity: 0.6 } },
    { type: 'gradient',  options: { type: 'radial', stops: ['#00ffd580', '#00ffd500'], centerX: 0.3, centerY: 0.6, opacity: 0.35 } },
    { type: 'grain',     options: { intensity: 0.06 } },
    { type: 'vignette',  options: { strength: 0.7 } },
  ],

  sunset: [
    { type: 'gradient',  options: { type: 'linear', stops: ['#0f0c29', '#302b63', '#24243e'], angle: 180 } },
    { type: 'gradient',  options: { type: 'radial', stops: ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff00'], centerX: 0.5, centerY: 1.1, opacity: 0.85 } },
    { type: 'noise',     options: { type: 'fbm', scale: 3, opacity: 0.12, octaves: 3 } },
    { type: 'grain',     options: { intensity: 0.05 } },
    { type: 'vignette',  options: { strength: 0.5 } },
  ],

  midnight: [
    { type: 'gradient',  options: { type: 'linear', stops: ['#000000', '#0d0d2b', '#000000'], angle: 160 } },
    { type: 'noise',     options: { type: 'perlin', scale: 6, opacity: 0.15, octaves: 3 } },
    { type: 'glow',      options: { x: 0.5, y: 0.3, color: '#4f46e5', radius: 0.45, intensity: 0.35 } },
    { type: 'grain',     options: { intensity: 0.08 } },
    { type: 'vignette',  options: { strength: 0.85 } },
  ],

  // --- Neon / Cyberpunk ---

  'neon-grid': [
    { type: 'background', color: '#050005' },
    { type: 'pattern',   options: { type: 'grid', size: 48, color: '#9d00ff', opacity: 0.3, lineWidth: 1 } },
    { type: 'gradient',  options: { type: 'radial', stops: ['#ff007730', '#ff007700'], centerX: 0.8, centerY: 0.2, opacity: 1 } },
    { type: 'gradient',  options: { type: 'radial', stops: ['#00ffe130', '#00ffe100'], centerX: 0.2, centerY: 0.8, opacity: 1 } },
    { type: 'glow',      options: { x: 0.5, y: 0.5, color: '#9d00ff', radius: 0.3, intensity: 0.2 } },
    { type: 'grain',     options: { intensity: 0.06 } },
    { type: 'vignette',  options: { strength: 0.9, color: '#050005' } },
  ],

  cyberpunk: [
    { type: 'gradient',  options: { type: 'linear', stops: ['#0a0a0a', '#1a0033'], angle: 150 } },
    { type: 'pattern',   options: { type: 'diagonal-lines', size: 30, color: '#ff0080', opacity: 0.07, lineWidth: 1 } },
    { type: 'glow',      options: { x: 0.15, y: 0.5, color: '#00f5ff', radius: 0.5, intensity: 0.4, blendMode: 'screen' } },
    { type: 'glow',      options: { x: 0.85, y: 0.5, color: '#ff0080', radius: 0.5, intensity: 0.4, blendMode: 'screen' } },
    { type: 'scanlines', options: { spacing: 3, opacity: 0.08 } },
    { type: 'grain',     options: { intensity: 0.07 } },
    { type: 'vignette',  options: { strength: 0.75 } },
  ],

  // --- Gradient / Abstract ---

  'purple-haze': [
    { type: 'gradient',  options: { type: 'linear', stops: ['#1a1a2e', '#16213e', '#0f3460'], angle: 135 } },
    { type: 'gradient',  options: { type: 'radial', stops: ['#e94560', '#e9456000'], centerX: 0.7, centerY: 0.3, opacity: 0.6 } },
    { type: 'gradient',  options: { type: 'radial', stops: ['#533483', '#53348300'], centerX: 0.2, centerY: 0.7, opacity: 0.7 } },
    { type: 'noise',     options: { type: 'fbm', scale: 2.5, opacity: 0.08 } },
    { type: 'grain',     options: { intensity: 0.05 } },
    { type: 'vignette',  options: { strength: 0.5 } },
  ],

  ocean: [
    { type: 'gradient',  options: { type: 'linear', stops: ['#0f2027', '#203a43', '#2c5364'], angle: 180 } },
    { type: 'noise',     options: { type: 'fbm', scale: 3, opacity: 0.4, color: '#1a4a6b', colorB: '#0a1a2e', octaves: 5 } },
    { type: 'gradient',  options: { type: 'radial', stops: ['#00b4d880', '#00b4d800'], centerX: 0.5, centerY: 0.0, opacity: 0.5 } },
    { type: 'grain',     options: { intensity: 0.04 } },
    { type: 'vignette',  options: { strength: 0.6 } },
  ],

  // --- Textured / Material ---

  marble: [
    { type: 'background', color: '#f5f0eb' },
    { type: 'noise',     options: { type: 'turbulence', scale: 5, opacity: 0.6, color: '#8b7355', colorB: '#f5f0eb', octaves: 6 } },
    { type: 'noise',     options: { type: 'fbm', scale: 8, opacity: 0.2, color: '#5c4a32', colorB: '#f5f0eb', octaves: 4 } },
    { type: 'gradient',  options: { type: 'linear', stops: ['#ffffff30', '#ffffff00', '#ffffff20'], angle: 45, opacity: 1 } },
    { type: 'grain',     options: { intensity: 0.03 } },
  ],

  'dark-marble': [
    { type: 'background', color: '#0d0d0d' },
    { type: 'noise',     options: { type: 'turbulence', scale: 4, opacity: 0.7, color: '#2a2a2a', colorB: '#0d0d0d', octaves: 6 } },
    { type: 'gradient',  options: { type: 'linear', stops: ['#c9a84c20', '#c9a84c00', '#c9a84c15'], angle: 60, opacity: 1 } },
    { type: 'grain',     options: { intensity: 0.04 } },
    { type: 'vignette',  options: { strength: 0.4 } },
  ],

  // --- Geometric ---

  'hex-mesh': [
    { type: 'gradient',  options: { type: 'linear', stops: ['#1e3a5f', '#0d1b2a'], angle: 145 } },
    { type: 'pattern',   options: { type: 'hex', size: 35, color: '#4fc3f7', opacity: 0.18, lineWidth: 1 } },
    { type: 'glow',      options: { x: 0.5, y: 0.4, color: '#4fc3f7', radius: 0.4, intensity: 0.25 } },
    { type: 'grain',     options: { intensity: 0.04 } },
    { type: 'vignette',  options: { strength: 0.65 } },
  ],

  'geo-dark': [
    { type: 'background', color: '#111111' },
    { type: 'pattern',   options: { type: 'triangles', size: 60, color: '#ffffff', opacity: 0.06, lineWidth: 1 } },
    { type: 'gradient',  options: { type: 'radial', stops: ['#6366f180', '#6366f100'], centerX: 0.3, centerY: 0.3, opacity: 0.8 } },
    { type: 'gradient',  options: { type: 'radial', stops: ['#ec489980', '#ec489900'], centerX: 0.7, centerY: 0.7, opacity: 0.8 } },
    { type: 'grain',     options: { intensity: 0.06 } },
    { type: 'vignette',  options: { strength: 0.7 } },
  ],

  // --- Duotone ---

  'duotone-blue': [
    { type: 'gradient',  options: { type: 'linear', stops: ['#aaaaaa', '#ffffff'], angle: 135 } },
    { type: 'noise',     options: { type: 'fbm', scale: 3, opacity: 0.5, octaves: 4 } },
    { type: 'duotone',   options: { shadowColor: '#1e3a5f', highlightColor: '#63b3ed' } },
    { type: 'grain',     options: { intensity: 0.04 } },
  ],

  'duotone-rose': [
    { type: 'gradient',  options: { type: 'linear', stops: ['#aaaaaa', '#ffffff'], angle: 135 } },
    { type: 'noise',     options: { type: 'fbm', scale: 2.5, opacity: 0.5, octaves: 4 } },
    { type: 'duotone',   options: { shadowColor: '#2d1b4e', highlightColor: '#f687b3' } },
    { type: 'grain',     options: { intensity: 0.04 } },
  ],
}

module.exports = { PRESETS }
