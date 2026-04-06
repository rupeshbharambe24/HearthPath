import React from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import DashboardStats from '@/components/DashboardStats';
import VerificationStatusCard from '@/components/VerificationStatusCard';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { fadeUp } from '@/lib/animations';

const Dashboard = () => {
  const { user } = useAuth();
  const { stats, loading } = useDashboardData();

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (stats.primaryLifecycleState === 'exclusive') {
    return <Navigate to="/interactive" replace />;
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
              className="mb-8"
              variants={fadeUp}
              initial="initial"
              animate="animate"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here is your HeartPath relationship overview.
              </p>
            </motion.div>

            {user ? (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                <VerificationStatusCard
                  profileCompleteness={user.profileCompleteness}
                  verificationBadges={user.verificationBadges}
                  title="Trust Status"
                  description="Your verified access and profile readiness are part of how HeartPath builds safer connections."
                />
              </motion.div>
            ) : null}

            <DashboardStats userStats={stats} />

            {stats.totalMatches === 0 && (
              <motion.div
                className="mt-8 text-center p-8 bg-white dark:bg-romantic-dark-card rounded-2xl shadow-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 bg-romantic-light-pink dark:bg-romantic-red/20 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span className="text-2xl">💕</span>
                </motion.div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Start Your Journey
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Explore profiles to find your perfect match and begin meaningful connections.
                </p>
              </motion.div>
            )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Dashboard;
