package com.hwms.controller;

import com.hwms.dto.request.AttendanceRequest;
import com.hwms.entity.Attendance;
import com.hwms.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping
    public ResponseEntity<Attendance> markAttendance(
            @RequestBody AttendanceRequest request,
            Authentication authentication) {
        
        String email = authentication.getName();
        Attendance log = attendanceService.markAttendance(email, request.getDate(), request.getStatus());
        return ResponseEntity.ok(log);
    }
}