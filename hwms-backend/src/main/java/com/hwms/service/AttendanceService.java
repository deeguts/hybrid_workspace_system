package com.hwms.service;

import com.hwms.entity.Attendance;
import com.hwms.entity.MonthlySummary;
import com.hwms.entity.User;
import com.hwms.enums.AttendanceStatus;
import com.hwms.exception.ResourceNotFoundException;
import com.hwms.repository.AttendanceRepository;
import com.hwms.repository.MonthlySummaryRepository;
import com.hwms.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final MonthlySummaryRepository summaryRepository;
    private final UserRepository userRepository;

    public AttendanceService(AttendanceRepository attendanceRepository, 
                             MonthlySummaryRepository summaryRepository, 
                             UserRepository userRepository) {
        this.attendanceRepository = attendanceRepository;
        this.summaryRepository = summaryRepository;
        this.userRepository = userRepository;
    }

    // This is the GET method we added for the Calendar Reload issue
    public List<Attendance> getMonthlyAttendance(String email, String monthYear) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        return attendanceRepository.findByUserAndMonth(user.getUserId(), monthYear);
    }

    @Transactional
    public Attendance markAttendance(String email, LocalDate date, AttendanceStatus status) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Attendance attendance = attendanceRepository.findByUserUserIdAndAttendanceDate(user.getUserId(), date)
                .orElse(Attendance.builder().user(user).attendanceDate(date).build());
        
        attendance.setStatus(status);
        Attendance savedAttendance = attendanceRepository.save(attendance);

        updateSummary(user, date);

        return savedAttendance;
    }

    private void updateSummary(User user, LocalDate date) {
        String monthYear = date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        
        MonthlySummary summary = summaryRepository.findByUserUserIdAndMonthYear(user.getUserId(), monthYear)
                .orElse(MonthlySummary.builder()
                        .user(user)
                        .monthYear(monthYear)
                        .auditedAt(LocalDateTime.now())
                        .build());

        long completedWfo = attendanceRepository.countByUserAndStatusAndMonth(user.getUserId(), AttendanceStatus.WFO, monthYear);
        summary.setCompletedWfo((int) completedWfo);

        if (completedWfo >= summary.getRequiredWfo()) {
            summary.setRemainingWfo(0);
            summary.setExcessWfo((int) completedWfo - summary.getRequiredWfo());
        } else {
            summary.setRemainingWfo(summary.getRequiredWfo() - (int) completedWfo);
            summary.setExcessWfo(0);
        }

        summary.setAuditedAt(LocalDateTime.now());
        summaryRepository.save(summary);
    }

    @Transactional
    public void deleteAttendance(String email, LocalDate date) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Attendance attendance = attendanceRepository.findByUserUserIdAndAttendanceDate(user.getUserId(), date)
                .orElseThrow(() -> new RuntimeException("Attendance record not found for this date."));

        attendanceRepository.delete(attendance);
        updateSummary(user, date);
    }
}