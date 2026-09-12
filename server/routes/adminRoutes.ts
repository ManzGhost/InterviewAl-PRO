import { Router, Response } from 'express';
import { requireAdmin, AuthenticatedRequest } from '../auth';
import { db } from '../db';

export const adminRouter = Router();

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
 * GET /api/admin/portfolio
 * Returns the currently authenticated administrator's profile and their assigned candidates strictly isolated by JWT.
 */
adminRouter.get('/portfolio', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const adminId = req.user.id;
  const adminEmail = req.user.email;
  const currentAdmin = db.getUserById(adminId) || req.user;

  const myCandidates = db.getCandidates().filter((c) => isCandidateAssignedToAdmin(c, adminId, adminEmail)).map(({ passwordHash: _, ...c }) => {
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

  const { passwordHash: _, ...safeAdmin } = currentAdmin as any;

  return res.json({
    success: true,
    admin: {
      ...safeAdmin,
      assignedCandidatesCount: myCandidates.length,
    },
    count: myCandidates.length,
    candidates: myCandidates,
  });
});

// Admin Dashboard stats - strictly isolated to the authenticated administrator
adminRouter.get('/dashboard', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const adminId = req.user.id;
  const adminEmail = req.user.email;
  const currentAdmin = db.getUserById(adminId) || req.user;

  const myCandidates = db.getCandidates().filter((c) => isCandidateAssignedToAdmin(c, adminId, adminEmail));
  const myCandidateIds = new Set(myCandidates.map((c) => c.id));

  const allInterviews = db.getAllInterviews();
  const isolatedInterviews = allInterviews.filter((i) => myCandidateIds.has(i.userId));

  const completed = isolatedInterviews.filter((i) => i.status === 'COMPLETED');
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((acc, i) => acc + (i.overallScore || 0), 0) / completed.length)
    : 81;

  const { passwordHash: _, ...safeAdmin } = currentAdmin as any;
  const adminProfile = {
    ...safeAdmin,
    assignedCandidatesCount: myCandidates.length,
  };

  return res.json({
    success: true,
    currentAdminCode: safeAdmin.adminCode,
    admin: adminProfile,
    stats: {
      totalUsers: myCandidates.length + 1,
      totalCandidates: myCandidates.length,
      myCandidatesCount: myCandidates.length,
      totalAdministrators: 1,
      totalInterviews: isolatedInterviews.length,
      totalAiRequests: db.getAiRequestsCount(),
      averagePlatformScore: avgScore,
    },
    // Strictly isolate administrators list: only return the logged-in admin
    administrators: [adminProfile],
    myCandidates: myCandidates.map(({ passwordHash: _, ...u }) => ({
      ...u,
      resumesCount: db.getResumesByUser(u.id).length,
      interviewsCount: db.getInterviewsByUser(u.id).length,
    })),
    recentUsers: myCandidates.slice(-5).map(({ passwordHash: _, ...u }) => u),
    recentInterviews: isolatedInterviews.slice(0, 5),
  });
});

// Get Administrators - strictly returns only the logged-in administrator
adminRouter.get('/administrators', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const adminId = req.user.id;
  const adminEmail = req.user.email;
  const currentAdmin = db.getUserById(adminId) || req.user;

  const myCandidates = db.getCandidates().filter((c) => isCandidateAssignedToAdmin(c, adminId, adminEmail));
  const { passwordHash: _, ...safeAdmin } = currentAdmin as any;

  return res.json({
    success: true,
    administrators: [
      {
        ...safeAdmin,
        assignedCandidatesCount: myCandidates.length,
      },
    ],
  });
});

// "My Candidates" section - candidates strictly assigned to currently logged-in administrator
adminRouter.get('/my-candidates', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const adminId = req.user.id;
  const adminEmail = req.user.email;

  const myCandidates = db.getCandidates().filter((c) => isCandidateAssignedToAdmin(c, adminId, adminEmail)).map(({ passwordHash: _, ...c }) => {
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
    adminId: req.user.id,
    adminName: req.user.name,
    count: myCandidates.length,
    candidates: myCandidates,
  });
});

