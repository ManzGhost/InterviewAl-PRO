import { Router, Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth';
import { db } from '../db';
import { AssessmentType, ViolationType } from '../types';

export const assessmentSecurityRouter = Router();

// Helper to safely find session by any identifier (id, assessmentId, or interviewId)
const findSessionByIdentifier = (identifier: string) => {
  if (!identifier) return null;
  return (
    db.getSecureAssessmentById(identifier) ||
    db.getSecureAssessmentByInterviewId(identifier) ||
    null
  );
};

// 1. Get currently active assessment for the authenticated candidate
assessmentSecurityRouter.get('/active', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const active = db.getActiveAssessmentByCandidate(user.id);
    if (!active) {
      return res.json({ success: true, activeAssessment: null });
    }

    // Recalculate remaining seconds
    const elapsed = Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000);
    const totalDuration = (active.durationMinutes || 45) * 60;
    const remainingSeconds = Math.max(0, totalDuration - elapsed);

    if (remainingSeconds <= 0 && active.status === 'IN_PROGRESS') {
      db.completeSecureAssessment(active.id);
      return res.json({ success: true, activeAssessment: null });
    }

    return res.json({
      success: true,
      activeAssessment: {
        ...active,
        remainingSeconds,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch active assessment status.' });
  }
});

// 2. Start or restore a Secure Assessment Session (Zero-Tolerance Mode)
assessmentSecurityRouter.post('/start', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      assessmentType,
      assessmentId,
      assessmentTitle,
      durationMinutes = 45,
      initialProgress = null,
    } = req.body;

    if (!assessmentType || !assessmentId) {
      return res.status(400).json({ success: false, message: 'assessmentType and assessmentId are required.' });
    }

    // Rule 1: Check if candidate already has an active assessment in another mode or test
    const currentActive = db.getActiveAssessmentByCandidate(user.id);
    if (currentActive && currentActive.assessmentId !== assessmentId && currentActive.id !== assessmentId) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: `You already have an active assessment in progress (${currentActive.assessmentTitle}). Zero-tolerance policy strictly forbids concurrent assessments.`,
        activeAssessment: currentActive,
      });
    }

    // Rule 2: Check if this assessment was previously TERMINATED
    const existing = findSessionByIdentifier(assessmentId);
    if (existing && String(existing.candidateId) === String(user.id) && existing.status === 'TERMINATED') {
      return res.status(403).json({
        success: false,
        terminated: true,
        message: 'Your assessment session has been terminated because unauthorized activity was detected.',
        session: existing,
      });
    }

    // Rule 3: XP Balance and Deduction Check
    const xpSettings = db.getXpSettings();
    let cost = 10;
    if (assessmentType === 'MCQ_PRACTICE') cost = xpSettings.mcqPracticeCost;
    else if (assessmentType === 'CODING_INTERVIEW') cost = xpSettings.codingInterviewCost;
    else if (assessmentType === 'ASSIGNMENT_INTERVIEW') cost = xpSettings.assignmentInterviewCost;
    else if (assessmentType === 'AI_INTERVIEW') cost = xpSettings.aiInterviewCost;

    const candidateUser = db.getUserById(user.id);
    const currentXp = candidateUser?.xpPoints || 0;
    const existingTxn = db.getXpTransactionByReference(user.id, assessmentId, 'DEDUCTION');

    // If this is a new session and has not been deducted yet, check balance
    if (!existingTxn && currentXp < cost) {
      return res.status(400).json({
        success: false,
        insufficientXp: true,
        requiredXp: cost,
        currentXp,
        message: 'Insufficient XP. Please earn more XP to start this assessment.',
      });
    }

    // Start or restore session
    const result = db.startSecureAssessment({
      candidateId: user.id,
      candidateName: user.name,
      candidateEmail: user.email,
      assessmentType: assessmentType as AssessmentType,
      assessmentId,
      assessmentTitle: assessmentTitle || `${assessmentType.replace(/_/g, ' ')}`,
      durationMinutes: Number(durationMinutes) || 45,
      initialProgress,
    });

    if (result.error) {
      return res.status(400).json({
        success: false,
        terminated: result.session?.status === 'TERMINATED',
        message: result.error,
        session: result.session,
      });
    }

    // Deduct XP only once for new sessions
    let deductionResult = existingTxn
      ? { success: true, alreadyDeducted: true, balanceAfter: currentXp, transaction: existingTxn }
      : db.deductXpWithTransaction({
          userId: user.id,
          amount: cost,
          type: assessmentType as any,
          referenceId: assessmentId,
          description: `Assessment: ${assessmentTitle || assessmentType.replace(/_/g, ' ')}`,
        });

    try {
      return res.json({
        success: true,
        restored: !!result.restored,
        session: result.session,
        xpDeducted: existingTxn ? 0 : cost,
        currentXp: deductionResult.balanceAfter,
        alreadyDeducted: !!existingTxn,
        transaction: deductionResult.transaction,
      });
    } catch (innerError) {
      if (!existingTxn && deductionResult && deductionResult.success && deductionResult.transaction) {
        db.refundXpWithTransaction({
          userId: user.id,
          amount: cost,
          type: 'SYSTEM_ERROR_REFUND',
          referenceId: assessmentId,
          description: `Assessment System Refund: Session failure (${assessmentTitle || assessmentType})`,
          reason: 'System or server error prevented assessment from starting',
          originalTransactionId: deductionResult.transaction.id,
        });
      }
      throw innerError;
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate secure assessment session. Any deducted XP has been automatically refunded.',
    });
  }
});

