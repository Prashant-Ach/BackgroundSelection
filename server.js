'use strict'

const express  = require('express')
const path     = require('path')
const { TextureGen, PRESETS, BANNER_SIZES } = require('./src')

const app  = express()
const PORT = 3131

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Redirect root to studio
app.get('/', (req, res) => res.redirect('/studio.html'))

// ─── GET /api/presets ─────────────────────────────────────────────────────────
app.get('/api/presets', (req, res) => {
  res.json({ presets: Object.keys(PRESETS), sizes: Object.keys(BANNER_SIZES) })
})

// ─── POST /api/generate ──────────────────────────────────────────────────────
// Body: { preset?, layers[], width, height, format }
app.post('/api/generate', async (req, res) => {
  try {
    const {
      preset  = null,
      layers  = [],
      width   = 1200,
      height  = 630,
      format  = 'png',
      quality = 92,
    } = req.body

    const gen = new TextureGen({ width, height })

    // apply preset if provided
    if (preset) gen.preset(preset)

    // apply any extra custom layers on top
    for (const layer of layers) {
      switch (layer.type) {
        case 'background':          gen.background(layer.color); break
        case 'gradient':            gen.gradient(layer.options || layer); break
        case 'noise':               gen.noise(layer.options || layer); break
        case 'pattern':             gen.pattern(layer.options || layer); break
        case 'grain':               gen.grain(layer.options || layer); break
        case 'vignette':            gen.vignette(layer.options || layer); break
        case 'glow':                gen.glow(layer.options || layer); break
        case 'blur':                gen.blur(layer.options || layer); break
        case 'duotone':             gen.duotone(layer.options || layer); break
        case 'scanlines':           gen.scanlines(layer.options || layer); break
        case 'chromaticAberration': gen.chromaticAberration(layer.options || layer); break
      }
    }

    const result = await gen.toBuffer({ format, quality })

    const mime = format === 'jpg' || format === 'jpeg' ? 'image/jpeg'
               : format === 'webp' ? 'image/webp'
               : 'image/png'

    res.set('Content-Type', mime)
    res.set('Cache-Control', 'no-store')
    res.send(result.buffer)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/generate/preset/:name ──────────────────────────────────────────
app.get('/api/generate/preset/:name', async (req, res) => {
  try {
    const { name }   = req.params
    const width      = parseInt(req.query.width  || '1200')
    const height     = parseInt(req.query.height || '630')
    const format     = req.query.format || 'png'

    const result = await new TextureGen({ width, height })
      .preset(name)
      .toBuffer({ format })

    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
    res.set('Content-Type', mime)
    res.set('Cache-Control', 'no-store')
    res.send(result.buffer)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`\n  texturegen server running at http://localhost:${PORT}\n`)
})
