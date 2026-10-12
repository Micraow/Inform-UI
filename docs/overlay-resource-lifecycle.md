# Overlay resource lifetime

Tooltip and Popover retain their existing presentation, dismissal and focus contracts. Their open-session positioning listeners, observers, pending animation frame, delayed pointer leave and pointer-release listeners are owned by the existing render generation.

Registration is not assumed to be atomic: a host constructor or registration hook can synchronously replace or dispose a mount before returning. The resource must then be released, including an observer target registered after the first disconnect. Observer disconnection is idempotent. A pending frame or leave timer returned late is cancelled; synchronous callbacks release their task scope without blocking a later request.

Independent predecessor controls reproduced six leaks (two components, each with late frame, observer construction and observer registration), while ordinary open/close controls passed. Focused successor results are recorded separately after execution. No protocol, source data, public event or CSS contract changes are required.

## Focused author verification

48 source-level overlay/position/lifecycle tests passed. Strict type checking and declaration generation passed in separate processes, followed by the owned-queue and source-boundary checks. The first combined build produced all JavaScript bundles but its declaration subprocess was killed by the environment; that failure log is retained rather than called a successful combined build. No new native-browser or whole-library run is claimed.