// Admin get users - strictly returns only the logged-in administrator and their assigned candidates
adminRouter.get('/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const currentAdminId = req.user.id;
  const currentAdminEmail = req.user.email;
  const search = (req.query.search as string | undefined)?.toLowerCase().trim();

  const candidates = db.getCandidates().filter((c) => isCandidateAssignedToAdmin(c, currentAdminId, currentAdminEmail));

  let filtered = candidates;
  if (search) {
    filtered = filtered.filter((u) => {
      const nameMatch = u.name.toLowerCase().includes(search);
      const emailMatch = u.email.toLowerCase().includes(search);
      const roleMatch = (u.preferredJobRole || '').toLowerCase().includes(search);
      const collegeMatch = (u.college || '').toLowerCase().includes(search);
      return nameMatch || emailMatch || roleMatch || collegeMatch;
    });
  }

  const usersWithCounts = filtered.map(({ passwordHash: _, ...u }) => {
    const resumes = db.getResumesByUser(u.id);
    const interviews = db.getInterviewsByUser(u.id);
    return {
      ...u,
      resumesCount: resumes.length,
      interviewsCount: interviews.length,
    };
  });

  const currentAdmin = db.getUserById(currentAdminId) || req.user;
  const { passwordHash: _, ...safeAdmin } = currentAdmin as any;

  return res.json({
    success: true,
    currentAdminId,
    administrators: [
      {
        ...safeAdmin,
        assignedCandidatesCount: candidates.length,
      },
    ],
    totalCount: usersWithCounts.length,
    users: usersWithCounts,
  });
});

// Get Candidate details with authorization check
adminRouter.get('/candidates/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const candidateId = req.params.id;
  const rawCandidate = db.getUserById(candidateId);

  if (!rawCandidate || rawCandidate.role !== 'USER') {
    return res.status(404).json({ success: false, message: 'Candidate not found.' });
  }

  const candidate = db.populateAssignedAdmin(rawCandidate);

  // Enforce strict data isolation
  if (!isCandidateAssignedToAdmin(candidate, req.user.id, req.user.email)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You are not authorized to access candidates assigned to another administrator.',
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

// Update Candidate details with authorization check
adminRouter.put('/candidates/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const candidateId = req.params.id;
  const rawCandidate = db.getUserById(candidateId);

  if (!rawCandidate || rawCandidate.role !== 'USER') {
    return res.status(404).json({ success: false, message: 'Candidate not found.' });
  }

  const candidate = db.populateAssignedAdmin(rawCandidate);

  // Enforce strict data isolation
  if (!isCandidateAssignedToAdmin(candidate, req.user.id, req.user.email)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access denied. Candidate belongs to another Administrator.',
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

  const updated = db.updateUser(candidateId, updates);
  if (!updated) {
    return res.status(500).json({ success: false, message: 'Failed to update candidate record.' });
  }

  const { passwordHash: _, ...safeCandidate } = updated;
  return res.json({
    success: true,
    message: 'Candidate updated successfully.',
    candidate: safeCandidate,
  });
});

// Delete Candidate - strictly verifying ownership
adminRouter.delete('/candidates/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const candidateId = req.params.id;
  const rawCandidate = db.getUserById(candidateId);

  if (!rawCandidate || rawCandidate.role !== 'USER') {
    return res.status(404).json({ success: false, message: 'Candidate not found.' });
  }

  const candidate = db.populateAssignedAdmin(rawCandidate);

  // Enforce strict data isolation
  if (!isCandidateAssignedToAdmin(candidate, req.user.id, req.user.email)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You can only delete candidates assigned to your administrator portfolio.',
    });
  }

  const deletionResult = db.permanentlyDeleteUserAndAllData(candidateId);
  if (!deletionResult.success) {
    return res.status(500).json({ success: false, message: 'Failed to delete candidate and associated data.' });
  }

  return res.json({
    success: true,
    message: `Candidate ${candidate.name} and all associated mock tests, resumes, and analytics permanently deleted.`,
    deletedCandidate: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
    },
    deletedCounts: deletionResult.deletedCounts,
  });
});

