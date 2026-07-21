/**
 * Chat Module — Handles chat message rendering, streaming, skeleton, and feedback
 */
const Chat = {
  messagesEl: null,
  welcomeScreen: null,
  isProcessing: false,
  chatHistory: [], // Stores {role, content, timestamp} for export

  init() {
    this.messagesEl = document.getElementById("messages");
    this.welcomeScreen = document.getElementById("welcomeScreen");
  },

  /**
   * Load history from server
   */
  async loadHistory() {
    try {
      if (!API.getToken()) return;
      const data = await API.getChatHistory();
      if (data.history && data.history.length > 0) {
        this.hideWelcome();
        // Clear current messages
        const messages = this.messagesEl.querySelectorAll('.message');
        messages.forEach(m => m.remove());
        this.chatHistory = []; // Reset local memory

        for (const msg of data.history) {
          // Render user msg
          this.chatHistory.push({ role: "user", content: msg.question, timestamp: this.formatDbTime(msg.timestamp) });
          const uEl = document.createElement("div");
          uEl.className = "message user";
          uEl.innerHTML = `
            <div class="message-avatar">You</div>
            <div class="message-content">
              <div class="message-bubble">${this.escapeHtml(msg.question)}</div>
              <div class="message-time">${this.formatDbTime(msg.timestamp)}</div>
            </div>
          `;
          this.messagesEl.appendChild(uEl);

          // Render bot msg
          if (msg.answer) {
            this.chatHistory.push({ role: "bot", content: msg.answer, timestamp: this.formatDbTime(msg.timestamp) });
            const bEl = this._createBotMessageEl(msg.answer, [], null); // History doesn't save sources for now
            this.messagesEl.appendChild(bEl);
          }
        }
        this.scrollToBottom();
      }
    } catch (e) {
      console.log("Failed to load history:", e);
    }
  },

  formatDbTime(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  },

  /**
   * Add a user message to the chat.
   */
  addUserMessage(text) {
    this.hideWelcome();
    this.chatHistory.push({ role: "user", content: text, timestamp: this.getTimeString() });

    const messageEl = document.createElement("div");
    messageEl.className = "message user";
    messageEl.innerHTML = `
      <div class="message-avatar">You</div>
      <div class="message-content">
        <div class="message-bubble">${this.escapeHtml(text)}</div>
        <div class="message-time">${this.getTimeString()}</div>
      </div>
    `;
    this.messagesEl.appendChild(messageEl);
    this.scrollToBottom();
  },

  /**
   * Add a bot response to the chat (non-streaming).
   */
  addBotMessage(data) {
    this.removeTypingIndicator();
    this.chatHistory.push({ role: "bot", content: data.answer, timestamp: this.getTimeString() });

    const messageEl = this._createBotMessageEl(data.answer, data.sources, data.validation);
    this.messagesEl.appendChild(messageEl);
    this.scrollToBottom();
  },

  /**
   * Start a streaming bot message — returns an object with update() and finish() methods.
   */
  startStreamingMessage() {
    this.removeTypingIndicator();

    const messageEl = document.createElement("div");
    messageEl.className = "message bot";

    const bubbleEl = document.createElement("div");
    bubbleEl.className = "message-bubble";
    bubbleEl.innerHTML = '<span class="streaming-cursor">▌</span>';

    const contentEl = document.createElement("div");
    contentEl.className = "message-content";
    contentEl.appendChild(bubbleEl);

    const avatarEl = document.createElement("div");
    avatarEl.className = "message-avatar";
    avatarEl.textContent = "AI";

    messageEl.appendChild(avatarEl);
    messageEl.appendChild(contentEl);
    this.messagesEl.appendChild(messageEl);
    this.scrollToBottom();

    let fullText = "";

    return {
      update: (chunk) => {
        fullText += chunk;
        bubbleEl.innerHTML = this.formatMarkdown(fullText) + '<span class="streaming-cursor" style="color:var(--accent);animation:blink 0.7s infinite">▌</span>';
        this.scrollToBottom();
      },
      finish: (data) => {
        // Store in history
        this.chatHistory.push({ role: "bot", content: fullText, timestamp: this.getTimeString() });

        // Remove cursor and render final formatted content
        const formattedAnswer = this.formatMarkdown(fullText);

        // Build sources HTML
        let sourcesHtml = "";
        if (data.sources && data.sources.length > 0) {
          const sourceCards = data.sources.map(source => `
            <div class="source-card">
              <div class="source-header">
                <span class="source-name">📄 ${this.escapeHtml(source.fileName)} — Page ${source.pageNumber}</span>
                <span class="source-badge">${source.relevanceScore}% match</span>
              </div>
              <div class="source-excerpt">${this.escapeHtml(source.excerpt)}</div>
            </div>
          `).join("");
          sourcesHtml = `
            <div class="sources-section">
              <button class="sources-toggle" onclick="Chat.toggleSources(this)">
                <span class="arrow">▼</span> View ${data.sources.length} source(s)
              </button>
              <div class="sources-list">${sourceCards}</div>
            </div>
          `;
        }

        // Validation badge
        let validationHtml = "";
        if (data.validation) {
          const icons = { high: "✅", medium: "⚠️", low: "⚠️" };
          const labels = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" };
          validationHtml = `
            <span class="validation-badge ${data.validation.confidence}">
              ${icons[data.validation.confidence]} ${labels[data.validation.confidence]}
            </span>
          `;
        }

        // Feedback buttons
        const msgId = Date.now();
        const feedbackHtml = `
          <div class="feedback-row" data-msg-id="${msgId}">
            <button class="feedback-btn" onclick="Chat.handleFeedback(this, 'up', ${msgId})" title="Good response">👍</button>
            <button class="feedback-btn" onclick="Chat.handleFeedback(this, 'down', ${msgId})" title="Bad response">👎</button>
            <span class="feedback-label" id="feedbackLabel-${msgId}"></span>
          </div>
        `;

        contentEl.innerHTML = `
          <div class="message-bubble">${formattedAnswer}</div>
          ${validationHtml}
          ${feedbackHtml}
          ${sourcesHtml}
          <div class="message-time">${this.getTimeString()}</div>
        `;
        this.scrollToBottom();
      },
      getText: () => fullText,
    };
  },

  /**
   * Create a bot message element (used for non-streaming).
   */
  _createBotMessageEl(answer, sources, validation) {
    const messageEl = document.createElement("div");
    messageEl.className = "message bot";

    const formattedAnswer = this.formatMarkdown(answer);

    let sourcesHtml = "";
    if (sources && sources.length > 0) {
      const sourceCards = sources.map(source => `
        <div class="source-card">
          <div class="source-header">
            <span class="source-name">📄 ${this.escapeHtml(source.fileName)} — Page ${source.pageNumber}</span>
            <span class="source-badge">${source.relevanceScore}% match</span>
          </div>
          <div class="source-excerpt">${this.escapeHtml(source.excerpt)}</div>
        </div>
      `).join("");
      sourcesHtml = `
        <div class="sources-section">
          <button class="sources-toggle" onclick="Chat.toggleSources(this)">
            <span class="arrow">▼</span> View ${sources.length} source(s)
          </button>
          <div class="sources-list">${sourceCards}</div>
        </div>
      `;
    }

    let validationHtml = "";
    if (validation) {
      const icons = { high: "✅", medium: "⚠️", low: "⚠️" };
      const labels = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" };
      validationHtml = `
        <span class="validation-badge ${validation.confidence}">
          ${icons[validation.confidence]} ${labels[validation.confidence]}
        </span>
      `;
    }

    const msgId = Date.now();
    const feedbackHtml = `
      <div class="feedback-row" data-msg-id="${msgId}">
        <button class="feedback-btn" onclick="Chat.handleFeedback(this, 'up', ${msgId})" title="Good response">👍</button>
        <button class="feedback-btn" onclick="Chat.handleFeedback(this, 'down', ${msgId})" title="Bad response">👎</button>
        <span class="feedback-label" id="feedbackLabel-${msgId}"></span>
      </div>
    `;

    messageEl.innerHTML = `
      <div class="message-avatar">AI</div>
      <div class="message-content">
        <div class="message-bubble">${formattedAnswer}</div>
        ${validationHtml}
        ${feedbackHtml}
        ${sourcesHtml}
        <div class="message-time">${this.getTimeString()}</div>
      </div>
    `;
    return messageEl;
  },

  /**
   * Handle feedback button click.
   */
  async handleFeedback(btn, rating, msgId) {
    const row = btn.closest(".feedback-row");
    const allBtns = row.querySelectorAll(".feedback-btn");
    const label = document.getElementById(`feedbackLabel-${msgId}`);

    // Clear previous active states
    allBtns.forEach(b => b.classList.remove("active-up", "active-down"));

    // Set active state
    btn.classList.add(rating === "up" ? "active-up" : "active-down");
    label.textContent = rating === "up" ? "Thanks!" : "We'll improve!";

    // Get the most recent Q&A for context
    const lastQ = this.chatHistory.filter(m => m.role === "user").slice(-1)[0];
    const lastA = this.chatHistory.filter(m => m.role === "bot").slice(-1)[0];

    try {
      await API.sendFeedback(
        lastQ ? lastQ.content : "",
        lastA ? lastA.content : "",
        rating
      );
    } catch (e) {
      console.error("Feedback error:", e);
    }
  },

  /**
   * Add an error message.
   */
  addErrorMessage(errorText) {
    this.removeTypingIndicator();
    const messageEl = document.createElement("div");
    messageEl.className = "message bot";
    messageEl.innerHTML = `
      <div class="message-avatar">AI</div>
      <div class="message-content">
        <div class="message-bubble" style="border-color: var(--danger);">
          ❌ <strong>Error:</strong> ${this.escapeHtml(errorText)}
        </div>
        <div class="message-time">${this.getTimeString()}</div>
      </div>
    `;
    this.messagesEl.appendChild(messageEl);
    this.scrollToBottom();
  },

  /**
   * Show skeleton loading indicator.
   */
  showTypingIndicator() {
    const skeletonEl = document.createElement("div");
    skeletonEl.className = "skeleton-indicator";
    skeletonEl.id = "typingIndicator";
    skeletonEl.innerHTML = `
      <div class="message-avatar" style="background: var(--gradient-accent); color: white; width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; box-shadow: var(--shadow-glow);">AI</div>
      <div class="skeleton-bubble">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    `;
    this.messagesEl.appendChild(skeletonEl);
    this.scrollToBottom();
  },

  /**
   * Remove typing/skeleton indicator.
   */
  removeTypingIndicator() {
    const el = document.getElementById("typingIndicator");
    if (el) el.remove();
  },

  /**
   * Toggle source citations visibility.
   */
  toggleSources(button) {
    const sourcesList = button.nextElementSibling;
    const arrow = button.querySelector(".arrow");
    sourcesList.classList.toggle("visible");
    arrow.classList.toggle("open");
    arrow.textContent = sourcesList.classList.contains("visible") ? "▲" : "▼";
  },

  /**
   * Hide the welcome screen.
   */
  hideWelcome() {
    if (this.welcomeScreen) this.welcomeScreen.style.display = "none";
  },

  /**
   * Scroll to the bottom of the messages container.
   */
  scrollToBottom() {
    const container = document.getElementById("messagesContainer");
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
  },

  /**
   * Get formatted time string.
   */
  getTimeString() {
    return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  },

  /**
   * Enhanced markdown to HTML formatter.
   */
  formatMarkdown(text) {
    if (!text) return "";
    let html = this.escapeHtml(text);

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Italic
    html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
    // Inline code
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");
    // Horizontal Rule
    html = html.replace(/^---$/gm, '<hr class="chat-divider" />');
    // Page Badges: #### text
    html = html.replace(/^####\s+(.*?)$/gm, '<div class="page-badge"><span class="badge-dot"></span><span class="badge-text">$1</span></div>');
    // Section Banners: ### text
    html = html.replace(/^###\s+(.*?)$/gm, '<div class="section-banner"><span class="banner-title">$1</span></div>');
    // Headers
    html = html.replace(/^##\s+(.*?)$/gm, "<h2>$1</h2>");
    html = html.replace(/^#\s+(.*?)$/gm, "<h1>$1</h1>");
    // Unordered lists
    html = html.replace(/^[•*-]\s+(.*?)$/gm, "<li>$1</li>");
    // Ordered lists
    html = html.replace(/^\d+\.\s+(.*?)$/gm, "<li>$1</li>");
    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul class="chat-list">$1</ul>');
    // Paragraphs
    html = html.replace(/\n\n/g, "</p><p>");
    // Single newlines
    html = html.replace(/\n/g, "<br>");
    // Wrap in paragraph
    html = "<p>" + html + "</p>";
    // Clean up block elements wrapped in <p>
    html = html.replace(/<p>\s*(<div class="page-badge">.*?<\/div>)\s*<\/p>/g, "$1");
    html = html.replace(/<p>\s*(<div class="section-banner">.*?<\/div>)\s*<\/p>/g, "$1");
    html = html.replace(/<p>\s*(<hr class="chat-divider" \/>)\s*<\/p>/g, "$1");
    html = html.replace(/<p>\s*(<ul class="chat-list">.*?<\/ul>)\s*<\/p>/g, "$1");
    html = html.replace(/<p>\s*<\/p>/g, "");
    return html;
  },

  /**
   * Escape HTML special characters.
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },
};
