import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity, ArchiveRestore, ArrowDown, ArrowRight, Box, Braces, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleDot, ClipboardCheck, CloudUpload, Code2, Copy,
  Cpu, Database, FileJson, Flag, Gift, GitBranch, Globe2, History, LayoutDashboard,
  ListChecks, LoaderCircle, LockKeyhole, Menu, Package, Play, Plus,
  Rocket, ScanLine, Search, Settings, ShieldCheck, ShoppingBag, Sparkles, Terminal,
  TriangleAlert, X, XCircle, Zap
} from 'lucide-react'
import './styles.css'

type View = 'landing' | 'editor' | 'pipeline' | 'history'
type Section = 'overview' | 'items' | 'missions' | 'rewards' | 'store' | 'localization'
type ValidationState = 'idle' | 'running' | 'valid' | 'invalid'

type ValidationIssue = { severity: 'error' | 'warning'; code: string; title: string; detail: string; path: string }
type ValidationResponse = {
  valid: boolean
  checkedRules: number
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  durationMs: number
  requestId: string
  engine: string
}

type Release = {
  id: string
  version: string
  event_id: string
  event_name: string
  state: string
  commit_hash: string
  artifact_count: number
  created_at: string
  rolled_back_from?: string | null
}

type ContentData = {
  id: string
  name: string
  slug: string
  startsAt: string
  endsAt: string
  status: 'Draft' | 'Ready for review'
  itemCount: number
  missionCount: number
  rewardCount: number
  bundleCount: number
  locales: string[]
  broken: boolean
}

const validContent: ContentData = {
  id: 'EVT_WINTER_2026',
  name: 'Winter Rift 2026',
  slug: 'winter-rift-2026',
  startsAt: '2026-12-03T18:00',
  endsAt: '2027-01-08T04:00',
  status: 'Draft',
  itemCount: 30,
  missionCount: 5,
  rewardCount: 30,
  bundleCount: 3,
  locales: ['pt-BR', 'en-US', 'es-MX'],
  broken: false,
}

const invalidContent: ContentData = {
  ...validContent,
  name: 'Winter Rift — broken sample',
  slug: '',
  missionCount: 4,
  locales: ['pt-BR', 'en-US'],
  broken: true,
}

const navItems = [
  { id: 'overview' as Section, label: 'Overview', icon: LayoutDashboard, count: null },
  { id: 'items' as Section, label: 'Items', icon: Box, count: 30 },
  { id: 'missions' as Section, label: 'Missions', icon: Flag, count: 5 },
  { id: 'rewards' as Section, label: 'Rewards', icon: Gift, count: 30 },
  { id: 'store' as Section, label: 'Store', icon: ShoppingBag, count: 3 },
  { id: 'localization' as Section, label: 'Localization', icon: Globe2, count: 3 },
]

