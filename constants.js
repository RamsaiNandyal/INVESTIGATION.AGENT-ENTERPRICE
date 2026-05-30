// Source definitions for monitoring tools
export const SOURCE_DEFS = [
  { 
    id: "github", 
    name: "GitHub", 
    icon: "ti-brand-github", 
    color: "#a78bfa", 
    bg: "rgba(167,139,250,0.12)", 
    desc: "Repos · PRs · CI/CD" 
  },
  { 
    id: "postgres", 
    name: "PostgreSQL", 
    icon: "ti-database", 
    color: "#38bdf8", 
    bg: "rgba(56,189,248,0.12)", 
    desc: "Tables · Queries" 
  },
  { 
    id: "slack", 
    name: "Slack", 
    icon: "ti-brand-slack", 
    color: "#f472b6", 
    bg: "rgba(244,114,182,0.12)", 
    desc: "Channels · Alerts" 
  },
  { 
    id: "datadog", 
    name: "Datadog", 
    icon: "ti-activity", 
    color: "#fb923c", 
    bg: "rgba(251,146,60,0.12)", 
    desc: "APM · Metrics" 
  },
  { 
    id: "jira", 
    name: "Jira", 
    icon: "ti-clipboard-list", 
    color: "#60a5fa", 
    bg: "rgba(96,165,250,0.12)", 
    desc: "Sprints · Tickets" 
  },
  { 
    id: "sentry", 
    name: "Sentry", 
    icon: "ti-bug", 
    color: "#f87171", 
    bg: "rgba(248,113,113,0.12)", 
    desc: "Errors · Traces" 
  },
];

// Issue pool for demo/monitoring
export const ISSUE_POOL = [
  { 
    source: "github", 
    level: "error", 
    title: "CI Pipeline Failed", 
    body: "Build #487 failed on main — 3 test suites broken in auth/middleware", 
    fixable: true, 
    fixFile: "src/auth/middleware.ts", 
    fixDiff: "- const user = req.headers['authorization'];\n- if (!user) return res.status(401).send('Unauthorized');\n+ const token = req.headers['authorization']?.split(' ')[1];\n+ if (!token) return res.status(401).json({ error: 'Missing token' });\n+ const user = await verifyToken(token);\n  req.user = user;" 
  },
  { 
    source: "sentry", 
    level: "error", 
    title: "Unhandled Exception Spike", 
    body: "TypeError: Cannot read 'userId' of undefined — 340 occurrences / 10 min", 
    fixable: true, 
    fixFile: "src/api/users.ts", 
    fixDiff: "- const data = await db.query('SELECT * FROM users WHERE id=$1', [req.user.userId]);\n+ if (!req?.user?.userId) {\n+   return res.status(400).json({ error: 'Invalid session' });\n+ }\n+ const data = await db.query('SELECT * FROM users WHERE id=$1', [req.user.userId]);\n  res.json(data.rows[0] ?? null);" 
  },
  { 
    source: "postgres", 
    level: "warning", 
    title: "Slow Query Detected", 
    body: "JOIN on users+orders averaging 4.2 s — missing index on orders.user_id", 
    fixable: true, 
    fixFile: "migrations/0042_add_index.sql", 
    fixDiff: "+ CREATE INDEX CONCURRENTLY IF NOT EXISTS\n+   idx_orders_user_id ON orders(user_id);\n+\n+ ANALYZE orders;" 
  },
  { 
    source: "datadog", 
    level: "error", 
    title: "Error Rate > 5%", 
    body: "/api/checkout error rate hit 8.3% — upstream payment service timing out", 
    fixable: false 
  },
  { 
    source: "jira", 
    level: "warning", 
    title: "Sprint Blockers Found", 
    body: "4 P1 tickets unassigned · 2 PRs awaiting review > 72 hours", 
    fixable: false 
  },
  { 
    source: "slack", 
    level: "info", 
    title: "Deployment Notification", 
    body: "#deployments: v2.4.1 pushed to staging by @devbot — 12 files changed", 
    fixable: false 
  },
  { 
    source: "github", 
    level: "warning", 
    title: "Security Vulnerability", 
    body: "lodash 4.17.20 has CVE-2021-23337 (high severity) in package.json", 
    fixable: true, 
    fixFile: "package.json", 
    fixDiff: '-    "lodash": "^4.17.20",\n+    "lodash": "^4.17.21",' 
  },
  { 
    source: "postgres", 
    level: "error", 
    title: "Connection Pool Exhausted", 
    body: "Max 100 connections reached — 23 queries queued, response degraded", 
    fixable: true, 
    fixFile: "src/db/pool.ts", 
    fixDiff: "- max: 100,\n+ max: 20,\n+ idleTimeoutMillis: 30000,\n+ connectionTimeoutMillis: 2000," 
  },
  { 
    source: "sentry", 
    level: "warning", 
    title: "Memory Leak Detected", 
    body: "Heap growing 12 MB/hr on worker-3 — GC not reclaiming Promise chains", 
    fixable: true, 
    fixFile: "src/workers/processor.ts", 
    fixDiff: "-  tasks.forEach(t => this.handle(t));\n+  for (const t of tasks) {\n+    await this.handle(t);\n+    await new Promise(r => setImmediate(r));\n+  }\n+  tasks.length = 0;" 
  },
  { 
    source: "datadog", 
    level: "info", 
    title: "Latency Spike Resolved", 
    body: "p99 latency back to baseline (120 ms) after auto-scaling triggered", 
    fixable: false 
  },
];

let _id = 1;
export const mkIssue = (tpl) => ({ 
  ...tpl, 
  id: _id++, 
  time: new Date(), 
  status: "open", 
  fixed: false, 
  fixing: false 
});
