package com.interviewai.repository;

import com.interviewai.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByAdminCode(String adminCode);

    List<User> findByRole(String role);

    /**
     * Find all candidates assigned to a specific administrator
     */
    List<User> findByAdminId(String adminId);

    long countByAdminId(String adminId);

    /**
     * Role-restricted candidate lookup ensuring an administrator can only access their assigned candidate
     */
    Optional<User> findByIdAndAdminId(String id, String adminId);

    boolean existsByIdAndRole(String id, String role);
}
