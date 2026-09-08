import test from "node:test";
import assert from "node:assert/strict";
import { loadLiveBundles, loadCorpus, route } from "../src/runtime.mjs";

test("live observatory exposes researched phenomena instead of only the synthetic fixture", async()=>{
  const live=await loadLiveBundles();
  assert.ok(live.length>=1);
  assert.ok(live.every((bundle)=>bundle.corpus_kind==="LIVE_RESEARCH"));
  assert.ok(live[0].sources.length>=3);
  assert.ok(live[0].perspectives.length>=3);

  const corpus=await loadCorpus();
  const listing=route("GET","/phenomena",corpus);
  assert.equal(listing.status,200);
  assert.equal(listing.body.count,live.length);
  assert.equal(listing.body.items[0].corpus_kind,"LIVE_RESEARCH");
});

test("live phenomenon exposes sources, perspectives and a reconstructable snapshot", async()=>{
  const [bundle]=await loadLiveBundles();
  const id=bundle.phenomenon.id;
  assert.equal(route("GET",`/phenomena/${id}/sources`,[bundle]).body.length,bundle.sources.length);
  assert.equal(route("GET",`/phenomena/${id}/perspectives`,[bundle]).body.length,bundle.perspectives.length);
  const snapshots=route("GET",`/phenomena/${id}/snapshots`,[bundle]).body;
  assert.ok(snapshots.at(-1).metrics.divergence>0.5);
  assert.ok(snapshots.at(-1).uncertainty>0);
});
