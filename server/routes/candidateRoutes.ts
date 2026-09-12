import { Router, Response } from 'express';
import { requireAdmin, requireCandidate, requireAuth, AuthenticatedRequest } from '../auth';
import { db } from '../db';

export const candidateRouter = Router();

/**
 * Helper to check if a candidate belongs to the logged-in administrator
 */
function isCandidateAssignedToAdmin(candidate: any, adminId: string, adminEmail?: string): boolean {
  if (!candidate) return false;
  const normEmail = (adminEmail || '').toLowerCase().trim();
  return (
    candidate.adminId === adminId ||
    candidate.assignedAdmin?.id === adminId ||
    (candidate.assignedAdmin?.email && candidate.assignedAdmin.email.toLowerCase().trim() === normEmail)
  );
}

/**
 * GET /api/candidates
 * Strictly isolated by verified JWT session.
 * A logged-in administrator can ONLY see their own assigned candidates.
 */
candidateRouter.get('/', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  // Extract the logged-in administrator's identity directly from verified JWT
  const adminId = req.user.id;
  const adminEmail = req.user.email;

  // Filter candidates strictly assigned to the logged-in administrator
  const allCandidates = db.getCandidates();
  const myCandidates = allCandidates.filter((c) => isCandidateAssignedToAdmin(c, adminId, adminEmail));

  const populated = myCandidates.map(({ passwordHash: _, ...c }) => {
    const resumes = db.getResumesByUser(c.id);
    const interviews = db.getInterviewsByUser(c.id);
    const lastInterview = interviews.length > 0
      ? interviews[interviews.length - 1].completedAt || interviews[interviews.length - 1].startedAt
      : null;
    return {
      ...c,
      resumesCount: resumes.length,
      interviewsCount: interviews.length,
      lastInterviewDate: lastInterview,
    };
  });

  return res.json({
    success: true,
    count: populated.length,
    candidates: populated,
    adminId: req.user.id,
    adminEmail: req.user.email,
  });
});

/**
 * =====================================================================
 * Candidate Scheduled Interviews Endpoints (Strict Candidate Isolation)
 * NOTE: MUST be declared BEFORE parameterized routes like /:id so Express
 * does not mistake "my-interviews" or "scheduled" for a candidate ID.
 * =====================================================================
 */

// GET /api/candidates/my-interviews or /api/candidate/my-interviews
candidateRouter.get('/my-interviews', requireCandidate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const candidateId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
  let myInterviews = db.getScheduledInterviewsByCandidate(candidateId);

  // If administrator or super admin has no direct candidate interviews assigned to themselves,
  // surface interviews they scheduled or supervise so they can preview/test them
  if (myInterviews.length === 0 && isAdmin) {
    myInterviews = req.user.role === 'SUPER_ADMIN'
      ? db.getScheduledInterviews()
      : db.getScheduledInterviews(req.user.id);
  }

  // If results are not enabled by the admin, redact scores and feedbacks (unless requester is admin)
  const sanitized = myInterviews.map((si) => {
    if (!isAdmin && !si.resultEnabled && si.status === 'COMPLETED') {
      return {
        ...si,
        totalScore: undefined,
        questions: si.questions.map((q) => ({
          ...q,
          score: undefined,
          feedback: 'Results will be published once approved by your Administrator.',
        })),
      };
    }
    return si;
  });

  return res.json({
    success: true,
    count: sanitized.length,
    interviews: sanitized,
  });
});

