# NOTAS DEL PROYECTO — reparacion-cremallera-direccion.com

Web de BLACKDOG (Julián Márquez, taller de reparación de cremalleras y cajas de dirección hidráulica, Sevilla; recibe piezas de toda España).
Última actualización: **2026-11-17**. Este archivo es el punto de partida para continuar el trabajo.

> Aviso: Cloudflare Pages sirve todo lo que hay en el repositorio. Este archivo es público en `/NOTAS.md`
> (con cabecera `noindex`). **No escribir aquí contraseñas, claves, datos de clientes ni temas personales.**

---

## 1. Cómo está organizada la web

Sitio **estático** (HTML/CSS/JS planos, sin build ni backend). Cada carpeta con `index.html` es una URL.

| Ruta | Qué es |
|---|---|
| `index.html` | **Portada**. Es una "mini app" de pestañas: `page-inicio`, `page-sobremi`, `page-garantia`, `page-galeria` (se cambian con `nav('id')` y con el `#hash` de la URL). Contiene el formulario "Encuéntrala aquí" (`#encuentrala-home`), el círculo de % de relleno y la medición del formulario |
| `marcas/` | Listado de las 12 marcas |
| `casos-que-resuelvo/` | Página nueva con los casos reales |
| `cremallera-<marca>/` (12) | Una página por marca: alfa-romeo, audi, bmw, citroen, corvette, honda, jaguar, mercedes, mitsubishi, renault, toyota, volvo |
| `cremallera-<marca>/caso-<id>/` (22) | Un caso real por URL (generados, ver abajo) |
| `cremalleras-o-direcciones-hidraulicas/` | Página informativa (diferencias cremallera / caja). Fue de las que más clics trajo en Wix |
| `descatalogadas-sin-recambio/` | Página informativa de piezas descatalogadas |
| `css/style.css` | Estilos compartidos de TODAS las páginas |
| `css/nuevo-draft.css` | Estilos del rediseño (portada, marcas y casos lo cargan además de `style.css`). El nombre es histórico: ya NO es un borrador |
| `js/script.js` | JS compartido: animaciones, ayudas del formulario, `nav()`, eventos de contacto, scroll/tiempo |
| `img/`, `img/nuevo/`, `img/nuevo/videos/` | Imágenes y vídeos (4 vídeos de "holgura" en la portada) |
| `templates/caso.html` | Plantilla de las páginas de caso |
| `casos/casos.json` | Datos de los 22 casos (marca, modelo, referencia, fotos, textos…) |
| `sitemap.xml`, `robots.txt` | SEO. El sitemap tiene un bloque entre `<!-- CASOS:START -->` y `<!-- CASOS:END -->` que regenera el script de casos |
| `_redirects` | 301 de las URLs viejas de Wix y de `/nuevo/*` |
| `_headers` | Cabeceras (caché larga en css/js/img; HTML siempre revalidado) |

**Scripts (`scripts/`, PowerShell, ejecutar con `powershell -ExecutionPolicy Bypass -File …`):**
- `auditoria-web.ps1` — **revisa las 39 páginas**: título/h1/descripción únicos, canonical, `noindex`, JSON-LD válido, enlaces/imágenes/anclas, sitemap, GTM/GA4/Clarity. Debe decir `PROBLEMAS: 0`.
- `static-server.ps1` — servidor local en `http://localhost:8123/` (sin caché) para probar antes de publicar.
- `generar-casos.ps1` — genera las páginas de caso desde `casos.json` + plantilla, regenera las tarjetas de cada marca y el bloque del sitemap.
- `bump-version.ps1` — cambia el `?v=` de `style.css` y `script.js` en todas las páginas (obligatorio tras tocar CSS/JS: la caché es de 1 año).
- `watermark-bake.ps1` — incrusta el logo en fotos "crudas".

**Medición:** GTM `GTM-53VWX8G`, GA4 `G-26M8MHTW9L`, Microsoft Clarity `y589jke8p8` (en todas las páginas). Los clics a WhatsApp/teléfono se miden desde GTM y `script.js`.

**Formulario "Encuéntrala aquí":** 4 pasos (identificar la pieza → síntoma → fotos/observaciones → contacto). El envío va a Web3Forms (te llega por correo); si hay fotos, abre WhatsApp con el texto ya escrito. Evento de envío en GA4: `form_submit`.
Medición del embudo (publicada 17-nov, sin datos personales): `form_inicio`, `form_paso_2/3/4`, `form_progreso_25/50/75/100`, `form_abandono`, `form_abandono_a_whatsapp`, `form_abandono_a_llamada`, `form_vuelve`. **Abandonos reales ≈ abandono* − form_vuelve.**

---

## 2. Qué se cambió en el rediseño y por qué

