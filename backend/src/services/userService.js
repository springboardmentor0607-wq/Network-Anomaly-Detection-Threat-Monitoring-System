const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { inMemoryUsers } = require('./authService');

const mockAuditLogs = [
  { _id: 'log-1', userId: 'user-admin-1', userEmail: 'admin@netshield.ai', action: 'USER_ROLE_UPDATE', details: 'Updated role of analyst@netshield.ai to Senior Analyst', ipAddress: '192.168.1.10', severity: 'info', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: 'log-2', userId: 'user-analyst-1', userEmail: 'analyst@netshield.ai', action: 'ANOMALY_SCAN', details: 'Triggered deep ML packet scan on Subnet A', ipAddress: '192.168.1.50', severity: 'warning', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { _id: 'log-3', userId: 'user-admin-1', userEmail: 'admin@netshield.ai', action: 'FIREWALL_RULE_CHANGE', details: 'Blocked IP 45.142.214.8 via iptables', ipAddress: '192.168.1.10', severity: 'critical', createdAt: new Date(Date.now() - 10800000).toISOString() }
];

const mockTeams = [
  { id: 'team-1', name: 'Alpha Cyber Response', lead: 'admin@netshield.ai', members: 6, status: 'Active' },
  { id: 'team-2', name: 'SOC Threat Hunters', lead: 'analyst@netshield.ai', members: 4, status: 'Active' },
  { id: 'team-3', name: 'Forensics & Incident Ops', lead: 'analyst2@netshield.ai', members: 5, status: 'Active' }
];

const getAllUsers = async () => {
  try {
    const dbUsers = await User.find().select('-password');
    if (dbUsers && dbUsers.length > 0) return dbUsers;
  } catch (e) {}

  return inMemoryUsers.map(u => ({
    _id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    isOnline: u.isOnline,
    createdAt: u.createdAt
  }));
};

const createUser = async (userData) => {
  const { name, email, password, role } = userData;
  try {
    const newUser = await User.create({ name, email, password, role });
    return newUser;
  } catch (e) {}

  const memUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    role: role || 'analyst',
    status: 'active',
    isOnline: false,
    createdAt: new Date().toISOString()
  };
  inMemoryUsers.push(memUser);
  return { _id: memUser.id, ...memUser };
};

const updateUser = async (id, updateData) => {
  try {
    const updated = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (updated) return updated;
  } catch (e) {}

  const user = inMemoryUsers.find(u => u.id === id);
  if (user) {
    Object.assign(user, updateData);
    return { _id: user.id, ...user };
  }
  return { _id: id, ...updateData };
};

const deleteUser = async (id) => {
  try {
    await User.findByIdAndDelete(id);
  } catch (e) {}
  const index = inMemoryUsers.findIndex(u => u.id === id);
  if (index !== -1) inMemoryUsers.splice(index, 1);
  return true;
};

const getAuditLogs = async () => {
  try {
    const dbLogs = await AuditLog.find().sort({ createdAt: -1 });
    if (dbLogs && dbLogs.length > 0) return dbLogs;
  } catch (e) {}
  return mockAuditLogs;
};

const getTeams = async () => {
  return mockTeams;
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAuditLogs,
  getTeams
};
