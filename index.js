/*

    Basic Javascript Interface to lookup by Email or Domain

    Important: you need to auto update npm package daily to make continious feed

*/
const assert = require('assert');
const static_json_v1 = require('./json/data.json')
const https = require('https')
const http = require('http')
const apiserver = "https://fakefilter.net"
// const apiserver = "http://127.0.0.1:5520" -- local tests
const scheme = apiserver.search(/^https/) === 0 ? "https" : "http"

function hostnameFromEmailAddress(email) {
    if (email && typeof email === 'string' && email.search(/@/) > 0)
        return email.split(/@/)[1]
    return null
}

function isFakeDomain(domain, json = false) {
    if (!json) json = static_json_v1
    for (let dom of Object.keys(json.domains)) {
        // exact match
        if (dom === domain.toLowerCase().trim()) return dom
        // subdomain match
        if (domain.search(new RegExp(`.+\\.${dom}`)) === 0) return dom
    }
    return false
}

function fetch(url, timeout = 5000, json = true) {
    return new Promise(async function (resolve, reject) {
        try {
            let proto = apiserver.search(/^https/) === 0 ? https : http
            

            let request = proto.get(url, (res) => {
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
            })
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

function isFakeEmail(email, json = false) {
    return isFakeDomain(hostnameFromEmailAddress(email), json)
}

function isFakeEmailOnline(email, timeout = 5000) {
    return isFakeDomainOnline(hostnameFromEmailAddress(email), timeout)
}


function isFakeDomainOnline(domain, timeout = 5000) {
    // we intentionally do not reject because we do not want to hold
    // the process too long, null indicates error
    return new Promise(async function (resolve, reject) {
        try {
            let answer = await fetch(`${apiserver}/api/is/fakedomain/${domain}`, timeout, true)
            if (answer && answer.hasOwnProperty('retcode') && answer.retcode === 200)
                return resolve(answer)
        } catch (err) {
            // error returns null
            return resolve(null)
        }
    })
}

async function runTests() {
    // fetch tests

    // not existing domain
    try {
        await fetch(`${scheme}://nonexisting${Date.now()}.com`)
        assert.equal(false, true) // we should never reach this position
    } catch (err) {
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
    } catch (err) {
        assert.equal(err.code, 'ERR_INVALID_PROTOCOL')
    }

    // invalid url
    try {
        await fetch(`://fakefilter.net/notexisting`)
        assert.equal(false, true) // we should never reach this position
    } catch (err) {
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


    let json = static_json_v1
    console.log(`Running tests`)
    let all_domains = Object.keys(json.domains)

    // all domains we know must be detected as FakeDomain
    for (let domain of all_domains) {
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

        // RESTFul API query
        assert.equal((await isFakeDomainOnline(domain)).isFakeDomain, domain)
        assert.equal((await isFakeEmailOnline(`any@${domain}`)).isFakeDomain, domain)
        assert.equal((await isFakeEmailOnline(`any@sub.${domain}`)).isFakeDomain, "sub." + domain)
    }
    console.log(`OK`)
    process.exit(0)
}

// basic tests
if (require.main == module) runTests()

module.exports = {
    // offline version
    isFakeDomain,
    isFakeEmail,

    // online version
    isFakeDomainOnline,
    isFakeEmailOnline
}