- **Qué:** portada, `/marcas/` y `/casos-que-resuelvo/` con diseño nuevo (portada mucho más ligera: ~3.500 palabras en vez de ~10.500; el contenido largo vive en páginas propias). Antes eso estaba como borrador en `/nuevo/`.
- **Por qué:** portada menos recargada ("que el visitante navegue si quiere"), mejores recorridos hacia marcas y casos reales, y mejorar conversión (WhatsApp es ~85 % de los contactos).
- **Decisión de SEO:** se publicó con el **título, descripción y etiquetas og/twitter de la portada antigua** ("… Desde 135€ · BLACKDOG") para no cambiar SEO y diseño a la vez. El título sin precio se probará aparte, más adelante.
- **Correcciones que hubo que hacer al publicar (lección):** 74+74 enlaces de las 34 páginas de marca/caso apuntaban a secciones de la portada que ya no existían (`/#encuentrala`, `/#trabajos`) → ahora `/#encuentrala-home` y `/casos-que-resuelvo/`. Y se arregló en `script.js` que `/#encuentrala-home` desde otra página dejaba la portada arriba en vez de bajar al formulario. **Si se vuelve a quitar o renombrar una sección de la portada, buscar quién enlaza a ella en TODAS las páginas** (la auditoría lo detecta).
- **Pendiente de ese rediseño:** 3 preguntas frecuentes de la portada antigua quedaron fuera de toda la web (ver pendientes).

---

## 3. Cómo se publica

- **Alojamiento:** Cloudflare Pages, conectado al repositorio de GitHub `julianmmblacky-debug/blackdog-web`, rama **`main`**. Cada push a `main` se publica solo (~45 s).
- **Dominio:** `www.reparacion-cremallera-direccion.com`. **El DNS sigue en Wix** (`ns2/ns3.wixdns.net`): ver pendientes.
- **Flujo seguro (el que se ha usado):**
  1. `git checkout -b nombre-del-cambio`
  2. Hacer el cambio. Si son casos: `scripts\generar-casos.ps1`. Si se tocó CSS/JS: `scripts\bump-version.ps1`.
  3. `scripts\auditoria-web.ps1` → exigir **`PROBLEMAS: 0`**.
  4. `scripts\static-server.ps1` y probar en el navegador (móvil y escritorio, enlaces, formulario). Para probar eventos sin ensuciar GA4, sustituir `gtag`/`clarity`/`fetch` por simulaciones.
  5. `git add …` + `git commit`.
  6. `git checkout main && git merge --ff-only nombre-del-cambio && git push origin main`
  7. Esperar ~45 s y verificar en producción con `curl` (códigos 200, título, redirecciones, `noindex` ausente).
- Los HTML se revalidan siempre; CSS/JS/imágenes tienen caché de 1 año (por eso el `?v=`).
- **Local:** Windows, PowerShell. Los ficheros son UTF-8 **sin BOM** (escribir siempre por .NET, no con `Set-Content` de PowerShell 5.1).

---

## 3b. Reglas de trabajo con Julián

- **Portada ligera.** No volver a meter contenido largo (p. ej. FAQs) en la portada: ponerlo en una página propia o en un desplegable de otra página.
- **Cero errores.** Auditar TODAS las páginas antes de publicar, probar en navegador y verificar en producción. Mostrarle cómo queda antes de publicar.
- **Explicar sin jerga**, con opciones numeradas y reconociendo errores en cuanto se detectan.
- La insistencia en que **"no soy el más barato"** es un filtro de clientes **intencional**: no consolidarla ni reducirla sin confirmarlo.
- Pre-asesorar al cliente: no recortar contenido útil; usar desplegables.

---

## 4. Pendientes

