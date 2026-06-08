# Otzar HaChochma — Análisis técnico y plan de búsqueda mejorada

_Investigación hecha sobre `tablet.otzar.org` con la sesión suscrita de Saleh (4 jun 2026)._

---

## 1. Resumen ejecutivo

**¿Hay API?** Sí. El sitio NO tiene API pública documentada, pero internamente corre sobre una API REST limpia (`/api/...`) **más** un canal de búsqueda en tiempo real por **Socket.IO (WebSocket)**. Todo es accesible desde la propia página ya logueada.

**¿Se puede mejorar la búsqueda?** Sí, mucho — pero la clave es entender el problema real:

> El motor de Otzar es potente (full-text OCR con operadores). Lo que falta no es potencia de búsqueda, sino **descubrimiento**: hoy solo encuentras un libro si ya lo conocías. No hay forma de *explorar* el mar de 147,000 libros para que emerjan ideas, autores o fuentes que no sabías que existían.

**Verdicto de factibilidad:** la forma correcta de construir esto es una **capa que vive dentro de la sesión del usuario** (extensión de navegador / userscript) que reutiliza el socket y la REST ya autenticados. Una app 100% independiente que se loguee sola es posible pero frágil y chocaría con los términos; la extensión hace exactamente las mismas llamadas que el sitio ya hace, con tu propia cuenta.

---

## 2. Cómo funciona la búsqueda hoy

Del manual (60 pp.) hay dos búsquedas distintas:

**a) Búsqueda por Libro/Autor** (metadatos): título, autor, tema, año. Búsqueda avanzada por campos.

**b) Búsqueda de Contenido** (full-text OCR) — el motor real, con operadores:

| Opción | Símbolo | Qué hace |
|---|---|---|
| Palabras exactas | `-` entre palabras | sin letras intermedias |
| Prefijos | `+` antes | incluye ב ד ה ו כ ל מ ש |
| Mantener orden | `&` antes | en el orden tecleado |
| Distancia | `{n}` | máx. n palabras entre términos (def. 30) |
| Palabras similares | (panel) | sinónimos/variantes definidas |
| Acrónimos | (panel) | ej. אע"פ |
| Excluir | `--` antes | quita resultados |
| Comodín | `*` `?` `!` | letras desconocidas |
| Correcciones OCR | `#` | errores típicos de OCR |
| Ktiv malé/jaser | `@` | ortografía plena/defectiva |

**El límite real** no es el motor, es el acceso: buscas un repositorio a la vez, el resultado es una lista de páginas-imagen, no puedes exportar, ni cruzar búsquedas, ni explorar por tema/época/autor de forma agregada. Ejemplo medido: `ירושלים` → **2,429,187 resultados en 115,056 libros**. Imposible de *explorar* con la UI actual.

---

## 3. Arquitectura técnica descubierta

### 3.1 REST API — base `https://tablet.otzar.org/api/`
Autenticada por cookie de sesión. Endpoints relevantes confirmados:

**Contenido / libros**
- `GET /api/books/data/{bookId}` — metadatos del libro
- `GET /api/books/info`, `/api/books/index`, `/api/books/booklist/…`, `/api/books/nbt`, `/api/books/pdfList`
- `GET /api/books/pageName/…`, `/api/books/pageid/…`
- `GET /api/images/{bookId}/{pageId}?resize=1500` — imagen de página (JPG)
- `GET /api/freesearch/words/search/{token}/{start}/{end}/{bookId}` — posiciones de los hits dentro de un libro para un search-token

**Catálogo / descubrimiento**
- `GET /api/authors`, `/api/authors/user`, `/api/user/authors`
- `GET /api/categories/yesod`, `/api/categories/filter`, `/api/categorytypes`
- `GET /api/customBook/…` (libros propios del usuario)

**Usuario / sesión**
- `/api/user/connectUser`, `/api/user/bootstrap`, `/api/user/settings`, `/api/user/extraInfo`
- `/api/user/markedlists`, `/api/userlists/favorites`, `/api/user/desktops`, `/api/user/recentbooks`
- `/api/history` (GET/POST/PATCH) — historial de búsquedas
- `/api/usage/status`, `/api/general/basic-info`, `/api/general/get_ver`

