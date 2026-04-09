// TeachSmart Background Service Worker
// Manages: Pomodoro timer, stats, vocabulary, notes, context menus

interface TimerState {
  isRunning: boolean;
  pausedRemaining: number; // seconds left when paused
  endTime: number; // ms timestamp when timer ends (valid when running)
  mode: "focus" | "shortBreak" | "longBreak";
  sessionsCompleted: number;
}

interface Settings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  enableSelectionToolbar: boolean;
  enableReadingTracker: boolean;
  showNotifications: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  enableSelectionToolbar: true,
  enableReadingTracker: true,
  showNotifications: true,
};

const LONG_BREAK_INTERVAL = 4;

let settings: Settings = { ...DEFAULT_SETTINGS };

// Load settings from storage, re-read on change
function loadSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get("ts_settings", (r) => {
      settings = { ...DEFAULT_SETTINGS, ...(r.ts_settings || {}) };
      resolve(settings);
    });
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.ts_settings) {
    settings = { ...DEFAULT_SETTINGS, ...(changes.ts_settings.newValue || {}) };
  }
});

// Duration helpers that read from live settings
function focusSec() { return settings.focusDuration * 60; }
function shortBreakSec() { return settings.shortBreakDuration * 60; }
function longBreakSec() { return settings.longBreakDuration * 60; }

let timer: TimerState = {
  isRunning: false,
  pausedRemaining: 25 * 60,
  endTime: 0,
  mode: "focus",
  sessionsCompleted: 0,
};

// ── Timer ──────────────────────────────────────────────

function getTimeRemaining(): number {
  if (timer.isRunning) {
    return Math.max(0, Math.round((timer.endTime - Date.now()) / 1000));
  }
  return timer.pausedRemaining;
}

function timerResponse() {
  return {
    isRunning: timer.isRunning,
    timeRemaining: getTimeRemaining(),
    mode: timer.mode,
    sessionsCompleted: timer.sessionsCompleted,
    focusDuration: settings.focusDuration,
    shortBreakDuration: settings.shortBreakDuration,
    longBreakDuration: settings.longBreakDuration,
  };
}

function startTimer() {
  const remaining = timer.isRunning ? getTimeRemaining() : timer.pausedRemaining;
  timer.isRunning = true;
  timer.endTime = Date.now() + remaining * 1000;
  chrome.alarms.create("ts-timer-complete", { when: timer.endTime });
  saveTimer();
  updateBadge();
}

function pauseTimer() {
  timer.pausedRemaining = getTimeRemaining();
  timer.isRunning = false;
  timer.endTime = 0;
  chrome.alarms.clear("ts-timer-complete");
  saveTimer();
  updateBadge();
}

function resetTimer() {
  timer.isRunning = false;
  timer.endTime = 0;
  timer.mode = "focus";
  timer.pausedRemaining = focusSec();
  chrome.alarms.clear("ts-timer-complete");
  saveTimer();
  updateBadge();
}

function skipTimer() {
  chrome.alarms.clear("ts-timer-complete");
  completeTimer();
}

function completeTimer() {
  timer.isRunning = false;
  timer.endTime = 0;

  if (timer.mode === "focus") {
    timer.sessionsCompleted++;
    updateStats({ sessionsCompleted: 1 });

    if (timer.sessionsCompleted % LONG_BREAK_INTERVAL === 0) {
      timer.mode = "longBreak";
      timer.pausedRemaining = longBreakSec();
    } else {
      timer.mode = "shortBreak";
      timer.pausedRemaining = shortBreakSec();
    }
  } else {
    timer.mode = "focus";
    timer.pausedRemaining = focusSec();
  }

  saveTimer();

  // Flash badge to show completion, then clear via alarm (setTimeout unreliable in SW)
  chrome.action.setBadgeText({ text: "done" });
  chrome.action.setBadgeBackgroundColor({ color: "#10B981" });
  chrome.alarms.create("ts-badge-clear", { delayInMinutes: 0.05 }); // ~3 seconds
}