// GET /api/candidates/scheduled/:id (Candidate views specific assigned interview)
candidateRouter.get('/scheduled/:id', requireCandidate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const interview = db.getScheduledInterviewById(req.params.id);
  if (!interview) {
    return res.status(404).json({ success: false, message: 'Interview session not found.' });
  }

  const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

  // Strict Candidate Isolation: verify that this interview is assigned to this candidate or admin
  if (interview.candidateId !== req.user.id && !isAdmin && interview.adminId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access denied. You can only view interviews assigned to your account.',
    });
  }

  // If candidate is taking the test, hide expected answers and other candidate info
  const sanitized = {
    ...interview,
    questions: interview.questions.map((q) => {
      // If interview is not completed, do not reveal expectedAnswer unless requester is admin!
      if (interview.status !== 'COMPLETED' && !isAdmin) {
        const { expectedAnswer: _, ...safeQ } = q;
        return safeQ;
      }
      // If completed but resultEnabled is false, redact score and feedback (unless requester is admin)
      if (!interview.resultEnabled && !isAdmin) {
        return {
          ...q,
          score: undefined,
          feedback: 'Result is pending Administrator publication.',
        };
      }
      return q;
    }),
    totalScore: (interview.resultEnabled || isAdmin) ? interview.totalScore : undefined,
  };

  return res.json({
    success: true,
    interview: sanitized,
  });
});

// POST /api/candidates/scheduled/:id/start (Candidate starts the interview)
candidateRouter.post('/scheduled/:id/start', requireCandidate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const interview = db.getScheduledInterviewById(req.params.id);
  if (!interview) {
    return res.status(404).json({ success: false, message: 'Interview session not found.' });
  }

  const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
  if (interview.candidateId !== req.user.id && !isAdmin && interview.adminId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only start your own scheduled interview.',
    });
  }

  if (interview.status === 'CANCELLED') {
    return res.status(400).json({
      success: false,
      message: 'This interview was cancelled by the administrator. Candidate cannot start a cancelled session.',
    });
  }

  if (interview.status === 'TERMINATED') {
    return res.status(403).json({
      success: false,
      terminated: true,
      message: 'Your assessment session has been terminated because unauthorized activity was detected.',
    });
  }

  if (interview.status === 'COMPLETED') {
    return res.status(400).json({
      success: false,
      message: 'This interview has already been submitted and completed.',
    });
  }

  // Zero-Tolerance Check: verify no concurrent active assessment
  const activeAssessment = db.getActiveAssessmentByCandidate(req.user.id);
  if (activeAssessment && activeAssessment.assessmentId !== req.params.id) {
    return res.status(409).json({
      success: false,
      conflict: true,
      message: `You already have an active assessment in progress (${activeAssessment.assessmentTitle}). Zero-tolerance policy strictly forbids concurrent assessments.`,
      activeAssessment,
    });
  }

  // XP Deduction Check for Assignment Interview (10 XP)
  const candidateUser = db.getUserById(req.user.id);
  const xpCost = db.getXpSettings().assignmentInterviewCost;
  const currentXp = candidateUser?.xpPoints || 0;

  // Check if XP was already deducted for this scheduled interview session (prevent duplicate deduction)
  const existingDeduction = db.getXpTransactionByReference(req.user.id, req.params.id, 'DEDUCTION');
  if (!existingDeduction && currentXp < xpCost) {
    return res.status(400).json({
      success: false,
      insufficientXp: true,
      requiredXp: xpCost,
      currentXp,
      message: 'Insufficient XP. Please earn more XP to start this assessment.',
    });
  }

  // Deduct XP only once
  let deductionResult = existingDeduction
    ? { success: true, alreadyDeducted: true, balanceAfter: currentXp, transaction: existingDeduction }
    : db.deductXpWithTransaction({
        userId: req.user.id,
        amount: xpCost,
        type: 'ASSIGNMENT_INTERVIEW',
        referenceId: req.params.id,
        description: `Assignment Interview: ${interview.title}`,
      });

  try {
    const now = interview.startedAt || new Date().toISOString();
    db.updateScheduledInterview(req.params.id, {
      status: 'IN_PROGRESS',
      startedAt: now,
    });

    // Register in Secure Assessment engine
    db.startSecureAssessment({
      candidateId: req.user.id,
      candidateName: interview.candidateName,
      candidateEmail: interview.candidateEmail,
      assessmentType: 'ASSIGNMENT_INTERVIEW',
      assessmentId: req.params.id,
      assessmentTitle: interview.title,
      durationMinutes: interview.durationMinutes || 45,
      initialProgress: { answers: {} },
    });

    return res.json({
      success: true,
      message: 'Interview started successfully. Good luck!',
      xpDeducted: existingDeduction ? 0 : xpCost,
      currentXp: deductionResult.balanceAfter,
      alreadyDeducted: !!existingDeduction,
      transaction: deductionResult.transaction,
    });
  } catch (startError: any) {
    // If not existing deduction, auto refund 100% on system error
    if (!existingDeduction && deductionResult.success && deductionResult.transaction) {
      db.refundXpWithTransaction({
        userId: req.user.id,
        amount: xpCost,
        type: 'SYSTEM_ERROR_REFUND',
        referenceId: req.params.id,
        description: `Assignment Interview System Refund: Start failure (${interview.title})`,
        reason: 'Server error prevented scheduled interview from starting',
        originalTransactionId: deductionResult.transaction.id,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to start scheduled interview due to a server error. Any deducted XP has been refunded.',
    });
  }
});

