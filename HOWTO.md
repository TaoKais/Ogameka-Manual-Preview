# How to use OGAMEKA Local Planner

This guide covers the local planner, browser extension, one-time pairing, synthetic demo, and local data controls. The extension has not been declared tolerated by Origin. Do not capture a live account unless Origin lists this exact version.

## 1. Requirements

- Windows 10/11 with Node.js 24.x.
- Chrome, Edge, or Opera GX.
- The extracted project folder, containing `manifest.json` and `src\server.mjs`.

The application uses Node's built-in modules; do not run `npm install`.

## 2. Start the local planner

Open PowerShell in the extracted folder:

```powershell
Test-Path .\manifest.json
Test-Path .\src\server.mjs
node .\src\server.mjs
```

Both checks must return `True`. Leave the window open. The service binds only to `127.0.0.1:3176` and creates `.data-ogameka` beside the project. Port 3176 is fixed for extension synchronization; if it is occupied, resolve the conflicting local process before starting this edition. Use a private folder; do not point this edition at old Docker volumes or browser databases.

## 3. Pair the local panel

Open <http://127.0.0.1:3176>. In a second PowerShell window, read the one-time panel code:

```powershell
Get-Content .\.data-ogameka\pair-code.txt
```

Enter the eight digits in the page and press **Emparejar**. The code expires after five minutes and is removed after successful pairing. The panel session expires after one hour.

## 4. Load the extension

In `opera://extensions`, `chrome://extensions`, or `edge://extensions`, enable Developer mode and choose **Load unpacked**. Select the extracted folder containing the root `manifest.json`. The extension does not use a persistent game-site permission or background worker.

## 5. Pair and capture

1. In the planner, open **Datos y privacidad** and click **Generar código temporal**.
2. Open the OGame page you intend to inspect. Do not use the extension on a live account until this exact version is tolerated by Origin.
3. Click the extension icon. On the first capture, enter the temporary code from the planner.
4. Click **Capturar y sincronizar**. The browser requests optional access to `http://127.0.0.1:3176`; approve only if you want the local synchronization.
5. The extension reads recognized visible fields from the current page and sends the validated capture to the paired local service. It does not navigate, refresh, select another planet, or call OGame APIs.

The code expires in three minutes. The resulting upload-only credential expires after 24 hours. It cannot read planner accounts, history, export files, or settings. Disconnect it from the extension popup, or revoke all extension pairings from **Datos y privacidad**. Revocation is local; if the planner is stopped, use its revocation control after restarting.

## 6. Explore without an account

Choose **Cargar demo** to generate ten synthetic planets. Select a resource, horizon, sampling interval, and execution mode, then choose **Analizar hipótesis**. The demo is not a snapshot of OGame. Planning results are conditional on the displayed assumptions and do not establish a global optimum.

In **Planificación**, use **Matriz de objetivos** to enter a manual cost, hourly gain and duration, then select one or more planets. **Comparar amortización** runs one local scenario per selected destination and shows the conditional investment, completion time, payback and horizon advantage. **Añadir objetivo a planetas seleccionados** adds the separate destinations to the scenario JSON; open the advanced JSON editor to inspect or edit it. The comparison uses the loaded snapshot and does not prove a globally optimal route. In **Vida en el Imperio**, lifeform levels appear only when they exist in the capture; IDs are shown as captured instead of guessed labels.

The **Flota** view is an explicit boundary: this edition does not capture espionage reports, fleets or defenses, and therefore does not estimate attack profitability. Grafana is not bundled; the charts are rendered locally by this application.

For a real capture, inspect source, timestamp, quality, missing fields, and production settings before relying on the charts. The adapter may be partial, and the model blocks analysis when critical fields are absent or stale.

## 7. Retention, export, and deletion

In **Datos y privacidad**, set the retention limits, export a minimized support diagnostic, revoke extension credentials, or delete this instance's local store. Deletion invalidates local sessions and extension tokens. It does not erase exported files, operating-system backups, browser-profile backups, or other OGAMEKA installations.

## 8. Stop the service

Press `Ctrl+C` in the Node window. Data remains in `.data-ogameka` until you use the scoped deletion control or remove that dedicated folder after stopping the service.

## Troubleshooting

- **Pair code file missing:** start the service from the extracted root and read the code within five minutes.
- **Extension cannot connect:** confirm Node is still running at `127.0.0.1:3176`, reload the extension, and check that optional local-host access is granted.
- **Pair code rejected:** generate a fresh code in the planner; each code is single-use and expires after three minutes.
- **Capture returns no data:** use a supported visible economic page and ensure the browser granted temporary `activeTab` access. The adapter is conservative and may not recognize changed page markup.
- **Capture saved but analysis is blocked:** review the missing/stale inputs. Do not replace unknown data with zero or treat a projected result as verified.

## Run tests

From the extracted root:

```powershell
node --test test/*.test.mjs
```

Tests use synthetic fixtures and temporary local services. They do not validate live DOM coverage, game formulas, Origin tolerance, or a production browser-store review.
