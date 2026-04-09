'use strict'

/**
 * Basic usage examples for texturegen
 * Run: node examples/basic.js
 */

const path = require('path')
const fs   = require('fs')
const { TextureGen, PRESETS, BANNER_SIZES } = require('../src')

const OUT = path.join(__dirname, '../output')
fs.mkdirSync(OUT, { recursive: true })

async function run() {
  console.log('texturegen — generating examples...\n')

  // ── 1. Custom layered banner ──────────────────────────────────────────────
  console.log('1. Custom layered banner')
  await new TextureGen({ width: 1200, height: 630 })
    .background('#06070a')
    .gradient({ type: 'radial', stops: ['#6366f180', '#6366f100'], centerX: 0.2, centerY: 0.3, opacity: 0.9 })
    .gradient({ type: 'radial', stops: ['#ec489980', '#ec489900'], centerX: 0.8, centerY: 0.7, opacity: 0.9 })
    .noise({ type: 'fbm', scale: 3, opacity: 0.25, octaves: 4 })
    .pattern({ type: 'hex', size: 44, color: '#ffffff', opacity: 0.07, lineWidth: 1 })
    .grain({ intensity: 0.07 })
    .vignette({ strength: 0.65 })
    .save(path.join(OUT, 'custom-banner.png'))
  console.log('   → output/custom-banner.png\n')

  // ── 2. All presets ────────────────────────────────────────────────────────
  console.log('2. Rendering all presets (1200x630)...')
  for (const name of Object.keys(PRESETS)) {
    await new TextureGen({ width: 1200, height: 630 })
      .preset(name)
      .save(path.join(OUT, `preset-${name}.png`))
    console.log(`   → output/preset-${name}.png`)
  }

  // ── 3. Mobile wallpaper ───────────────────────────────────────────────────
  console.log('\n3. Mobile wallpaper (1080x1920)')
  await new TextureGen({ width: 1080, height: 1920 })
    .preset('aurora')
    .save(path.join(OUT, 'mobile-wallpaper.png'))
  console.log('   → output/mobile-wallpaper.png')

  // ── 4. Marble texture ─────────────────────────────────────────────────────
  console.log('\n4. Marble texture')
  await new TextureGen({ width: 1200, height: 800 })
    .preset('marble')
    .save(path.join(OUT, 'marble.jpg'), { format: 'jpg', quality: 92 })
  console.log('   → output/marble.jpg')

  // ── 5. Multi-size export for app banners ──────────────────────────────────
  console.log('\n5. Multi-size export (OG image + App Store + Twitter)')
  const gen = new TextureGen({ width: 1200, height: 630 }).preset('purple-haze')
  await gen.toBannerSizes(
    ['og-image', 'app-store', 'twitter'],
    OUT,
    { format: 'png' }
  )
  console.log('   → output/og-image.png')
  console.log('   → output/app-store.png')
  console.log('   → output/twitter.png')

  // ── 6. Base64 (for embedding or API response) ─────────────────────────────
  console.log('\n6. Base64 export demo')
  const result = await new TextureGen({ width: 400, height: 200 })
    .preset('neon-grid')
    .toBuffer({ format: 'png' })
  console.log(`   base64 length: ${result.base64.length} chars`)
  console.log(`   dataUrl starts: ${result.dataUrl.slice(0, 40)}...`)

  // ── 7. CSS gradient export ────────────────────────────────────────────────
  console.log('\n7. CSS export (gradient layers only)')
  const css = new TextureGen({ width: 1200, height: 630 })
    .gradient({ type: 'linear', stops: ['#1a1a2e', '#0f3460'], angle: 135 })
    .gradient({ type: 'radial', stops: ['#e94560', '#e9456000'], centerX: 0.7, centerY: 0.3, opacity: 0.6 })
    .toCSS()
  console.log('   ' + css)

  console.log('\nDone.')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
