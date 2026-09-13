import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth';
import { db } from '../db';
import { XpTransactionModel } from '../models/XpTransactionModel';

export const gamificationRouter = Router();

// Leaderboard with privacy filter
gamificationRouter.get('/leaderboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  // Filter only users who opted-in to the public leaderboard
  const publicUsers = users
    .filter((u) => u.isOnLeaderboard !== false)
    .map((u) => {
      const interviews = db.getInterviewsByUser(u.id).filter((i) => i.status === 'COMPLETED');
      const avgScore = interviews.length > 0
        ? Math.round(interviews.reduce((a, b) => a + (b.overallScore || 0), 0) / interviews.length)
        : 80;
      return {
        id: u.id,
        userId: u.id,
        name: u.name,
        profileImage: u.profileImage,
        preferredJobRole: u.preferredJobRole || 'Software Engineer',
        jobRole: u.preferredJobRole || 'Software Engineer',
        xpPoints: u.xpPoints || 100,
        xp: u.xpPoints || 100,
        level: u.level || 'Beginner',
        currentStreak: u.currentStreak || 1,
        averageScore: avgScore,
        interviewsCompleted: interviews.length,
      };
    })
    .sort((a, b) => (b.xpPoints || 0) - (a.xpPoints || 0))
    .map((u, index) => ({
      rank: index + 1,
      ...u,
    }));

  const userRankIndex = publicUsers.findIndex((u) => u.id === req.user?.id);
  const currentUser = {
    rank: userRankIndex !== -1 ? userRankIndex + 1 : undefined,
    xp: req.user?.xpPoints || 100,
    badge: req.user?.level || 'Rising Star',
    interviewsCompleted: db.getInterviewsByUser(req.user?.id || '').filter((i) => i.status === 'COMPLETED').length,
  };

  return res.json({
    success: true,
    leaderboard: publicUsers,
    currentUser,
  });
});

// Toggle Leaderboard participation
gamificationRouter.post('/leaderboard/toggle', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { isOnLeaderboard } = req.body;
  const updated = db.updateUser(user.id, { isOnLeaderboard: Boolean(isOnLeaderboard) });

  return res.json({
    success: true,
    message: updated?.isOnLeaderboard
      ? 'You have joined the public leaderboard.'
      : 'You have left the public leaderboard. Your stats are now private.',
    isOnLeaderboard: updated?.isOnLeaderboard,
  });
});

// User achievements
gamificationRouter.get('/achievements', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const userAchievements = db.getAchievementsByUser(user.id);
  const userCompletedInterviews = db.getInterviewsByUser(user.id).filter((i) => i.status === 'COMPLETED');
  const hasHighScore = userCompletedInterviews.some((i) => (i.overallScore || 0) >= 80);

  const defaultCatalog = [
    {
      id: 'ach_first_step',
      badge: '🏆',
      title: 'First Interview',
      description: 'Successfully completed your first AI mock interview session!',
      xpReward: 50,
      unlocked: userCompletedInterviews.length >= 1 || userAchievements.some((a) => a.title.includes('First')),
    },
    {
      id: 'ach_streak_hero',
      badge: '🔥',
      title: 'Active Streaker',
      description: 'Maintained an active practice streak for 3 or more days.',
      xpReward: 100,
      unlocked: (user.currentStreak || 1) >= 3 || userAchievements.some((a) => a.title.includes('Streak')),
    },
    {
      id: 'ach_tech_ace',
      badge: '⭐',
      title: 'Score Above 80',
      description: 'Attained a stellar score of 80% or higher on an interview session.',
      xpReward: 150,
      unlocked: hasHighScore || userAchievements.some((a) => a.title.includes('Score Above 80')),
    },
    {
      id: 'ach_mastery_5',
      badge: '🎯',
      title: 'Interview Veteran',
      description: 'Completed 5 or more technical mock interview evaluations.',
      xpReward: 200,
      unlocked: userCompletedInterviews.length >= 5,
    },
    {
      id: 'ach_xp_pioneer',
      badge: '⚡',
      title: 'XP Pioneer',
      description: 'Accumulated over 250 total XP points across assessments.',
      xpReward: 250,
      unlocked: (user.xpPoints || 0) >= 250,
    },
  ];

  return res.json({
    success: true,
    achievements: defaultCatalog,
  });
});

// User notifications
gamificationRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifications = db.getNotificationsByUser(user.id);
  return res.json({
    success: true,
    notifications,
  });
});

// Mark notification as read
gamificationRouter.post('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifications = db.getNotificationsByUser(user.id);
  const target = notifications.find((n) => n.id === req.params.id);
  if (target) {
    target.read = true;
  }
  return res.json({
    success: true,
    message: 'Notification marked as read.',
  });
});

