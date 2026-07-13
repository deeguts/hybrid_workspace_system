package com.hwms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MonthlySummaryResponse {
    private Long summaryId;
    private String monthYear;
    private Integer requiredWfo;
    private Integer completedWfo;
    private Integer remainingWfo;
    private Integer excessWfo;
    private LocalDateTime auditedAt;
    private String userName;
    private String userEmail;
    private Integer UserId;
}
