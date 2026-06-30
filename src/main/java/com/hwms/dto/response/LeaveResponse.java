package com.hwms.dto.response;

import com.hwms.enums.LeaveType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record LeaveResponse(
        Long leaveId,
        Long userId,
        LocalDate leaveDate,
        LeaveType leaveType,
        Boolean isApproved,
        LocalDateTime appliedAt
) {}