### 3.2 Búsqueda = Socket.IO (tiempo real)
La búsqueda de contenido **no** es HTTP: se emite por un socket y los resultados llegan en streaming (por eso aparece "Loading… Stop" y un contador que sube). Contrato observado en el bundle:

```js
socket.emit("freesearch", {
  txt: JSON.stringify(terms),  // términos + opciones de búsqueda
  books: f,                    // alcance (ids o "todos")
  searchType: p,               // "classic" (u otros, ej. meforshim)
  book: i, tabId: a,
  userId, historyId, historyMainId
});
socket.emit("stopFreesearch"); // cancelar
socket.emit("setUserSocket", {connectionType: "otzar"|"mef"|"both"}); // sesión
```

**Alcances de búsqueda** (`enumSearchInType`): `all`, `selected`, `inMeforesh`, `browse`, `currentList`, `tsiyunim`, `custom`.
**Tipos** (`searchType`): `classic` (+ modo Meforshei HaOtzar).

### 3.3 Front-end = Vue 2 + Vuex (accesible desde la página)
`document.querySelector('#app').__vue__.$store` da acceso a todo el estado: módulos `freeSearch` (searchStr, searchProgress, searching, searchType…), `bookList` (`currentListLength: 147275`), `books`, `authors`, `user`, `history`, etc. **Esto significa que una extensión puede disparar búsquedas y cosechar resultados directamente del store, sin reimplementar el protocolo.**

---

## 4. Qué se puede construir (la capa de descubrimiento)

Reutilizando socket + REST + store, en orden de valor:

1. **Power Search + Export** — una búsqueda, cosechar la lista completa de libros con conteos, ordenar/filtrar, exportar a CSV/JSON/Markdown (ideal para Obsidian). Lo que hoy es imposible.
2. **Filtros agregados** — cruzar el texto con categoría, autor, época/generación y año (vía `/api/categories` y `/api/authors`). "¿En qué tipo de libros y de qué siglos aparece este concepto?"
3. **Modo descubrimiento** — agrupar los resultados por categoría / autor / siglo para revelar *dónde vive* una idea y qué fuentes inesperadas la tratan. Sugerir autores y obras adyacentes.
4. **Resúmenes con IA** — tomar el OCR de los mejores resultados y que la IA resuma qué dice cada fuente sobre tu tema (acelera el armado de mareh mekomot para ElevAlma).
5. **Guardar y organizar** — colecciones de búsquedas y hallazgos por proyecto/parashá, exportables a Obsidian.

---

## 5. Consideraciones legales / Términos

- La herramienta usa **tu propia suscripción y sesión**, haciendo las mismas llamadas que el sitio ya hace. No comparte credenciales ni evade el pago.
- Respeta límites de uso (sin ráfagas masivas; el socket de Otzar ya regula el ritmo).
- **No** redistribuye imágenes ni texto OCR de los libros (material con copyright). Exporta *referencias* (libro, autor, página, link) y, para uso personal, snippets cortos.
- La versión por USB encriptado (Windows) es un producto cerrado aparte; el punto de integración es la suscripción online.

---

## 6. Plan recomendado

- **Fase 1 (MVP):** userscript/extensión "Otzar Power Search" inyectado en `tablet.otzar.org`: panel propio, búsqueda → cosecha de resultados → filtros + orden + export (CSV/JSON/MD). Compartible vía Tampermonkey.
- **Fase 2:** modo descubrimiento (agregación por categoría/autor/siglo) + guardar colecciones.
- **Fase 3:** resúmenes con IA de los OCR top.
- **Fase 4 (opcional):** empaquetar como extensión Chrome pulida para distribuir a otros suscriptores.

---

## 7. Receta de implementación (verificada en vivo)

Todo esto se probó contra tu sesión real (búsqueda `אברהם אבינו` → 77,667 libros / 773,452 menciones).

**Cosechar la lista completa de resultados** (sin tocar el DOM virtualizado):
```js
const vm = document.querySelector('#app').__vue__;
const fs = vm.$pinia._s.get('freeSearchBookList-main');
const list = fs.getCurrentListIds;   // [{book, results, start, end, files:[...]}] — TODOS los libros con hits
const term = fs.finalTextSearch;     // texto buscado
```

**Resolver metadatos de cada libro** (catálogo client-side, ~93–97% de cobertura inmediata):
```js
const m = vm.$store.getters['books/getBookbyId'](id);
// m.name, m.authors_0_name, m.authors_0_period, m.places, m.fromyear, m.toyear, m.pubYearValue, m.dorotSort
```

