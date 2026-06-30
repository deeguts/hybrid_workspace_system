package com.hwms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_summary", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "month_year"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlySummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "month_year", nullable = false, length = 7)
    private String monthYear;
    
    @Builder.Default
    @Column(name = "required_wfo", nullable = false)
    private Integer requiredWfo = 12;

    @Builder.Default
    @Column(name = "completed_wfo", nullable = false)
    private Integer completedWfo = 0;
    
    @Builder.Default
    @Column(name = "remaining_wfo", nullable = false)
    private Integer remainingWfo = 12;

    @Builder.Default
    @Column(name = "excess_wfo", nullable = false)
    private Integer excessWfo = 0;

    @UpdateTimestamp
    @Column(name = "audited_at")
    private LocalDateTime auditedAt;
}