// Assign or Reassign Candidate to an Administrator
const handleAssignAdmin = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const candidateId = req.params.id;
  const { adminId: targetAdminId } = req.body;

  if (!targetAdminId) {
    return res.status(400).json({ success: false, message: 'Target Administrator ID is required.' });
  }

  const candidate = db.getUserById(candidateId);
  if (!candidate || candidate.role !== 'USER') {
    return res.status(404).json({ success: false, message: 'Candidate not found.' });
  }

  // Under strict data isolation, only the candidate's assigned admin can perform actions
  if (!isCandidateAssignedToAdmin(candidate, req.user.id, req.user.email)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You are not authorized to modify this candidate.',
    });
  }

  const result = db.assignCandidateAdmin(candidateId, targetAdminId);
  if (!result.success) {
    return res.status(400).json(result);
  }

  const { passwordHash: _, ...safeCandidate } = result.candidate!;

  return res.json({
    success: true,
    message: result.message,
    candidate: safeCandidate,
    assignedAdmin: result.assignedAdmin,
  });
};

adminRouter.put('/candidates/:id/assign-admin', requireAdmin, handleAssignAdmin);
adminRouter.post('/candidates/:id/assign-admin', requireAdmin, handleAssignAdmin);

// Admin get interviews strictly isolated to the logged-in administrator's candidates
adminRouter.get('/interviews', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const myCandidates = db.getCandidates().filter((c) => isCandidateAssignedToAdmin(c, req.user!.id, req.user!.email));
  const myCandidateIds = new Set(myCandidates.map((c) => c.id));
  const interviews = db.getAllInterviews().filter((i) => myCandidateIds.has(i.userId));

  return res.json({
    success: true,
    interviews,
  });
});

// Admin delete candidate or own admin account
const handleDeleteUserAccount = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const targetUserId = req.params.id;
  const targetUser = db.getUserById(targetUserId);

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'User account not found.' });
  }

  // System admin protection
  if (targetUser.email?.toLowerCase() === 'admin@interviewai.com' || targetUser.id === 'user_admin_001') {
    return res.status(400).json({
      success: false,
      message: 'Platform root Super Admin account (admin@interviewai.com) is system-protected and cannot be deleted.',
    });
  }

  // If deleting candidate, must be assigned to current admin
  if (targetUser.role === 'USER') {
    if (!isCandidateAssignedToAdmin(targetUser, req.user.id, req.user.email)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete candidates assigned to your administrator portfolio.',
      });
    }
  } else if (targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN') {
    // Cannot delete other admins
    if (targetUser.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Administrators can only manage their own account.',
      });
    }

    // Reassign candidates to system admin
    const assignedCandidates = db.getCandidates(targetUserId);
    if (assignedCandidates.length > 0) {
      db.reassignAllCandidates(targetUserId, 'user_admin_001');
    }
  }

  const deletionResult = db.permanentlyDeleteUserAndAllData(targetUserId);
  if (!deletionResult.success) {
    return res.status(500).json({ success: false, message: 'Failed to delete user and associated data.' });
  }

  return res.json({
    success: true,
    message: `Account for ${targetUser.name} (${targetUser.role}) and all associated data permanently deleted.`,
    deletedUser: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
    },
    deletedCounts: deletionResult.deletedCounts,
  });
};

adminRouter.delete('/users/:id', requireAdmin, handleDeleteUserAccount);
adminRouter.delete('/administrators/:id', requireAdmin, handleDeleteUserAccount);

