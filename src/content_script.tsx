// TeachSmart Content Script
// Injects study tools into web pages: selection toolbar, focus mode,
// reader mode, highlights, reading time tracker

(() => {
  if ((window as any).__teachsmart) return;
  (window as any).__teachsmart = true;

  const P = "ts-ext"; // CSS prefix to avoid collisions

  // ── Inject Styles ──────────────────────────────────────

  const css = document.createElement("style");
  css.textContent = `
/* Selection Toolbar */
.${P}-bar{position:fixed;z-index:2147483647;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.15),0 2px 6px rgba(0,0,0,.08);padding:5px;display:flex;gap:3px;animation:${P}-in .15s ease;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif}
@keyframes ${P}-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.${P}-btn{display:flex;align-items:center;gap:5px;padding:7px 11px;border:0;border-radius:8px;background:0 0;color:#374151;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .12s,color .12s;font-family:inherit}
.${P}-btn:hover{background:#F3F4F6;color:#111827}
.${P}-btn .i{font-size:15px}
.${P}-sep{width:1px;background:#E5E7EB;margin:4px 1px}

/* Dictionary Popup */
.${P}-dict{position:fixed;z-index:2147483647;background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.06);padding:20px;width:320px;max-height:340px;overflow-y:auto;animation:${P}-in .2s ease;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif}
.${P}-dict-w{font-size:20px;font-weight:700;color:#111827;margin-bottom:3px}
.${P}-dict-ph{font-size:13px;color:#6B7280;margin-bottom:8px}
.${P}-dict-pos{display:inline-block;font-size:11px;font-weight:600;color:#4F46E5;background:#EEF2FF;padding:2px 8px;border-radius:4px;margin-bottom:8px}
.${P}-dict-def{font-size:14px;color:#374151;line-height:1.6;margin-bottom:8px}
.${P}-dict-ex{font-size:13px;color:#6B7280;font-style:italic;border-left:3px solid #E5E7EB;padding-left:12px;margin-bottom:14px}
.${P}-dict-save{padding:8px 16px;background:#4F46E5;color:#fff;border:0;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;width:100%;transition:background .2s;font-family:inherit}
.${P}-dict-save:hover{background:#4338CA}
.${P}-dict-x{position:absolute;top:10px;right:12px;background:0 0;border:0;color:#9CA3AF;font-size:20px;cursor:pointer;padding:2px;line-height:1}
.${P}-dict-x:hover{color:#374151}

/* Note Popup */
.${P}-note{position:fixed;z-index:2147483647;background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.18);padding:20px;width:320px;animation:${P}-in .2s ease;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif}
.${P}-note h3{font-size:15px;font-weight:600;color:#111827;margin:0 0 10px}
.${P}-note-q{font-size:12px;color:#9CA3AF;font-style:italic;margin-bottom:10px;line-height:1.4}
.${P}-note textarea{width:100%;min-height:80px;border:1px solid #E5E7EB;border-radius:8px;padding:10px;font-size:13px;font-family:inherit;resize:vertical;outline:0;margin-bottom:12px;box-sizing:border-box;color:#111827}
.${P}-note textarea:focus{border-color:#818CF8;box-shadow:0 0 0 3px rgba(79,70,229,.1)}
.${P}-note-btns{display:flex;gap:8px;justify-content:flex-end}
.${P}-note-btns button{padding:8px 16px;border:0;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.${P}-note-btns .sv{background:#4F46E5;color:#fff}
.${P}-note-btns .sv:hover{background:#4338CA}
.${P}-note-btns .cn{background:#F3F4F6;color:#374151}
.${P}-note-btns .cn:hover{background:#E5E7EB}

/* Highlights */
.${P}-hl{background-color:#FEF08A!important;border-radius:2px;cursor:pointer;transition:background-color .2s}
.${P}-hl:hover{background-color:#FDE047!important}
.${P}-hl-green{background-color:#BBF7D0!important}.${P}-hl-green:hover{background-color:#86EFAC!important}
.${P}-hl-blue{background-color:#BFDBFE!important}.${P}-hl-blue:hover{background-color:#93C5FD!important}
.${P}-hl-pink{background-color:#FBCFE8!important}.${P}-hl-pink:hover{background-color:#F9A8D4!important}

/* Toast */
.${P}-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#111827;color:#fff;padding:10px 22px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:${P}-toast .3s ease;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif;pointer-events:none}
@keyframes ${P}-toast{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}

/* Focus Mode */
body.${P}-focus header,body.${P}-focus footer,body.${P}-focus nav,body.${P}-focus aside,
body.${P}-focus [role="banner"],body.${P}-focus [role="navigation"],body.${P}-focus [role="complementary"],body.${P}-focus [role="contentinfo"],
body.${P}-focus .sidebar,body.${P}-focus .ad,body.${P}-focus .ads,body.${P}-focus .advertisement,
body.${P}-focus [class*="sidebar"],body.${P}-focus [class*="banner"],body.${P}-focus [class*="cookie"],
body.${P}-focus [class*="popup"],body.${P}-focus [class*="modal"],body.${P}-focus [class*="newsletter"],
body.${P}-focus [id*="sidebar"],body.${P}-focus [id*="banner"],body.${P}-focus [id*="cookie"],
body.${P}-focus iframe[src*="ad"],body.${P}-focus [class*="social"],body.${P}-focus [class*="share"],
body.${P}-focus [class*="comment"]{display:none!important}

body.${P}-focus main,body.${P}-focus article,body.${P}-focus [role="main"],
body.${P}-focus .content,body.${P}-focus .post-content,body.${P}-focus .entry-content,body.${P}-focus .article-body{
  max-width:720px!important;margin:0 auto!important;padding:40px 24px!important;font-size:18px!important;line-height:1.8!important;color:#1a1a2e!important}

/* Reader Mode */
body.${P}-reader{background:#FFFBF0!important}
body.${P}-reader *{font-family:Georgia,'Times New Roman',serif!important}
body.${P}-reader main,body.${P}-reader article,body.${P}-reader [role="main"]{background:#FFFBF0!important}
`;
  document.head.appendChild(css);

  // ── State ──────────────────────────────────────────────

  let bar: HTMLElement | null = null;
  let dict: HTMLElement | null = null;
  let note: HTMLElement | null = null;
  let sel = "";
  let selRange: Range | null = null;
  let focusOn = false;
  let readerOn = false;
  let lastReport = Date.now();

  // ── Utilities ──────────────────────────────────────────

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2);

  function toast(text: string) {
    const old = document.querySelector(`.${P}-toast`);
    if (old) old.remove();
    const el = document.createElement("div");
    el.className = `${P}-toast`;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  function clearBar() {
    bar?.remove();
    bar = null;
  }
  function clearDict() {
    dict?.remove();
    dict = null;
  }
  function clearNote() {
    note?.remove();
    note = null;
  }
  function clearAll() {
    clearBar();
    clearDict();
    clearNote();
  }

  // ── Selection Toolbar ──────────────────────────────────

  function showBar(x: number, y: number) {
    clearAll();
    bar = document.createElement("div");
    bar.className = `${P}-bar`;

    const items: { icon: string; label: string; fn: () => void }[] = [
      { icon: "📖", label: "Define", fn: doDefine },
      { icon: "🖍", label: "Highlight", fn: doHighlight },
      { icon: "📝", label: "Note", fn: doNote },
      { icon: "💾", label: "Save", fn: doSave },
    ];

    items.forEach((item, i) => {
      if (i > 0) {
        const s = document.createElement("div");
        s.className = `${P}-sep`;
        bar!.appendChild(s);
      }
      const b = document.createElement("button");
      b.className = `${P}-btn`;
      b.innerHTML = `<span class="i">${item.icon}</span>${item.label}`;
      b.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.fn();
      });
      bar!.appendChild(b);
    });

    const w = 340;
    const left = Math.max(10, Math.min(x - w / 2, window.innerWidth - w - 10));
    bar.style.left = `${left}px`;
    bar.style.top = `${Math.max(10, y - 48)}px`;
    document.body.appendChild(bar);
  }

  // ── Define ─────────────────────────────────────────────

  function doDefine() {
    const word = sel.trim().split(/\s+/)[0];
    if (!word) return;
    clearBar();

    chrome.runtime.sendMessage(
      { type: "LOOKUP_WORD", word },
      (res: any) => {
        if (!res) return;
        showDict(res);
      }
    );
  }

  function showDict(data: any) {
    clearDict();
    dict = document.createElement("div");
    dict.className = `${P}-dict`;

    dict.innerHTML = `
      <button class="${P}-dict-x">&times;</button>
      <div class="${P}-dict-w">${esc(data.word || sel)}</div>
      ${data.phonetic ? `<div class="${P}-dict-ph">${esc(data.phonetic)}</div>` : ""}
      ${data.partOfSpeech ? `<div class="${P}-dict-pos">${esc(data.partOfSpeech)}</div>` : ""}
      <div class="${P}-dict-def">${esc(data.definition || "No definition found")}</div>
      ${data.example ? `<div class="${P}-dict-ex">&ldquo;${esc(data.example)}&rdquo;</div>` : ""}
      <button class="${P}-dict-save">💾 Save to Vocabulary</button>
    `;

    dict.style.left = `${(window.innerWidth - 320) / 2}px`;
    dict.style.top = `${Math.min(window.innerHeight * 0.25, 200)}px`;

    dict.querySelector(`.${P}-dict-x`)!.addEventListener("click", clearDict);
    dict.querySelector(`.${P}-dict-save`)!.addEventListener("click", () => {
      chrome.runtime.sendMessage(
        {
          type: "ADD_WORD",
          word: {
            id: uid(),
            word: data.word || sel.split(/\s+/)[0],
            definition: data.definition || "",
            context: sel,
            url: location.href,
            timestamp: Date.now(),
          },
        },
        () => {
          toast(`"${data.word || sel}" saved!`);
          clearDict();
        }
      );
    });

    document.body.appendChild(dict);
  }

  function esc(s: string): string {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  // ── Highlight ──────────────────────────────────────────

  function doHighlight() {
    clearBar();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    try {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.className = `${P}-hl`;
      const id = uid();
      span.dataset.tsId = id;
      range.surroundContents(span);
      selection.removeAllRanges();
      toast("Text highlighted!");

      chrome.runtime.sendMessage({
        type: "ADD_NOTE",
        note: {
          id,
          text: "",
          selectedText: sel,
          url: location.href,
          pageTitle: document.title,
          timestamp: Date.now(),
          color: "#FEF08A",
        },
      });
    } catch {
      toast("Cannot highlight this selection");
    }
  }

  // ── Note ───────────────────────────────────────────────

  function doNote() {
    clearBar();
    clearNote();

    note = document.createElement("div");
    note.className = `${P}-note`;

    const preview =
      sel.length > 100 ? sel.slice(0, 100) + "..." : sel;

    note.innerHTML = `
      <h3>Add Note</h3>
      <div class="${P}-note-q">&ldquo;${esc(preview)}&rdquo;</div>
      <textarea placeholder="Write your note here..."></textarea>
      <div class="${P}-note-btns">
        <button class="cn">Cancel</button>
        <button class="sv">Save Note</button>
      </div>
    `;

    note.style.left = `${(window.innerWidth - 320) / 2}px`;
    note.style.top = `${Math.min(window.innerHeight * 0.25, 200)}px`;

    const ta = note.querySelector("textarea")!;
    note.querySelector(".cn")!.addEventListener("click", clearNote);
    note.querySelector(".sv")!.addEventListener("click", () => {
      const text = ta.value.trim();
      if (!text) {
        ta.focus();
        return;
      }

      // Also highlight the text on page
      try {
        if (selRange) {
          const span = document.createElement("span");
          span.className = `${P}-hl ${P}-hl-blue`;
          selRange.surroundContents(span);
        }
      } catch {
        // complex range, skip highlighting
      }

      chrome.runtime.sendMessage(
        {
          type: "ADD_NOTE",
          note: {
            id: uid(),
            text,
            selectedText: sel,
            url: location.href,
            pageTitle: document.title,
            timestamp: Date.now(),
            color: "#BFDBFE",
          },
        },
        () => {
          toast("Note saved!");
          clearNote();
        }
      );
    });

    document.body.appendChild(note);
    setTimeout(() => ta.focus(), 50);
  }

  // ── Save Word ──────────────────────────────────────────

  function doSave() {
    clearBar();
    const text = sel.trim();
    if (!text) return;
    const word = text.split(/\s+/)[0];

    chrome.runtime.sendMessage({ type: "LOOKUP_WORD", word }, (res: any) => {
      chrome.runtime.sendMessage(
        {
          type: "ADD_WORD",
          word: {
            id: uid(),
            word: res?.word || word,
            definition: res?.definition || "",
            context: text,
            url: location.href,
            timestamp: Date.now(),
          },
        },
        () => toast(`"${res?.word || word}" saved to vocabulary!`)
      );
    });
  }

  // ── Focus / Reader Mode ────────────────────────────────

  function toggleFocus(): boolean {
    focusOn = !focusOn;
    document.body.classList.toggle(`${P}-focus`, focusOn);
    toast(focusOn ? "Focus mode ON — distractions hidden" : "Focus mode OFF");
    return focusOn;
  }

  function toggleReader(): boolean {
    readerOn = !readerOn;
    document.body.classList.toggle(`${P}-reader`, readerOn);
    toast(readerOn ? "Reader mode ON" : "Reader mode OFF");
    return readerOn;
  }

  // ── Reading Time Tracker ───────────────────────────────

  function reportTime() {
    const now = Date.now();
    const sec = Math.round((now - lastReport) / 1000);
    if (sec > 5 && sec < 300) {
      try {
        chrome.runtime.sendMessage({ type: "LOG_READING_TIME", seconds: sec });
      } catch {
        // extension context invalidated
      }
    }
    lastReport = now;
  }

  // ── Event Listeners ────────────────────────────────────

  document.addEventListener("mouseup", (e) => {
    const t = e.target as HTMLElement;
    if (
      t.closest(`.${P}-bar`) ||
      t.closest(`.${P}-dict`) ||
      t.closest(`.${P}-note`)
    )
      return;

    setTimeout(() => {
      const s = window.getSelection();
      const text = s?.toString().trim();
      if (text && text.length > 0 && text.length < 500) {
        sel = text;
        if (s && s.rangeCount > 0) selRange = s.getRangeAt(0).cloneRange();
        showBar(e.clientX, e.clientY);
      } else {
        clearBar();
      }
    }, 10);
  });

  document.addEventListener("mousedown", (e) => {
    const t = e.target as HTMLElement;
    if (
      !t.closest(`.${P}-bar`) &&
      !t.closest(`.${P}-dict`) &&
      !t.closest(`.${P}-note`)
    ) {
      clearAll();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") clearAll();
  });

  // Track page visit
  try {
    chrome.runtime.sendMessage({
      type: "LOG_PAGE_VISIT",
      url: location.href,
      title: document.title,
    });
  } catch {
    // extension context may be invalid
  }

  // Reading time reporting
  setInterval(reportTime, 30000);
  window.addEventListener("beforeunload", reportTime);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reportTime();
    else lastReport = Date.now();
  });

  // ── Message Listener ───────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    switch (msg.type) {
      case "TOGGLE_FOCUS":
        sendResponse({ active: toggleFocus() });
        break;
      case "TOGGLE_READER":
        sendResponse({ active: toggleReader() });
        break;
      case "SAVE_SELECTED_WORD":
        if (msg.text) sel = msg.text;
        doSave();
        sendResponse({ success: true });
        break;
      case "HIGHLIGHT_SELECTION":
        doHighlight();
        sendResponse({ success: true });
        break;
      case "ADD_NOTE_TO_SELECTION":
        if (msg.text) sel = msg.text;
        doNote();
        sendResponse({ success: true });
        break;
      case "CONTEXT_DEFINE":
        if (msg.text) sel = msg.text;
        doDefine();
        sendResponse({ success: true });
        break;
    }
    return true;
  });
})();
