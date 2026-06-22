package com.hwms.controller;

import com.hwms.dto.request.LeaveRequest;
import com.hwms.entity.Leave;
import com.hwms.entity.User;
import com.hwms.repository.UserRepository;
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
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Leave> applyForLeave(
            @RequestBody LeaveRequest request,
            Authentication authentication) {
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
                
        Leave appliedLeave = leaveService.applyLeave(user.getUserId(), request);
        return ResponseEntity.ok(appliedLeave);
    }
}