// Admin add MCQ Question
adminRouter.post('/questions', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { category, question, options, correctAnswerIndex, explanation, difficulty } = req.body;
  if (!question || !options || options.length < 2) {
    return res.status(400).json({ success: false, message: 'Question and options are required.' });
  }

  const newQ = db.addMcqQuestion({
    id: `mcq_${Date.now()}`,
    category: category || 'General',
    question,
    options,
    correctAnswerIndex: correctAnswerIndex ?? 0,
    explanation: explanation || '',
    difficulty: difficulty || 'Intermediate',
  });

  return res.json({
    success: true,
    question: newQ,
  });
});

// Admin delete MCQ Question
adminRouter.delete('/questions/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteMcqQuestion(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Question not found.' });
  }
  return res.json({
    success: true,
    message: 'Question deleted successfully.',
  });
});

// Admin update MCQ Question
adminRouter.put('/questions/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateMcqQuestion(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Question not found.' });
  }
  return res.json({
    success: true,
    question: updated,
    message: 'Question updated successfully.',
  });
});

/**
 * =====================================================================
 * Interview Question Bank Endpoints (Question Title, Category, Difficulty, Expected Answer)
 * =====================================================================
 */

// GET /api/admin/interview-questions
adminRouter.get('/interview-questions', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id;
  const questions = db.getInterviewQuestions(adminId);
  return res.json({
    success: true,
    count: questions.length,
    questions,
  });
});

// POST /api/admin/interview-questions
adminRouter.post('/interview-questions', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, category, difficulty, expectedAnswer } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Question title is required.' });
  }
  if (!expectedAnswer || !expectedAnswer.trim()) {
    return res.status(400).json({ success: false, message: 'Expected answer is required.' });
  }

  const newQ = db.addInterviewQuestion({
    title,
    category: category || 'General Technical',
    difficulty: difficulty || 'Intermediate',
    expectedAnswer,
    adminId: req.user?.id,
  });

  return res.status(201).json({
    success: true,
    message: 'Question added to Question Bank successfully.',
    question: newQ,
  });
});

// PUT /api/admin/interview-questions/:id
adminRouter.put('/interview-questions/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, category, difficulty, expectedAnswer } = req.body;
  const updated = db.updateInterviewQuestion(req.params.id, {
    ...(title ? { title: title.trim() } : {}),
    ...(category ? { category: category.trim() } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(expectedAnswer ? { expectedAnswer: expectedAnswer.trim() } : {}),
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Question not found.' });
  }

  return res.json({
    success: true,
    message: 'Question updated successfully.',
    question: updated,
  });
});

// DELETE /api/admin/interview-questions/:id
adminRouter.delete('/interview-questions/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteInterviewQuestion(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Question not found.' });
  }
  return res.json({
    success: true,
    message: 'Question deleted from question bank successfully.',
  });
});

/**
 * =====================================================================
 * Scheduled Interviews Endpoints
 * =====================================================================
 */

// GET /api/admin/scheduled-interviews
adminRouter.get('/scheduled-interviews', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id;
  const adminEmail = req.user?.email;

  // Retrieve candidate IDs assigned to this administrator
  const myCandidateIds = new Set(
    db
      .getCandidates()
      .filter((c) => isCandidateAssignedToAdmin(c, adminId || '', adminEmail))
      .map((c) => c.id)
  );

  // Return scheduled interviews for this admin's assigned candidates or created by this admin
  const allInterviews = db.getScheduledInterviews();
  const filtered = allInterviews.filter(
    (si) => si.adminId === adminId || myCandidateIds.has(si.candidateId)
  );

  return res.json({
    success: true,
    count: filtered.length,
    interviews: filtered,
  });
});

// GET /api/admin/scheduled-interviews/:id
adminRouter.get('/scheduled-interviews/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const interview = db.getScheduledInterviewById(req.params.id);
  if (!interview) {
    return res.status(404).json({ success: false, message: 'Scheduled interview not found.' });
  }
  return res.json({
    success: true,
    interview,
  });
});