function App() {
  const [view, setView] = useState<View>('landing')
  const [section, setSection] = useState<Section>('overview')
  const [data, setData] = useState<ContentData>(validContent)
  const [validation, setValidation] = useState<ValidationState>('idle')
  const [panelOpen, setPanelOpen] = useState(true)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [publishStep, setPublishStep] = useState(1)
  const [mobileNav, setMobileNav] = useState(false)
  const [validationReport, setValidationReport] = useState<ValidationResponse | null>(null)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  const summary = useMemo(() => [
    { label: 'Items', value: data.itemCount, icon: Box, color: 'purple' },
    { label: 'Missions', value: data.missionCount, icon: Flag, color: 'blue' },
    { label: 'Rewards', value: data.rewardCount, icon: Gift, color: 'pink' },
    { label: 'Bundles', value: data.bundleCount, icon: Package, color: 'orange' },
  ], [data])

  useEffect(() => {
    fetch('/api/health').then(response => {
      if (!response.ok) throw new Error('Backend unavailable')
      setBackendStatus('online')
    }).catch(() => setBackendStatus('offline'))
  }, [])

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 2800)
  }

  async function runValidation() {
    setPanelOpen(true)
    setValidation('running')
    setValidationReport(null)
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Validation service returned an error')
      const report = await response.json() as ValidationResponse
      setValidationReport(report)
      setValidation(report.valid ? 'valid' : 'invalid')
      setBackendStatus('online')
    } catch {
      setValidation('idle')
      setBackendStatus('offline')
      showToast('The validation API is unavailable')
    }
  }

  function loadSample(kind: 'valid' | 'invalid') {
    setData(kind === 'valid' ? validContent : invalidContent)
    setValidation('idle')
    setView('editor')
    setValidationReport(null)
    showToast(kind === 'valid' ? 'Valid sample loaded' : 'Broken sample loaded')
  }

  function goPipeline() {
    if (validation !== 'valid') {
      showToast('Validate the content before continuing')
      setPanelOpen(true)
      return
    }
    setView('pipeline')
  }

  if (view === 'landing') {
    return <LandingPage onEnter={() => setView('editor')} />
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button>
          <button className="brand-mark" aria-label="Back to landing page" onClick={() => setView('landing')}><span>G</span></button>
          <div>
            <div className="brand-name">GAME CONTENT <b>PIPELINE</b></div>
            <div className="brand-sub">CONTENT OPERATIONS CONSOLE</div>
          </div>
        </div>
        <div className="console-run"><span>ACTIVE RELEASE</span><b>EVT_WINTER_2026</b></div>
        <nav className="view-nav" aria-label="Primary navigation">
          <button className={view === 'editor' ? 'active' : ''} onClick={() => setView('editor')}><Code2 size={15}/>Editor</button>
          <button className={view === 'pipeline' ? 'active' : ''} onClick={() => setView('pipeline')}><Activity size={15}/>Pipeline</button>
          <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}><History size={15}/>History</button>
        </nav>
        <div className="top-actions">
          <div className={`api-pill ${backendStatus}`}><span/>{backendStatus === 'checking' ? 'API CHECK' : `API ${backendStatus}`}</div>
          <div className="env-pill"><span/>STAGING <ChevronDown size={13}/></div>
          <button className="icon-button" aria-label="Settings"><Settings size={18}/></button>
          <div className="avatar">AM</div>
        </div>
      </header>

      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <div className="sidebar-label">ACTIVE CONTENT</div>
        <button className="content-select">
          <div className="content-glyph"><Sparkles size={16}/></div>
          <div><strong>Winter Rift 2026</strong><span>{data.id}</span></div>
          <ChevronDown size={15}/>
        </button>
        <div className="sidebar-label space-top">CONFIGURATION</div>
        <div className="side-links">
          {navItems.map(item => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => {setSection(item.id); setView('editor'); setMobileNav(false)}}>
            <item.icon size={17}/><span>{item.label}</span>{item.count !== null && <em>{item.id === 'missions' ? data.missionCount : item.count}</em>}
          </button>)}
        </div>
        <div className="sidebar-bottom">
          <div className="engine-card">
            <div className="engine-top"><div className="cpp-icon">C++</div><span><b>Validator Engine</b><small>v0.8.3 · C++20</small></span><i/></div>
            <div className="engine-meta"><span><Terminal size={13}/>Ruleset 24</span><span>12 ms avg.</span></div>
          </div>
          <button className="new-content"><Plus size={16}/>New content</button>
        </div>
      </aside>

      <main className={`workspace ${panelOpen && view === 'editor' ? 'with-panel' : ''}`}>
        {view === 'editor' && <EditorView
          data={data} setData={setData} section={section} summary={summary}
          validation={validation} runValidation={runValidation} loadSample={loadSample}
          setJsonOpen={setJsonOpen} goPipeline={goPipeline} panelOpen={panelOpen}
        />}
        {view === 'pipeline' && <PipelineView step={publishStep} setStep={setPublishStep} showToast={showToast} setView={setView} data={data}/>}
        {view === 'history' && <HistoryView showToast={showToast}/>} 
      </main>

      {view === 'editor' && panelOpen && <ValidationPanel validation={validation} report={validationReport} onClose={() => setPanelOpen(false)} runValidation={runValidation} goPipeline={goPipeline}/>}
      {jsonOpen && <JsonModal data={data} onClose={() => setJsonOpen(false)} showToast={showToast}/>} 
      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    </div>
  )
}

