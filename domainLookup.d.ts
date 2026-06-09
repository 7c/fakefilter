import { FakeFilterDataset } from './types';
export declare class DomainLookup {
    private readonly domains;
    constructor(dataset: FakeFilterDataset);
    match(domain: string): string | false;
}
export declare function getLookup(dataset: FakeFilterDataset): DomainLookup;
//# sourceMappingURL=domainLookup.d.ts.map