# 🚀 Production Deployment Guide - INVESTIGATE.AGENT

This guide describes how to deploy the **INVESTIGATE.AGENT** application (both React frontend and Express backend) in a production environment.

## 📐 Architecture Overview

In production, the application runs as a **single, unified service**:
1. **React Frontend**: Compiled using Vite (`npm run build`) into highly-optimized static HTML, CSS, and JS assets in the `dist/` directory.
2. **Express Backend**: Serves all `/api/*` endpoints and serves the static files from the `dist/` folder for any other routes.

This single-port architecture eliminates CORS issues, simplifies SSL/TLS certificate configuration, and minimizes resource usage.

```
┌────────────────────────────────────────────────────────┐
│               Production Host (Port: 3001)             │
│                                                        │
│ ┌──────────────────────┐      ┌──────────────────────┐ │
│ │  React SPA Frontend  │      │  Express API Server  │ │
│ │   (Served from dist) │ ───> │     (server.js)      │ │
│ └──────────────────────┘      └──────────────────────┘ │
│                                          │             │
└──────────────────────────────────────────┼─────────────┘
                                           ▼
                            ┌─────────────────────────────┐
                            │      Database Layer         │
                            │  PostgreSQL (Recommended)   │
                            │             OR              │
                            │      SQLite (Local File)    │
                            └─────────────────────────────┘
```

---

## 🔐 Environment Variables (.env)

Configure these variables on your production host or in your `.env` file. Do not commit your production `.env` file to version control.

| Variable | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | The port the Express server listens on | `3001` | `80` or `3001` |
| `DATABASE_URL` | PostgreSQL connection string (triggers Postgres mode) | *None* | `postgresql://user:pass@host:5432/dbname` |
| `SQLITE_DB_PATH` | Path to store the SQLite DB file (if Postgres not used) | `./investigate-agent.db` | `/app/data/investigate-agent.db` |
| `EMAIL_USER` | SMTP sender email address (Gmail) | *None* | `devops-alerts@gmail.com` |
| `EMAIL_PASS` | SMTP 16-character Gmail App Password | *None* | `abcd efgh ijkl mnop` |
| `ANTHROPIC_API_KEY` | Claude API key for intelligent diagnostics features | *None* | `sk-ant-api03-...` |

---

## 🐳 Deployment Method A: Docker & Docker Compose (Recommended)

Docker isolates the runtime environment, simplifies volume mounts for SQLite, and makes deployments fully repeatable.

### 1. Build and Run via Docker CLI

```bash
# 1. Build the production Docker image
docker build -t investigate-agent .

# 2. Run the container with environment file and volume
docker run -d \
  --name investigate-agent-app \
  -p 3001:3001 \
  --env-file .env \
  -v investigate-db:/app/data \
  -e SQLITE_DB_PATH=/app/data/investigate-agent.db \
  investigate-agent
```

### 2. Build and Run via Docker Compose

We have provided a [docker-compose.yml](file:///c:/Users/Ramsai%20Nandyal/OneDrive/Desktop/InvestigateG/docker-compose.yml) in the project root:

```bash
# Start the application in the background
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop the application
docker compose down
```

---

## ⚙️ Deployment Method B: Virtual Private Server (VPS) via PM2

If you are deploying directly to a Linux virtual machine (Ubuntu, Debian, CentOS) without Docker, use **PM2** to run the app in the background and manage restarts.

### 1. Prepare Server
Ensure Node.js (v18+) is installed on your server, then install PM2 globally:
```bash
sudo npm install -g pm2
```

### 2. Clone and Install Dependencies
```bash
git clone <your-repository-url>
cd InvestigateG
npm install
```

### 3. Build and Start
We have configured an [ecosystem.config.cjs](file:///c:/Users/Ramsai%20Nandyal/OneDrive/Desktop/InvestigateG/ecosystem.config.cjs) that manages the processes:

```bash
# 1. Compile frontend React app
npm run build

# 2. Start backend server using PM2
pm2 start ecosystem.config.cjs --env production

# 3. Configure PM2 to restart the app on server reboot
pm2 startup
pm2 save
```

*Note: Since SQLite database files can only handle a single write lock at a time, PM2 is configured to run in single-instance `fork` mode by default. If you configure PostgreSQL, you can change `instances` to `max` and `exec_mode` to `cluster` inside `ecosystem.config.cjs` to scale across multiple CPU cores.*

---

## ☁️ Deployment Method C: Cloud Platforms (Render, Railway, Fly.io)

For fully managed cloud platforms, use the following configurations:

### 1. Railway Deployment (Fastest)
1. Link your GitHub repository to [Railway.app](https://railway.app).
2. Railway will automatically detect the `Dockerfile` and build it.
3. In the Railway dashboard under **Variables**, add all production environment variables (e.g. `PORT`, `EMAIL_USER`, `EMAIL_PASS`, `ANTHROPIC_API_KEY`).
4. (Optional) If using PostgreSQL, create a PostgreSQL database in Railway and map its reference connection string to the `DATABASE_URL` variable.

### 2. Render Deployment
1. Go to [Render](https://render.com) and create a **Web Service**.
2. Connect your GitHub repository.
3. Choose the **Runtime** as `Docker` (or Node if you want to run it bare-metal).
   - If using Node Runtime:
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
4. Set the port environment variable `PORT` to `3001` (or Render's dynamic port).
5. Link a Persistent Disk to `/app/data` (if using SQLite) and configure `SQLITE_DB_PATH=/app/data/investigate-agent.db`.

---

## 🛢️ Database Maintenance & Migration

- **Auto-Initialization**: The backend database module (`database.js`) executes migrations automatically on startup to build the required tables (`users`, `login_history`, and `page_sessions`) and add indexes. No manual DB setup is needed.
- **SQLite vs. PostgreSQL**: SQLite is used by default for local development. For production deployments with high volume, configure a PostgreSQL database URL to scale seamlessly.
