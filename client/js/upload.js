/**
 * Upload Module — Handles PDF file upload via drag-and-drop and file picker
 */
const Upload = {
  uploadZone: null,
  fileInput: null,
  uploadContent: null,
  uploadProgress: null,
  progressFill: null,
  progressText: null,

  init() {
    this.uploadZone = document.getElementById("uploadZone");
    this.fileInput = document.getElementById("fileInput");
    this.uploadContent = document.getElementById("uploadContent");
    this.uploadProgress = document.getElementById("uploadProgress");
    this.progressFill = document.getElementById("progressFill");
    this.progressText = document.getElementById("progressText");

    this.setupEventListeners();
    this.loadDocuments();
  },

  setupEventListeners() {
    // Click to upload
    this.uploadZone.addEventListener("click", () => {
      this.fileInput.click();
    });

    // File selected
    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) this.handleUpload(file);
      this.fileInput.value = ""; // Reset input
    });

    // Drag and drop
    this.uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.uploadZone.classList.add("drag-over");
    });

    this.uploadZone.addEventListener("dragleave", () => {
      this.uploadZone.classList.remove("drag-over");
    });

    this.uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      this.uploadZone.classList.remove("drag-over");

      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.type !== "application/pdf") {
          Toast.show("Only PDF files are allowed.", "error");
          return;
        }
        this.handleUpload(file);
      }
    });

    // Clear button
    document.getElementById("clearBtn").addEventListener("click", async () => {
      if (!confirm("Clear all uploaded documents and data?")) return;

      try {
        await API.clearDocuments();
        this.renderDocumentList([]);
        this.updateStats({ totalChunks: 0, documentCount: 0 });
        Toast.show("All documents cleared.", "success");
      } catch (error) {
        Toast.show("Failed to clear documents.", "error");
      }
    });
  },

  /**
   * Handle file upload.
   */
  async handleUpload(file) {
    // Show progress
    this.uploadContent.classList.add("hidden");
    this.uploadProgress.classList.remove("hidden");
    this.progressFill.style.width = "0%";
    this.progressText.textContent = "Uploading...";

    try {
      // Simulate progress stages
      this.progressFill.style.width = "20%";
      this.progressText.textContent = "Uploading PDF...";

      await this.delay(300);
      this.progressFill.style.width = "40%";
      this.progressText.textContent = "Parsing document...";

      const result = await API.uploadDocument(file);

      this.progressFill.style.width = "80%";
      this.progressText.textContent = "Generating embeddings...";

      await this.delay(500);
      this.progressFill.style.width = "100%";
      this.progressText.textContent = "Complete!";

      await this.delay(800);

      Toast.show(
        `✅ "${file.name}" processed — ${result.details.chunks} chunks created`,
        "success"
      );

      // Refresh document list
      this.loadDocuments();
    } catch (error) {
      Toast.show(`Upload failed: ${error.message}`, "error");
    } finally {
      // Reset upload zone
      this.uploadContent.classList.remove("hidden");
      this.uploadProgress.classList.add("hidden");
    }
  },

  /**
   * Load and display documents from server.
   */
  async loadDocuments() {
    try {
      const data = await API.getDocuments();
      this.renderDocumentList(data.documents);
      this.updateStats(data.stats);
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  },

  /**
   * Render the document list in the sidebar.
   */
  renderDocumentList(documents) {
    const listEl = document.getElementById("documentList");

    if (!documents || documents.length === 0) {
      listEl.innerHTML =
        '<div class="no-documents">No documents uploaded yet</div>';
      return;
    }

    listEl.innerHTML = documents
      .map(
        (doc) => `
      <div class="document-item">
        <div class="doc-icon">PDF</div>
        <div class="doc-info">
          <div class="doc-name" title="${doc.name}">${doc.name}</div>
          <div class="doc-size">${this.formatSize(doc.size)}</div>
        </div>
      </div>
    `
      )
      .join("");
  },

  /**
   * Update the stats display.
   */
  updateStats(stats) {
    document.getElementById("statDocuments").textContent =
      stats.documentCount || 0;
    document.getElementById("statChunks").textContent =
      stats.totalChunks || 0;
  },

  /**
   * Format file size.
   */
  formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  },

  /**
   * Simple delay helper.
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};
