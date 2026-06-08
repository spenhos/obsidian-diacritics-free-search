<div align="center">

# ✨ Diacritics-Free Search

**Busca y reemplaza texto ignorando marcas diacríticas en Obsidian**

Nikud hebreo · Tashkil árabe · Acentos latinos · Griego politónico · Cualquier marca combinante Unicode

[![GitHub release](https://img.shields.io/github/v/release/spenhos/obsidian-diacritics-free-search?style=flat-square)](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)

🌐 [English](./README.md) | Español | [עברית](./README_he.md)

---

</div>

## El Problema

Si tus notas contienen hebreo vocalizado como **בְּרֵאשִׁית**, al buscar **בראשית** (solo consonantes) no lo encuentra. Lo mismo pasa con **café** vs **cafe**, árabe **بِسْمِ** vs **بسم**, y cualquier otra marca diacrítica.

**Diacritics-Free Search** resuelve esto haciendo que todos los diacríticos sean transparentes durante la búsqueda — escribe sin marcas y encuentra texto que sí las tiene.

```
Búsqueda:    בראשית        →  Encuentra:  בְּרֵאשִׁית ✓
Búsqueda:    cafe           →  Encuentra:  café ✓
Búsqueda:    بسم            →  Encuentra:  بِسْمِ ✓
```

---

## Funcionalidades

### 🔍 Búsqueda Local — Buscar y Reemplazar en la Nota Activa

<table>
<tr>
<td width="120"><strong>Atajo</strong></td>
<td><kbd>Option</kbd> + <kbd>F</kbd> <em>(sugerido — asígnalo en Ajustes → Atajos de teclado)</em></td>
</tr>
<tr>
<td><strong>Comportamiento</strong></td>
<td>Abre una barra de búsqueda en la parte superior de la nota (estilo Chrome)</td>
</tr>
</table>

**Capacidades:**

- **Resaltado en tiempo real** — Todas las coincidencias se marcan en amarillo; la actual en naranja
- **Navegación entre coincidencias** — Usa los botones ▲▼ o <kbd>Enter</kbd> / <kbd>Shift+Enter</kbd> para saltar entre resultados
- **Marcadores en la barra de desplazamiento** — Puntos amarillos en el costado derecho muestran dónde están las coincidencias (¡son clickeables!)
- **Reemplazar uno / Reemplazar todo** — Reemplaza la coincidencia actual o todas de un golpe
- **Toggle de mayúsculas/minúsculas** — Click en "Aa" para activar/desactivar sensibilidad a mayúsculas
- **Recuerda la última búsqueda** — Al reabrir la barra, tu búsqueda anterior sigue ahí
- **Escape para cerrar** — Presiona <kbd>Esc</kbd> desde cualquier lugar (incluso mientras editas) para cerrar la barra

---

### 🌐 Búsqueda Global — Buscar en Todo el Vault

<table>
<tr>
<td width="120"><strong>Atajo</strong></td>
<td><kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> <em>(sugerido — asígnalo en Ajustes → Atajos de teclado)</em></td>
</tr>
<tr>
<td><strong>Comportamiento</strong></td>
<td>Abre un modal para buscar en todos los archivos markdown del vault</td>
</tr>
</table>

**Capacidades:**

- **Búsqueda en todo el vault** — Escanea cada archivo `.md`
- **Contexto resaltado** — Muestra la línea con el texto encontrado resaltado
- **Click para navegar** — Click en cualquier resultado para abrir el archivo y saltar a la coincidencia exacta
- **Conteo de coincidencias por archivo** — Ve cuántas coincidencias tiene cada archivo
- **Reemplazar Todo global** — Reemplaza un término en todos los archivos con un click
- **Entrada con debounce** — Espera 300ms después de que dejas de escribir para no hacer lag en vaults grandes

---

### 🎯 Cómo Funciona el Matching

El plugin usa normalización Unicode NFD para descomponer caracteres y luego elimina todas las marcas combinantes (categoría Unicode `Mn`):

| Original | Normalizado | Escritura |
|----------|------------|-----------|
| בְּרֵאשִׁית | בראשית | Hebreo (nikud + cantilación) |
| café | cafe | Latín (acento agudo) |
| بِسْمِ ٱللَّهِ | بسم الله | Árabe (tashkil) |
| naïve | naive | Latín (diéresis) |
| Ἀθῆναι | Αθηναι | Griego (politónico) |
| résumé | resume | Latín (múltiples acentos) |
| über | uber | Latín (umlaut) |

> 💡 **Ambos lados se normalizan** — si buscas *con* diacríticos, igual encuentra texto *sin* ellos (y viceversa).

---

### ⌨️ Atajos de Teclado

| Acción | Atajo |
|--------|-------|
| Abrir búsqueda local | <kbd>Option</kbd> + <kbd>F</kbd> *(sugerido — asígnalo en Ajustes → Atajos de teclado)* |
| Abrir búsqueda global | <kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> *(sugerido — asígnalo en Ajustes → Atajos de teclado)* |
| Siguiente coincidencia | <kbd>Enter</kbd> o botón ▼ |
| Coincidencia anterior | <kbd>Shift</kbd> + <kbd>Enter</kbd> o botón ▲ |
| Cerrar búsqueda | <kbd>Esc</kbd> (funciona desde cualquier lugar) |
| Reemplazar actual | <kbd>Enter</kbd> en el campo de reemplazo |

Ambos comandos también están disponibles en la **Paleta de Comandos** (<kbd>Cmd</kbd> + <kbd>P</kbd>).

---

### 🗂️ Escrituras Soportadas

| Escritura | Ejemplo | Qué se elimina |
|-----------|---------|---------------|
| 🇮🇱 Hebreo | בְּרֵאשִׁית → בראשית | Nikud, marcas de cantilación |
| 🇸🇦 Árabe | بِسْمِ → بسم | Tashkil / harakat |
| 🇫🇷 Latín | café → cafe | Acentos, umlauts, cedillas, tildes |
| 🇬🇷 Griego | Ἀθῆναι → Αθηναι | Acentos politónicos, espíritus |
| 🇷🇺 Cirílico | й → и | Breve combinante |
| 🇮🇳 Devanagari | — | Anusvara, virama, etc. |
| 🌍 **Cualquiera** | — | Todo Unicode Mn (Mark, Nonspacing) |

---

## Instalación

### Instalación Manual

1. Descarga `main.js` y `manifest.json` del [último release](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
2. Crea la carpeta: `<tu-vault>/.obsidian/plugins/diacritics-free-search/`
3. Coloca ambos archivos dentro
4. Reinicia Obsidian
5. Ve a **Settings → Community Plugins** → Activa "Diacritics-Free Search"

### Compilar desde el Código Fuente

```bash
git clone https://github.com/spenhos/obsidian-diacritics-free-search.git
cd obsidian-diacritics-free-search
npm install
npm run build
```

Copia `main.js` + `manifest.json` a la carpeta de plugins de tu vault.

---

## Configuración

| Opción | Descripción | Valor por defecto |
|--------|-------------|-------------------|
| Case sensitive by default | Iniciar búsquedas con sensibilidad a mayúsculas activada | Desactivado |

---

## Apoyar

Si este plugin te resulta útil, puedes apoyar su desarrollo:

[![Patrocinar en GitHub](https://img.shields.io/badge/Patrocinar-%E2%9D%A4-db61a2?logo=github&style=for-the-badge)](https://github.com/sponsors/spenhos)

---

## Contribuir

¡Issues y PRs son bienvenidos! Si encuentras una escritura o idioma donde los diacríticos no se eliminan correctamente, por favor [abre un issue](https://github.com/spenhos/obsidian-diacritics-free-search/issues) con un ejemplo.

---

<div align="center">

Hecho con ❤️ para quienes toman notas en múltiples idiomas

**[Saleh Penhos](https://github.com/spenhos)**

</div>