// 3. Save progress during active assessment
assessmentSecurityRouter.post('/progress', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { assessmentId, progress } = req.body;

    if (!assessmentId) {
      return res.status(400).json({ success: false, message: 'assessmentId is required.' });
    }

    const session = findSessionByIdentifier(assessmentId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Assessment session not found.' });
    }

    // Ownership check using string conversion
    const isOwner = String(session.candidateId) === String(user.id);
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (session.status === 'TERMINATED') {
      return res.status(403).json({
        success: false,
        terminated: true,
        message: 'This assessment is terminated. No further updates are permitted.',
      });
    }

    const updated = db.updateSecureAssessmentProgress(session.id, progress);
    return res.json({ success: true, session: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to save assessment progress.' });
  }
});

// 4. Terminate assessment immediately upon detection of any unauthorized activity
assessmentSecurityRouter.post('/terminate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      assessmentId,
      violationType = 'TAB_SWITCH',
      details = 'Unauthorized activity detected.',
      finalProgress = null,
    } = req.body;

    if (!assessmentId) {
      return res.status(400).json({ success: false, message: 'assessmentId is required.' });
    }

    const session = findSessionByIdentifier(assessmentId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Assessment session not found.' });
    }

    const isOwner = String(session.candidateId) === String(user.id);
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const terminatedSession = db.terminateSecureAssessment({
      assessmentIdOrId: session.id,
      violationType: violationType as ViolationType,
      details,
      finalProgress,
    });

    return res.json({
      success: true,
      terminated: true,
      message: 'Your assessment session has been terminated because unauthorized activity was detected.',
      session: terminatedSession,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to process assessment termination.' });
  }
});

// 5. Complete assessment normally (Fixes 403 Forbidden on Complete)
assessmentSecurityRouter.post('/complete', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { assessmentId, finalProgress } = req.body;

    if (!assessmentId) {
      return res.status(400).json({ success: false, message: 'assessmentId is required.' });
    }

    // Flexible identifier lookup (by id, assessmentId, or interviewId)
    const session = findSessionByIdentifier(assessmentId);
    if (!session) {
      // Graceful fallback if no security record was created
      return res.json({ success: true, completed: true, message: 'Assessment session completed.' });
    }

    const isOwner = String(session.candidateId) === String(user.id);
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (session.status === 'TERMINATED') {
      return res.status(403).json({
        success: false,
        terminated: true,
        message: 'This assessment was terminated due to policy violation and cannot be completed normally.',
      });
    }

    const completedSession = db.completeSecureAssessment(session.id, finalProgress);
    return res.json({ success: true, session: completedSession });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to complete assessment.' });
  }
});

// 6. Get session details by ID
assessmentSecurityRouter.get('/session/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const session = findSessionByIdentifier(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Assessment session not found.' });
    }

    const isOwner = String(session.candidateId) === String(user.id);
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    let remainingSeconds = session.remainingSeconds;
    if (session.status === 'IN_PROGRESS') {
      const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
      const totalDuration = (session.durationMinutes || 45) * 60;
      remainingSeconds = Math.max(0, totalDuration - elapsed);
    }

    return res.json({
      success: true,
      session: {
        ...session,
        remainingSeconds,
      },
      terminated: session.status === 'TERMINATED',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch session.' });
  }
});

// 7. Administrator Audit & Security Logs
assessmentSecurityRouter.get('/admin/logs', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const all = db.getSecureAssessments();
    const { status, type, search } = req.query;

    let filtered = [...all];

    if (status && status !== 'ALL') {
      filtered = filtered.filter((s) => s.status === status);
    }

    if (type && type !== 'ALL') {
      filtered = filtered.filter((s) => s.assessmentType === type);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.candidateName.toLowerCase().includes(q) ||
          s.candidateEmail.toLowerCase().includes(q) ||
          s.assessmentTitle.toLowerCase().includes(q) ||
          (s.terminationReason && s.terminationReason.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => new Date(b.updatedAt || b.startedAt).getTime() - new Date(a.updatedAt || a.startedAt).getTime());

    return res.json({
      success: true,
      totalCount: all.length,
      terminatedCount: all.filter((s) => s.status === 'TERMINATED').length,
      inProgressCount: all.filter((s) => s.status === 'IN_PROGRESS').length,
      completedCount: all.filter((s) => s.status === 'COMPLETED').length,
      logs: filtered,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve assessment security logs.' });
  }
});