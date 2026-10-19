# OGAMEKA · Manual Preview

**A local-first planning prototype for OGame players.** Enter or import economic observations, compare a small set of construction scenarios, and inspect conditional projections on your own computer.

> **Preview 0.2.1.** Includes a real, user-triggered Manifest V3 capture extension and a local planner. The extension is **not listed as tolerated by Origin**; do not use it on a live OGame account unless the exact version is officially tolerated. This is not an official OGame product, and estimates are not validated game formulas or a global optimum.

**Español:** [descripción y guía en español](#español) · **English:** [overview and guide](#english)

## Screenshots

Screenshots show the included synthetic demonstration. They contain no account data.

![OGAMEKA manual preview: ten synthetic planets shown as a production share doughnut and frequency histogram, with scenario projection](public/screenshots/overview.png)

![OGAMEKA manual preview: explicit data import, retention and deletion controls](public/screenshots/privacy-and-retention.png)

## English

### What it does

- Runs as a local Node.js service bound to `127.0.0.1`.
- Includes a Manifest V3 extension at the repository root. `manifest.json` loads the popup and one-click visible-DOM capture; permissions are limited to `activeTab` and `scripting`.
- Captures only after an explicit click on the extension action. It produces reviewable `ogmk.capture/1` JSON and keeps it in the popup for manual copying into the local planner.
- Accepts a built-in synthetic demo or an explicit, validated economic data import.
- Compares sequential and per-planet parallel scenarios over 30, 90 or 180 days.
- Visualizes multi-planet production with a per-planet doughnut chart and a frequency histogram; switch between metal, crystal and deuterium.
- Shows the assumptions, event timeline, resource balance and conditional projection.
- Keeps account data in this instance's local store; retention and scoped deletion are available.
- Provides a minimized support export. No telemetry or central account service is included.

### What it does not do

This package excludes the historic browser extension/bridge, Grafana, game assets/catalogues and the prior integrated application. The new capture extension does not poll OGame, call game APIs, read browser sessions, automate navigation or gameplay, dispatch fleets, read messages or espionage reports, provide absent-player alerts, show ads, or unlock features through donations. It reads only recognized visible fields on the current tab after a click; missing fields remain absent. There is no automatic extension-to-server transport.

Origin's current toleration notice says an installed extension running on an OGame tab must be listed in the Tolerated Tools forum. This preview is not listed or approved. [Read the notice](https://forum.origin.ogame.gameforge.com/forum/thread/320-important-for-users-about-toleration-and-tolerated-tools/) and [forbidden-features guidance](https://forum.origin.ogame.gameforge.com/forum/thread/29-forbidden-features/). Installing the package does not establish toleration.

The built-in demo is synthetic. Imported values are user-provided observations, not independently verified game state. The DOM adapter is conservative and version-sensitive; it has not been validated against a logged-in live account and may return partial captures. The planner models only the fields in its contract; transport, active game queues and many game-specific constraints are excluded. A bounded scenario comparison is not proof of an optimum.

### Quick start

Requires Node.js 24.x. No npm install or runtime package download is needed.

```powershell
# Open PowerShell in the extracted repository root (the folder containing src and manifest.json).
Test-Path .\src\server.mjs
node .\src\server.mjs
```

Keep that PowerShell window open. It must print `OGMK manual preliminary: http://127.0.0.1:3176`; if Node reports an error or you close the window, the address will not load. In a browser, open <http://127.0.0.1:3176>. In a second PowerShell window opened in the same repository root, read `.data-independent/pair-code.txt`, enter the one-time code in the page, and choose **Cargar demostración sintética**. Select a horizon and press **Analizar hipótesis**. See [HOWTO.md](HOWTO.md) for the full Windows walkthrough, manual JSON import, data location and shutdown steps.

The ZIP includes `manifest.json` at its root so Opera GX/Chromium can load the extracted folder as an unpacked extension. The extension captures real visible values only after a click and presents JSON for manual import; it does not query or send anything automatically. **Do not use it on a live account while this version is not listed as tolerated by Origin.** See [CAPTURE-DESIGN.md](CAPTURE-DESIGN.md) for scope and limitations.

The pairing code is private and expires after five minutes; do not paste it into an issue or share it. Use a private local directory. `Ctrl+C` stops the service. It does not replace the existing OGAMEKA service or Docker volumes.

When running from the full development checkout instead of the standalone preview branch/package, use its `independent` directory as the working directory.

### Privacy and safety

The service binds to loopback by default and makes no outbound request. Only import economic fields defined by `ogmk.capture/1`; do not include passwords, cookies, session tokens, messages, espionage reports or another player's private data. The optional Ko-fi link opens only after the user chooses it and sends no OGAMEKA data.

Read [PRIVACY.md](PRIVACY.md), [CONTRACT.md](CONTRACT.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [MIGRATION.md](MIGRATION.md) before using non-synthetic data. Backups are local and are not encrypted by this preview.

### Validation

```powershell
node --test test/*.test.mjs
```

Tests use synthetic fixtures and temporary local services. They do not validate live OGame formulas, account capture or Origin tolerance. The preparation run also exercised the UI at three viewport widths, checked that a forged HTML payload remained inert and verified zero outbound requests. Those browser-only checks require Playwright and are not part of this minimal package.

### Ko-fi

Support is optional: <https://ko-fi.com/yahvveh>. Contributions do not provide access, unlock features or give an in-game advantage. Verify the destination while signed in to the Ko-fi account before sharing this preview.

### License

The files in this standalone manual edition are offered under **Apache License 2.0**, subject to [LICENSE-SCOPE.md](LICENSE-SCOPE.md) and [NOTICE.md](NOTICE.md). This license does not cover the historic repository outside this edition, OGame/Gameforge materials, trademarks, or any third-party components that are not listed as included here. It is not a statement of permission from Gameforge or of Origin tolerance.

---

## Español

### Qué ofrece

- Se ejecuta como servicio local de Node.js, ligado a `127.0.0.1`.
- Incluye una extensión Manifest V3 en la raíz del repositorio. `manifest.json` declara únicamente los permisos `activeTab` y `scripting`.
- Captura tras un clic explícito, muestra JSON revisable `ogmk.capture/1` y permite copiarlo manualmente al planificador local.
- Incluye una demo sintética y admite importar explícitamente datos económicos validados.
- Compara escenarios secuenciales y paralelos por planeta en periodos de 30, 90 o 180 días.
- Representa la producción de varios planetas en un gráfico de sectores y un histograma; permite cambiar entre metal, cristal y deuterio.
- Muestra hipótesis, calendario de eventos, saldo de recursos y proyección condicional.
- Guarda los datos en el almacén local de esta instancia; permite configurar retención y borrado acotado.
- Permite exportar un diagnóstico minimizado. No incluye telemetría ni servicio central de cuentas.

### Qué queda fuera

El paquete excluye la extensión/puente históricos, Grafana, recursos y catálogos del juego y la aplicación integrada anterior. La nueva extensión no consulta OGame ni llama a sus API, no lee sesiones, no automatiza navegación ni acciones, no envía flotas, no lee mensajes ni informes de espionaje ni transmite capturas automáticamente. Solo lee campos visibles reconocidos de la pestaña actual tras un clic; no inventa los ausentes.

El aviso vigente de Origin indica que una extensión instalada que se ejecuta en una pestaña de OGame debe figurar en el foro de herramientas toleradas. Esta preliminar no está listada ni aprobada. [Lee el aviso](https://forum.origin.ogame.gameforge.com/forum/thread/320-important-for-users-about-toleration-and-tolerated-tools/) y las [reglas de funciones prohibidas](https://forum.origin.ogame.gameforge.com/forum/thread/29-forbidden-features/). Instalar el paquete no implica tolerancia.

La demo contiene datos sintéticos. Los datos importados son observaciones aportadas por el usuario, no un estado del juego verificado de forma independiente. El adaptador DOM es conservador y depende de la versión; no se ha validado con una cuenta real iniciada y puede producir capturas parciales. El planificador solo modela los campos de su contrato; excluye transporte, colas activas y numerosas restricciones del juego. Una búsqueda acotada no demuestra que se haya encontrado un óptimo global.

### Inicio rápido

Requiere Node.js 24.x. No hace falta instalar paquetes npm ni descargar dependencias de ejecución.

```powershell
# Abre PowerShell en la raíz extraída (la carpeta que contiene src y manifest.json).
Test-Path .\src\server.mjs
node .\src\server.mjs
```

Deja abierta esa ventana de PowerShell. Debe mostrar `OGMK manual preliminary: http://127.0.0.1:3176`; si Node informa de un error o cierras la ventana, la dirección no cargará. En el navegador, abre <http://127.0.0.1:3176>. En una segunda ventana de PowerShell, también situada en la raíz del repositorio, lee `.data-independent/pair-code.txt`, introduce el código de un solo uso en la página y pulsa **Cargar demostración sintética**. Elige el periodo y pulsa **Analizar hipótesis**. Consulta [HOWTO.md](HOWTO.md) para la guía completa en Windows, la importación JSON, la ubicación de datos y el cierre.

El ZIP incluye `manifest.json` en la raíz para cargar la carpeta descomprimida en Opera GX/Chromium. La extensión captura valores visibles reales solo tras pulsar su botón y muestra JSON para importarlo manualmente; no consulta ni transmite datos automáticamente. **No la uses con una cuenta activa mientras esta versión no esté listada como tolerada por Origin.** Consulta [CAPTURE-DESIGN.md](CAPTURE-DESIGN.md) para conocer su alcance y límites.

Si ejecutas desde el repositorio completo de desarrollo, usa su carpeta `independent` como directorio de trabajo.

El código de emparejamiento es privado y caduca a los cinco minutos; no lo publiques en una incidencia ni lo compartas. Utiliza una carpeta local privada. `Ctrl+C` detiene el servicio. No sustituye el servicio OGAMEKA existente ni sus volúmenes Docker.

### Privacidad y seguridad

El servicio escucha en loopback por defecto y no realiza peticiones externas. Importa únicamente campos económicos definidos en `ogmk.capture/1`; no incluyas contraseñas, cookies, tokens de sesión, mensajes, informes de espionaje ni datos privados de otros jugadores. El enlace opcional de Ko-fi solo se abre cuando el usuario lo elige y no transmite datos de OGAMEKA.

Lee [PRIVACY.md](PRIVACY.md), [CONTRACT.md](CONTRACT.md), [ARCHITECTURE.md](ARCHITECTURE.md) y [MIGRATION.md](MIGRATION.md) antes de usar datos no sintéticos. Las copias locales de esta preliminar no están cifradas.

### Validación

```powershell
node --test test/*.test.mjs
```

Las pruebas usan datos sintéticos y servicios locales temporales. No validan fórmulas con OGame en vivo, la captura de cuentas ni la tolerancia de Origin. Durante la preparación también se probó la interfaz en tres resoluciones, se verificó que HTML falsificado quedara inerte y que no hubiera peticiones externas. Esas pruebas de navegador requieren Playwright y no forman parte del paquete mínimo.

### Ko-fi

El apoyo es opcional: <https://ko-fi.com/yahvveh>. Las aportaciones no conceden acceso, desbloquean funciones ni ofrecen ventajas en el juego. Verifica el destino desde la cuenta de Ko-fi antes de compartir esta preliminar.

### Licencia

Los archivos de esta edición manual autónoma se ofrecen bajo **Apache License 2.0**, sujetos a [LICENSE-SCOPE.md](LICENSE-SCOPE.md) y [NOTICE.md](NOTICE.md). Esta licencia no cubre el resto histórico del repositorio, materiales de OGame/Gameforge, marcas ni componentes de terceros que no figuren aquí como incluidos. Tampoco afirma que Gameforge haya dado permiso ni que Origin tolere el programa.
