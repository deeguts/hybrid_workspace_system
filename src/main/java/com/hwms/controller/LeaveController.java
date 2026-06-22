package com.hwms.controller;

import com.hwms.dto.request.LeaveRequest;
import com.hwms.entity.Leave;
import com.hwms.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @PostMapping
    public ResponseEntity<Leave> applyForLeave(
            @RequestBody LeaveRequest request,
            Authentication authentication) {
        
        Long userId = Long.parseLong(authentication.getName()); 
        Leave appliedLeave = leaveService.applyLeave(userId, request);
        return ResponseEntity.ok(appliedLeave);
    }
}