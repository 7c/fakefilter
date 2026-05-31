//#region imports
import { start } from '../examples/online'
import { isFakeDomainOnline, isFakeEmailOnline, FakeDomainResponse } from '../index'
//#endregion

jest.mock('../index')

const mockDomainOnline = isFakeDomainOnline as jest.MockedFunction<typeof isFakeDomainOnline>
const mockEmailOnline = isFakeEmailOnline as jest.MockedFunction<typeof isFakeEmailOnline>

const notFake: FakeDomainResponse = { retcode: 200, isFakeDomain: false, details: null }
const fake: FakeDomainResponse = {
  retcode: 200,
  isFakeDomain: 'grr.la',
  details: { provider: 'guerrillamail', firstseen: 0, lastseen: 0, randomSubdomain: false }
}

describe('examples/online', () => {
  let logSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it('looks up both domains and emails and logs every response', async () => {
    mockDomainOnline.mockResolvedValueOnce(notFake).mockResolvedValueOnce(fake)
    mockEmailOnline.mockResolvedValueOnce(notFake).mockResolvedValueOnce(fake)

    await start()

    expect(mockDomainOnline).toHaveBeenNthCalledWith(1, 'domain.com')
    expect(mockEmailOnline).toHaveBeenNthCalledWith(1, 'user@domain.com')
    expect(mockDomainOnline).toHaveBeenNthCalledWith(2, 'grr.la')
    expect(mockEmailOnline).toHaveBeenNthCalledWith(2, 'user@grr.la')

    expect(logSpy).toHaveBeenCalledTimes(4)
    expect(logSpy).toHaveBeenNthCalledWith(1, notFake)
    expect(logSpy).toHaveBeenNthCalledWith(2, notFake)
    expect(logSpy).toHaveBeenNthCalledWith(3, fake)
    expect(logSpy).toHaveBeenNthCalledWith(4, fake)
  })

  it('logs the error when a lookup rejects', async () => {
    const boom = new Error('network down')
    mockDomainOnline.mockRejectedValueOnce(boom)

    await start()

    expect(logSpy).toHaveBeenCalledWith(boom)
  })
})
