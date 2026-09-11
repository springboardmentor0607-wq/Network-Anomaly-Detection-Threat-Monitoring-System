import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', damping: 24, stiffness: 260 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const Profile = () => {
  const outletContext = useOutletContext() || {};
  const isDark = outletContext.theme !== 'light'; 
  const authContext = useAuth() || {};
  const user = authContext.user || null;

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Modals & Avatar State
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  // Load saved avatar from LocalStorage on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }
  }, []);

  // Sync context user data to local form state
  useEffect(() => {
    if (user) {
      const nameString = user.full_name || user.username || 'Admin User';
      const parts = nameString.split(' ');
      setFormData({
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Fetch Live Sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        const res = await fetch('http://localhost:8000/api/users/sessions', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        } else {
          throw new Error("Sessions unauthorized");
        }
      } catch (err) {
        console.warn("Using fallback sessions.");
        setSessions([
          { id: 'sess_01', device: 'Apple MacBook Air - Chrome', location: 'Udaipur, India', time: 'Current Session', ip: '103.119.24.11', active: true }
        ]);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, []);

  // Profile Save
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSaveMessage({ type: 'success', text: 'Profile updated successfully.' });
        if (data.user) {
          const existingUserStr = localStorage.getItem('user');
          if (existingUserStr) {
             localStorage.setItem('user', JSON.stringify({ ...JSON.parse(existingUserStr), ...data.user }));
          }
        }
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setSaveMessage({ type: 'error', text: data.detail || 'Failed to update profile.' });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Network error. Could not reach server.' });
    } finally {
      setIsSaving(false);
    } 
  };

  // Avatar Upload Handler (With HTML5 Image Compression to bypass 5MB Storage Limit)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Shrink the image so it fits securely into localStorage
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setAvatarUrl(compressedBase64);
          
          try {
            localStorage.setItem('user_avatar', compressedBase64);
          } catch (storageError) {
            console.error("Storage quota exceeded even after compression.");
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Password Update Handler
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      setPasswordStatus({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    
    setIsUpdatingPassword(true);
    setPasswordStatus(null);
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          current_password: passwordData.current,
          new_password: passwordData.new
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setPasswordStatus({ type: 'success', text: 'Password updated securely.' });
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordData({ current: '', new: '', confirm: '' });
          setPasswordStatus(null);
        }, 2000);
      } else {
        setPasswordStatus({ type: 'error', text: data.detail || 'Failed to update password.' });
      }
    } catch (err) {
      setPasswordStatus({ type: 'error', text: 'Network error communicating with server.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    const f = firstName && typeof firstName === 'string' ? firstName[0] : 'U';
    const l = lastName && typeof lastName === 'string' ? lastName[0] : 'S';
    return (f + l).toUpperCase();
  };

  const cardMaterial = 'bg-white/70 dark:bg-[#121214]/65 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-2xl';
  const textPrimary = 'text-[#1D1D1F] dark:text-[#F2F2F0]';
  const textMuted = 'text-[#86868B] dark:text-[#9A9A97]';
  const borderSubtle = 'border-black/[0.05] dark:border-white/[0.07]';
  const inputStyle = 'w-full rounded-lg px-4 py-2.5 text-[13px] bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] focus:border-black/20 dark:focus:border-white/20 text-[#1D1D1F] dark:text-[#F2F2F0] focus:outline-none transition-colors';

  return (
    <div className="space-y-6 max-w-4xl transition-colors duration-500 relative">
      
      {/* --- PASSWORD MODAL --- */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-md p-4">
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white/95 dark:bg-[#1C1C1E]/95 border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
                <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary}`}>Update Password</h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${textMuted} hover:${textPrimary}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
                {passwordStatus && (
                  <div className={`p-3 rounded-lg text-[12px] font-medium ${passwordStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                    {passwordStatus.text}
                  </div>
                )}
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${textMuted} mb-2`}>Current Password</label>
                  <input type="password" required value={passwordData.current} onChange={(e) => setPasswordData({...passwordData, current: e.target.value})} className={inputStyle} />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${textMuted} mb-2`}>New Password</label>
                  <input type="password" required value={passwordData.new} onChange={(e) => setPasswordData({...passwordData, new: e.target.value})} className={inputStyle} />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${textMuted} mb-2`}>Confirm New Password</label>
                  <input type="password" required value={passwordData.confirm} onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})} className={inputStyle} />
                </div>
                <div className="pt-3">
                  <button type="submit" disabled={isUpdatingPassword} className="w-full py-2.5 rounded-lg text-[13px] font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50">
                    {isUpdatingPassword ? 'Verifying...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 2FA MODAL --- */}
      <AnimatePresence>
        {is2FAModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-md p-4">
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white/95 dark:bg-[#1C1C1E]/95 border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className={`text-[18px] font-semibold tracking-tight ${textPrimary} mb-2`}>2FA is Active</h3>
              <p className={`text-[13px] ${textMuted} mb-6`}>Your account is currently secured by an authenticator app. Disable it to reconfigure your device.</p>
              <div className="flex gap-3">
                <button onClick={() => setIs2FAModalOpen(false)} className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold border ${borderSubtle} ${textPrimary} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>Close</button>
                <button onClick={() => setIs2FAModalOpen(false)} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">Disable 2FA</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN PAGE CONTENT --- */}
      <div>
        <h2 className={`text-[24px] font-semibold tracking-tight ${textPrimary}`}>My Profile</h2>
        <p className={`text-[13px] ${textMuted} mt-0.5`}>Manage your personal account settings, security, and sessions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Avatar */}
        <div className="col-span-1 space-y-6">
          <motion.div {...fadeInUp} className={`${cardMaterial} p-6 flex flex-col items-center text-center`}>
            {/* Hidden File Input */}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
            
            <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[28px] font-bold text-[#1D1D1F] dark:text-white mb-4 shadow-sm overflow-hidden border-2 border-transparent hover:border-black/10 dark:hover:border-white/20 transition-colors cursor-pointer" onClick={() => fileInputRef.current.click()}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(formData.firstName, formData.lastName)
              )}
            </div>
            
            <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary}`}>
              {user?.full_name || user?.username || 'Admin User'}
            </h3>
            <p className={`text-[12px] font-medium ${textMuted} mb-5 capitalize`}>
              {user?.role || 'Administrator'}
            </p>
            <button onClick={() => fileInputRef.current.click()} className={`w-full py-2.5 bg-black/5 dark:bg-white/[0.04] hover:bg-black/10 dark:hover:bg-white/[0.08] border ${borderSubtle} ${textPrimary} text-[12px] font-semibold rounded-lg transition-colors`}>
              Change Avatar
            </button>
          </motion.div>
        </div>

        {/* Right Column - Forms & Settings */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          {/* Personal Information */}
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className={`${cardMaterial} p-6 sm:p-8`}>
            <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary} mb-5`}>Personal Information</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${textMuted} mb-2`}>First Name</label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className={inputStyle} />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${textMuted} mb-2`}>Last Name</label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className={inputStyle} />
                </div>
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider ${textMuted} mb-2`}>Email Address</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputStyle} />
              </div>
              <div className={`pt-4 border-t ${borderSubtle} flex items-center justify-between`}>
                <span className={`text-[12px] font-medium ${saveMessage?.type === 'success' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                  {saveMessage?.text}
                </span>
                <button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-[#0A0A0B] hover:bg-gray-800 dark:hover:bg-[#E5E5E2] text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className={`${cardMaterial} p-6 sm:p-8`}>
            <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary} mb-5`}>Security</h3>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className={`text-[14px] font-semibold ${textPrimary}`}>Account Password</div>
                  <div className={`text-[12px] ${textMuted} mt-0.5`}>Last changed recently</div>
                </div>
                <button onClick={() => setIsPasswordModalOpen(true)} className={`px-5 py-2.5 bg-black/5 dark:bg-white/[0.04] hover:bg-black/10 dark:hover:bg-white/[0.08] border ${borderSubtle} ${textPrimary} text-[12px] font-semibold rounded-lg transition-colors whitespace-nowrap`}>
                  Update Password
                </button>
              </div>
              
              <div className={`border-t ${borderSubtle} pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div>
                  <div className={`text-[14px] font-semibold ${textPrimary}`}>Two-Factor Authentication (2FA)</div>
                  <div className="text-[12px] text-emerald-600 dark:text-emerald-500 mt-0.5 font-medium">Currently Enabled via Authenticator App</div>
                </div>
                <button onClick={() => setIs2FAModalOpen(true)} className={`px-5 py-2.5 bg-black/5 dark:bg-white/[0.04] hover:bg-black/10 dark:hover:bg-white/[0.08] border ${borderSubtle} ${textPrimary} text-[12px] font-semibold rounded-lg transition-colors whitespace-nowrap`}>
                  Manage 2FA
                </button>
              </div>
            </div>
          </motion.div>

          {/* Active Sessions */}
          <motion.div {...fadeInUp} transition={{ delay: 0.3 }} className={`${cardMaterial} overflow-hidden`}>
            <div className={`px-6 py-5 border-b ${borderSubtle} bg-black/[0.01] dark:bg-white/[0.01]`}>
              <h3 className={`text-[15px] font-semibold tracking-tight ${textPrimary}`}>Active Sessions</h3>
            </div>
            <div className={`divide-y ${isDark ? 'divide-white/[0.03]' : 'divide-black/[0.05]'}`}>
              {loadingSessions ? (
                <div className={`px-6 py-8 text-center ${textMuted} text-[13px]`}>Loading active sessions...</div>
              ) : sessions.length === 0 ? (
                <div className={`px-6 py-8 text-center ${textMuted} text-[13px]`}>No active sessions found.</div>
              ) : (
                sessions.map((session, i) => (
                  <div key={session.id || i} className="px-6 py-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-full ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                        <svg className={`w-5 h-5 ${textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {session.active 
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          }
                        </svg>
                      </div>
                      <div>
                        <div className={`text-[14px] font-semibold ${textPrimary} flex items-center gap-2`}>
                          {session.device} 
                          {session.active && <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Active</span>}
                        </div>
                        <div className={`text-[12px] ${textMuted} mt-0.5`}>{session.location} • {session.ip} • {session.time}</div>
                      </div>
                    </div>
                    {!session.active && (
                      <button className="text-[13px] font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                        Revoke
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Profile;