**Los que quedaron al publicar:**
1. **Indexación en Search Console:** quedan **13 casos** sin pedir (Alfa Spider, Audi ×2, Citroën, Honda Accord, Jaguar ×3, Renault, Toyota, Volvo ×2, Mitsubishi Montero). El límite es ~10 solicitudes al día. Revisar en 1–2 semanas si baja la cifra de "Descubierta: actualmente sin indexar" (eran 21).
2. **Resultado de la validación** de los 3 "Error de redirección" (iniciada el 17-nov; tarda hasta ~2 semanas).
3. **3 preguntas frecuentes** que desaparecieron: "¿Qué pasa si no limpio el circuito de dirección tras una reparación?", "¿Cómo hay que embalar la cremallera para enviarla?" y "¿Por qué la dirección se pone dura después de reparar la cremallera?". Recuperarlas **en otra página** (candidata: `/cremalleras-o-direcciones-hidraulicas/`, hoy enlazada solo desde Toyota), no en la portada.
4. **Mejorar las páginas de BMW y Mercedes** (son las marcas más pedidas por WhatsApp pero con 3 y 5 clics de Google): título por modelo/chasis (BMW E46/E39/E90, dirección activa; Mercedes W205 Servotronic, W107, Sprinter), más casos reales.
5. **Analizar en GA4 y Clarity qué marcas pulsan dentro de la web y qué ven.** Desde Google casi nadie busca por marca (92 impresiones y 0 clics en 16 meses): entran por búsquedas generales y eligen la marca dentro.
6. **Montar el embudo del formulario en GA4** (Explorar → Exploración de embudo: `form_inicio` → `form_paso_2` → `form_paso_3` → `form_paso_4` → `form_submit`) cuando haya datos (1–2 días) y ver en Clarity las grabaciones con `form_abandono`.
7. **Wix y DNS.** Mover el DNS a Cloudflare (o transferir el dominio) **antes** de cancelar Wix, o se cae el `www`. Además el dominio **sin `www` está roto** (apunta a servidores de Wix con el certificado HTTPS caducado): se arregla añadiéndolo en Pages con redirección al `www`. Falta saber qué paga exactamente a Wix (plan del sitio, dominio, correo), dónde está registrado el dominio y cuándo renueva. No hay registros MX (el dominio no usa correo propio).
8. **Probar el título sin precio** de la portada, como cambio aparte y midiendo (la búsqueda "reparar cremallera de dirección precio" trae clics).
9. **Decisión suya pendiente:** qué hacer con "Precio orientativo 135€–350€" en la lista de la portada.
10. **Archivos internos servidos en público** (`scripts/`, `casos/casos.json`, `_redirects`, `_headers`, este archivo): no es grave, pero se puede evitar usando una carpeta de salida separada en Pages. Hoy solo `NOTAS.md` lleva `noindex`.

**Aplazados por Julián anteriormente (no proponer por iniciativa propia):**
- Verificar la ficha de Google Business Profile (no se ha comprobado si está verificada).
- Banner de consentimiento de cookies + política de privacidad (GA4/Clarity cargan sin consentimiento previo; decisión consciente suya).
- Biblioteca de casos por referencia de pieza (documentación continua, caso a caso).
- Registrar la marca "Blackdog", conseguir enlaces externos, páginas por sistema-nicho (dirección activa BMW, LHM Citroën…).
- Hoja propia de clientes nuevos para medir la calidad del cliente.

---

## 5. Cifras de referencia de Search Console (datos hasta el 14-nov-2026, vistos el 17-nov)

| Periodo | Clics | Impresiones | CTR | Posición media |
|---|---|---|---|---|
| Antes de migrar (18 may–17 ago) | 173 | 5.460 | 3,2 % | 11,8 |
| 3 meses desde la migración (15 ago–14 nov) | 331 | 7,65 mil | 4,3 % | 8,7 |
| **Últimos 28 días (18 oct–14 nov)** | **108** | **2,51 mil** | **4,3 %** | **7,7** |

- ≈ **3,9 clics al día**. La **portada es el 84 %** de los clics (278 de 331).
- Búsquedas principales (posición): "reparacion cremalleras de direccion" 18 clics (5,5); "reparacion de cremalleras de direccion" 14 (7,8); "reparar cremallera de dirección precio" 10 (7,1); "reparación cremallera dirección" 7 (6,1); "reparar cremallera dirección" 6 (3,9).
- Indexación (informe del 13-nov): **17 indexadas / 39 no**: 21 "Descubierta sin indexar" (18 casos + Mitsubishi + `/descatalogadas-sin-recambio/` + `/marcas/`), 15 redirecciones de Wix (normales) y 3 errores de redirección ya corregidos.
- Sitemap reenviado el 17-nov (39 páginas).

**Qué vigilar:** comparar **a las 4 semanas (~15-dic-2026)** con el mismo corte de 28 días. **Alarma** si la posición media pasa de **9** de forma sostenida, o si los clics bajan de **~3 al día** durante dos semanas seguidas → valorar volver atrás. Una variación de unas décimas es normal. Mirar también: indexados subiendo, clics en "dirección hidráulica" / "caja de dirección" (muchas impresiones, casi sin clic), y el embudo del formulario.

---

## 6. Cómo volver atrás

- **Etiqueta de GitHub `pre-rediseno-2026-11-17`**: el estado exacto de la web antes del rediseño (commit `b6bbb6b`).
- **Rama `rediseno-nuevo`**: el borrador tal como estaba antes de publicarse.
- **Copia de seguridad completa (con historial git):** `C:\Users\Julian Marquez\Desktop\backup_blackdog_2026-11-17.zip`.
- **Deshacer el rediseño en producción** (crea commits nuevos, no borra historia):
  ```
  git checkout main
  git revert --no-commit pre-rediseno-2026-11-17..HEAD
  git commit -m "revert: volver a la web anterior al rediseño"
  git push origin main
  ```
  Esto también deshace todo lo posterior (medición del formulario, NOTAS.md…). Para deshacer solo un cambio concreto: `git revert <commit>` (ver `git log --oneline`).
- Commits del rediseño: `1b28b2f` (borrador) → `413645f` (publicación) → `f3ab7bc` (título, enlaces y anclas) → `442dff9` (medición del formulario).
