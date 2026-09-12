import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateTokens, verifyToken } from '../auth';
import { User, UserRole } from '../types';

export const authRouter = Router();

// Register new user
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      college,
      education,
      skills,
      experienceLevel,
      experienceYears,
      preferredJobRole,
      role,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const skillsArray = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Java', 'React'];

    const userRole: UserRole = role === 'ADMIN' || email.toLowerCase().includes('admin') ? 'ADMIN' : 'CANDIDATE';

    let assignedAdminRecord: any = undefined;
    let candidateAdminId: string | undefined = undefined;
    let generatedAdminCode: string | undefined = undefined;

    if (userRole === 'CANDIDATE') {
      const adminCodeInput = (req.body.adminCode || '').trim();
      if (!adminCodeInput) {
        return res.status(400).json({
          success: false,
          message: 'Administrator Code is required for candidate registration. Please enter your Administrator Code.',
        });
      }

      const targetAdmin = db.getAdminByCode(adminCodeInput);
      if (!targetAdmin) {
        return res.status(400).json({
          success: false,
          message: `Invalid Administrator Code "${adminCodeInput}". Please verify the code with your Administrator or Recruiter.`,
        });
      }

      candidateAdminId = targetAdmin.id;
      assignedAdminRecord = {
        id: targetAdmin.id,
        name: targetAdmin.name,
        email: targetAdmin.email,
        adminCode: targetAdmin.adminCode,
      };
    } else {
      // Auto-generate unique Administrator Code for Administrator
      generatedAdminCode = db.generateUniqueAdminCode(name);
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: userRole,
      adminCode: generatedAdminCode,
      adminId: candidateAdminId,
      assignedAdmin: assignedAdminRecord,
      college: college || (userRole === 'ADMIN' ? 'Platform HQ' : 'State University'),
      education: education || (userRole === 'ADMIN' ? 'Staff Administrator' : 'B.Tech / B.S. in Computer Science'),
      experienceYears: experienceYears ? String(experienceYears) : undefined,
      skills: skillsArray,
      preferredJobRole: preferredJobRole || (userRole === 'ADMIN' ? 'Platform Administrator' : 'Software Engineer'),
      profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      xpPoints: userRole === 'ADMIN' ? 1000 : 100,
      level: userRole === 'ADMIN' ? 'System Admin' : 'Beginner',
      currentStreak: 1,
      emailVerified: true,
      isOnLeaderboard: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createUser(newUser);

    // Initial welcome notification
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: newUser.id,
      title: userRole === 'ADMIN' ? 'Administrator Account Active' : 'Welcome to InterviewAI!',
      message:
        userRole === 'ADMIN'
          ? `Your unique Administrator Code is ${generatedAdminCode}. Share this code with your candidates to link them to your portfolio.`
          : `You are connected to Administrator ${assignedAdminRecord?.name}. Explore mock interviews and ATS tools!`,
      type: 'REMINDER',
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Record welcome bonus transaction in XP history
    const starterXp = newUser.xpPoints || (userRole === 'ADMIN' ? 1000 : 100);
    db.recordTransaction({
      userId: newUser.id,
      userEmail: newUser.email,
      userName: newUser.name,
      userRole: newUser.role,
      type: 'BONUS_EARNED',
      action: 'ADDITION',
      amount: starterXp,
      balanceBefore: 0,
      balanceAfter: starterXp,
      referenceId: `welcome_${newUser.id}`,
      description: userRole === 'ADMIN' ? 'Administrator Initial Provisioning Balance' : 'Welcome Bonus Starter Pack',
    });

    const tokens = generateTokens(newUser);

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user: safeUser,
      ...tokens,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const tokens = generateTokens(user);
    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      user: safeUser,
      ...tokens,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// Logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// Refresh token
authRouter.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required.' });
  }

  const decoded = verifyToken(refreshToken);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }

  const user = db.getUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found.' });
  }

  const tokens = generateTokens(user);
  const { passwordHash: _, ...safeUser } = user;

  return res.json({
    success: true,
    user: safeUser,
    ...tokens,
  });
});

// Forgot password
authRouter.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    // Return friendly message even if user doesn't exist for security
    return res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been dispatched.',
      mockResetToken: 'reset_token_' + Date.now(),
    });
  }

  return res.json({
    success: true,
    message: 'Password reset link sent to your email address (simulated SMTP).',
    mockResetToken: `reset_${user.id}_${Date.now()}`,
  });
});

// Reset password
authRouter.post('/reset-password', (req: Request, res: Response) => {
  const { token, newPassword, email } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  let user = email ? db.getUserByEmail(email) : undefined;
  if (!user && token) {
    // Check if token contains user id
    const match = token.match(/reset_(user_[a-zA-Z0-9_]+)_/);
    if (match && match[1]) {
      user = db.getUserById(match[1]);
    }
  }

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(newPassword, salt);
  db.updateUser(user.id, { passwordHash });

  return res.json({
    success: true,
    message: 'Password has been updated successfully. You can now log in.',
  });
});

// Verify email
authRouter.post('/verify-email', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const user = db.getUserByEmail(email);
  if (user) {
    db.updateUser(user.id, { emailVerified: true });
  }

  return res.json({
    success: true,
    message: 'Email verified successfully.',
  });
});

// Validate Administrator Code
authRouter.get('/validate-admin-code', (req: Request, res: Response) => {
  const code = (req.query.code as string || '').trim();
  if (!code) {
    return res.status(400).json({
      success: false,
      valid: false,
      message: 'Code parameter is required.',
    });
  }

  const admin = db.getAdminByCode(code);
  if (!admin) {
    return res.json({
      success: true,
      valid: false,
      message: `Administrator Code "${code}" is not recognized or not currently active.`,
    });
  }

  return res.json({
    success: true,
    valid: true,
    message: `Valid code: ${admin.name}`,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      adminCode: admin.adminCode,
      preferredJobRole: admin.preferredJobRole,
      college: admin.college,
    },
  });
});

// Get public list of active administrator codes for easy onboarding / testing
authRouter.get('/admin-codes', (_req: Request, res: Response) => {
  const codes = db.getAllAdminCodes();
  return res.json({
    success: true,
    codes,
  });
});
