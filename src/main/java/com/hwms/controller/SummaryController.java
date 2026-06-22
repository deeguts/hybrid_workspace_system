package com.hwms.controller;

import com.hwms.dto.response.MonthlySummaryResponse;
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

    @GetMapping("/{monthYear}")
    public ResponseEntity<MonthlySummaryResponse> getMySummary(
            @PathVariable String monthYear,
            Authentication authentication) {
        
        Long userId = Long.parseLong(authentication.getName());
        MonthlySummaryResponse response = summaryService.getMonthlySummary(userId, monthYear);
        
        return ResponseEntity.ok(response);
    }
}