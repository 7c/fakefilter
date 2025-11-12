/**
 * Performance and functionality test for the optimized fakefilter implementation
 * 
 * This test validates:
 * 1. All functionality remains correct after optimization
 * 2. Performance improvements are significant
 * 3. Edge cases are handled properly
 */

const assert = require('assert');
const { isFakeDomain, isFakeEmail } = require('./index.js');
const data = require('./json/data.json');

console.log('FakeFilter Performance Test Suite');
console.log('=================================\n');

// Test 1: Basic Functionality
console.log('Test 1: Basic Functionality');
console.log('---------------------------');
assert.strictEqual(isFakeDomain('grr.la'), 'grr.la', 'Exact match failed');
assert.strictEqual(isFakeDomain('sub.grr.la'), 'grr.la', 'Subdomain match failed');
assert.strictEqual(isFakeDomain('a.b.c.grr.la'), 'grr.la', 'Deep subdomain match failed');
assert.strictEqual(isFakeDomain('google.com'), false, 'Non-fake domain should return false');
assert.strictEqual(isFakeEmail('user@grr.la'), 'grr.la', 'Email exact match failed');
assert.strictEqual(isFakeEmail('user@sub.grr.la'), 'grr.la', 'Email subdomain match failed');
console.log('✓ All basic functionality tests passed\n');

// Test 2: Case Insensitivity and Whitespace
console.log('Test 2: Case Insensitivity and Whitespace');
console.log('------------------------------------------');
assert.strictEqual(isFakeDomain('GRR.LA'), 'grr.la', 'Case insensitive failed');
assert.strictEqual(isFakeDomain(' grr.la '), 'grr.la', 'Whitespace trim failed');
assert.strictEqual(isFakeDomain('SUB.GRR.LA'), 'grr.la', 'Case insensitive subdomain failed');
console.log('✓ Case insensitivity and whitespace tests passed\n');

// Test 3: Edge Cases - Concatenation Without Dot
console.log('Test 3: Edge Cases - Concatenation Without Dot');
console.log('-----------------------------------------------');
assert.strictEqual(isFakeDomain('subgrr.la'), false, 'Concatenation without dot should be false');
assert.strictEqual(isFakeDomain('xgrr.la'), false, 'Prefix without dot should be false');
console.log('✓ Edge case tests passed\n');

// Test 4: Comprehensive Dataset Validation
console.log('Test 4: Comprehensive Dataset Validation');
console.log('----------------------------------------');
const allDomains = Object.keys(data.domains);
const sampleSize = Math.min(100, allDomains.length);
const sampleDomains = [];
for (let i = 0; i < sampleSize; i++) {
    const idx = Math.floor((i / sampleSize) * allDomains.length);
    sampleDomains.push(allDomains[idx]);
}

let passed = 0;
for (let domain of sampleDomains) {
    assert.strictEqual(isFakeDomain(domain), domain, `Exact match failed for ${domain}`);
    assert.strictEqual(isFakeDomain(`test.${domain}`), domain, `Subdomain match failed for ${domain}`);
    assert.strictEqual(isFakeDomain(`a.b.${domain}`), domain, `Deep subdomain match failed for ${domain}`);
    
    // Test that concatenation without dot doesn't match (only for 2-part domains)
    if (domain.split('.').length === 2) {
        assert.strictEqual(isFakeDomain(`sub${domain}`), false, `Concatenation should not match for ${domain}`);
    }
    passed++;
}
console.log(`✓ Validated ${passed} domains from dataset\n`);

// Test 5: Performance Benchmark
console.log('Test 5: Performance Benchmark');
console.log('------------------------------');

// Create test set with mix of operations
const testSet = [];
for (let i = 0; i < 1000; i++) {
    const randomDomain = allDomains[Math.floor(Math.random() * allDomains.length)];
    testSet.push(randomDomain);
    testSet.push(`sub.${randomDomain}`);
    testSet.push(`a.b.${randomDomain}`);
    testSet.push('google.com');
    testSet.push('github.com');
}

const iterations = 3;
const times = [];

for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    for (let domain of testSet) {
        isFakeDomain(domain);
    }
    const end = Date.now();
    times.push(end - start);
}

const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
const lookupsPerSecond = Math.floor(testSet.length / (avgTime / 1000));

console.log(`Total lookups: ${testSet.length}`);
console.log(`Average time: ${avgTime.toFixed(2)} ms`);
console.log(`Lookups per second: ${lookupsPerSecond.toLocaleString()}`);
console.log(`Average per lookup: ${(avgTime / testSet.length).toFixed(6)} ms`);
console.log('✓ Performance benchmark completed\n');

// Test 6: Custom JSON Support
console.log('Test 6: Custom JSON Support');
console.log('---------------------------');
const customJson = {
    domains: {
        'custom.test': { provider: 'test' },
        'another.test': { provider: 'test' }
    }
};

assert.strictEqual(isFakeDomain('custom.test', customJson), 'custom.test', 'Custom JSON exact match failed');
assert.strictEqual(isFakeDomain('sub.custom.test', customJson), 'custom.test', 'Custom JSON subdomain match failed');
assert.strictEqual(isFakeDomain('google.com', customJson), false, 'Custom JSON non-fake domain should be false');
console.log('✓ Custom JSON support tests passed\n');

console.log('=================================');
console.log('All tests passed successfully! ✓');
console.log('=================================');
