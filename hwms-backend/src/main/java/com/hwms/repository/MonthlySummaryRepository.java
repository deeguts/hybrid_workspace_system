package com.hwms.repository;

import com.hwms.entity.MonthlySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MonthlySummaryRepository extends JpaRepository<MonthlySummary, Long> {
    Optional<MonthlySummary> findByUserUserIdAndMonthYear(Long userId, String monthYear);
    
    List<MonthlySummary> findByMonthYear(String monthYear);

    // Fetch employees who are failing to meet the WFO requirement
    @Query("SELECT m FROM MonthlySummary m WHERE m.monthYear = :monthYear AND m.completedWfo < m.requiredWfo")
    List<MonthlySummary> findDeficientSummaries(@Param("monthYear") String monthYear);
}