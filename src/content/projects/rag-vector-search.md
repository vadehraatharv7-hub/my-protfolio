---
title: "RAG + Vector Search System"
tagline: "High-performance embedding and retrieval pipeline with FAISS indexing, ChromaDB, and MongoDB storage."
description: "Architected and built an enterprise Retrieval-Augmented Generation (RAG) pipeline designed for low-latency contextual document search. Features chunking and embedding pipelines, FAISS vector indexing, ChromaDB semantic retrieval, and MongoDB metadata storage to power real-time AI assistant workflows."
category: "Distributed Systems"
technologies:
  - "Python"
  - "FastAPI"
  - "FAISS"
  - "ChromaDB"
  - "MongoDB"
  - "Docker"
  - "Embeddings"
github: "https://github.com/vadehraatharv7-hub"
order: 3
---

## Architectural Overview

Large Language Models (LLMs) suffer from hallucinations when queried about proprietary knowledge or changing internal documentation. This project implements a production-grade **Retrieval-Augmented Generation (RAG)** pipeline that indexes enterprise knowledge and retrieves semantically relevant context for an LLM at query time.

```text
[ Raw PDF / Docs ] ──► [ Text Splitter & Chunking ] ──► [ Embedding Generator ]
                                                                 │
                                ┌────────────────────────────────┴──────────────────┐
                                ▼                                                   ▼
                     [ FAISS Vector Index ]                             [ ChromaDB Collection ]
                                │                                                   │
                                └─────────────────┬─────────────────────────────────┘
                                                  ▼
                                      [ FastAPI Query Engine ]
                                                  │
                                                  ▼
                                  [ Context-Enriched LLM Output ]
```

---

## Core Ingestion & Retrieval Pipeline

1. **Document Ingestion & Chunking**: Recursive character splitting with dynamic overlap (500 tokens chunk / 50 tokens overlap) to preserve semantic continuity across sentences.
2. **FAISS Vector Indexing**: Utilizes `IndexHNSWFlat` for approximate nearest neighbor vector similarity, optimizing high-dimensional Euclidean distance calculations.
3. **ChromaDB & MongoDB Dual-Tier Storage**:
   - ChromaDB handles persistent vector embeddings and similarity scoring.
   - MongoDB preserves document metadata, access-control tags, and ingestion timestamps.

```python
# Embedding search module snippet
from fastapi import FastAPI, HTTPException
import chromadb
import numpy as np

app = FastAPI(title="RAG Semantic Retrieval Engine")
client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="knowledge_store")

@app.post("/query")
async def retrieve_context(query_embedding: list[float], top_k: int = 5):
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )
    return {
        "contexts": results["documents"][0],
        "sources": results["metadatas"][0],
        "scores": results["distances"][0]
    }
```

---

## Production Deployment & Security

- Packaged into multi-stage **Docker** images ensuring minimal attack surface.
- Hardened API endpoints with API key verification, rate limiting, and input sanitization to prevent prompt injection vectors.
