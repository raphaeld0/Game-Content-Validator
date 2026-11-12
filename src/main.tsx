import { useMemo, useState } from 'react'
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
  { id: 'overview' as Section, label: 'Visão geral', icon: LayoutDashboard, count: null },
  { id: 'items' as Section, label: 'Itens', icon: Box, count: 30 },
  { id: 'missions' as Section, label: 'Missões', icon: Flag, count: 5 },
  { id: 'rewards' as Section, label: 'Recompensas', icon: Gift, count: 30 },
  { id: 'store' as Section, label: 'Loja', icon: ShoppingBag, count: 3 },
  { id: 'localization' as Section, label: 'Localização', icon: Globe2, count: 3 },
]

const issues = [
  { severity: 'error', code: 'REF_004', title: 'Referência de item não encontrada', detail: 'rewards[17].item_id → ITEM_WINTER_ORB_99', path: 'rewards[17].item_id' },
  { severity: 'error', code: 'VAL_002', title: 'Slug obrigatório', detail: 'O evento precisa de um slug único para publicação.', path: 'event.slug' },
  { severity: 'warning', code: 'LOC_011', title: 'Tradução obrigatória ausente', detail: 'es-MX não foi incluído em title e description.', path: 'localization.es-MX' },
]

const historyEntries = [
  { version: 'v1.8.0', state: 'Produção', time: 'Hoje, 09:42', author: 'Alex Morgan', hash: 'a7c1e4f', tone: 'green' },
  { version: 'v1.7.2', state: 'Rollback', time: '10 nov, 17:18', author: 'Maya Chen', hash: '6db91a0', tone: 'amber' },
  { version: 'v1.7.1', state: 'Arquivado', time: '10 nov, 16:05', author: 'Maya Chen', hash: '31e0c8d', tone: 'gray' },
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

  const summary = useMemo(() => [
    { label: 'Itens', value: data.itemCount, icon: Box, color: 'purple' },
    { label: 'Missões', value: data.missionCount, icon: Flag, color: 'blue' },
    { label: 'Recompensas', value: data.rewardCount, icon: Gift, color: 'pink' },
    { label: 'Pacotes', value: data.bundleCount, icon: Package, color: 'orange' },
  ], [data])

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 2800)
  }

  function runValidation() {
    setPanelOpen(true)
    setValidation('running')
    window.setTimeout(() => {
      setValidation(data.broken || !data.slug ? 'invalid' : 'valid')
    }, 950)
  }

  function loadSample(kind: 'valid' | 'invalid') {
    setData(kind === 'valid' ? validContent : invalidContent)
    setValidation('idle')
    setView('editor')
    showToast(kind === 'valid' ? 'Amostra válida carregada' : 'Amostra com erros carregada')
  }

  function goPipeline() {
    if (validation !== 'valid') {
      showToast('Valide o conteúdo antes de continuar')
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
          <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button>
          <button className="brand-mark" aria-label="Voltar para a landing page" onClick={() => setView('landing')}><span>G</span></button>
          <div>
            <div className="brand-name">GAME CONTENT <b>PIPELINE</b></div>
            <div className="brand-sub">CONTENT OPERATIONS CONSOLE</div>
          </div>
        </div>
        <div className="console-run"><span>ACTIVE RELEASE</span><b>EVT_WINTER_2026</b></div>
        <nav className="view-nav" aria-label="Navegação principal">
          <button className={view === 'editor' ? 'active' : ''} onClick={() => setView('editor')}><Code2 size={15}/>Editor</button>
          <button className={view === 'pipeline' ? 'active' : ''} onClick={() => setView('pipeline')}><Activity size={15}/>Pipeline</button>
          <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}><History size={15}/>Histórico</button>
        </nav>
        <div className="top-actions">
          <div className="env-pill"><span/>STAGING <ChevronDown size={13}/></div>
          <button className="icon-button" aria-label="Configurações"><Settings size={18}/></button>
          <div className="avatar">AM</div>
        </div>
      </header>

      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <div className="sidebar-label">CONTEÚDO ATIVO</div>
        <button className="content-select">
          <div className="content-glyph"><Sparkles size={16}/></div>
          <div><strong>Winter Rift 2026</strong><span>{data.id}</span></div>
          <ChevronDown size={15}/>
        </button>
        <div className="sidebar-label space-top">CONFIGURAÇÃO</div>
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
          <button className="new-content"><Plus size={16}/>Novo conteúdo</button>
        </div>
      </aside>

      <main className={`workspace ${panelOpen && view === 'editor' ? 'with-panel' : ''}`}>
        {view === 'editor' && <EditorView
          data={data} setData={setData} section={section} summary={summary}
          validation={validation} runValidation={runValidation} loadSample={loadSample}
          setJsonOpen={setJsonOpen} goPipeline={goPipeline} panelOpen={panelOpen}
        />}
        {view === 'pipeline' && <PipelineView step={publishStep} setStep={setPublishStep} showToast={showToast} setView={setView}/>} 
        {view === 'history' && <HistoryView showToast={showToast}/>} 
      </main>

      {view === 'editor' && panelOpen && <ValidationPanel validation={validation} onClose={() => setPanelOpen(false)} runValidation={runValidation} goPipeline={goPipeline}/>} 
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
      <a className="landing-brand" href="#top" aria-label="Game Content Pipeline — início">
        <span className="landing-brand-mark">GCP</span>
        <span>GAME CONTENT<br/>PIPELINE</span>
      </a>
      <div className="landing-nav-center">
        <a href="#system">O sistema</a>
        <a href="#proof">Validação</a>
        <a href="#architecture">Arquitetura</a>
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
          <p>Configure eventos, valide relações e simule publicações antes que um pacote de conteúdo chegue ao jogo.</p>
          <button onClick={onEnter}><span>EXPLORAR O CONSOLE</span><ArrowRight size={18}/></button>
        </div>

        <div className="manifest-stamp" aria-hidden="true">
          <span>VALIDATION</span><strong>24</strong><small>RULES ACTIVE</small>
        </div>

        <div className="hero-package" aria-label="Prévia de um pacote de evento">
          <div className="package-top"><span>EVENT PACKAGE</span><code>EVT_WINTER_2026</code><i>RC.01</i></div>
          <div className="package-body">
            <div className="package-title"><small>PREPARING RELEASE</small><strong>WINTER<br/>RIFT '26</strong></div>
            <div className="package-counts">
              <span><b>30</b> ITENS</span><span><b>05</b> MISSÕES</span><span><b>03</b> PACOTES</span>
            </div>
            <div className="package-bar"><span/><span/><span/><span/></div>
            <div className="package-code">BR1 · 03 DEC 2026 · 18:00 UTC-3</div>
          </div>
        </div>

        <a className="hero-scroll" href="#system"><ArrowDown size={15}/>DESÇA PARA INSPECIONAR</a>
        <div className="hero-ticker" aria-hidden="true"><div>UNIQUE IDS <span>◆</span> VALID REFERENCES <span>◆</span> PRICING RULES <span>◆</span> LOCALIZATION COVERAGE <span>◆</span> SAFE ROLLBACK <span>◆</span> UNIQUE IDS <span>◆</span> VALID REFERENCES</div></div>
      </section>

      <section className="landing-problem" id="system">
        <div className="section-number">01 / THE SYSTEM</div>
        <div className="problem-heading">
          <h2>Conteúdo ao vivo<br/>não aceita <em>“quase”.</em></h2>
          <p>Um evento pode reunir dezenas de itens, missões, recompensas, preços e traduções. Uma referência quebrada basta para bloquear a publicação.</p>
        </div>
        <div className="problem-ledger">
          <div><span>EVENTO DE EXEMPLO</span><strong>68</strong><p>relações entre itens, recompensas e pacotes</p></div>
          <div><span>COBERTURA DO MOTOR</span><strong>24</strong><p>regras verificadas a cada execução</p></div>
          <div><span>TEMPO MÉDIO</span><strong>12<small>ms</small></strong><p>para retornar um relatório acionável</p></div>
        </div>
      </section>

      <section className="validation-proof" id="proof">
        <div className="proof-intro">
          <div className="section-number light">02 / VALIDATION PROOF</div>
          <h2>O erro aparece<br/>antes do jogador.</h2>
          <p>Troque a amostra para ver como o mesmo pacote muda de um release bloqueado para staging aprovado.</p>
          <div className="proof-switch" role="group" aria-label="Estado da amostra">
            <button className={!isValid ? 'active blocked' : ''} onClick={() => setSample('blocked')}><XCircle size={14}/>COM ERROS</button>
            <button className={isValid ? 'active valid' : ''} onClick={() => setSample('valid')}><CheckCircle2 size={14}/>VÁLIDA</button>
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
                <div><span>ERROR</span><b>REF_004</b><p>Item <code>ITEM_ORB_99</code> não existe.</p></div>
                <div><span>WARN</span><b>LOC_011</b><p>Tradução <code>es-MX</code> ausente.</p></div>
              </div> : <div className="report-clean"><ShieldCheck size={30}/><strong>24 / 24 REGRAS</strong><p>Nenhum bloqueio conhecido.</p></div>}
              <div className="report-footer"><span>references</span><b>{isValid ? '65/65' : '64/65'}</b><span>locales</span><b>{isValid ? '3/3' : '2/3'}</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="architecture" id="architecture">
        <div className="section-number">03 / ARCHITECTURE</div>
        <div className="architecture-heading"><h2>Três linguagens.<br/>Um release confiável.</h2><p>As camadas refletem responsabilidades reais de engenharia: autoria, regras de domínio e automação de entrega.</p></div>
        <div className="architecture-track">
          <article><span>01</span><div className="tech-icon"><Braces size={24}/></div><small>AUTHORING LAYER</small><h3>React +<br/>TypeScript</h3><p>Editor tipado para eventos, itens, missões e localização.</p><code>content-editor/</code></article>
          <div className="track-arrow"><ArrowRight size={24}/><small>JSON</small></div>
          <article><span>02</span><div className="tech-icon"><Cpu size={24}/></div><small>DOMAIN LAYER</small><h3>C++20<br/>Validator</h3><p>Regras rápidas, referências cruzadas e testes automatizados.</p><code>validator-engine/</code></article>
          <div className="track-arrow"><ArrowRight size={24}/><small>REPORT</small></div>
          <article><span>03</span><div className="tech-icon"><GitBranch size={24}/></div><small>DELIVERY LAYER</small><h3>Python<br/>Pipeline</h3><p>Staging, histórico de versões, publicação e rollback.</p><code>release-pipeline/</code></article>
        </div>
      </section>

      <section className="landing-final">
        <div className="final-marquee" aria-hidden="true">VALIDATE / SHIP / OBSERVE / ROLLBACK /</div>
        <div className="final-content"><span>GAME CONTENT PIPELINE</span><h2>Inspecione o<br/>release por dentro.</h2><button onClick={onEnter}>ABRIR CONSOLE INTERATIVO <ArrowRight size={18}/></button></div>
        <div className="final-meta"><span>C++20 · PYTHON · TYPESCRIPT</span><span>PORTFOLIO PROJECT / 2026</span></div>
      </section>
    </main>
  </div>
}

