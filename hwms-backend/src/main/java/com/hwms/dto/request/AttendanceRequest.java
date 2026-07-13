package com.hwms.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.hwms.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class AttendanceRequest {
    
    @NotNull(message = "Date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate date;

    @NotNull(message = "Status is required")
    private AttendanceStatus status;
}