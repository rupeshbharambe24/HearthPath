
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Compass, MessageSquare, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-romantic-dark-bg border-r border-gray-200 dark:border-gray-700 z-10 lg:block hidden transition-all duration-300">
      <div className="p-4 flex flex-col h-full">
        <nav className="space-y-2 flex-1">
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
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-romantic-red"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
