# ADR-001: Diseño del almacenamiento del proyecto en Amazon S3

- Fecha: 2026-10-20
- Autores: Hernán Santiago Alvarino, José Agustín Barranco y Jeampaul Serna
- Estado: Aceptada

## Contexto

El proyecto es una aplicación web con backend en Node.js + Express, base de datos en Supabase (PostgreSQL), frontend en HTML/CSS/JS vanilla y datos deportivos obtenidos de The Odds API. Hasta ahora el frontend se publicaba en Vercel, desplegando desde la rama `master`.
En esta fase el frontend dejó de publicarse en Vercel y pasó a Amazon S3, como primer paso para migrar el proyecto a infraestructura real de AWS por fases.
Esto crea un problema concreto: hay que decidir cómo organizar el almacenamiento para que el sitio estático sea público y de solo lectura, mientras los datos sensibles (documentos de verificación KYC, credenciales, respaldos y registros de auditoría) quedan totalmente fuera del acceso público.
Los documentos KYC incluyen identificaciones y rostros de clientes: si se filtran, los clientes quedan expuestos a estafas y acoso, y la empresa a demandas.
Sin versionado, un archivo sobrescrito o borrado por error en S3 se pierde de forma definitiva, y sin una regla de ciclo de vida los datos poco consultados seguirían pagando la tarifa de Standard y las versiones viejas se acumularían sin límite.

## Decisión

Se adoptan **dos buckets** por integrante, con configuraciones opuestas (los nombres siguen el patrón `cuc-bp-<apellido>-sitio-2026` y `cuc-bp-<apellido>-privado-2026`; abajo se usan los de Alvarino como ejemplo):

1. **Bucket público del sitio** (`cuc-bp-alvarino-sitio-2026`): aloja el sitio web estático con el hosting de sitio web de S3 activado. No tiene activado el bloqueo de acceso público, y una política de bucket permite únicamente `s3:GetObject`, es decir, solo leer archivos. Versionado **activado**.
2. **Bucket privado** (`cuc-bp-alvarino-privado-2026`): mantiene **activado el bloqueo de acceso público**, por lo que una petición anónima devuelve 403 (AccessDenied): lo que no se concede de forma explícita queda denegado. El acceso se da solo por IAM, con mínimo privilegio. Versionado **activado**.

Dentro del bucket privado los datos se separan por **prefijos**: `credenciales/`, `documentos-kyc/`, `respaldos/` y `auditoria/`. Así los permisos y las reglas se aplican por prefijo; por ejemplo, el equipo de verificación puede leer `documentos-kyc/` sin poder tocar `credenciales/`, usando recursos como `arn:aws:s3:::cuc-bp-alvarino-privado-2026/credenciales/*`.

**Regla de ciclo de vida**, creada en la pestaña Management del bucket, aplicada a todos los objetos del bucket, con estos plazos:

| Acción | Plazo | Motivo |
|---|---|---|
| Pasar versiones vigentes a Standard-IA | 30 días | Es el mínimo de permanencia que cobra esa clase; moverlos antes no ahorra. |
| Pasar versiones vigentes a Glacier Flexible Retrieval | 120 días | Glacier cobra un mínimo de 90 días y la recuperación es lenta. Con 120 días los objetos pasan 90 días en Standard-IA antes de archivarse, cuando ya casi nadie los consulta; con 60 se archivarían demasiado pronto y con 240 seguirían pagando de más. |
| Eliminar versiones no actuales (sin conservar ninguna reciente) | 180 días | Seis meses bastan para notar un archivo sobrescrito o borrado por error; después la versión vieja solo suma costo sin dar protección. |

Según calculator.aws (US East, N. Virginia), el costo anual sin regla es de US$ 31,92 y con la regla de US$ 27,60, un ahorro de US$ 4,32 al año.

## Alternativas consideradas

- **Seguir publicando el frontend en Vercel.** Se descartó porque el objetivo del proyecto es migrar a AWS por fases; mantener el frontend afuera dejaría la infraestructura dividida entre dos plataformas y sin practicar la configuración real de S3.
- **Un solo bucket para todo.** Se descartó porque mezclaría archivos públicos con datos sensibles. Un error de configuración en el sitio podría exponer los documentos KYC, y habría que dar acceso a todo el bucket o definir permisos objeto por objeto.
- **No activar el versionado.** Se descartó porque un borrado o sobrescritura por error sería irrecuperable. Con el versionado, borrar solo crea un delete marker y las versiones previas se conservan, además de dejar un historial de cambios que sirve de auditoría.
- **Versionado sin regla de ciclo de vida.** Se descartó porque las versiones viejas se acumularían para siempre y los datos poco consultados seguirían en la clase más cara. Es la opción más costosa a largo plazo.
- **Dejar todo suelto en la raíz del bucket privado, sin prefijos.** Se descartó porque los permisos y las reglas de S3 se aplican por prefijo; sin ellos no se puede dar a cada rol solo lo que necesita ni aplicar una política distinta a cada tipo de dato.

## Consecuencias

### Positivas

- Los datos sensibles quedan aislados del sitio público: el bucket privado rechaza cualquier acceso anónimo y cada rol ve solo su prefijo.
- Un borrado o sobrescritura accidental se puede deshacer recuperando la versión anterior, en ambos buckets.
- La regla de ciclo de vida reduce el costo sin intervención manual y su ahorro crece con el volumen de datos.
- El sitio público es de solo lectura, por lo que nadie puede modificarlo desde fuera.

### Costos o desventajas que aceptamos

- El versionado consume espacio extra mientras las versiones viejas no se eliminan; es un costo bajo porque son pocos objetos y casi no cambian.
- Los objetos en Glacier tardan de minutos a horas en recuperarse, por lo que nada que se necesite de inmediato puede ir ahí.
- Con el volumen actual el ahorro es pequeño (US$ 4,32 al año): hoy el beneficio es más de orden y prevención que económico.
- El sitio se sirve por el endpoint de sitio web de S3, que usa HTTP y no HTTPS, a diferencia de Vercel, que lo daba por defecto.
- La regla `retencion-sitio` abarca todo el bucket del sitio, incluidos los archivos que el sitio web sirve. Un objeto en Glacier no se puede leer de inmediato, así que cualquier archivo del sitio que lleve 120 días sin volver a subirse dejaría de cargar.

### Qué habría que revisar más adelante

- Poner CloudFront delante del bucket del sitio para tener HTTPS y caché, en la siguiente fase de la migración.
- Limitar la transición a Glacier a un prefijo de archivo, o quitarla del bucket del sitio, para no archivar los archivos que el sitio sirve.
- Si los plazos de 30, 120 y 180 días siguen siendo adecuados cuando crezca el volumen de datos o cambien los requisitos de retención de los documentos KYC.
- Si el ahorro real en la factura coincide con la estimación de calculator.aws.
- Los permisos IAM por prefijo cada vez que entre una persona nueva al equipo.
