package com.hwms.service;

import com.hwms.dto.response.MonthlySummaryResponse;
import com.hwms.entity.MonthlySummary;
import com.hwms.entity.User;
import com.hwms.enums.AttendanceStatus;
import com.hwms.exception.ResourceNotFoundException;
import com.hwms.repository.AttendanceRepository;
import com.hwms.repository.MonthlySummaryRepository;
import com.hwms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class MonthlySummaryService {
    private static final int MIN_REQUIRED_WFO = 1;
    private static final int MAX_REQUIRED_WFO = 23;

    private static final int DEFAULT_REQUIRED_WFO = 12;

    private final MonthlySummaryRepository summaryRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

   @Transactional
public void recalculate(Long userId, String monthYear) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

    long completedWfo = attendanceRepository
        .countByUserAndStatusAndMonth(userId, AttendanceStatus.WFO, monthYear);

    MonthlySummary summary = summaryRepository
        .findByUserUserIdAndMonthYear(userId, monthYear)
        .orElse(MonthlySummary.builder()
            .user(user)
            .monthYear(monthYear)
            .requiredWfo(12)
            .build()
        );

    int completed = (int) completedWfo;
    int required  = summary.getRequiredWfo(); 
    int excess    = Math.max(0, completed - required);
    int remaining = Math.max(0, required - completed);

    summary.setCompletedWfo(completed);
    summary.setExcessWfo(excess);
    summary.setRemainingWfo(remaining);
    summary.setAuditedAt(LocalDateTime.now());

    summaryRepository.save(summary);
}

    public MonthlySummaryResponse getSummary(Long userId, String monthYear) {
        MonthlySummary summary = summaryRepository
            .findByUserUserIdAndMonthYear(userId, monthYear)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No summary found for month: " + monthYear));
        return toResponse(summary, false);
    }

    public List<MonthlySummaryResponse> getAllSummariesForUser(Long userId) {
        return summaryRepository
            .findAll()
            .stream()
            .filter(s -> s.getUser() != null && s.getUser().getUserId().equals(userId))
            .sorted((a, b) -> b.getMonthYear().compareTo(a.getMonthYear()))
            .map(s -> toResponse(s, false))
            .toList();
    }

    public List<MonthlySummaryResponse> getMonthReport(String monthYear) {
        return summaryRepository
            .findByMonthYear(monthYear)
            .stream()
            .sorted((a, b) -> a.getUser().getName().compareToIgnoreCase(b.getUser().getName()))
            .map(s -> toResponse(s, true))
            .toList();
    }

    public List<MonthlySummaryResponse> getDeficientEmployees(String monthYear) {
    Map<Long, MonthlySummary> existingSummaries = summaryRepository.findByMonthYear(monthYear)
        .stream()
        .collect(Collectors.toMap(s -> s.getUser().getUserId(), s -> s));

    int dynamicTargetForMonth = existingSummaries.values().stream()
        .map(MonthlySummary::getRequiredWfo)
        .findFirst()
        .orElse(12); 

    List<MonthlySummaryResponse> deficientList = new ArrayList<>();

    for (User user : userRepository.findAll()) {
        MonthlySummary summary = existingSummaries.get(user.getUserId());

        if (summary != null) {
            if (summary.getRemainingWfo() > 0) {
                deficientList.add(toResponse(summary, true));
            }
        } else {
            deficientList.add(MonthlySummaryResponse.builder()
                .monthYear(monthYear)
                .requiredWfo(dynamicTargetForMonth)
                .completedWfo(0)
                .remainingWfo(dynamicTargetForMonth)
                .excessWfo(0)
                .userName(user.getName())
                .userEmail(user.getEmail())
                .build());
        }
    }

    return deficientList.stream()
        .sorted((a, b) -> a.getUserName().compareToIgnoreCase(b.getUserName()))
        .toList();
}

 @Transactional
public MonthlySummaryResponse updateRequiredWfo(Long userId, String monthYear, int newRequired) {
    if (newRequired < MIN_REQUIRED_WFO || newRequired > MAX_REQUIRED_WFO) {
        throw new IllegalArgumentException("Target must be a logical number of weekdays (1-" + MAX_REQUIRED_WFO + ")");
    }

    MonthlySummary summary = summaryRepository
        .findByUserUserIdAndMonthYear(userId, monthYear)
        .orElseThrow(() -> new ResourceNotFoundException(
            "No summary found for user " + userId + " month " + monthYear));

    summary.setRequiredWfo(newRequired);
    int excess    = Math.max(0, summary.getCompletedWfo() - newRequired);
    int remaining = Math.max(0, newRequired - summary.getCompletedWfo());
    summary.setExcessWfo(excess);
    summary.setRemainingWfo(remaining);
    summary.setAuditedAt(LocalDateTime.now());

    return toResponse(summaryRepository.save(summary), false);
}

    private MonthlySummaryResponse toResponse(MonthlySummary s, boolean includeUser) {
        MonthlySummaryResponse.MonthlySummaryResponseBuilder builder = MonthlySummaryResponse.builder()
            .summaryId(s.getId())
            .monthYear(s.getMonthYear())
            .requiredWfo(s.getRequiredWfo())
            .completedWfo(s.getCompletedWfo())
            .remainingWfo(s.getRemainingWfo())
            .excessWfo(s.getExcessWfo())
            .auditedAt(s.getAuditedAt());

        if (includeUser && s.getUser() != null) {
            builder.userName(s.getUser().getName());
            builder.userEmail(s.getUser().getEmail());
        }

        return builder.build();
    }
}