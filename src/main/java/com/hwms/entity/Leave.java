package com.hwms.entity;

import com.hwms.enums.LeaveType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leaves", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "leave_date"})
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Leave {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long leaveId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "leave_date", nullable = false)
    private LocalDate leaveDate;
    
    @Enumerated(EnumType.STRING)
    private LeaveType leaveType;
    
    @Builder.Default
    private Boolean isApproved = false; // Requires Admin approval by default
    
    private LocalDateTime appliedAt;
}