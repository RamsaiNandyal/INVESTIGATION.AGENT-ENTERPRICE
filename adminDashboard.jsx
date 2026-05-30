// Admin Dashboard - View Users and Login History
import React, { useState, useEffect } from 'react';
import logoIcon from "./icon/Enterprice.png";

export function AdminDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logins, setLogins] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data
      const [usersRes, loginsRes, statsRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/logins?limit=50'),
        fetch('/api/admin/stats/dashboard'),
        fetch('/api/admin/sessions?limit=50')
      ]);

      const usersData = await usersRes.json();
      const loginsData = await loginsRes.json();
      const statsData = await statsRes.json();
      const sessionsData = await sessionsRes.json();

      setUsers(usersData.users || []);
      setLogins(loginsData.logins || []);
      setStats(statsData);
      setSessions(sessionsData.sessions || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) return '—';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#040816 0%,#080d28 55%,#060310 100%)',
    color: '#e2e8f0',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #6b21a8'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#a78bfa'
  };

  const closeButtonStyle = {
    background: '#6b21a8',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const tabsStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid #4c1d95'
  };

  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    background: isActive ? '#6b21a8' : 'transparent',
    color: isActive ? '#fff' : '#9ca3af',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    borderBottom: isActive ? '3px solid #a78bfa' : 'none',
    transition: 'all 0.3s'
  });

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px'
  };

  const thStyle = {
    background: '#1e1b4b',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #6b21a8',
    color: '#a78bfa',
    fontWeight: '600',
    fontSize: '13px'
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #4c1d95',
    fontSize: '13px'
  };

  const statBoxStyle = {
    display: 'inline-block',
    background: '#1e1b4b',
    padding: '20px',
    borderRadius: '8px',
    margin: '10px',
    minWidth: '150px',
    border: '1px solid #6b21a8'
  };

  const statNumberStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#a78bfa'
  };

  const statLabelStyle = {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '5px'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={{ ...titleStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoIcon} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <span>INVESTIGATE.AGENT - Admin Dashboard</span>
          </div>
          <button style={closeButtonStyle} onClick={onClose}>Close</button>
        </div>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={titleStyle}>⚠️ Error Loading Dashboard</div>
          <button style={closeButtonStyle} onClick={onClose}>Close</button>
        </div>
        <div style={{ color: '#f87171' }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ ...titleStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logoIcon} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span>INVESTIGATE.AGENT - Admin Dashboard</span>
        </div>
        <button style={closeButtonStyle} onClick={onClose}>Close</button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '18px', color: '#a78bfa', marginBottom: '15px', fontWeight: '600' }}>
            📈 Overview
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <div style={statBoxStyle}>
              <div style={statNumberStyle}>{stats.totalUsers}</div>
              <div style={statLabelStyle}>Total Users</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statNumberStyle}>{stats.recentLogins?.length || 0}</div>
              <div style={statLabelStyle}>Recent Logins (Last 10)</div>
            </div>
            {stats.sessionStats && (
              <>
                <div style={statBoxStyle}>
                  <div style={statNumberStyle}>{stats.sessionStats.totalSessions || 0}</div>
                  <div style={statLabelStyle}>Total Visits</div>
                </div>
                <div style={statBoxStyle}>
                  <div style={statNumberStyle}>{stats.sessionStats.activeSessions || 0}</div>
                  <div style={statLabelStyle}>Active Visits</div>
                </div>
                <div style={statBoxStyle}>
                  <div style={statNumberStyle}>{formatDuration(stats.sessionStats.avgDurationSecs)}</div>
                  <div style={statLabelStyle}>Avg Time Spent</div>
                </div>
              </>
            )}
          </div>
          
          {stats.signupsByCountry && stats.signupsByCountry.length > 0 && (
            <div style={{ marginTop: '20px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#a78bfa', marginBottom: '10px', fontWeight: '600' }}>🌍 Signups by Country:</div>
                {stats.signupsByCountry.slice(0, 5).map((country, idx) => (
                  <div key={idx} style={{ padding: '3px 0', fontSize: '13px', color: '#d1d5db' }}>
                    {country.signup_country}: {country.count} users
                  </div>
                ))}
              </div>
              {stats.sessionStats?.byCountry && stats.sessionStats.byCountry.length > 0 && (
                <div>
                  <div style={{ fontSize: '14px', color: '#a78bfa', marginBottom: '10px', fontWeight: '600' }}>🌍 Visits by Country:</div>
                  {stats.sessionStats.byCountry.slice(0, 5).map((country, idx) => (
                    <div key={idx} style={{ padding: '3px 0', fontSize: '13px', color: '#d1d5db' }}>
                      {country.visit_country || 'Unknown'}: {country.count} visits
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={tabsStyle}>
        <button
          style={tabStyle(activeTab === 'users')}
          onClick={() => setActiveTab('users')}
        >
          👥 Registered Users ({users.length})
        </button>
        <button
          style={tabStyle(activeTab === 'logins')}
          onClick={() => setActiveTab('logins')}
        >
          🔐 Login History ({logins.length})
        </button>
        <button
          style={tabStyle(activeTab === 'sessions')}
          onClick={() => setActiveTab('sessions')}
        >
          🌐 Web Sessions ({sessions.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#1e1b4b' }}>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Signup Location</th>
                <th style={thStyle}>Country</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td style={tdStyle}>
                      <span style={{ color: '#a78bfa', fontWeight: '500' }}>{user.username}</span>
                    </td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>{formatDate(user.created_at)}</td>
                    <td style={tdStyle}>{user.signup_location || 'Unknown'}</td>
                    <td style={tdStyle}>{user.signup_country || 'Unknown'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>
                    No users registered yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Logins Tab */}
      {activeTab === 'logins' && (
        <div>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#1e1b4b' }}>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Login Time</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Country/City</th>
                <th style={thStyle}>IP Address</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logins.length > 0 ? (
                logins.map((login) => (
                  <tr key={login.id}>
                    <td style={tdStyle}>
                      <span style={{ color: '#a78bfa', fontWeight: '500' }}>{login.username}</span>
                    </td>
                    <td style={tdStyle}>{formatDate(login.login_time)}</td>
                    <td style={tdStyle}>{login.login_location || 'Unknown'}</td>
                    <td style={tdStyle}>
                      {login.login_city && login.login_country 
                        ? `${login.login_city}, ${login.login_country}` 
                        : login.login_country || 'Unknown'}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>
                      {login.login_ip}
                    </td>
                    <td style={{
                      ...tdStyle,
                      color: login.login_status === 'success' ? '#4ade80' : '#f87171',
                      fontWeight: '500'
                    }}>
                      {login.login_status === 'success' ? '✅ Success' : '❌ ' + login.login_status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>
                    No login history yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Web Sessions Tab */}
      {activeTab === 'sessions' && (
        <div>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: '#1e1b4b' }}>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Opened At</th>
                <th style={thStyle}>Closed At</th>
                <th style={thStyle}>Time Spent</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>IP Address</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length > 0 ? (
                sessions.map((sess) => (
                  <tr key={sess.id}>
                    <td style={tdStyle}>
                      <span style={{ color: sess.username === 'anonymous' ? '#9ca3af' : '#a78bfa', fontWeight: '500' }}>
                        {sess.username}
                      </span>
                    </td>
                    <td style={tdStyle}>{formatDate(sess.visit_start)}</td>
                    <td style={tdStyle}>{sess.visit_end ? formatDate(sess.visit_end) : '—'}</td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: '600', color: '#38bdf8' }}>
                        {formatDuration(sess.duration_seconds)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {sess.visit_city && sess.visit_country 
                        ? `${sess.visit_city}, ${sess.visit_country}` 
                        : sess.visit_location || 'Unknown'}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>
                      {sess.visit_ip}
                    </td>
                    <td style={tdStyle}>
                      {sess.is_active ? (
                        <span style={{ color: '#4ade80', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
                          Active
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>
                    No sessions recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button
          onClick={loadAdminData}
          style={{
            background: '#6b21a8',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#7c3aed'}
          onMouseLeave={(e) => e.target.style.background = '#6b21a8'}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}
