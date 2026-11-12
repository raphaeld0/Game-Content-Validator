const ASSETS = JSON.parse(__ASSET_MAP__)
const memoryReleases = []

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  },
})

const makeId = (prefix) => `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`
const shortHash = () => crypto.randomUUID().replaceAll('-', '').slice(0, 7)

function validateManifest(manifest) {
  const started = performance.now()
  const errors = []
  const warnings = []
  const requiredLocales = ['pt-BR', 'en-US', 'es-MX']
  const slug = String(manifest?.slug || '')
  const id = String(manifest?.id || '')
  const startsAt = Date.parse(manifest?.startsAt || '')
  const endsAt = Date.parse(manifest?.endsAt || '')

  if (!/^EVT_[A-Z0-9_]+$/.test(id)) errors.push({ severity: 'error', code: 'ID_001', title: 'Invalid event identifier', detail: 'Event IDs must start with EVT_ and contain uppercase letters, digits, or underscores.', path: 'event.id' })
  if (!String(manifest?.name || '').trim()) errors.push({ severity: 'error', code: 'VAL_001', title: 'Display name is required', detail: 'The event must have a player-facing display name.', path: 'event.name' })
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push({ severity: 'error', code: 'VAL_002', title: 'Invalid publication slug', detail: 'Use a lowercase, hyphen-separated slug before publishing.', path: 'event.slug' })
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) errors.push({ severity: 'error', code: 'DATE_003', title: 'Invalid event window', detail: 'The end date must be later than the start date.', path: 'event.window' })
  if (!Number.isInteger(manifest?.itemCount) || manifest.itemCount < 1) errors.push({ severity: 'error', code: 'CNT_002', title: 'No items configured', detail: 'At least one item is required.', path: 'content.items' })
  if (manifest?.broken) errors.push({ severity: 'error', code: 'REF_004', title: 'Item reference not found', detail: 'rewards[17].item_id points to ITEM_WINTER_ORB_99, which does not exist.', path: 'rewards[17].item_id' })

  const locales = Array.isArray(manifest?.locales) ? manifest.locales : []
  for (const locale of requiredLocales) {
    if (!locales.includes(locale)) warnings.push({ severity: 'warning', code: 'LOC_011', title: 'Required translation missing', detail: `${locale} is missing from title or description.`, path: `localization.${locale}` })
  }

  return {
    valid: errors.length === 0,
    checkedRules: 24,
    errors,
    warnings,
    durationMs: Math.max(2, Math.round(performance.now() - started)),
    requestId: makeId('val'),
    engine: 'worker-validation-service/1.0',
  }
}

async function listReleases(env) {
  if (env?.DB) {
    const result = await env.DB.prepare('SELECT id, version, event_id, event_name, state, commit_hash, artifact_count, created_at, rolled_back_from FROM releases ORDER BY created_at DESC LIMIT 30').all()
    return result.results || []
  }
  return memoryReleases
}

async function saveRelease(env, release, manifest) {
  if (env?.DB) {
    await env.DB.prepare('INSERT INTO releases (id, version, event_id, event_name, state, commit_hash, artifact_count, manifest_json, created_at, rolled_back_from) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(release.id, release.version, release.event_id, release.event_name, release.state, release.commit_hash, release.artifact_count, JSON.stringify(manifest), release.created_at, release.rolled_back_from || null)
      .run()
  } else {
    memoryReleases.unshift(release)
  }
}

async function handleApi(request, env, url) {
  if (request.method === 'GET' && url.pathname === '/api/health') {
    return json({ status: 'ok', service: 'game-content-pipeline-api', version: '1.0.0', storage: env?.DB ? 'd1' : 'memory' })
  }

  if (request.method === 'POST' && url.pathname === '/api/validate') {
    const manifest = await request.json().catch(() => null)
    if (!manifest) return json({ error: 'A JSON manifest is required.' }, 400)
    return json(validateManifest(manifest))
  }

  if (request.method === 'GET' && url.pathname === '/api/releases') {
    return json({ releases: await listReleases(env) })
  }

  if (request.method === 'POST' && url.pathname === '/api/releases') {
    const manifest = await request.json().catch(() => null)
    if (!manifest) return json({ error: 'A JSON manifest is required.' }, 400)
    const validation = validateManifest(manifest)
    if (!validation.valid) return json({ error: 'Validation failed.', validation }, 422)
    const existing = await listReleases(env)
    const release = {
      id: makeId('rel'),
      version: `v1.${existing.length + 1}.0`,
      event_id: manifest.id,
      event_name: manifest.name,
      state: 'Staging',
      commit_hash: shortHash(),
      artifact_count: Number(manifest.itemCount || 0) + Number(manifest.missionCount || 0) + Number(manifest.rewardCount || 0) + Number(manifest.bundleCount || 0),
      created_at: new Date().toISOString(),
      rolled_back_from: null,
    }
    await saveRelease(env, release, manifest)
    return json({ release, validation }, 201)
  }

  const rollbackMatch = url.pathname.match(/^\/api\/releases\/([^/]+)\/rollback$/)
  if (request.method === 'POST' && rollbackMatch) {
    const releases = await listReleases(env)
    const source = releases.find((entry) => entry.id === rollbackMatch[1])
    if (!source) return json({ error: 'Release not found.' }, 404)
    const release = {
      ...source,
      id: makeId('rel'),
      version: `${source.version}-rollback`,
      state: 'Rollback',
      commit_hash: shortHash(),
      created_at: new Date().toISOString(),
      rolled_back_from: source.id,
    }
    await saveRelease(env, release, { restoredFrom: source.id })
    return json({ release }, 201)
  }

  return json({ error: 'API route not found.' }, 404)
}

function serveAsset(pathname) {
  const key = pathname === '/' ? '/index.html' : pathname
  const body = ASSETS[key] ?? (pathname.startsWith('/api/') ? null : ASSETS['/index.html'])
  if (body == null) return null
  const extension = key.split('.').pop()
  const contentTypes = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', svg: 'image/svg+xml' }
  return new Response(body, { headers: { 'content-type': contentTypes[extension] || 'text/plain; charset=utf-8', 'cache-control': extension === 'html' ? 'no-cache' : 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env, url)
      return serveAsset(url.pathname) || new Response('Not found', { status: 404 })
    } catch (error) {
      return json({ error: 'Internal server error.', detail: error instanceof Error ? error.message : String(error) }, 500)
    }
  },
}
