# Contrato económico versionado

Identificador: `ogmk.capture/1`. Validador de referencia: `src/contract.mjs`. Solo objetos JSON cerrados; se rechazan claves ajenas, no se eliminan silenciosamente credenciales. No se aceptan URLs de sesión, cookies, mensajes, flotas o informes.

```json
{
  "schema": "ogmk.capture/1",
  "account": {"universe": "s1-es", "player": "123"},
  "observedAt": "2026-10-19T12:00:00.000Z",
  "bodies": [{
    "id": "456",
    "kind": "planet",
    "production": {
      "metal": {"value": 0, "quality": "observed", "source": "manual", "observedAt": "2026-10-19T12:00:00.000Z"},
      "crystal": {"value": null, "quality": "missing", "source": "manual", "observedAt": "2026-10-19T12:00:00.000Z"}
    }
  }]
}
```

El ejemplo es parcial e incompleto deliberadamente: se puede guardar, pero no habilita recomendaciones. No representa cifras de una cuenta real. Para una entrada completa puede examinarse la demostración generada por `demo.mjs`.

## Datos y calidades

`observedAt` del sobre indica la observación del conjunto; cada dato mantiene su propia fecha. Actualizar el sobre no rejuvenece hechos antiguos. Se exige UTC válido, se rechazan fechas imposibles y se toleran hasta cinco minutos de desfase futuro del reloj.

Un hecho tiene `value`, `quality`, `observedAt` y `source` opcional. `source` se conserva como `manual`, `visible-dom`, `synthetic`, `migration` o, si no se informó, `declared`. Calidad y procedencia son declaraciones del adaptador/usuario; el servidor no certifica autenticidad del juego. Los fixtures con fuente `synthetic` simulan observaciones para ensayar lógica, no datos reales.

* `observed`: valor declarado como observado, incluido cero.
* `estimated`: estimación, sin convertirla en lectura confirmada.
* `provisional`: valor existente que requiere revisión.
* `missing`: `value` debe ser `null`; no es cero.
* `stale`: condición calculada por fecha, no una sustitución de calidad; el análisis bloquea datos críticos de más de 24 horas.

Cuenta: universo y jugador explícitos, sin asignar automáticamente la captura a la cuenta más reciente. Cada cuerpo tiene ID y tipo `planet`/`moon`; nombre opcional. Admite mapas de hechos de stock, producción neta, porcentajes, multiplicadores agregados, temperatura, saldo energético, niveles, edificios y tecnologías de formas de vida. `research` opcional pertenece a la cuenta. `prices` es un mapa por tecnología con nivel concreto, tres costes y tiempo opcional, también fechados/calificados.

Las cantidades usan unidades explícitas de metal, cristal y deuterio; la producción ya es neta por hora. Los coeficientes de comparación no convierten recursos para pagar costes. No se infieren oficiales ni se suman dos veces sus efectos. El motor no contiene fórmulas del juego para recomputar la tasa desde esos datos.

## Fusión de capturas y límites

El hash excluye fechas de observación, conserva calidades/origen y ordena claves y cuerpos. Dos datos iguales observados a distinta hora comparten contenido semántico. Una calidad/origen o un valor distinto sí cambia ese contenido. Las fechas más nuevas se guardan en la última observación sin añadir una copia histórica idéntica.

Se fusiona por cuenta, cuerpo y campo. Una lectura antigua o ausente no sustituye una nueva; una estimación/provisional no degrada una observación válida. No se reutiliza un precio de otro nivel. El historial conserva las versiones de contenido. Una captura parcial no declara eliminados los cuerpos omitidos; el borrado se realiza por la función explícita, no mediante ausencia de campos.

| Límite técnico | Valor |
|---|---|
| Entrada/captura fusionada | 256 KiB; laboratorio envía como máximo 128 KiB |
| Cuentas / cuerpos por cuenta | 8 / 32 |
| Elementos por mapa | 192 |
| Niveles almacenados / objetivos de precio | 0–10.000 / 1–10.000; enteros |
| Valores numéricos | Finitos, magnitud hasta 10^15; stock/costes no negativos |
| Objetivos / muestras | 60 / 4.096 |
| Horizonte / muestreo | 1–8.760 horas / 0,25–168 horas; se rechaza la combinación que excede muestras |
| Retención | 1–365 días; 1–120 capturas históricas por cuenta |

Son límites de esta implementación, no máximos oficiales de OGame. Fuera de rango se rechaza el dato; no se recorta a un valor aparentemente confirmado. Los niveles de formas de vida superiores a 100 no se truncan. La migración no puede recuperar valores que se hayan perdido previamente en un exportador anterior.

## Plan y resultados

Cada objetivo declara ID, cuerpo, coste por recurso, ganancia neta por hora y duración. Puede identificar `technologyId` y `targetLevel` para dar prioridad al precio capturado del nivel exacto; precios antiguos o provisionales no se reaplican como confirmados. Las ganancias siguen siendo hipótesis del usuario. El motor conserva la cola de cada planeta, compara el modo elegido y calcula inversión, saldo frente a no construir y recuperación dentro del periodo.

Los datos críticos ausentes, provisionales, estimados o antiguos bloquean el análisis. También se bloquean saldo energético negativo y producción neta negativa no modelada, conservando sus valores de entrada. Es un filtro conservador previo a un motor genérico, no una certificación física de OGame. No hay búsqueda de óptimo global ni ROI inventado para un objetivo sin ganancia.
