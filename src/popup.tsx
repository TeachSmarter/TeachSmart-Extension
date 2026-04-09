import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

// ── Types ──────────────────────────────────────────────

interface DailyStats {
  readingTimeSec: number;
  pagesVisited: number;
  wordsAdded: number;
  sessionsCompleted: number;
  streak: number;
}

interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  mode: "focus" | "shortBreak" | "longBreak";
  sessionsCompleted: number;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
}

interface VocabWord {
  id: string;
  word: string;
  definition: string;
  context: string;
  timestamp: number;
}

interface SavedNote {
  id: string;
  text: string;
  selectedText: string;
  pageTitle: string;
  timestamp: number;
  color: string;
}

type Tab = "dashboard" | "timer" | "vocab" | "notes";

// ── Helpers ────────────────────────────────────────────

const msg = (data: any): Promise<any> =>
  new Promise((resolve) => chrome.runtime.sendMessage(data, resolve));

const fmt = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const fmtReading = (sec: number): string => {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const ago = (ts: number): string => {
  const d = Math.floor((Date.now() - ts) / 60000);
  if (d < 1) return "Just now";
  if (d < 60) return `${d}m ago`;
  const h = Math.floor(d / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Dashboard ──────────────────────────────────────────

// ── Welcome ────────────────────────────────────────────

const Welcome: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <div className="ts-content" style={{ textAlign: "center", padding: "24px 20px" }}>
    <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎓</div>
    <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "#111827" }}>
      Welcome to TeachSmart!
    </h2>
    <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.7, marginBottom: "16px" }}>
      Your personal study companion. Here&apos;s how to get started:
    </p>
    <div style={{ textAlign: "left", fontSize: "13px", lineHeight: 2, color: "#374151", marginBottom: "20px" }}>
      <div>📖 <strong>Select text</strong> on any page to define, highlight, or save</div>
      <div>⏱ <strong>Use the Timer</strong> for focused Pomodoro study sessions</div>
      <div>🔒 <strong>Focus Mode</strong> hides distractions on any website</div>
      <div>📚 <strong>Build vocabulary</strong> by saving words as you read</div>
    </div>
    <button
      onClick={onDismiss}
      style={{
        padding: "10px 32px", background: "#4F46E5", color: "#fff",
        border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Get Started
    </button>
  </div>
);

// ── Weekly Progress Mini Bar ───────────────────────────

const WeeklyProgress: React.FC<{ history: Record<string, any> }> = ({ history }) => {
  const days: { label: string; value: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const stats = i === 0 ? null : history[key]; // today shown separately
    const val = stats ? (stats.readingTimeSec || 0) + (stats.sessionsCompleted || 0) * 60 : 0;
    days.push({ label: dayNames[d.getDay()], value: i === 0 ? -1 : val });
  }
  const maxVal = Math.max(1, ...days.map((d) => d.value));

  return (
    <div style={{ marginBottom: "16px" }}>
      <div className="ts-section-title">This Week</div>
      <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: "40px" }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                height: d.value < 0 ? "4px" : `${Math.max(4, (d.value / maxVal) * 32)}px`,
                background: d.value < 0 ? "#818CF8" : d.value > 0 ? "#4F46E5" : "#E5E7EB",
                borderRadius: "3px",
                transition: "height .3s ease",
                animation: d.value < 0 ? "ts-pulse 2s infinite" : "none",
              }}
            />
            <div style={{ fontSize: "9px", color: "#9CA3AF", marginTop: "4px", fontWeight: 500 }}>
              {d.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Dashboard ──────────────────────────────────────────

const Dashboard: React.FC<{
  stats: DailyStats;
  onToggleFocus: () => void;
  focusOn: boolean;
  weekHistory: Record<string, any>;
}> = ({ stats, onToggleFocus, focusOn, weekHistory }) => (
  <div className="ts-content">
    {stats.streak > 0 && (
      <div style={{ textAlign: "center" }}>
        <span className="ts-streak">🔥 {stats.streak} day streak!</span>
      </div>
    )}

    <div className="ts-stats-grid">
      <StatCard icon="⏱" value={fmtReading(stats.readingTimeSec)} label="Study Time" />
      <StatCard icon="📄" value={String(stats.pagesVisited)} label="Pages Read" />
      <StatCard icon="📚" value={String(stats.wordsAdded)} label="Words Saved" />
      <StatCard icon="🎯" value={String(stats.sessionsCompleted)} label="Focus Sessions" />
    </div>

    <WeeklyProgress history={weekHistory} />

    <div className="ts-section-title">Quick Actions</div>
    <div className="ts-actions">
      <button
        className={`ts-action-btn focus ${focusOn ? "on" : ""}`}
        onClick={onToggleFocus}
        aria-label="Toggle focus mode"
      >
        <span className="ts-action-icon">{focusOn ? "🔓" : "🔒"}</span>
        {focusOn ? "Exit Focus" : "Focus Mode"}
        <span className="ts-kbd">Alt+F</span>
      </button>
      <button
        className="ts-action-btn reader"
        onClick={() => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id)
              chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_READER" });
          });
        }}
        aria-label="Toggle reader mode"
      >
        <span className="ts-action-icon">📖</span>
        Reader Mode
      </button>
    </div>
  </div>
);

