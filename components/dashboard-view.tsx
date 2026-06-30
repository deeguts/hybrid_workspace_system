'use client'

import React, { useState, useEffect } from 'react'
import {
  Briefcase, CheckCircle, Clock, TrendingUp,
  ChevronDown, AlertTriangle, Loader2, RefreshCw,
} from 'lucide-react'
import { summaryApi } from '@/lib/api'
import type { MonthlySummary } from '@/types'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function pad(n: number) { return String(n).padStart(2, '0') }

export default function DashboardView() {
  const now = new Date()
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selYear,  setSelYear]  = useState(now.getFullYear())
  const [summary,  setSummary]  = useState<MonthlySummary | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const monthYear = `${selYear}-${pad(selMonth + 1)}`

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await summaryApi.get(monthYear)
      setSummary(data)
    } catch (e) {
      // If no summary exists yet for that month, show zeroes
      setSummary(null)
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [monthYear])

  const completed  = summary?.completedWfo  ?? 0
  const required   = summary?.requiredWfo   ?? 12
  const remaining  = summary?.remainingWfo  ?? required
  const excess     = summary?.excessWfo     ?? 0
  const pct        = Math.min(100, Math.round((completed / required) * 100))
  const onTrack    = remaining === 0 || excess > 0

  const kpis = [
    {
      id: 'target',
      title: 'WFO Target',
      value: required,
      sub: 'days / month',
      icon: <Briefcase size={22} />,
      color: 'text-blue-900',
      bar: 'from-blue-400 to-blue-700',
      pct: 100,
      bg: 'bg-blue-50 border-blue-100',
    },
    {
      id: 'completed',
      title: 'Completed',
      value: completed,
      sub: 'WFO days so far',
      icon: <CheckCircle size={22} />,
      color: 'text-emerald-700',
      bar: 'from-emerald-400 to-emerald-600',
      pct,
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      id: 'remaining',
      title: 'Remaining',
      value: remaining,
      sub: 'days still needed',
      icon: <Clock size={22} />,
      color: remaining > 0 ? 'text-amber-700' : 'text-gray-400',
      bar: 'from-amber-400 to-amber-600',
      pct: remaining > 0 ? Math.round((remaining / required) * 100) : 0,
      bg: remaining > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100',
    },
    {
      id: 'buffer',
      title: 'Excess Buffer',
      value: excess,
      sub: 'banked extra days',
      icon: <TrendingUp size={22} />,
      color: excess > 0 ? 'text-green-700' : 'text-gray-400',
      bar: 'from-green-400 to-green-600',
      pct: excess > 0 ? Math.min(100, Math.round((excess / required) * 100)) : 0,
      bg: excess > 0 ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100',
    },
  ]

  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - 1 + i)

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-poppins text-2xl font-bold text-blue-900">
            Compliance Dashboard
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {MONTHS[selMonth]} {selYear} — WFO compliance overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors" title="Refresh">
            <RefreshCw size={15} className="text-gray-500" />
          </button>
          {/* Month selector */}
          <div className="relative">
            <select
              value={selMonth}
              onChange={e => setSelMonth(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {/* Year selector */}
          <div className="relative">
            <select
              value={selYear}
              onChange={e => setSelYear(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle size={15} />
          No summary found for {MONTHS[selMonth]} {selYear}. Mark attendance to generate one.
        </div>
      )}

      {/* KPI cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="animate-spin text-blue-700" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.id} className={`rounded-xl border p-5 ${k.bg}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={k.color}>{k.icon}</div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{k.title}</span>
              </div>
              <p className={`font-poppins text-4xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.sub}</p>
              {/* Progress bar */}
              <div className="mt-4 h-1.5 bg-black/5 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${k.bar} rounded-full transition-all duration-700`}
                  style={{ width: `${k.pct}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 text-right">{k.pct}%</p>
            </div>
          ))}
        </div>
      )}

      {/* Compliance status panel */}
      {!loading && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-poppins font-bold text-gray-900 mb-4">Compliance Status</h4>
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${
              onTrack
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {onTrack
                ? <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                : <AlertTriangle size={20} className="text-amber-600 shrink-0" />
              }
              <div>
                <p className="font-semibold text-sm">
                  {onTrack ? 'On Track ✓' : `${remaining} day${remaining > 1 ? 's' : ''} behind`}
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  {excess > 0
                    ? `You have a buffer of ${excess} extra WFO day${excess > 1 ? 's' : ''}.`
                    : onTrack
                    ? 'Monthly WFO requirement met.'
                    : 'You need more WFO days this month.'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress ring / bar breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-poppins font-bold text-gray-900 mb-4">Monthly Progress</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>WFO completion</span>
                  <span className="font-semibold">{completed} / {required}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {excess > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Excess buffer</span>
                    <span className="font-semibold text-emerald-600">+{excess} days</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                      style={{ width: `${Math.min(100, (excess / required) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Last updated: {summary.lastUpdated
                ? new Date(summary.lastUpdated).toLocaleString()
                : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      
          
         
      </div>
  
  )
}
