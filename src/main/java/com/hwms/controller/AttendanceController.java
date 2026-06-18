package com.hwms.controller;

import com.hwms.dto.request.AttendanceRequest;
import com.hwms.entity.Attendance;
import com.hwms.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/mark")
    public ResponseEntity<Attendance> markAttendance(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AttendanceRequest request) {
        
        Attendance logged = attendanceService.markAttendance(
                userDetails.getUsername(), 
                request.getDate(), 
                request.getStatus()
        );
        return ResponseEntity.ok(logged);
    }
}