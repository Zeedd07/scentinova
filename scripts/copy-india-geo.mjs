/**
 * Copies India's state and city files from @countrystatecity/countries-browser
 * into public/geo so checkout loads them from our own origin instead of jsDelivr.
 * Runs automatically before `npm run dev` and `npm run build`.
 */
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const statesDir = dirname(require.resolve('@countrystatecity/countries-browser/data/states/IN.json'))
const dataDir = resolve(statesDir, '..')
const target = resolve(dirname(fileURLToPath(import.meta.url)), '../public/geo/data')

rmSync(target, { recursive: true, force: true })
mkdirSync(join(target, 'states'), { recursive: true })
mkdirSync(join(target, 'cities'), { recursive: true })

copyFileSync(join(dataDir, 'states', 'IN.json'), join(target, 'states', 'IN.json'))

const cityFiles = readdirSync(join(dataDir, 'cities')).filter((f) => /^IN-[A-Z0-9]+\.json$/.test(f))
for (const file of cityFiles) {
  copyFileSync(join(dataDir, 'cities', file), join(target, 'cities', file))
}

console.log(`India geo data: 1 state file, ${cityFiles.length} city files -> public/geo/data`)
