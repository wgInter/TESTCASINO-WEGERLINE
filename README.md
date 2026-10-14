# TESTCASINO-WEGERLINE

Casa de apuestas deportivas y casino — proyecto de desarrollo.

## Integrantes

- HERNAN SANTIAGO ALVARINO = HSAR
- JOSÉ AGUSTÍN BARRANCO MUÑOZ = Jose
- JEAM PAUL SERNA SALGADO = Jeampul

## Tecnologías

- Backend: Node.js + Express
- Base de datos: Supabase (PostgreSQL)
- Frontend: HTML/CSS/JS vanilla
- Hosting: Vercel
- Datos deportivos: The Odds API

## Flujo de trabajo

- **MAIN**: Es la base es nuestra copia de seguridad, esto no se toca y solo se manda el merge cuando estemos seguro que todo tiene un funcionamiento optimo
- **MASTER**: En esta rama se hace el desploy de la pagina, Se hacen los testeos, tuvimos que ponerle master por comodidad a la hora de escoger la rama en vercel 
- **Dev**: Por medio de esta rama descargaremos y subiremos los avances de cada integrante, Aquí solo se manda el progreso de cada integrante si en tal caso surge un problema con tu rama tendrás un copia reciente del avance que se lleve, Aunque claro, a la hora de subir tus avances con merge tendrá que se aprobado o visualizado por algun colaborador, con esta labor minimizamos los errores

## Despliegue en AWS

| Integrante | URL del sitio | Bucket publico | Bucket privado |
|---|---|---|---|
| Hernán Santiago Alvarino | http://cuc-bp-alvarino-sitio-2026.s3-website-us-east-1.amazonaws.com/ | cuc-bp-alvarino-sitio-2026 | cuc-bp-alvarino-privado-2026 |
| José Agustín Barranco Muñoz | http://cuc-bp-barranco-sitio-2026.s3-website-us-east-1.amazonaws.com/ | cuc-bp-barranco-sitio-2026 | cuc-bp-barranco-privado-2026 |
| Jeam Paul Serna Salgado | http://cuc.bp-serna-sitio-2026.s3-website-us-east-1.amazonaws.com/ | cuc.bp-serna-sitio-2026 | cuc-bp-sernas-privado-2026 |

El front-end del proyecto dejó de publicarse en su plataforma de hosting anterior y pasó a Amazon S3 para empezar a migrar todo a infraestructura real de AWS, por fases. El bucket público aloja el sitio web estático y solo permite leer archivos (`s3:GetObject`), mientras que el bucket privado mantiene activado el bloqueo de acceso público y devuelve 403 (AccessDenied), lo que demuestra que lo que no se concede de forma explícita queda denegado.
