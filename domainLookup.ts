/*

    Fast, correct domain lookup for the fakefilter dataset.

    Replaces the previous O(n) per-call scan that compiled a fresh RegExp for
    every one of the ~4,500 domains. Matching is now:
      - O(1) exact match via a Set
      - O(parts) suffix match by walking dot boundaries (no regex)

    This also fixes two correctness bugs in the old regex approach:
      1. unescaped dots in the domain were treated as wildcards
         (e.g. `mail.com` could match `sub.mailXcom`)
      2. the regex was not anchored, so a fake suffix appearing mid-host
         caused false positives (e.g. `sub.a.com.evil.org` matched `a.com`)

*/
//#region imports
import { FakeFilterDataset } from './types'
//#endregion

// Immutable lookup structure built once per dataset. Keys are normalized to
// lowercase so membership and suffix checks are case-insensitive and the input
// only needs to be normalized a single time.
export class DomainLookup {
  private readonly domains: Set<string>

  constructor(dataset: FakeFilterDataset) {
    this.domains = new Set<string>()
    for (const key of Object.keys(dataset.domains)) {
      this.domains.add(key.toLowerCase().trim())
    }
  }

  // Returns the matched fake domain (exact host or registrable suffix) or false.
  // A Set is used instead of direct property access so reserved keys such as
  // `constructor` or `toString` cannot produce prototype-chain false positives.
  match(domain: string): string | false {
    const normalized = domain.toLowerCase().trim()
    // exact match
    if (this.domains.has(normalized)) return normalized
    // suffix match on dot boundaries: a.b.fake.com -> fake.com
    const parts = normalized.split('.')
    for (let i = 1; i < parts.length; i++) {
      const suffix = parts.slice(i).join('.')
      if (this.domains.has(suffix)) return suffix
    }
    return false
  }
}

// Datasets are cached by identity so repeated lookups reuse the same Set.
// The bundled default dataset is a stable singleton object, so it is cached on
// first use just like any caller-provided dataset.
const cache = new WeakMap<FakeFilterDataset, DomainLookup>()

export function getLookup(dataset: FakeFilterDataset): DomainLookup {
  let lookup = cache.get(dataset)
  if (!lookup) {
    lookup = new DomainLookup(dataset)
    cache.set(dataset, lookup)
  }
  return lookup
}
