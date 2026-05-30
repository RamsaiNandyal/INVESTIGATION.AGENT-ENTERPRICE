# 📊 DATABASE SETUP GUIDE - INVESTIGATE.AGENT

## What's New: Database Tracking System

Your INVESTIGATE.AGENT now has a complete **SQLite database** that tracks:

✅ **User Registration Data**
- Username, email, password
- When they signed up
- Their location (IP-based geolocation)
- Country and city
- Latitude/Longitude coordinates

✅ **Login History**
- When users log in
- Where they log in from (location, city, country)
- IP address
- Login success/failure status
- Timestamp

---

## Architecture

```
FRONTEND (React)
    ↓ Sign up/Login
BACKEND (Express.js)
    ↓ Registers/Logs in
SQLITE DATABASE (investigate-agent.db)
    ├─ users table (registration data)
    └─ login_history table (login attempts)
```

---

## Database Files Created

### 1. **database.js** - Core Database Module
- SQLite3 integration
- Geolocation lookup
- CRUD operations for users and logins
- Admin statistics functions

### 2. **adminDashboard.jsx** - Admin UI Component
- Beautiful dashboard showing all user registrations
- Complete login history with geo-tracking
- Statistics by country
- Real-time data refresh

### 3. **server.js** - Updated
- New endpoints:
  - `POST /api/auth/signup` - Register user & track location
  - `POST /api/auth/login` - Log login attempt & track location
  - `GET /api/admin/users` - List all registered users
  - `GET /api/admin/logins` - List all login attempts
  - `GET /api/admin/stats/dashboard` - Dashboard statistics

### 4. **App.jsx** - Updated
- Integrated database into auth flow
- Added ADMIN button in header
- Admin dashboard modal integration

---

## Features

### User Registration Tracking
When someone signs up:
1. Username, email, password stored
2. Registration timestamp recorded
3. User's location (from IP) captured:
   - Full location string (e.g., "New York, United States")
   - Country
   - City
   - Latitude/Longitude coordinates
4. IP address stored

### Login Tracking
When someone logs in:
1. Username and email recorded
2. Login timestamp stored
3. Location details captured (same as signup):
   - Location string
   - Country
   - City
   - Latitude/Longitude
4. IP address stored
5. Login status recorded (success/failed)

### Admin Dashboard
Access admin features from the **ADMIN** button in the header:
- See all registered users
- View login history with details
- Statistics by country
- Real-time data refresh
- Export-ready data

---

## How to Use

### 1. Start the Server
```bash
npm run server
```

The server will:
- Create SQLite database (investigate-agent.db)
- Initialize tables for users and login history
- Start listening on localhost:3001

### 2. Start the Frontend
```bash
npm run dev
```

### 3. Test User Registration
1. Open http://localhost:5173 (or your Vite port)
2. Go to signup
3. Create a test account
4. Check server console - you'll see:
   ```
   ✅ User registered: testuser from New York, United States
   ```

