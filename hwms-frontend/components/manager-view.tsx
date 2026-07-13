'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Users, AlertTriangle, CheckCircle,
  Loader2, RefreshCw, ChevronDown, Download
} from 'lucide-react'
import { managerApi } from '@/lib/api'
import type { MonthlySummary } from '@/types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function pad(n: number) { return String(n).padStart(2, '0') }

export default function ManagerView() {
  const now = new Date()
  const [deficient, setDeficient] = useState<MonthlySummary[]>([])
  const [selMonth, setSelMonth]   = useState(now.getMonth())
  const [selYear, setSelYear]     = useState(now.getFullYear())
  const [loading, setLoading]     = useState(false)
  const [msg, setMsg]             = useState<{ text: string; ok: boolean } | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const monthYear = `${selYear}-${pad(selMonth + 1)}`
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i)

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3500)
  }

  const loadDeficient = useCallback(async () => {
    setLoading(true)
    try {
      setDeficient(await managerApi.getTeamDeficiency(monthYear))
    } catch (e) {
      setDeficient([])
      showMsg((e as Error).message, false)
    } finally {
      setLoading(false)
    }
  }, [monthYear])

  useEffect(() => {
    loadDeficient()
  }, [loadDeficient])

  const exportCSV = () => {
    try {
      let csvContent = "Employee Name,Email,Month,Required WFO,Completed WFO,Remaining WFO\n";
      
      deficient.forEach((row) => {
        const name = row.userName ?? "Unknown";
        const email = row.userEmail ?? "Unknown";
        const month = row.monthYear ?? "";
        const req = row.requiredWfo ?? 0;
        const comp = row.completedWfo ?? 0;
        const rem = row.remainingWfo ?? 0;
        
        csvContent += `"${name}","${email}","${month}",${req},${comp},${rem}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team_deficient_report_${monthYear}.csv`;
      a.click();
      
      setShowExportMenu(false);
    } catch (e) {
      showMsg("Failed to export CSV", false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text(`Team Deficient Employees Report - ${MONTHS[selMonth]} ${selYear}`, 14, 15)
    
    autoTable(doc, {
      startY: 25,
      head: [['Name', 'Email', 'Required', 'Completed', 'Remaining']],
      body: deficient.map(d => [
        d.userName ?? 'Unknown', 
        d.userEmail ?? 'Unknown', 
        d.requiredWfo, 
        d.completedWfo, 
        d.remainingWfo
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] } 
    })
    
    doc.save(`team_deficient_report_${monthYear}.pdf`)
    setShowExportMenu(false)
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">

      {msg && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          msg.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-poppins text-xl font-bold text-gray-900">Manager Dashboard</h2>
          <p className="text-gray-500 text-xs">Monitor your assigned team's WFO compliance tracks</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Deficient employees for:</span>
          <div className="relative">
            <select
              value={selMonth}
              onChange={e => setSelMonth(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={selYear}
              onChange={e => setSelYear(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
                        
          <div className="flex items-center gap-2">
            <button
              onClick={loadDeficient}
              className="px-3 py-2 bg-blue-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={12} /> Load
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
              <p className="text-sm">All employees on your team are compliant for this month!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Required</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deficient.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {s.userName ? s.userName.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="font-medium text-gray-900">{s.userName ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-gray-500">{s.userEmail ?? '—'}</td>
                      <td className="px-6 py-3.5 font-medium text-gray-900">{s.monthYear}</td>
                      <td className="px-6 py-3.5 text-gray-600">{s.requiredWfo}</td>
                      <td className="px-6 py-3.5 text-blue-700 font-semibold">{s.completedWfo}</td>
                      <td className="px-6 py-3.5 text-amber-600 font-semibold">{s.remainingWfo}</td>
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
    </div>
  )
}