const StatCard: React.FC<{ icon: string; value: string; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <div className="ts-stat-card">
    <div className="ts-stat-icon">{icon}</div>
    <div className="ts-stat-value">{value}</div>
    <div className="ts-stat-label">{label}</div>
  </div>
);

// ── Timer ──────────────────────────────────────────────

const MODE_LABEL: Record<string, string> = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};
const MODE_COLOR: Record<string, string> = {
  focus: "#4F46E5",
  shortBreak: "#10B981",
  longBreak: "#F59E0B",
};

const Timer: React.FC = () => {
  const [t, setT] = useState<TimerState>({
    isRunning: false,
    timeRemaining: 25 * 60,
    mode: "focus",
    sessionsCompleted: 0,
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
  });

  useEffect(() => {
    const poll = () => msg({ type: "GET_TIMER" }).then((r) => r && setT(r));
    poll();
    // Only poll every second when running; slower when paused
    const id = setInterval(poll, t.isRunning ? 1000 : 3000);
    return () => clearInterval(id);
  }, [t.isRunning]);

  const totalByMode: Record<string, number> = {
    focus: t.focusDuration * 60,
    shortBreak: t.shortBreakDuration * 60,
    longBreak: t.longBreakDuration * 60,
  };
  const total = totalByMode[t.mode] || t.focusDuration * 60;
  const progress = (total - t.timeRemaining) / total;
  const R = 88;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - progress);
  const color = MODE_COLOR[t.mode];

  return (
    <div className="ts-timer-container">
      <div className="ts-timer-circle">
        <svg width="190" height="190">
          <circle
            cx="95" cy="95" r={R}
            fill="none" stroke="#F3F4F6" strokeWidth="5"
          />
          <circle
            cx="95" cy="95" r={R}
            fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className="ts-timer-time">{fmt(t.timeRemaining)}</span>
        <span className="ts-timer-label" style={{ color }}>
          {MODE_LABEL[t.mode]}
        </span>
      </div>

      <div className="ts-timer-controls">
        <button
          className="ts-timer-btn primary"
          style={{ background: color }}
          onClick={() => msg({ type: t.isRunning ? "PAUSE_TIMER" : "START_TIMER" })}
        >
          {t.isRunning ? "⏸ Pause" : "▶ Start"}
        </button>
        <button
          className="ts-timer-btn secondary"
          onClick={() => msg({ type: "RESET_TIMER" })}
        >
          ↺ Reset
        </button>
        <button
          className="ts-timer-btn skip"
          onClick={() => msg({ type: "SKIP_TIMER" })}
        >
          ⏭ Skip
        </button>
      </div>

      <div className="ts-timer-sessions">
        Sessions today: <strong>{t.sessionsCompleted}</strong>
      </div>
    </div>
  );
};

// ── Vocabulary ─────────────────────────────────────────

