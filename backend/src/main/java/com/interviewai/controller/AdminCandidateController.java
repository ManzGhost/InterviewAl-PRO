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
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminCandidateController {

    private final UserRepository userRepository;

    public AdminCandidateController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * DTO for candidate response with populated Administrator details
     */
    public record CandidateResponse(
            User candidate,
            String adminId,
            String adminName,
            String adminEmail
    ) {}

    public record AssignAdminRequest(String adminId) {}

    /**
     * Get all administrators (Super Admin / Admin view)
     */
    @GetMapping("/administrators")
    public ResponseEntity<Map<String, Object>> getAllAdministrators() {
        List<User> admins = userRepository.findByRole("ADMIN");
        admins.addAll(userRepository.findByRole("SUPER_ADMIN"));
        return ResponseEntity.ok(Map.of(
                "success", true,
                "administrators", admins
        ));
    }

    /**
     * Get "My Candidates" - only candidates assigned to current administrator
     */
    @GetMapping("/my-candidates")
    public ResponseEntity<Map<String, Object>> getMyCandidates(@RequestHeader(value = "X-Admin-Id", required = false) String adminId) {
        if (adminId == null || adminId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Administrator ID required in header");
        }
        List<User> candidates = userRepository.findByAdminId(adminId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "count", candidates.size(),
                "candidates", candidates
        ));
    }

    /**
     * Assign or reassign a Candidate to an Administrator
     */
    @PutMapping("/candidates/{candidateId}/assign-admin")
    public ResponseEntity<Map<String, Object>> assignAdministrator(
            @PathVariable String candidateId,
            @RequestBody AssignAdminRequest request
    ) {
        if (request.adminId() == null || request.adminId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrator ID is required");
        }

        User candidate = userRepository.findById(candidateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidate not found"));

        User targetAdmin = userRepository.findById(request.adminId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assigned administrator not found"));

        if (!"ADMIN".equalsIgnoreCase(targetAdmin.getRole()) && !"SUPER_ADMIN".equalsIgnoreCase(targetAdmin.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected user is not an administrator");
        }

        candidate.setAdminId(targetAdmin.getId());
        candidate.setUpdatedAt(Instant.now());
        User savedCandidate = userRepository.save(candidate);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", String.format("Candidate %s assigned to Administrator %s (%s)",
                        savedCandidate.getName(), targetAdmin.getName(), targetAdmin.getEmail()),
                "candidate", savedCandidate,
                "assignedAdmin", Map.of(
                        "id", targetAdmin.getId(),
                        "name", targetAdmin.getName(),
                        "email", targetAdmin.getEmail()
                )
        ));
    }

    /**
     * Reassign all candidates from one administrator to another (Option B support)
     */
    @PutMapping("/administrators/{fromAdminId}/reassign-candidates")
    public ResponseEntity<Map<String, Object>> reassignAllCandidates(
            @PathVariable String fromAdminId,
            @RequestBody AssignAdminRequest request
    ) {
        if (request.adminId() == null || request.adminId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target Administrator ID is required");
        }

        User targetAdmin = userRepository.findById(request.adminId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target administrator not found"));

        List<User> candidates = userRepository.findByAdminId(fromAdminId);
        for (User c : candidates) {
            c.setAdminId(targetAdmin.getId());
            c.setUpdatedAt(Instant.now());
            userRepository.save(c);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "reassignedCount", candidates.size(),
                "message", String.format("Successfully reassigned %d candidate(s) to %s", candidates.size(), targetAdmin.getName())
        ));
    }

    /**
     * Delete Administrator account enforcing Option B policy:
     * Platform Admin must reassign all candidates before an administrator can be deleted.
     */
    @DeleteMapping("/administrators/{adminId}")
    public ResponseEntity<Map<String, Object>> deleteAdministrator(
            @PathVariable String adminId,
            @RequestHeader(value = "X-Admin-Role", defaultValue = "ADMIN") String requesterRole
    ) {
        if (!"SUPER_ADMIN".equalsIgnoreCase(requesterRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Only Super Admin can delete administrator accounts.");
        }

        User targetAdmin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Administrator not found"));

        long assignedCount = userRepository.countByAdminId(adminId);
        if (assignedCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    String.format("Cannot delete administrator account: This administrator currently has %d assigned candidate(s). Policy requires the Platform Admin to reassign all candidates to another administrator first.", assignedCount)
            );
        }

        userRepository.deleteById(adminId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", String.format("Administrator %s deleted successfully.", targetAdmin.getName())
        ));
    }
}
