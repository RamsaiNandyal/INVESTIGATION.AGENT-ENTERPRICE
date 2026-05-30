import React, { useState } from "react";
import { Spin } from "./components.jsx";
import { sendEmail } from "./emailService.js";
import logoIcon from "./icon/Enterprice.png";

export function LoginPage({ onLogin, onSwitchToSignup, onSwitchToForgot, sessionId }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, sessionId })
      });
      const data = await response.json();
      if (response.ok) {
        onLogin({ username: data.username, email: data.email });
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Connection to backend server failed. Make sure server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#040816 0%,#080d28 55%,#060310 100%)", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ position: "fixed", top: -300, left: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      
      <div style={{ position: "relative", zIndex: 1, maxWidth: 420 }}>
        <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: 40 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 14,
                background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(124,58,237,0.3)"
              }}>
                <img src={logoIcon} alt="Logo" style={{ width: 38, height: 38, objectFit: "contain" }} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", background: "linear-gradient(135deg,#e2e8f0,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>
              INVESTIGATE.AGENT
            </div>
            <div style={{ fontSize: 12, color: "rgba(148,163,184,.65)" }}>Sign in to your account</div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 12, color: "#fca5a5", fontFamily: "monospace" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,.5)", fontFamily: "monospace", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>
                USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="nx-input"
                style={{ fontSize: 14 }}
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,.5)", fontFamily: "monospace", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="nx-input"
                style={{ fontSize: 14 }}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="nx-btn"
              style={{ padding: "12px 18px", width: "100%", marginTop: 8 }}
              disabled={loading}
            >
              {loading ? <><Spin /> Signing in...</> : <>Sign In</>}
            </button>
          </form>

          <div style={{ fontSize: 12, color: "rgba(148,163,184,.55)", marginTop: 20, textAlign: "center" }}>
            <button onClick={onSwitchToForgot} style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>
              Forgot Password?
            </button>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", marginTop: 20, paddingTop: 20, textAlign: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(148,163,184,.6)" }}>
              Don't have an account?{" "}
              <button onClick={onSwitchToSignup} style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontWeight: 700 }}>
                Create one
              </button>
            </span>
          </div>

          <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, padding: 12, marginTop: 20, fontSize: 11, color: "#93c5fd", fontFamily: "monospace", lineHeight: 1.6 }}>
            <strong>Demo Login:</strong><br />
            Username: demo<br />
            Password: demo123
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignupPage({ onSignup, onSwitchToLogin, sessionId }) {
  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          sessionId
        })
      });
      const data = await response.json();
      if (response.ok) {
        // Send welcome email
        const welcomeEmail = `Hello ${formData.username},

Welcome to INVESTIGATE.AGENT! 🚀

Your account has been successfully created. Here's what you can do now:

📊 DASHBOARD
- Monitor real-time metrics from 6 enterprise sources
- Track latency, events, and system health
- Get instant alerts for critical issues

🤖 AI AGENT
- Chat with our intelligent agent
- Ask questions about your infrastructure
- Get AI-powered diagnostics and recommendations

🔧 AUTO-FIX ENGINE
- Automatically diagnose issues
- Review suggested code fixes
- One-click deployment of solutions

🐛 ISSUE TRACKING
- All detected issues in one place
- Real-time monitoring across GitHub, PostgreSQL, Slack, Datadog, Jira, and Sentry
- Track fixes and historical data

GETTING STARTED:
1. Connect your GitHub repository
2. Authenticate your enterprise data sources
3. Start monitoring and get AI insights

TIPS:
- Use natural language to query issues
- Ask for specific fixes: "Fix the memory leak"
- Set up alerts for critical problems

For more information and guidelines, visit our Info & Guidelines page after login.

Best regards,
The Investigate Agent Team

Support: support@investigate.agent`;

        sendEmail(formData.email, "Welcome to INVESTIGATE.AGENT!", welcomeEmail);

        setFormData({ username: "", email: "", password: "", confirmPassword: "" });
        
        // Directly call onSignup
        onSignup({ username: data.username, email: data.email });
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup failed:", err);
      setError("Connection to backend server failed. Make sure server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#040816 0%,#080d28 55%,#060310 100%)", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ position: "fixed", top: -300, left: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      
      <div style={{ position: "relative", zIndex: 1, maxWidth: 420 }}>
        <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: 40 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 14,
                background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(124,58,237,0.3)"
              }}>
                <img src={logoIcon} alt="Logo" style={{ width: 38, height: 38, objectFit: "contain" }} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", background: "linear-gradient(135deg,#e2e8f0,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>
              Create Account
            </div>
            <div style={{ fontSize: 12, color: "rgba(148,163,184,.65)" }}>Join Investigate Agent today</div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 12, color: "#fca5a5", fontFamily: "monospace" }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 12, color: "#86efac", fontFamily: "monospace" }}>
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,.5)", fontFamily: "monospace", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>
                USERNAME
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                className="nx-input"
                style={{ fontSize: 14 }}
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,.5)", fontFamily: "monospace", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>
                EMAIL
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="nx-input"
                style={{ fontSize: 14 }}
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,.5)", fontFamily: "monospace", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>
                PASSWORD
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                className="nx-input"
                style={{ fontSize: 14 }}
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,.5)", fontFamily: "monospace", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="nx-input"
                style={{ fontSize: 14 }}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="nx-btn"
              style={{ padding: "12px 18px", width: "100%", marginTop: 8 }}
              disabled={loading}
            >
              {loading ? <><Spin /> Creating Account...</> : <>Create Account</>}
            </button>
          </form>

          <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", marginTop: 20, paddingTop: 20, textAlign: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(148,163,184,.6)" }}>
              Already have an account?{" "}
              <button onClick={onSwitchToLogin} style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontWeight: 700 }}>
                Sign in
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage({ onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const resetEmail = `Hello,

We received a request to reset your password for your Investigate Agent account.

To reset your password, click the link below:
https://investigate.agent/reset-password?token=abc123xyz

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
The Investigate Agent Team`;

    sendEmail(email, "Reset Your Investigate Agent Password", resetEmail);

    setSuccess("Password reset link has been sent to your email!");
    setLoading(false);
    setEmail("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#040816 0%,#080d28 55%,#060310 100%)", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ position: "fixed", top: -300, left: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      
      <div style={{ position: "relative", zIndex: 1, maxWidth: 420 }}>
        <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: 40 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 14,
                background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(124,58,237,0.3)"
              }}>
                <img src={logoIcon} alt="Logo" style={{ width: 38, height: 38, objectFit: "contain" }} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", background: "linear-gradient(135deg,#e2e8f0,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>
              Reset Password
            </div>
            <div style={{ fontSize: 12, color: "rgba(148,163,184,.65)" }}>Enter your email to receive reset instructions</div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 12, color: "#fca5a5", fontFamily: "monospace" }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 12, color: "#86efac", fontFamily: "monospace" }}>
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,.5)", fontFamily: "monospace", letterSpacing: ".1em", display: "block", marginBottom: 6 }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="nx-input"
                style={{ fontSize: 14 }}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="nx-btn"
              style={{ padding: "12px 18px", width: "100%", marginTop: 8 }}
              disabled={loading}
            >
              {loading ? <><Spin /> Sending...</> : <>Send Reset Link</>}
            </button>
          </form>

          <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", marginTop: 20, paddingTop: 20, textAlign: "center" }}>
            <button onClick={onSwitchToLogin} style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
