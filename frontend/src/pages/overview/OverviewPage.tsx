import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminDashboardPage } from '../admin/AdminDashboardPage';
import { UserDashboardPage } from '../user/UserDashboardPage';

export const OverviewPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN';

  // Render dedicated Admin Control Portal for Admin role, and Operator SOC Dashboard for User role
  if (isAdmin) {
    return <AdminDashboardPage />;
  }

  return <UserDashboardPage />;
};