function LandingPage({onEnter}: {onEnter: () => void}) {
  const [sample, setSample] = useState<'valid' | 'blocked'>('blocked')
  const isValid = sample === 'valid'

  return <div className="landing">
    <header className="landing-nav">
      <a className="landing-brand" href="#top" aria-label="Game Content Pipeline — home">
        <span className="landing-brand-mark">GCP</span>
        <span>GAME CONTENT<br/>PIPELINE</span>
      </a>
      <div className="landing-nav-center">
        <a href="#system">The system</a>
        <a href="#proof">Validation</a>
        <a href="#architecture">Architecture</a>
      </div>
      <button className="landing-open" onClick={onEnter}>ABRIR CONSOLE <ArrowRight size={15}/></button>
    </header>

    <main id="top">
      <section className="landing-hero">
        <div className="hero-grid-lines" aria-hidden="true"/>
        <div className="hero-index">PORTFOLIO SYSTEM / 001</div>
        <div className="hero-eyebrow"><span>CONTENT OPERATIONS</span><i/>RELEASE SAFETY FOR LIVE GAMES</div>
        <h1><span>GAME</span><span>CONTENT</span><span className="hero-outline">PIPELINE</span></h1>
        <div className="hero-copy">
          <p>Configure events, validate relationships, and stage releases before a content package reaches the game.</p>
          <button onClick={onEnter}><span>EXPLORAR O CONSOLE</span><ArrowRight size={18}/></button>
        </div>

        <div className="manifest-stamp" aria-hidden="true">
          <span>VALIDATION</span><strong>24</strong><small>RULES ACTIVE</small>
        </div>

        <div className="hero-package" aria-label="Event package preview">
          <div className="package-top"><span>EVENT PACKAGE</span><code>EVT_WINTER_2026</code><i>RC.01</i></div>
          <div className="package-body">
            <div className="package-title"><small>PREPARING RELEASE</small><strong>WINTER<br/>RIFT '26</strong></div>
            <div className="package-counts">
              <span><b>30</b> ITEMS</span><span><b>05</b> MISSIONS</span><span><b>03</b> BUNDLES</span>
            </div>
            <div className="package-bar"><span/><span/><span/><span/></div>
            <div className="package-code">BR1 · 03 DEC 2026 · 18:00 UTC-3</div>
          </div>
        </div>

        <a className="hero-scroll" href="#system"><ArrowDown size={15}/>SCROLL TO INSPECT</a>
        <div className="hero-ticker" aria-hidden="true"><div>UNIQUE IDS <span>◆</span> VALID REFERENCES <span>◆</span> PRICING RULES <span>◆</span> LOCALIZATION COVERAGE <span>◆</span> SAFE ROLLBACK <span>◆</span> UNIQUE IDS <span>◆</span> VALID REFERENCES</div></div>
      </section>

      <section className="landing-problem" id="system">
        <div className="section-number">01 / THE SYSTEM</div>
        <div className="problem-heading">
          <h2>Live content<br/>does not accept <em>“almost.”</em></h2>
          <p>An event can connect dozens of items, missions, rewards, prices, and translations. A single broken reference is enough to block a release.</p>
        </div>
        <div className="problem-ledger">
          <div><span>SAMPLE EVENT</span><strong>68</strong><p>relationships across items, rewards, and bundles</p></div>
          <div><span>ENGINE COVERAGE</span><strong>24</strong><p>rules checked on every validation run</p></div>
          <div><span>AVERAGE TIME</span><strong>12<small>ms</small></strong><p>to return an actionable report</p></div>
        </div>
      </section>

      <section className="validation-proof" id="proof">
        <div className="proof-intro">
          <div className="section-number light">02 / VALIDATION PROOF</div>
          <h2>The error shows up<br/>before the player.</h2>
          <p>Switch samples to see the same package move from a blocked release to an approved staging candidate.</p>
          <div className="proof-switch" role="group" aria-label="Sample state">
            <button className={!isValid ? 'active blocked' : ''} onClick={() => setSample('blocked')}><XCircle size={14}/>WITH ERRORS</button>
            <button className={isValid ? 'active valid' : ''} onClick={() => setSample('valid')}><CheckCircle2 size={14}/>VALID</button>
          </div>
        </div>

        <div className={`proof-console ${isValid ? 'is-valid' : ''}`}>
          <div className="proof-console-bar"><div><i/><i/><i/></div><span>validator / winter_event.json</span><code>C++20</code></div>
          <div className="proof-console-grid">
            <div className="proof-json">
              <div className="proof-file"><FileJson size={15}/>event.manifest.json<span>42 lines</span></div>
              <pre><span className="dim">{'{'}</span>{'\n'}  <span className="key">"event_id"</span>: <span className="value">"EVT_WINTER_2026"</span>,{'\n'}  <span className="key">"rewards"</span>: [{'\n'}    {'{'} <span className="key">"item_id"</span>: <span className={isValid ? 'value' : 'error-value'}>"{isValid ? 'ITEM_ORB_01' : 'ITEM_ORB_99'}"</span> {'}'},{'\n'}    {'{'} <span className="key">"quantity"</span>: <span className="number">300</span> {'}'}{'\n'}  ],{'\n'}  <span className="key">"locales"</span>: [<span className="value">"pt-BR"</span>, <span className="value">"en-US"</span>{isValid && <>, <span className="value">"es-MX"</span></>}] {'\n'}<span className="dim">{'}'}</span></pre>
            </div>
            <div className="proof-report">
              <div className="report-title"><ScanLine size={16}/><span>VALIDATION REPORT</span><code>12ms</code></div>
              <div className={`report-status ${isValid ? 'valid' : 'blocked'}`}>
                {isValid ? <CheckCircle2 size={25}/> : <XCircle size={25}/>}<div><small>PUBLICATION STATUS</small><strong>{isValid ? 'READY FOR STAGING' : 'BLOCKED'}</strong></div>
              </div>
              {!isValid ? <div className="report-issues">
                <div><span>ERROR</span><b>REF_004</b><p>Item <code>ITEM_ORB_99</code> does not exist.</p></div>
                <div><span>WARN</span><b>LOC_011</b><p>Translation <code>es-MX</code> is missing.</p></div>
              </div> : <div className="report-clean"><ShieldCheck size={30}/><strong>24 / 24 RULES</strong><p>No known blockers.</p></div>}
              <div className="report-footer"><span>references</span><b>{isValid ? '65/65' : '64/65'}</b><span>locales</span><b>{isValid ? '3/3' : '2/3'}</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="architecture" id="architecture">
        <div className="section-number">03 / ARCHITECTURE</div>
        <div className="architecture-heading"><h2>Three languages.<br/>One reliable release.</h2><p>Each layer reflects a real engineering responsibility: authoring, domain rules, and delivery automation.</p></div>
        <div className="architecture-track">
          <article><span>01</span><div className="tech-icon"><Braces size={24}/></div><small>AUTHORING LAYER</small><h3>React +<br/>TypeScript</h3><p>A typed editor for events, items, missions, and localization.</p><code>content-editor/</code></article>
          <div className="track-arrow"><ArrowRight size={24}/><small>JSON</small></div>
          <article><span>02</span><div className="tech-icon"><Cpu size={24}/></div><small>DOMAIN LAYER</small><h3>C++20<br/>Validator</h3><p>Fast rules, cross-references, and automated tests.</p><code>validator-engine/</code></article>
          <div className="track-arrow"><ArrowRight size={24}/><small>REPORT</small></div>
          <article><span>03</span><div className="tech-icon"><GitBranch size={24}/></div><small>DELIVERY LAYER</small><h3>Python<br/>Pipeline</h3><p>Staging, release history, publishing, and rollback.</p><code>release-pipeline/</code></article>
        </div>
      </section>

      <section className="landing-final">
        <div className="final-marquee" aria-hidden="true">VALIDATE / SHIP / OBSERVE / ROLLBACK /</div>
        <div className="final-content"><span>GAME CONTENT PIPELINE</span><h2>Inspect the<br/>release from within.</h2><button onClick={onEnter}>OPEN INTERACTIVE CONSOLE <ArrowRight size={18}/></button></div>
        <div className="final-meta"><span>C++20 · PYTHON · TYPESCRIPT</span><span>PORTFOLIO PROJECT / 2026</span></div>
      </section>
    </main>
  </div>
}

