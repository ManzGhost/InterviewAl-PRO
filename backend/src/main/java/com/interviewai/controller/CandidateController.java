package com.interviewai.controller;

import com.interviewai.model.User;
import com.interviewai.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/candidates")
@CrossOrigin(origins = "*")
public class CandidateController {

    private final UserRepository userRepository;

    public CandidateController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public record CandidateUpdateRequest(
            String name,
            String college,
            String education,
            List<String> skills,
            String preferredJobRole,
            Boolean isOnLeaderboard
    ) {}

    /**
     * GET /api/candidates
     * Administrator receives only their own candidates.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getCandidates(
            @RequestHeader(value = "X-Admin-Id", required = false) String adminId,
            @RequestHeader(value = "X-Admin-Role", defaultValue = "ADMIN") String role
    ) {
        if (adminId == null || adminId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Administrator ID required in header");
        }

        List<User> candidates;
        if ("SUPER_ADMIN".equalsIgnoreCase(role)) {
            candidates = userRepository.findByRole("USER");
        } else {
            candidates = userRepository.findByAdminId(adminId);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "count", candidates.size(),
                "candidates", candidates
        ));
    }

    /**
     * GET /api/candidates/{id}
     * Verify candidate.adminId matches logged-in Administrator ID.
     * Return HTTP 403 Forbidden if not authorized.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCandidateById(
            @PathVariable String id,
            @RequestHeader(value = "X-Admin-Id", required = false) String adminId,
            @RequestHeader(value = "X-Admin-Role", defaultValue = "ADMIN") String role
    ) {
        if (adminId == null || adminId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Administrator ID required in header");
        }

        User candidate = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidate not found"));

        if (!"SUPER_ADMIN".equalsIgnoreCase(role) && !adminId.equals(candidate.getAdminId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: Access denied. Candidate belongs to another Administrator.");
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "candidate", candidate
        ));
    }

    /**
     * PUT /api/candidates/{id}
     * Verify candidate.adminId matches logged-in Administrator ID before updating.
     * Return HTTP 403 Forbidden if not authorized.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCandidate(
            @PathVariable String id,
            @RequestBody CandidateUpdateRequest request,
            @RequestHeader(value = "X-Admin-Id", required = false) String adminId,
            @RequestHeader(value = "X-Admin-Role", defaultValue = "ADMIN") String role
    ) {
        if (adminId == null || adminId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Administrator ID required in header");
        }

        User candidate = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidate not found"));

        if (!"SUPER_ADMIN".equalsIgnoreCase(role) && !adminId.equals(candidate.getAdminId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: Access denied. Candidate belongs to another Administrator.");
        }

        if (request.name() != null) candidate.setName(request.name().trim());
        if (request.college() != null) candidate.setCollege(request.college().trim());
        if (request.education() != null) candidate.setEducation(request.education().trim());
        if (request.skills() != null) candidate.setSkills(request.skills());
        if (request.preferredJobRole() != null) candidate.setPreferredJobRole(request.preferredJobRole().trim());
        if (request.isOnLeaderboard() != null) candidate.setIsOnLeaderboard(request.isOnLeaderboard());
        candidate.setUpdatedAt(Instant.now());

        User saved = userRepository.save(candidate);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Candidate updated successfully.",
                "candidate", saved
        ));
    }

    /**
     * DELETE /api/candidates/{id}
     * Verify candidate.adminId matches logged-in Administrator ID before deleting.
     * Return HTTP 403 Forbidden if not authorized.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteCandidate(
            @PathVariable String id,
            @RequestHeader(value = "X-Admin-Id", required = false) String adminId,
            @RequestHeader(value = "X-Admin-Role", defaultValue = "ADMIN") String role
    ) {
        if (adminId == null || adminId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Administrator ID required in header");
        }

        User candidate = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidate not found"));

        if (!"SUPER_ADMIN".equalsIgnoreCase(role) && !adminId.equals(candidate.getAdminId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: Access denied. Candidate belongs to another Administrator.");
        }

        userRepository.deleteById(id);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", String.format("Candidate %s deleted successfully.", candidate.getName()),
                "deletedCandidate", candidate
        ));
    }
}
