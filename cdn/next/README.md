# Rolling browser runtime

The `latest` Git branch is the mutable browser-runtime channel. Consumers can use `https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@latest/cdn/next/inform-ui.global.js` after verifying this branch resolves through the CDN. A loaded page keeps the code it already loaded; reopening can obtain a newer version after CDN/browser caches refresh. There is no immediate propagation guarantee.

The development branch remains `next/openui-dsl-20261013`; main is unchanged. Update the full licensed runtime and test it before fast-forwarding `latest`. No force pushes. Fixed commits remain available for reproducible diagnostics. See the adjacent third-party notices.
