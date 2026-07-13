package com.hwms.dto.request;

import com.hwms.enums.LeaveType;
import java.time.LocalDate;

public record LeaveRequest(LocalDate date, LeaveType type) {}