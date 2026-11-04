# tests/test_vector_store.py
"""Unit tests for the VectorStoreService.
These tests mock the underlying ChromaDB client to avoid filesystem side‑effects.
"""

import builtins
from typing import List, Dict, Any

import pytest

# Import the service and the singleton getter
from app.services.rag.vector_store import VectorStoreService, get_vector_store

# Simple in‑memory mock collection
class MockCollection:
    def __init__(self):
        self.records: List[Dict[str, Any]] = []

    def add(self, ids: List[str], documents: List[str], embeddings: List[List[float]], metadatas: List[Dict[str, Any]]):
        for i, rec_id in enumerate(ids):
            self.records.append({
                "id": rec_id,
                "document": documents[i],
                "embedding": embeddings[i],
                "metadata": metadatas[i],
            })

    def query(self, query_embeddings: List[List[float]], n_results: int = 5, where: Dict | None = None, include: List[str] | None = None):
        # Very naive similarity using Euclidean distance – sufficient for test behavior.
        q = query_embeddings[0]
        # Apply where clause if present (expecting format {"document_id": {"$in": [ids]}})
        filtered = self.records
        if where and "document_id" in where:
            ids = where["document_id"].get("$in", [])
            filtered = [r for r in filtered if r["metadata"].get("document_id") in ids]
        # Compute simple distance
        def distance(rec):
            return sum((a - b) ** 2 for a, b in zip(rec["embedding"], q))
        sorted_recs = sorted(filtered, key=distance)[:n_results]
        return {
            "documents": [[r["document"] for r in sorted_recs]],
            "metadatas": [[r["metadata"] for r in sorted_recs]],
            "distances": [[distance(r) for r in sorted_recs]],
        }

    def get(self, where: Dict, include: List[str] | None = None):
        doc_id = where.get("document_id")
        matches = [r for r in self.records if r["metadata"].get("document_id") == doc_id]
        return {
            "documents": [r["document"] for r in matches],
            "metadatas": [r["metadata"] for r in matches],
        }

    def delete(self, where: Dict):
        doc_id = where.get("document_id")
        self.records = [r for r in self.records if r["metadata"].get("document_id") != doc_id]

# Mock client that returns the same collection each time
class MockClient:
    def __init__(self, *_, **__):
        self._collection = MockCollection()

    def get_or_create_collection(self, name: str, metadata: Dict | None = None):
        return self._collection

# Patch chromadb.PersistentClient within the VectorStoreService module
@pytest.fixture(autouse=True)
def patch_chromadb(monkeypatch):
    import chromadb
    monkeypatch.setattr(chromadb, "PersistentClient", MockClient)
    # Also ensure settings.CHROMA_PERSIST_DIR points to a temporary dir to satisfy the constructor
    monkeypatch.setattr("app.core.config.settings.CHROMA_PERSIST_DIR", "./tmp_chroma", raising=False)

def test_add_and_retrieve_chunks():
    service = VectorStoreService()
    doc_id = 1
    chunks = ["chunk A", "chunk B"]
    embeddings = [[0.1, 0.2], [0.2, 0.1]]
    metadata = [{"source": "pdf"}, {"source": "pdf"}]
    service.add_chunks(document_id=doc_id, chunks=chunks, embeddings=embeddings, metadata=metadata)

    # Retrieve by document
    stored = service.get_document_chunks(document_id=doc_id)
    assert len(stored) == 2
    assert {c["content"] for c in stored} == set(chunks)

    # Similarity search – query close to first embedding
    results = service.similarity_search(query_embedding=[0.1, 0.2], k=1)
    assert len(results) == 1
    assert results[0]["content"] == "chunk A"

def test_empty_add_is_noop():
    service = VectorStoreService()
    service.add_chunks(document_id=2, chunks=[], embeddings=[], metadata=[])
    # Should not raise and collection stays empty
    assert service.get_document_chunks(document_id=2) == []

def test_filter_by_document_ids():
    service = VectorStoreService()
    # Add two documents
    service.add_chunks(1, ["doc1"], [[0.5, 0.5]], [{"foo": "bar"}])
    service.add_chunks(2, ["doc2"], [[0.6, 0.4]], [{"foo": "baz"}])
    # Query with filter for document 2 only
    results = service.similarity_search(query_embedding=[0.6, 0.4], k=5, document_ids=[2])
    assert len(results) == 1
    assert results[0]["metadata"]["document_id"] == 2

def test_delete_document():
    service = VectorStoreService()
    service.add_chunks(3, ["to delete"], [[0.1, 0.1]], [{}])
    assert service.get_document_chunks(3)
    service.delete_document(3)
    assert service.get_document_chunks(3) == []

def test_singleton_behaviour():
    # get_vector_store should always return the same instance
    first = get_vector_store()
    second = get_vector_store()
    assert first is second
