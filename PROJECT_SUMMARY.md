# AI Loan Advisory Chatbot - Project Summary

## Resume Bullet Points
*   **Navigated dense, jargon-heavy loan policy PDFs** which were slow for customers to read and created repetitive eligibility/rate queries for support teams.
*   **Built a full-stack RAG pipeline** (Flask, Gemini 2.0 Flash LLM, `text-embedding-004` vectors, ChromaDB) with SSE token streaming for real-time, source-grounded answers.
*   **Engineered a Semantic Domain Gate** and citation-based validation to block irrelevant queries and prevent hallucinations, deploying a hybrid Vercel/Render app that drastically cut manual PDF lookup time.

---

## Tech Stack
*   **Languages:** Python (Backend), JavaScript ES6+ (Frontend), HTML5, CSS3
*   **Backend Framework:** Flask, Gunicorn
*   **Architecture:** Retrieval-Augmented Generation (RAG), REST API, Server-Sent Events (SSE)
*   **AI & Embeddings:** Google Gemini 2.0 Flash (LLM), Gemini `text-embedding-004` (Vectors)
*   **Vector Database:** ChromaDB 
*   **Document Processing:** PyPDF2, python-docx, openpyxl, BeautifulSoup4
*   **Database:** SQLite, Flask-SQLAlchemy (ORM)
*   **Security:** JWT (JSON Web Tokens), Flask-JWT-Extended
*   **Deployment:** Render (Backend/Docker), Vercel (Frontend)

---

## The Project Story (Interview Talking Points)

### 1. The Problem
Banks provide loan policies as massive, 50+ page PDF documents. Customers struggle to find simple answers (like minimum CIBIL scores), which frustrates them and floods customer support teams with repetitive questions. 

### 2. The Technical Solution (RAG Architecture)
To solve this, I implemented a **Retrieval-Augmented Generation (RAG)** pipeline. 
*   **Data Prep:** A Python/Flask backend extracts text from uploaded PDFs using `PyPDF2` and chops the text into small overlapping "chunks" to preserve context.
*   **Embeddings:** These chunks are sent to Google's Gemini REST API (`text-embedding-004`) to convert the text into high-dimensional vectors, which are stored in a local **ChromaDB** vector database.
*   **Retrieval:** When a user asks a question, it is converted into a vector. ChromaDB performs a "cosine similarity" search to instantly fetch the top 5 most mathematically relevant chunks from the PDF.
*   **Delivery (SSE):** Those chunks are passed to the **Gemini 2.0 Flash LLM** to synthesize a human-readable answer. I used Server-Sent Events (SSE) to stream the text back to the JavaScript frontend token-by-token, making it feel incredibly fast and responsive.

### 3. The Guardrails & Polish
In finance, AI hallucinations are dangerous. I built two major guardrails:
*   **The Semantic Domain Gate:** Before searching the database, the backend calculates the mathematical distance between the user's question and a hardcoded "loan domain" text anchor. If the question is outside the financial domain (e.g., "Write me a poem"), it is immediately blocked.
*   **Citation Validation:** The LLM is strictly prompted to base its answer *only* on the provided chunks. A validation step checks the AI's answer, and the UI explicitly displays the source file name and page number (e.g., *Source: HDFC.pdf, Page 12*) so the user can trust the output. 
*   **Deployment:** The heavy Python backend with its SQLite and ChromaDB databases was deployed inside a persistent Docker container on **Render**. The lightweight, fast Vanilla JS frontend was deployed to **Vercel** for lightning-fast global CDN delivery.

---

## Technical Highlights to Mention
1.  **Direct REST API for Embeddings:** Bypassed the standard Google Python SDK and made direct HTTP `requests.post()` calls to the Gemini API for embeddings to avoid SDK version conflicts and ensure highly stable routing.
2.  **Authentication & History:** Used SQLite and `Flask-JWT-Extended` to manage user accounts, allowing users to log in, save their chat history, and export conversations as formatted PDFs (using `ReportLab`). 
3.  **EMI Calculator:** Built a dynamic mathematical tool directly into the UI using standard compounding interest formulas to generate a month-by-month amortization schedule.
