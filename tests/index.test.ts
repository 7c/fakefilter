/**
 * ** Typescript Refactoring Helper Tests **
 *
 * Behavioural pin-down tests for index.js. These exist only to guard the
 * Javascript -> Typescript port and can be deleted once index.ts is verified.
 *
 * Note: `apiserver` in index.js is hardcoded to an https:// url, so the
 * `: http` branches of the `scheme` const and the `proto` ternary are
 * unreachable without editing the source and are intentionally not covered.
 */
//#region imports
import { EventEmitter } from 'events'
import {
  isFakeDomain,
  isFakeEmail,
  isFakeDomainOnline,
  isFakeEmailOnline,
  hostnameFromEmailAddress,
  fetch as ffFetch,
  runTests
} from '../index'
//#endregion

//#region mocks
jest.mock('https', () => ({ get: jest.fn() }))
jest.mock('../json/data.json', () => ({
  domains: {
    'grr.la': { provider: 'guerrilla' },
    'example.org': { provider: 'example' }
  }
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require('https') as { get: jest.Mock }
const mockedGet = https.get

class MockResponse extends EventEmitter {
  statusCode: number
  resume = jest.fn()
  constructor(statusCode = 200) {
    super()
    this.statusCode = statusCode
  }
}

class MockRequest extends EventEmitter {
  setTimeout = jest.fn()
  end = jest.fn()
  destroy = jest.fn()
}

type GetCallback = (res: MockResponse) => void

// queue a single https.get response (status + optional body) for the next call
function respondOnce(statusCode: number, body?: string): void {
  mockedGet.mockImplementationOnce((_url: string, cb: GetCallback) => {
    const req = new MockRequest()
    const res = new MockResponse(statusCode)
    cb(res)
    process.nextTick(() => {
      if (body !== undefined) res.emit('data', body)
      res.emit('close')
    })
    return req
  })
}

// resolves true when the promise is still pending after the microtask flush
async function isPending(p: Promise<unknown>): Promise<boolean> {
  const pendingMarker = Symbol('pending')
  const winner = await Promise.race([p.then(() => 'resolved'), Promise.resolve(pendingMarker)])
  return winner === pendingMarker
}
//#endregion

beforeEach(() => {
  mockedGet.mockReset()
})

describe('hostnameFromEmailAddress', () => {
  it('returns the host part of a valid email', () => {
    expect(hostnameFromEmailAddress('user@domain.com')).toBe('domain.com')
  })

  it('returns the host for a subdomain email', () => {
    expect(hostnameFromEmailAddress('user@sub.domain.com')).toBe('sub.domain.com')
  })

  it('returns the first host when multiple @ are present', () => {
    expect(hostnameFromEmailAddress('a@b@c')).toBe('b')
  })

  it('returns null for a falsy value', () => {
    expect(hostnameFromEmailAddress('')).toBeNull()
    expect(hostnameFromEmailAddress(null)).toBeNull()
    expect(hostnameFromEmailAddress(undefined)).toBeNull()
  })

  it('returns null for a non-string value', () => {
    expect(hostnameFromEmailAddress(42)).toBeNull()
  })

  it('returns null when there is no @ sign', () => {
    expect(hostnameFromEmailAddress('noatsign')).toBeNull()
  })

  it('returns null when @ is the first character', () => {
    expect(hostnameFromEmailAddress('@domain.com')).toBeNull()
  })
})

describe('isFakeDomain', () => {
  it('matches an exact domain from the default dataset', () => {
    expect(isFakeDomain('grr.la')).toBe('grr.la')
  })

  it('matches case-insensitively and trims whitespace', () => {
    expect(isFakeDomain('  GRR.LA  ')).toBe('grr.la')
  })

  it('matches a subdomain of a known domain', () => {
    expect(isFakeDomain('sub.grr.la')).toBe('grr.la')
  })

  it('returns false for an unknown domain', () => {
    expect(isFakeDomain('totally-unknown.com')).toBe(false)
  })

  it('uses an explicitly provided dataset when passed', () => {
    const json = { domains: { 'custom.io': {} } }
    expect(isFakeDomain('custom.io', json as unknown as boolean)).toBe('custom.io')
    expect(isFakeDomain('grr.la', json as unknown as boolean)).toBe(false)
  })
})

describe('isFakeEmail', () => {
  it('detects a fake email by its domain', () => {
    expect(isFakeEmail('user@grr.la')).toBe('grr.la')
  })

  it('detects a fake email by its subdomain', () => {
    expect(isFakeEmail('user@sub.grr.la')).toBe('grr.la')
  })

  it('returns false for an email on an unknown domain', () => {
    expect(isFakeEmail('user@unknown.com')).toBe(false)
  })

  it('throws for an invalid email because the hostname is null', () => {
    expect(() => isFakeEmail('not-an-email')).toThrow()
  })
})

describe('fetch', () => {
  it('resolves parsed json on a 200 response', async () => {
    respondOnce(200, JSON.stringify({ hello: 'world' }))
    await expect(ffFetch('https://fakefilter.net/x')).resolves.toEqual({ hello: 'world' })
  })

  it('resolves the raw body when json is false', async () => {
    respondOnce(200, 'plain-text-body')
    await expect(ffFetch('https://fakefilter.net/x', 5000, false)).resolves.toBe('plain-text-body')
  })

  it('resolves false when the body is not valid json', async () => {
    respondOnce(200, 'this is not json')
    await expect(ffFetch('https://fakefilter.net/x')).resolves.toBe(false)
  })

  it('rejects with STATUSCODE and drains the response on a non-200', async () => {
    const res = new MockResponse(404)
    mockedGet.mockImplementationOnce((_url: string, cb: GetCallback) => {
      cb(res)
      return new MockRequest()
    })
    await expect(ffFetch('https://fakefilter.net/missing')).rejects.toBe('STATUSCODE')
    expect(res.resume).toHaveBeenCalledTimes(1)
  })

  it('rejects with TIMEOUT and destroys the request when the timeout fires', async () => {
    const req = new MockRequest()
    req.setTimeout = jest.fn((_timeout: number, cb: () => void) => cb())
    mockedGet.mockImplementationOnce(() => req)
    await expect(ffFetch('https://fakefilter.net/slow', 10)).rejects.toBe('TIMEOUT')
    expect(req.destroy).toHaveBeenCalledTimes(1)
  })

  it('rejects with the underlying error on a request error event', async () => {
    const boom = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' })
    mockedGet.mockImplementationOnce(() => {
      const req = new MockRequest()
      process.nextTick(() => req.emit('error', boom))
      return req
    })
    await expect(ffFetch('https://fakefilter.net/x')).rejects.toBe(boom)
  })

  it('rejects when proto.get throws synchronously (e.g. invalid protocol)', async () => {
    const boom = Object.assign(new Error('invalid protocol'), { code: 'ERR_INVALID_PROTOCOL' })
    mockedGet.mockImplementationOnce(() => {
      throw boom
    })
    await expect(ffFetch('htps://fakefilter.net/x')).rejects.toBe(boom)
  })
})

describe('isFakeDomainOnline', () => {
  it('resolves the answer when retcode is 200', async () => {
    const answer = { retcode: 200, isFakeDomain: 'grr.la', details: null }
    respondOnce(200, JSON.stringify(answer))
    await expect(isFakeDomainOnline('grr.la')).resolves.toEqual(answer)
  })

  it('resolves null when the underlying fetch rejects', async () => {
    mockedGet.mockImplementationOnce(() => {
      const req = new MockRequest()
      process.nextTick(() => req.emit('error', new Error('down')))
      return req
    })
    await expect(isFakeDomainOnline('grr.la')).resolves.toBeNull()
  })

  it('never resolves when the answer is falsy', async () => {
    respondOnce(200, 'not-json')
    expect(await isPending(isFakeDomainOnline('grr.la'))).toBe(true)
  })

  it('never resolves when the answer has no retcode', async () => {
    respondOnce(200, JSON.stringify({ foo: 'bar' }))
    expect(await isPending(isFakeDomainOnline('grr.la'))).toBe(true)
  })

  it('never resolves when retcode is not 200', async () => {
    respondOnce(200, JSON.stringify({ retcode: 500 }))
    expect(await isPending(isFakeDomainOnline('grr.la'))).toBe(true)
  })
})

describe('isFakeEmailOnline', () => {
  it('resolves the answer for a valid email', async () => {
    const answer = { retcode: 200, isFakeDomain: 'grr.la', details: null }
    respondOnce(200, JSON.stringify(answer))
    await expect(isFakeEmailOnline('user@grr.la')).resolves.toEqual(answer)
  })

  it('still issues a lookup when the hostname is null', async () => {
    const answer = { retcode: 200, isFakeDomain: false, details: null }
    respondOnce(200, JSON.stringify(answer))
    await expect(isFakeEmailOnline('invalid-email')).resolves.toEqual(answer)
  })
})

describe('runTests', () => {
  // dispatches a mocked https response based on the requested url so the
  // self-test harness can run end to end without touching the network
  function dispatcher(url: string, cb: GetCallback): MockRequest {
    if (url.startsWith('htps:')) {
      throw Object.assign(new Error('invalid protocol'), { code: 'ERR_INVALID_PROTOCOL' })
    }
    if (url.startsWith('://')) {
      throw Object.assign(new Error('invalid url'), { code: 'ERR_INVALID_URL' })
    }
    const req = new MockRequest()
    if (/nonexisting\d+\.com/.test(url)) {
      process.nextTick(() =>
        req.emit('error', Object.assign(new Error('not found'), { code: 'ENOTFOUND' }))
      )
      return req
    }
    if (url.endsWith('/notexisting') || url.endsWith('/api/is/fakedomain/')) {
      cb(new MockResponse(404))
      return req
    }
    if (url.includes('/api/is/fakedomain/')) {
      const domain = url.split('/api/is/fakedomain/')[1]
      let body: string
      if (domain === 'fakefilte r.net') body = JSON.stringify({ retcode: -50 })
      else if (domain === 'fakefilter.net') body = JSON.stringify({ retcode: 200 })
      else body = JSON.stringify({ retcode: 200, isFakeDomain: domain })
      const res = new MockResponse(200)
      cb(res)
      process.nextTick(() => {
        res.emit('data', body)
        res.emit('close')
      })
      return req
    }
    cb(new MockResponse(404))
    return req
  }

  it('runs the self-test harness to completion and exits 0', async () => {
    mockedGet.mockImplementation(dispatcher)
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

    await expect(runTests()).resolves.toBeUndefined()

    expect(exitSpy).toHaveBeenCalledWith(0)
    expect(logSpy).toHaveBeenCalledWith('OK')

    exitSpy.mockRestore()
    logSpy.mockRestore()
  })
})
