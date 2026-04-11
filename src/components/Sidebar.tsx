'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import {
  Upload,
  LayoutDashboard,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Sparkles,
  LogOut,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';


interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'nav-upload', label: 'Upload Resumes', href: '/upload-page', icon: Upload },
  { id: 'nav-dashboard', label: 'Candidate Dashboard', href: '/dashboard-page', icon: LayoutDashboard },
  { id: 'nav-comparison', label: 'Compare Candidates', href: '/comparison-page', icon: GitCompare },
];

const BOTTOM_ITEMS: NavItem[] = [
  { id: 'nav-settings', label: 'Settings', href: '#', icon: Settings },
  { id: 'nav-help', label: 'Help & Docs', href: '#', icon: HelpCircle },
];

interface SidebarProps {
  currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className={`
        relative flex flex-col bg-white border-r border-slate-200 shadow-sm
        transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 ${collapsed ? 'justify-center px-2' : ''}`}>
        <AppLogo size={32} />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 text-sm leading-tight tracking-tight">HireMind</span>
            <span className="text-xs text-blue-600 font-semibold flex items-center gap-0.5">
              <Sparkles size={10} />
              AI
            </span>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[68px] z-10 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm
                   flex items-center justify-center hover:bg-slate-50 transition-colors duration-150"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight size={12} className="text-slate-500" />
        ) : (
          <ChevronLeft size={12} className="text-slate-500" />
        )}
      </button>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {!collapsed && (
          <p className="section-label px-3 mb-3">Main Menu</p>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                sidebar-nav-item
                ${isActive ? 'active bg-blue-50 text-blue-700' : 'inactive text-slate-600 hover:bg-blue-50 hover:text-blue-700'}
                ${collapsed ? 'justify-center px-2' : ''}
              `}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white tabular-nums">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 py-4 border-t border-slate-100 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`sidebar-nav-item inactive text-slate-500 hover:bg-slate-50 hover:text-slate-700 ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`sidebar-nav-item inactive text-slate-500 hover:bg-red-50 hover:text-red-600 w-full ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span className="truncate">Sign Out</span>}
        </button>

        {/* User avatar */}
        <div className={`flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg bg-slate-50 ${collapsed ? 'justify-center px-2' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}