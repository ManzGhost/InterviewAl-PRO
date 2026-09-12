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
@Document(collection = "resumes")
public class Resume {

    @Id
    private String id;
    private String userId;
    private String fileName;
    private List<String> extractedSkills;
    private int resumeScore;
    private int atsScore;
    private List<String> strongSkills;
    private List<String> missingSkills;
    private List<String> suggestions;
    private Instant createdAt;
}
