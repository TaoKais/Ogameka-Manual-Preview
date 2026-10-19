# Migración, recuperación y borrado

## Almacén de la preliminar

El almacén solo se abre en un directorio vacío o con marcador OGAMEKA. Un segundo escritor recibe un error; no se termina ningún proceso por cuenta propia. Si el proceso murió y el bloqueo sigue presente, cierra la instancia y ejecuta `node tools/recover-lock.mjs` desde esta carpeta. La herramienta exige la frase `PROCESO-DETENIDO`, comprueba que el PID no existe y solo quita el bloqueo del directorio marcado.

La versión interna 1 migra al esquema 2 al abrir el mismo almacén. Conserva cuentas, lecturas e historial lógico, deja una copia `.v1` para inspección y mantiene el checksum del sobre. No es una importación del almacén anterior de OGAMEKA.

Si `store.json` no supera la validación, se conserva con sufijo `.damaged` y se restaura el último respaldo válido. Puede perderse la última transacción no respaldada. Si también está dañado el respaldo, la aplicación falla cerrada y no inventa una base vacía encima de los archivos. Copia el directorio completo antes de intentar recuperación manual.

## Datos del OGAMEKA anterior

No conectes el almacén nuevo al volumen Docker, IndexedDB, `ogameka-data` ni a una carpeta de la instalación anterior. El importador acepta únicamente el formato revisado `ogameka-local-v1`, requiere seleccionar universo/idioma/jugador y crea un directorio nuevo que no exista. Lee el JSON anterior sin escribirlo. Si falta una identidad suficiente, exige una confirmación literal del usuario.

El adaptador conserva planetas, lunas, nombre/coordenadas, lecturas económicas, temperaturas, niveles, formas de vida, precios capturados y parte de la configuración con su fecha/origen cuando está disponible. Los campos sin fecha suficiente se marcan provisionales; niveles desconocidos permanecen ausentes. Se excluyen deliberadamente informes de espionaje/combate, expediciones, escombros, flotas, identificadores de mensajes, datos no reconocidos y partes del modelo histórico. Esto no es una migración completa ni restaura planes de la aplicación vieja. Conserva el original y compara el resumen antes de usar los datos.

## Copias cifradas

La exportación cifrada usa AES-256-GCM y una clave derivada de la frase que el usuario escribe en la entrada estándar. Restaura únicamente a un directorio nuevo y valida el sobre antes de abrirlo. No sobreescribe origen o destino. Una copia cifrada no garantiza borrado seguro de SSD, snapshots, cachés de consola, sincronizadores o copias anteriores.

## Borrado

La operación visible muestra el alcance y exige confirmación literal. Borra el almacén marcado, su respaldo, versiones de recuperación, temporales y el archivo local de emparejamiento. Deja el directorio vacío y su marcador para que una ruta equivocada no parezca nueva. No borra datos de la extensión heredada ni volúmenes Docker/Grafana.
