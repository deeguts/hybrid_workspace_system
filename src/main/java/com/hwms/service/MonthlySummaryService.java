package com.hwms.service;

import com.hwms.dto.response.MonthlySummaryResponse;
import com.hwms.entity.MonthlySummary;
import com.hwms.entity.User;
import com.hwms.enums.AttendanceStatus;
import com.hwms.repository.AttendanceRepository;
import com.hwms.repository.MonthlySummaryRepository;
import com.hwms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MonthlySummaryService {

    private final MonthlySummaryRepository summaryRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    @Transactional
    public void recalculateSummary(Long userId, String monthYear) {
        long wfoCountLong = attendanceRepository.countByUserAndStatusAndMonth(userId, AttendanceStatus.WFO, monthYear);
        int wfoCount = (int) wfoCountLong;
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MonthlySummary summary = summaryRepository.findByUserUserIdAndMonthYear(userId, monthYear)
                .orElse(MonthlySummary.builder()
                        .user(user)
                        .monthYear(monthYear)
                        .requiredWfo(12)
                        .build());

        summary.setCompletedWfo(wfoCount);
        summary.setRemainingWfo(Math.max(0, summary.getRequiredWfo() - wfoCount));
        summary.setExcessWfo(Math.max(0, wfoCount - summary.getRequiredWfo()));
        summary.setAuditedAt(LocalDateTime.now());

        summaryRepository.save(summary);
    }

    @Transactional(readOnly = true)
    public MonthlySummaryResponse getMonthlySummary(Long userId, String monthYear) {
        return summaryRepository.findByUserUserIdAndMonthYear(userId, monthYear)
                .map(summary -> new MonthlySummaryResponse(
                        summary.getMonthYear(),
                        summary.getRequiredWfo(),
                        summary.getCompletedWfo(),
                        summary.getRemainingWfo(),
                        summary.getExcessWfo(),
                        summary.getAuditedAt()
                ))
                .orElseGet(() -> new MonthlySummaryResponse(
                        monthYear,
                        12, 
                        0,  
                        12, 
                        0,  
                        null
                ));
    }

    @Transactional
    public void updateGlobalWfoRequirement(String monthYear, int newTarget) {
        List<MonthlySummary> summaries = summaryRepository.findByMonthYear(monthYear);
        
        for (MonthlySummary summary : summaries) {
            summary.setRequiredWfo(newTarget);
            summary.setRemainingWfo(Math.max(0, newTarget - summary.getCompletedWfo()));
            summary.setExcessWfo(Math.max(0, summary.getCompletedWfo() - newTarget));
            summary.setAuditedAt(LocalDateTime.now());
        }
        
        summaryRepository.saveAll(summaries);
    }
    
    @Transactional(readOnly = true)
    public List<MonthlySummaryResponse> getDeficientEmployees(String monthYear) {
        return summaryRepository.findDeficientSummaries(monthYear).stream()
            .map(summary -> new MonthlySummaryResponse(
                    summary.getMonthYear(),
                    summary.getRequiredWfo(),
                    summary.getCompletedWfo(),
                    summary.getRemainingWfo(),
                    summary.getExcessWfo(),
                    summary.getAuditedAt()
            )).toList();
    }
}