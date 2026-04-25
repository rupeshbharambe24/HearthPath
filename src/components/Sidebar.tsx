import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, Search, User, Settings, LogOut, LayoutDashboard, Zap, ShieldCheck, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: isAdmin } = useIsAdmin();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Explore', href: '/explore', icon: Search },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'My Profile', href: '/profile', icon: User },
    { name: 'Interactive', href: '/interactive', icon: Zap },
    { name: 'Settings', href: '/settings', icon: Settings },
    ...(isAdmin ? [{ name: 'Verifications', href: '/admin/verifications', icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 flex-col bg-white dark:bg-[#141414] border-r border-gray-200/70 dark:border-gray-800">
      {/* Logo area */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200/70 dark:border-gray-800">
        <Link to="/dashboard" className="flex items-center space-x-2.5 group">
          <motion.div
            className="w-9 h-9 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-xl flex items-center justify-center shadow-lg shadow-romantic-red/20"
            whileHover={{ scale: 1.08, rotate: 6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Heart className="w-4.5 h-4.5 text-white fill-white" />
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-romantic-red to-romantic-rose bg-clip-text text-transparent">
            HeartPath
          </span>
        </Link>
      </div>

      {/* User profile card */}
      {user && (
        <div className="px-4 py-4 border-b border-gray-200/70 dark:border-gray-800">
          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-romantic-red to-romantic-pink flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'relative flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group',
                isActive
                  ? 'text-romantic-red dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              )}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-romantic-red/10 dark:bg-romantic-red/15 rounded-xl border border-romantic-red/20 dark:border-romantic-red/20"
                  layoutId="sidebar-active-bg"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative flex items-center">
                <Icon className={cn(
                  "w-[18px] h-[18px] mr-3 transition-colors",
                  isActive ? "text-romantic-red dark:text-romantic-pink" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )} />
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: theme toggle + logout */}
      <div className="p-3 border-t border-gray-200/70 dark:border-gray-800 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200"
        >
          {theme === 'light' ? (
            <Moon className="w-[18px] h-[18px] mr-3 text-gray-400" />
          ) : (
            <Sun className="w-[18px] h-[18px] mr-3 text-gray-400" />
          )}
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px] mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
