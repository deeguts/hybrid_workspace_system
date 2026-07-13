package com.hwms.service;

import com.hwms.dto.request.LeaveRequest;
import com.hwms.entity.Leave;
import com.hwms.entity.User;
import com.hwms.enums.Role;
import com.hwms.repository.AttendanceRepository;
import com.hwms.repository.LeaveRepository;
import com.hwms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;

    @Transactional
    public Leave applyLeave(Long userId, LeaveRequest request) {
        if (leaveRepository.existsByUserUserIdAndLeaveDate(userId, request.date())) {
            throw new IllegalStateException("Leave already applied for this date.");
        }

        if (attendanceRepository.existsByUserUserIdAndAttendanceDate(userId, request.date())) {
             throw new IllegalStateException("Attendance already marked for this date. Please delete attendance before applying for leave.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAutoApproved = user.getRole() == Role.ADMIN;

        Leave leave = Leave.builder()
                .user(user)
                .leaveDate(request.date())
                .leaveType(request.type())
                .isApproved(isAutoApproved) 
                .appliedAt(LocalDateTime.now())
                .build();

        return leaveRepository.save(leave);
    }

    @Transactional
    public Leave approveLeave(Long leaveId) {
        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
        
        if (Boolean.TRUE.equals(leave.getIsApproved())) {
            throw new IllegalStateException("Leave is already approved.");
        }
        
        leave.setIsApproved(true);
        return leaveRepository.save(leave);
    }
}