# OGAMEKA · Manual Preview

**A local-first planning prototype for OGame players.** Enter or import economic observations, compare a small set of construction scenarios, and inspect conditional projections on your own computer.

> **Preview 0.1.1.** This edition is deliberately manual and separate from the existing capture extension. It is not an official OGame product, has not been reviewed or declared tolerated by Gameforge/Origin, and its estimates are not validated game formulas or a global optimum.

**Español:** [descripción y guía en español](#español) · **English:** [overview and guide](#english)

## Screenshots

Screenshots show the included synthetic demonstration. They contain no account data.

![OGAMEKA manual preview: ten synthetic planets shown as a production share doughnut and frequency histogram, with scenario projection](public/screenshots/overview.png)

![OGAMEKA manual preview: explicit data import, retention and deletion controls](public/screenshots/privacy-and-retention.png)

## English

### What it does

- Runs as a local Node.js service bound to `127.0.0.1`.
- Accepts a built-in synthetic demo or an explicit, validated economic data import.
- Compares sequential and per-planet parallel scenarios over 30, 90 or 180 days.
- Visualizes multi-planet production with a per-planet doughnut chart and a frequency histogram; switch between metal, crystal and deuterium.
- Shows the assumptions, event timeline, resource balance and conditional projection.
- Keeps account data in this instance's local store; retention and scoped deletion are available.
- Provides a minimized support export. No telemetry or central account service is included.

### What it does not do

This package excludes the browser extension, OGame capture bridge, Grafana, game assets/catalogues and the prior integrated application. It does not poll OGame, read browser sessions, automate navigation or gameplay, dispatch fleets, provide absent-player attack alerts, show ads, or unlock features through donations. No module that performs those tasks is hidden behind a disabled control.

The built-in demo is synthetic. Imported values are user-provided observations, not independently verified game state. The planner models only the fields in its contract; transport, active game queues and many game-specific constraints are excluded. A bounded scenario comparison is not proof of an optimum.

### Quick start

Requires Node.js 24.x. No npm install or runtime package download is needed.

```powershell
Set-Location <path-to-preview>
node src/server.mjs
```

Open <http://127.0.0.1:3176>. Read the one-time pairing code from `.data-independent/pair-code.txt` in the same directory, enter it in the page, and choose **Cargar demostración sintética**. Select a horizon and press **Analizar hipótesis**. See [HOWTO.md](HOWTO.md) for the full Windows walkthrough, manual JSON import, data location and shutdown steps.

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
- Incluye una demo sintética y admite importar explícitamente datos económicos validados.
- Compara escenarios secuenciales y paralelos por planeta en periodos de 30, 90 o 180 días.
- Representa la producción de varios planetas en un gráfico de sectores y un histograma; permite cambiar entre metal, cristal y deuterio.
- Muestra hipótesis, calendario de eventos, saldo de recursos y proyección condicional.
- Guarda los datos en el almacén local de esta instancia; permite configurar retención y borrado acotado.
- Permite exportar un diagnóstico minimizado. No incluye telemetría ni servicio central de cuentas.

### Qué queda fuera

Este paquete no incluye la extensión del navegador, el puente de captura de OGame, Grafana, catálogos/recursos del juego ni la aplicación integrada anterior. No consulta OGame, no lee sesiones del navegador, no automatiza navegación ni acciones del juego, no envía flotas, no alerta de ataques cuando el jugador está ausente, no muestra anuncios ni desbloquea funciones mediante donaciones. Ningún módulo con esas funciones queda oculto tras un control deshabilitado.

La demo contiene datos sintéticos. Los datos importados son observaciones aportadas por el usuario, no un estado del juego verificado de forma independiente. El planificador solo modela los campos de su contrato; excluye transporte, colas activas y numerosas restricciones del juego. Una búsqueda acotada no demuestra que se haya encontrado un óptimo global.

### Inicio rápido

Requiere Node.js 24.x. No hace falta instalar paquetes npm ni descargar dependencias de ejecución.

```powershell
Set-Location <ruta-de-la-preliminar>
node src/server.mjs
```

Abre <http://127.0.0.1:3176>. Lee el código de emparejamiento de un solo uso en `.data-independent/pair-code.txt`, en ese mismo directorio, introdúcelo en la página y pulsa **Cargar demostración sintética**. Elige el periodo y pulsa **Analizar hipótesis**. Consulta [HOWTO.md](HOWTO.md) para la guía completa en Windows, la importación JSON, la ubicación de datos y el cierre.

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
