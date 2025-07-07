
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-romantic-dark-bg border-r border-gray-200 dark:border-gray-700 z-10 lg:block hidden transition-all duration-300">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-romantic-red text-white shadow-lg"
                    : "text-gray-700 dark:text-gray-300 hover:bg-romantic-light-pink dark:hover:bg-romantic-dark-card hover:text-romantic-red"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
