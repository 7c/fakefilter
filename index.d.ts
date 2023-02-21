declare module "fakefilter" {
  interface DomainDetails {
    provider: string;
    firstseen: number;
    lastseen: number;
    randomSubdomain: string | boolean;
  }
  interface FakeDomainResponse {
    retcode: number;
    isFakeDomain: string | false;
    details: DomainDetails | null;
  }
  function isFakeDomain(domain: string, json?: boolean): string | false;
  function isFakeEmail(email: string, json?: boolean): string | false;
  function isFakeDomainOnline(
    domain: string,
    timeout?: number
  ): Promise<FakeDomainResponse>;
  function isFakeEmailOnline(
    email: string,
    timeout?: number
  ): Promise<FakeDomainResponse>;
}