function EditorView({data, setData, section, summary, validation, runValidation, loadSample, setJsonOpen, goPipeline, panelOpen}: any) {
  return <>
    <div className="page-header">
      <div>
        <div className="breadcrumbs"><span>Conteúdo</span><ChevronRight size={13}/><span>Eventos</span><ChevronRight size={13}/><b>Winter Rift 2026</b></div>
        <div className="title-line"><h1>{section === 'overview' ? 'Visão geral do evento' : navItems.find(n => n.id === section)?.label}</h1><span className="draft-badge"><CircleDot size={11}/>{data.status}</span></div>
        <p>{section === 'overview' ? 'Configure, valide e prepare este pacote de conteúdo para publicação.' : `Gerencie os dados de ${navItems.find(n => n.id === section)?.label.toLowerCase()} deste evento.`}</p>
      </div>
      <div className="header-actions">
        <div className="sample-switch">
          <button onClick={() => loadSample('valid')}>Amostra válida</button>
          <button onClick={() => loadSample('invalid')}>Com erros</button>
        </div>
        <button className="secondary" onClick={() => setJsonOpen(true)}><FileJson size={16}/>Ver JSON</button>
        <button className="primary" onClick={runValidation}>{validation === 'running' ? <LoaderCircle className="spin" size={17}/> : <Play size={16}/>}Executar validação</button>
      </div>
    </div>

    <div className="page-content">
      {section === 'overview' ? <>
        <div className="stats-grid">
          {summary.map((item: any) => <div className="stat-card" key={item.label}><div className={`stat-icon ${item.color}`}><item.icon size={19}/></div><div><span>{item.label}</span><strong>{String(item.value).padStart(2,'0')}</strong></div><i><ChevronRight size={16}/></i></div>)}
        </div>

        <section className="content-card event-config">
          <div className="card-title"><div><h2>Configuração do evento</h2><p>Metadados usados pelo pipeline de conteúdo.</p></div><span className="saved"><Check size={13}/>Alterações salvas</span></div>
          <div className="form-grid">
            <label><span>IDENTIFICADOR <LockKeyhole size={11}/></span><input value={data.id} disabled/></label>
            <label><span>NOME DE EXIBIÇÃO</span><input value={data.name} onChange={e => setData({...data, name: e.target.value})}/></label>
            <label className={data.slug ? '' : 'field-error'}><span>SLUG DE PUBLICAÇÃO</span><input value={data.slug} placeholder="winter-rift-2026" onChange={e => setData({...data, slug: e.target.value})}/>{!data.slug && <small>Campo obrigatório para publicação</small>}</label>
            <label><span>ESTADO</span><div className="select-like">{data.status}<ChevronDown size={14}/></div></label>
            <label><span>INÍCIO DO EVENTO</span><input type="datetime-local" value={data.startsAt} onChange={e => setData({...data, startsAt: e.target.value})}/></label>
            <label><span>FIM DO EVENTO</span><input type="datetime-local" value={data.endsAt} onChange={e => setData({...data, endsAt: e.target.value})}/></label>
          </div>
        </section>

        <div className="lower-grid">
          <section className="content-card readiness-card">
            <div className="card-title"><div><h2>Prontidão de publicação</h2><p>Checklist obrigatório para staging.</p></div><ShieldCheck size={22}/></div>
            {[
              ['Identificadores únicos', true, '30 itens analisados'],
              ['Referências válidas', !data.broken, data.broken ? '1 referência quebrada' : '65 relações verificadas'],
              ['Localização completa', data.locales.length === 3, `${data.locales.length}/3 idiomas obrigatórios`],
              ['Janela de publicação', true, 'Datas e fuso válidos'],
            ].map(([label, ok, detail]: any) => <div className="check-row" key={label}><span className={ok ? 'ok' : 'bad'}>{ok ? <Check size={14}/> : <X size={14}/>}</span><div><b>{label}</b><small>{detail}</small></div><em>{ok ? 'OK' : 'AÇÃO'}</em></div>)}
          </section>
          <section className="content-card architecture-card">
            <div className="card-title"><div><h2>Fluxo do sistema</h2><p>Arquitetura do projeto de portfólio.</p></div><Zap size={20}/></div>
            <div className="arch-flow">
              <div><Code2 size={18}/><b>Editor</b><small>React + TS</small></div><ChevronRight size={16}/>
              <div><ShieldCheck size={18}/><b>Validator</b><small>C++20</small></div><ChevronRight size={16}/>
              <div><Rocket size={18}/><b>Pipeline</b><small>Python</small></div>
            </div>
            <div className="branch-row"><span className="valid-line"><Check size={12}/>Válido</span><span>Continuar para aprovação</span></div>
            <div className="branch-row"><span className="invalid-line"><X size={12}/>Inválido</span><span>Bloquear + relatório</span></div>
          </section>
        </div>
      </> : <CollectionView section={section} data={data}/>} 
    </div>
    <div className="action-footer">
      <div><Database size={15}/><span>Último autosave há 18s</span></div>
      <button className="secondary">Salvar rascunho</button>
      <button className="primary" onClick={goPipeline}>Continuar para staging<ChevronRight size={16}/></button>
      {!panelOpen && <span className="panel-hint">O painel de validação abrirá ao validar.</span>}
    </div>
  </>
}

