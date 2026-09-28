# 🗺️ TokenMap

> **A 100% browser-local tool for analyzing LLM chat logs and prompts, visualizing context window consumption via an interactive treemap.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Privacy: 100% Local](https://img.shields.io/badge/Privacy-100%25_Local-success.svg)](#privacy)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-brightgreen.svg)](https://username.github.io/tokenmap/)

[Türkçe Dokümantasyon (README.md)](README.md)

---

## 🖼️ Screenshot

![TokenMap Interface](docs/screenshot.png)
*(Place your screenshot at `docs/screenshot.png`)*

---

## 🤔 Why TokenMap?

When working with Large Language Models (LLMs), it is difficult to see how your **context window** is being allocated. System instructions, user inputs, RAG (retrieved documents), and tool calls/results quickly exhaust available capacity.

**TokenMap** breaks down your input into categories, rendering a 100% local, interactive squarified treemap with actionable context optimization insights.

---

## 🚀 How to Use (In 3 Steps)

1. **Paste or Drop Input:** Paste your LLM chat JSON (OpenAI, Anthropic) or plain text (or drag & drop `.json`/`.txt` files).
2. **Select Target Model:** Choose your target model (GPT-4o, Claude 3.5, Gemini, Llama, etc.).
3. **Inspect the Map:** View category breakdown, segment details, and rule-based optimization insights.

---

## 🔒 Privacy Guarantee (100% Local Processing)

TokenMap runs strictly **client-side in your browser**:

- **Zero Network Requests:** No data is ever transmitted to servers or external APIs.
- **Enforced via CSP:** The `connect-src 'none'` Content Security Policy meta tag blocks all outgoing network traffic.
- **No LocalStorage Tracking:** Your input text is never saved to `localStorage` (only dark/light theme preference is persisted).

> 💡 **How to Verify?**
> Press `F12` to open **Developer Tools** -> **Network** tab. Paste your prompt or run an analysis—you will observe exactly **0 network requests**.

---

## 🎯 Tokenizer Accuracy

Different LLM providers use distinct BPE tokenizers. TokenMap adheres to strict tokenizer honesty:

| Model Family | Tokenizer Method | Accuracy | Note |
| :--- | :--- | :--- | :--- |
| **OpenAI** (GPT-4o, GPT-4 Turbo, etc.) | `gpt-tokenizer` BPE | Exact | Precise token counts calculated via BPE tokenizer. |
| **Anthropic** (Claude 3.5 Sonnet, etc.) | Approx Scaling | Approx (`~`) | Estimated via `gpt-tokenizer` with scaling factor (±10-15%). |
| **Google** (Gemini 1.5 Pro, etc.) | Approx Scaling | Approx (`~`) | Estimated via `gpt-tokenizer` with scaling factor. |
| **Meta** (Llama 3.3, etc.) | Approx Scaling | Approx (`~`) | Estimated via `gpt-tokenizer` with scaling factor. |

---

## 📋 Supported Formats

| Format | Description | Example Structure |
| :--- | :--- | :--- |
| **OpenAI JSON** | ChatGPT export or OpenAI API message array | `{"messages": [{"role": "user", "content": "..."}]}` |
| **Anthropic JSON** | Claude API chat structure | `{"system": "...", "messages": [{"role": "user", "content": [...]}]}` |
| **Plain Text** | Prompt text or block-separated documents | Standard text and multi-block prompts |

---

## 💻 Local Development

To run or build TokenMap locally:

```bash
# 1. Clone the repository
git clone https://github.com/username/tokenmap.git
cd tokenmap

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run unit tests
npm run test

# 5. Build production bundle
npm run build
```

---

## 🤝 Contributing, Roadmap & License

- **Contributing:** Read [CONTRIBUTING.md](CONTRIBUTING.md) to learn how to add new parsers, models, or insight rules.
- **License:** Open source under the [MIT License](LICENSE).
