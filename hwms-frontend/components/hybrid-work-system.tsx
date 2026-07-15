"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, User, Mail, LogOut, Loader2, Menu } from "lucide-react";
import Sidebar from "./sidebar";
import CalendarView from "./calendar-view";
import DashboardView from "./dashboard-view";
import AdminView from "./admin-view";
import ManagerView from "./manager-view"; 
import LoginPage from "./login-page";
import { useAuth } from "@/lib/auth-context";

type View = "calendar" | "dashboard" | "admin" | "manager" | "settings";

export default function HybridWorkManagementSystem() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>("calendar");
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // New state to control the mobile sidebar drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Security routing logic
  useEffect(() => {
    if (currentView === "admin" && user?.role !== "ADMIN") {
      setCurrentView("calendar");
    }
    if (currentView === "manager" && user?.role !== "MANAGER") {
      setCurrentView("calendar");
    }
  }, [currentView, user]);

  // Auto-close the mobile sidebar when a user clicks a new view
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentView]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-900" size={36} />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  const viewTitle: Record<View, string> = {
    calendar: "Calendar View",
    dashboard: "Dashboard",
    admin: "Admin Panel",
    manager: "Manager Dashboard",
    settings: "Settings",
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay (Darkens the background when sidebar is open) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Wrapper (Responsive sliding drawer on mobile, static on desktop) */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 ease-in-out shadow-xl
          md:relative md:translate-x-0 md:shadow-none
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={logout}
          isAdmin={user?.role === "ADMIN"}
          isManager={user?.role === "MANAGER"} 
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        {/* Top bar */}
        <div className="border-b border-gray-200 bg-white px-4 md:px-8 py-4 flex items-center justify-between shrink-0 z-30">
          
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Button (Visible only on mobile) */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            
            <h2 className="font-poppins text-lg sm:text-xl md:text-2xl font-bold text-blue-900 truncate">
              {viewTitle[currentView]}
            </h2>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 md:gap-3 rounded-lg px-2 md:px-4 py-2 hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shrink-0">
                <User size={16} className="text-white md:w-[18px] md:h-[18px]" />
              </div>
              <span className="text-sm font-semibold text-gray-700 max-w-[100px] md:max-w-[120px] truncate hidden sm:block">
                {user?.name}
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 md:w-72 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-4 border-b border-gray-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shrink-0">
                        <User size={20} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm md:text-base text-gray-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                          <Mail size={11} className="shrink-0" /> <span className="truncate">{user?.email}</span>
                        </p>
                        <span
                          className={`inline-block text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                            user?.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                            user?.role === "MANAGER" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user?.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Page content routing layout block */}
        <div className="flex-1 overflow-auto bg-slate-50 relative">
          {currentView === "calendar" && <CalendarView />}
          {currentView === "dashboard" && <DashboardView />}
          {currentView === "admin" && user?.role === "ADMIN" && <AdminView />}
          {currentView === "manager" && user?.role === "MANAGER" && <ManagerView />}
          {currentView === "settings" && (
            <div className="p-4 md:p-8">
              <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 max-w-lg w-full">
                <h3 className="font-poppins text-lg md:text-xl font-bold text-blue-900 mb-2">
                  Settings
                </h3>
                <p className="text-gray-500 text-sm">
                  Preferences and configuration options will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}