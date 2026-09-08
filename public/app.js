const $ = (id) => document.getElementById(id);
const state = { phenomena: [], phenomenon: null, perspectives: [], framings: [], observations: [], sources: [], insights: [], snapshot: null };

const actorColors = {
  ACADEMIC:"#7d8cff", CORPORATE:"#d7ff69", GLOBAL:"#ffad66", GOVERNMENT:"#62d6ff",
  MEDIA:"#ff82b2", COMMUNITY:"#ff8a7b", SCIENTIFIC:"#75e0b7", PUBLIC:"#e7e7e7"
};

async function get(path){
  const response = await fetch(path);
  if(!response.ok) throw new Error(`${response.status} ${path}`);
  return response.json();
}

function pct(value){ return `${Math.round((Number(value)||0)*100)}%`; }
function date(value){ return value ? new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(new Date(value)) : "—"; }
function esc(value=""){ return String(value).replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }

async function boot(){
  try{
    const [health, listing] = await Promise.all([get("/health"), get("/phenomena")]);
    $("health").textContent = health.status === "ok" ? "LIVE" : "DEGRADED";
    state.phenomena = listing.items;
    $("phenomenonSelect").innerHTML = listing.items.map(p=>`<option value="${esc(p.id)}">${esc(p.title)}</option>`).join("");
    $("phenomenonSelect").addEventListener("change",()=>loadPhenomenon($("phenomenonSelect").value));
    if(listing.items[0]) await loadPhenomenon(listing.items[0].id);
  }catch(error){
    $("health").textContent="OFFLINE";
    $("perspectiveGrid").innerHTML=`<div class="empty">Unable to load JIZZ observatory: ${esc(error.message)}</div>`;
  }
}

async function loadPhenomenon(id){
  const [phenomenon,perspectives,framings,observations,sources,insights,snapshots] = await Promise.all([
    get(`/phenomena/${id}`),
    get(`/phenomena/${id}/perspectives`),
    get(`/phenomena/${id}/framings`),
    get(`/phenomena/${id}/observations`),
    get(`/phenomena/${id}/sources`),
    get(`/phenomena/${id}/insights`),
    get(`/phenomena/${id}/snapshots`)
  ]);
  Object.assign(state,{phenomenon,perspectives,framings,observations,sources,insights,snapshot:snapshots.at(-1)??null});
  renderHeader(); setupFilters(); renderField(); renderBars(); renderSources(); renderInsight();
}

function renderHeader(){
  const p=state.phenomenon, s=state.snapshot;
  $("corpusKind").textContent=(p.corpus_kind??"FIXTURE").replaceAll("_"," ");
  $("phenomenonTitle").textContent=p.title;
  $("phenomenonDescription").textContent=p.description;
  $("keywords").innerHTML=(p.keywords??[]).map(k=>`<span>${esc(k)}</span>`).join("");
  $("metricObservations").textContent=s?.observation_count ?? state.observations.length;
  $("metricPerspectives").textContent=s?.perspective_count ?? state.perspectives.length;
  $("metricActors").textContent=s?.actor_count ?? new Set(state.perspectives.map(p=>p.actor_reference)).size;
  $("metricGeographies").textContent=s?.geography_count ?? new Set(state.perspectives.map(p=>p.geography)).size;
  $("metricDivergence").textContent=s ? pct(s.metrics.divergence) : "—";
  $("metricUncertainty").textContent=s ? pct(s.uncertainty) : "—";
}

function setupFilters(){
  const actors=[...new Set(state.perspectives.map(p=>p.actor_type))].sort();
  const positions=[...new Set(state.perspectives.map(p=>p.position))].sort();
  $("actorFilter").innerHTML='<option value="">All actors</option>'+actors.map(x=>`<option>${esc(x)}</option>`).join("");
  $("positionFilter").innerHTML='<option value="">All positions</option>'+positions.map(x=>`<option>${esc(x)}</option>`).join("");
  $("actorFilter").onchange=renderField;
  $("positionFilter").onchange=renderField;
}

function renderField(){
  const actor=$("actorFilter").value, position=$("positionFilter").value;
  const rows=state.perspectives.filter(p=>(!actor||p.actor_type===actor)&&(!position||p.position===position));
  if(!rows.length){ $("perspectiveGrid").innerHTML='<div class="empty">No perspective matches these filters.</div>'; return; }
  const frames=new Map(state.framings.map(f=>[f.perspective_id,f]));
  $("perspectiveGrid").innerHTML=rows.map(p=>{
    const frame=frames.get(p.id);
    const accent=actorColors[p.actor_type]??"#8f85ff";
    return `<article class="perspective-card" style="--card-accent:${accent}">
      <div class="card-meta">
        <span class="tag">${esc(p.actor_type)}</span>
        <span class="tag position">${esc(p.position)}</span>
        <span class="tag">${esc(p.geography)}</span>
        ${frame?`<span class="tag">${esc(frame.dimension)}</span>`:""}
      </div>
      <h3>${esc(labelActor(p.actor_reference))}</h3>
      <p>${esc(p.summary??"")}</p>
      <div class="card-foot"><span>salience ${pct(p.salience)}</span><span>since ${date(p.valid_from)}</span></div>
    </article>`;
  }).join("");
}

function labelActor(ref){
  return String(ref).split(":").at(-1).split("-").map(w=>w? w[0].toUpperCase()+w.slice(1):w).join(" ");
}

function renderBars(){
  renderBarGroup("framingBars",state.snapshot?.framing_distribution??count(state.framings.map(f=>f.dimension)));
  renderBarGroup("positionBars",state.snapshot?.position_distribution??count(state.perspectives.map(p=>p.position)));
}
function count(values){ return values.reduce((a,v)=>(a[v]=(a[v]||0)+1,a),{}); }
function renderBarGroup(id,data){
  const entries=Object.entries(data); const max=Math.max(1,...entries.map(([,v])=>v));
  $(id).innerHTML=entries.map(([label,value])=>`<div class="bar-row"><span>${esc(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${value/max*100}%"></div></div><b>${value}</b></div>`).join("");
}

function renderSources(){
  const obsBySource=new Map(state.observations.map(o=>[o.source_id,o]));
  $("sourceCount").textContent=`${state.sources.length} SOURCES`;
  $("sourceList").innerHTML=state.sources.map(source=>{
    const obs=obsBySource.get(source.id);
    return `<a class="source-item" href="${esc(source.url??"#")}" target="_blank" rel="noreferrer">
      <span class="source-publisher">${esc(source.publisher)}</span>
      <span class="source-signal">${esc(obs?.extracted_signal??source.metadata?.scope??"")}</span>
      <span class="source-date">${date(source.published_at)} ↗</span>
    </a>`;
  }).join("");
}

function renderInsight(){
  const insight=state.insights.at(-1);
  $("insightText").textContent=insight?.text ?? "No derived insight yet. JIZZ preserves the field until the evidence supports one.";
  $("insightMeta").textContent=insight ? `confidence ${pct(insight.confidence)} · coverage ${pct(insight.coverage)} · ${date(insight.generated_at)}` : "";
}

boot();
