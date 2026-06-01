/*

    Benchmark: the shipped isFakeDomain() (Set + suffix lookup) vs the
    previous O(n) per-call regex scan.

    The "new" side calls the real exported isFakeDomain so the numbers track
    the actual shipped code. The "old" side is a local copy of the removed
    regex implementation, kept only as a baseline for comparison.

    Run with: npm run bench   (or: npx ts-node bench/compare.ts)

*/
//#region imports
import { isFakeDomain } from '../index'
import staticJsonV1 from '../json/data.json'
import { FakeFilterDataset } from '../types'
//#endregion

const dataset = staticJsonV1 as unknown as FakeFilterDataset
const domains = Object.keys(dataset.domains)

// Baseline: the previous implementation, preserved here only for comparison.
function isFakeDomainOld(domain: string): string | false {
  for (const dom of Object.keys(dataset.domains)) {
    if (dom === domain.toLowerCase().trim()) return dom
    if (domain.search(new RegExp(`.+\\.${dom}`)) === 0) return dom
  }
  return false
}

// "new" side uses the real shipped function against the default dataset
const isFakeDomainNew = (domain: string): string | false => isFakeDomain(domain)

// build a realistic mixed workload from live data
const workload: string[] = []
for (const d of domains) {
  workload.push(d)                                          // exact match
  workload.push(`sub.${d}`)                                 // subdomain match
  workload.push(`a.b.${d}`)                                 // deep subdomain match
  workload.push(`notreal-${d.replace(/\./g, '')}.example`)  // guaranteed miss
}

console.log(`dataset domains : ${domains.length}`)
console.log(`workload size   : ${workload.length} lookups\n`)

// correctness comparison on a sample (old method is too slow for the full set)
const sampleStep = Math.max(1, Math.floor(workload.length / 2000))
const sample = workload.filter((_, i) => i % sampleStep === 0)
let mismatches = 0
const examples: Array<{ input: string; old: string | false; updated: string | false }> = []
for (const input of sample) {
  const a = isFakeDomainOld(input)
  const b = isFakeDomainNew(input)
  if (Boolean(a) !== Boolean(b)) {
    mismatches++
    if (examples.length < 8) examples.push({ input, old: a, updated: b })
  }
}
console.log(`correctness sample size: ${sample.length}`)
console.log(`result mismatches (hit/miss differs): ${mismatches}`)
if (examples.length) {
  console.log('examples:')
  for (const e of examples) console.log(`  ${e.input}  ->  old=${e.old}  new=${e.updated}`)
}
console.log('')

// timing helper
function time(label: string, fn: (domain: string) => string | false, iterations: number): number {
  // warmup
  for (let i = 0; i < Math.min(iterations, 1000); i++) fn(workload[i % workload.length])
  const start = process.hrtime.bigint()
  for (let i = 0; i < iterations; i++) fn(workload[i % workload.length])
  const ns = Number(process.hrtime.bigint() - start)
  const perOp = ns / iterations
  const opsSec = 1e9 / perOp
  console.log(
    `${label.padEnd(8)} | ${iterations.toLocaleString()} lookups | ` +
    `${(ns / 1e6).toFixed(1)} ms total | ${perOp.toFixed(0)} ns/op | ` +
    `${Math.round(opsSec).toLocaleString()} ops/sec`
  )
  return perOp
}

// old method is ~1000x slower, so give it far fewer iterations
const oldIters = 3000
const newIters = 2000000

console.log('timing:')
const oldPerOp = time('old', isFakeDomainOld, oldIters)
const newPerOp = time('new', isFakeDomainNew, newIters)
console.log(`\nspeedup (ns/op): ${(oldPerOp / newPerOp).toFixed(0)}x faster`)
