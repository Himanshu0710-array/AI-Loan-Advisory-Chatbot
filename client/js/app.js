/**
 * Toast Notification System
 */
const Toast = {
  container: null,

  init() {
    this.container = document.createElement("div");
    this.container.className = "toast-container";
    document.body.appendChild(this.container);
  },

  show(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  },
};

/**
 * Main App — Initializes all modules and handles global events
 */
const App = {
  chatInput: null,
  sendBtn: null,
  chatForm: null,
  charCount: null,

  init() {
    Toast.init();
    Chat.init();
    Upload.init();

    this.chatInput = document.getElementById("chatInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.chatForm = document.getElementById("chatForm");
    this.charCount = document.getElementById("charCount");

    this.setupEventListeners();
    this.initTheme();
    this.initEMICalculator();
    console.log("🏦 AI Loan Advisory Chatbot (Enhanced) initialized");
  },

  setupEventListeners() {
    // Form submit
    this.chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSend();
    });

    // Input handling
    this.chatInput.addEventListener("input", () => {
      this.autoResizeTextarea();
      this.updateCharCount();
      this.sendBtn.disabled = !this.chatInput.value.trim();
    });

    // Enter to send (Shift+Enter for new line)
    this.chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Suggestion chips
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const question = chip.getAttribute("data-question");
        this.chatInput.value = question;
        this.sendBtn.disabled = false;
        this.handleSend();
      });
    });

    // Sidebar toggle (mobile)
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      let overlay = document.querySelector(".sidebar-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "sidebar-overlay";
        overlay.addEventListener("click", () => {
          sidebar.classList.remove("open");
          overlay.classList.remove("visible");
        });
        document.body.appendChild(overlay);
      }
      overlay.classList.toggle("visible");
    });

    // Theme toggle
    document.getElementById("themeToggleBtn").addEventListener("click", () => this.toggleTheme());

    // Export chat
    document.getElementById("exportChatBtn").addEventListener("click", () => this.handleExport());
  },

  /**
   * Send message with streaming.
   */
  async handleSend() {
    const question = this.chatInput.value.trim();
    if (!question || Chat.isProcessing) return;

    Chat.addUserMessage(question);
    this.chatInput.value = "";
    this.sendBtn.disabled = true;
    this.autoResizeTextarea();
    this.updateCharCount();

    Chat.isProcessing = true;
    Chat.showTypingIndicator();

    try {
      const stream = Chat.startStreamingMessage();

      await API.streamMessage(
        question,
        // onChunk
        (chunk) => {
          stream.update(chunk);
        },
        // onDone
        (data) => {
          stream.finish(data);
        },
        // onError
        (error) => {
          Chat.removeTypingIndicator();
          Chat.addErrorMessage(error.message || "Something went wrong. Please try again.");
        }
      );
    } catch (error) {
      Chat.addErrorMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      Chat.isProcessing = false;
    }
  },

  // ==================== Theme Toggle ====================

  initTheme() {
    const saved = localStorage.getItem("lms-theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    this.updateThemeIcons(saved);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("lms-theme", next);
    this.updateThemeIcons(next);
  },

  updateThemeIcons(theme) {
    const darkIcon = document.querySelector(".theme-icon-dark");
    const lightIcon = document.querySelector(".theme-icon-light");
    if (theme === "dark") {
      darkIcon.style.display = "";
      lightIcon.style.display = "none";
    } else {
      darkIcon.style.display = "none";
      lightIcon.style.display = "";
    }
  },

  // ==================== EMI Calculator ====================

  initEMICalculator() {
    const modal = document.getElementById("emiModal");
    const openBtn = document.getElementById("emiCalcBtn");
    const closeBtn = document.getElementById("emiModalClose");
    const calcBtn = document.getElementById("emiCalcSubmit");

    openBtn.addEventListener("click", () => modal.classList.add("visible"));
    closeBtn.addEventListener("click", () => modal.classList.remove("visible"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("visible");
    });

    calcBtn.addEventListener("click", async () => {
      const principal = parseFloat(document.getElementById("emiPrincipal").value);
      const rate = parseFloat(document.getElementById("emiRate").value);
      const tenure = parseInt(document.getElementById("emiTenure").value);

      if (!principal || !rate || !tenure) {
        Toast.show("Please fill in all fields.", "error");
        return;
      }

      try {
        const result = await API.calculateEMI(principal, rate, tenure);
        this.displayEMIResult(result);
      } catch (error) {
        Toast.show(`EMI Error: ${error.message}`, "error");
      }
    });
  },

  displayEMIResult(data) {
    const resultDiv = document.getElementById("emiResult");
    resultDiv.classList.remove("hidden");

    // Format currency
    const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

    document.getElementById("emiValue").textContent = fmt(data.emi);
    document.getElementById("emiInterest").textContent = fmt(data.totalInterest);
    document.getElementById("emiTotal").textContent = fmt(data.totalPayment);

    // Donut chart
    const principalPct = Math.round((data.principal / data.totalPayment) * 100);
    const interestPct = 100 - principalPct;
    const donut = document.getElementById("emiDonut");
    donut.style.background = `conic-gradient(var(--accent) 0% ${principalPct}%, var(--warning) ${principalPct}% 100%)`;
    document.getElementById("emiPrincipalPct").textContent = `${principalPct}%`;
  },

  // ==================== Export Chat ====================

  async handleExport() {
    if (Chat.chatHistory.length === 0) {
      Toast.show("No messages to export yet.", "info");
      return;
    }

    try {
      Toast.show("Generating PDF export...", "info");
      const blob = await API.exportChatPDF(Chat.chatHistory);

      // Download the blob
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "LMS_Chat_Export.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Toast.show("Chat exported successfully! ✅", "success");
    } catch (error) {
      Toast.show(`Export failed: ${error.message}`, "error");
    }
  },

  // ==================== Utility ====================

  autoResizeTextarea() {
    this.chatInput.style.height = "auto";
    this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + "px";
  },

  updateCharCount() {
    const count = this.chatInput.value.length;
    this.charCount.textContent = `${count} / 2000`;
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
