export interface DomainDetails {
    provider: string;
    firstseen: number;
    lastseen: number;
    randomSubdomain: string | boolean;
}
export interface FakeDomainResponse {
    retcode: number;
    isFakeDomain: string | false;
    details: DomainDetails | null;
}
export interface FakeFilterDataset {
    version: number;
    t: number;
    domains: Record<string, unknown>;
}
//# sourceMappingURL=types.d.ts.map