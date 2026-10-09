# Supplied website icon

Finite original support for canonical `base-favicon`; source candidate awaiting combined browser acceptance. Required `label` is 1–200 Unicode code points. Optional `src` is a supplied allowed image URL, `fallback` is 1–2 literal code points and `size` is sm/md/lg, default md. The image URL limit is12000 code points. Existing URL policy allows HTTP(S) and base64 PNG/JPEG/GIF/WebP, rejecting credentials, relative URLs, SVG data and browser-internal schemes.

Without an image the component shows an accessible local fallback. It never discovers a site's favicon, calls an icon service, fetches a domain or guesses an initial from a name. Data images can decode locally. Remote images do not create an img element or request until the user explicitly activates Load icon; the UI names the supplied host first. The request uses no-referrer. This does not remove all ordinary browser networking effects or claim that a user has no cookies for the destination.

The visual box stays24/32/48 pixels across pending/success/error states. Fallback stays visible until an intrinsic image loads successfully. Errors show a local fallback and explicit Retry; pending and loaded actions are guarded no-ops, preserving focus. Old retry image listeners are removed rather than accumulated. Removal/update/dispose guards later events; it does not revoke a request already sent.

The labelled visual is separate from status and native type=button controls. It has no state binding, form submission or clipboard behavior; inherited disabled fieldsets block activation. Unrelated host changes retain the visual state. See the original offline-safe example in `examples/favicon.json`; its local blue PNG is project-generated and its remote example uses the reserved .invalid domain.