function CollectionView({section, data}: {section: Section, data: ContentData}) {
  const config: Record<string, {name:string, id:string, status:string}[]> = {
    items: [
      {name:'Winter Orb', id:'ITEM_WINTER_ORB_01', status:'Ativo'}, {name:'Frostbound Icon', id:'ITEM_FROST_ICON_02', status:'Ativo'}, {name:'Aurora Emote', id:'ITEM_AURORA_EMOTE_03', status:'Ativo'}, {name:'Snowfall Capsule', id:'ITEM_SNOW_CAPSULE_04', status:'Rascunho'}],
    missions: [
      {name:'First Snow', id:'MSN_FIRST_SNOW', status:'Pronta'}, {name:'Frozen Frontline', id:'MSN_FROZEN_FRONT', status:'Pronta'}, {name:'Aurora Rising', id:'MSN_AURORA_RISE', status:'Revisão'}],
    rewards: [
      {name:'Milestone 01 — Winter Orb', id:'RWD_WINTER_001', status:'Válida'}, {name:'Milestone 02 — Icon', id:'RWD_WINTER_002', status:'Válida'}, {name:'Milestone 03 — Capsule', id:'RWD_WINTER_003', status:data.broken ? 'Erro' : 'Válida'}],
    store: [
      {name:'Winter Starter Bundle', id:'BND_WINTER_START', status:'1.350 RP'}, {name:'Aurora Premium Bundle', id:'BND_AURORA_PREM', status:'3.250 RP'}, {name:'Complete Event Pass', id:'BND_EVENT_PASS', status:'1.650 RP'}],
    localization: data.locales.map(l => ({name: l, id: `locale/${l}.json`, status:'100%'})),
  }
  const rows = config[section] || []
  return <section className="content-card collection-card">
    <div className="collection-toolbar"><div className="search-box"><Search size={15}/><input placeholder="Buscar por nome ou ID..."/></div><button className="primary"><Plus size={15}/>Adicionar</button></div>
    <div className="table-head"><span>NOME</span><span>IDENTIFICADOR</span><span>ESTADO</span><span></span></div>
    {rows.map((row, i) => <div className="table-row" key={row.id}><div className="row-name"><span>{i+1}</span><b>{row.name}</b></div><code>{row.id}</code><em className={row.status === 'Erro' ? 'error-status' : ''}>{row.status}</em><button><ChevronRight size={16}/></button></div>)}
    <div className="table-footer">Exibindo {rows.length} de {section === 'localization' ? data.locales.length : section === 'store' ? 3 : section === 'missions' ? data.missionCount : 30} registros</div>
  </section>
}

