import React from 'react';
import { MessageSquare, Upload, FileText, Home, Rocket, BarChart3, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: '/',
      label: 'Chat',
      icon: MessageSquare,
      description: 'AI Chat Interface with File Upload'
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Data Analytics Dashboard'
    },
    {
      path: '/sales-buddy',
      label: 'Sales Buddy',
      icon: Building2,
      description: 'AI-Powered Financial Analysis'
    }
  ];

  return (
    <div className={`bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
              <Rocket className="w-6 h-6 text-white animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                AIron Rush
              </h1>
              <p className="text-xs text-slate-500 -mt-1">AI-Powered Chat</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-500 hidden sm:inline">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 