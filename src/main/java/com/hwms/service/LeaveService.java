package com.hwms.service;

import com.hwms.dto.request.LeaveRequest;
import com.hwms.entity.Leave;
import com.hwms.entity.User;
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
        // Prevent duplicate leave entries for the same day
        if (leaveRepository.existsByUserUserIdAndLeaveDate(userId, request.date())) {
            throw new IllegalStateException("Leave already applied for this date.");
        }

        // Check if attendance is already marked; business rules dictate a day holds a single status [cite: 130]
        if (attendanceRepository.existsByUserUserIdAndAttendanceDate(userId, request.date())) {
             throw new IllegalStateException("Attendance already marked for this date. Please delete attendance before applying for leave.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // FR-07 states zero-balance leaves should be blocked, but since we don't have a LeaveBalance table yet, 
        // we will proceed with creation and mark it as unapproved pending admin review. 

        Leave leave = Leave.builder()
                .user(user)
                .leaveDate(request.date())
                .leaveType(request.type())
                .isApproved(false) 
                .appliedAt(LocalDateTime.now())
                .build();

        return leaveRepository.save(leave);
    }
}