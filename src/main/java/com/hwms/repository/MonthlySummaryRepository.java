package com.hwms.repository;

import com.hwms.entity.MonthlySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MonthlySummaryRepository extends JpaRepository<MonthlySummary, Long> {
    Optional<MonthlySummary> findByUserUserIdAndMonthYear(Long userId, String monthYear);
}
