package com.hwms.controller;

import com.hwms.dto.response.MonthlySummaryResponse;
import com.hwms.entity.Attendance;
import com.hwms.entity.Leave;
import com.hwms.entity.User;
import com.hwms.repository.AttendanceRepository;
import com.hwms.repository.UserRepository;
import com.hwms.service.LeaveService;
import com.hwms.service.MonthlySummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveService leaveService;
    private final MonthlySummaryService summaryService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/attendance")
    public ResponseEntity<List<Attendance>> getAllAttendance() {
        return ResponseEntity.ok(attendanceRepository.findAll());
    }

    // 1. Approve a Leave Request
    @PutMapping("/leaves/{leaveId}/approve")
    public ResponseEntity<Leave> approveLeave(@PathVariable Long leaveId) {
        return ResponseEntity.ok(leaveService.approveLeave(leaveId));
    }

    // 2. Configure Global WFO Target for a month
    @PutMapping("/config/wfo-target/{monthYear}")
    public ResponseEntity<String> updateWfoTarget(
            @PathVariable String monthYear,
            @RequestParam int target) {
        summaryService.updateGlobalWfoRequirement(monthYear, target);
        return ResponseEntity.ok("Global WFO target updated to " + target + " for " + monthYear);
    }

    // 3. View Deficient Employees (Alerts/Reporting)
    @GetMapping("/reports/deficient/{monthYear}")
    public ResponseEntity<List<MonthlySummaryResponse>> getDeficientEmployees(@PathVariable String monthYear) {
        return ResponseEntity.ok(summaryService.getDeficientEmployees(monthYear));
    }
}