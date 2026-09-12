import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { UserModel } from './models/UserModel';
import {
  User,
  ResumeDocument,
  JobDescriptionDocument,
  InterviewSession,
  PerformanceRecord,
  AchievementItem,
  McqQuestion,
  InterviewQuestion,
  ScheduledInterview,
  ScheduledInterviewQuestion,
  NotificationItem,
  SecureAssessmentSession,
  ViolationRecord,
  AssessmentType,
  ViolationType,
  XpTransaction,
  XpTransactionType,
  XpAction,
  XpSettings,
} from './types';

export const defaultXpSettings: XpSettings = {
  adminScheduleInterviewCost: 10,
  aiInterviewCost: 10,
  mcqPracticeCost: 5,
  codingInterviewCost: 10,
  assignmentInterviewCost: 10,
  initialUserXp: 100,
};

export interface DatabaseSchema {
  users: User[];
  resumes: ResumeDocument[];
  jobDescriptions: JobDescriptionDocument[];
  interviews: InterviewSession[];
  performances: PerformanceRecord[];
  achievements: AchievementItem[];
  mcqQuestions: McqQuestion[];
  interviewQuestions: InterviewQuestion[];
  scheduledInterviews: ScheduledInterview[];
  notifications: NotificationItem[];
  secureAssessments: SecureAssessmentSession[];
  xpTransactions: XpTransaction[];
  xpSettings: XpSettings;
  aiRequestsCount: number;
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export const defaultInterviewQuestions: InterviewQuestion[] = [
  {
    id: 'iq_001',
    title: 'HashMap vs ConcurrentHashMap Internal Architecture',
    category: 'Java',
    difficulty: 'Intermediate',
    expectedAnswer: 'HashMap is non-synchronized and permits one null key and multiple null values. In multi-threaded environments, concurrent modifications can cause race conditions or infinite loops. ConcurrentHashMap is thread-safe.',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'iq_002',
    title: 'JVM Garbage Collection & Memory Generations',
    category: 'Java',
    difficulty: 'Advanced',
    expectedAnswer: 'JVM heap memory is split into Young (Eden, S0, S1) and Old (Tenured) generations.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  }
];

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.users) {
          if (!parsed.resumes) parsed.resumes = [];
          if (!parsed.jobDescriptions) parsed.jobDescriptions = [];
          if (!parsed.interviews) parsed.interviews = [];
          if (!parsed.performances) parsed.performances = [];
          if (!parsed.achievements) parsed.achievements = [];
          if (!parsed.mcqQuestions) parsed.mcqQuestions = [];
          if (!parsed.interviewQuestions) parsed.interviewQuestions = defaultInterviewQuestions;
          if (!parsed.scheduledInterviews) parsed.scheduledInterviews = [];
          if (!parsed.notifications) parsed.notifications = [];
          if (!parsed.secureAssessments) parsed.secureAssessments = [];
          if (!parsed.xpTransactions) parsed.xpTransactions = [];
          if (!parsed.xpSettings) parsed.xpSettings = { ...defaultXpSettings };
          if (typeof parsed.aiRequestsCount !== 'number') parsed.aiRequestsCount = 0;
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read existing database.json, seeding new data...', err);
    }
    return this.createSeedData();
  }

  private save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database.json:', err);
    }
  }

  private createSeedData(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('Admin@12345', salt);

    const adminUser: User = {
      id: 'user_admin_001',
      name: 'System Admin',
      email: 'admin@interviewai.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      adminCode: 'ADMIN-SYS1',
      college: 'Indian Institute of Technology (IIT)',
      education: 'M.Tech in Computer Science',
      skills: ['Java', 'Spring Boot', 'System Design', 'React', 'MongoDB'],
      preferredJobRole: 'Lead Software Architect',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      xpPoints: 3450,
      level: 'Interview Master',
      currentStreak: 12,
      emailVerified: true,
      isOnLeaderboard: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      users: [adminUser],
      resumes: [],
      jobDescriptions: [],
      interviews: [],
      performances: [],
      achievements: [],
      mcqQuestions: [],
      interviewQuestions: defaultInterviewQuestions,
      scheduledInterviews: [],
      notifications: [],
      secureAssessments: [],
      xpTransactions: [],
      xpSettings: { ...defaultXpSettings },
      aiRequestsCount: 0,
    };
  }

  public populateAssignedAdmin(user: User): User {
    if (user.role === 'USER' || user.role === 'CANDIDATE') {
      const targetAdminId = user.adminId || 'user_admin_001';
      const admin = this.data.users.find((u) => u.id === targetAdminId);
      return {
        ...user,
        adminId: targetAdminId,
        assignedAdmin: admin
          ? { id: admin.id, name: admin.name, email: admin.email, adminCode: admin.adminCode || 'ADMIN-SYS1' }
          : { id: 'user_admin_001', name: 'System Admin', email: 'admin@interviewai.com', adminCode: 'ADMIN-SYS1' },
      };
    }
    return user;
  }

  public generateUniqueAdminCode(namePrefix?: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const rawPrefix = (namePrefix || 'ADM').trim().toUpperCase().replace(/[^A-Z]/g, '');
    const prefix = rawPrefix.length >= 3 ? rawPrefix.substring(0, 3) : 'ADM';
    return `ADMIN-${prefix}${suffix}`.substring(0, 10);
  }

  public getAdminByCode(adminCode: string): User | undefined {
    if (!adminCode) return undefined;
    const normalized = adminCode.trim().toUpperCase();
    const admin = this.data.users.find(
      (u) => (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') && u.adminCode?.toUpperCase() === normalized
    );
    return admin ? this.populateAssignedAdmin(admin) : undefined;
  }

  public getAllAdminCodes(): Array<{ code: string; name: string; email: string; id: string; role: string }> {
    return this.getAdministrators()
      .filter((a) => Boolean(a.adminCode))
      .map((a) => ({ code: a.adminCode!, name: a.name, email: a.email, id: a.id, role: a.role }));
  }

  public getUsers(): User[] {
    return this.data.users.map((u) => this.populateAssignedAdmin(u));
  }

  public getUserById(id: string): User | undefined {
    const user = this.data.users.find((u) => u.id === id);
    return user ? this.populateAssignedAdmin(user) : undefined;
  }

  public getUserByEmail(email: string): User | undefined {
    const user = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ? this.populateAssignedAdmin(user) : undefined;
  }

  public getAdministrators(): User[] {
    return this.data.users
      .filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
      .map((u) => this.populateAssignedAdmin(u));
  }

  public getCandidates(adminId?: string): User[] {
    const candidates = this.data.users.filter((u) => u.role === 'USER' || u.role === 'CANDIDATE');
    const populated = candidates.map((u) => this.populateAssignedAdmin(u));
    if (adminId) return populated.filter((c) => c.adminId === adminId);
    return populated;
  }

  // --- Users CRUD & Atlas Sync ---
  public createUser(user: User): User {
    if (user.role === 'USER' && !user.adminId) {
      user.adminId = 'user_admin_001';
    }
    this.data.users.push(user);
    this.save();

    UserModel.create(user)
      .then(() => console.log(`[MongoDB Atlas] User successfully synced: ${user.email}`))
      .catch((err: any) => console.error(`[MongoDB Atlas] Error syncing user:`, err?.message));

    return this.populateAssignedAdmin(user);
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();

    UserModel.findOneAndUpdate({ id }, updates).catch((err: any) => {
      console.error(`[MongoDB Atlas] Error updating user:`, err?.message);
    });

    return this.data.users[idx];
  }

  public permanentlyDeleteUserAndAllData(userId: string): { success: boolean; deletedUser?: User } {
    const userIdx = this.data.users.findIndex((u) => u.id === userId);
    if (userIdx === -1) return { success: false };

    const [deletedUser] = this.data.users.splice(userIdx, 1);
    this.data.resumes = (this.data.resumes || []).filter((r) => r.userId !== userId);
    this.data.jobDescriptions = (this.data.jobDescriptions || []).filter((j) => j.userId !== userId);
    this.data.interviews = (this.data.interviews || []).filter((i) => i.userId !== userId);
    this.data.performances = (this.data.performances || []).filter((p) => p.userId !== userId);
    this.data.achievements = (this.data.achievements || []).filter((a) => a.userId !== userId);
    this.data.notifications = (this.data.notifications || []).filter((n) => n.userId !== userId);

    this.save();

    UserModel.deleteOne({ id: userId }).catch((err: any) => {
      console.error(`[MongoDB Atlas] Error deleting user:`, err?.message);
    });

    return { success: true, deletedUser };
  }

  public deleteUser(id: string): boolean {
    const result = this.permanentlyDeleteUserAndAllData(id);
    return result.success;
  }

  // --- Resumes ---
  public getResumesByUser(userId: string): ResumeDocument[] {
    return (this.data.resumes || []).filter((r) => r.userId === userId);
  }

  public saveResume(resume: ResumeDocument): ResumeDocument {
    if (!this.data.resumes) this.data.resumes = [];
    const idx = this.data.resumes.findIndex((r) => r.id === resume.id);
    if (idx >= 0) {
      this.data.resumes[idx] = resume;
    } else {
      this.data.resumes.unshift(resume);
    }
    this.save();
    return resume;
  }

  public deleteResume(id: string, userId: string): boolean {
    const idx = (this.data.resumes || []).findIndex((r) => r.id === id && r.userId === userId);
    if (idx === -1) return false;
    this.data.resumes.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Job Descriptions ---
  public getJobDescriptionsByUser(userId: string): JobDescriptionDocument[] {
    return (this.data.jobDescriptions || []).filter((j) => j.userId === userId);
  }

  public saveJobDescription(job: JobDescriptionDocument): JobDescriptionDocument {
    if (!this.data.jobDescriptions) this.data.jobDescriptions = [];
    this.data.jobDescriptions.unshift(job);
    this.save();
    return job;
  }

  // --- Interviews ---
  public getInterviewsByUser(userId: string): InterviewSession[] {
    return (this.data.interviews || []).filter((i) => i.userId === userId);
  }

  public getAllInterviews(): InterviewSession[] {
    return this.data.interviews || [];
  }

  public getInterviewById(id: string): InterviewSession | undefined {
    return (this.data.interviews || []).find((i) => i.id === id);
  }

  public saveInterview(interview: InterviewSession): InterviewSession {
    if (!this.data.interviews) this.data.interviews = [];
    const idx = this.data.interviews.findIndex((i) => i.id === interview.id);
    if (idx >= 0) {
      this.data.interviews[idx] = interview;
    } else {
      this.data.interviews.unshift(interview);
    }
    this.save();
    return interview;
  }

  // --- Performance & Achievements ---
  public getPerformancesByUser(userId: string): PerformanceRecord[] {
    return (this.data.performances || []).filter((p) => p.userId === userId);
  }

  public addPerformance(perf: PerformanceRecord): PerformanceRecord {
    if (!this.data.performances) this.data.performances = [];
    this.data.performances.push(perf);
    this.save();
    return perf;
  }

  public getAchievementsByUser(userId: string): AchievementItem[] {
    return (this.data.achievements || []).filter((a) => a.userId === userId);
  }

  public addAchievement(item: AchievementItem): AchievementItem {
    if (!this.data.achievements) this.data.achievements = [];
    this.data.achievements.unshift(item);
    this.save();
    return item;
  }

  // --- Notifications ---
  public getNotificationsByUser(userId: string): NotificationItem[] {
    return (this.data.notifications || []).filter((n) => n.userId === userId);
  }

  public addNotification(notif: NotificationItem): NotificationItem {
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  // --- AI Requests Count ---
  public getAiRequestsCount(): number {
    return this.data.aiRequestsCount || 0;
  }

  public incrementAiRequests(): number {
    this.data.aiRequestsCount = (this.data.aiRequestsCount || 0) + 1;
    this.save();
    return this.data.aiRequestsCount;
  }

  // --- XP Settings & Transactions ---
  public awardXp(userId: string, points: number): { xp: number; level: string; leveledUp: boolean } {
    const user = this.getUserById(userId);
    if (!user) return { xp: 0, level: 'Beginner', leveledUp: false };
    const oldXp = user.xpPoints || 0;
    const newXp = oldXp + points;
    let newLevel = 'Beginner';
    if (newXp >= 3000) newLevel = 'Interview Master';
    else if (newXp >= 1800) newLevel = 'Advanced';
    else if (newXp >= 800) newLevel = 'Intermediate';

    const leveledUp = newLevel !== user.level;
    this.updateUser(userId, { xpPoints: newXp, level: newLevel });
    return { xp: newXp, level: newLevel, leveledUp };
  }

  public deductXp(userId: string, points: number): { xp: number; level: string; deducted: number; success: boolean } {
    const user = this.getUserById(userId);
    if (!user) return { xp: 0, level: 'Beginner', deducted: 0, success: false };
    const oldXp = user.xpPoints || 0;
    const deducted = Math.min(oldXp, Math.max(0, points));
    const newXp = Math.max(0, oldXp - deducted);
    let newLevel = 'Beginner';
    if (newXp >= 3000) newLevel = 'Interview Master';
    else if (newXp >= 1800) newLevel = 'Advanced';
    else if (newXp >= 800) newLevel = 'Intermediate';

    this.updateUser(userId, { xpPoints: newXp, level: newLevel });
    return { xp: newXp, level: newLevel, deducted, success: true };
  }

  public getXpSettings(): XpSettings {
    if (!this.data.xpSettings) {
      this.data.xpSettings = { ...defaultXpSettings };
      this.save();
    }
    return this.data.xpSettings;
  }

  public recordTransaction(txn: Omit<XpTransaction, 'id' | 'createdAt'>): XpTransaction {
    const transaction: XpTransaction = {
      id: `xp_txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...txn,
    };
    if (!Array.isArray(this.data.xpTransactions)) {
      this.data.xpTransactions = [];
    }
    this.data.xpTransactions.unshift(transaction);
    this.save();
    return transaction;
  }

  // --- MCQ & Questions ---
  public getMcqCategories(): string[] {
    return Array.from(new Set((this.data.mcqQuestions || []).map((q) => q.category)));
  }

  public getMcqQuestionsByCategory(category?: string): McqQuestion[] {
    if (!category || category.toLowerCase() === 'all') return this.data.mcqQuestions || [];
    return (this.data.mcqQuestions || []).filter((q) => q.category.toLowerCase() === category.toLowerCase());
  }

  public getInterviewQuestions(adminId?: string): InterviewQuestion[] {
    if (!this.data.interviewQuestions) this.data.interviewQuestions = [...defaultInterviewQuestions];
    if (adminId) return this.data.interviewQuestions.filter((q) => !q.adminId || q.adminId === adminId);
    return this.data.interviewQuestions;
  }

  // --- Scheduled Interviews & Assessments ---
  public getScheduledInterviews(adminId?: string): ScheduledInterview[] {
    if (!this.data.scheduledInterviews) this.data.scheduledInterviews = [];
    if (adminId) return this.data.scheduledInterviews.filter((si) => si.adminId === adminId);
    return this.data.scheduledInterviews;
  }

  public getSecureAssessments(): SecureAssessmentSession[] {
    return this.data.secureAssessments || [];
  }

  public getActiveAssessmentByCandidate(candidateId: string): SecureAssessmentSession | null {
    return (this.data.secureAssessments || []).find((s) => s.candidateId === candidateId && s.status === 'IN_PROGRESS') || null;
  }
}

export const db = new DatabaseService();