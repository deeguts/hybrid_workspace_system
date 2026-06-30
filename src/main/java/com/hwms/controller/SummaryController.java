package com.hwms.controller;

import com.hwms.dto.response.MonthlySummaryResponse;
import com.hwms.entity.User;
import com.hwms.repository.UserRepository;
import com.hwms.service.MonthlySummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/summary")
@RequiredArgsConstructor
public class SummaryController {

    private final MonthlySummaryService summaryService;
    private final UserRepository userRepository;

    @GetMapping("/{monthYear}")
    public ResponseEntity<MonthlySummaryResponse> getMySummary(
            @PathVariable String monthYear,
            Authentication authentication) {
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
                
        MonthlySummaryResponse response = summaryService.getMonthlySummary(user.getUserId(), monthYear);
        return ResponseEntity.ok(response);
    }
}