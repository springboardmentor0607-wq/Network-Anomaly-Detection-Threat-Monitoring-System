import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useRefresh } from '../context/RefreshContext';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import SeverityBadge from '../components/SeverityBadge';
import { FaCheckDouble } from 'react-icons/fa';

const Notifications = () => {
  const { refreshTrigger } = useRefresh();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error("Notifications fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, refreshTrigger]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      fetchNotifications();
    } catch (err) {
      alert("Failed to mark all as read.");
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      alert("Failed to mark as read.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Security Notifications</h1>
          <p className="page-subtitle">Real-time alerts, ML threat escalations & system audit notices</p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button onClick={handleMarkAllRead} className="btn btn-outline">
            <FaCheckDouble /> Mark All as Read
          </button>
        )}
      </div>

      <div className="netshield-card">
        {loading ? (
          <LoadingState message="Loading Security Notifications..." />
        ) : notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: n.is_read ? 'rgba(7, 21, 34, 0.5)' : '#0E263A',
                  border: '1px solid',
                  borderColor: n.is_read ? '#163A52' : 'rgba(22, 131, 255, 0.4)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <SeverityBadge severity={n.severity} />
                    <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.95rem' }}>{n.title}</span>
                    {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1683FF' }} />}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{n.message}</div>
                  <div style={{ color: '#64748B', fontSize: '0.75rem', marginTop: 6 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="btn btn-outline"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No notifications available" description="All alerts and security notices have been cleared." />
        )}
      </div>
    </div>
  );
};

export default Notifications;
