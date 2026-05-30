import React, { useState } from "react";
import { SOURCE_DEFS } from "./constants.js";

// ── Dot indicator ──
export function Dot({ status, size = 8 }) {
  const c = { 
    online: "#22c55e", 
    warning: "#f59e0b", 
    error: "#ef4444", 
    offline: "#334155", 
    connecting: "#60a5fa" 
  };
  const col = c[status] || c.offline;
  return (
    <span style={{ 
      width: size, 
      height: size, 
      borderRadius: "50%", 
      display: "inline-block", 
      flexShrink: 0, 
      background: col, 
      boxShadow: (status === "online" || status === "error") ? `0 0 6px ${col}` : "none" 
    }} />
  );
}

// ── Spinning loader ──
export function Spin() {
  return (
    <i 
      className="ti ti-loader-2" 
      style={{ 
        display: "inline-block", 
        animation: "nexSpin 1s linear infinite" 
      }} 
    />
  );
}

// ── Animated dots ──
export function Dots() {
  return (
    <span style={{ 
      display: "inline-flex", 
      gap: 4, 
      alignItems: "center" 
    }}>
      {[0, 1, 2].map(i => (
        <span 
          key={i} 
          style={{ 
            width: 5, 
            height: 5, 
            borderRadius: "50%", 
            background: "rgba(167,139,250,0.9)", 
            animation: `nexPulse 1.2s ease-in-out ${i * 0.2}s infinite` 
          }} 
        />
      ))}
    </span>
  );
}

// ── Level badge ──
export function Badge({ level }) {
  const m = { 
    error: ["#fca5a5", "rgba(239,68,68,0.15)"], 
    warning: ["#fde68a", "rgba(245,158,11,0.13)"], 
    info: ["#93c5fd", "rgba(96,165,250,0.12)"] 
  };
  const [col, bg] = m[level] || m.info;
  return (
    <span style={{ 
      padding: "2px 8px", 
      borderRadius: 6, 
      fontSize: 10, 
      fontFamily: "monospace", 
      background: bg, 
      color: col, 
      fontWeight: 700, 
      textTransform: "uppercase", 
      letterSpacing: "0.06em" 
    }}>
      {level}
    </span>
  );
}

// ── Tool badge ──
export function ToolBadge({ id, status }) {
  const s = SOURCE_DEFS.find(x => x.id === id) || { 
    name: id, 
    icon: "ti-plug", 
    color: "#a78bfa", 
    bg: "rgba(167,139,250,0.12)" 
  };
  return (
    <span style={{ 
      display: "inline-flex", 
      alignItems: "center", 
      gap: 5, 
      padding: "3px 9px", 
      borderRadius: 20, 
      background: s.bg, 
      border: `1px solid ${s.color}40`, 
      fontSize: 11, 
      color: s.color, 
      fontFamily: "monospace" 
    }}>
      <i className={`ti ${s.icon}`} style={{ fontSize: 11 }} />
      {s.name}
      {status === "loading" ? <Dots /> : <i className="ti ti-check" style={{ fontSize: 10, color: "#22c55e" }} />}
    </span>
  );
}

// ── Latency bar ──
export function LatBar({ v, max = 200 }) {
  const pct = Math.min(100, (v / max) * 100);
  const col = v < 60 ? "#22c55e" : v < 120 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ 
      height: 5, 
      borderRadius: 3, 
      background: "rgba(255,255,255,0.07)", 
      flex: 1 
    }}>
      <div 
        style={{ 
          height: "100%", 
          width: pct + "%", 
          borderRadius: 3, 
          background: col, 
          transition: "width 0.6s" 
        }} 
      />
    </div>
  );
}

