declare module "fakefilter" {
  interface DomainDetails {
    provider: string;
    firstseen: number;
    lastseen: number;
    randomSubdomain: string | boolean;
  }
  interface FakeResponse {
    retcode: number;
    details: DomainDetails | null;
  }
  interface FakeDomainResponse extends FakeResponse {
    isFakeDomain: string | false;
  }
  interface FakeEmailResponse extends FakeResponse {
    isFakeEmail: string | false;
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
  ): Promise<FakeEmailResponse>;
}
