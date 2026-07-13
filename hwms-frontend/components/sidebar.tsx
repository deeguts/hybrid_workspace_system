'use client'

import React from 'react'
import { Calendar, BarChart3, Settings, LogOut, Shield, Users } from 'lucide-react'

type View = 'calendar' | 'dashboard' | 'admin' | 'manager' | 'settings'

interface SidebarProps {
  currentView: View
  onViewChange: (view: View) => void
  onLogout: () => void
  isAdmin: boolean
  isManager: boolean
}

export default function Sidebar({ currentView, onViewChange, onLogout, isAdmin, isManager }: SidebarProps) {
  const navItems = [
    { id: 'calendar',  label: 'Calendar',  icon: Calendar },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    ...(isManager && !isAdmin ? [{ id: 'manager', label: 'My Team', icon: Users }] : []),
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
    { id: 'settings',  label: 'Settings',  icon: Settings },
  ] as const

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 via-blue-900 to-blue-950 text-white flex flex-col h-screen shrink-0">
      <div className="px-6 py-8 border-b border-blue-800/60">
        <h1 className="font-poppins text-4xl font-bold text-white tracking-tight">HWMS</h1>
        <p className="text-blue-300 text-xs mt-1.5 font-medium">Hybrid Work Management</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 text-sm font-medium ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="px-4 py-5 border-t border-blue-800/60">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-200/70 hover:bg-red-900/30 hover:text-red-300 transition-all duration-150 text-sm font-medium"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  )
}