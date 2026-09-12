package com.interviewai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interviews")
public class Interview {

    @Id
    private String id;
    private String userId;
    private String interviewType;
    private String jobRole;
    private String companyName;
    private String difficulty;
    private String status; // IN_PROGRESS, COMPLETED
    private int totalQuestions;
    private Instant startedAt;
    private Instant completedAt;
    private Integer overallScore;
    private List<Question> questions;
}