// POST /api/admin/scheduled-interviews (Create and schedule an interview)
adminRouter.post('/scheduled-interviews', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    candidateId,
    candidateIds,
    scheduledDate,
    scheduledTime,
    durationMinutes,
    questionIds,
    resultEnabled,
    adminNotes,
    clientRequestId,
  } = req.body;

  if (!candidateId && (!Array.isArray(candidateIds) || candidateIds.length === 0)) {
    return res.status(400).json({ success: false, message: 'Please select a candidate for the interview.' });
  }
  if (!scheduledDate || !scheduledTime) {
    return res.status(400).json({ success: false, message: 'Interview scheduled date and time are required.' });
  }
  if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Please select at least one question from the question bank.' });
  }

  // 1. Check whether the Administrator has enough XP before scheduling
  const adminUser = db.getUserById(req.user!.id);
  const xpCost = db.getXpSettings().adminScheduleInterviewCost;
  const currentXp = adminUser?.xpPoints || 0;

  if (currentXp < xpCost) {
    return res.status(400).json({
      success: false,
      insufficientXp: true,
      message: 'Insufficient XP to schedule this interview.',
      currentXp,
      requiredXp: xpCost,
    });
  }

  // Determine target candidates
  let targetCandidateIds: string[] = [];
  if (candidateId === 'ALL') {
    const myCandidates = db
      .getCandidates()
      .filter((c) => isCandidateAssignedToAdmin(c, req.user!.id, req.user?.email));
    targetCandidateIds = myCandidates.map((c) => c.id);
  } else if (Array.isArray(candidateIds) && candidateIds.length > 0) {
    targetCandidateIds = candidateIds;
  } else if (candidateId) {
    targetCandidateIds = [candidateId];
  }

  if (targetCandidateIds.length === 0) {
    return res.status(400).json({ success: false, message: 'No candidates available to schedule interview for.' });
  }

  const adminName = req.user?.name || 'Administrator';
  const createdInterviews: any[] = [];

  for (const cId of targetCandidateIds) {
    const candidate = db.getUserById(cId);
    if (!candidate) continue;

    const newInterview = db.createScheduledInterview({
      title: title || `${candidate.preferredJobRole || 'Software Engineer'} Technical Round`,
      candidateId: cId,
      adminId: req.user?.id || 'admin',
      adminName,
      scheduledDate,
      scheduledTime,
      durationMinutes: Number(durationMinutes) || 45,
      questionIds,
      resultEnabled: resultEnabled !== false,
      adminNotes,
    });
    createdInterviews.push(newInterview);
  }

  // 2. Deduct XP only after the interview is successfully created
  const mainInterview = createdInterviews[0];
  const refId = clientRequestId || mainInterview.id;
  const deductionResult = db.deductXpWithTransaction({
    userId: req.user!.id,
    amount: xpCost,
    type: 'INTERVIEW_SCHEDULING',
    referenceId: refId,
    description: `Scheduled interview: ${title || mainInterview.title}`,
  });

  const updatedAdmin = db.getUserById(req.user!.id);

  return res.status(201).json({
    success: true,
    message:
      createdInterviews.length > 1
        ? `Interview successfully scheduled and assigned to ${createdInterviews.length} candidates.`
        : 'Interview successfully scheduled and assigned to candidate.',
    interview: createdInterviews[0],
    interviews: createdInterviews,
    xpDeducted: xpCost,
    currentXp: updatedAdmin?.xpPoints ?? deductionResult.balanceAfter,
    alreadyDeducted: deductionResult.alreadyDeducted,
    transaction: deductionResult.transaction,
  });
});

// PUT /api/admin/scheduled-interviews/:id
adminRouter.put('/scheduled-interviews/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateScheduledInterview(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Scheduled interview not found.' });
  }
  return res.json({
    success: true,
    message: 'Interview updated successfully.',
    interview: updated,
  });
});

