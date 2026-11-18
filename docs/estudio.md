# Configuración del estudio académico

CREA implementa un grupo de 36 restaurantes con un pretest y un postest de 18 preguntas cerradas. Los códigos disponibles van de `REST-CAJ-01` a `REST-CAJ-36`. El mismo instrumento se utiliza en ambas etapas. La base de código contiene solo datos sintéticos de prueba, limitados a las suites automatizadas.

## Activación controlada

1. En un proyecto autorizado, aplicar `firestore.rules` y habilitar los proveedores de Auth. Con Firebase Admin SDK y credenciales del entorno correspondiente, asignar `researcher: true` a los UID autorizados. La opción `admin: true` también concede acceso al estudio. Al asignar una claim, leer primero las existentes para conservarlas. Pedir al responsable que vuelva a iniciar sesión después del cambio. [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
2. El equipo de tesis debe suministrar el instrumento, consentimiento y rúbrica aprobados. En «Investigación», un investigador publica el JSON y confirma que corresponde al protocolo. La publicación fija una sola versión para el grupo.
3. Inscribir a cada restaurante con el UID de una cuenta de Firebase y un código disponible. El participante confirma su correo, acepta el consentimiento y completa el pretest.
4. Tras el uso de CREA, el investigador confirma la intervención e indica las secciones utilizadas. El postest se abre una vez registrada la intervención y desde un día calendario posterior al pretest en la zona horaria de Lima.
5. Cuando ambas respuestas están registradas, el investigador puede calificar el par con la clave aprobada y exportar el CSV por código. El CSV contiene código, versión, puntajes, diferencia y máximo. El tratamiento estadístico se realiza según el protocolo de tesis fuera de CREA.

## Esquema del instrumento

| Campo | Formato |
| --- | --- |
| `version`, `consentVersion` | Cadenas de 3 a 60 caracteres. Empiezan con letra o dígito y admiten letras, números, puntos, guiones y guiones bajos. |
| `validationDate` | Fecha ISO `AAAA-MM-DD` de la validación. |
| `consentText` | Texto aprobado, de 50 a 16 000 caracteres. |
| `scoringSummary` | Resumen de la rúbrica aprobada, de 5 a 1 500 caracteres. |
| `questions` | Exactamente 18 entradas en el orden aprobado. |
| `questions[].prompt` | Texto de la pregunta, hasta 1 500 caracteres. |
| `questions[].options` | Entre 2 y 6 opciones distintas, de hasta 550 caracteres cada una. |
| `questions[].correctIndex` | Índice de la opción correcta, con base cero. |
| `questions[].points` | Peso positivo del ítem, hasta 100. La puntuación suma los pesos de los aciertos. |

El esquema Zod está en `src/lib/research-engine.ts`. La API escribe en un lote atómico la versión activa, las preguntas sin soluciones y la clave privada. El navegador de un participante solo puede leer el instrumento de su inscripción y su propio progreso. Las reglas verifican las etapas, la longitud y el rango de las respuestas, y bloquean modificaciones de registros enviados.

## Colecciones y privacidad

| Colección | Uso |
| --- | --- |
| `research_enrollments` y `research_slots` | Vínculo restringido entre UID, código de restaurante y versión. |
| `research_study` y `research_instruments` | Versión activa e instrumento visible por inscripción. |
| `research_answer_keys` | Clave y pesos, accesibles al equipo de investigación. |
| `research_participant_consents` | Rol en el restaurante, versión aceptada y fecha del servidor. |
| `research_responses/{code}/stages` | Respuestas inmutables de pretest y postest. |
| `research_interventions` | Registro del equipo investigador y herramientas usadas. |
| `research_results` | Puntuaciones pseudonimizadas accesibles al equipo investigador. |
| `research_consents` y `research_evaluations` | Modelo histórico congelado. La lectura queda limitada al equipo investigador. |

Los códigos son seudónimos porque existe una inscripción que los vincula a un UID. La gestión de retiros, acceso de responsables, conservación y eliminación corresponde al protocolo aprobado. Los consentimientos anteriores quedan en el modelo histórico. Cada inscripción nueva debe registrar el consentimiento aprobado para su versión. Las pruebas usan exclusivamente proyectos `demo-*` y no deben ejecutarse sobre un conjunto real.