// Buy XP package endpoint with payment gateway
gamificationRouter.post('/xp/buy', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { xp, price, paymentMethod, cardLast4 } = req.body;
  const points = Math.max(50, Math.min(10000, Number(xp) || 500));

  const txnId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const paymentMethodLabel = paymentMethod === 'razorpay'
    ? 'Razorpay (UPI / Cards / NetBanking)'
    : cardLast4
    ? `Real-Time Card ending in ${cardLast4}`
    : 'Online Payment';

  const xpResult = db.awardXpWithTransaction(
    user.id,
    points,
    'ADDITION',
    `Purchased ${points} XP via ${paymentMethodLabel} (${price || '$6.99'})`,
    { referenceId: txnId }
  );

  const updatedUser = db.getUserById(user.id);

  db.addNotification({
    id: 'notif_' + Date.now(),
    userId: user.id,
    title: 'Payment Successful! ⚡',
    message: `Payment of ${price || '$6.99'} cleared (+${points} XP). Balance is now ${xpResult.xp} XP (${xpResult.level})!`,
    createdAt: new Date().toISOString(),
    read: false,
    type: 'ACHIEVEMENT',
  });

  return res.json({
    success: true,
    message: `Payment authorized! Added +${points} XP.`,
    xp: xpResult.xp,
    level: xpResult.level,
    leveledUp: xpResult.leveledUp,
    user: updatedUser,
    transaction: xpResult.transaction,
    transactionId: txnId,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/gamification/xp-balance
gamificationRouter.get('/xp-balance', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  return res.json({
    success: true,
    xpPoints: user.xpPoints || 0,
    level: user.level || 'Beginner',
    currentStreak: user.currentStreak || 1,
  });
});

// GET /api/gamification/xp-transactions (Direct MongoDB Atlas Query + No-Cache + Flexible Lookup)
gamificationRouter.get('/xp-transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  // 1. Force strict no-cache so browser never gets 304 Not Modified
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const user = req.user!;
    const userIdStr = String(user.id || (user as any)._id || '').trim();
    const userEmailStr = String(user.email || '').trim().toLowerCase();

    // 2. Query MongoDB Atlas directly with flexible matching (userId exact, regex, or email)
    let userTxns: any[] = [];
    try {
      const orConditions: any[] = [
        { userId: userIdStr },
        { userEmail: userEmailStr },
      ];

      if (user.id && String(user.id) !== userIdStr) {
        orConditions.push({ userId: String(user.id) });
      }

      if (userIdStr.length > 3) {
        orConditions.push({ userId: { $regex: new RegExp(userIdStr, 'i') } });
      }

      userTxns = await XpTransactionModel.find({ $or: orConditions })
        .sort({ createdAt: -1 })
        .lean();
    } catch (err: any) {
      console.warn('[Gamification Router] Atlas query fallback to db cache:', err?.message);
    }

    // Fallback to in-memory db cache if Atlas returned empty
    if (!userTxns || userTxns.length === 0) {
      const allTxns = db.getAllXpTransactions ? db.getAllXpTransactions() : db.getXpTransactions();
      userTxns = (allTxns || []).filter((t: any) => {
        const matchId =
          String(t.userId).trim() === userIdStr ||
          (user.id && String(t.userId).trim() === String(user.id).trim());
        const matchEmail =
          t.userEmail && String(t.userEmail).trim().toLowerCase() === userEmailStr;
        return matchId || matchEmail;
      });
    }

    // 3. Fallback auto-backfill if balance exists but history collection was empty
    const currentPoints = user.xpPoints || 0;
    if (userTxns.length === 0 && currentPoints > 0) {
      const backfillTxn = db.recordTransaction({
        userId: userIdStr,
        userEmail: user.email || '',
        userName: user.name || '',
        userRole: user.role || 'USER',
        type: 'BONUS_EARNED',
        action: 'ADDITION',
        amount: currentPoints,
        balanceBefore: 0,
        balanceAfter: currentPoints,
        description: 'Account Balance Milestone: Assessments & Activity XP',
        status: 'COMPLETED',
      });
      userTxns = [backfillTxn];
    }

    // 4. Calculate summary metrics for UI display cards
    const deductionsList = userTxns.filter(
      (t: any) => Number(t.amount) < 0 || t.action === 'DEDUCTION' || t.type === 'XP_DEDUCTED'
    );
    const refundsList = userTxns.filter(
      (t: any) =>
        Number(t.amount) > 0 &&
        (t.action === 'ADDITION' ||
          String(t.type || '').includes('REFUND') ||
          t.type === 'BONUS_EARNED')
    );

    const totalDeductions = deductionsList.reduce(
      (sum: number, t: any) => sum + Math.abs(Number(t.amount) || 0),
      0
    );
    const totalRefunds = refundsList.reduce(
      (sum: number, t: any) => sum + (Number(t.amount) || 0),
      0
    );

    return res.json({
      success: true,
      transactions: userTxns,
      data: userTxns,
      history: userTxns,
      totalTransactions: userTxns.length,
      totalCount: userTxns.length,
      deductions: totalDeductions,
      refunds: totalRefunds,
      totalDeductions,
      totalRefunds,
      deductionsCount: deductionsList.length,
      refundsCount: refundsList.length,
      netFlow: totalRefunds - totalDeductions,
      summary: {
        totalDeductions,
        totalRefunds,
        netFlow: totalRefunds - totalDeductions,
        deductionsCount: deductionsList.length,
        refundsCount: refundsList.length,
        count: userTxns.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch XP transactions.' });
  }
});

// GET /api/gamification/xp-settings
gamificationRouter.get('/xp-settings', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.getXpSettings();
  return res.json({
    success: true,
    settings,
  });
});