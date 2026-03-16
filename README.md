# RAG Chatbot

A full-stack AI chatbot that lets you upload PDF documents and ask questions about their content. Built with Django, React/TypeScript, sentence-transformers, ChromaDB, and Groq (LLaMA-3).

**Live demo:** _[Deploy to Railway and add URL here]_

---

## Features

- **PDF upload** with drag-and-drop and real-time processing status
- **Semantic search** via sentence-transformers (all-MiniLM-L6-v2, local, no cost)
- **Vector store** with ChromaDB (cosine similarity, persistent)
- **LLM responses** via Groq API (LLaMA-3 8B — free tier)
- **Source citations** — every answer shows the exact page excerpts used
- **Conversation history** — multi-turn conversations per document
- **Dark mode** toggle
- **Responsive** — works on mobile

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5 + Django REST Framework |
| Frontend | React 18 + TypeScript + Vite |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| Vector DB | ChromaDB (persistent) |
| LLM | Groq API — llama3-8b-8192 |
| PDF parsing | pdfplumber |
| State management | Zustand |
| Deploy | Railway |

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- A free [Groq API key](https://console.groq.com/)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set GROQ_API_KEY

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
# API available at http://localhost:8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional — Vite proxies /api to localhost:8000 by default)
cp .env.example .env

# Start dev server
npm run dev
# App available at http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health/` | Health check |
| `POST` | `/api/documents/upload/` | Upload a PDF |
| `GET` | `/api/documents/` | List all documents |
| `GET` | `/api/documents/{id}/` | Get document details & status |
| `DELETE` | `/api/documents/{id}/` | Delete document |
| `POST` | `/api/conversations/` | Create conversation (requires `document` ID) |
| `GET` | `/api/conversations/` | List all conversations |
| `GET` | `/api/conversations/{id}/` | Get conversation with messages |
| `DELETE` | `/api/conversations/{id}/` | Delete conversation |
| `POST` | `/api/conversations/{id}/messages/` | Send question, get RAG response |

### Example: Upload PDF

```bash
curl -X POST http://localhost:8000/api/documents/upload/ \
  -F "file=@document.pdf"
```

### Example: Send a question

```bash
curl -X POST http://localhost:8000/api/conversations/1/messages/ \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the main conclusions?"}'
```

---

## RAG Pipeline

```
PDF Upload
  └─► pdfplumber (extract text per page)
  └─► chunker.py (512-char chunks, 64-char overlap, hierarchical separators)
  └─► embedder.py (sentence-transformers → 384-dim vectors)
  └─► ChromaDB (persist with cosine similarity index)

User Question
  └─► embed_query() (same embedding model)
  └─► ChromaDB.query(top_k=5, threshold=0.3)
  └─► prompt_builder.py (system + context excerpts + history + question)
  └─► Groq API (llama3-8b-8192, temp=0.2, max_tokens=1024)
  └─► Save messages + return source_chunks
```

---

## Deploy to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create rag-chatbot --public --push
```

### 2. Create Railway project

1. Go to [railway.app](https://railway.app) and create a new project
2. Add a **Volume** and mount it at `/data` (for SQLite + ChromaDB persistence)

### 3. Backend service

1. Add service from GitHub repo → select the `backend/` root directory
2. Set environment variables:
   ```
   DJANGO_SETTINGS_MODULE=config.settings.production
   DJANGO_SECRET_KEY=<generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
   GROQ_API_KEY=<your-groq-key>
   ALLOWED_HOSTS=<your-backend-domain>.railway.app
   CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>.railway.app
   DB_PATH=/data/db.sqlite3
   VECTOR_STORE_PATH=/data/chroma_db
   MEDIA_ROOT=/data/media
   ```

### 4. Frontend service

1. Add service from same repo → select `frontend/` root directory
2. Set environment variables:
   ```
   VITE_API_BASE_URL=https://<your-backend-domain>.railway.app
   ```

### 5. Verify

- Backend health: `https://<backend>.railway.app/api/health/`
- Upload a PDF and verify status reaches `completed`
- Start a conversation and ask a question

---

## Project Structure

```
rag-chatbot/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Procfile
│   ├── railway.json
│   ├── nixpacks.toml
│   ├── config/
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── settings/
│   │       ├── base.py
│   │       ├── development.py
│   │       └── production.py
│   └── apps/
│       ├── documents/
│       │   ├── models.py          # Document model
│       │   ├── views.py           # Upload / list / delete
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   └── utils/
│       │       ├── pdf_processor.py  # pdfplumber extraction
│       │       ├── chunker.py        # Hierarchical text chunking
│       │       ├── embedder.py       # Singleton model + ChromaDB
│       │       └── tasks.py          # Pipeline orchestration
│       └── chat/
│           ├── models.py          # Conversation + Message
│           ├── views.py           # Chat + RAG endpoint
│           ├── serializers.py
│           ├── urls.py
│           └── utils/
│               ├── retriever.py      # Vector search
│               ├── prompt_builder.py # Prompt construction
│               └── groq_client.py    # Groq API wrapper
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    ├── railway.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/
        │   ├── client.ts
        │   ├── documents.ts
        │   └── conversations.ts
        ├── components/
        │   ├── Sidebar.tsx
        │   ├── DocumentUpload.tsx
        │   ├── DocumentList.tsx
        │   ├── ConversationList.tsx
        │   ├── ChatWindow.tsx
        │   ├── MessageBubble.tsx
        │   ├── ChatInput.tsx
        │   └── SourceCitations.tsx
        ├── hooks/
        │   ├── useDocuments.ts
        │   └── useChat.ts
        ├── store/
        │   └── useAppStore.ts
        ├── types/
        │   └── index.ts
        └── styles/
            └── global.css
```

---

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Django secret key | Required in prod |
| `DJANGO_SETTINGS_MODULE` | Settings module | `config.settings.development` |
| `GROQ_API_KEY` | Groq API key | Required |
| `ALLOWED_HOSTS` | Comma-separated hosts | `*` in dev |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins | All in dev |
| `DB_PATH` | SQLite file path | `./db.sqlite3` |
| `VECTOR_STORE_PATH` | ChromaDB directory | `./chroma_db` |
| `MEDIA_ROOT` | Uploaded files directory | `./media` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend URL | Proxied to `localhost:8000` |

---

## License

MIT
