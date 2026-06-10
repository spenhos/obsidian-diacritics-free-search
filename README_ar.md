<div align="center">

# ✨ Diacritics-Free Search

**البحث والاستبدال في Obsidian مع تجاهل علامات التشكيل**

تشكيل عربي · نيقود عبري · علامات لاتينية · يونانية متعددة النبر · أي علامة Unicode مركّبة

[![GitHub release](https://img.shields.io/github/v/release/spenhos/obsidian-diacritics-free-search?style=flat-square)](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/LICENSE)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/elevalma)

🌐 [English](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README.md) | [Español](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_es.md) | [עברית](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_he.md) | العربية | [Français](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_fr.md) | [Русский](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_ru.md) | [Português](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_pt.md)

[![ادعمني على Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elevalma)

---

</div>

## المشكلة

إذا كانت ملاحظاتك تحتوي على نص عربي مُشكَّل مثل **بِسْمِ**، فإن البحث عن **بسم** (بدون تشكيل) لن يجده. ويحدث الأمر نفسه مع العبرية **בְּרֵאשִׁית** مقابل **בראשית**، واللاتينية **café** مقابل **cafe**، وأي علامات تشكيل أخرى.

يحل **Diacritics-Free Search** هذه المشكلة بجعل جميع علامات التشكيل شفافة أثناء البحث — اكتب بدون علامات واعثر على نص يحتوي عليها.

```
البحث:    بسم            →  يجد:  بِسْمِ ✓
البحث:    cafe           →  يجد:  café ✓
البحث:    בראשית        →  يجد:  בְּרֵאשִׁית ✓
```

---

## الميزات

### 🔍 البحث المحلي — البحث والاستبدال في الملاحظة الحالية

<table>
<tr>
<td width="120"><strong>اختصار</strong></td>
<td><kbd>Option</kbd> + <kbd>F</kbd> <em>(مُقترَح — عيّنه في الإعدادات ← اختصارات لوحة المفاتيح)</em></td>
</tr>
<tr>
<td><strong>السلوك</strong></td>
<td>يفتح شريط بحث أعلى الملاحظة (بأسلوب Chrome)</td>
</tr>
</table>

**القدرات:**

- **تمييز فوري** — تُميَّز كل النتائج بالأصفر؛ النتيجة الحالية بالبرتقالي
- **التنقل بين النتائج** — استخدم أزرار ▲▼ أو <kbd>Enter</kbd> / <kbd>Shift+Enter</kbd> للقفز بين النتائج
- **علامات في شريط التمرير** — نقاط صفراء على الجانب تُظهر مواضع النتائج (قابلة للنقر!)
- **استبدال واحد / استبدال الكل** — استبدل النتيجة الحالية أو كلها دفعة واحدة
- **مفتاح حساسية الأحرف** — انقر "Aa" لتفعيل/إيقاف التمييز بين الأحرف الكبيرة والصغيرة
- **يتذكر آخر بحث** — أعد فتح الشريط وسيظل بحثك السابق موجودًا
- **Escape للإغلاق** — اضغط <kbd>Esc</kbd> من أي مكان (حتى أثناء التحرير) لإغلاق الشريط

---

### 🌐 البحث الشامل — البحث في كامل القبو

<table>
<tr>
<td width="120"><strong>اختصار</strong></td>
<td><kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> <em>(مُقترَح — عيّنه في الإعدادات ← اختصارات لوحة المفاتيح)</em></td>
</tr>
<tr>
<td><strong>السلوك</strong></td>
<td>يفتح نافذة للبحث في جميع ملفات Markdown في القبو</td>
</tr>
</table>

**القدرات:**

- **بحث في كامل القبو** — يفحص كل ملف `.md`
- **سياق مميَّز** — يعرض السطر مع تمييز النص المطابق
- **انقر للتنقل** — انقر أي نتيجة لفتح الملف والقفز إلى المطابقة المحددة
- **عدد المطابقات لكل ملف** — اطّلع على عدد المطابقات في كل ملف
- **استبدال شامل للكل** — استبدل مصطلحًا في جميع الملفات بنقرة واحدة
- **إدخال مع تأخير** — ينتظر 300 مللي ثانية بعد توقفك عن الكتابة لتجنب البطء في الأقبية الكبيرة

---

### 🎯 كيف تعمل المطابقة

يستخدم الإضافة تطبيع Unicode NFD لتفكيك الأحرف، ثم يزيل كل العلامات المركّبة (فئة Unicode `Mn`):

| الأصل | بعد التطبيع | الكتابة |
|------|------------|---------|
| بِسْمِ ٱللَّهِ | بسم الله | عربية (تشكيل) |
| בְּרֵאשִׁית | בראשית | عبرية (نيقود + تنغيم) |
| café | cafe | لاتينية (نبرة حادة) |
| naïve | naive | لاتينية (نقطتان) |
| Ἀθῆναι | Αθηναι | يونانية (متعددة النبر) |
| résumé | resume | لاتينية (نبرات متعددة) |
| über | uber | لاتينية (أملاوت) |

> 💡 **يُطبَّع الطرفان** — إذا بحثت *بعلامات* التشكيل، فسيظل يجد النص *بدونها* (والعكس صحيح).

---

### ⌨️ اختصارات لوحة المفاتيح

| الإجراء | الاختصار |
|--------|---------|
| فتح البحث المحلي | <kbd>Option</kbd> + <kbd>F</kbd> *(مُقترَح — عيّنه في الإعدادات)* |
| فتح البحث الشامل | <kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> *(مُقترَح — عيّنه في الإعدادات)* |
| المطابقة التالية | <kbd>Enter</kbd> أو زر ▼ |
| المطابقة السابقة | <kbd>Shift</kbd> + <kbd>Enter</kbd> أو زر ▲ |
| إغلاق البحث | <kbd>Esc</kbd> (يعمل من أي مكان) |
| استبدال الحالي | <kbd>Enter</kbd> في حقل الاستبدال |

كلا الأمرين متاحان أيضًا عبر **لوحة الأوامر** (<kbd>Cmd</kbd> + <kbd>P</kbd>).

---

### 🗂️ الكتابات المدعومة

| الكتابة | مثال | ما يُزال |
|--------|------|---------|
| 🇸🇦 العربية | بِسْمِ → بسم | التشكيل / الحركات |
| 🇮🇱 العبرية | בְּרֵאשִׁית → בראשית | النيقود وعلامات التنغيم |
| 🇫🇷 اللاتينية | café → cafe | النبرات، الأملاوت، السيديا، التيلدا |
| 🇬🇷 اليونانية | Ἀθῆναι → Αθηναι | نبرات متعددة، علامات التنفّس |
| 🇷🇺 السيريلية | й → и | بريفة مركّبة |
| 🇮🇳 الديفاناغارية | — | أنوسفارا، فيراما، إلخ |
| 🌍 **أي كتابة** | — | كل Unicode Mn (علامة، غير متباعدة) |

---

## التثبيت

### تثبيت يدوي

1. نزّل `main.js` و`manifest.json` من [أحدث إصدار](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
2. أنشئ المجلد: `<قبوك>/.obsidian/plugins/diacritics-free-search/`
3. ضع الملفين بداخله
4. أعد تشغيل Obsidian
5. اذهب إلى **Settings → Community Plugins** → فعّل "Diacritics-Free Search"

### البناء من المصدر

```bash
git clone https://github.com/spenhos/obsidian-diacritics-free-search.git
cd obsidian-diacritics-free-search
npm install
npm run build
```

انسخ `main.js` + `manifest.json` إلى مجلد إضافات قبوك.

---

## الإعدادات

| الإعداد | الوصف | الافتراضي |
|--------|--------|----------|
| Case sensitive by default | بدء عمليات البحث مع تفعيل حساسية الأحرف | معطّل |

---

## الدعم

إذا كان هذا الإضافة مفيدًا لك، يمكنك دعم تطويره:

[![ادعمني على Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elevalma)

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-%E2%9D%A4-db61a2?logo=github&style=for-the-badge)](https://github.com/sponsors/spenhos)

---

## المساهمة

نرحب بالـ Issues وPRs! إذا وجدت كتابة أو لغة لا تُزال فيها علامات التشكيل بشكل صحيح، فيُرجى [فتح issue](https://github.com/spenhos/obsidian-diacritics-free-search/issues) مع مثال.

---

<div align="center">

صُنع بـ ❤️ لمن يدوّنون ملاحظاتهم بعدة لغات

**[Saleh Penhos](https://github.com/spenhos)**

</div>
