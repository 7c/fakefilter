"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
//#region imports
const index_1 = require("../index");
//#endregion
async function start() {
    try {
        // not disposable answer
        console.log(await (0, index_1.isFakeDomainOnline)('domain.com'));
        console.log(await (0, index_1.isFakeEmailOnline)('user@domain.com'));
        // disposable answer
        console.log(await (0, index_1.isFakeDomainOnline)('grr.la'));
        console.log(await (0, index_1.isFakeEmailOnline)('user@grr.la'));
    }
    catch (err) {
        console.log(err);
    }
}
// only auto-run when executed directly (e.g. `ts-node examples/online.ts`),
// so the module can be imported from tests without side effects
if (require.main === module)
    start();
//# sourceMappingURL=online.js.map