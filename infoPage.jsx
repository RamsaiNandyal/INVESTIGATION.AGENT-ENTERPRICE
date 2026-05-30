import React from "react";
import logoIcon from "./icon/Enterprice.png";

export function InfoPage({ onClose }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#040816 0%,#080d28 55%,#060310 100%)", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", top: -300, left: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -300, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.05) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, borderBottom: "1px solid rgba(255,255,255,.1)", paddingBottom: 20 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "monospace", color: "#e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
              <img src={logoIcon} alt="Logo" style={{ width: 28, height: 28, objectFit: "contain" }} />
              <span>INVESTIGATE.AGENT</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(148,163,184,.55)", marginTop: 4 }}>
              Information & Guidelines
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 8,
              padding: "10px 16px",
              cursor: "pointer",
              color: "#94a3b8",
              fontSize: 14,
              fontFamily: "monospace"
            }}
          >
            ← Back
          </button>
        </div>

        {/* Main Content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 40 }}>
          {/* About Section */}
          <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "#a78bfa", marginBottom: 16 }}>
              <i className="ti ti-info-circle" style={{ marginRight: 8 }} />
              About Investigate Agent
            </div>
            <div style={{ fontSize: 13, color: "rgba(148,163,184,.75)", lineHeight: 1.8 }}>
              <p style={{ marginBottom: 12 }}>
                Investigate Agent is an enterprise AI-powered operations platform designed to monitor, diagnose, and resolve issues across your entire technology stack in real-time.
              </p>
              <p style={{ marginBottom: 12 }}>
                We integrate with 6 major enterprise data sources to provide unified visibility, intelligent diagnostics, and automated fixes for your infrastructure.
              </p>
              <p>
                Powered by advanced AI and machine learning, our platform transforms raw operational data into actionable intelligence.
              </p>
            </div>
          </div>

          {/* Key Features */}
          <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "#a78bfa", marginBottom: 16 }}>
              <i className="ti ti-star" style={{ marginRight: 8 }} />
              Key Features
            </div>
            <ul style={{ fontSize: 13, color: "rgba(148,163,184,.75)", lineHeight: 2 }}>
              <li>✅ Real-time monitoring from 6 enterprise sources</li>
              <li>✅ AI-powered issue detection & diagnostics</li>
              <li>✅ One-click auto-fix with code diffs</li>
              <li>✅ Natural language chat interface</li>
              <li>✅ Comprehensive dashboard & analytics</li>
              <li>✅ Alert management & notifications</li>
            </ul>
          </div>
        </div>

        {/* Integrated Sources */}
        <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: 28, marginBottom: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "#a78bfa", marginBottom: 16 }}>
            <i className="ti ti-plug-connected" style={{ marginRight: 8 }} />
            Integrated Enterprise Sources
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { icon: "ti-brand-github", name: "GitHub", desc: "Repos, PRs, CI/CD pipelines, commits" },
              { icon: "ti-database", name: "PostgreSQL", desc: "Database queries, performance metrics" },
              { icon: "ti-brand-slack", name: "Slack", desc: "Team channels, alerts, notifications" },
              { icon: "ti-activity", name: "Datadog", desc: "APM, metrics, performance monitoring" },
              { icon: "ti-clipboard-list", name: "Jira", desc: "Sprints, tickets, project management" },
              { icon: "ti-bug", name: "Sentry", desc: "Error tracking, exception monitoring" }
            ].map((source, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 24, color: "#a78bfa", marginBottom: 8 }}>
                  <i className={`ti ${source.icon}`} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>
                  {source.name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(148,163,184,.55)" }}>
                  {source.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Use */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 40 }}>
          <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "#a78bfa", marginBottom: 16 }}>
              <i className="ti ti-book" style={{ marginRight: 8 }} />
              Getting Started
            </div>
            <div style={{ fontSize: 13, color: "rgba(148,163,184,.75)", lineHeight: 2 }}>
              <p><strong>Step 1:</strong> Create your account or sign in</p>
              <p><strong>Step 2:</strong> Connect your GitHub repository</p>
              <p><strong>Step 3:</strong> Authenticate enterprise data sources</p>
              <p><strong>Step 4:</strong> Start monitoring and receive alerts</p>
              <p><strong>Step 5:</strong> Use AI Agent for insights and fixes</p>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "#a78bfa", marginBottom: 16 }}>
              <i className="ti ti-bulb" style={{ marginRight: 8 }} />
              Pro Tips
            </div>
            <div style={{ fontSize: 13, color: "rgba(148,163,184,.75)", lineHeight: 2 }}>
              <p>💡 Use natural language in the chat</p>
              <p>💡 Ask specific questions about issues</p>
              <p>💡 Review diffs before applying fixes</p>
              <p>💡 Check dashboard regularly</p>
              <p>💡 Enable notifications for alerts</p>
            </div>
          </div>
        </div>

        {/* Dashboard Guide */}
        <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: 28, marginBottom: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "#a78bfa", marginBottom: 16 }}>
            <i className="ti ti-layout-dashboard" style={{ marginRight: 8 }} />
            Dashboard Guide
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>📊 Real-time Metrics</div>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,.65)" }}>
                View live data from all connected sources including sources online, total events, average latency, and active issues.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>🏥 Source Health</div>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,.65)" }}>
                Monitor the status and latency of each enterprise source. Green = online, Yellow = warning, Red = error.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>⚠️ Recent Detections</div>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,.65)" }}>
                See all detected issues with severity levels. Click AUTO-FIX to apply AI-suggested solutions.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>📈 Latency Overview</div>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,.65)" }}>
                Track response times from each source. Watch for spikes that indicate performance degradation.
              </div>
            </div>
          </div>
        </div>

        {/* AI Agent Guide */}
        <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: 28, marginBottom: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "#a78bfa", marginBottom: 16 }}>
            <i className="ti ti-message-chatbot" style={{ marginRight: 8 }} />
            AI Agent Guide
          </div>
          <div style={{ fontSize: 13, color: "rgba(148,163,184,.75)", lineHeight: 1.8 }}>
            <p style={{ marginBottom: 12 }}>
              <strong>Natural Language Queries:</strong> Ask questions in plain English. The agent understands context and keywords.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong>Example Queries:</strong>
            </p>
            <ul style={{ marginLeft: 20, marginBottom: 12 }}>
              <li>• "Why did CI fail?"</li>
              <li>• "Fix the slow query"</li>
              <li>• "Show me open PRs"</li>
              <li>• "What's the memory leak?"</li>
              <li>• "Fix security vulnerability"</li>
            </ul>
            <p>
              <strong>Response Format:</strong> The agent provides technical analysis, root cause explanation, affected sources, and suggested fixes with code diffs.
            </p>
          </div>
        </div>

        {/* Best Practices */}
        <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "#a78bfa", marginBottom: 16 }}>
            <i className="ti ti-checklist" style={{ marginRight: 8 }} />
            Best Practices & Guidelines
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#86efac", marginBottom: 8 }}>✅ Do's</div>
              <ul style={{ fontSize: 12, color: "rgba(148,163,184,.65)", lineHeight: 1.8 }}>
                <li>• Review all suggested fixes before applying</li>
                <li>• Keep your repository updated</li>
                <li>• Monitor alerts regularly</li>
                <li>• Use specific keywords in queries</li>
                <li>• Check source health status</li>
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fca5a5", marginBottom: 8 }}>❌ Don'ts</div>
              <ul style={{ fontSize: 12, color: "rgba(148,163,184,.65)", lineHeight: 1.8 }}>
                <li>• Auto-apply critical production fixes</li>
                <li>• Ignore error alerts</li>
                <li>• Use weak repository credentials</li>
                <li>• Disconnect sources unexpectedly</li>
                <li>• Bypass security recommendations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.1)", textAlign: "center", color: "rgba(148,163,184,.45)", fontSize: 12 }}>
          <p>For more information, visit: <strong>docs.investigate.agent</strong></p>
          <p style={{ marginTop: 8 }}>Support: <strong>support@investigate.agent</strong></p>
          <p style={{ marginTop: 8 }}>© 2026 Investigate Agent. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
