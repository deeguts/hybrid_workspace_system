"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Settings2,
  Loader2,
  RefreshCw,
  ChevronDown,
  Shield,
  MoreVertical,
  UserPlus,
  UserMinus,
  UserCog,
  X,
} from "lucide-react";

import { adminApi } from "@/lib/api";
import type { UserRecord, MonthlySummary } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

type AdminTab = "users" | "compliance" | "config";

export default function AdminView() {
  const now = new Date();
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [deficient, setDeficient] = useState<MonthlySummary[]>([]);
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [wfoInput, setWfoInput] = useState(12);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<number | null>(null);
  const [managersList, setManagersList] = useState<UserRecord[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<number | "">("");

  const monthYear = `${selYear}-${pad(selMonth + 1)}`;
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await adminApi.getAllUsers());
    } catch (e) {
      showMsg((e as Error).message, false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDeficient = useCallback(async () => {
    setLoading(true);
    try {
      setDeficient(await adminApi.getDeficientEmployees(monthYear));
    } catch {
      setDeficient([]);
    } finally {
      setLoading(false);
    }
  }, [monthYear]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  useEffect(() => {
    if (tab === "compliance") loadDeficient();
  }, [tab, loadDeficient]);

  const handleSetWfoTarget = async () => {
    try {
      await adminApi.setWfoTarget(monthYear, wfoInput);
      showMsg(`WFO target set to ${wfoInput} days for ${monthYear}`);
    } catch (e) {
      showMsg((e as Error).message, false);
    }
  };

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "users", label: "All Employees", icon: <Users size={15} /> },
    {
      id: "compliance",
      label: "Deficient Report",
      icon: <AlertTriangle size={15} />,
    },
    { id: "config", label: "WFO Config", icon: <Settings2 size={15} /> },
  ];
  const exportCSV = () => {
    try {
      let csvContent =
        "Employee Name,Email,Month,Required WFO,Completed WFO,Remaining WFO\n";

      deficient.forEach((row) => {
        const name = row.userName ?? "Unknown";
        const email = row.userEmail ?? "Unknown";
        const month = row.monthYear ?? "";
        const req = row.requiredWfo ?? 0;
        const comp = row.completedWfo ?? 0;
        const rem = row.remainingWfo ?? 0;

        csvContent += `"${name}","${email}","${month}",${req},${comp},${rem}\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deficient_report_${monthYear}.csv`;
      a.click();

      setShowExportMenu(false);
    } catch (e) {
      showMsg("Failed to export CSV", false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(
      `Deficient Employees Report - ${MONTHS[selMonth]} ${selYear}`,
      14,
      15,
    );

    autoTable(doc, {
      startY: 25,
      head: [["Name", "Email", "Required", "Completed", "Remaining"]],
      body: deficient.map((d) => [
        d.userName ?? "Unknown",
        d.userEmail ?? "Unknown",
        d.requiredWfo,
        d.completedWfo,
        d.remainingWfo,
      ]),
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138] },
    });

    doc.save(`deficient_report_${monthYear}.pdf`);
    setShowExportMenu(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {msg && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            msg.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {msg.text}
        </div>
      )}

      {showAssignModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Assign to Manager</h3>
        <button
          onClick={() => {
            setShowAssignModal(null);
            setSelectedManagerId(""); // Clean state boundary on exit
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-6">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          Select a Manager
        </label>
        <select
          value={selectedManagerId}
          onChange={(e) => setSelectedManagerId(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
        >
          <option value="">-- Remove Manager Assignment --</option>
          {managersList.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>
        <button
          onClick={async () => {
            // Read target employee ID from the parent mount context state
            const targetEmployeeId = showAssignModal; 
            const mgrId = selectedManagerId ? Number(selectedManagerId) : null;
            
            try {
              //  THE ULTIMATE MISSING CONNECTIVE WIRE FIRED HERE:
              await adminApi.assignManager(targetEmployeeId, mgrId);
              
              showMsg(mgrId ? "Manager assigned successfully!" : "Manager assignment removed!");
              setShowAssignModal(null);
              setSelectedManagerId("");
              loadUsers(); // Re-fetch target dataset grid updates
            } catch (e) {
              showMsg((e as Error).message || "Failed to assign manager", false);
            }
          }}
          className="w-full mt-4 bg-blue-900 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 text-sm transition-colors"
        >
          Save Assignment
        </button>
      </div>
    </div>
  </div>
)}

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center"></div>
        <div>
          <h2 className="font-poppins text-xl font-bold text-gray-900">
            Admin Panel
          </h2>
          <p className="text-gray-500 text-xs">
            Manage employees and WFO compliance
          </p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-white shadow text-blue-900 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              All Employees ({users.length})
            </h3>
            <button
              onClick={loadUsers}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw size={14} className="text-gray-500" />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
               <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u, i) => (
                    <tr key={u.userId} className="hover:bg-slate-50 transition-colors relative">
                      <td className="px-6 py-3.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className={`font-medium ${u.role === 'MANAGER' ? 'text-blue-900 font-bold' : 'text-gray-900'}`}>
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-gray-500">{u.email}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'MANAGER' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      
                      {/* 3 DOTS ACTION MENU */}
                      <td className="px-6 py-3.5 text-right relative">
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === u.userId ? null : u.userId)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeMenuId === u.userId && (
                          <div className="absolute right-8 top-10 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-10 overflow-hidden text-left">
                            {u.role !== 'MANAGER' ? (
                              <>
                                <button 
                                  onClick={async () => {
                                    try {
                                      await adminApi.updateUserRole(u.userId, 'MANAGER');
                                      setActiveMenuId(null); 
                                      loadUsers(); 
                                      showMsg(`${u.name} is now a Manager`);
                                    } catch (e) { showMsg("Failed to update role", false); }
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-50"
                                >
                                  <UserPlus size={14} className="text-indigo-600"/> Make Manager
                                </button>
                                <button 
                                  onClick={async () => {
                                    try {
                                      const managers = await adminApi.getAllManagers();
                                      setManagersList(managers);
                                      setActiveMenuId(null); 
                                      setShowAssignModal(u.userId);
                                    } catch (e) { showMsg("Failed to load managers", false); }
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  <UserCog size={14} className="text-emerald-600"/> Assign to Manager
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={async () => {
                                  try {
                                    await adminApi.updateUserRole(u.userId, 'EMPLOYEE');
                                    setActiveMenuId(null); 
                                    loadUsers(); 
                                    showMsg(`${u.name} role removed`);
                                  } catch (e) { showMsg("Failed to remove role", false); }
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                <UserMinus size={14} /> Remove Manager
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                        No employees found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "compliance" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">
              Deficient employees for:
            </span>
            <div className="relative">
              <select
                value={selMonth}
                onChange={(e) => setSelMonth(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            <div className="relative">
              <select
                value={selYear}
                onChange={(e) => setSelYear(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadDeficient}
                className="px-3 py-2 bg-blue-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors"
              >
                Load
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                >
                  <Download size={14} /> Export
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <button
                      onClick={exportCSV}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-50"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={exportPDF}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Export PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                Below WFO target — {MONTHS[selMonth]} {selYear}
              </h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-blue-600" size={28} />
              </div>
            ) : deficient.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
                <CheckCircle size={32} className="text-emerald-400" />
                <p className="text-sm">
                  All employees are compliant for this month!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Required
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deficient.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {s.userName
                                ? s.userName.charAt(0).toUpperCase()
                                : "?"}
                            </div>
                            <span className="font-medium text-gray-900">
                              {s.userName ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-gray-500">
                          {s.userEmail ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-gray-900">
                          {s.monthYear}
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {s.requiredWfo}
                        </td>
                        <td className="px-6 py-3.5 text-blue-700 font-semibold">
                          {s.completedWfo}
                        </td>
                        <td className="px-6 py-3.5 text-amber-600 font-semibold">
                          {s.remainingWfo}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            <AlertTriangle size={10} /> Deficient
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "config" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
          <h3 className="font-poppins font-bold text-gray-900 mb-5">
            Set Monthly WFO Target
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Month
                </label>
                <div className="relative">
                  <select
                    value={selMonth}
                    onChange={(e) => setSelMonth(Number(e.target.value))}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Year
                </label>
                <div className="relative">
                  <select
                    value={selYear}
                    onChange={(e) => setSelYear(Number(e.target.value))}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Required WFO Days
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={wfoInput}
                onChange={(e) => setWfoInput(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-xs text-gray-400 mt-1">
                Default is 12 days per month.
              </p>
            </div>
            <button
              onClick={handleSetWfoTarget}
              className="w-full bg-blue-900 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 transition-colors text-sm"
            >
              Apply to {MONTHS[selMonth]} {selYear}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
