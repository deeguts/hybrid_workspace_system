package com.hwms.repository;

import com.hwms.entity.Leave;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface LeaveRepository extends JpaRepository<Leave, Long> {
    boolean existsByUserUserIdAndLeaveDate(Long userId, LocalDate date);
    List<Leave> findByUserUserId(Long userId);
}