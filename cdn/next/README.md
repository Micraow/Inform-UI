# Rolling browser runtime

The `web-chat-latest` Git branch is the mutable browser-runtime channel. The verified entry is:

https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@web-chat-latest/cdn/next/inform-ui.global.js

This selects a rolling branch, not a fixed version. The CDN returned `Cache-Control: public, max-age=604800, s-maxage=43200`: browsers may cache for seven days and shared caches for twelve hours. A loaded page keeps its loaded code; reopening may obtain newer code after caches refresh. There is no immediate propagation guarantee. Bare `@latest` is not this channel and returned 404 during verification.

Development continues on `next/openui-dsl-20261013`; main remains unchanged. Update the complete licensed runtime and test it before fast-forwarding `web-chat-latest`; do not force push. Fixed commits remain available for diagnostics. Third-party notices are adjacent.
