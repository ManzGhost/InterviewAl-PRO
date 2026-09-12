import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth';
import { db } from '../db';
import { AiService } from '../ai';
import { InterviewSession, QuestionItem, InterviewDifficulty } from '../types';

export const interviewRouter = Router();

// Start a new interview session
interviewRouter.post('/start', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const freshUser = db.getUserById(user.id) || user;
    const xpCost = db.getXpSettings().aiInterviewCost;

    // Check if user has sufficient XP
    if ((freshUser.xpPoints || 0) < xpCost) {
      return res.status(400).json({
        success: false,
        insufficientXp: true,
        requiredXp: xpCost,
        currentXp: freshUser.xpPoints || 0,
        message: 'Insufficient XP. Please earn more XP to start this assessment.',
      });
    }

    // Zero-Tolerance check: ensure candidate has no other active assessment
    const activeAssessment = db.getActiveAssessmentByCandidate(user.id);
    if (activeAssessment) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: `You already have an active assessment in progress (${activeAssessment.assessmentTitle}). Zero-tolerance policy strictly forbids concurrent assessments.`,
        activeAssessment,
      });
    }

    const {
      interviewType = 'Technical Interview',
      jobRole = user.preferredJobRole || 'Java Full Stack Developer',
      companyName,
      difficulty = 'Intermediate',
      totalQuestions = 5,
      mode = 'Text',
    } = req.body;

    const interviewId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Generate first question via AI
    const q1Data = await AiService.generateQuestion({
      jobRole,
      interviewType,
      difficulty,
      companyName,
      skills: user.skills,
      questionNumber: 1,
    });

    const firstQuestion: QuestionItem = {
      id: `q_${Date.now()}_1`,
      interviewId,
      questionNumber: 1,
      question: q1Data.question,
      category: q1Data.category,
      difficulty: q1Data.difficulty,
    };

    const newInterview: InterviewSession = {
      id: interviewId,
      userId: user.id,
      interviewType,
      jobRole,
      companyName,
      difficulty,
      mode,
      totalQuestions: Number(totalQuestions) || 5,
      status: 'IN_PROGRESS',
      currentQuestionIndex: 1,
      questions: [firstQuestion],
      startedAt: new Date().toISOString(),
    };

    db.saveInterview(newInterview);

    let deductionResult: ReturnType<typeof db.deductXpWithTransaction> | null = null;
    try {
      // Deduct XP only once after session is successfully initialized
      deductionResult = db.deductXpWithTransaction({
        userId: user.id,
        amount: xpCost,
        type: 'AI_INTERVIEW',
        referenceId: interviewId,
        description: `AI Interview: ${interviewType} (${jobRole})`,
      });

      // Register active secure assessment session
      db.startSecureAssessment({
        candidateId: user.id,
        candidateName: user.name,
        candidateEmail: user.email,
        assessmentType: 'AI_INTERVIEW',
        assessmentId: interviewId,
        assessmentTitle: `${interviewType} - ${jobRole}`,
        durationMinutes: Math.max(15, (Number(totalQuestions) || 5) * 5),
        initialProgress: { currentQuestionIndex: 1 },
      });

      return res.status(201).json({
        success: true,
        message: 'Interview started successfully.',
        interview: newInterview,
        xpDeducted: xpCost,
        currentXp: deductionResult.balanceAfter,
        transaction: deductionResult.transaction,
      });
    } catch (innerError: any) {
      // System Failure Protection: If XP was deducted but session creation failed, automatically refund
      if (deductionResult && deductionResult.success && deductionResult.transaction) {
        db.refundXpWithTransaction({
          userId: user.id,
          amount: xpCost,
          type: 'SYSTEM_ERROR_REFUND',
          referenceId: interviewId,
          description: `AI Interview System Refund: Session failure (${interviewType})`,
          reason: 'Verified server/system error prevented assessment session from starting',
          originalTransactionId: deductionResult.transaction.id,
        });
      }
      throw innerError;
    }
  } catch (error: any) {
    console.error('Start interview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start interview due to a system error. Any deducted XP has been automatically refunded.',
    });
  }
});

// Get interview session by ID
interviewRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const interview = db.getInterviewById(req.params.id);

  if (!interview || (interview.userId !== user.id && user.role !== 'ADMIN')) {
    return res.status(404).json({ success: false, message: 'Interview session not found.' });
  }

  return res.json({
    success: true,
    interview,
  });
});