function ValidationPanel({validation, onClose, runValidation, goPipeline}: any) {
  const idle = validation === 'idle'
  const running = validation === 'running'
  const valid = validation === 'valid'
  return <aside className="validation-panel">
    <div className="panel-header"><div><ListChecks size={18}/><b>Relatório de validação</b></div><button onClick={onClose}><X size={18}/></button></div>
    <div className="panel-body">
      {idle && <div className="empty-state"><div><ClipboardCheck size={28}/></div><h3>Pronto para validar</h3><p>Execute as 24 regras do motor para encontrar erros antes do staging.</p><button className="primary" onClick={runValidation}><Play size={15}/>Executar agora</button></div>}
      {running && <div className="running-state"><div className="scan-orbit"><LoaderCircle className="spin" size={32}/></div><h3>Analisando conteúdo</h3><p>Validando referências, preços, missões e traduções...</p><div className="progress"><span/></div><code>validator --ruleset=24 winter_event.json</code></div>}
      {valid && <><div className="result-hero success"><CheckCircle2 size={28}/><div><h3>Conteúdo válido</h3><p>24 regras concluídas sem bloqueios.</p></div></div><div className="metrics"><span><b>0</b> erros</span><span><b>0</b> alertas</span><span><b>12ms</b> duração</span></div><div className="success-detail"><ShieldCheck size={20}/><div><b>Pronto para staging</b><p>Referências, preços, missões e traduções estão consistentes.</p></div></div><button className="primary full" onClick={goPipeline}>Abrir pipeline<ChevronRight size={15}/></button></>}
      {validation === 'invalid' && <><div className="result-hero failure"><XCircle size={28}/><div><h3>Publicação bloqueada</h3><p>2 erros e 1 alerta encontrados.</p></div></div><div className="metrics"><span><b>2</b> erros</span><span><b>1</b> alerta</span><span><b>15ms</b> duração</span></div><div className="issue-list">{issues.map(issue => <button className={`issue ${issue.severity}`} key={issue.code}><span>{issue.severity === 'error' ? <XCircle size={15}/> : <TriangleAlert size={15}/>}</span><div><small>{issue.code}</small><b>{issue.title}</b><p>{issue.detail}</p><code>{issue.path}</code></div><ChevronRight size={14}/></button>)}</div><button className="secondary full" onClick={runValidation}>Executar novamente</button></>}
    </div>
    {!idle && !running && <div className="panel-footer"><span><Terminal size={13}/>Engine v0.8.3</span><span>Ruleset #24</span></div>}
  </aside>
}

function PipelineView({step, setStep, showToast, setView}: any) {
  const stages = [
    {title:'Validar pacote', detail:'Motor C++ · 24 regras', icon: ShieldCheck},
    {title:'Criar snapshot', detail:'Manifest + artefatos', icon: ArchiveRestore},
    {title:'Publicar em staging', detail:'Ambiente isolado', icon: CloudUpload},
    {title:'Aprovação final', detail:'Revisão manual', icon: ClipboardCheck},
  ]
  function advance() {
    if (step < 4) { setStep(step + 1); showToast(`Etapa ${step} concluída`) }
    else showToast('Publicação simulada concluída')
  }
  return <div className="pipeline-page">
    <div className="page-header"><div><div className="breadcrumbs"><span>Winter Rift 2026</span><ChevronRight size={13}/><b>Pipeline de publicação</b></div><h1>Preparar release</h1><p>Promova o pacote validado para o ambiente de staging.</p></div><span className="pipeline-id">RUN #GCP-2841</span></div>
    <div className="pipeline-layout">
      <section className="content-card stage-list"><div className="card-title"><div><h2>Etapas da publicação</h2><p>Fluxo seguro, auditável e reversível.</p></div></div>
        {stages.map((stage, i) => {const n=i+1; const done=n<step; const active=n===step; return <div className={`stage-row ${done?'done':''} ${active?'active':''}`} key={stage.title}><div className="stage-number">{done?<Check size={15}/>:n}</div><div className="stage-icon"><stage.icon size={19}/></div><div><b>{stage.title}</b><span>{stage.detail}</span></div><em>{done?'Concluído':active?'Em andamento':'Pendente'}</em></div>})}
      </section>
      <aside className="release-card">
        <div className="release-art"><Rocket size={31}/><span>STAGING RELEASE</span></div>
        <h2>Winter Rift 2026</h2><code>EVT_WINTER_2026 · v1.9.0-rc1</code>
        <div className="release-details"><div><span>Artefatos</span><b>68 arquivos</b></div><div><span>Tamanho</span><b>142 KB</b></div><div><span>Commit</span><b>a82f9c1</b></div><div><span>Destino</span><b>staging-br1</b></div></div>
        <div className="release-note"><LockKeyhole size={15}/><p>Esta é uma simulação. Nenhum conteúdo real será publicado.</p></div>
        <button className="primary full" onClick={advance}>{step < 4 ? 'Executar etapa' : 'Finalizar simulação'}<ChevronRight size={16}/></button>
        <button className="ghost full" onClick={() => setView('editor')}>Voltar ao editor</button>
      </aside>
    </div>
  </div>
}

function HistoryView({showToast}: any) {
  return <div className="history-page">
    <div className="page-header"><div><div className="breadcrumbs"><span>Winter Rift 2026</span><ChevronRight size={13}/><b>Histórico</b></div><h1>Histórico de releases</h1><p>Audite alterações e restaure versões publicadas.</p></div><button className="secondary"><FileJson size={15}/>Exportar log</button></div>
    <section className="content-card timeline-card">
      <div className="timeline-line"/>
      {historyEntries.map((entry, i) => <div className="history-entry" key={entry.version}><div className={`timeline-dot ${entry.tone}`}>{i===0?<Rocket size={15}/>:i===1?<ArchiveRestore size={15}/>:<History size={15}/>}</div><div className="history-main"><div><span className={`history-state ${entry.tone}`}>{entry.state}</span><h2>{entry.version}</h2><code>{entry.hash}</code></div><p>{i===0?'Pacote aprovado e promovido para produção.':i===1?'Rollback executado após inconsistência de localização.':'Snapshot automático preservado antes do rollback.'}</p><div className="history-meta"><span>{entry.time}</span><span>por {entry.author}</span><span>68 artefatos</span></div></div><button className="secondary" onClick={() => showToast(`Snapshot ${entry.version} preparado para revisão`)}>{i===0?'Ver detalhes':'Restaurar'}</button></div>)}
    </section>
  </div>
}

function JsonModal({data, onClose, showToast}: any) {
  const json = JSON.stringify({event:{id:data.id,name:data.name,slug:data.slug,window:{start:data.startsAt,end:data.endsAt}},content:{items:data.itemCount,missions:data.missionCount,rewards:data.rewardCount,bundles:data.bundleCount},required_locales:data.locales}, null, 2)
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="json-modal" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><div><FileJson size={18}/><b>event.manifest.json</b><span>READ ONLY</span></div><button onClick={onClose}><X size={18}/></button></div><pre>{json}</pre><div className="modal-foot"><span><CheckCircle2 size={14}/>JSON bem-formado</span><button className="secondary" onClick={() => {navigator.clipboard?.writeText(json);showToast('JSON copiado')}}><Copy size={14}/>Copiar</button></div></div></div>
}

createRoot(document.getElementById('root')!).render(<App />)
