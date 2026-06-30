'use client'

import React, { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Briefcase, Home,
  AlertCircle, Loader2, X, RefreshCw,
} from 'lucide-react'
import { useAttendance } from '@/hooks/useAttendance'
import type { LeaveType, AttendanceStatus } from '@/types'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  WFO:   'bg-blue-100 border-blue-300 text-blue-800',
  WFH:   'bg-emerald-100 border-emerald-300 text-emerald-800',
  LEAVE: 'bg-amber-100 border-amber-300 text-amber-700',
}

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  WFO: 'WFO', WFH: 'WFH', LEAVE: 'Leave',
}

export default function CalendarView() {
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear]   = useState(now.getFullYear())

  const monthYear = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const { dayMap, summary, loading, error, markDay, removeDay, reload } = useAttendance(monthYear)

  const [hoveredDate, setHoveredDate]         = useState<string | null>(null)
  const [actionLoading, setActionLoading]     = useState<string | null>(null)
  const [showLeaveModal, setShowLeaveModal]   = useState(false)
  const [pendingDate, setPendingDate]         = useState<string | null>(null)
  const [leaveType, setLeaveType]             = useState<LeaveType>('CASUAL')
  const [toast, setToast]                     = useState<{ msg: string; ok: boolean } | null>(null)

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWk = new Date(viewYear, viewMonth, 1).getDay()

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const formatDate = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const isWeekendDay = (day: number) => {
    const dow = new Date(viewYear, viewMonth, day).getDay()
    return dow === 0 || dow === 6
  }

  const isToday = (day: number) =>
    day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear()

  const handleMark = async (day: number, status: AttendanceStatus) => {
    if (status === 'LEAVE') {
      setPendingDate(formatDate(day))
      setShowLeaveModal(true)
      return
    }
    const date = formatDate(day)
    setActionLoading(date)
    setHoveredDate(null)
    try {
      await markDay(date, status)
      showToast(`Marked ${status} for ${date}`)
    } catch (e) {
      showToast((e as Error).message, false)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLeaveSubmit = async () => {
    if (!pendingDate) return
    setShowLeaveModal(false)
    setActionLoading(pendingDate)
    try {
      await markDay(pendingDate, 'LEAVE', leaveType)
      showToast(`Leave (${leaveType}) marked for ${pendingDate}`)
    } catch (e) {
      showToast((e as Error).message, false)
    } finally {
      setActionLoading(null)
      setPendingDate(null)
    }
  }

  const handleRemove = async (day: number) => {
    const date = formatDate(day)
    setActionLoading(date)
    setHoveredDate(null)
    try {
      await removeDay(date)
      showToast(`Cleared ${date}`)
    } catch (e) {
      showToast((e as Error).message, false)
    } finally {
      setActionLoading(null)
    }
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const compliancePct = summary
    ? Math.min(100, Math.round((summary.completedWfo / summary.requiredWfo) * 100))
    : 0

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header  */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-poppins text-2xl font-bold text-blue-900">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Click a working day to set your status</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reload}
            className="p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
          <button onClick={prevMonth} className="p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <ChevronLeft size={18} className="text-blue-900" />
          </button>
          <button onClick={nextMonth} className="p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <ChevronRight size={18} className="text-blue-900" />
          </button>
        </div>
      </div>

      {/* Compliance ribbon*/}
      {summary && (
        <div className="mb-5 bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex gap-5 text-sm flex-wrap">
            <span><span className="font-semibold text-blue-900">{summary.completedWfo}</span> <span className="text-gray-500">/ {summary.requiredWfo} WFO</span></span>
            <span className="text-amber-600 font-medium">{summary.remainingWfo} remaining</span>
            {summary.excessWfo > 0 && (
              <span className="text-emerald-600 font-medium">+{summary.excessWfo} excess buffer</span>
            )}
          </div>
          <div className="sm:ml-auto flex items-center gap-3 min-w-[160px]">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  compliancePct >= 100 ? 'bg-emerald-500' :
                  compliancePct >= 60  ? 'bg-blue-500' : 'bg-amber-400'
                }`}
                style={{ width: `${compliancePct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 w-9 text-right">{compliancePct}%</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={15} /> {error}
          <button onClick={reload} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/*  Calendar grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-slate-50">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="grid grid-cols-7">
          {/* Empty leading cells */}
          {Array.from({ length: firstDayOfWk }).map((_, i) => (
            <div key={`e${i}`} className="h-20 bg-slate-50/50 border-b border-r border-gray-100" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const date   = formatDate(day)
            const state  = dayMap[date]
            const wkend  = isWeekendDay(day)
            const today  = isToday(day)
            const busy   = actionLoading === date
            const hovered = hoveredDate === date

            return (
              <div
                key={day}
                onMouseEnter={() => !wkend && !busy && setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                className={`relative h-20 border-b border-r border-gray-100 p-1.5 transition-colors group
                  ${wkend ? 'bg-slate-50/70 cursor-default' : 'cursor-pointer hover:bg-blue-50/50'}
                  ${today ? 'ring-2 ring-inset ring-blue-400' : ''}
                `}
              >
                {/* Day number */}
                <span className={`text-xs font-semibold block mb-1 ${
                  today ? 'text-blue-600' : wkend ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {day}
                  {today && <span className="ml-1 text-[9px] font-bold text-blue-500">TODAY</span>}
                </span>

                {/* Loading spinner */}
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                  </div>
                )}

                {/* Status chip */}
                {state && !busy && (
                  <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold ${STATUS_STYLES[state.status]}`}>
                    {state.status === 'WFO' && <Briefcase size={9} />}
                    {state.status === 'WFH' && <Home size={9} />}
                    {STATUS_LABEL[state.status]}
                    {state.leaveType && ` · ${state.leaveType[0]}`}
                  </div>
                )}

                {/* Hover action buttons (unmarked working days) */}
                {hovered && !state && !wkend && !busy && (
                  <div className="absolute bottom-1 left-1 right-1 flex gap-1 z-20">
                    <button
                      onClick={() => handleMark(day, 'WFO')}
                      className="flex-1 py-1 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-0.5"
                    >
                      <Briefcase size={9} /> WFO
                    </button>
                    <button
                      onClick={() => handleMark(day, 'WFH')}
                      className="flex-1 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center justify-center gap-0.5"
                    >
                      <Home size={9} /> WFH
                    </button>
                    <button
                      onClick={() => handleMark(day, 'LEAVE')}
                      className="flex-1 py-1 text-[10px] font-bold bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors flex items-center justify-center gap-0.5"
                    >
                      <AlertCircle size={9} /> LVE
                    </button>
                  </div>
                )}

                {/* Clear button (already-marked days) */}
                {hovered && state && !wkend && !busy && (
                  <button
                    onClick={() => handleRemove(day)}
                    className="absolute top-1 right-1 p-0.5 rounded bg-gray-200 hover:bg-red-200 text-gray-500 hover:text-red-600 transition-colors z-20"
                    title="Clear"
                  >
                    <X size={10} />
                  </button>
                )}

                {/* Weekend label */}
                {wkend && (
                  <span className="absolute bottom-1 right-1.5 text-[9px] text-gray-300 font-medium uppercase">
                    {new Date(viewYear, viewMonth, day).getDay() === 0 ? 'Sun' : 'Sat'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        {Object.entries(STATUS_STYLES).map(([s, cls]) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border ${cls}`} />
            {STATUS_LABEL[s as AttendanceStatus]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-100" /> Weekend
        </span>
      </div>

      {/* Leave modal*/}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <h3 className="font-poppins font-bold text-white text-lg">Request Leave</h3>
              <button onClick={() => { setShowLeaveModal(false); setPendingDate(null) }}>
                <X size={20} className="text-white/80 hover:text-white" />
              </button>
            </div>
            <div className="p-6">
              {pendingDate && (
                <p className="text-sm text-gray-500 mb-4">
                  Date: <span className="font-semibold text-gray-800">{pendingDate}</span>
                </p>
              )}
              <p className="text-sm font-semibold text-gray-700 mb-3">Leave Type</p>
              <div className="space-y-2">
                {(['SICK', 'CASUAL', 'PAID'] as LeaveType[]).map(t => (
                  <label key={t} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                    <input
                      type="radio"
                      name="leaveType"
                      value={t}
                      checked={leaveType === t}
                      onChange={() => setLeaveType(t)}
                      className="accent-blue-700"
                    />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {t.charAt(0) + t.slice(1).toLowerCase()} Leave
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowLeaveModal(false); setPendingDate(null) }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveSubmit}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 text-sm transition-colors"
                >
                  Submit Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