**Época (dor)** — `authors_0_period` es **1-indexado** sobre `fs.dorot`:
| period | época (dorot[period-1]) |
|---|---|
| 1 | מקרא וחז"ל |
| 2 | ראשונים וקדמונים |
| 3 | אחרונים ש-ת"ר |
| 4 | אחרונים ת"ר-ת"ש |
| 5 | אחרוני זמנינו |
| 6 | אחרים |

Verificado: רש"י y רמב"ם → period 2 (ראשונים); ב"י יוסף קארו → 3; חפץ חיים → 4. _Ojo:_ la época refleja la **época del autor/fuente**, no el año de impresión de la edición (ese está en `toyear`/`pubYearValue`).

**Distribución por época medida** (`אברהם אבינו`, 72,376 libros resueltos): מקרא וחז"ל 778 · ראשונים 2,318 · אחרונים ש-ת"ר 6,669 · אחרונים ת"ר-ת"ש 8,745 · אחרוני זמנינו 50,815 · אחרים 3,051.

**Texto OCR (confirmado extraíble):** la app muestra el OCR de una selección en el popup `OcrPopup` vía la prop `ocrText`. Endpoints relacionados: `POST /api/freesearch/coords` `{bookId, pageId, words:[ids], margin, webP}` → cajas (bounding boxes) de esas palabras; el modelo de página trae `firstWord`/`numWords` y `pages[i].words` (ids de palabras por página). Cablear la extracción OCR → resúmenes con IA es la **Fase 2/3**.

**Disparar búsqueda programática:** método de componente `doFreeSearch(text, books, ...)`, o sobre el socket `socket.emit("freesearch", {txt, books, searchType, ...})`. El userscript v0.1 maneja el input nativo y, si no lo encuentra, usa el botón "Cosechar" sobre la búsqueda que ya hiciste.

**Estado:** Fase 1 + v0.2 (Power Search + Discovery: mapa por época/siglo, outliers, relacionadas, cruce A∩B, export CSV) construidas y verificadas en vivo → `otzar-power-search.user.js` / `otzar-bookmarklet.txt`.

---

## 8. Texto OCR y resúmenes con IA (hallazgos)

- **No hay endpoint de texto OCR en bloque.** El config `BooksDB` expone `freesearch` con subrutas `/words`, `/gzirim`, `/coords`, `/byPos` — ninguna devuelve texto. `coords` devuelve cajas (bounding boxes); `words/search/{token}/{start}/{end}/{book}` devuelve **IDs de palabras** (ej. `[140402,140418,140419]`), no texto.
- **El OCR de selección es client-side (WASM).** Al recortar un rectángulo, el front dibuja la región en un canvas y emite `toggleocr`; el bundle incluye código Emscripten/WASM. Es decir, el texto se reconoce en el navegador, no se descarga de un endpoint → no es cosechable en bloque de forma directa.
- **Mapeo resultado → página:** cada resultado trae `files:[{filename, start, end}]` donde `filename` = **token de búsqueda** y `start/end` = rango de palabras. Para llegar a la imagen de la página hay que encadenar: `words/search(token,start,end,book)` → wordIds → ubicar la página (con `pagedata.firstWord/numWords` del libro) → `GET /api/images/{book}/{pageId}`.

**Camino recomendado para "resúmenes IA":** alimentar las **imágenes de página** de los mejores resultados a un modelo con visión (Claude), que lee el hebreo directamente — evita pelear con el OCR-WASM de Otzar. Opciones de entrega:
1. **En la página, con tu API key** (automático): el userscript arma el chain hit→imagen, manda la imagen a Claude vision y muestra el resumen. Requiere pegar tu clave.
2. **Export a Cowork** (sin key): el tool exporta las imágenes/los datos de los top N y los traes aquí; yo los leo y sintetizo.
3. **Síntesis disponible HOY (sin OCR):** exportas el CSV de una búsqueda de descubrimiento y aquí en Cowork sintetizo el panorama de fuentes (qué autores/épocas/obras tratan el tema) combinando tus resultados con conocimiento de esos seforim. No cita el texto exacto de la página, pero ya acelera el armado de mareh mekomot.
