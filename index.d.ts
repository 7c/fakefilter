import { FakeDomainResponse, FakeFilterDataset } from './types';
export type { DomainDetails, FakeDomainResponse } from './types';
export declare function hostnameFromEmailAddress(email: any): string | null;
export declare function isFakeDomain(domain: string, json?: boolean | FakeFilterDataset): string | false;
export declare function fetch(url: string, timeout?: number, json?: boolean): Promise<any>;
export declare function isFakeEmail(email: string, json?: boolean | FakeFilterDataset): string | false;
export declare function isFakeEmailOnline(email: string, timeout?: number): Promise<FakeDomainResponse | null>;
export declare function isFakeDomainOnline(domain: string | null, timeout?: number): Promise<FakeDomainResponse | null>;
export declare function runTests(): Promise<void>;
//# sourceMappingURL=index.d.ts.map