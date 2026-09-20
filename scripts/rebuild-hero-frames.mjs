/**
 * Re-extract sharper hero frames from the higher-bitrate master,
 * then write high-quality WebP copies for mobile.
 *
 * Usage: node scripts/rebuild-hero-frames.mjs
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const ffmpeg = ffmpegInstaller.path

const SOURCE = path.join(root, 'public', 'hero-mobile.mp4')
const FALLBACK = path.join(root, 'public', 'source', 'hero-master.mp4')
const JPG_DIR = path.join(root, 'public', 'frames-clean')
const WEBP_DIR = path.join(root, 'public', 'frames-webp')
const ORIG_DIR = path.join(root, 'public', 'frames')

function run(args) {
  const res = spawnSync(ffmpeg, args, { stdio: 'inherit' })
  if (res.status !== 0) {
    throw new Error(`ffmpeg failed (${res.status}): ${args.join(' ')}`)
  }
}

function clearDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
  for (const name of fs.readdirSync(dir)) {
    if (/^frame-\d+\.(jpg|webp)$/i.test(name)) {
      fs.unlinkSync(path.join(dir, name))
    }
  }
}

const source = fs.existsSync(SOURCE) ? SOURCE : FALLBACK
if (!fs.existsSync(source)) {
  console.error('No source video found')
  process.exit(1)
}

console.log('Source:', source)
clearDir(JPG_DIR)
clearDir(WEBP_DIR)

// Exact 240 frames (10s @ 24fps). Mild unsharp for perceived clarity; high JPEG quality.
console.log('Extracting 240 high-quality JPEGs…')
run([
  '-y',
  '-hide_banner',
  '-loglevel',
  'error',
  '-i',
  source,
  '-vf',
  'fps=24,unsharp=5:5:0.9:5:5:0.0',
  '-frames:v',
  '240',
  '-q:v',
  '2',
  path.join(JPG_DIR, 'frame-%03d.jpg'),
])

console.log('Writing high-quality WebP…')
run([
  '-y',
  '-hide_banner',
  '-loglevel',
  'error',
  '-i',
  path.join(JPG_DIR, 'frame-%03d.jpg'),
  '-start_number',
  '1',
  '-c:v',
  'libwebp',
  '-q:v',
  '92',
  '-compression_level',
  '4',
  path.join(WEBP_DIR, 'frame-%03d.webp'),
])

// Keep /frames in sync as last-resort fallback
clearDir(ORIG_DIR)
for (const name of fs.readdirSync(JPG_DIR)) {
  if (!name.endsWith('.jpg')) continue
  fs.copyFileSync(path.join(JPG_DIR, name), path.join(ORIG_DIR, name))
}

const jpgCount = fs.readdirSync(JPG_DIR).filter((n) => n.endsWith('.jpg')).length
const webpCount = fs.readdirSync(WEBP_DIR).filter((n) => n.endsWith('.webp')).length
console.log(`Done. JPG=${jpgCount} WebP=${webpCount}`)
