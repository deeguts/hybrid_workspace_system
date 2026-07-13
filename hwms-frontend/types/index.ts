export type Role = 'EMPLOYEE' | 'ADMIN' | 'MANAGER' 
export type AttendanceStatus = 'WFO' | 'WFH' | 'LEAVE'
export type LeaveType = 'SICK' | 'CASUAL' | 'PAID'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role?: Role
}

export interface AttendanceRequest {
  date: string
  status: AttendanceStatus
}

export interface LeaveRequest {
  date: string
  type: LeaveType
}

export interface AuthResponse {
  token: string
  email: string
  name: string
  role: Role
}

export interface AttendanceRecord {
  id: number
  attendanceDate: string
  status: AttendanceStatus
  leaveType?: LeaveType
  loggedAt: string
}

export interface LeaveRecord {
  leaveId: number
  leaveDate: string
  leaveType: LeaveType
  isApproved: boolean
  appliedAt: string
}

export interface UserRecord {
  userId: number
  name: string
  email: string
  role: Role
  createdAt: string
  manager?: UserRecord | null 
}

export interface MonthlySummary {
  monthYear: string
  requiredWfo: number
  completedWfo: number
  remainingWfo: number
  excessWfo: number
  lastUpdated: string
  userName?: string
  userEmail?: string
}

export interface DayState {
  status: AttendanceStatus
  leaveType?: LeaveType
  recordId?: number
}