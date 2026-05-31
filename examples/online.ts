//#region imports
import { isFakeDomainOnline, isFakeEmailOnline } from '../index'
//#endregion

export async function start(): Promise<void> {
  try {
    // not disposable answer
    console.log(await isFakeDomainOnline('domain.com'))
    console.log(await isFakeEmailOnline('user@domain.com'))
    // disposable answer
    console.log(await isFakeDomainOnline('grr.la'))
    console.log(await isFakeEmailOnline('user@grr.la'))
  } catch (err) {
    console.log(err)
  }
}

// only auto-run when executed directly (e.g. `ts-node examples/online.ts`),
// so the module can be imported from tests without side effects
if (require.main === module) start()
