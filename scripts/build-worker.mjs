import { mkdir, readFile, readdir, rm, writeFile, cp } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = process.cwd()
const clientDir = join(root, 'dist', 'client')
const serverDir = join(root, 'dist', 'server')
const source = await readFile(join(root, 'worker', 'index.js'), 'utf8')

async function collect(dir, files = {}) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await collect(path, files)
    else {
      const key = '/' + relative(clientDir, path).replaceAll('\\', '/')
      files[key] = await readFile(path, 'utf8')
    }
  }
  return files
}

const assets = await collect(clientDir)
const output = source.replace('__ASSET_MAP__', JSON.stringify(JSON.stringify(assets)))

await rm(serverDir, { recursive: true, force: true })
await mkdir(serverDir, { recursive: true })
await mkdir(join(root, 'dist', '.openai', 'drizzle'), { recursive: true })
await writeFile(join(serverDir, 'index.js'), output)
await cp(join(root, '.openai', 'hosting.json'), join(root, 'dist', '.openai', 'hosting.json'))
await cp(join(root, 'drizzle', '0000_releases.sql'), join(root, 'dist', '.openai', 'drizzle', '0000_releases.sql'))

console.log(`Worker bundle ready with ${Object.keys(assets).length} embedded assets.`)