// POST /api/admin/scheduled-interviews/:id/cancel (Administrator cancels scheduled interview and receives 100% refund)
adminRouter.post('/scheduled-interviews/:id/cancel', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id || '';
  const { reason } = req.body;

  const result = db.cancelScheduledInterview(req.params.id, adminId, reason);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error || 'Failed to cancel scheduled interview.',
      canRefund: result.canRefund,
    });
  }

  const updatedAdmin = db.getUserById(adminId);

  return res.json({
    success: true,
    message: result.refunded
      ? `Interview successfully cancelled. 100% refund of ${result.refundAmount} XP credited to your balance.`
      : 'Interview successfully cancelled.',
    interview: result.interview,
    refunded: result.refunded,
    refundAmount: result.refundAmount,
    currentXp: updatedAdmin?.xpPoints,
    transaction: result.transaction,
  });
});

// DELETE /api/admin/scheduled-interviews/:id
adminRouter.delete('/scheduled-interviews/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const interview = db.getScheduledInterviewById(req.params.id);
  if (!interview) {
    return res.status(404).json({ success: false, message: 'Scheduled interview not found.' });
  }

  // Active interview cannot be cancelled / deleted
  if (interview.status === 'IN_PROGRESS') {
    return res.status(400).json({
      success: false,
      message: 'Cancellation not allowed: The candidate has already started the interview.',
    });
  }

  // If in SCHEDULED status, refund the administrator first!
  let refundInfo: any = null;
  if (interview.status === 'SCHEDULED') {
    const cancelRes = db.cancelScheduledInterview(req.params.id, req.user?.id || '', 'Cancelled and deleted by Administrator');
    if (cancelRes.refunded) {
      refundInfo = {
        refunded: true,
        refundAmount: cancelRes.refundAmount,
        transaction: cancelRes.transaction,
      };
    }
  }

  const success = db.deleteScheduledInterview(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Scheduled interview not found.' });
  }

  const currentAdmin = req.user?.id ? db.getUserById(req.user.id) : null;

  return res.json({
    success: true,
    message: refundInfo?.refunded
      ? `Scheduled interview deleted. ${refundInfo.refundAmount} XP has been refunded to your account.`
      : 'Scheduled interview deleted successfully.',
    refundInfo,
    currentXp: currentAdmin?.xpPoints,
  });
});

// PATCH /api/admin/scheduled-interviews/:id/result-visibility
adminRouter.patch('/scheduled-interviews/:id/result-visibility', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { enabled } = req.body;
  const updated = db.toggleResultVisibility(req.params.id, Boolean(enabled));
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Scheduled interview not found.' });
  }
  return res.json({
    success: true,
    message: `Candidate result visibility ${enabled ? 'enabled' : 'disabled'}.`,
    interview: updated,
  });
});

// GET /api/admin/xp-settings (Get configurable XP costs)
adminRouter.get('/xp-settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.getXpSettings();
  return res.json({
    success: true,
    settings,
  });
});

// PUT /api/admin/xp-settings (Update configurable XP costs)
adminRouter.put('/xp-settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    adminScheduleInterviewCost,
    aiInterviewCost,
    mcqPracticeCost,
    codingInterviewCost,
    assignmentInterviewCost,
    initialUserXp,
  } = req.body;

  const updated = db.updateXpSettings({
    adminScheduleInterviewCost,
    aiInterviewCost,
    mcqPracticeCost,
    codingInterviewCost,
    assignmentInterviewCost,
    initialUserXp,
  });

  return res.json({
    success: true,
    message: 'XP costs and rules successfully updated.',
    settings: updated,
  });
});

// GET /api/admin/xp-transactions (Audit log of all XP deductions and additions)
adminRouter.get('/xp-transactions', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId, type, action } = req.query;
  let transactions = db.getXpTransactions(userId ? String(userId) : undefined);

  if (type) {
    transactions = transactions.filter((t) => t.type === type);
  }
  if (action) {
    transactions = transactions.filter((t) => t.action === action);
  }

  return res.json({
    success: true,
    total: transactions.length,
    transactions,
  });
});
