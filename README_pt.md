<div align="center">

# ✨ Diacritics-Free Search

**Busca e substituição de texto no Obsidian ignorando sinais diacríticos**

Nikud hebraico · Tashkil árabe · Acentos latinos · Grego politônico · Qualquer marca combinante Unicode

[![GitHub release](https://img.shields.io/github/v/release/spenhos/obsidian-diacritics-free-search?style=flat-square)](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/LICENSE)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/elevalma)

🌐 [English](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README.md) | [Español](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_es.md) | [עברית](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_he.md) | [العربية](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_ar.md) | [Français](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_fr.md) | [Русский](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_ru.md) | Português

[![Apoie no Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elevalma)

---

</div>

## O problema

Se suas notas contêm acentos como **café**, buscar por **cafe** (sem acento) não vai encontrá-lo. O mesmo acontece com **ção** vs **cao**, hebraico **בְּרֵאשִׁית** vs **בראשית**, árabe **بِسْمِ** vs **بسم**, e qualquer outro sinal diacrítico.

O **Diacritics-Free Search** resolve isso tornando todos os diacríticos transparentes durante a busca — digite sem marcas e encontre o texto que as contém.

```
Busca:    cafe           →  Encontra:  café ✓
Busca:    acao           →  Encontra:  ação ✓
Busca:    בראשית        →  Encontra:  בְּרֵאשִׁית ✓
```

---

## Funcionalidades

### 🔍 Busca local — Buscar e substituir na nota ativa

<table>
<tr>
<td width="120"><strong>Atalho</strong></td>
<td><kbd>Option</kbd> + <kbd>F</kbd> <em>(sugerido — defina em Configurações → Atalhos de teclado)</em></td>
</tr>
<tr>
<td><strong>Comportamento</strong></td>
<td>Abre uma barra de busca no topo da nota ativa (estilo Chrome)</td>
</tr>
</table>

**Recursos:**

- **Destaque em tempo real** — Todas as correspondências destacadas em amarelo; a atual em laranja
- **Navegação entre correspondências** — Use os botões ▲▼ ou <kbd>Enter</kbd> / <kbd>Shift+Enter</kbd> para pular entre os resultados
- **Marcadores na barra de rolagem** — Pontos amarelos na lateral mostram onde estão as correspondências (clicáveis!)
- **Substituir um / Substituir todos** — Substitua a correspondência atual ou todas de uma vez
- **Alternar maiúsculas/minúsculas** — Clique em "Aa" para ativar/desativar a diferenciação de maiúsculas
- **Lembra a última busca** — Reabra a barra e sua busca anterior ainda estará lá
- **Escape para fechar** — Pressione <kbd>Esc</kbd> de qualquer lugar (mesmo editando) para fechar a barra

---

### 🌐 Busca global — Buscar em todo o cofre

<table>
<tr>
<td width="120"><strong>Atalho</strong></td>
<td><kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> <em>(sugerido — defina em Configurações → Atalhos de teclado)</em></td>
</tr>
<tr>
<td><strong>Comportamento</strong></td>
<td>Abre uma janela para buscar em todos os arquivos Markdown do cofre</td>
</tr>
</table>

**Recursos:**

- **Busca em todo o cofre** — Varre cada arquivo `.md`
- **Contexto destacado** — Mostra a linha com o texto encontrado destacado
- **Clique para navegar** — Clique em qualquer resultado para abrir o arquivo e pular para a correspondência exata
- **Contagem de correspondências por arquivo** — Veja quantas correspondências cada arquivo contém
- **Substituir tudo (global)** — Substitua um termo em todos os arquivos com um clique
- **Entrada com debounce** — Aguarda 300 ms depois que você para de digitar para evitar lentidão em cofres grandes

---

### 🎯 Como funciona a correspondência

O plugin usa normalização Unicode NFD para decompor caracteres e depois remove todas as marcas combinantes (categoria Unicode `Mn`):

| Original | Normalizado | Escrita |
|----------|-------------|---------|
| café | cafe | Latim (acento agudo) |
| ação | acao | Latim (til + cedilha) |
| בְּרֵאשִׁית | בראשית | Hebraico (nikud + cantilação) |
| بِسْمِ ٱللَّهِ | بسم الله | Árabe (tashkil) |
| naïve | naive | Latim (trema) |
| Ἀθῆναι | Αθηναι | Grego (politônico) |
| über | uber | Latim (umlaut) |

> 💡 **Os dois lados são normalizados** — se você buscar *com* diacríticos, ele ainda encontra o texto *sem* eles (e vice-versa).

---

### ⌨️ Atalhos de teclado

| Ação | Atalho |
|------|--------|
| Abrir busca local | <kbd>Option</kbd> + <kbd>F</kbd> *(sugerido — defina nas Configurações)* |
| Abrir busca global | <kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> *(sugerido — defina nas Configurações)* |
| Próxima correspondência | <kbd>Enter</kbd> ou botão ▼ |
| Correspondência anterior | <kbd>Shift</kbd> + <kbd>Enter</kbd> ou botão ▲ |
| Fechar busca | <kbd>Esc</kbd> (funciona de qualquer lugar) |
| Substituir atual | <kbd>Enter</kbd> no campo de substituição |

Ambos os comandos também estão disponíveis na **Paleta de Comandos** (<kbd>Cmd</kbd> + <kbd>P</kbd>).

---

### 🗂️ Escritas suportadas

| Escrita | Exemplo | O que é removido |
|---------|---------|------------------|
| 🇧🇷 Latim | café → cafe | Acentos, tremas, cedilhas, tis |
| 🇮🇱 Hebraico | בְּרֵאשִׁית → בראשית | Nikud, marcas de cantilação |
| 🇸🇦 Árabe | بِسْمِ → بسم | Tashkil / harakat |
| 🇬🇷 Grego | Ἀθῆναι → Αθηναι | Acentos politônicos, espíritos |
| 🇷🇺 Cirílico | й → и | Breve combinante |
| 🇮🇳 Devanágari | — | Anusvara, virama, etc. |
| 🌍 **Qualquer** | — | Todos os Unicode Mn (Mark, Nonspacing) |

---

## Instalação

### Instalação manual

1. Baixe `main.js` e `manifest.json` da [versão mais recente](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
2. Crie a pasta: `<seu-cofre>/.obsidian/plugins/diacritics-free-search/`
3. Coloque os dois arquivos dentro dela
4. Reinicie o Obsidian
5. Vá em **Settings → Community Plugins** → Ative "Diacritics-Free Search"

### Compilar do código-fonte

```bash
git clone https://github.com/spenhos/obsidian-diacritics-free-search.git
cd obsidian-diacritics-free-search
npm install
npm run build
```

Copie `main.js` + `manifest.json` para a pasta de plugins do seu cofre.

---

## Configurações

| Opção | Descrição | Padrão |
|-------|-----------|--------|
| Case sensitive by default | Iniciar buscas com diferenciação de maiúsculas ativada | Desativado |

---

## Apoiar

Se este plugin é útil para você, você pode apoiar seu desenvolvimento:

[![Apoie no Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elevalma)

[![Apoiar no GitHub](https://img.shields.io/badge/Apoiar-%E2%9D%A4-db61a2?logo=github&style=for-the-badge)](https://github.com/sponsors/spenhos)

---

## Contribuir

Issues e PRs são bem-vindos! Se você encontrar uma escrita ou idioma em que os diacríticos não são removidos corretamente, por favor [abra uma issue](https://github.com/spenhos/obsidian-diacritics-free-search/issues) com um exemplo.

---

<div align="center">

Feito com ❤️ para quem faz anotações em vários idiomas

**[Saleh Penhos](https://github.com/spenhos)**

</div>
