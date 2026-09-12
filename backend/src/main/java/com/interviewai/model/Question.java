package com.interviewai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    private String id;
    private int questionNumber;
    private String question;
    private String category;
    private String difficulty;
    private String userAnswer;
    private Double overallScore;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> suggestions;
    private String betterAnswerExample;
}
