/**
 * API Service — Handles all fetch calls to the Python Flask backend
 */
const API = {
  BASE_URL: window.location.origin,

  /**
   * Send a chat question (non-streaming).
   */
  async sendMessage(question) {
    const response = await fetch(`${this.BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to get response");
    }
    return response.json();
  },

  /**
   * Stream a chat response via SSE (Server-Sent Events).
   */
  async streamMessage(question, onChunk, onDone, onError) {
    try {
      const response = await fetch(`${this.BASE_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Stream failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "chunk") {
                onChunk(data.content);
              } else if (data.type === "done") {
                onDone(data);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      if (onError) onError(error);
      else throw error;
    }
  },

  /**
   * Upload a PDF document.
   */
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append("document", file);
    const response = await fetch(`${this.BASE_URL}/api/documents/upload`, {
      method: "POST",
      headers: { "X-Admin-Key": window.ADMIN_KEY || "secret_admin_key_123" },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Upload failed");
    }
    return response.json();
  },

  /**
   * Get list of uploaded documents.
   */
  async getDocuments() {
    const response = await fetch(`${this.BASE_URL}/api/documents`);
    if (!response.ok) throw new Error("Failed to fetch documents");
    return response.json();
  },

  /**
   * Clear all documents and vectors.
   */
  async clearDocuments() {
    const response = await fetch(`${this.BASE_URL}/api/documents/clear`, {
      method: "DELETE",
      headers: { "X-Admin-Key": window.ADMIN_KEY || "secret_admin_key_123" },
    });
    if (!response.ok) throw new Error("Failed to clear documents");
    return response.json();
  },

  /**
   * Send user feedback (thumbs up/down).
   */
  async sendFeedback(question, answer, rating) {
    const response = await fetch(`${this.BASE_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, rating }),
    });
    if (!response.ok) throw new Error("Failed to send feedback");
    return response.json();
  },

  /**
   * Calculate EMI.
   */
  async calculateEMI(principal, rate, tenure) {
    const response = await fetch(`${this.BASE_URL}/api/emi/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ principal, rate, tenure }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "EMI calculation failed");
    }
    return response.json();
  },

  /**
   * Export chat as PDF.
   */
  async exportChatPDF(messages) {
    const response = await fetch(`${this.BASE_URL}/api/export/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!response.ok) throw new Error("Export failed");
    return response.blob();
  },
};