function EditorView({data, setData, section, summary, validation, runValidation, loadSample, setJsonOpen, goPipeline, panelOpen}: any) {
  return <>
    <div className="page-header">
      <div>
        <div className="breadcrumbs"><span>Content</span><ChevronRight size={13}/><span>Events</span><ChevronRight size={13}/><b>Winter Rift 2026</b></div>
        <div className="title-line"><h1>{section === 'overview' ? 'Event overview' : navItems.find(n => n.id === section)?.label}</h1><span className="draft-badge"><CircleDot size={11}/>{data.status}</span></div>
        <p>{section === 'overview' ? 'Configure, validate, and prepare this content package for release.' : `Manage this event's ${navItems.find(n => n.id === section)?.label.toLowerCase()} data.`}</p>
      </div>
      <div className="header-actions">
        <div className="sample-switch">
          <button onClick={() => loadSample('valid')}>Valid sample</button>
          <button onClick={() => loadSample('invalid')}>With errors</button>
        </div>
        <button className="secondary" onClick={() => setJsonOpen(true)}><FileJson size={16}/>View JSON</button>
        <button className="primary" onClick={runValidation}>{validation === 'running' ? <LoaderCircle className="spin" size={17}/> : <Play size={16}/>}Run validation</button>
      </div>
    </div>

    <div className="page-content">
      {section === 'overview' ? <>
        <div className="stats-grid">
          {summary.map((item: any) => <div className="stat-card" key={item.label}><div className={`stat-icon ${item.color}`}><item.icon size={19}/></div><div><span>{item.label}</span><strong>{String(item.value).padStart(2,'0')}</strong></div><i><ChevronRight size={16}/></i></div>)}
        </div>

        <section className="content-card event-config">
          <div className="card-title"><div><h2>Event configuration</h2><p>Metadata consumed by the content pipeline.</p></div><span className="saved"><Check size={13}/>Changes saved</span></div>
          <div className="form-grid">
            <label><span>IDENTIFIER <LockKeyhole size={11}/></span><input value={data.id} disabled/></label>
            <label><span>DISPLAY NAME</span><input value={data.name} onChange={e => setData({...data, name: e.target.value})}/></label>
            <label className={data.slug ? '' : 'field-error'}><span>PUBLICATION SLUG</span><input value={data.slug} placeholder="winter-rift-2026" onChange={e => setData({...data, slug: e.target.value})}/>{!data.slug && <small>Required before publishing</small>}</label>
            <label><span>STATE</span><div className="select-like">{data.status}<ChevronDown size={14}/></div></label>
            <label><span>EVENT START</span><input type="datetime-local" value={data.startsAt} onChange={e => setData({...data, startsAt: e.target.value})}/></label>
            <label><span>EVENT END</span><input type="datetime-local" value={data.endsAt} onChange={e => setData({...data, endsAt: e.target.value})}/></label>
          </div>
        </section>

        <div className="lower-grid">
          <section className="content-card readiness-card">
            <div className="card-title"><div><h2>Release readiness</h2><p>Required checks before staging.</p></div><ShieldCheck size={22}/></div>
            {[
              ['Unique identifiers', true, '30 items analyzed'],
              ['Valid references', !data.broken, data.broken ? '1 broken reference' : '65 relationships checked'],
              ['Complete localization', data.locales.length === 3, `${data.locales.length}/3 required locales`],
              ['Release window', true, 'Dates and timezone are valid'],
            ].map(([label, ok, detail]: any) => <div className="check-row" key={label}><span className={ok ? 'ok' : 'bad'}>{ok ? <Check size={14}/> : <X size={14}/>}</span><div><b>{label}</b><small>{detail}</small></div><em>{ok ? 'OK' : 'ACTION'}</em></div>)}
          </section>
          <section className="content-card architecture-card">
            <div className="card-title"><div><h2>System flow</h2><p>Portfolio project architecture.</p></div><Zap size={20}/></div>
            <div className="arch-flow">
              <div><Code2 size={18}/><b>Editor</b><small>React + TS</small></div><ChevronRight size={16}/>
              <div><ShieldCheck size={18}/><b>Validator</b><small>C++20</small></div><ChevronRight size={16}/>
              <div><Rocket size={18}/><b>Pipeline</b><small>Python</small></div>
            </div>
            <div className="branch-row"><span className="valid-line"><Check size={12}/>Valid</span><span>Continue to approval</span></div>
            <div className="branch-row"><span className="invalid-line"><X size={12}/>Invalid</span><span>Block + report</span></div>
          </section>
        </div>
      </> : <CollectionView section={section} data={data}/>} 
    </div>
    <div className="action-footer">
      <div><Database size={15}/><span>Last autosave 18s ago</span></div>
      <button className="secondary">Save draft</button>
      <button className="primary" onClick={goPipeline}>Continue to staging<ChevronRight size={16}/></button>
      {!panelOpen && <span className="panel-hint">The validation panel opens when you run validation.</span>}
    </div>
  </>
}

