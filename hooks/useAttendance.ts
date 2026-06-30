'use client'

import { useState, useEffect, useCallback } from 'react'
import { attendanceApi, summaryApi } from '@/lib/api'
import type { DayState, AttendanceStatus, LeaveType, MonthlySummary } from '@/types'

export function useAttendance(monthYear: string) {
  const [dayMap, setDayMap] = useState<Record<string, DayState>>({})
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [records, sum] = await Promise.all([
        attendanceApi.getByMonth(monthYear),
        summaryApi.get(monthYear).catch(() => null),
      ])

      const map: Record<string, DayState> = {}
      for (const rec of records) {
        map[rec.attendanceDate] = {
          status: rec.status,
          leaveType: rec.leaveType,
          recordId: rec.id,
        }
      }
      setDayMap(map)
      setSummary(sum)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [monthYear])

  useEffect(() => {
    load()
  }, [load])

  const markDay = useCallback(async (
    date: string,
    status: AttendanceStatus,
    leaveType?: LeaveType
  ) => {
    setDayMap(prev => ({ ...prev, [date]: { status, leaveType } }))
    try {
      const rec = await attendanceApi.mark({ date, status })
      setDayMap(prev => ({
        ...prev,
        [date]: { status, leaveType, recordId: rec.id },
      }))
      const sum = await summaryApi.get(monthYear).catch(() => null)
      setSummary(sum)
    } catch (e) {
      setDayMap(prev => {
        const next = { ...prev }
        delete next[date]
        return next
      })
      throw e
    }
  }, [monthYear])

  const removeDay = useCallback(async (date: string) => {
    const prev = dayMap[date]
    setDayMap(p => { const n = { ...p }; delete n[date]; return n })
    try {
      await attendanceApi.remove(date)
      const sum = await summaryApi.get(monthYear).catch(() => null)
      setSummary(sum)
    } catch (e) {
      if (prev) setDayMap(p => ({ ...p, [date]: prev }))
      throw e
    }
  }, [dayMap, monthYear])

  return { dayMap, summary, loading, error, markDay, removeDay, reload: load }
}
