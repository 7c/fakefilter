"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainLookup = void 0;
exports.getLookup = getLookup;
//#endregion
// Immutable lookup structure built once per dataset. Keys are normalized to
// lowercase so membership and suffix checks are case-insensitive and the input
// only needs to be normalized a single time.
class DomainLookup {
    constructor(dataset) {
        this.domains = new Set();
        for (const key of Object.keys(dataset.domains)) {
            this.domains.add(key.toLowerCase().trim());
        }
    }
    // Returns the matched fake domain (exact host or registrable suffix) or false.
    // A Set is used instead of direct property access so reserved keys such as
    // `constructor` or `toString` cannot produce prototype-chain false positives.
    match(domain) {
        const normalized = domain.toLowerCase().trim();
        // exact match
        if (this.domains.has(normalized))
            return normalized;
        // suffix match on dot boundaries: a.b.fake.com -> fake.com
        const parts = normalized.split('.');
        for (let i = 1; i < parts.length; i++) {
            const suffix = parts.slice(i).join('.');
            if (this.domains.has(suffix))
                return suffix;
        }
        return false;
    }
}
exports.DomainLookup = DomainLookup;
// Datasets are cached by identity so repeated lookups reuse the same Set.
// The bundled default dataset is a stable singleton object, so it is cached on
// first use just like any caller-provided dataset.
const cache = new WeakMap();
function getLookup(dataset) {
    let lookup = cache.get(dataset);
    if (!lookup) {
        lookup = new DomainLookup(dataset);
        cache.set(dataset, lookup);
    }
    return lookup;
}
//# sourceMappingURL=domainLookup.js.map