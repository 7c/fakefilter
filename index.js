"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostnameFromEmailAddress = hostnameFromEmailAddress;
exports.isFakeDomain = isFakeDomain;
exports.fetch = fetch;
exports.isFakeEmail = isFakeEmail;
exports.isFakeEmailOnline = isFakeEmailOnline;
exports.isFakeDomainOnline = isFakeDomainOnline;
exports.runTests = runTests;
/*

    Basic Typescript Interface to lookup by Email or Domain

    Important: you need to auto update npm package daily to make continious feed

*/
//#region imports
const assert_1 = __importDefault(require("assert"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const data_json_1 = __importDefault(require("./json/data.json"));
const apiserver = 'https://fakefilter.net';
// const apiserver = "http://127.0.0.1:5520" -- local tests
const scheme = apiserver.search(/^https/) === 0 ? 'https' : 'http';
function hostnameFromEmailAddress(email) {
    if (email && typeof email === 'string' && email.search(/@/) > 0)
        return email.split(/@/)[1];
    return null;
}
function isFakeDomain(domain, json = false) {
    const dataset = typeof json === 'boolean' ? data_json_1.default : json;
    for (const dom of Object.keys(dataset.domains)) {
        // exact match
        if (dom === domain.toLowerCase().trim())
            return dom;
        // subdomain match
        if (domain.search(new RegExp(`.+\\.${dom}`)) === 0)
            return dom;
    }
    return false;
}
function fetch(url, timeout = 5000, json = true) {
    return new Promise((resolve, reject) => {
        try {
            //#region response handler
            const handler = (res) => {
                if (res.statusCode !== 200) {
                    res.resume();
                    return reject('STATUSCODE');
                }
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('close', () => {
                    if (json) {
                        try {
                            return resolve(JSON.parse(data));
                        }
                        catch (err) {
                            return resolve(false);
                        }
                    }
                    return resolve(data);
                });
            };
            //#endregion
            const request = apiserver.search(/^https/) === 0 ? https.get(url, handler) : http.get(url, handler);
            request.setTimeout(timeout, () => {
                request.destroy();
                return reject('TIMEOUT');
            });
            request.end();
            request.on('error', (err) => {
                return reject(err);
            });
        }
        catch (err3) {
            // errors like ERR_INVALID_PROTOCOL is thrown here
            reject(err3);
        }
    });
}
function isFakeEmail(email, json = false) {
    // a null hostname is intentionally forwarded so invalid input throws, matching the original behaviour
    return isFakeDomain(hostnameFromEmailAddress(email), json);
}
function isFakeEmailOnline(email, timeout = 5000) {
    return isFakeDomainOnline(hostnameFromEmailAddress(email), timeout);
}
async function isFakeDomainOnline(domain, timeout = 5000) {
    // we intentionally do not reject because we do not want to hold
    // the process too long, null indicates error
    try {
        const answer = await fetch(`${apiserver}/api/is/fakedomain/${domain}`, timeout, true);
        if (answer && answer.hasOwnProperty('retcode') && answer.retcode === 200)
            return answer;
    }
    catch (err) {
        // error returns null
        return null;
    }
    // preserve original behaviour: stay pending when the lookup is not a positive hit
    return new Promise(() => { });
}
async function runTests() {
    //#region fetch tests
    // not existing domain
    try {
        await fetch(`${scheme}://nonexisting${Date.now()}.com`);
        assert_1.default.equal(false, true); // we should never reach this position
    }
    catch (err) {
        assert_1.default.equal(err.code, 'ENOTFOUND');
    }
    // not existing url on existing domain
    try {
        await fetch(`${apiserver}/notexisting`);
        assert_1.default.equal(false, true); // we should never reach this position
    }
    catch (err) {
        assert_1.default.equal(err, 'STATUSCODE');
    }
    // invalid protocoll
    try {
        await fetch(`htps://fakefilter.net/notexisting`);
        assert_1.default.equal(false, true); // we should never reach this position
    }
    catch (err) {
        assert_1.default.equal(err.code, 'ERR_INVALID_PROTOCOL');
    }
    // invalid url
    try {
        await fetch(`://fakefilter.net/notexisting`);
        assert_1.default.equal(false, true); // we should never reach this position
    }
    catch (err) {
        assert_1.default.equal(err.code, 'ERR_INVALID_URL');
    }
    // 404
    try {
        await fetch(`${apiserver}/api/is/fakedomain/`);
        assert_1.default.equal(false, true); // we should never reach this position
    }
    catch (err) {
        assert_1.default.equal(err, 'STATUSCODE');
    }
    // non FakeDomain
    assert_1.default.equal((await fetch(`${apiserver}/api/is/fakedomain/fakefilter.net`)).retcode, 200);
    // FakeDomain
    assert_1.default.equal((await fetch(`${apiserver}/api/is/fakedomain/fakefilte r.net`)).retcode, -50);
    //#endregion
    const json = data_json_1.default;
    console.log(`Running tests`);
    const all_domains = Object.keys(json.domains);
    //#region offline + online assertions for every known domain
    // all domains we know must be detected as FakeDomain
    for (const domain of all_domains) {
        // if (domain!=='www.barryogorman.com') continue
        // console.log((domain),isFakeDomain(domain)===domain.toLowerCase())
        // exact match
        // console.log(`>> ${domain}`)
        assert_1.default.notEqual(isFakeDomain(domain), false);
        // subdomain match for example any@sub.test.com should match if test.com is part of the filter
        assert_1.default.notEqual(isFakeDomain(`sub.${domain}`), false);
        assert_1.default.notEqual(isFakeDomain(`sub.sub.${domain}`), false);
        assert_1.default.notEqual(isFakeDomain(`another.sub.sub.${domain}`), false);
        // sub$hostname should not be detected as fakedomain - if we have test.com in the filter, subtest.com should not be detected as fake
        if (domain.search(/^[^.]+\.[^.]+$/) == 0) {
            assert_1.default.equal(isFakeEmail(`any@sub${domain}`), false);
            assert_1.default.equal(isFakeDomain(`sub${domain}`), false);
        }
        assert_1.default.notEqual(isFakeEmail(`any@${domain}`), false);
        assert_1.default.notEqual(isFakeEmail(`any@sub.${domain}`), false);
        // RESTFul API query (responses are guaranteed present for these mocked/online lookups)
        assert_1.default.equal((await isFakeDomainOnline(domain)).isFakeDomain, domain);
        assert_1.default.equal((await isFakeEmailOnline(`any@${domain}`)).isFakeDomain, domain);
        assert_1.default.equal((await isFakeEmailOnline(`any@sub.${domain}`)).isFakeDomain, 'sub.' + domain);
    }
    //#endregion
    console.log(`OK`);
    process.exit(0);
}
// basic tests
if (require.main === module)
    runTests();
//# sourceMappingURL=index.js.map