function updateBadge() {
  if (timer.isRunning) {
    const remaining = getTimeRemaining();
    const minutes = Math.ceil(remaining / 60);
    chrome.action.setBadgeText({ text: `${minutes}m` });
    const color =
      timer.mode === "focus"
        ? "#4F46E5"
        : timer.mode === "shortBreak"
        ? "#10B981"
        : "#F59E0B";
    chrome.action.setBadgeBackgroundColor({ color });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

function saveTimer() {
  chrome.storage.local.set({ ts_timer: timer });
}

// ── Storage Lock (prevents concurrent read-modify-write races) ─────

let statsLock = false;
async function withStatsLock<T>(fn: () => Promise<T>): Promise<T> {
  while (statsLock) await new Promise((r) => setTimeout(r, 10));
  statsLock = true;
  try { return await fn(); }
  finally { statsLock = false; }
}

// ── Stats ──────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

async function getStats(): Promise<any> {
  return new Promise((resolve) => {
    const today = todayKey();
    chrome.storage.local.get(["ts_stats", "ts_stats_history"], (result) => {
      let stats = result.ts_stats;

      if (!stats || stats.date !== today) {
        const history = result.ts_stats_history || {};
        if (stats && stats.date) {
          history[stats.date] = stats;
        }

        // Calculate streak
        let streak = 0;
        const d = new Date();
        d.setDate(d.getDate() - 1);
        while (true) {
          const key = d.toISOString().split("T")[0];
          const day = history[key];
          if (
            day &&
            (day.readingTimeSec > 0 || day.sessionsCompleted > 0)
          ) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }

        stats = {
          date: today,
          readingTimeSec: 0,
          pagesVisited: 0,
          wordsAdded: 0,
          highlightsAdded: 0,
          sessionsCompleted: 0,
          streak,
        };
        chrome.storage.local.set({
          ts_stats: stats,
          ts_stats_history: history,
        });
      }

      resolve(stats);
    });
  });
}

function updateStats(updates: Record<string, number>) {
  withStatsLock(async () => {
    const stats = await getStats();
    const updated = { ...stats };
    for (const [key, value] of Object.entries(updates)) {
      if (typeof updated[key] === "number") {
        updated[key] += value;
      }
    }
    chrome.storage.local.set({ ts_stats: updated });
  });
}

// ── Vocabulary ─────────────────────────────────────────

async function getWords(): Promise<any[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get("ts_vocabulary", (result) => {
      resolve(result.ts_vocabulary || []);
    });
  });
}

async function addWord(word: any) {
  const words = await getWords();
  // Prevent duplicates (same word text, case-insensitive)
  const exists = words.some(
    (w: any) => w.word.toLowerCase() === (word.word || "").toLowerCase()
  );
  if (exists) {
    // Update existing word's definition if it was empty
    const idx = words.findIndex(
      (w: any) => w.word.toLowerCase() === (word.word || "").toLowerCase()
    );
    if (idx >= 0 && !words[idx].definition && word.definition) {
      words[idx].definition = word.definition;
      words[idx].timestamp = Date.now();
      chrome.storage.local.set({ ts_vocabulary: words });
    }
    return { duplicate: true };
  }
  words.unshift(word);
  // Cap at 1000 words to prevent storage overflow
  if (words.length > 1000) words.length = 1000;
  chrome.storage.local.set({ ts_vocabulary: words });
  updateStats({ wordsAdded: 1 });
  return { duplicate: false };
}

async function deleteWord(id: string) {
  const words = await getWords();
  chrome.storage.local.set({
    ts_vocabulary: words.filter((w: any) => w.id !== id),
  });
}

// ── Notes ──────────────────────────────────────────────

async function getNotes(): Promise<any[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get("ts_notes", (result) => {
      resolve(result.ts_notes || []);
    });
  });
}

async function addNote(note: any) {
  const notes = await getNotes();
  notes.unshift(note);
  // Cap at 500 notes to prevent storage overflow
  if (notes.length > 500) notes.length = 500;
  chrome.storage.local.set({ ts_notes: notes });
  updateStats({ highlightsAdded: 1 });
}

async function deleteNote(id: string) {
  const notes = await getNotes();
  chrome.storage.local.set({
    ts_notes: notes.filter((n: any) => n.id !== id),
  });
}

// ── Extension Lifecycle ────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ts-define",
    title: 'Define "%s"',
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "ts-highlight",
    title: "Highlight with TeachSmart",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "ts-save-word",
    title: "Save to Vocabulary",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "ts-add-note",
    title: "Add Note",
    contexts: ["selection"],
  });
});

