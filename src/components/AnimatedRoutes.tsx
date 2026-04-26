import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';
import FullscreenLoader from './FullscreenLoader';

const Index = lazy(() => import('../pages/Index'));
const Onboarding = lazy(() => import('../pages/Onboarding'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Explore = lazy(() => import('../pages/Explore'));
const Chat = lazy(() => import('../pages/Chat'));
const Settings = lazy(() => import('../pages/Settings'));
const MyProfile = lazy(() => import('../pages/MyProfile'));
const Interactive = lazy(() => import('../pages/Interactive'));
const AdminVerifications = lazy(() => import('../pages/AdminVerifications'));
const AdminModeration = lazy(() => import('../pages/AdminModeration'));

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Suspense fallback={<FullscreenLoader label="Loading page..." />}>
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <Explore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interactive"
              element={
                <ProtectedRoute>
                  <Interactive />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/verifications"
              element={
                <ProtectedRoute>
                  <AdminVerifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/moderation"
              element={
                <ProtectedRoute>
                  <AdminModeration />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
