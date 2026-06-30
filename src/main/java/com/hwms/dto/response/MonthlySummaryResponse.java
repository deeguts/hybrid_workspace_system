package com.hwms.dto.response;

import java.time.LocalDateTime;

public record MonthlySummaryResponse(
        String monthYear,
        Integer requiredWfo,
        Integer completedWfo,
        Integer remainingWfo,
        Integer excessWfo,
        LocalDateTime lastUpdated
) {}