// Submit answer for current question & get real-time AI evaluation + adaptive next question
interviewRouter.post('/:id/answer', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const interview = db.getInterviewById(req.params.id);

    if (!interview || interview.userId !== user.id) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    if (interview.status === 'TERMINATED') {
      return res.status(403).json({
        success: false,
        terminated: true,
        message: 'Your assessment session has been terminated because unauthorized activity was detected.',
      });
    }

    if (interview.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, message: 'Interview is already completed or closed.' });
    }

    const { questionId, userAnswer, timeSpentSeconds, skip, videoMetrics } = req.body;

    const currentQIndex = interview.questions.findIndex((q) => q.id === questionId);
    if (currentQIndex === -1) {
      return res.status(404).json({ success: false, message: 'Question not found in this interview.' });
    }

    const currentQ = interview.questions[currentQIndex];

    let evaluation = null;
    if (!skip && userAnswer && userAnswer.trim().length > 0) {
      evaluation = await AiService.evaluateAnswer({
        question: currentQ.question,
        userAnswer,
        jobRole: interview.jobRole,
        interviewType: interview.interviewType,
        difficulty: currentQ.difficulty,
      });
    } else {
      // Skipped question
      evaluation = {
        overallScore: 0,
        technicalScore: 0,
        communicationScore: 0,
        confidenceScore: 0,
        completenessScore: 0,
        problemSolvingScore: 0,
        relevanceScore: 0,
        strengths: [],
        weaknesses: ['Question was skipped without an answer.'],
        suggestions: ['Attempt every question to showcase communication and problem-framing.'],
        betterAnswerExample: 'A candidate should communicate their thoughts even if unsure of the full technical answer.',
      };
    }

    currentQ.userAnswer = userAnswer || '(Skipped)';
    currentQ.aiEvaluation = evaluation;
    currentQ.timeSpentSeconds = timeSpentSeconds || 30;
    if (videoMetrics) {
      currentQ.videoMetrics = videoMetrics;
    }
    currentQ.answeredAt = new Date().toISOString();

    // Adaptive difficulty logic
    let nextDifficulty: InterviewDifficulty = currentQ.difficulty;
    if (evaluation.overallScore >= 8.5) {
      nextDifficulty = 'Advanced';
    } else if (evaluation.overallScore < 5.0 && currentQ.difficulty === 'Advanced') {
      nextDifficulty = 'Intermediate';
    } else if (evaluation.overallScore < 4.0) {
      nextDifficulty = 'Beginner';
    }

    // Generate next question if more remain
    let nextQuestion: QuestionItem | null = null;
    if (interview.questions.length < interview.totalQuestions) {
      const nextNum = interview.questions.length + 1;
      const askedQuestions = interview.questions.map((q) => q.question);

      const qNextData = await AiService.generateQuestion({
        jobRole: interview.jobRole,
        interviewType: interview.interviewType,
        difficulty: nextDifficulty,
        companyName: interview.companyName,
        skills: user.skills,
        questionNumber: nextNum,
        previousScore: evaluation.overallScore,
        previousQuestions: askedQuestions,
      });

      nextQuestion = {
        id: `q_${Date.now()}_${nextNum}`,
        interviewId: interview.id,
        questionNumber: nextNum,
        question: qNextData.question,
        category: qNextData.category,
        difficulty: qNextData.difficulty,
      };

      interview.questions.push(nextQuestion);
      interview.currentQuestionIndex = nextNum;
    }

    db.saveInterview(interview);

    return res.json({
      success: true,
      evaluation,
      isFinished: interview.questions.length >= interview.totalQuestions && currentQIndex === interview.totalQuestions - 1,
      nextQuestion,
      interview,
    });
  } catch (error: any) {
    console.error('Submit answer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to evaluate answer.' });
  }
});

