// Central type definitions for the fakefilter library

export interface DomainDetails {
  provider: string
  firstseen: number
  lastseen: number
  randomSubdomain: string | boolean
}

export interface FakeDomainResponse {
  retcode: number
  isFakeDomain: string | false
  details: DomainDetails | null
}

// shape of the bundled json/data.json feed; only `domains` keys are consumed
export interface FakeFilterDataset {
  version: number
  t: number
  domains: Record<string, unknown>
}
