import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth, AuthenticatedRequest } from '../auth';
import { db } from '../db';

export const userRouter = Router();

// Get current user profile
userRouter.get('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    success: true,
    user: safeUser,
  });
});

// Update profile
userRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const {
    name,
    college,
    education,
    skills,
    preferredJobRole,
    profileImage,
    linkedInUrl,
    gitHubUrl,
    isOnLeaderboard,
  } = req.body;

  const updates: any = {};
  if (name !== undefined) updates.name = name.trim();
  if (college !== undefined) updates.college = college.trim();
  if (education !== undefined) updates.education = education.trim();
  if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills : [skills];
  if (preferredJobRole !== undefined) updates.preferredJobRole = preferredJobRole.trim();
  if (profileImage !== undefined) updates.profileImage = profileImage;
  if (linkedInUrl !== undefined) updates.linkedInUrl = linkedInUrl;
  if (gitHubUrl !== undefined) updates.gitHubUrl = gitHubUrl;
  if (isOnLeaderboard !== undefined) updates.isOnLeaderboard = Boolean(isOnLeaderboard);

  const updatedUser = db.updateUser(user.id, updates);
  if (!updatedUser) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const { passwordHash: _, ...safeUser } = updatedUser;
  return res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: safeUser,
  });
});

// Change password
userRouter.put('/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password does not match.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(newPassword, salt);
  db.updateUser(user.id, { passwordHash });

  return res.json({
    success: true,
    message: 'Password changed successfully.',
  });
});

// Permanently delete own user account and all associated data
userRouter.delete('/account', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { password } = req.body || {};

  // If password was provided, verify it
  if (password) {
    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password confirmation failed.' });
    }
  }

  const deletionResult = db.permanentlyDeleteUserAndAllData(user.id);
  if (!deletionResult.success) {
    return res.status(404).json({ success: false, message: 'Account not found or already deleted.' });
  }

  return res.json({
    success: true,
    message: `Your account (${user.email}) and all associated data (resumes, interview history, scores, achievements, and notifications) have been permanently deleted.`,
    deletedCounts: deletionResult.deletedCounts,
  });
});
