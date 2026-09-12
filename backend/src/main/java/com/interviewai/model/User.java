package com.interviewai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import org.springframework.data.mongodb.core.index.Indexed;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;
    private String name;
    private String email;
    private String password;
    private String role; // USER, ADMIN, SUPER_ADMIN

    /**
     * Unique Administrator Code for Administrator accounts (e.g. ADMIN-A123).
     * Candidates enter this code during registration to link to the Administrator.
     */
    @Indexed(unique = true, sparse = true)
    private String adminCode;

    /**
     * Stores the assigned Administrator ID for Candidates (USER role).
     * Establishes the relationship: Candidate -> Administrator.
     */
    @Indexed
    private String adminId;

    private String college;
    private String education;
    private List<String> skills;
    private String preferredJobRole;
    private String profileImage;
    private int xpPoints;
    private String level;
    private int currentStreak;
    private boolean emailVerified;
    private boolean isOnLeaderboard;
    private Instant createdAt;
    private Instant updatedAt;
}