### 4. Access Admin Dashboard
1. After logging in, click the **ADMIN** button in the header
2. View all registered users
3. See login history with locations
4. Check statistics by country

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  signup_ip TEXT,
  signup_location TEXT,
  signup_country TEXT,
  signup_city TEXT,
  signup_latitude REAL,
  signup_longitude REAL,
  is_active BOOLEAN DEFAULT 1
)
```

### Login History Table
```sql
CREATE TABLE login_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT,
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  login_ip TEXT,
  login_location TEXT,
  login_country TEXT,
  login_city TEXT,
  login_latitude REAL,
  login_longitude REAL,
  login_status TEXT DEFAULT 'success'
)
```

---

## API Endpoints

### Authentication Endpoints

**POST /api/auth/signup**
```
Request: { username, email, password }
Response: { success: true, username, email }
Tracks: IP, location, timestamp
```

**POST /api/auth/login**
```
Request: { username, password }
Response: { success: true, username, email }
Tracks: IP, location, timestamp, status
```

### Admin Endpoints

**GET /api/admin/users**
```
Returns all registered users with signup location data
```

**GET /api/admin/logins?limit=100**
```
Returns login history (default 100 records)
Includes location and IP data
```

**GET /api/admin/logins/:username**
```
Returns login history for specific user
```

**GET /api/admin/stats/dashboard**
```
Returns dashboard statistics:
- Total user count
- Recent logins
- Signups by country
```

**GET /api/admin/stats/signups-by-country**
```
Returns signup statistics grouped by country
```

**GET /api/admin/stats/logins-by-country**
```
Returns login statistics grouped by country
```

---

## Example Data

### User Registration
```
Username: john_doe
Email: john@example.com
Signup Time: 2024-05-29 14:23:45
Signup Location: San Francisco, United States
Country: US
City: San Francisco
Latitude: 37.7749
Longitude: -122.4194
IP: 192.0.2.1
```

### Login Entry
```
Username: john_doe
Login Time: 2024-05-29 14:25:12
Login Location: San Francisco, United States
Country: US
City: San Francisco
Status: success
IP: 192.0.2.1
```

---

## Admin Dashboard Features

### Users Tab
- View all registered users
- See registration timestamp
- Check signup location
- View by country

### Login Tab
- See all login attempts
- Check location details for each login
- View IP addresses
- See success/failure status
- Sorted by most recent first

### Statistics
- Total user count
- Recent login activity
- Geographic distribution (signups by country)

---

## Security Notes

⚠️ **Important**: The admin endpoints are currently open without authentication.

For production use:
1. Add authentication to admin endpoints
2. Use password hashing (bcrypt recommended)
3. Implement rate limiting
4. Add audit logging
5. Use HTTPS for all connections

---

## Database File Location

```
Your Project/
└── investigate-agent.db (created when server starts)
```

The database file is SQLite format - you can view it with:
- SQLite Browser (GUI tool)
- Command line: `sqlite3 investigate-agent.db`
- Any SQLite viewer

---

## Troubleshooting

### Database file not created
- Make sure server.js has write permissions
- Check that port 3001 is available
- Look for errors in server console

### Geolocation not working
- Geolocation is IP-based (works with real IPs)
- Localhost/127.0.0.1 shows as "Local/Private Network"
- Requires internet connection for lookups

### Admin dashboard shows no data
- Make sure users have registered/logged in
- Check that server is running on localhost:3001
- Check browser console for network errors

### Users table already exists error
- This is normal on restart - database persists
- Delete investigate-agent.db to reset everything

---

## Next Steps

1. **Test the system:**
   - Create a test account
   - Log in with it
   - View data in admin dashboard

2. **Customize if needed:**
   - Edit database.js to change tracked fields
   - Modify adminDashboard.jsx for different UI
   - Add more admin endpoints

3. **For production:**
   - Switch to PostgreSQL or MySQL
   - Add proper authentication to admin endpoints
   - Implement access controls
   - Set up backups

---

## Accessing the Database Directly

### Using SQLite CLI
```bash
sqlite3 investigate-agent.db

# View all users
SELECT * FROM users;

# View login history
SELECT * FROM login_history;

# Get stats by country
SELECT signup_country, COUNT(*) FROM users GROUP BY signup_country;
```

### Using Python
```python
import sqlite3
conn = sqlite3.connect('investigate-agent.db')
cursor = conn.cursor()
cursor.execute('SELECT * FROM users')
users = cursor.fetchall()
for user in users:
    print(user)
conn.close()
```

---

## Key Functions in database.js

- `registerUser(username, email, password, ip)` - Record new user
- `logLogin(username, email, ip, status)` - Record login attempt
- `getUserByUsername(username)` - Get user data
- `getAllUsers()` - Get all users
- `getUserLoginHistory(username)` - Get user's logins
- `getAllLoginHistory(limit)` - Get recent logins
- `getSignupStatsByCountry()` - Stats by country
- `getLoginStatsByCountry()` - Login stats by country

---

**Your application now has complete user tracking with geographic data!** 🌍📊
