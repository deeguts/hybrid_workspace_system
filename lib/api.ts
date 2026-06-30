import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  AttendanceRequest,
  AttendanceRecord,
  LeaveRequest,
  LeaveRecord,
  MonthlySummary,
  UserRecord,
} from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export const tokenStore = {
  get: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('hwms_token') : null,
  set: (t: string) => localStorage.setItem('hwms_token', t),
  clear: () => localStorage.removeItem('hwms_token'),
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (auth) {
    const token = tokenStore.get()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = `API error ${res.status}`
    try {
      const body = await res.json()
      message = body.message ?? body.error ?? message
    } catch {
      // non-JSON error body — keep default message
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const authApi = {
  login: (body: LoginRequest) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }, false),

  register: (body: RegisterRequest) =>
    request<string>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }, false),
}

export const attendanceApi = {
  mark: (body: AttendanceRequest) =>
    request<AttendanceRecord>('/api/attendance', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getByMonth: (monthYear: string) =>
    request<AttendanceRecord[]>(`/api/attendance/month?month=${monthYear}`),

  remove: (date: string) =>
    request<void>(`/api/attendance/${date}`, { method: 'DELETE' }),
}

export const summaryApi = {
  get: (monthYear: string) =>
    request<MonthlySummary>(`/api/summary/${monthYear}`),
}

export const leavesApi = {
  apply: (body: LeaveRequest) =>
    request<LeaveRecord>('/api/leaves', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

export const adminApi = {
  getAllUsers: () =>
    request<UserRecord[]>('/api/admin/users'),

  getAllAttendance: () =>
    request<AttendanceRecord[]>('/api/admin/attendance'),

  getDeficientEmployees: (monthYear: string) =>
    request<MonthlySummary[]>(`/api/admin/deficient?monthYear=${monthYear}`),
    approveLeave: (leaveId: number) =>
    request<LeaveRecord>(`/api/admin/leaves/${leaveId}/approve`, { method: 'PUT' }),

setWfoTarget: (monthYear: string, target: number) =>
    request<string>(
      `/api/admin/wfo-target?monthYear=${monthYear}&target=${target}`,
      { method: 'POST' }
    ),
}
