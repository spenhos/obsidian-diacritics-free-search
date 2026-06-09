<div align="center">

# ✨ Diacritics-Free Search

**Rechercher et remplacer du texte en ignorant les signes diacritiques dans Obsidian**

Nikud hébreu · Tashkil arabe · Accents latins · Grec polytonique · Toute marque combinante Unicode

[![GitHub release](https://img.shields.io/github/v/release/spenhos/obsidian-diacritics-free-search?style=flat-square)](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/elevalma)

🌐 [English](./README.md) | [Español](./README_es.md) | [עברית](./README_he.md) | [العربية](./README_ar.md) | Français | [Русский](./README_ru.md) | [Português](./README_pt.md)

[![Soutenez-moi sur Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elevalma)

---

</div>

## Le problème

Si vos notes contiennent des accents comme **café**, une recherche de **cafe** (sans accent) ne le trouvera pas. Le même problème se produit avec l'hébreu **בְּרֵאשִׁית** vs **בראשית**, l'arabe **بِسْمِ** vs **بسم**, et tout autre signe diacritique.

**Diacritics-Free Search** résout cela en rendant tous les signes diacritiques transparents pendant la recherche — tapez sans accents et trouvez le texte qui en contient.

```
Recherche :    cafe           →  Trouve :  café ✓
Recherche :    eleve          →  Trouve :  élève ✓
Recherche :    בראשית        →  Trouve :  בְּרֵאשִׁית ✓
```

---

## Fonctionnalités

### 🔍 Recherche locale — Rechercher et remplacer dans la note active

<table>
<tr>
<td width="120"><strong>Raccourci</strong></td>
<td><kbd>Option</kbd> + <kbd>F</kbd> <em>(suggéré — à définir dans Paramètres → Raccourcis clavier)</em></td>
</tr>
<tr>
<td><strong>Comportement</strong></td>
<td>Ouvre une barre de recherche en haut de la note active (style Chrome)</td>
</tr>
</table>

**Capacités :**

- **Surlignage en temps réel** — Toutes les correspondances surlignées en jaune ; la correspondance actuelle en orange
- **Navigation entre correspondances** — Utilisez les boutons ▲▼ ou <kbd>Enter</kbd> / <kbd>Shift+Enter</kbd> pour sauter d'une correspondance à l'autre
- **Marqueurs sur la barre de défilement** — Des points jaunes sur le côté indiquent où se trouvent les correspondances (cliquables !)
- **Remplacer un / Remplacer tout** — Remplacez la correspondance actuelle ou toutes en une fois
- **Bascule de sensibilité à la casse** — Cliquez sur « Aa » pour activer/désactiver la sensibilité à la casse
- **Mémorise la dernière recherche** — Rouvrez la barre et votre recherche précédente est toujours là
- **Échap pour fermer** — Appuyez sur <kbd>Esc</kbd> depuis n'importe où (même en cours d'édition) pour fermer la barre

---

### 🌐 Recherche globale — Rechercher dans tout le coffre

<table>
<tr>
<td width="120"><strong>Raccourci</strong></td>
<td><kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> <em>(suggéré — à définir dans Paramètres → Raccourcis clavier)</em></td>
</tr>
<tr>
<td><strong>Comportement</strong></td>
<td>Ouvre une fenêtre pour rechercher dans tous les fichiers Markdown du coffre</td>
</tr>
</table>

**Capacités :**

- **Recherche dans tout le coffre** — Analyse chaque fichier `.md`
- **Contexte surligné** — Affiche la ligne avec le texte trouvé surligné
- **Cliquer pour naviguer** — Cliquez sur n'importe quel résultat pour ouvrir le fichier et sauter à la correspondance exacte
- **Nombre de correspondances par fichier** — Voyez combien de correspondances contient chaque fichier
- **Remplacer tout (global)** — Remplacez un terme dans tous les fichiers en un clic
- **Saisie temporisée** — Attend 300 ms après que vous arrêtez de taper pour éviter les ralentissements dans les grands coffres

---

### 🎯 Comment fonctionne la correspondance

L'extension utilise la normalisation Unicode NFD pour décomposer les caractères, puis supprime toutes les marques combinantes (catégorie Unicode `Mn`) :

| Original | Normalisé | Écriture |
|----------|-----------|----------|
| café | cafe | Latin (accent aigu) |
| élève | eleve | Latin (accents) |
| בְּרֵאשִׁית | בראשית | Hébreu (nikud + cantillation) |
| بِسْمِ ٱللَّهِ | بسم الله | Arabe (tashkil) |
| naïve | naive | Latin (tréma) |
| Ἀθῆναι | Αθηναι | Grec (polytonique) |
| über | uber | Latin (umlaut) |

> 💡 **Les deux côtés sont normalisés** — si vous recherchez *avec* des signes diacritiques, l'extension trouve quand même le texte *sans* (et vice versa).

---

### ⌨️ Raccourcis clavier

| Action | Raccourci |
|--------|-----------|
| Ouvrir la recherche locale | <kbd>Option</kbd> + <kbd>F</kbd> *(suggéré — à définir dans Paramètres)* |
| Ouvrir la recherche globale | <kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> *(suggéré — à définir dans Paramètres)* |
| Correspondance suivante | <kbd>Enter</kbd> ou bouton ▼ |
| Correspondance précédente | <kbd>Shift</kbd> + <kbd>Enter</kbd> ou bouton ▲ |
| Fermer la recherche | <kbd>Esc</kbd> (fonctionne depuis n'importe où) |
| Remplacer l'actuelle | <kbd>Enter</kbd> dans le champ de remplacement |

Les deux commandes sont aussi disponibles via la **Palette de commandes** (<kbd>Cmd</kbd> + <kbd>P</kbd>).

---

### 🗂️ Écritures prises en charge

| Écriture | Exemple | Ce qui est retiré |
|----------|---------|-------------------|
| 🇫🇷 Latin | café → cafe | Accents, trémas, cédilles, tildes |
| 🇮🇱 Hébreu | בְּרֵאשִׁית → בראשית | Nikud, marques de cantillation |
| 🇸🇦 Arabe | بِسْمِ → بسم | Tashkil / harakat |
| 🇬🇷 Grec | Ἀθῆναι → Αθηναι | Accents polytoniques, esprits |
| 🇷🇺 Cyrillique | й → и | Brève combinante |
| 🇮🇳 Devanagari | — | Anusvara, virama, etc. |
| 🌍 **Toute écriture** | — | Tous les Unicode Mn (Mark, Nonspacing) |

---

## Installation

### Installation manuelle

1. Téléchargez `main.js` et `manifest.json` depuis la [dernière version](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
2. Créez le dossier : `<votre-coffre>/.obsidian/plugins/diacritics-free-search/`
3. Placez-y les deux fichiers
4. Redémarrez Obsidian
5. Allez dans **Settings → Community Plugins** → Activez « Diacritics-Free Search »

### Compilation depuis les sources

```bash
git clone https://github.com/spenhos/obsidian-diacritics-free-search.git
cd obsidian-diacritics-free-search
npm install
npm run build
```

Copiez `main.js` + `manifest.json` dans le dossier des plugins de votre coffre.

---

## Paramètres

| Paramètre | Description | Par défaut |
|-----------|-------------|------------|
| Case sensitive by default | Démarrer les recherches avec la sensibilité à la casse activée | Désactivé |

---

## Soutenir

Si cette extension vous est utile, vous pouvez soutenir son développement :

[![Soutenez-moi sur Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elevalma)

[![Soutenir sur GitHub](https://img.shields.io/badge/Soutenir-%E2%9D%A4-db61a2?logo=github&style=for-the-badge)](https://github.com/sponsors/spenhos)

---

## Contribuer

Les Issues et PR sont les bienvenus ! Si vous trouvez une écriture ou une langue où les signes diacritiques ne sont pas correctement supprimés, veuillez [ouvrir une issue](https://github.com/spenhos/obsidian-diacritics-free-search/issues) avec un exemple.

---

<div align="center">

Fait avec ❤️ pour les preneurs de notes multilingues

**[Saleh Penhos](https://github.com/spenhos)**

</div>
