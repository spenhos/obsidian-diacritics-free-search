<div align="center">

# ✨ Diacritics-Free Search

**Поиск и замена текста в Obsidian с игнорированием диакритических знаков**

Еврейский никуд · Арабский ташкиль · Латинские акценты · Греческий политонический · Любой комбинируемый знак Unicode

[![GitHub release](https://img.shields.io/github/v/release/spenhos/obsidian-diacritics-free-search?style=flat-square)](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/LICENSE)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/elevalma)

🌐 [English](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README.md) | [Español](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_es.md) | [עברית](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_he.md) | [العربية](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_ar.md) | [Français](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_fr.md) | Русский | [Português](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_pt.md)

[![Поддержать на Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elevalma)

---

</div>

## Проблема

Если в ваших заметках есть текст с диакритикой, например **й** (с кратко́й), поиск буквы **и** его не найдёт. То же происходит с французским **café** против **cafe**, ивритом **בְּרֵאשִׁית** против **בראשית**, арабским **بِسْمِ** против **بسم** и любыми другими диакритическими знаками.

**Diacritics-Free Search** решает это, делая все диакритические знаки прозрачными во время поиска — печатайте без знаков и находите текст, в котором они есть.

```
Запрос:    cafe           →  Находит:  café ✓
Запрос:    naive          →  Находит:  naïve ✓
Запрос:    בראשית        →  Находит:  בְּרֵאשִׁית ✓
```

---

## Возможности

### 🔍 Локальный поиск — поиск и замена в текущей заметке

<table>
<tr>
<td width="120"><strong>Сочетание</strong></td>
<td><kbd>Option</kbd> + <kbd>F</kbd> <em>(рекомендуется — назначьте в Настройки → Горячие клавиши)</em></td>
</tr>
<tr>
<td><strong>Поведение</strong></td>
<td>Открывает панель поиска вверху активной заметки (в стиле Chrome)</td>
</tr>
</table>

**Что умеет:**

- **Подсветка в реальном времени** — Все совпадения подсвечены жёлтым; текущее — оранжевым
- **Навигация по совпадениям** — Используйте кнопки ▲▼ или <kbd>Enter</kbd> / <kbd>Shift+Enter</kbd> для перехода между совпадениями
- **Метки на полосе прокрутки** — Жёлтые отметки сбоку показывают, где находятся совпадения (кликабельны!)
- **Заменить одно / Заменить всё** — Замените текущее совпадение или все сразу
- **Переключатель регистра** — Нажмите «Aa», чтобы включить/выключить учёт регистра
- **Запоминает последний поиск** — Откройте панель снова, и ваш предыдущий запрос останется
- **Escape для закрытия** — Нажмите <kbd>Esc</kbd> откуда угодно (даже во время редактирования), чтобы закрыть панель

---

### 🌐 Глобальный поиск — поиск по всему хранилищу

<table>
<tr>
<td width="120"><strong>Сочетание</strong></td>
<td><kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> <em>(рекомендуется — назначьте в Настройки → Горячие клавиши)</em></td>
</tr>
<tr>
<td><strong>Поведение</strong></td>
<td>Открывает окно для поиска по всем Markdown-файлам хранилища</td>
</tr>
</table>

**Что умеет:**

- **Поиск по всему хранилищу** — Сканирует каждый файл `.md`
- **Подсвеченный контекст** — Показывает строку с подсвеченным найденным текстом
- **Клик для перехода** — Нажмите на любой результат, чтобы открыть файл и перейти к точному совпадению
- **Количество совпадений на файл** — Видно, сколько совпадений в каждом файле
- **Глобальная замена всего** — Замените термин во всех файлах одним кликом
- **Ввод с задержкой** — Ждёт 300 мс после остановки ввода, чтобы избежать задержек в больших хранилищах

---

### 🎯 Как работает сопоставление

Плагин использует нормализацию Unicode NFD для разложения символов, а затем удаляет все комбинируемые знаки (категория Unicode `Mn`):

| Оригинал | Нормализовано | Письменность |
|----------|---------------|--------------|
| café | cafe | Латиница (акут) |
| naïve | naive | Латиница (умлаут/трема) |
| й | и | Кириллица (комбинируемая краткая) |
| בְּרֵאשִׁית | בראשית | Иврит (никуд + кантилляция) |
| بِسْمِ ٱللَّهِ | بسم الله | Арабский (ташкиль) |
| Ἀθῆναι | Αθηναι | Греческий (политонический) |
| über | uber | Латиница (умлаут) |

> 💡 **Нормализуются обе стороны** — если вы ищете *с* диакритикой, плагин всё равно находит текст *без* неё (и наоборот).

---

### ⌨️ Горячие клавиши

| Действие | Сочетание |
|----------|-----------|
| Открыть локальный поиск | <kbd>Option</kbd> + <kbd>F</kbd> *(рекомендуется — назначьте в настройках)* |
| Открыть глобальный поиск | <kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> *(рекомендуется — назначьте в настройках)* |
| Следующее совпадение | <kbd>Enter</kbd> или кнопка ▼ |
| Предыдущее совпадение | <kbd>Shift</kbd> + <kbd>Enter</kbd> или кнопка ▲ |
| Закрыть поиск | <kbd>Esc</kbd> (работает откуда угодно) |
| Заменить текущее | <kbd>Enter</kbd> в поле замены |

Обе команды также доступны через **палитру команд** (<kbd>Cmd</kbd> + <kbd>P</kbd>).

---

### 🗂️ Поддерживаемые письменности

| Письменность | Пример | Что удаляется |
|--------------|--------|---------------|
| 🇷🇺 Кириллица | й → и | Комбинируемая краткая |
| 🇮🇱 Иврит | בְּרֵאשִׁית → בראשית | Никуд, знаки кантилляции |
| 🇸🇦 Арабский | بِسْمِ → بسم | Ташкиль / харакат |
| 🇫🇷 Латиница | café → cafe | Акценты, умлауты, седили, тильды |
| 🇬🇷 Греческий | Ἀθῆναι → Αθηναι | Политонические знаки, придыхания |
| 🇮🇳 Деванагари | — | Анусвара, вирама и др. |
| 🌍 **Любая** | — | Все Unicode Mn (Mark, Nonspacing) |

---

## Установка

### Ручная установка

1. Скачайте `main.js` и `manifest.json` из [последнего релиза](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
2. Создайте папку: `<ваше-хранилище>/.obsidian/plugins/diacritics-free-search/`
3. Поместите оба файла внутрь
4. Перезапустите Obsidian
5. Перейдите в **Settings → Community Plugins** → Включите «Diacritics-Free Search»

### Сборка из исходников

```bash
git clone https://github.com/spenhos/obsidian-diacritics-free-search.git
cd obsidian-diacritics-free-search
npm install
npm run build
```

Скопируйте `main.js` + `manifest.json` в папку плагинов вашего хранилища.

---

## Настройки

| Настройка | Описание | По умолчанию |
|-----------|----------|--------------|
| Case sensitive by default | Начинать поиск с включённым учётом регистра | Выключено |

---

## Поддержка

Если этот плагин полезен вам, вы можете поддержать его разработку:

[![Поддержать на Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elevalma)

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-%E2%9D%A4-db61a2?logo=github&style=for-the-badge)](https://github.com/sponsors/spenhos)

---

## Участие

Issues и PR приветствуются! Если вы нашли письменность или язык, где диакритические знаки удаляются неправильно, пожалуйста, [откройте issue](https://github.com/spenhos/obsidian-diacritics-free-search/issues) с примером.

---

<div align="center">

Сделано с ❤️ для тех, кто ведёт заметки на нескольких языках

**[Saleh Penhos](https://github.com/spenhos)**

</div>
