import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

// ── Types ──────────────────────────────────────────────

interface Settings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  enableSelectionToolbar: boolean;
  enableReadingTracker: boolean;
  showNotifications: boolean;
}

const DEFAULTS: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  enableSelectionToolbar: true,
  enableReadingTracker: true,
  showNotifications: true,
};

// ── Styles ─────────────────────────────────────────────

const S = {
  page: {
    maxWidth: "640px",
    margin: "0 auto",
    padding: "40px 24px",
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#111827",
    background: "#F9FAFB",
    minHeight: "100vh",
  } as React.CSSProperties,
  header: {
    textAlign: "center" as const,
    marginBottom: "36px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "6px",
  } as React.CSSProperties,
  subtitle: { color: "#6B7280", fontSize: "14px" },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "14px",
    marginBottom: "32px",
  } as React.CSSProperties,
  statCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "18px 12px",
    textAlign: "center" as const,
    boxShadow: "0 1px 3px rgba(0,0,0,.06)",
    border: "1px solid #F3F4F6",
  },
  statIcon: { fontSize: "24px", marginBottom: "6px" },
  statValue: { fontSize: "22px", fontWeight: 700 },
  statLabel: {
    fontSize: "10px",
    color: "#9CA3AF",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginTop: "2px",
  },
  section: {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,.05)",
    border: "1px solid #F3F4F6",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "1px solid #F3F4F6",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  } as React.CSSProperties,
  label: { fontSize: "14px", color: "#374151" },
  numInput: {
    width: "80px",
    padding: "8px 12px",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    fontSize: "14px",
    textAlign: "center" as const,
    outline: "none",
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    paddingBottom: "16px",
    borderBottom: "1px solid #F9FAFB",
  } as React.CSSProperties,
  toggleLabel: { fontSize: "14px", fontWeight: 500, color: "#111827" },
  toggleDesc: { fontSize: "12px", color: "#9CA3AF", marginTop: "2px" },
  btnRow: { display: "flex", gap: "12px" } as React.CSSProperties,
  exportBtn: {
    padding: "10px 20px",
    background: "#F3F4F6",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    color: "#374151",
  } as React.CSSProperties,
  dangerBtn: {
    padding: "10px 20px",
    background: "#FEF2F2",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    color: "#DC2626",
  } as React.CSSProperties,
};

// ── Components ─────────────────────────────────────────

const Toggle: React.FC<{
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, desc, on, onChange }) => (
  <div style={S.toggleRow}>
    <div>
      <div style={S.toggleLabel}>{label}</div>
      <div style={S.toggleDesc}>{desc}</div>
    </div>
    <label
      style={{
        position: "relative",
        width: "44px",
        height: "24px",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
      />
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: on ? "#4F46E5" : "#D1D5DB",
          borderRadius: "12px",
          transition: "background .2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: on ? "22px" : "2px",
            top: "2px",
            width: "20px",
            height: "20px",
            background: "#fff",
            borderRadius: "50%",
            transition: "left .2s",
            boxShadow: "0 1px 3px rgba(0,0,0,.15)",
          }}
        />
      </span>
    </label>
  </div>
);

// ── Options Page ───────────────────────────────────────

const Options = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    chrome.storage.sync.get("ts_settings", (r) => {
      if (r.ts_settings) setSettings({ ...DEFAULTS, ...r.ts_settings });
    });

    chrome.storage.local.get(
      ["ts_vocabulary", "ts_notes", "ts_stats_history"],
      (r) => {
        const words = r.ts_vocabulary || [];
        const notes = r.ts_notes || [];
        const history = r.ts_stats_history || {};
        const days = Object.keys(history).length;
        let sessions = 0;
        for (const day of Object.values(history) as any[]) {
          sessions += day.sessionsCompleted || 0;
        }
        setStats({
          totalWords: words.length,
          totalNotes: notes.length,
          totalDays: days,
          totalSessions: sessions,
        });
      }
    );
  }, []);

  const save = () => {
    chrome.storage.sync.set({ ts_settings: settings }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const exportData = () => {
    chrome.storage.local.get(null, (result) => {
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `teachsmart-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const clearData = () => {
    if (
      confirm("Are you sure? This will delete all vocabulary, notes, and stats.")
    ) {
      chrome.storage.local.clear(() => {
        alert("All data cleared.");
        window.location.reload();
      });
    }
  };

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: val }));

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>TeachSmart Settings</h1>
        <p style={S.subtitle}>Customize your learning experience</p>
      </div>

      {stats && (
        <div style={S.statsGrid}>
          {[
            { icon: "📚", val: stats.totalWords, label: "Words Saved" },
            { icon: "📝", val: stats.totalNotes, label: "Notes" },
            { icon: "📅", val: stats.totalDays, label: "Study Days" },
            { icon: "🎯", val: stats.totalSessions, label: "Sessions" },
          ].map((s) => (
            <div key={s.label} style={S.statCard}>
              <div style={S.statIcon}>{s.icon}</div>
              <div style={S.statValue}>{s.val}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Timer */}
      <div style={S.section}>
        <h2 style={S.sectionTitle}>Pomodoro Timer</h2>
        {([
          ["Focus Duration (min)", "focusDuration", 1, 120] as const,
          ["Short Break (min)", "shortBreakDuration", 1, 30] as const,
          ["Long Break (min)", "longBreakDuration", 1, 60] as const,
        ]).map(([label, key, min, max]) => (
          <div key={key} style={S.row}>
            <label style={S.label}>{label}</label>
            <input
              type="number"
              value={settings[key]}
              min={min}
              max={max}
              onChange={(e) =>
                set(
                  key,
                  Math.min(max, Math.max(min, parseInt(e.target.value) || min))
                )
              }
              style={S.numInput}
            />
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={S.section}>
        <h2 style={S.sectionTitle}>Features</h2>
        <Toggle
          label="Selection Toolbar"
          desc="Show toolbar when selecting text on pages"
          on={settings.enableSelectionToolbar}
          onChange={(v) => set("enableSelectionToolbar", v)}
        />
        <Toggle
          label="Reading Tracker"
          desc="Track time spent reading pages"
          on={settings.enableReadingTracker}
          onChange={(v) => set("enableReadingTracker", v)}
        />
        <Toggle
          label="Notifications"
          desc="Show notifications when timer completes"
          on={settings.showNotifications}
          onChange={(v) => set("showNotifications", v)}
        />
      </div>

      {/* Data */}
      <div style={S.section}>
        <h2 style={S.sectionTitle}>Data Management</h2>
        <div style={S.btnRow}>
          <button onClick={exportData} style={S.exportBtn}>
            📦 Export Data
          </button>
          <button onClick={clearData} style={S.dangerBtn}>
            🗑 Clear All Data
          </button>
        </div>
      </div>

      {/* Save */}
      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <button
          onClick={save}
          style={{
            padding: "12px 44px",
            background: saved ? "#10B981" : "#4F46E5",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background .2s",
          }}
        >
          {saved ? "✓ Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

// ── Mount ──────────────────────────────────────────────

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