// ── Diff viewer ──
export function DiffView({ diff, file }) {
  return (
    <div style={{ 
      borderRadius: 10, 
      overflow: "hidden", 
      border: "1px solid rgba(167,139,250,0.25)", 
      marginTop: 10 
    }}>
      <div style={{ 
        padding: "7px 14px", 
        background: "rgba(167,139,250,0.08)", 
        borderBottom: "1px solid rgba(167,139,250,0.15)", 
        display: "flex", 
        alignItems: "center", 
        gap: 8 
      }}>
        <i className="ti ti-file-code" style={{ color: "#a78bfa", fontSize: 13 }} />
        <span style={{ 
          fontSize: 11, 
          fontFamily: "monospace", 
          color: "#a78bfa" 
        }}>
          {file}
        </span>
      </div>
      <pre style={{ 
        margin: 0, 
        padding: "12px 14px", 
        fontSize: 12, 
        fontFamily: "monospace", 
        background: "rgba(0,0,0,0.28)", 
        overflowX: "auto", 
        maxHeight: 200, 
        overflowY: "auto", 
        lineHeight: 1.65 
      }}>
        {diff.split("\n").map((ln, i) => (
          <div 
            key={i} 
            style={{ 
              color: ln.startsWith("+") ? "#86efac" : ln.startsWith("-") ? "#fca5a5" : ln.startsWith("@") ? "#93c5fd" : "#64748b", 
              background: ln.startsWith("+") ? "rgba(134,239,172,0.07)" : ln.startsWith("-") ? "rgba(252,165,165,0.07)" : "transparent", 
              paddingLeft: 4 
            }}>
            {ln || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}

// ── Alert popup ──
export function Popup({ alerts, onDismiss, onFix, onInvestigate }) {
  if (!alerts.length) return null;
  return (
    <div style={{ 
      position: "fixed", 
      bottom: 24, 
      right: 24, 
      zIndex: 9999, 
      display: "flex", 
      flexDirection: "column", 
      gap: 10, 
      maxWidth: 370, 
      pointerEvents: "all" 
    }}>
      {alerts.slice(0, 3).map(a => {
        const src = SOURCE_DEFS.find(s => s.id === a.source);
        const bc = a.level === "error" ? "rgba(239,68,68,0.5)" : a.level === "warning" ? "rgba(245,158,11,0.4)" : "rgba(96,165,250,0.3)";
        const ic = a.level === "error" ? "#f87171" : a.level === "warning" ? "#fbbf24" : "#60a5fa";
        const ibg = a.level === "error" ? "rgba(239,68,68,0.14)" : a.level === "warning" ? "rgba(245,158,11,0.12)" : "rgba(96,165,250,0.12)";
        return (
          <div 
            key={a.id} 
            style={{ 
              background: "rgba(8,10,28,0.95)", 
              backdropFilter: "blur(20px)", 
              border: `1px solid ${bc}`, 
              borderRadius: 14, 
              padding: "14px 16px", 
              animation: "nexSlide 0.35s cubic-bezier(0.34,1.56,0.64,1)" 
            }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-start", 
              marginBottom: 8 
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 9 
              }}>
                <div style={{ 
                  width: 30, 
                  height: 30, 
                  borderRadius: 8, 
                  background: ibg, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  <i className={`ti ${src?.icon || "ti-alert"}`} style={{ fontSize: 15, color: ic }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", fontFamily: "monospace" }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(148,163,184,0.55)" }}>
                    {src?.name} · just now
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onDismiss(a.id)} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "rgba(148,163,184,0.45)", 
                  cursor: "pointer", 
                  fontSize: 16, 
                  padding: 2, 
                  lineHeight: 1 
                }}>
                <i className="ti ti-x" />
              </button>
            </div>
            <p style={{ 
              fontSize: 12, 
              color: "rgba(148,163,184,0.8)", 
              margin: "0 0 10px", 
              lineHeight: 1.5 
            }}>
              {a.body}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {a.fixable && (
                <button 
                  onClick={() => onFix(a)} 
                  style={{ 
                    flex: 1, 
                    padding: "6px 10px", 
                    borderRadius: 8, 
                    border: "1px solid rgba(167,139,250,0.4)", 
                    background: "rgba(167,139,250,0.12)", 
                    color: "#a78bfa", 
                    fontSize: 11, 
                    cursor: "pointer", 
                    fontFamily: "monospace", 
                    fontWeight: 700 
                  }}>
                  <i className="ti ti-wand" style={{ marginRight: 5 }} />
                  AUTO-FIX
                </button>
              )}
              <button 
                onClick={() => onInvestigate(a)} 
                style={{ 
                  flex: 1, 
                  padding: "6px 10px", 
                  borderRadius: 8, 
                  border: "1px solid rgba(255,255,255,0.1)", 
                  background: "rgba(255,255,255,0.04)", 
                  color: "#94a3b8", 
                  fontSize: 11, 
                  cursor: "pointer", 
                  fontFamily: "monospace" 
                }}>
                <i className="ti ti-search" style={{ marginRight: 5 }} />
                INVESTIGATE
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Chat message ──
export function ChatMsg({ msg }) {
  const isU = msg.role === "user";
  const [fs, setFs] = useState("idle");
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: isU ? "flex-end" : "flex-start", 
      marginBottom: 18, 
      animation: "nexFade 0.3s ease" 
    }}>
      {!isU && msg.tools?.length > 0 && (
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 5, 
          marginBottom: 7, 
          maxWidth: "87%" 
        }}>
          {msg.tools.map((t, i) => <ToolBadge key={i} id={t.id} status={t.status} />)}
        </div>
      )}
      <div style={{ 
        maxWidth: "87%", 
        padding: "12px 16px", 
        borderRadius: isU ? "18px 18px 4px 18px" : "18px 18px 18px 4px", 
        background: isU ? "linear-gradient(135deg,rgba(124,58,237,0.75),rgba(99,102,241,0.72))" : "rgba(255,255,255,0.05)", 
        border: isU ? "none" : "1px solid rgba(255,255,255,0.09)", 
        fontSize: 14, 
        lineHeight: 1.65, 
        color: "#e2e8f0", 
        fontFamily: "'DM Sans',sans-serif", 
        whiteSpace: "pre-wrap" 
      }}>
        {msg.content || <Dots />}
      </div>
      {!isU && msg.fixDiff && msg.fixFile && (
        <div style={{ maxWidth: "87%", marginTop: 4 }}>
          <DiffView diff={msg.fixDiff} file={msg.fixFile} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {fs === "idle" && (
              <>
                <button 
                  onClick={() => setFs("applied")} 
                  style={{ 
                    padding: "7px 16px", 
                    borderRadius: 8, 
                    border: "1px solid rgba(34,197,94,0.35)", 
                    background: "rgba(34,197,94,0.1)", 
                    color: "#86efac", 
                    fontSize: 12, 
                    cursor: "pointer", 
                    fontFamily: "monospace", 
                    fontWeight: 700 
                  }}>
                  <i className="ti ti-check" style={{ marginRight: 5 }} />
                  APPLY FIX
                </button>
                <button 
                  onClick={() => setFs("rejected")} 
                  style={{ 
                    padding: "7px 16px", 
                    borderRadius: 8, 
                    border: "1px solid rgba(239,68,68,0.3)", 
                    background: "rgba(239,68,68,0.07)", 
                    color: "#fca5a5", 
                    fontSize: 12, 
                    cursor: "pointer", 
                    fontFamily: "monospace" 
                  }}>
                  <i className="ti ti-x" style={{ marginRight: 5 }} />
                  REJECT
                </button>
              </>
            )}
            {fs === "applied" && (
              <span style={{ fontSize: 12, color: "#86efac", fontFamily: "monospace" }}>
                <i className="ti ti-check" style={{ marginRight: 5 }} />
                Committed to fix/nexus-{Date.now().toString(36)}
              </span>
            )}
            {fs === "rejected" && (
              <span style={{ fontSize: 12, color: "#fca5a5", fontFamily: "monospace" }}>
                <i className="ti ti-x" style={{ marginRight: 5 }} />
                Fix rejected — issue kept open
              </span>
            )}
          </div>
        </div>
      )}
      <span style={{ 
        fontSize: 10, 
        color: "rgba(148,163,184,0.35)", 
        marginTop: 4, 
        fontFamily: "monospace" 
      }}>
        {msg.ts}
      </span>
    </div>
  );
}
