const { isFakeDomainOnline, isFakeEmailOnline } = require('./../index')

async function start() {
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

start()
