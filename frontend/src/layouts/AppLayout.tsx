import React from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  FolderKanban,
  Cpu,
  BarChart3,
  LogOut,
  Layers,
  Activity
} from 'lucide-react'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f1117] text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-[#1f2937] flex flex-col justify-between">
        <div>
          {/* Brand/Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[#1f2937] gap-2">
            <Activity className="h-6 w-6 text-indigo-500 animate-pulse" />
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
              JobFlow
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </NavLink>
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <FolderKanban className="h-4 w-4" />
              Projects
            </NavLink>
            <NavLink
              to="/workers"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Cpu className="h-4 w-4" />
              Workers
            </NavLink>
            <NavLink
              to="/metrics"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <BarChart3 className="h-4 w-4" />
              Metrics
            </NavLink>
          </nav>
        </div>

        {/* User profile / Logout */}
        <div className="p-4 border-t border-[#1f2937]">
          <div className="flex items-center justify-between mb-4">
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name}</p>
              <p className="text-xxs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header / Topbar */}
        <header className="h-16 bg-[#111827] border-b border-[#1f2937] flex items-center px-8 justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Distributed Job Scheduler</span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0b0c10]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