// Alarm handler
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "ts-timer-complete") {
    completeTimer();
  }
  if (alarm.name === "ts-badge-clear") {
    updateBadge();
  }
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-timer") {
    if (timer.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }
  if (command === "toggle-focus") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_FOCUS" });
      }
    });
  }
});

// Context menu handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || !info.selectionText) return;
  const text = info.selectionText;

  switch (info.menuItemId) {
    case "ts-define":
      chrome.tabs.sendMessage(tab.id, {
        type: "CONTEXT_DEFINE",
        text,
      });
      break;
    case "ts-highlight":
      chrome.tabs.sendMessage(tab.id, { type: "HIGHLIGHT_SELECTION" });
      break;
    case "ts-save-word":
      chrome.tabs.sendMessage(tab.id, {
        type: "SAVE_SELECTED_WORD",
        text,
      });
      break;
    case "ts-add-note":
      chrome.tabs.sendMessage(tab.id, {
        type: "ADD_NOTE_TO_SELECTION",
        text,
      });
      break;
  }
});

// ── Message Handler ────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handle = async () => {
    switch (message.type) {
      // Timer
      case "GET_TIMER":
        if (timer.isRunning && getTimeRemaining() <= 0) completeTimer();
        return timerResponse();
      case "START_TIMER":
        startTimer();
        return timerResponse();
      case "PAUSE_TIMER":
        pauseTimer();
        return timerResponse();
      case "RESET_TIMER":
        resetTimer();
        return timerResponse();
      case "SKIP_TIMER":
        skipTimer();
        return timerResponse();

      // Stats
      case "GET_STATS":
        return await getStats();
      case "LOG_READING_TIME":
        updateStats({ readingTimeSec: message.seconds || 0 });
        return { success: true };
      case "LOG_PAGE_VISIT":
        updateStats({ pagesVisited: 1 });
        return { success: true };

      // Vocabulary
      case "GET_WORDS":
        return await getWords();
      case "ADD_WORD": {
        const result = await addWord(message.word);
        return { success: true, ...result };
      }
      case "DELETE_WORD":
        await deleteWord(message.id);
        return { success: true };

      // Notes
      case "GET_NOTES":
        return await getNotes();
      case "ADD_NOTE":
        await addNote(message.note);
        return { success: true };
      case "DELETE_NOTE":
        await deleteNote(message.id);
        return { success: true };

      // Settings
      case "GET_SETTINGS":
        return { ...settings };

      // Focus
      case "GET_FOCUS_STATE":
        return { active: false };

      // Dictionary lookup (free API) - returns multiple meanings
      case "LOOKUP_WORD": {
        const word = (message.word || "").trim().toLowerCase();
        if (!word) return { word: "", definition: "", meanings: [] };
        try {
          const resp = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
          );
          if (resp.ok) {
            const data = await resp.json();
            const entry = data[0];
            const meanings = (entry.meanings || []).slice(0, 3).map((m: any) => ({
              partOfSpeech: m.partOfSpeech || "",
              definition: m.definitions?.[0]?.definition || "",
              example: m.definitions?.[0]?.example || "",
            }));
            const first = meanings[0] || {};
            return {
              word: entry.word,
              phonetic: entry.phonetic || entry.phonetics?.[0]?.text || "",
              partOfSpeech: first.partOfSpeech,
              definition: first.definition || "No definition found",
              example: first.example || "",
              meanings,
            };
          }
          return { word, definition: "Definition not found", meanings: [] };
        } catch {
          return { word, definition: "Unable to look up word (offline?)", meanings: [] };
        }
      }

      default:
        return null;
    }
  };

  handle().then(sendResponse);
  return true; // async response
});

// ── Restore State on Startup ───────────────────────────

loadSettings().then(() => {
  // Update pausedRemaining if timer is idle at default focus
  if (!timer.isRunning && timer.mode === "focus") {
    timer.pausedRemaining = focusSec();
  }
});

chrome.storage.local.get("ts_timer", (result) => {
  if (result.ts_timer) {
    timer = result.ts_timer;
    if (timer.isRunning && timer.endTime <= Date.now()) {
      completeTimer();
    } else if (timer.isRunning) {
      chrome.alarms.create("ts-timer-complete", { when: timer.endTime });
      updateBadge();
    }
  }
});
