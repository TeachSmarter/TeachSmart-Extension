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

const Dashboard: React.FC<{
  stats: DailyStats;
  onToggleFocus: () => void;
  focusOn: boolean;
}> = ({ stats, onToggleFocus, focusOn }) => (
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

    <div className="ts-section-title">Quick Actions</div>
    <div className="ts-actions">
      <button
        className={`ts-action-btn focus ${focusOn ? "on" : ""}`}
        onClick={onToggleFocus}
      >
        <span className="ts-action-icon">{focusOn ? "🔓" : "🔒"}</span>
        {focusOn ? "Exit Focus" : "Focus Mode"}
      </button>
      <button
        className="ts-action-btn reader"
        onClick={() => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id)
              chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_READER" });
          });
        }}
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
const MODE_TOTAL: Record<string, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const Timer: React.FC = () => {
  const [t, setT] = useState<TimerState>({
    isRunning: false,
    timeRemaining: 25 * 60,
    mode: "focus",
    sessionsCompleted: 0,
  });

  useEffect(() => {
    const fetch = () => msg({ type: "GET_TIMER" }).then((r) => r && setT(r));
    fetch();
    const id = setInterval(fetch, 1000);
    return () => clearInterval(id);
  }, []);

  const total = MODE_TOTAL[t.mode] || 25 * 60;
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

  return (
    <div className="ts-content">
      <input
        className="ts-search"
        placeholder="Search vocabulary..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
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

  return (
    <div className="ts-content">
      {notes.map((n) => (
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

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home", icon: "🏠" },
  { id: "timer", label: "Timer", icon: "⏱" },
  { id: "vocab", label: "Words", icon: "📚" },
  { id: "notes", label: "Notes", icon: "📝" },
];

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

  useEffect(() => {
    msg({ type: "GET_STATS" }).then((r) => r && setStats(r));
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

  return (
    <div>
      <div className="ts-header">
        <h1>TeachSmart</h1>
        <p>Your Learning Companion</p>
      </div>

      <nav className="ts-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`ts-nav-item ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="ts-nav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "dashboard" && (
        <Dashboard stats={stats} onToggleFocus={toggleFocus} focusOn={focusOn} />
      )}
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
