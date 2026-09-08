import { useMemo, useState } from "react"
import {
  Badge,
  Button,
  MoonWitnessRegistryAssetImage,
  ObservatorySectionNav,
  ResearchDomainOwnershipMap,
  canonicalOwnerFor,
} from "@rocksoul/ui"
import { liveBundles } from "./generated/live-corpus"
import type { LiveBundle, Perspective } from "./types"

const sections = [
  { id: "field", label: "FIELD" },
  { id: "frames", label: "FRAMING" },
  { id: "signals", label: "SIGNALS" },
  { id: "sources", label: "SOURCES" },
  { id: "method", label: "METHOD" },
]

const actorLabels: Record<string, string> = {
  ACADEMIC: "Academic",
  CORPORATE: "Corporate",
  GLOBAL: "Global institution",
  GOVERNMENT: "Government",
  MEDIA: "Media",
  COMMUNITY: "Community",
  SCIENTIFIC: "Scientific",
  PUBLIC: "Public",
  INVESTOR: "Investor",
  CREATOR: "Creator",
  ACTIVIST: "Activist",
}

function percent(value = 0) {
  return `${Math.round(value * 100)}%`
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value))
}

function actorName(ref: string) {
  return ref
    .split(":")
    .at(-1)!
    .split("-")
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(" ")
}