function CollectionView({section, data}: {section: Section, data: ContentData}) {
  const config: Record<string, {name:string, id:string, status:string}[]> = {
    items: [
      {name:'Winter Orb', id:'ITEM_WINTER_ORB_01', status:'Active'}, {name:'Frostbound Icon', id:'ITEM_FROST_ICON_02', status:'Active'}, {name:'Aurora Emote', id:'ITEM_AURORA_EMOTE_03', status:'Active'}, {name:'Snowfall Capsule', id:'ITEM_SNOW_CAPSULE_04', status:'Draft'}],
    missions: [
      {name:'First Snow', id:'MSN_FIRST_SNOW', status:'Ready'}, {name:'Frozen Frontline', id:'MSN_FROZEN_FRONT', status:'Ready'}, {name:'Aurora Rising', id:'MSN_AURORA_RISE', status:'Review'}],
    rewards: [
      {name:'Milestone 01 — Winter Orb', id:'RWD_WINTER_001', status:'Valid'}, {name:'Milestone 02 — Icon', id:'RWD_WINTER_002', status:'Valid'}, {name:'Milestone 03 — Capsule', id:'RWD_WINTER_003', status:data.broken ? 'Error' : 'Valid'}],
    store: [
      {name:'Winter Starter Bundle', id:'BND_WINTER_START', status:'1.350 RP'}, {name:'Aurora Premium Bundle', id:'BND_AURORA_PREM', status:'3.250 RP'}, {name:'Complete Event Pass', id:'BND_EVENT_PASS', status:'1.650 RP'}],
    localization: data.locales.map(l => ({name: l, id: `locale/${l}.json`, status:'100%'})),
  }
  const rows = config[section] || []
  return <section className="content-card collection-card">
    <div className="collection-toolbar"><div className="search-box"><Search size={15}/><input placeholder="Search by name or ID..."/></div><button className="primary"><Plus size={15}/>Add</button></div>
    <div className="table-head"><span>NAME</span><span>IDENTIFIER</span><span>STATE</span><span></span></div>
    {rows.map((row, i) => <div className="table-row" key={row.id}><div className="row-name"><span>{i+1}</span><b>{row.name}</b></div><code>{row.id}</code><em className={row.status === 'Error' ? 'error-status' : ''}>{row.status}</em><button><ChevronRight size={16}/></button></div>)}
    <div className="table-footer">Showing {rows.length} of {section === 'localization' ? data.locales.length : section === 'store' ? 3 : section === 'missions' ? data.missionCount : 30} records</div>
  </section>
}