// Complete interview & generate comprehensive report
interviewRouter.post('/:id/complete', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const interview = db.getInterviewById(req.params.id);

    if (!interview || interview.userId !== user.id) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    if (interview.status === 'COMPLETED') {
      const currentUser = db.getUserById(user.id);
      return res.json({
        success: true,
        message: 'Interview was already completed.',
        interview,
        xpDeducted: 0,
        remainingXp: currentUser?.xpPoints || 0,
        userLevel: currentUser?.level || 'Beginner',
        user: currentUser,
      });
    }

    // Compute overall scores
    const answeredQs = interview.questions.filter((q) => q.aiEvaluation);
    let totalScoreSum = 0;
    let technicalSum = 0;
    let commSum = 0;
    let confSum = 0;
    let probSum = 0;

    if (answeredQs.length > 0) {
      for (const q of answeredQs) {
        const ev = q.aiEvaluation!;
        totalScoreSum += ev.overallScore;
        technicalSum += ev.technicalScore;
        commSum += ev.communicationScore;
        confSum += ev.confidenceScore;
        probSum += ev.problemSolvingScore;
      }
      interview.overallScore = Math.round((totalScoreSum / (answeredQs.length * 10)) * 100);
      interview.categoryScores = {
        technicalKnowledge: Math.round((technicalSum / (answeredQs.length * 10)) * 100),
        communication: Math.round((commSum / (answeredQs.length * 10)) * 100),
        confidence: Math.round((confSum / (answeredQs.length * 10)) * 100),
        problemSolving: Math.round((probSum / (answeredQs.length * 10)) * 100),
        hrSkills: Math.round(((commSum + confSum) / (answeredQs.length * 20)) * 100),
      };
    } else {
      interview.overallScore = 60;
      interview.categoryScores = {
        technicalKnowledge: 60,
        communication: 60,
        confidence: 60,
        problemSolving: 60,
        hrSkills: 60,
      };
    }

    interview.status = 'COMPLETED';
    interview.completedAt = new Date().toISOString();

    // Compute video metrics summary if available
    const videoQuestions = interview.questions.filter((q) => q.videoMetrics);
    if (videoQuestions.length > 0) {
      let eyeContactTotal = 0;
      let confTotal = 0;
      const expressions: Record<string, number> = {};
      const postureCounts: Record<string, number> = {};

      for (const q of videoQuestions) {
        const vm = q.videoMetrics!;
        eyeContactTotal += vm.eyeContactPercentage;
        confTotal += vm.confidenceScore;
        expressions[vm.facialExpression] = (expressions[vm.facialExpression] || 0) + 1;
        postureCounts[vm.postureStatus] = (postureCounts[vm.postureStatus] || 0) + 1;
      }

      const dominantExpression = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Attentive';
      const avgEyeContact = Math.round(eyeContactTotal / videoQuestions.length);
      const avgConfidence = Math.round(confTotal / videoQuestions.length);
      const uprightRatio = (postureCounts['Upright & Centered'] || 0) / videoQuestions.length;
      const postureScore = Math.max(50, Math.round(uprightRatio * 100));

      const nonVerbalFeedback: string[] = [];
      if (avgEyeContact >= 80) {
        nonVerbalFeedback.push('Consistent and commanding direct eye contact with the camera lens.');
      } else if (avgEyeContact >= 60) {
        nonVerbalFeedback.push('Good visual presence, with occasional gaze drift when formulating complex answers.');
      } else {
        nonVerbalFeedback.push('Gaze frequently dropped or wandered; aim to look directly into the camera lens when speaking.');
      }

      if (postureScore >= 80) {
        nonVerbalFeedback.push('Strong, stable upright posture conveying professional composure.');
      } else {
        nonVerbalFeedback.push('Occasional head tilting and leaning detected; center yourself evenly within the frame.');
      }

      if (dominantExpression === 'Confident' || dominantExpression === 'Smiling' || dominantExpression === 'Attentive') {
        nonVerbalFeedback.push(`Positive facial engagement: exhibited ${dominantExpression.toLowerCase()} body language throughout.`);
      }

      (interview as any).videoSummary = {
        avgEyeContact,
        postureScore,
        confidenceScore: avgConfidence,
        predominantExpression: dominantExpression,
        nonVerbalFeedback,
      };
    }

    // Generate AI Summary, Roadmap and Cheat Sheet
    const collectedWeaknesses: string[] = [];
    const collectedStrengths: string[] = [];
    answeredQs.forEach((q) => {
      if (q.aiEvaluation?.weaknesses) collectedWeaknesses.push(...q.aiEvaluation.weaknesses);
      if (q.aiEvaluation?.strengths) collectedStrengths.push(...q.aiEvaluation.strengths);
    });

    const [roadmapData, cheatSheetData] = await Promise.all([
      AiService.generateRoadmap({
        jobRole: interview.jobRole,
        skills: user.skills,
        weakTopics: collectedWeaknesses.slice(0, 4),
      }),
      AiService.generateCheatSheet({
        jobRole: interview.jobRole,
        topics: [interview.jobRole, 'System Design', 'Core Fundamentals'],
      }),
    ]);

    interview.summaryReport = {
      strengths: collectedStrengths.slice(0, 5).length > 0 ? collectedStrengths.slice(0, 5) : ['Good conceptual communication', 'Clear structured thought process'],
      weaknesses: collectedWeaknesses.slice(0, 5).length > 0 ? collectedWeaknesses.slice(0, 5) : ['Deep dive into concurrency edge cases', 'Microservices resilience'],
      aiSuggestions: [
        'Review the personalized 5-day roadmap below to strengthen identified weak topics.',
        'Use the STAR method consistently on all situational and scenario questions.',
        'Always state Big-O time and space complexity upfront before detailing algorithm implementation.',
      ],
      learningRoadmap: roadmapData.roadmap || [],
      cheatSheet: (cheatSheetData.cheatSheet || []).map((c: any) => ({
        topic: c.topic,
        concepts: c.keyConcepts || [],
        quickNotes: c.quickRevisionNotes || '',
      })),
    };

    db.saveInterview(interview);

    // Save Performance Records by Topic
    const topicMap: Record<string, number[]> = {};
    answeredQs.forEach((q) => {
      const topic = q.category || 'General';
      if (!topicMap[topic]) topicMap[topic] = [];
      topicMap[topic].push(q.aiEvaluation?.overallScore ? q.aiEvaluation.overallScore * 10 : 70);
    });

    for (const [topic, scores] of Object.entries(topicMap)) {
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      db.addPerformance({
        id: `perf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        topic,
        score: avgScore,
        interviewId: interview.id,
        createdAt: new Date().toISOString(),
      });
    }

    // Mark secure assessment as completed
    db.completeSecureAssessment(interview.id);

    // Gamification: Reward candidate for completing mock interview (no XP deduction for practice)
    const AWARD_XP = 50;
    const xpResult = db.awardXp(user.id, AWARD_XP);
    const updatedUser = db.getUserById(user.id);

    // Notify user of completion
    db.addNotification({
      id: `notif_${Date.now()}_xp`,
      userId: user.id,
      title: 'Interview Completed (+50 XP) 🏆',
      message: `Great job completing your mock interview for ${interview.jobRole}! You earned +${AWARD_XP} XP. Total XP: ${xpResult.xp} (${xpResult.level}). Note: XP is only deducted when an administrator schedules an official interview slot.`,
      createdAt: new Date().toISOString(),
      read: false,
      type: 'PERFORMANCE',
    });

    // Check badges
    const userInterviews = db.getInterviewsByUser(user.id).filter((i) => i.status === 'COMPLETED');
    const existingAchievements = db.getAchievementsByUser(user.id);

    if (userInterviews.length === 1 && !existingAchievements.some((a) => a.badge === '🏆')) {
      db.addAchievement({
        id: `ach_${Date.now()}_1`,
        userId: user.id,
        badge: '🏆',
        title: 'First Interview',
        description: 'Completed your first AI mock interview session!',
        icon: 'Trophy',
        earnedAt: new Date().toISOString(),
      });
    }

    if ((interview.overallScore || 0) >= 80 && !existingAchievements.some((a) => a.badge === '⭐')) {
      db.addAchievement({
        id: `ach_${Date.now()}_star`,
        userId: user.id,
        badge: '⭐',
        title: 'Score Above 80',
        description: `Achieved ${interview.overallScore}% score in ${interview.jobRole} interview.`,
        icon: 'Star',
        earnedAt: new Date().toISOString(),
      });
    }

    if (userInterviews.length >= 10 && !existingAchievements.some((a) => a.badge === '🚀')) {
      db.addAchievement({
        id: `ach_${Date.now()}_10`,
        userId: user.id,
        badge: '🚀',
        title: '10 Interviews Completed',
        description: 'Demonstrated dedication with 10 completed mock interview sessions.',
        icon: 'Rocket',
        earnedAt: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      message: `Interview completed successfully. +${AWARD_XP} XP awarded!`,
      interview,
      xpAwarded: AWARD_XP,
      remainingXp: xpResult.xp,
      userLevel: xpResult.level,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Complete interview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to finalize interview.' });
  }
});

// Get user's interview history
interviewRouter.get('/history/all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const history = db.getInterviewsByUser(user.id);
  return res.json({
    success: true,
    interviews: history,
  });
});

// Clear all interview history for user
interviewRouter.delete('/history/clear', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const removedCount = db.clearInterviewsByUser(user.id);
  return res.json({
    success: true,
    message: `Cleared ${removedCount} interview records from history.`,
    removedCount,
  });
});

// Delete specific interview session by ID
interviewRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const interview = db.getInterviewById(req.params.id);

  if (!interview) {
    return res.status(404).json({ success: false, message: 'Interview session not found.' });
  }

  if (interview.userId !== user.id && user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Unauthorized to delete this interview.' });
  }

  const deleted = db.deleteInterview(req.params.id);
  return res.json({
    success: deleted,
    message: 'Interview session removed from history.',
  });
});

