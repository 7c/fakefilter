/**
 * Tests for the Map/Set based domain lookup and the correctness fixes it
 * brings over the previous O(n) regex implementation:
 *   - exact + suffix matching is case-insensitive and trims input
 *   - dots in domains are literal, not regex wildcards
 *   - suffix matches are anchored to the end of the host (no mid-host hits)
 *   - reserved object keys cannot cause prototype-chain false positives
 *   - custom datasets are still supported and cached
 */
//#region imports
import { isFakeDomain } from '../index'
import { DomainLookup, getLookup } from '../domainLookup'
import { FakeFilterDataset } from '../types'
//#endregion

// builds a minimal but type-complete dataset from a list of fake domains
function dataset(...domains: string[]): FakeFilterDataset {
  const map: Record<string, unknown> = {}
  for (const d of domains) map[d] = { provider: 'test' }
  return { version: 1, t: 0, domains: map }
}

describe('DomainLookup.match', () => {
  it('returns the key on an exact match', () => {
    expect(new DomainLookup(dataset('grr.la')).match('grr.la')).toBe('grr.la')
  })

  it('normalizes case and surrounding whitespace', () => {
    expect(new DomainLookup(dataset('grr.la')).match('  GRR.LA  ')).toBe('grr.la')
  })

  it('matches subdomains of any depth', () => {
    const lookup = new DomainLookup(dataset('grr.la'))
    expect(lookup.match('sub.grr.la')).toBe('grr.la')
    expect(lookup.match('a.b.c.grr.la')).toBe('grr.la')
  })

  it('returns false for an unknown host', () => {
    expect(new DomainLookup(dataset('grr.la')).match('totally-unknown.com')).toBe(false)
  })
})

describe('correctness fixes vs the old regex implementation', () => {
  it('treats dots in the domain as literal, not as regex wildcards', () => {
    // old regex `.+\.mail.com` let the dot before "com" match any char,
    // so `sub.mailXcom` was a false positive
    const lookup = new DomainLookup(dataset('mail.com'))
    expect(lookup.match('sub.mailXcom')).toBe(false)
    expect(lookup.match('sub.mailxcom')).toBe(false)
    // the genuine subdomain still matches
    expect(lookup.match('sub.mail.com')).toBe('mail.com')
  })

  it('anchors the suffix to the end of the host (no mid-host matches)', () => {
    // old unanchored regex matched `a.com` inside `sub.a.com.evil.org`
    const lookup = new DomainLookup(dataset('a.com'))
    expect(lookup.match('sub.a.com.evil.org')).toBe(false)
    expect(lookup.match('a.com.evil.org')).toBe(false)
    // real matches are unaffected
    expect(lookup.match('a.com')).toBe('a.com')
    expect(lookup.match('sub.a.com')).toBe('a.com')
  })

  it('matches subdomains case-insensitively', () => {
    // old code lowercased only the exact check; the subdomain regex used the
    // raw input, so an uppercased subdomain host slipped through as false
    const lookup = new DomainLookup(dataset('grr.la'))
    expect(lookup.match('SUB.GRR.LA')).toBe('grr.la')
  })

  it('does not match a host that merely starts with a known domain', () => {
    // `test.com` must not match `subtest.com`
    const lookup = new DomainLookup(dataset('test.com'))
    expect(lookup.match('subtest.com')).toBe(false)
  })

  it('is immune to prototype-chain keys', () => {
    const lookup = new DomainLookup(dataset('realfake.com'))
    expect(lookup.match('constructor')).toBe(false)
    expect(lookup.match('toString')).toBe(false)
    expect(lookup.match('hasOwnProperty')).toBe(false)
    expect(lookup.match('__proto__')).toBe(false)
  })
})

describe('getLookup caching', () => {
  it('returns the same instance for the same dataset object', () => {
    const ds = dataset('grr.la')
    expect(getLookup(ds)).toBe(getLookup(ds))
  })

  it('builds separate instances for different dataset objects', () => {
    expect(getLookup(dataset('a.com'))).not.toBe(getLookup(dataset('a.com')))
  })
})

describe('isFakeDomain public API with the new lookup', () => {
  it('honours an explicitly provided dataset', () => {
    const ds = dataset('custom.io')
    expect(isFakeDomain('custom.io', ds)).toBe('custom.io')
    expect(isFakeDomain('sub.custom.io', ds)).toBe('custom.io')
    expect(isFakeDomain('grr.la', ds)).toBe(false)
  })

  it('applies the fixes through the public function', () => {
    const ds = dataset('a.com')
    expect(isFakeDomain('sub.a.com.evil.org', ds)).toBe(false)
    expect(isFakeDomain('sub.a.com', ds)).toBe('a.com')
  })
})
