package com.hwms.repository;

import com.hwms.entity.Attendance;
import com.hwms.enums.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByUserUserIdAndAttendanceDate(Long userId, LocalDate date);

    boolean existsByUserUserIdAndAttendanceDate(Long userId, LocalDate date);

    List<Attendance> findByUserUserIdOrderByAttendanceDateDesc(Long userId);

    /** Count WFO days for a user*/
    @Query("""
        SELECT COUNT(a) FROM Attendance a
        WHERE a.user.userId = :userId
          AND a.status = :status
          AND FUNCTION('DATE_FORMAT', a.attendanceDate, '%Y-%m') = :monthYear
        """)
    long countByUserAndStatusAndMonth(
        @Param("userId") Long userId,
        @Param("status") AttendanceStatus status,
        @Param("monthYear") String monthYear
    );

    /** Fetch all attendance records for a user in a given month */
    @Query("""
        SELECT a FROM Attendance a
        WHERE a.user.userId = :userId
          AND FUNCTION('DATE_FORMAT', a.attendanceDate, '%Y-%m') = :monthYear
        ORDER BY a.attendanceDate ASC
        """)
    List<Attendance> findByUserAndMonth(
        @Param("userId") Long userId,
        @Param("monthYear") String monthYear
    );
}