function Metric({ label, value, note, accent = false }: { label: string; value: string | number; note?: string; accent?: boolean }) {
  return (
    <article className={`metric-card ${accent ? "metric-card--accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  )
}

function PerspectiveCard({ perspective, frame }: { perspective: Perspective; frame?: LiveBundle["framings"][number] }) {
  return (
    <article className="perspective-card">
      <div className="perspective-card__meta">
        <Badge variant={perspective.position === "SUPPORT" ? "supported" : perspective.position === "QUESTIONING" ? "partial" : "neutral"}>
          {perspective.position}
        </Badge>
        <span>{actorLabels[perspective.actor_type] ?? perspective.actor_type}</span>
        <span>{perspective.geography}</span>
      </div>
      <h3>{actorName(perspective.actor_reference)}</h3>
      <p>{perspective.summary}</p>
      <div className="perspective-card__lens">
        <span>{frame?.dimension ?? perspective.zone}</span>
        <strong>{frame?.label ?? "Perspective recorded"}</strong>
      </div>
      <div className="perspective-card__footer">
        <span>salience {percent(perspective.salience)}</span>
        <span>{formatDate(perspective.valid_from)}</span>
      </div>
    </article>
  )
}

function DistributionBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data)
  const max = Math.max(1, ...entries.map(([, value]) => value))
  return (
    <div className="distribution-bars">
      {entries.map(([label, value]) => (
        <div className="distribution-row" key={label}>
          <span>{label}</span>
          <div className="distribution-track">
            <i style={{ width: `${(value / max) * 100}%` }} />
          </div>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

export function App() {
  const [selectedId, setSelectedId] = useState(liveBundles[0]?.phenomenon.id ?? "")
  const [actor, setActor] = useState("")
  const [position, setPosition] = useState("")

  const bundle = useMemo(
    () => liveBundles.find((item) => item.phenomenon.id === selectedId) ?? liveBundles[0],
    [selectedId],
  )

  const snapshot = bundle.perspective_snapshots.at(-1)
  const insight = bundle.insights.at(-1)
  const owner = canonicalOwnerFor("PERSPECTIVE")
  const frames = new Map(bundle.framings.map((frame) => [frame.perspective_id, frame]))
  const observationsBySource = new Map(bundle.observations.map((observation) => [observation.source_id, observation]))

  const actors = [...new Set(bundle.perspectives.map((item) => item.actor_type))].sort()
  const positions = [...new Set(bundle.perspectives.map((item) => item.position))].sort()

  const perspectives = bundle.perspectives.filter((item) => (
    (!actor || item.actor_type === actor) &&
    (!position || item.position === position)
  ))

  return (
    <div className="jizz-app">
      <header className="site-header">
        <a href="#top" className="brand-lockup">
          <span className="brand-lockup__mark">J</span>
          <span>
            <b>JIZZ</b>
            <small>JUXTAPOSE · INTELLIGENCE · ZIGZAG · ZONE</small>
          </span>
        </a>
        <div className="site-header__right">
          <Badge variant="supported">LIVE RESEARCH</Badge>
          <span className="owner-chip">{owner.repository} / main</span>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero__visual" aria-hidden="true">
            <MoonWitnessRegistryAssetImage
              pack="cinematic-hero"
              assetId="data-observatory"
              alt=""
            />
          </div>
          <div className="hero__content">
            <p className="eyebrow">MULTI-PERSPECTIVE INTELLIGENCE</p>
            <h1>HOW IS THE WORLD<br /><em>SEEING IT?</em></h1>
            <p className="hero__lead">
              JIZZ compares how the same phenomenon is framed, interpreted, reacted to, and changed over time —
              without collapsing disagreement into a verdict.
            </p>
            <div className="hero__controls">
              <label>
                <span>LIVE PHENOMENON</span>
                <select value={bundle.phenomenon.id} onChange={(event) => setSelectedId(event.currentTarget.value)}>
                  {liveBundles.map((item) => (
                    <option value={item.phenomenon.id} key={item.phenomenon.id}>
                      {item.phenomenon.title}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="secondary"
                onClick={() => window.open(bundle.research_issue.url, "_blank", "noopener,noreferrer")}
              >
                RESEARCH ISSUE #{bundle.research_issue.number}
              </Button>
            </div>
          </div>
        </section>

        <ObservatorySectionNav items={sections} offset={88} className="section-nav" />

        <section className="phenomenon-brief">
          <div>
            <p className="eyebrow">PHENOMENON / {bundle.phenomenon.zone ?? "GLOBAL"}</p>
            <h2>{bundle.phenomenon.title}</h2>
            <p>{bundle.phenomenon.description}</p>
          </div>
          <div className="keyword-cloud">
            {bundle.phenomenon.keywords?.map((keyword) => <span key={keyword}>{keyword}</span>)}
          </div>
        </section>

        <section className="metric-grid" aria-label="Perspective field metrics">
          <Metric label="OBSERVATIONS" value={snapshot?.observation_count ?? bundle.observations.length} />
          <Metric label="PERSPECTIVES" value={snapshot?.perspective_count ?? bundle.perspectives.length} />
          <Metric label="ACTORS" value={snapshot?.actor_count ?? new Set(bundle.perspectives.map((p) => p.actor_reference)).size} />
          <Metric label="GEOGRAPHIES" value={snapshot?.geography_count ?? new Set(bundle.perspectives.map((p) => p.geography)).size} />
          <Metric label="DIVERGENCE" value={percent(snapshot?.metrics.divergence)} note="not a truth score" accent />
          <Metric label="UNCERTAINTY" value={percent(snapshot?.uncertainty)} note="coverage-aware" />
        </section>

        <section className="insight-panel">
          <div className="insight-panel__label">CURRENT INSIGHT</div>
          <blockquote>
            {insight?.text ?? "The field is still being assembled. JIZZ will not invent consensus to fill missing evidence."}
          </blockquote>
          <div className="insight-panel__meta">
            {insight ? (
              <>
                <span>confidence {percent(insight.confidence)}</span>
                <span>coverage {percent(insight.coverage)}</span>
                <span>{formatDate(insight.generated_at)}</span>
              </>
            ) : null}
          </div>
        </section>

        <section id="field" className="content-section">
          <header className="section-heading">
            <div>
              <p className="eyebrow">PERSPECTIVE FIELD</p>
              <h2>One phenomenon.<br />Multiple lenses.</h2>
            </div>
            <div className="filters">
              <label>
                <span>ACTOR</span>
                <select value={actor} onChange={(event) => setActor(event.currentTarget.value)}>
                  <option value="">All actor classes</option>
                  {actors.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label>
                <span>POSITION</span>
                <select value={position} onChange={(event) => setPosition(event.currentTarget.value)}>
                  <option value="">All positions</option>
                  {positions.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
            </div>
          </header>
          <div className="perspective-grid">
            {perspectives.map((perspective) => (
              <PerspectiveCard
                key={perspective.id}
                perspective={perspective}
                frame={frames.get(perspective.id)}
              />
            ))}
          </div>
        </section>

        <section id="frames" className="split-section">
          <article className="analysis-panel">
            <p className="eyebrow">FRAMING MAP</p>
            <h2>Which lenses are active?</h2>
            <DistributionBars data={snapshot?.framing_distribution ?? {}} />
          </article>
          <article className="analysis-panel">
            <p className="eyebrow">POSITION MAP</p>
            <h2>How aligned is the field?</h2>
            <DistributionBars data={snapshot?.position_distribution ?? {}} />
          </article>
        </section>

        <section id="signals" className="content-section">
          <header className="section-heading">
            <div>
              <p className="eyebrow">ZIGZAG / SIGNALS</p>
              <h2>Watch the field move.</h2>
            </div>
            <p className="section-copy">
              Signals are derived observations about the perspective field. They are not facts about the underlying phenomenon.
            </p>
          </header>
          <div className="signal-grid">
            {bundle.signals.length ? bundle.signals.map((signal) => (
              <article key={signal.id} className="signal-card">
                <Badge variant="info">{signal.signal_type}</Badge>
                <strong>{percent(signal.confidence)}</strong>
                <p>{signal.rationale ?? "Derived from the current source-scoped field."}</p>
                <small>{formatDate(signal.timestamp)}</small>
              </article>
            )) : <p className="empty-state">No signal has passed the methodology gate yet.</p>}
          </div>
        </section>

        <section id="sources" className="content-section">
          <header className="section-heading">
            <div>
              <p className="eyebrow">SOURCE TRAIL</p>
              <h2>Every view stays traceable.</h2>
            </div>
            <Badge variant="neutral">{bundle.sources.length} SOURCES</Badge>
          </header>
          <div className="source-list">
            {bundle.sources.map((source) => {
              const observation = observationsBySource.get(source.id)
              return (
                <a className="source-row" key={source.id} href={source.url} target="_blank" rel="noreferrer">
                  <span className="source-row__publisher">{source.publisher}</span>
                  <span className="source-row__signal">{observation?.extracted_signal ?? String(source.metadata?.scope ?? "")}</span>
                  <span className="source-row__meta">
                    {source.country ?? "GLOBAL"} · {source.language ?? "—"} · {formatDate(source.published_at)} ↗
                  </span>
                </a>
              )
            })}
          </div>
        </section>

        <section id="method" className="method-section">
          <div className="method-card method-card--primary">
            <p className="eyebrow">BOUNDARY</p>
            <h2>No winning perspective.</h2>
            <p>
              Observation ≠ fact · Perspective ≠ truth · Framing ≠ story · Reaction ≠ event · Article volume ≠ consensus.
            </p>
          </div>
          <div className="method-card">
            <p className="eyebrow">METHOD</p>
            <h3>{bundle.methodologies[0]?.name ?? "Traceable perspective analysis"}</h3>
            <p>{bundle.methodologies[0]?.description ?? "Every derived view remains traceable to source-scoped observations."}</p>
          </div>
          <div className="method-card">
            <p className="eyebrow">LINEAGE</p>
            <h3>Issue first.</h3>
            <p>
              Live research is promoted only with parent GitHub issue lineage. This bundle traces to issue #{bundle.research_issue.number}.
            </p>
          </div>
        </section>

        <section className="ownership-section">
          <header className="section-heading">
            <div>
              <p className="eyebrow">ROCKSOUL OWNERSHIP</p>
              <h2>JIZZ owns the view.<br />Not the thing.</h2>
            </div>
          </header>
          <ResearchDomainOwnershipMap />
        </section>
      </main>

      <footer>
        <span>ROCKSOUL / JIZZ</span>
        <strong>THE WORLD, FROM EVERY ANGLE.</strong>
        <span>UI → rocksoul-ui · VISUALS → rocksoul-assets</span>
      </footer>
    </div>
  )
}
