# Privacidad de la preliminar manual

Esta edición calcula en el equipo y no envía información por defecto. No instala telemetría, métricas de uso, anuncios, cuentas centrales ni una pasarela de pago. Las proyecciones y gráficas se generan en el navegador o en el servidor local del mismo equipo. El paquete incluye una extensión MV3 de captura explícita, sin puente automático al servidor.

La extensión declara únicamente `activeTab` y `scripting`. Al pulsar su acción, recibe acceso temporal a la pestaña activa y lee campos económicos reconocidos del DOM visible; no tiene permisos persistentes para hosts de OGame, almacenamiento, alarmas, cookies ni red. El JSON aparece en la ventana emergente y permanece en memoria de esa ventana hasta cerrarla. La persona decide si lo copia al planificador local. La API de navegador `activeTab` concede acceso temporal tras una acción explícita del usuario ([documentación de Chrome](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab/)).

Los valores de captura pueden incluir universo, nombre de jugador, IDs/nombres de planetas, existencias y niveles visibles. No se leen sesiones, mensajes, flotas ni informes. La captura no está validada contra una cuenta OGame conectada y puede ser incompleta. El manifiesto no hace que la herramienta esté tolerada: consulta [CAPTURE-DESIGN.md](CAPTURE-DESIGN.md) antes de usarla.

El almacén local guarda la identidad de universo/cuenta, cuerpos, lecturas económicas con su fecha, fuente y calidad, objetivos, preferencias del modelo e historial de simulaciones. La retención inicial del historial es de 30 días, configurable; se limita a 120 entradas por ámbito. Los datos actuales de una cuenta activa permanecen hasta que se borren. Una lectura vieja no se vuelve reciente al cambiar la fecha del sobre.

Los informes de espionaje que se pegan en la pestaña Flota solo permanecen en el DOM y la memoria de esa pestaña. La preliminar no los envía al servidor local ni los guarda en el almacén. Incluyen datos de otros jugadores; introdúcelos solo si tienes derecho a analizarlos. No se capturan bandejas de mensajes ni informes de forma automática.

El diagnóstico de soporte exporta recuentos por calidad y categorías de retención. Omite nombres, coordenadas, identificadores originales, recursos, informes y fechas. Es una reducción de datos, no una garantía de anonimato frente a información externa o grupos pequeños.

El emparejamiento crea una clave de un solo uso, válida cinco minutos, en un archivo local con acceso restringido por el sistema operativo; la sesión posterior dura una hora y no aparece en la respuesta general del almacén. En Windows, el modo POSIX 0600 no define por sí solo las ACL: usa una carpeta privada de tu usuario. El navegador, el sistema, copias de seguridad y programas de sincronización pueden conservar copias ajenas a la aplicación.

El borrado de la preliminar elimina su almacén, respaldo, archivos temporales y código pendiente de emparejamiento. No borra bases de la extensión antigua, exportaciones guardadas por la persona, instantáneas del sistema ni directorios de servicios existentes. Desconectar revoca los permisos de la instancia y invalida la sesión que mantiene en memoria.

No se ha publicado un aviso de privacidad jurídico ni se ha determinado responsable, base jurídica o plazo legal aplicable a una distribución pública. Hay que resolverlo según titularidad, uso previsto, jurisdicción y flujo final antes de ofrecer el programa a terceros.