const Vocabulary: React.FC = () => {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    msg({ type: "GET_WORDS" }).then((r) => r && setWords(r));
  }, []);

  const del = (id: string) => {
    msg({ type: "DELETE_WORD", id });
    setWords((w) => w.filter((x) => x.id !== id));
  };

  const filtered = words.filter(
    (w) =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      (w.definition || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!words.length) {
    return (
      <div className="ts-content">
        <div className="ts-empty">
          <div className="ts-empty-icon">📚</div>
          <div className="ts-empty-text">
            No words saved yet.
            <br />
            Select text on any page and click <strong>Save</strong> to build
            your vocabulary!
          </div>
        </div>
      </div>
    );
  }

  const exportCSV = () => {
    const csv = "Word,Definition,Context\n" +
      words.map((w) =>
        `"${w.word.replace(/"/g, '""')}","${(w.definition || "").replace(/"/g, '""')}","${(w.context || "").replace(/"/g, '""')}"`
      ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teachsmart-vocab-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ts-content">
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input
          className="ts-search"
          placeholder="Search vocabulary..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search vocabulary"
          style={{ marginBottom: 0, flex: 1 }}
        />
        <button
          onClick={exportCSV}
          title="Export as CSV flashcards"
          style={{
            padding: "8px 12px", background: "#F3F4F6", border: "none",
            borderRadius: "8px", cursor: "pointer", fontSize: "14px",
            flexShrink: 0, color: "#374151",
          }}
        >
          📤
        </button>
      </div>
      <div className="ts-count">{filtered.length} of {words.length} words</div>
      <div className="ts-word-list">
        {filtered.map((w) => (
          <div key={w.id} className="ts-word-item">
            <button
              className="ts-word-delete"
              onClick={() => del(w.id)}
              title="Remove"
            >
              ×
            </button>
            <div className="ts-word-term">{w.word}</div>
            <div className="ts-word-definition">
              {w.definition || "No definition available"}
            </div>
            {w.context && (
              <div className="ts-word-meta">
                {ago(w.timestamp)} · &ldquo;
                {w.context.length > 60
                  ? w.context.slice(0, 60) + "..."
                  : w.context}
                &rdquo;
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Notes ──────────────────────────────────────────────

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    msg({ type: "GET_NOTES" }).then((r) => r && setNotes(r));
  }, []);

  const del = (id: string) => {
    msg({ type: "DELETE_NOTE", id });
    setNotes((n) => n.filter((x) => x.id !== id));
  };

  if (!notes.length) {
    return (
      <div className="ts-content">
        <div className="ts-empty">
          <div className="ts-empty-icon">📝</div>
          <div className="ts-empty-text">
            No notes yet.
            <br />
            Highlight text on any page and add notes to remember key insights!
          </div>
        </div>
      </div>
    );
  }

  const filtered = notes.filter(
    (n) =>
      (n.text || "").toLowerCase().includes(search.toLowerCase()) ||
      (n.selectedText || "").toLowerCase().includes(search.toLowerCase()) ||
      (n.pageTitle || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ts-content">
      <input
        className="ts-search"
        placeholder="Search notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search notes"
      />
      {filtered.map((n) => (
        <div
          key={n.id}
          className="ts-note-item"
          style={{ borderLeftColor: n.color || "#4F46E5" }}
        >
          <button
            className="ts-note-delete"
            onClick={() => del(n.id)}
            title="Remove"
          >
            ×
          </button>
          {n.selectedText && (
            <div className="ts-note-selected">
              &ldquo;
              {n.selectedText.length > 100
                ? n.selectedText.slice(0, 100) + "..."
                : n.selectedText}
              &rdquo;
            </div>
          )}
          {n.text && <div className="ts-note-text">{n.text}</div>}
          <div className="ts-note-source">
            {n.pageTitle || "Unknown page"} · {ago(n.timestamp)}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main Popup ─────────────────────────────────────────

const Popup = () => {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<DailyStats>({
    readingTimeSec: 0,
    pagesVisited: 0,
    wordsAdded: 0,
    sessionsCompleted: 0,
    streak: 0,
  });
  const [focusOn, setFocusOn] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [weekHistory, setWeekHistory] = useState<Record<string, any>>({});

  useEffect(() => {
    msg({ type: "GET_STATS" }).then((r) => r && setStats(r));
    msg({ type: "GET_WORDS" }).then((r) => r && setWordCount(r.length));
    msg({ type: "GET_NOTES" }).then((r) => r && setNoteCount(r.length));

    // Check first run
    chrome.storage.local.get(["ts_welcomed", "ts_stats_history"], (r) => {
      if (!r.ts_welcomed) setShowWelcome(true);
      setWeekHistory(r.ts_stats_history || {});
    });
  }, []);

  const toggleFocus = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "TOGGLE_FOCUS" },
          (res) => {
            if (res) setFocusOn(res.active);
          }
        );
      }
    });
  };

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: "dashboard", label: "Home", icon: "🏠" },
    { id: "timer", label: "Timer", icon: "⏱" },
    { id: "vocab", label: "Words", icon: "📚", badge: wordCount },
    { id: "notes", label: "Notes", icon: "📝", badge: noteCount },
  ];

  return (
    <div>
      <div className="ts-header">
        <h1>TeachSmart</h1>
        <p>Your Learning Companion</p>
      </div>

      <nav className="ts-nav" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`ts-nav-item ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
            role="tab"
            aria-selected={tab === t.id}
            aria-label={t.label}
          >
            <span className="ts-nav-icon">{t.icon}</span>
            <span style={{ position: "relative" }}>
              {t.label}
              {t.badge ? (
                <span className="ts-badge">{t.badge > 99 ? "99+" : t.badge}</span>
              ) : null}
            </span>
          </button>
        ))}
      </nav>

      {showWelcome ? (
        <Welcome onDismiss={() => {
          setShowWelcome(false);
          chrome.storage.local.set({ ts_welcomed: true });
        }} />
      ) : tab === "dashboard" ? (
        <Dashboard stats={stats} onToggleFocus={toggleFocus} focusOn={focusOn} weekHistory={weekHistory} />
      ) : null}
      {tab === "timer" && <Timer />}
      {tab === "vocab" && <Vocabulary />}
      {tab === "notes" && <Notes />}
    </div>
  );
};

// ── Mount ──────────────────────────────────────────────

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
