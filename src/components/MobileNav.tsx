
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileNav = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-romantic-dark-bg border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="grid grid-cols-4 h-16">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center space-y-1 transition-colors duration-200",
                isActive
                  ? "text-romantic-red bg-romantic-light-pink dark:bg-romantic-dark-card"
                  : "text-gray-600 dark:text-gray-400 hover:text-romantic-red"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
