# FakeFilter
The intention of this project is to sweep temporary and fake email addresses from registrations. We collect fake email providers and their domains and want to publish them here in different formats. We want that site owners use this repo as reliable source to find out all fake/temp provider registration attempts.

# Why FakeFilter
There are other lists like https://gist.github.com/adamloving/4401361 , https://disify.com/ , https://github.com/wesbos/burner-email-providers , https://github.com/disposable-email-domains/disposable-email-domains , https://github.com/elliotjreed/disposable-emails-filter-php , https://github.com/Propaganistas/Laravel-Disposable-Email , https://github.com/disposable/disposable  - they do work with submissions. This is greatly appreciated service for the community. We want to thank to them. FakeFilter has different approach: we do actively monitor all known providers and get their domains almost realtime and distribute daily. All our system is automated. Your help is still required; if you submit us new providers, we will write services to watch those providers REALTIME. Users do have rights to fake their emails, but also service providers do have the right to know about this fact. We have nothing against free/fake services, this service aims to be automated and reliable.

# Stats
## Daily Coverage
Amount of coverage, actions against all known Disposable Email Providers per Day
![Daily Coverage](assets/img/chart1.png)

## Daily Unique Disposable Domains
Number of unique known validated Disposable Domains in Total at given Day
![Daily Disposable Domains](assets/img/chart2.png)

## Success Rate Charts
We monitor every disposable email provider we know about and make charts about success rate in % per day. You can access provider based success rate charts at [here](CHARTS.md)

## Adding new Providers
Please help us to add new Providers to this list, simply create an issue with the title as providers main sitedomain, this way we can group them by domain. Your help is appreciated.

## Online Formats
We have implemented a RESTful API, you can check the API at [fakefilter.net](https://fakefilter.net/static/docs/restful/). This database is aimed to serve realtime, so once we detect a new domain, this API will have it. We recommend using the Offline format as backup since we cannot guarantee the uptime.

## Offline Formats
You may use one of these formats to have access to the information flow in your favorite programming language:

[Markdown](markdown/README.md)

[Json](json/data.json)
This format supports firstseen,lastseen,randomSubdomain properties

[Txt](txt/data.txt)

## Whitelist
We whitelist major well-known providers from being blocked from fakefilter, just to make sure we do not add them automatically from our system. Some providers offer @gmail<dot>com emails, adding such domains would be painful for the community.

## Javascript Interface
We have implemented npm/javascript interface for Javascript Developers as demonstration

`npm i --save fakefilter`

You have to make sure that this npm package is always up2date in order this static implementation to work as designed.

Offline Lookup:
```
const { isFakeDomain, isFakeEmail } = require('fakefilter')

console.log(isFakeDomain('domain.com'))
console.log(isFakeEmail('user@domain.com'))
```


Online Lookup:

this version does not throw at all. You either get null (which indicates any error) or false or the object as reply
```
## also see examples/online.js
const { isFakeDomainOnline, isFakeEmailOnline } = require('fakefilter')

console.log(await isFakeDomainOnline('domain.com'))
console.log(await isFakeEmailOnline('user@domain.com'))

```


Test:
```
node index.js
```
