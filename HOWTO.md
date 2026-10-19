# How to run OGAMEKA Manual Preview

This guide uses PowerShell on Windows and the synthetic demo. No OGame login, browser extension, Docker, account export or network access is required.

## 1. Check Node.js

Use Node.js 24.x. In PowerShell:

```powershell
node --version
```

The manual preview uses only Node.js built-in modules; do not run `npm install` for this edition.

## 2. Start an isolated instance

In a new PowerShell window:

```powershell
Set-Location <path-to-preview>
node src/server.mjs
```

The service binds to `127.0.0.1:3176`. It uses `.data-independent` under this directory. This location is independent of the existing OGAMEKA Docker volumes. Choose a private directory and do not put it in a shared or cloud-synced folder if that does not match your privacy needs.

When running from the full development checkout instead of the standalone preview branch/package, use `<path-to-repository>\independent` as the working directory.

## 3. Pair this browser window

Open <http://127.0.0.1:3176>. In a second PowerShell window, read the one-time code:

```powershell
Set-Location <path-to-preview>
Get-Content .data-independent\pair-code.txt
```

Enter the code in the page and select **Emparejar**. The code expires after five minutes and is removed after pairing. Keep it private. The local session expires after one hour.

## 4. Explore the synthetic scenario

Select **Cargar demostración sintética**. Confirm that the account is marked `synthetic / demo` and the bodies are named `Planeta sintético`. Choose a horizon, execution mode and sampling interval, then select **Analizar hipótesis**. Values in the demo are illustrative only.

The displayed projection depends on entered prices, durations, production gains, initial stocks and model assumptions. It does not submit orders to OGame and does not prove a global optimum.

The planet overview starts with a doughnut chart that assigns one sector to each planet and a histogram that groups planet production into value ranges. Use the **Resource** selector to compare metal, crystal and deuterium. The demo chart is intentionally synthetic; it is useful for exploring the interface, not as a prediction of a real empire.

## 5. Import your own reviewed economic data (optional)

Open **Datos y privacidad** and paste a JSON document that follows [`CONTRACT.md`](CONTRACT.md). Choose **Validar y guardar**. The contract rejects unsupported fields and invalid or oversized inputs. Do not include login/session data, messages, fleet details, espionage reports or information about another player. Review every value and its observation date before planning.

Imported data is not independently verified against OGame. Missing or stale critical values should remain missing; do not replace them with guessed zeros.

## 6. Retention, export and deletion

The privacy page lets you prune history and export a minimized support diagnostic. The diagnostic omits names, original identifiers, coordinates, quantities, levels and dates; it is still a file you control and should review before sharing.

The deletion control removes only this preview instance's store, backup and local pairing state. It does not erase browser-extension data, files you exported, system backups or existing Docker volumes. Confirm the exact scope shown in the UI before deletion.

## 7. Stop the service

Return to the PowerShell window running Node and press `Ctrl+C`. The instance stops; its local data remains in `.data-independent` until you delete it yourself or use the scoped deletion control.

## Troubleshooting

- **Port already in use:** stop only the other process using port 3176 or set an unused `OGMK_PORT` between 1024 and 65535. Keep the service on `127.0.0.1`.
- **Pair code missing:** start the service and check `.data-independent\pair-code.txt` immediately; the code is short-lived.
- **Browser cannot connect:** verify the server window is still running and open the exact local URL `http://127.0.0.1:3176`.
- **Do not point this preview at existing data:** use a new data directory. The application rejects a directory marked for a different store.

## Run checks

From `independent`:

```powershell
node --test test/*.test.mjs
```

These checks use synthetic inputs and temporary services. They do not verify live OGame formulas, policy/tolerance or production security. A browser UI smoke test also passed during preparation; it requires development-only Playwright tooling that is not bundled in the preview.

---

## Guía en español

### Requisitos

Instala Node.js 24.x y comprueba la versión en PowerShell:

```powershell
node --version
```

La preliminar usa módulos incluidos con Node. No ejecutes `npm install`.

### Iniciar una instancia aislada

Desde la raíz de la rama o paquete preliminar:

```powershell
Set-Location <ruta-de-la-preliminar>
node src/server.mjs
```

El servicio escucha en `127.0.0.1:3176` y crea `.data-independent` en ese directorio. No reutiliza los volúmenes Docker de OGAMEKA. Mantén esa carpeta en una ubicación privada y local. Desde el repositorio completo de desarrollo, el directorio equivalente es `<ruta-del-repositorio>\independent`.

### Emparejar y probar la demo

Abre <http://127.0.0.1:3176>. En otra ventana de PowerShell, lee el código de un solo uso:

```powershell
Set-Location <ruta-de-la-preliminar>
Get-Content .data-independent\pair-code.txt
```

Introdúcelo en la página y pulsa **Emparejar**. Caduca a los cinco minutos y se elimina al emparejar; la sesión dura una hora. No compartas el código. Pulsa **Cargar demostración sintética**, confirma que la cuenta aparece como `synthetic / demo`, selecciona el periodo y el modo de ejecución, y pulsa **Analizar hipótesis**.

### Importar y borrar

En **Datos y privacidad** puedes pegar una captura económica revisada que cumpla el [contrato `ogmk.capture/1`](CONTRACT.md). No incluyas claves, cookies, sesiones, mensajes, informes de espionaje ni información privada de otros jugadores. Los datos importados no se verifican contra OGame.

La misma pantalla permite podar historial, exportar un diagnóstico reducido y borrar solo el almacén y la sesión de esta preliminar. El borrado no elimina extensiones, exportaciones ni volúmenes Docker previos.

### Detener y probar

Vuelve a la ventana que ejecuta Node y pulsa `Ctrl+C`. La instancia se detiene; el almacén local permanece hasta que lo borres expresamente. Para ejecutar las pruebas desde la raíz de la preliminar:

```powershell
node --test test/*.test.mjs
```

Son pruebas con datos sintéticos y servicios locales temporales. No validan fórmulas con una partida activa, tolerancia de Origin ni seguridad de producción.
