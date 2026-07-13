"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, User, Mail, LogOut, Loader2 } from "lucide-react";
import Sidebar from "./sidebar";
import CalendarView from "./calendar-view";
import DashboardView from "./dashboard-view";
import AdminView from "./admin-view";
import ManagerView from "./manager-view"; 
import LoginPage from "./login-page";
import { useAuth } from "@/lib/auth-context";

// Expanded View types union line to support manager views
type View = "calendar" | "dashboard" | "admin" | "manager" | "settings";

export default function HybridWorkManagementSystem() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>("calendar");
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (currentView === "admin" && user?.role !== "ADMIN") {
      setCurrentView("calendar");
    }
    if (currentView === "manager" && user?.role !== "MANAGER") {
      setCurrentView("calendar");
    }
  }, [currentView, user]);

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
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={logout}
        isAdmin={user?.role === "ADMIN"}
        isManager={user?.role === "MANAGER"} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-gray-200 bg-white px-8 py-4 flex items-center justify-between shrink-0">
          <h2 className="font-poppins text-2xl font-bold text-blue-900">
            {viewTitle[currentView]}
          </h2>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shrink-0">
                <User size={18} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate hidden sm:block">
                {user?.name}
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-4 border-b border-gray-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shrink-0">
                        <User size={20} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                          <Mail size={11} /> {user?.email}
                        </p>
                        <span
                          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
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
        <div className="flex-1 overflow-auto bg-slate-50">
          {currentView === "calendar" && <CalendarView />}
          {currentView === "dashboard" && <DashboardView />}
          {currentView === "admin" && user?.role === "ADMIN" && <AdminView />}
          {currentView === "manager" && user?.role === "MANAGER" && <ManagerView />}
          {currentView === "settings" && (
            <div className="p-8">
              <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-lg">
                <h3 className="font-poppins text-xl font-bold text-blue-900 mb-2">
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