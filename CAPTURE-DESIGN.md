# Capture design and limits

## Scope

The MV3 extension performs a capture only after the user opens its action popup and presses **Capture current page**. It temporarily inspects the active OGame tab, reads selected visible DOM fields, and shows a versioned `ogmk.capture/1` JSON document for the user to review and copy into the local planner. It does not send the capture to any server.

The extension has only the `activeTab` and `scripting` permissions. It has no persistent OGame host permission, no background worker, no storage, no alarm, and no network API. It does not read cookies, local/session storage, hidden page scripts, messages, fleets, espionage reports, or other players' data. Missing values remain missing; there are no defaults that turn unknown production, energy, or bonuses into confirmed values.

## Adapter behavior

The adapter accepts only HTTPS pages under an OGame Gameforge host and `/game/`. It reads the page's OGame account metadata, recognized resource nodes, and explicitly attributed technology-level or production nodes. On a visible Imperium table it attempts each identified planet/moon row; otherwise it attempts only the active body. It never changes the selected body or initiates an OGame request.

The supported DOM selectors are conservative and version-sensitive. An unrecognized page returns a visible error or a partial observation. The adapter does not claim complete production, settings, officer, lifeform, or bonus coverage. Live accuracy has not been verified against a logged-in account; synthetic DOM fixtures only validate the parser contract. The local planner blocks recommendations when critical data is absent or stale.

## Synchronization

The user copies the reviewable JSON into the local planner's existing manual import. This version intentionally has no automatic extension-to-server bridge, pairing token, retry loop, or cross-origin transport. The local service remains bound to loopback and its existing authenticated import endpoint.

## Policy status

On 2026-10-20, the Origin Team's [toleration notice](https://forum.origin.ogame.gameforge.com/forum/thread/320-important-for-users-about-toleration-and-tolerated-tools/) said installed extensions that run on an OGame tab must be on the official Tolerated Tools list; publication in a browser store or a code repository does not establish toleration. The [forbidden-features guideline](https://forum.origin.ogame.gameforge.com/forum/thread/29-forbidden-features/) also requires minimizing background requests and forbids automation and undisclosed private-data transmission. This preview has not been submitted or declared tolerated. Do not use the extension on a live OGame account unless and until Origin lists the exact reviewed version.

## Provenance note

The capture implementation in this edition is newly written for its explicit, one-click visible-DOM contract. The earlier OGameka/Empire Tracker implementation had already been inspected during this project, so this work is not represented as a formal clean-room process. It does not copy that implementation's capture or synchronization modules.
