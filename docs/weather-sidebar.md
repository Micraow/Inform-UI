# Supplied weather sidebar title

`weather/sidebar` owns the existing `weather-sidebar-title` and `WeatherSidebarPlace` declarations. It depends on `travel/snapshots` for `TravelEventSource`; dependency nodes are included in a selected manifest. It is a finite supplied-place header, separate from the complete forecast body's `weather/snapshot` module. Run the unchanged full `validateDocument` after selected structural validation.

## Supplied data and validation

The root requires label, 0–30 places and an initial display unit (celsius/fahrenheit). Each place requires id, label, timezone, observedAt, temperature, unit and condition. ObservedAt, temperature and condition may each independently be null. Temperature is a number from -1,000,000 to 1,000,000 or null; this sidebar does not apply the full weather body's physical-temperature bounds or infer a condition from it. Condition is clear/partly-cloudy/cloudy/rain/snow/storm/fog/unknown or null. Unknown and missing remain distinct supplied labels.

Place IDs use strict supplied keys with no trailing newline and are unique within the node. Optional initialPlaceId must reference a supplied place; without it the first supplied place is initially selected, or the empty state is shown. Optional authored node IDs separately retain shared document-wide uniqueness. Place timezones are checked through the runtime's `Intl.DateTimeFormat`, including when observation time is null.

Short root/place/source labels are structurally 1–200 characters; the inspector does not trim or impose an extra nonblank rule. Whitespace-only short labels remain accepted. Timezone validity is a separate semantic check. Optional root description is 0–2000 characters. A non-null observation time must be a real Gregorian minute timestamp, years 1000–9999, with `Z` or offsets through ±14:00; seconds/fractions/newlines are rejected. Safe optional place sources require labels and absolute HTTP(S) URLs. No freshness, chronology, shared-timezone, matching-unit or physical-temperature rule is added.

## Local display only

The native place selector and Celsius/Fahrenheit buttons change local view state. Temperatures convert from each supplied place's own unit for display using the existing renderer, with one decimal place at most. Null stays unknown. Timestamps display in each supplied timezone without changing the supplied instant. Reset restores the initial place and root display unit; an empty list disables the controls and shows an explicit empty state. Native reset uses the existing reader ownership/cancellation behavior. This source migration changes no renderer or lifecycle implementation.

Source links are ordinary user-activated new-tab links with opener/referrer protections. No location permission, geolocation, place search, weather service, forecast generation, automatic refresh, host-state write or custom action event is introduced. Original self-contained input is in `examples/schema-modules/weather-sidebar.json`. Source/semantic tests do not claim browser, visual or live-weather acceptance.