// POST /api/candidates/scheduled/:id/answer (Candidate answers a question)
candidateRouter.post('/scheduled/:id/answer', requireCandidate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { questionId, answer } = req.body;
  if (!questionId || typeof answer !== 'string') {
    return res.status(400).json({ success: false, message: 'Question ID and answer text are required.' });
  }

  const interview = db.getScheduledInterviewById(req.params.id);
  if (!interview) {
    return res.status(404).json({ success: false, message: 'Interview session not found.' });
  }

  const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
  if (interview.candidateId !== req.user.id && !isAdmin && interview.adminId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only submit answers to your own interview.',
    });
  }

  if (interview.status === 'TERMINATED') {
    return res.status(403).json({
      success: false,
      terminated: true,
      message: 'Your assessment session has been terminated because unauthorized activity was detected.',
    });
  }

  if (interview.status === 'COMPLETED') {
    return res.status(400).json({
      success: false,
      message: 'This interview has already been finalized and cannot be modified.',
    });
  }

  const success = db.submitCandidateInterviewAnswer(req.params.id, questionId, answer);
  if (!success) {
    return res.status(400).json({ success: false, message: 'Could not record answer for this question.' });
  }

  // Also update progress in secure assessment store
  db.updateSecureAssessmentProgress(req.params.id, { lastQuestionId: questionId });

  return res.json({
    success: true,
    message: 'Answer saved successfully.',
  });
});

// POST /api/candidates/scheduled/:id/submit (Candidate submits the interview)
candidateRouter.post('/scheduled/:id/submit', requireCandidate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const interview = db.getScheduledInterviewById(req.params.id);
  if (!interview) {
    return res.status(404).json({ success: false, message: 'Interview session not found.' });
  }

  const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
  if (interview.candidateId !== req.user.id && !isAdmin && interview.adminId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only submit your own interview.',
    });
  }

  if (interview.status === 'TERMINATED') {
    return res.status(403).json({
      success: false,
      terminated: true,
      message: 'Your assessment session has been terminated because unauthorized activity was detected.',
    });
  }

  const completed = db.finalizeCandidateScheduledInterview(req.params.id);
  if (!completed) {
    return res.status(500).json({ success: false, message: 'Failed to finalize interview.' });
  }

  db.completeSecureAssessment(req.params.id);

  return res.json({
    success: true,
    message: 'Interview successfully submitted!',
    interview: completed,
  });
});

/**
 * GET /api/candidates/:id
 * Verify candidate belongs to the authenticated administrator.
 * If the candidate belongs to another administrator: Return HTTP 403 Forbidden.
 */
