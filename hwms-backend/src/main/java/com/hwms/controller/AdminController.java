package com.hwms.controller;

import com.hwms.entity.User;
import com.hwms.enums.Role;
import com.hwms.exception.ResourceNotFoundException;
import com.hwms.repository.UserRepository;
import com.hwms.service.MonthlySummaryService;
import com.hwms.dto.response.MonthlySummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserRepository userRepository;
    private final MonthlySummaryService summaryService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/deficient")
    public ResponseEntity<List<MonthlySummaryResponse>> getDeficientEmployees(
            @RequestParam("monthYear") String monthYear) {
        return ResponseEntity.ok(summaryService.getDeficientEmployees(monthYear));
    }

    @PostMapping("/wfo-target")
    public ResponseEntity<java.util.Map<String, String>> setWfoTarget(
            @RequestParam("monthYear") String monthYear,
            @RequestParam("target") int target) {
        List<com.hwms.entity.User> allUsers = userRepository.findAll();
        
        for (com.hwms.entity.User user : allUsers) {
            try {
                summaryService.updateRequiredWfo(user.getUserId(), monthYear, target);
            } catch (com.hwms.exception.ResourceNotFoundException e) {
                summaryService.recalculate(user.getUserId(), monthYear);
                summaryService.updateRequiredWfo(user.getUserId(), monthYear, target);
            }
        }
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("message", "Target updated successfully for all employees");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/managers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllManagers() {
        return ResponseEntity.ok(userRepository.findByRole(Role.MANAGER));
    }

    @PutMapping("/users/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUserRole(
            @PathVariable Long userId, 
            @RequestParam("role") String roleStr) {
        
        Role newRole = Role.fromString(roleStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getRole() == Role.MANAGER && newRole == Role.EMPLOYEE) {
            List<User> subordinates = userRepository.findByManagerUserId(userId);
            for (User sub : subordinates) {
                sub.setManager(null);
                userRepository.save(sub);
            }
        }
        
        user.setRole(newRole);
        return ResponseEntity.ok(userRepository.save(user));
    } 

    @PutMapping("/users/{userId}/assign-manager")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> assignManager(
            @PathVariable Long userId, 
            @RequestParam(value = "managerId", required = false) Long managerId) {
        
        User employee = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        
        if (managerId != null) {
            User manager = userRepository.findById(managerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
            if (manager.getRole() != Role.MANAGER) {
                throw new IllegalArgumentException("Target user is not a registered Manager");
            }
            employee.setManager(manager);
        } else {
            employee.setManager(null);
        }
        
        return ResponseEntity.ok(userRepository.save(employee));
    }
}