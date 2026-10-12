# Supplied lookup demonstrations

`conversational-onboarding-search` provides three real, local presentations: a Weather snapshot, a financial chart and finite news summaries with source cards. This is an original implementation of observable tab, snapshot and card behavior. Captured code, assets, analytics and external lookup services are not included.

Resolved data requires `weather`, `stock` and `news`, each with a visible `label` and `question`. Weather accepts an actual `WeatherNode` in `snapshot`, preserving required snapshot fields, timezone checks, known-zero/missing distinctions and the additive chart/table/compact controls. Stock accepts an actual `FinanceChartNode`, including its explicit instrument, source and ranges, with chronological and range semantics checked. Parent presentation hides Weather sharing just as the observed search demonstration did. No provider is contacted.

News takes up to 50 `{text,sourceId}` summaries and 30 distinct source items `{id,title,url,sourceLabel,dateLabel?,imageSrc?,faviconSrc?}`. Every citation references a supplied item. Summary citation buttons and source cards emit frozen, cancelable, bubbling, non-composed `iui:search-open` with `{id,itemId,url}`. Accepting the request does not navigate, write a clipboard or fetch a page. A stock provenance link is also intercepted into the same local request. The news picture area and text button both support opening the same supplied item.

Images use the shared owned SearchImage renderer. Inline raster images can display immediately. An HTTP(S) image requires explicit activation of the local image-load control before assigning its source; loading an image does not open its news link. Supplied favicon images or a local source initial provide fallbacks. Switching views or updating retires child media and clears old image sources.

News uses the existing finite Carousel mechanism. Cards occupy 47.5% of a narrow component and 31.5% at a 576px component width, with a 144px media area. This is a component container breakpoint, not a viewport estimate. The carousel owns its existing frame and observer lifecycle.

Tabs support normal pointer and keyboard activation, roving focus, RTL arrows and Home/End; modified or composing keys do not switch tabs. `iui:onboarding-tab` retains the shared local cancelable receipt. Selecting another tab remounts that presentation, matching the observed conditional content. Native form reset restores the original tab and embedded state. Canceled resets and newer user input take priority. Disabled, hidden, inert, first-legend, generation and owner constraints remain active.

Pending uses a 140px local loading presentation; failed uses explicit fallback text or hides the component. Empty news remains explicitly empty. No generated search results, live stock prices, current weather or completed external actions are invented.

Source-build tests include actual standalone compilation. Native browser tests are supplied separately; discovery alone does not establish browser or reference-pixel acceptance. The frozen CDN still belongs to unified164 until a later unified asset build.

Local integration follow-up: carousel resource notifications (resize, scroll, media/font lifecycle) do not enter the user-input gate or change the reset revision. The parent observes actual nested Weather date/readout changes for keyboard and pointer input, so a later embedded interaction supersedes a queued parent reset. Original keyboard-reset and Window-as-Node failures are retained;15 domain checks and the original10 independent checks passed on the correction.

## Required source-package validation

`SEARCH_TEXT` checks node label; each supplied weather/stock/news label and question; news item id/title/sourceLabel; each summary text. News IDs are unique (`SEARCH_ID`) and summary sourceId must refer to a supplied item (`SEARCH_SOURCE`). News URL/imageSrc/faviconSrc use core link/image safety when present. Other strings retain structural constraints without blanket trim. Weather child runs extension and supplied-text checks plus source safety; stock runs full Finance checks. The explicit required Weather and Finance contracts are part of this package. Supplied child data is validated even when pending/failed; no live lookup occurs.
