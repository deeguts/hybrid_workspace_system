package com.hwms.controller;

import com.hwms.entity.User;
import com.hwms.dto.response.MonthlySummaryResponse;
import com.hwms.repository.UserRepository;
import com.hwms.service.MonthlySummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ManagerController {

    private final UserRepository userRepository;
    private final MonthlySummaryService summaryService;

    @GetMapping("/team")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<User>> getMyTeam(@AuthenticationPrincipal UserDetails customUser) {
        User manager = userRepository.findByEmail(customUser.getUsername())
                .orElseThrow(() -> new RuntimeException("Manager session not found"));
        
        return ResponseEntity.ok(userRepository.findByManagerUserId(manager.getUserId()));
    }

    @GetMapping("/team-deficiency")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<MonthlySummaryResponse>> getTeamDeficiencyReport(
            @RequestParam("monthYear") String monthYear,
            @AuthenticationPrincipal UserDetails customUser) {
        
        // 1. Get the current Manager from the session token
        User manager = userRepository.findByEmail(customUser.getUsername())
                .orElseThrow(() -> new RuntimeException("Manager session not found"));

        // 2. Fetch the manager's assigned team directly from the DB
        List<User> myTeam = userRepository.findByManagerUserId(manager.getUserId());
        
        // 3. Extract the emails of the team members into a fast, memory-safe Set
        Set<String> teamEmails = myTeam.stream()
                .map(User::getEmail)
                .collect(Collectors.toSet());

        // 4. Pull the global deficiency list (exact same list Admin sees)
        List<MonthlySummaryResponse> globalDeficiencies = summaryService.getDeficientEmployees(monthYear);

        // 5. Instantly filter by checking if the deficiency email exists in the manager's team emails
        List<MonthlySummaryResponse> teamOnlyDeficiencies = globalDeficiencies.stream()
                .filter(deficiency -> deficiency.getUserEmail() != null && teamEmails.contains(deficiency.getUserEmail()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(teamOnlyDeficiencies);
    }
}