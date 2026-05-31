/*

    Basic Typescript Interface to lookup by Email or Domain

    Important: you need to auto update npm package daily to make continious feed

*/
//#region imports
import assert from 'assert'
import * as https from 'https'
import * as http from 'http'
import staticJsonV1 from './json/data.json'
import { FakeDomainResponse, FakeFilterDataset } from './types'
//#endregion

export type { DomainDetails, FakeDomainResponse } from './types'

const apiserver = 'https://fakefilter.net'
// const apiserver = "http://127.0.0.1:5520" -- local tests
const scheme = apiserver.search(/^https/) === 0 ? 'https' : 'http'

export function hostnameFromEmailAddress(email: any): string | null {
  if (email && typeof email === 'string' && email.search(/@/) > 0) return email.split(/@/)[1]
  return null
}

export function isFakeDomain(domain: string, json: boolean | FakeFilterDataset = false): string | false {
  const dataset: FakeFilterDataset = typeof json === 'boolean' ? staticJsonV1 : json
  for (const dom of Object.keys(dataset.domains)) {
    // exact match
    if (dom === domain.toLowerCase().trim()) return dom
    // subdomain match
    if (domain.search(new RegExp(`.+\\.${dom}`)) === 0) return dom
  }
  return false
}

export function fetch(url: string, timeout = 5000, json = true): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    try {
      //#region response handler
      const handler = (res: http.IncomingMessage): void => {
        if (res.statusCode !== 200) {
          res.resume()
          return reject('STATUSCODE')
        }
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('close', () => {
          if (json) {
            try {
              return resolve(JSON.parse(data))
            } catch (err) {
              return resolve(false)
            }
          }
          return resolve(data)
        })
      }
      //#endregion

      const request = apiserver.search(/^https/) === 0 ? https.get(url, handler) : http.get(url, handler)
      request.setTimeout(timeout, () => {
        request.destroy()
        return reject('TIMEOUT')
      })
      request.end()

      request.on('error', (err) => {
        return reject(err)
      })
    } catch (err3) {
      // errors like ERR_INVALID_PROTOCOL is thrown here
      reject(err3)
    }
  })
}

export function isFakeEmail(email: string, json: boolean | FakeFilterDataset = false): string | false {
  // a null hostname is intentionally forwarded so invalid input throws, matching the original behaviour
  return isFakeDomain(hostnameFromEmailAddress(email) as string, json)
}

export function isFakeEmailOnline(email: string, timeout = 5000): Promise<FakeDomainResponse | null> {
  return isFakeDomainOnline(hostnameFromEmailAddress(email), timeout)
}

export async function isFakeDomainOnline(domain: string | null, timeout = 5000): Promise<FakeDomainResponse | null> {
  // we intentionally do not reject because we do not want to hold
  // the process too long, null indicates error
  try {
    const answer = await fetch(`${apiserver}/api/is/fakedomain/${domain}`, timeout, true)
    if (answer && answer.hasOwnProperty('retcode') && answer.retcode === 200) return answer
  } catch (err) {
    // error returns null
    return null
  }
  // preserve original behaviour: stay pending when the lookup is not a positive hit
  return new Promise<never>(() => {})
}

export async function runTests(): Promise<void> {
  //#region fetch tests
  // not existing domain
  try {
    await fetch(`${scheme}://nonexisting${Date.now()}.com`)
    assert.equal(false, true) // we should never reach this position
  } catch (err: any) {
    assert.equal(err.code, 'ENOTFOUND')
  }

  // not existing url on existing domain
  try {
    await fetch(`${apiserver}/notexisting`)
    assert.equal(false, true) // we should never reach this position
  } catch (err) {
    assert.equal(err, 'STATUSCODE')
  }

  // invalid protocoll
  try {
    await fetch(`htps://fakefilter.net/notexisting`)
    assert.equal(false, true) // we should never reach this position
  } catch (err: any) {
    assert.equal(err.code, 'ERR_INVALID_PROTOCOL')
  }

  // invalid url
  try {
    await fetch(`://fakefilter.net/notexisting`)
    assert.equal(false, true) // we should never reach this position
  } catch (err: any) {
    assert.equal(err.code, 'ERR_INVALID_URL')
  }

  // 404
  try {
    await fetch(`${apiserver}/api/is/fakedomain/`)
    assert.equal(false, true) // we should never reach this position
  } catch (err) {
    assert.equal(err, 'STATUSCODE')
  }

  // non FakeDomain
  assert.equal((await fetch(`${apiserver}/api/is/fakedomain/fakefilter.net`)).retcode, 200)
  // FakeDomain
  assert.equal((await fetch(`${apiserver}/api/is/fakedomain/fakefilte r.net`)).retcode, -50)
  //#endregion

  const json = staticJsonV1
  console.log(`Running tests`)
  const all_domains = Object.keys(json.domains)

  //#region offline + online assertions for every known domain
  // all domains we know must be detected as FakeDomain
  for (const domain of all_domains) {
    // if (domain!=='www.barryogorman.com') continue
    // console.log((domain),isFakeDomain(domain)===domain.toLowerCase())
    // exact match
    // console.log(`>> ${domain}`)

    assert.notEqual(isFakeDomain(domain), false)
    // subdomain match for example any@sub.test.com should match if test.com is part of the filter
    assert.notEqual(isFakeDomain(`sub.${domain}`), false)

    assert.notEqual(isFakeDomain(`sub.sub.${domain}`), false)
    assert.notEqual(isFakeDomain(`another.sub.sub.${domain}`), false)
    // sub$hostname should not be detected as fakedomain - if we have test.com in the filter, subtest.com should not be detected as fake
    if (domain.search(/^[^.]+\.[^.]+$/) == 0) {
      assert.equal(isFakeEmail(`any@sub${domain}`), false)
      assert.equal(isFakeDomain(`sub${domain}`), false)
    }
    assert.notEqual(isFakeEmail(`any@${domain}`), false)
    assert.notEqual(isFakeEmail(`any@sub.${domain}`), false)

    // RESTFul API query (responses are guaranteed present for these mocked/online lookups)
    assert.equal((await isFakeDomainOnline(domain))!.isFakeDomain, domain)
    assert.equal((await isFakeEmailOnline(`any@${domain}`))!.isFakeDomain, domain)
    assert.equal((await isFakeEmailOnline(`any@sub.${domain}`))!.isFakeDomain, 'sub.' + domain)
  }
  //#endregion
  console.log(`OK`)
  process.exit(0)
}

// basic tests
if (require.main === module) runTests()
