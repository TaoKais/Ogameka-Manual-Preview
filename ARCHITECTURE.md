# Architecture and design decisions

```mermaid
flowchart LR
  A[Current visible OGame tab] -->|explicit popup click| X[MV3 capture adapter]
  X -->|one-time pair + upload-only token| L[127.0.0.1 local planner]
  L --> C[Closed capture contract]
  C --> S[Single-writer local store]
  S --> W[Bounded analysis worker]
  W --> U[Charts, scenarios and projections]
```

## Boundaries

- The browser extension reads a subset of visible DOM values from the current page after an explicit click. It does not call OGame APIs, poll, navigate, read browser sessions, or perform game actions.
- The extension's optional host permission targets one loopback origin. A separate one-time code pairs it with the local planner; its in-memory credential allows capture writes only and expires after 24 hours.
- The Node service validates the versioned contract, serializes writes, stores observations locally with quality/source/time, and starts bounded analysis work in a separate worker.
- The UI renders synthetic and captured data, visualizes planet-level distributions, and compares explicitly specified economic scenarios. Missing critical inputs block relevant analysis.

## Why this design

The product needs a small capture surface, local privacy, visible provenance, and a planner that never issues game actions. A long-lived background bridge or timer was unnecessary for user-triggered capture and would complicate permissions and revocation. The one-click request has no automatic retry; a failed capture is repeated by the user. The manual JSON paste interface is removed from this edition.

The local service checks the Host header, accepts loopback clients only, limits body size, validates payloads, and uses one writer lock, a serialized write queue, checksum-protected storage, and a recovery backup. Worker jobs have bounded time and memory. No Docker, Grafana, central server, telemetry, or old `oget-*` store is included.

## Limits

The DOM adapter has not been validated against a live account; synthetic fixtures verify parser behavior only. Production formulas and recommendations are not validated game rules. The bounded planner does not claim global optimality. Origin tolerance and rights clearance for OGame materials are external questions; the package excludes third-party game assets and does not claim approval.