function ValidationPanel({validation, report, onClose, runValidation, goPipeline}: {validation: ValidationState; report: ValidationResponse | null; onClose: () => void; runValidation: () => void; goPipeline: () => void}) {
  const idle = validation === 'idle'
  const running = validation === 'running'
  const valid = validation === 'valid'
  const reportIssues = [...(report?.errors || []), ...(report?.warnings || [])]
  return <aside className="validation-panel">
    <div className="panel-header"><div><ListChecks size={18}/><b>Validation report</b></div><button onClick={onClose}><X size={18}/></button></div>
    <div className="panel-body">
      {idle && <div className="empty-state"><div><ClipboardCheck size={28}/></div><h3>Ready to validate</h3><p>Run 24 server-side rules to find release blockers before staging.</p><button className="primary" onClick={runValidation}><Play size={15}/>Run now</button></div>}
      {running && <div className="running-state"><div className="scan-orbit"><LoaderCircle className="spin" size={32}/></div><h3>Analyzing content</h3><p>The backend is checking references, dates, counts, and translations...</p><div className="progress"><span/></div><code>POST /api/validate</code></div>}
      {valid && <><div className="result-hero success"><CheckCircle2 size={28}/><div><h3>Content is valid</h3><p>{report?.checkedRules || 24} server rules completed without blockers.</p></div></div><div className="metrics"><span><b>{report?.errors.length || 0}</b> errors</span><span><b>{report?.warnings.length || 0}</b> warnings</span><span><b>{report?.durationMs || 0}ms</b> duration</span></div><div className="success-detail"><ShieldCheck size={20}/><div><b>Ready for staging</b><p>References, dates, counts, and translations are consistent.</p></div></div><button className="primary full" onClick={goPipeline}>Open pipeline<ChevronRight size={15}/></button></>}
      {validation === 'invalid' && <><div className="result-hero failure"><XCircle size={28}/><div><h3>Release blocked</h3><p>{report?.errors.length || 0} errors and {report?.warnings.length || 0} warnings returned by the API.</p></div></div><div className="metrics"><span><b>{report?.errors.length || 0}</b> errors</span><span><b>{report?.warnings.length || 0}</b> warnings</span><span><b>{report?.durationMs || 0}ms</b> duration</span></div><div className="issue-list">{reportIssues.map(issue => <button className={`issue ${issue.severity}`} key={`${issue.code}-${issue.path}`}><span>{issue.severity === 'error' ? <XCircle size={15}/> : <TriangleAlert size={15}/>}</span><div><small>{issue.code}</small><b>{issue.title}</b><p>{issue.detail}</p><code>{issue.path}</code></div><ChevronRight size={14}/></button>)}</div><button className="secondary full" onClick={runValidation}>Run again</button></>}
    </div>
    {!idle && !running && <div className="panel-footer"><span><Terminal size={13}/>{report?.engine || 'validation-api'}</span><span>{report?.requestId || 'Ruleset #24'}</span></div>}
  </aside>
}

