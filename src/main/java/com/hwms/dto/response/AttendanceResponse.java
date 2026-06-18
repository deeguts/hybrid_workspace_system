package com.hwms.dto.response;

import com.hwms.enums.AttendanceStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AttendanceResponse {
    private Long attendanceId;
    private LocalDate attendanceDate;
    private AttendanceStatus status;
    private LocalDateTime loggedAt;
}   