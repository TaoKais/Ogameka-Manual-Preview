# Capture design, synchronization, and limits

## User-triggered visible capture

The MV3 extension runs no page script in the background. The user opens the popup and presses **Capturar y sincronizar**. `activeTab` and `scripting` grant temporary access to the current tab for that action; the adapter accepts HTTPS OGame Gameforge pages under `/game/` and reads only recognized visible DOM values. It never navigates, changes the selected planet, refreshes the game, or calls game APIs.

The adapter records observation time, source, and quality. It currently recognizes a subset of account identity, visible resources, body rows, technology levels, resource production settings, production summary, and bonus rows. Unrecognized values remain missing. The selectors are conservative and version-sensitive; synthetic fixtures validate the extraction contract but do not establish completeness on a live account.

## Local synchronization

Only the extension popup sends data, and only after the same explicit click. Optional host permission is restricted to `http://127.0.0.1:3176/*`. The user pairs the planner and extension with distinct, short-lived codes. The extension receives an upload-only credential; the server stores its hash, binds it to the extension origin, allows at most eight active credentials, and expires it after 24 hours. The server listens only on loopback and accepts only the upload route for that credential. It does not expose read, planning, export, retention, or deletion APIs to the extension.

There is no polling, background retry, delayed upload, OGame request, third-party relay, browser cloud sync, or automatic action. A missed capture is performed again by the user. Revocation is available in the extension popup and planner; service restart invalidates in-memory credentials.

## Data and planning limits

The planner stores only the validated economic capture and local scenario inputs. It distinguishes observed, estimated, provisional, stale, and absent data. Critical missing values block relevant analysis; this is safer than presenting guessed defaults as verified. A captured DOM value is still an observation from a user-controlled browser, not cryptographic proof of game state.

Prices, durations, formulas, and outcome calculations are not certified against OGame. A bounded scenario result is not a proof of a global optimum and never executes an order.

## Origin status

The [Origin toleration notice](https://forum.origin.ogame.gameforge.com/forum/thread/320-important-for-users-about-toleration-and-tolerated-tools/) states that extensions installed to run on OGame tabs must be listed as tolerated. This exact version has not been listed or reviewed by Origin. A public source release, local-only transport, or user gesture does not itself establish tolerance. Do not use the capture extension on a live account unless Origin lists this exact version.

## Provenance

This edition's adapter and local upload bridge were authored for this standalone package after earlier tracker code had been inspected. We do not claim a formal clean-room process. The package excludes the old tracker collector and bridge, imported catalogs, OGame artwork, and the historical combined application. See [LICENSE-SCOPE.md](LICENSE-SCOPE.md).
