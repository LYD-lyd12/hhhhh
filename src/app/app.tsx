'use client'

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import Dashboard from '@/components/Dashboard/Dashboard';
import Models from '@/components/Models/Models';
import APIDocs from '@/components/API/APIDocs';
import Billing from '@/components/Billing/Billing';
import Nodes from '@/components/Nodes/Nodes';
import Users from '@/components/Users/Users';
import Settings from '@/components/Settings/Settings';
import Login from '@/components/Auth/Login';
import Skills from '@/components/Skills/Skills';
import KB from '@/components/KB/KB';
import MCP from '@/components/MCP/MCP';
import Agents from '@/components/Agents/Agents';
import ModelCompare from '@/components/Agents/ModelCompare';
import OfficeFloor from '@/components/Agents/OfficeFloor';

type Page = 'dashboard' | 'models' | 'skills' | 'kb' | 'mcp' | 'api' | 'billing' | 'nodes' | 'users' | 'agents' | 'compare' | 'office' | 'settings';

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState<Page>('agents');
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const adminPages: Page[] = ['nodes', 'users', 'settings'];

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleItemClick = (item: string) => {
    const page = item as Page;
    if (adminPages.includes(page) && !isAdmin) {
      // 非管理员无法访问管理页面，忽略点击
      return;
    }
    setActivePage(page);
  };

  const renderPage = () => {
    // 非管理员访问管理页面时显示 403 提示
    if (adminPages.includes(activePage) && !isAdmin) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-400 mb-2">403 - 无权限</h2>
            <p className="text-slate-500">您没有管理员权限，无法访问此页面</p>
          </div>
        </div>
      );
    }
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'models':
        return <Models />;
      case 'skills':
        return <Skills />;
      case 'kb':
        return <KB />;
      case 'mcp':
        return <MCP />;
      case 'api':
        return <APIDocs />;
      case 'billing':
        return <Billing />;
      case 'nodes':
        return <Nodes />;
      case 'users':
        return <Users />;
      case 'agents':
        return <Agents />;
      case 'compare':
        return <ModelCompare />;
      case 'office':
        return <OfficeFloor />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060918]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem={activePage}
        onItemClick={handleItemClick}
        role={user?.role || 'user'}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-[220px]'}`}>
        <Header />
        <main className="p-6" style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(56,189,248,0.04) 0%, transparent 60%), #060918'
        }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
