# 🏦 LMS — AI Loan Advisory Chatbot

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask)](https://flask.palletsprojects.com)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An AI-powered **Loan Advisory Agent** using **Retrieval-Augmented Generation (RAG)** that processes loan policy PDFs and answers user questions with verified source citations, streaming responses, and intelligent feedback learning.

---

## ✨ Features

| Feature | Description |
|:--------|:------------|
| 📄 **PDF RAG Pipeline** | Upload any loan policy PDF → auto-parsed, chunked, and embedded into a vector store |
| 🔍 **Hybrid Search** | Combines semantic (cosine similarity) + keyword matching for accurate retrieval |
| 🤖 **AI-Powered Answers** | Google Gemini 2.0 Flash generates structured, source-cited responses |
| ⚡ **Streaming Responses** | Real-time token-by-token response via Server-Sent Events (SSE) |
| ✅ **Grounding Validation** | Verifies answers against source docs to prevent hallucinations |
| 💰 **EMI Calculator** | Built-in calculator with donut chart visualization |
| 👍👎 **Feedback Learning** | Thumbs up/down on answers — the bot learns from negative feedback |
| 📥 **Export Chat as PDF** | Download your full conversation as a formatted PDF document |
| 🌗 **Dark / Light Theme** | Toggle between themes with persistent preference |
| 📱 **Responsive Design** | Works on desktop, tablet, and mobile devices |

---

## 🏗️ Architecture

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  PDF Upload  │────▶│  PyPDF2 Parser  │────▶│  Text Chunker    │
│              │     │  (Page-Level)   │     │  (500ch, 80 ovl) │
└──────────────┘     └─────────────────┘     └────────┬─────────┘
                                                      │
                     ┌─────────────────┐              ▼
                     │  Vector Store   │◀────  Gemini Embeddings
                     │  (NumPy + JSON) │       (text-embedding-004)
                     └────────┬────────┘
                              │
┌──────────────┐              ▼
│  User Query  │────▶  Hybrid Search (Cosine + Keyword)
└──────────────┘              │
                              ▼
                     ┌─────────────────┐
                     │  Gemini LLM     │────▶  Streaming Response
                     │  (2.0-flash)    │       + Source Citations
                     └─────────────────┘       + Validation Badge
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** installed
- **Google Gemini API Key** — [Get a free key here](https://aistudio.google.com/apikey)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-loan-advisory-chatbot.git
cd ai-loan-advisory-chatbot

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure your API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. (Optional) Generate a sample loan PDF
python create_sample_pdf.py

# 5. Run the server
python backend.py
```

Open your browser at **http://localhost:5000** 🎉

---

## 📁 Project Structure

```
AI Loan Advisory Chatbot/
├── backend.py              # Flask backend: RAG pipeline, APIs, streaming
├── requirements.txt        # Python dependencies
├── .env.example            # Template for environment variables
├── .gitignore              # Git ignore rules
├── create_sample_pdf.py    # Generate test loan policy PDF
│
├── client/                 # Frontend (HTML + CSS + JS)
│   ├── index.html          # Main application page
│   ├── css/
│   │   └── styles.css      # Full styling (dark/light themes)
│   └── js/
│       ├── api.js          # API service module
│       ├── chat.js         # Chat rendering & streaming
│       ├── upload.js       # PDF upload with drag-drop
│       └── app.js          # App orchestrator (themes, EMI, export)
│
├── documents/              # Uploaded PDF files (git-ignored)
├── data/                   # Vector store & feedback (git-ignored)
│   ├── vector_store.json   # Embedded document chunks
│   └── feedback.json       # User feedback history
│
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/chat` | Send question, get full response |
| `POST` | `/api/chat/stream` | Stream response via SSE |
| `POST` | `/api/documents/upload` | Upload a PDF document |
| `GET` | `/api/documents` | List uploaded documents |
| `DELETE` | `/api/documents/clear` | Clear all documents |
| `POST` | `/api/feedback` | Submit thumbs up/down feedback |
| `POST` | `/api/emi/calculate` | Calculate EMI with breakdown |
| `POST` | `/api/export/pdf` | Export chat conversation as PDF |
| `GET` | `/api/health` | Health check |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Backend** | Python, Flask, Flask-CORS |
| **LLM** | Google Gemini 2.0 Flash |
| **Embeddings** | Gemini text-embedding-004 |
| **PDF Parsing** | PyPDF2 |
| **Vector Search** | Custom (NumPy cosine similarity) |
| **PDF Export** | ReportLab |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Font** | Manrope (Google Fonts) |

---

## 🎯 Key Technical Highlights

- **Custom Vector Store** — Built from scratch using NumPy instead of external databases
- **Hybrid Retrieval** — Combines semantic cosine similarity with keyword boosting
- **Grounding Validation** — Checks number consistency and keyword overlap to catch hallucinations
- **Feedback Learning** — Negative feedback is injected into LLM context to improve future responses
- **Graceful Degradation** — Falls back to local RAG synthesis if the Gemini API is unavailable
- **Real-Time Streaming** — SSE-based token streaming for a responsive chat experience

---

## 📝 Environment Variables

| Variable | Required | Description |
|:---------|:---------|:------------|
| `GEMINI_API_KEY` | ✅ | Your Google Gemini API key |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ using Python, Flask, and Google Gemini
</p>
