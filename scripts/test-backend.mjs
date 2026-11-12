const worker = (await import('../dist/server/index.js')).default

const validManifest = {
  id: 'EVT_WINTER_2026', name: 'Winter Rift 2026', slug: 'winter-rift-2026',
  startsAt: '2026-12-03T18:00', endsAt: '2027-01-08T04:00',
  itemCount: 30, missionCount: 5, rewardCount: 30, bundleCount: 3,
  locales: ['pt-BR', 'en-US', 'es-MX'], broken: false,
}

async function call(path, init) {
  return worker.fetch(new Request(`https://example.test${path}`, init), {})
}

const health = await call('/api/health')
if (health.status !== 200 || (await health.json()).status !== 'ok') throw new Error('Health check failed')

const valid = await call('/api/validate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validManifest) })
const validBody = await valid.json()
if (valid.status !== 200 || !validBody.valid || validBody.checkedRules !== 24) throw new Error('Valid manifest was rejected')

const invalid = await call('/api/validate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validManifest, slug: '', broken: true, locales: ['en-US'] }) })
const invalidBody = await invalid.json()
if (invalidBody.valid || invalidBody.errors.length < 2 || invalidBody.warnings.length < 1) throw new Error('Invalid manifest was accepted')

const published = await call('/api/releases', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validManifest) })
const publishedBody = await published.json()
if (published.status !== 201 || !publishedBody.release?.id) throw new Error('Release creation failed')

const history = await call('/api/releases')
const historyBody = await history.json()
if (historyBody.releases.length !== 1) throw new Error('Release history failed')

const rollback = await call(`/api/releases/${publishedBody.release.id}/rollback`, { method: 'POST' })
if (rollback.status !== 201) throw new Error('Rollback failed')

console.log('Backend tests passed: health, validation, release history, and rollback.')