candidateRouter.get('/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const candidateId = req.params.id;
  const rawCandidate = db.getUserById(candidateId);

  if (!rawCandidate || rawCandidate.role !== 'USER') {
    return res.status(404).json({ success: false, message: 'Candidate not found.' });
  }

  const candidate = db.populateAssignedAdmin(rawCandidate);

  // Data isolation check: Ensure candidate belongs to this administrator
  if (!isCandidateAssignedToAdmin(candidate, req.user.id, req.user.email)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access denied. Candidate belongs to another Administrator.',
    });
  }

  const resumes = db.getResumesByUser(candidate.id);
  const interviews = db.getInterviewsByUser(candidate.id);
  const performance = db.getPerformancesByUser(candidate.id);

  const { passwordHash: _, ...safeCandidate } = candidate;

  return res.json({
    success: true,
    candidate: safeCandidate,
    resumes,
    interviews,
    performance,
  });
});

/**
 * PUT /api/candidates/:id
 * Verify candidate ownership against authenticated administrator before updating.
 */
candidateRouter.put('/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const candidateId = req.params.id;
  const rawCandidate = db.getUserById(candidateId);

  if (!rawCandidate || rawCandidate.role !== 'USER') {
    return res.status(404).json({ success: false, message: 'Candidate not found.' });
  }

  const candidate = db.populateAssignedAdmin(rawCandidate);

  // Data isolation check
  if (!isCandidateAssignedToAdmin(candidate, req.user.id, req.user.email)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access denied. You cannot edit a candidate assigned to another Administrator.',
    });
  }

  const {
    name,
    college,
    education,
    skills,
    preferredJobRole,
    linkedInUrl,
    gitHubUrl,
    isOnLeaderboard,
  } = req.body;

  const updates: any = {};
  if (name !== undefined) updates.name = name.trim();
  if (college !== undefined) updates.college = college.trim();
  if (education !== undefined) updates.education = education.trim();
  if (preferredJobRole !== undefined) updates.preferredJobRole = preferredJobRole.trim();
  if (linkedInUrl !== undefined) updates.linkedInUrl = linkedInUrl.trim();
  if (gitHubUrl !== undefined) updates.gitHubUrl = gitHubUrl.trim();
  if (isOnLeaderboard !== undefined) updates.isOnLeaderboard = Boolean(isOnLeaderboard);
  if (skills !== undefined) {
    updates.skills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s: string) => s.trim()).filter(Boolean)
      : candidate.skills;
  }

  const updatedCandidate = db.updateUser(candidateId, updates);
  if (!updatedCandidate) {
    return res.status(500).json({ success: false, message: 'Failed to update candidate record.' });
  }

  const { passwordHash: _, ...safeCandidate } = updatedCandidate;

  return res.json({
    success: true,
    message: 'Candidate updated successfully.',
    candidate: safeCandidate,
  });
});

/**
 * DELETE /api/candidates/:id
 * Verify candidate ownership against authenticated administrator before deleting.
 */
candidateRouter.delete('/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const candidateId = req.params.id;
  const rawCandidate = db.getUserById(candidateId);

  if (!rawCandidate || rawCandidate.role !== 'USER') {
    return res.status(404).json({ success: false, message: 'Candidate not found.' });
  }

  const candidate = db.populateAssignedAdmin(rawCandidate);

  // Data isolation check
  if (!isCandidateAssignedToAdmin(candidate, req.user.id, req.user.email)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access denied. You cannot delete a candidate assigned to another Administrator.',
    });
  }

  const deletionResult = db.permanentlyDeleteUserAndAllData(candidateId);
  if (!deletionResult.success) {
    return res.status(500).json({ success: false, message: 'Failed to delete candidate and associated data.' });
  }

  return res.json({
    success: true,
    message: `Candidate ${candidate.name} and all associated mock tests, resumes, and analytics have been permanently deleted.`,
    deletedCandidate: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
    },
    deletedCounts: deletionResult.deletedCounts,
  });
});
