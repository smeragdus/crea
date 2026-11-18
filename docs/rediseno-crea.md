# Rediseño de CREA

## Auditoría de la línea base

Se inspeccionó el commit `a03c24c` y se abrió el [sitio publicado](https://crea.stelflux.com/) mediante Chromium, en sesión pública. El inicio mostraba ocho secciones simultáneas, un simulador con datos precargados y cálculos paralelos a los del motor. La evaluación y el panel concentraban datos, reglas visuales y almacenamiento en componentes grandes. El módulo de investigación usaba plantillas de 20 ítems y persistía registros en el navegador. La consola administrativa confiaba en valores fijos y en flags de sesión del cliente. Las reglas permitían el acceso general a evaluaciones académicas para cualquier usuario autenticado.

En el entorno inicial, pnpm 11 detuvo la instalación al detectar scripts de dependencias sin decisión registrada. Se usó la instalación de pnpm existente porque `corepack enable` no pudo escribir el shim global de Windows. Con las dependencias descargadas, la línea base pasó 18 pruebas. ESLint informó 5 errores. Next compiló y exportó 19 páginas con Webpack en la copia de auditoría. Turbopack rechazó el enlace de dependencias compartidas entre esa copia y el repositorio de trabajo.

## Arquitectura

La navegación pública tiene tres destinos principales. «Mi espacio» agrupa diagnóstico, simulación, obligaciones, reportes, guías y Crea IA. Se preservaron las rutas públicas y los accesos por `?seccion=`. Los enlaces anteriores `/negocios/{id}/ruta` se resuelven con la reescritura de Firebase Hosting y requieren el UID propietario para consultar la ficha.

```text
Rutas Next.js → componentes de la funcionalidad → esquema y contexto
                                               → RuleEngine + catálogo
                                               → resultados, documentos y guías
               adaptadores Firebase → Auth + Firestore + reglas de seguridad
```

El flujo de evaluación conserva un contexto durante la sesión. El diagnóstico y el informe comparten el mismo resultado del motor. Las evaluaciones se guardan por UID en Firestore desde una cuenta identificada. El simulador opera sobre importes de un mes, con sus propios supuestos explícitos. El navegador puede recuperar un registro anterior disponible en esa sesión de invitado o en el almacenamiento asociado a un correo verificado.

Se usa una arquitectura de funcionalidades dentro del App Router. Las primitivas de presentación viven en `components/ui`, las funciones de dominio independientes de React siguen en `lib` y el código de Firestore se concentra en adaptadores. Se evita así un traslado masivo de módulos cuyo interfaz y pruebas todavía sirven.

## Sistema visual

Los tokens de `src/app/globals.css` cubren fondo crema, superficies blancas, verde oliva para las acciones y salvia para las áreas destacadas. Nunito Variable se sirve localmente y se usa en títulos, textos y controles. La portada presenta la evaluación con un titular directo y el asistente muestra un indicador de progreso compacto en móvil. La portada usa una escena ilustrativa generada y comprimida a WebP. Los iconos son Lucide.

El conjunto shadcn/ui se adapta al proyecto con Base UI para botones, CVA para variantes y Tailwind. `Button` ejecuta acciones y `LinkButton` conserva la semántica de enlace. `Card` dispone superficies de contenido. `Field` asocia etiquetas, ayuda y errores. Los grupos de opciones usan radios nativos y los selectores conservan el comportamiento del sistema en móviles. `Notice` comunica estados y `SourceLink` abre una fuente oficial identificable. Los errores relevantes se anuncian y el asistente enfoca el título al cambiar de paso.

Se eligió Zod para validar importes y la carga académica. Los formularios usan el estado de React y las APIs del navegador. El feedback permanece junto a la acción. Las transiciones son CSS y las comparaciones son textuales, para mantener baja la complejidad y respetar la preferencia de movimiento reducido. [Guía consultada para seleccionar bibliotecas](https://www.ui-skills.com/skills/emilkowalski/pick-ui-library) · [Primitivas de shadcn/ui](https://ui.shadcn.com/docs/components/base/button)

## Decisiones tributarias

| Dato | Cambio y referencia |
| --- | --- |
| UIT 2026 | S/ 5 500. El tope RMT de 1 700 UIT equivale a S/ 9 350 000. [MEF](https://www.gob.pe/institucion/mef/noticias/1314665-mef-establece-en-s-5500-el-valor-de-la-uit-para-el-ano-2026) |
| NRUS, RER, RMT, RG | El motor central aplica límites, restricciones y datos faltantes. El asistente distingue los totales anuales de los meses de mayor actividad. [SUNAT](https://www.gob.pe/institucion/sunat/pages/280-regimenes-tributarios) |
| Tasa especial de restaurantes MYPE | 10,5 % combinado para 2026, cuando corresponda. El simulador usa 18 % por defecto y permite informar el crédito fiscal de compras. [SUNAT](https://orientacion.sunat.gob.pe/reduccion-del-igv-para-restaurantes-hoteles-y-alojamiento-turisticos-1) |
| Calendario | Los doce periodos de 2026 usan el anexo de la R.S. 281-2022/SUNAT. Marzo con RUC terminado en 2 o 3 vence el 21/04/2026. La pantalla enlaza las prórrogas por distrito. [SUNAT](https://www.sunat.gob.pe/orientacion/cronogramas/2026/cObligacionMensual2026.html) |

La versión del catálogo para el rediseño es `2026.3-RESTAURANTES-CAJ`. Las conclusiones cubren las condiciones modeladas para restaurantes y servicios de comida para eventos. La simulación usa el 1,5 % como supuesto mínimo para anticipos en RG y en RMT sobre 300 UIT. El coeficiente particular y las reglas de acogimiento pueden requerir revisión. Se reemplazaron enlaces heredados que respondían con error por guías y documentos oficiales accesibles. El informe deja constancia de fecha, parámetros, compatibilidad, tareas, enlaces y versión. Se exporta vía impresión nativa del navegador en formato A4.

## Gobierno normativo y académico

Las claims `admin: true` y `researcher: true` se emiten desde Firebase Admin SDK. La primera autoriza revisar reglas y fuentes. La segunda autoriza gestionar el estudio. Un administrador también puede acceder a él. Crear un perfil `users` con un campo de rol no concede acceso. Las propuestas del catálogo tienen autor, fecha, fuente y estado. Una revisión aprobada se incorpora a una nueva versión del motor mediante una publicación normal de código y pruebas. Esto permite reproducir qué catálogo evaluó cada informe.

La investigación se documenta en [Configuración del estudio](estudio.md). El modelo protege consentimientos, respuestas, intervenciones y resultados mediante colecciones separadas y comprobaciones por rol y UID.

## Mapa de cambios

- `src/app`, `src/components/layout` y `src/components/ui` contienen la portada, shell común, rutas nuevas y las primitivas compartidas.
- `src/features/evaluation` y `src/features/workspace` sustituyen al asistente y al panel anteriores con funcionalidades independientes.
- `src/features/auth`, `src/features/admin` y `src/features/research` sustituyen las puertas de acceso locales y el flujo académico anterior.
- `src/lib/tax-constants.ts`, `rule-engine.ts`, `seed-catalog.ts`, `tax-simulator.ts`, `sunat-calendar.ts`, `report-generator.ts` y `research-engine.ts` contienen los cambios de dominio.
- `src/lib/firebase`, `firebase.json` y `firestore.rules` aplican almacenamiento y aislamiento. Las configuraciones de Vitest y Playwright añaden verificaciones reproducibles.

## Verificación de la rama

| Verificación | Resultado |
| --- | --- |
| Instalación congelada, TypeScript y ESLint | Completaron correctamente. |
| Compilación de producción | Next exportó 20 páginas estáticas a `out/`. |
| Vitest | 22 pruebas para el motor, el asistente, el calendario, la simulación, las guías y el instrumento. |
| Reglas de Firestore | 3 casos de integración en el emulador. Cubren propiedad de evaluaciones, privilegios administrativos e integridad del flujo académico. |
| Navegador | 9 recorridos en 1440, 820 y 390 píxeles. Incluyen validación, edición, datos faltantes, fecha de SUNAT, checklist, formato de impresión, teclado y verificaciones axe. |
| Auth y Firestore en navegador | 1 recorrido de integración local, desde registro y persistencia hasta publicar el instrumento, completar el estudio y exportar el CSV. |
| Hosting local | Respuesta HTTP 200 para portada, comparador, asistente, administración, investigación y ruta histórica por ID. |

Las verificaciones axe se ejecutaron con las etiquetas de WCAG 2.0, 2.1 y 2.2 aplicables a A/AA. La cobertura automatizada complementa la comprobación manual de teclado, diseño y lectura del PDF.

## Preparación para producción

1. Validar las variables web y los proveedores de Firebase en un proyecto de prueba y provisionar las claims de los responsables. Aplicar las reglas antes de exponer las secciones protegidas.
2. Revisar los registros académicos antiguos bajo autorización. Su estructura y plantilla de 20 preguntas requieren una revisión metodológica y una decisión de conservación independiente.
3. Obtener el instrumento, la rúbrica y el consentimiento aprobados para el estudio. Publicar el archivo solo después de ensayar el proceso con el equipo investigador.
4. Verificar el dominio de Auth, la acción de recuperación de correo y Google Sign-In en el entorno autorizado. Confirmar prórrogas tributarias y la vigencia de fuentes en cada actualización normativa.