function PipelineView({step, setStep, showToast, setView, data}: {step: number; setStep: (step: number) => void; showToast: (message: string) => void; setView: (view: View) => void; data: ContentData}) {
  const [publishing, setPublishing] = useState(false)
  const stages = [
    {title:'Validate package', detail:'Server API · 24 rules', icon: ShieldCheck},
    {title:'Create snapshot', detail:'Manifest + artifacts', icon: ArchiveRestore},
    {title:'Publish to staging', detail:'D1 release record', icon: CloudUpload},
    {title:'Final approval', detail:'Auditable server history', icon: ClipboardCheck},
  ]
  async function advance() {
    if (step < 4) {
      setStep(step + 1)
      showToast(`Stage ${step} completed`)
      return
    }
    setPublishing(true)
    try {
      const response = await fetch('/api/releases', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Release failed')
      showToast(`${result.release.version} saved to server history`)
      setView('history')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Release failed')
    } finally {
      setPublishing(false)
    }
  }
  return <div className="pipeline-page">
    <div className="page-header"><div><div className="breadcrumbs"><span>Winter Rift 2026</span><ChevronRight size={13}/><b>Release pipeline</b></div><h1>Prepare release</h1><p>Promote the validated package to the staging environment.</p></div><span className="pipeline-id">RUN #GCP-2841</span></div>
    <div className="pipeline-layout">
      <section className="content-card stage-list"><div className="card-title"><div><h2>Release stages</h2><p>A safe, auditable, and reversible flow.</p></div></div>
        {stages.map((stage, i) => {const n=i+1; const done=n<step; const active=n===step; return <div className={`stage-row ${done?'done':''} ${active?'active':''}`} key={stage.title}><div className="stage-number">{done?<Check size={15}/>:n}</div><div className="stage-icon"><stage.icon size={19}/></div><div><b>{stage.title}</b><span>{stage.detail}</span></div><em>{done?'Complete':active?'In progress':'Pending'}</em></div>})}
      </section>
      <aside className="release-card">
        <div className="release-art"><Rocket size={31}/><span>STAGING RELEASE</span></div>
        <h2>Winter Rift 2026</h2><code>EVT_WINTER_2026 · v1.9.0-rc1</code>
        <div className="release-details"><div><span>Artifacts</span><b>68 files</b></div><div><span>Size</span><b>142 KB</b></div><div><span>API</span><b>online</b></div><div><span>Target</span><b>staging-br1</b></div></div>
        <div className="release-note"><Database size={15}/><p>The final stage writes a real release record to the server database.</p></div>
        <button className="primary full" onClick={advance} disabled={publishing}>{publishing ? <LoaderCircle className="spin" size={16}/> : null}{step < 4 ? 'Run stage' : 'Publish to staging'}<ChevronRight size={16}/></button>
        <button className="ghost full" onClick={() => setView('editor')}>Back to editor</button>
      </aside>
    </div>
  </div>
}

function HistoryView({showToast}: any) {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)

  async function loadHistory() {
    setLoading(true)
    try {
      const response = await fetch('/api/releases')
      if (!response.ok) throw new Error('History API failed')
      const result = await response.json()
      setReleases(result.releases || [])
    } catch {
      showToast('Could not load server release history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadHistory() }, [])

  async function rollback(release: Release) {
    try {
      const response = await fetch(`/api/releases/${release.id}/rollback`, { method: 'POST' })
      if (!response.ok) throw new Error('Rollback failed')
      showToast(`${release.version} rollback recorded`)
      await loadHistory()
    } catch {
      showToast('Rollback request failed')
    }
  }

  return <div className="history-page">
    <div className="page-header"><div><div className="breadcrumbs"><span>Winter Rift 2026</span><ChevronRight size={13}/><b>History</b></div><h1>Release history</h1><p>Audit server-side releases and record rollbacks.</p></div><button className="secondary" onClick={loadHistory}><History size={15}/>Refresh</button></div>
    <section className="content-card timeline-card">
      <div className="timeline-line"/>
      {loading && <div className="history-empty"><LoaderCircle className="spin" size={24}/><span>Loading server history...</span></div>}
      {!loading && releases.length === 0 && <div className="history-empty"><Database size={24}/><b>No server releases yet</b><span>Publish a validated package from the pipeline to create the first record.</span></div>}
      {releases.map((entry, i) => <div className="history-entry" key={entry.id}><div className={`timeline-dot ${entry.state === 'Rollback' ? 'amber' : 'green'}`}>{entry.state === 'Rollback'?<ArchiveRestore size={15}/>:i===0?<Rocket size={15}/>:<History size={15}/>}</div><div className="history-main"><div><span className={`history-state ${entry.state === 'Rollback' ? 'amber' : 'green'}`}>{entry.state}</span><h2>{entry.version}</h2><code>{entry.commit_hash}</code></div><p>{entry.state === 'Rollback' ? `Server rollback created from ${entry.rolled_back_from}.` : `${entry.event_name} was recorded in the staging release database.`}</p><div className="history-meta"><span>{new Date(entry.created_at).toLocaleString('en-US')}</span><span>{entry.event_id}</span><span>{entry.artifact_count} artifacts</span></div></div><button className="secondary" onClick={() => rollback(entry)} disabled={entry.state === 'Rollback'}>{entry.state === 'Rollback' ? 'Recorded' : 'Rollback'}</button></div>)}
    </section>
  </div>
}

function JsonModal({data, onClose, showToast}: any) {
  const json = JSON.stringify({event:{id:data.id,name:data.name,slug:data.slug,window:{start:data.startsAt,end:data.endsAt}},content:{items:data.itemCount,missions:data.missionCount,rewards:data.rewardCount,bundles:data.bundleCount},required_locales:data.locales}, null, 2)
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="json-modal" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><div><FileJson size={18}/><b>event.manifest.json</b><span>READ ONLY</span></div><button onClick={onClose}><X size={18}/></button></div><pre>{json}</pre><div className="modal-foot"><span><CheckCircle2 size={14}/>Well-formed JSON</span><button className="secondary" onClick={() => {navigator.clipboard?.writeText(json);showToast('JSON copied')}}><Copy size={14}/>Copy</button></div></div></div>
}

createRoot(document.getElementById('root')!).render(<App />)
