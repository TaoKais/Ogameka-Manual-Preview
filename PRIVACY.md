# Privacy and local data flow

Ogameka has no telemetry, advertising, central account, or analytics endpoint. The planner binds to `127.0.0.1:3176`; the extension's optional network permission targets that loopback host. The extension's capture request is made only after a button click and is sent to the paired local service. It does not send data to OGame, Gameforge, Ko-fi, GitHub, or a project server.

## Extension permissions and capture

The Manifest V3 extension requires `activeTab` and `scripting` for the user-triggered read, plus `storage` to retain a local upload token. It declares optional host access only for `http://127.0.0.1:3176/*`, requested at runtime when the user clicks capture. It has no OGame host permission, content-script matcher, service worker, alarm, polling loop, or cookie permission.

The adapter reads recognized text and attributes in the visible DOM of the current OGame page. Captures may include universe, player name, body IDs/names, visible economic stock, production, settings and bonus rows. It does not read cookies, local/session storage, hidden page code, messages, fleets or espionage reports. It does not change the selected body or initiate game requests. Unsupported values remain absent.

## Pairing and synchronization

Pairing is explicit. The authenticated local panel generates an eight-digit single-use code that expires after three minutes. The extension exchanges it for a random upload-only token. The server stores only a hash of that token, binds it to the extension origin, and expires it after 24 hours. The raw token is stored in the browser extension's local storage; it is not synchronized through the browser vendor's cloud-sync storage. The user can disconnect the extension or revoke all extension tokens from the panel. Restarting the local service also invalidates all in-memory tokens.

The token authorizes capture writes only. It cannot read planner data, account lists, history, settings, diagnostics, or deletion endpoints. Requests are restricted to loopback and checked against the exact local host and the extension origin. No CORS wildcard or cross-origin credential is used. The local service does not expose a remote listener.

## Stored data and retention

The local store contains captured account identity, body identifiers and names, economic facts, observation metadata, and local planning inputs/results. It is written under `.data-ogameka` in the selected working directory. Default history retention is 30 days and can be changed in the interface. Current account values remain until deletion or the configured retention removes the account as a whole.

The synthetic demo is marked as synthetic. Imported/manual JSON is not available in the user interface. The contract and server validate the extension payload and preserve source, quality, and timestamps; this does not independently prove that data came from OGame.

The support diagnostic contains minimized counts and quality categories rather than names, account keys, coordinates, quantities, levels, or dates. Review any export before sharing it. Browser, operating-system, backup, and user-selected synchronization software may retain copies outside Ogameka's control.

## Deletion and scope

The deletion control clears this instance's store, local backups, temporary recovery files, panel session, pending pairing codes, and active extension tokens. It does not erase exported diagnostics, system backups, other browser-profile data, previous Ogameka installations, or Docker volumes.

This document describes product behavior, not a complete legal privacy notice. The controller, legal basis, and obligations for any public distribution depend on the actual operator and use; they require a separate assessment before offering a hosted service. This release has no hosted service.
