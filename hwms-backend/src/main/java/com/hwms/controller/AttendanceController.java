package com.hwms.controller;

import com.hwms.dto.request.AttendanceRequest;
import com.hwms.entity.Attendance;
import com.hwms.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping
    public ResponseEntity<Attendance> markAttendance(@RequestBody AttendanceRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Attendance log = attendanceService.markAttendance(email, request.getDate(), request.getStatus());
        return ResponseEntity.ok(log);
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> deleteAttendance(
            @PathVariable @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date) {
        
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        attendanceService.deleteAttendance(email, date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/month")
    public ResponseEntity<List<Attendance>> getMonthlyAttendance(@RequestParam("month") String monthYear) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        // Uses the existing service to fetch the list for the UI
        List<Attendance> records = attendanceService.getMonthlyAttendance(email, monthYear);
        return ResponseEntity.ok(records);
    }
}