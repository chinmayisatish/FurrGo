/**
 * FurrGo Backend API Client
 * Configured via VITE_API_BASE_URL (defaults to Healthcare_Backend at http://localhost:8000)
 */

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

export interface ChatResponse {
  response: string;
  disclaimer: string;
  model: string;
  sources?: Array<{
    document_id: number;
    page_number?: number;
    chunk_index?: number;
  }>;
  file_processed?: boolean;
  file_type?: string;
}

export interface DocumentUploadResponse {
  message: string;
  document_id: number;
  filename: string;
  file_type: string;
  chunks_created: number;
}

/**
 * Send chat message to Healthcare_Backend (/api/chat)
 */
export async function sendChatMessage(
  message: string,
  documentId?: number | null,
  file?: File | null
): Promise<ChatResponse> {
  const url = `${API_BASE_URL}/api/chat`;

  if (file) {
    const formData = new FormData();
    formData.append("message", message);
    if (documentId) {
      formData.append("document_id", documentId.toString());
    }
    formData.append("file", file);

    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error (${res.status}): ${err}`);
    }
    return res.json();
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      document_id: documentId || null,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error (${res.status}): ${err}`);
  }

  return res.json();
}

/**
 * Upload medical document (PDF or image) to Healthcare_Backend (/api/documents)
 */
export async function uploadDocument(file: File): Promise<DocumentUploadResponse> {
  const url = `${API_BASE_URL}/api/documents`;
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload error (${res.status}): ${err}`);
  }

  return res.json();
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<{ status: string; service?: string }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json();
}
