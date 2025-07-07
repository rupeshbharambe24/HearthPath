
import React from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import DashboardStats from '@/components/DashboardStats';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  // Use user data or fallback to mock data
  const userStats = {
    currentLevel: user?.relationshipLevel || 3,
    trustScore: user?.trustScore || 75,
    heartsGiven: user?.heartsGiven || 24,
    heartsReceived: user?.heartsReceived || 18,
    totalMatches: 12,
    recentMatches: [
      { id: '1', name: 'Emma Wilson', college: 'Stanford University', level: 4 },
      { id: '2', name: 'Sarah Chen', college: 'MIT', level: 3 },
      { id: '3', name: 'Jessica Taylor', college: 'Harvard University', level: 2 },
    ],
  };

  return (
    <AppLayout>
      <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's your romantic journey overview.
              </p>
            </div>
            
            <DashboardStats userStats={userStats} />
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
