# Browser runtime

`inform-ui.global.js` is the prebuilt browser bundle. Keep `THIRD_PARTY_NOTICES.txt` beside redistributed copies.

The mutable `main` branch exposes this rolling URL:

https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@main/cdn/next/inform-ui.global.js

CDN and browser caches may delay updates. For reproducible applications, select an immutable commit URL and retain matching licenses. Do not use a moving branch as a version lock.

The integrated source lives on `main`; build it with `npm run build:next`. See [browser integration](../../docs/v2/quick-start.md) for the module entry and local setup.
