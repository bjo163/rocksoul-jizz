import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { snapshotFor } from "../src/analytics.mjs";
import { uniqueIds } from "../src/model.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const liveDir=path.join(root,"data/live");
const ajv=new Ajv2020({allErrors:true,strict:false});
addFormats(ajv);

function invariant(condition,message){ if(!condition) throw new Error(message); }
function readJson(file){ return JSON.parse(fs.readFileSync(file,"utf8")); }
function schema(name){ return readJson(path.join(root,"schemas",name)); }
function compile(name){ return ajv.compile(schema(name)); }

const validators={
  sources:compile("source.schema.json"),
  observations:compile("observation.schema.json"),
  phenomenon:compile("phenomenon.schema.json"),
  perspectives:compile("perspective.schema.json"),
  framings:compile("framing.schema.json"),
  reactions:compile("reaction.schema.json"),
  signals:compile("signal.schema.json"),
  changes:compile("change.schema.json"),
  perspective_snapshots:compile("perspective-snapshot.schema.json"),
  insights:compile("insight.schema.json"),
  provenance:compile("provenance.schema.json"),
  research_runs:compile("research-run.schema.json"),
  methodologies:compile("methodology.schema.json")
};

const files=fs.existsSync(liveDir)
  ? fs.readdirSync(liveDir).filter((name)=>name.endsWith(".json")).sort()
  : [];
invariant(files.length>0,"live corpus is empty");

let recordCount=0;
for(const name of files){
  const bundle=readJson(path.join(liveDir,name));
  invariant(bundle.domain==="PERSPECTIVE",`${name}: domain must be PERSPECTIVE`);
  invariant(bundle.corpus_kind==="LIVE_RESEARCH",`${name}: corpus_kind must be LIVE_RESEARCH`);
  invariant(validators.phenomenon(bundle.phenomenon),`${name}: phenomenon schema failed ${JSON.stringify(validators.phenomenon.errors)}`);

  const families=[
    "sources","observations","perspectives","framings","reactions","signals","changes",
    "perspective_snapshots","insights","provenance","research_runs","methodologies"
  ];
  for(const family of families) invariant(Array.isArray(bundle[family]),`${name}: missing ${family}`);

  const records=[bundle.phenomenon,...families.flatMap((family)=>bundle[family])];
  uniqueIds(records);
  recordCount+=records.length;

  for(const family of families){
    const validate=validators[family];
    if(!validate) continue;
    for(const row of bundle[family]){
      invariant(validate(row),`${name}: ${row.id??family} failed schema: ${JSON.stringify(validate.errors)}`);
      invariant(row.domain==="PERSPECTIVE",`${name}: non-PERSPECTIVE record ${row.id}`);
    }
  }

  const sourceIds=new Set(bundle.sources.map((r)=>r.id));
  const observationIds=new Set(bundle.observations.map((r)=>r.id));
  const perspectiveIds=new Set(bundle.perspectives.map((r)=>r.id));
  const methodologyIds=new Set(bundle.methodologies.map((r)=>r.id));
  const provenanceIds=new Set(bundle.provenance.map((r)=>r.id));
  const signalIds=new Set(bundle.signals.map((r)=>r.id));
  const changeIds=new Set(bundle.changes.map((r)=>r.id));

  invariant(bundle.sources.length>=3,`${name}: live phenomenon needs at least three independent sources`);
  invariant(bundle.perspectives.length>=3,`${name}: live phenomenon needs at least three perspectives`);
  invariant(new Set(bundle.sources.map((r)=>r.publisher)).size>=3,`${name}: source diversity too low`);

  for(const source of bundle.sources){
    invariant(source.freshness!=="UNAVAILABLE",`${name}: unavailable source included as active live evidence ${source.id}`);
    invariant(!String(source.publisher).toLowerCase().includes("synthetic"),`${name}: synthetic source leaked into live corpus`);
    invariant(provenanceIds.has(source.provenance_id),`${name}: source provenance missing ${source.id}`);
  }
  for(const observation of bundle.observations){
    invariant(sourceIds.has(observation.source_id),`${name}: observation source missing ${observation.id}`);
    invariant(observation.phenomenon_id===bundle.phenomenon.id,`${name}: observation phenomenon mismatch ${observation.id}`);
    invariant(provenanceIds.has(observation.provenance_id),`${name}: observation provenance missing ${observation.id}`);
  }
  for(const perspective of bundle.perspectives){
    invariant(perspective.phenomenon_id===bundle.phenomenon.id,`${name}: perspective phenomenon mismatch ${perspective.id}`);
    invariant(perspective.observation_refs.every((id)=>observationIds.has(id)),`${name}: perspective observation missing ${perspective.id}`);
    invariant(provenanceIds.has(perspective.provenance_id),`${name}: perspective provenance missing ${perspective.id}`);
  }
  for(const framing of bundle.framings){
    invariant(perspectiveIds.has(framing.perspective_id),`${name}: framing perspective missing ${framing.id}`);
  }
  for(const reaction of bundle.reactions){
    invariant(reaction.observation_refs.every((id)=>observationIds.has(id)),`${name}: reaction observation missing ${reaction.id}`);
  }
  for(const signal of bundle.signals){
    invariant(methodologyIds.has(signal.methodology_id),`${name}: signal methodology missing ${signal.id}`);
    invariant(signal.inputs.every((id)=>observationIds.has(id)),`${name}: signal input missing ${signal.id}`);
  }
  for(const change of bundle.changes){
    invariant(methodologyIds.has(change.methodology_id),`${name}: change methodology missing ${change.id}`);
    invariant(change.input_signal_ids.every((id)=>signalIds.has(id)),`${name}: change signal missing ${change.id}`);
    invariant(change.input_observation_ids.every((id)=>observationIds.has(id)),`${name}: change observation missing ${change.id}`);
  }
  for(const insight of bundle.insights){
    invariant(methodologyIds.has(insight.methodology_id),`${name}: insight methodology missing ${insight.id}`);
    invariant(insight.input_observation_ids.every((id)=>observationIds.has(id)),`${name}: insight observation missing ${insight.id}`);
    invariant(insight.input_signal_ids.every((id)=>signalIds.has(id)),`${name}: insight signal missing ${insight.id}`);
    invariant(insight.input_change_ids.every((id)=>changeIds.has(id)),`${name}: insight change missing ${insight.id}`);
  }
  for(const snapshot of bundle.perspective_snapshots){
    invariant(methodologyIds.has(snapshot.methodology_id),`${name}: snapshot methodology missing ${snapshot.id}`);
    const recomputed=snapshotFor(bundle,snapshot.timestamp);
    for(const key of ["observation_count","source_count","actor_count","geography_count","perspective_count"]){
      invariant(recomputed[key]===snapshot[key],`${name}: snapshot drift ${snapshot.id} ${key}`);
    }
    for(const [metric,value] of Object.entries(snapshot.metrics)){
      invariant(Math.abs(recomputed.metrics[metric]-value)<0.000001,`${name}: snapshot metric drift ${snapshot.id} ${metric}`);
    }
  }
}

console.log(`JIZZ live validation passed: ${files.length} phenomena, ${recordCount} live records.`);
