import fs from 'fs';
import path from 'path';
import { UserModel } from './models/UserModel';
import { XpTransactionModel } from './models/XpTransactionModel';
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
  NotificationItem,
  SecureAssessmentSession,
  ViolationRecord,
  AssessmentType,
  ViolationType,
  XpTransaction,
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
    this.syncFromMongoAtlas();
  }

  public async syncFromMongoAtlas(): Promise<void> {
    try {
      const atlasUsers = await UserModel.find({}).lean();
      if (atlasUsers && atlasUsers.length > 0) {
        this.data.users = atlasUsers.map((u: any) => ({
          ...u,
          id: u.id || u._id?.toString(),
        })) as User[];
        console.log(`[MongoDB Atlas] Successfully loaded ${this.data.users.length} users into live memory.`);
      }

      // Load persisted transactions from MongoDB Atlas 'xp_transactions' collection
      const atlasTxns = await XpTransactionModel.find({}).sort({ createdAt: -1 }).lean();
      if (atlasTxns && atlasTxns.length > 0) {
        this.data.xpTransactions = atlasTxns.map((t: any) => ({
          ...t,
          id: t.id || t._id?.toString(),
          userId: String(t.userId),
        })) as XpTransaction[];
        console.log(`[MongoDB Atlas] Successfully loaded ${this.data.xpTransactions.length} XP transactions into live memory.`);
      }
    } catch (err: any) {
      console.warn(`[MongoDB Atlas] Sync from Atlas waiting for DB connection...`, err?.message);
    }
  }

  private loadOrSeed(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          users: [],
          resumes: parsed.resumes || [],
          jobDescriptions: parsed.jobDescriptions || [],
          interviews: parsed.interviews || [],
          performances: parsed.performances || [],
          achievements: parsed.achievements || [],
          mcqQuestions: parsed.mcqQuestions || [],
          interviewQuestions: parsed.interviewQuestions || defaultInterviewQuestions,
          scheduledInterviews: parsed.scheduledInterviews || [],
          notifications: parsed.notifications || [],
          secureAssessments: parsed.secureAssessments || [],
          xpTransactions: parsed.xpTransactions || [],
          xpSettings: parsed.xpSettings || { ...defaultXpSettings },
          aiRequestsCount: parsed.aiRequestsCount || 0,
        };
      }
    } catch (err) {
      console.warn('Could not read existing database.json, seeding empty schema...', err);
    }
    return {
      users: [],
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

  private save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const dataToSave = { ...this.data, users: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist temporary database.json:', err);
    }
  }

  public populateAssignedAdmin(user: User): User {
    if (user.role === 'USER' || user.role === 'CANDIDATE') {
      const targetAdminId = user.adminId;
      const admin = this.data.users.find((u) => u.id === targetAdminId);
      return {
        ...user,
        assignedAdmin: admin
          ? { id: admin.id, name: admin.name, email: admin.email, adminCode: admin.adminCode }
          : undefined,
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
    const user = this.data.users.find((u) => u.id === id || String((u as any)._id) === String(id));
    return user ? this.populateAssignedAdmin(user) : undefined;
  }

  public getUserByEmail(email: string): User | undefined {
    const user = this.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
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

  public createUser(user: User): User {
    this.data.users.push(user);
    UserModel.create(user)
      .then(() => console.log(`[MongoDB Atlas] User successfully persisted: ${user.email}`))
      .catch((err: any) => console.error(`[MongoDB Atlas] Error persisting user:`, err?.message));
    return this.populateAssignedAdmin(user);
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id || String((u as any)._id) === String(id));
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    UserModel.findOneAndUpdate({ id }, updates).catch((err: any) => {
      console.error(`[MongoDB Atlas] Error updating user:`, err?.message);
    });
    return this.data.users[idx];
  }

  public permanentlyDeleteUserAndAllData(userId: string): { success: boolean; deletedUser?: User } {
    const userIdx = this.data.users.findIndex((u) => u.id === userId || String((u as any)._id) === String(userId));
    if (userIdx === -1) return { success: false };

    const [deletedUser] = this.data.users.splice(userIdx, 1);
    this.data.resumes = (this.data.resumes || []).filter((r) => String(r.userId) !== String(userId));
    this.data.jobDescriptions = (this.data.jobDescriptions || []).filter((j) => String(j.userId) !== String(userId));
    this.data.interviews = (this.data.interviews || []).filter((i) => String(i.userId) !== String(userId));
    this.data.performances = (this.data.performances || []).filter((p) => String(p.userId) !== String(userId));
    this.data.achievements = (this.data.achievements || []).filter((a) => String(a.userId) !== String(userId));
    this.data.notifications = (this.data.notifications || []).filter((n) => String(n.userId) !== String(userId));
    this.data.secureAssessments = (this.data.secureAssessments || []).filter((s) => String((s as any).candidateId) !== String(userId));
    this.data.xpTransactions = (this.data.xpTransactions || []).filter((x) => String(x.userId) !== String(userId));

    this.save();
    UserModel.deleteOne({ id: userId }).catch((err: any) => {
      console.error(`[MongoDB Atlas] Error deleting user:`, err?.message);
    });
    XpTransactionModel.deleteMany({ userId: String(userId) }).catch((err: any) => {
      console.error(`[MongoDB Atlas] Error deleting user transactions:`, err?.message);
    });

    return { success: true, deletedUser };
  }

  public deleteUser(id: string): boolean {
    const result = this.permanentlyDeleteUserAndAllData(id);
    return result.success;
  }

  // --- Resumes ---
  public getResumesByUser(userId: string): ResumeDocument[] {
    return (this.data.resumes || []).filter((r) => String(r.userId) === String(userId));
  }

  public getResumeById(id: string): ResumeDocument | undefined {
    return (this.data.resumes || []).find((r) => r.id === id);
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
    const idx = (this.data.resumes || []).findIndex((r) => r.id === id && String(r.userId) === String(userId));
    if (idx === -1) return false;
    this.data.resumes.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Job Descriptions ---
  public getJobDescriptionsByUser(userId: string): JobDescriptionDocument[] {
    return (this.data.jobDescriptions || []).filter((j) => String(j.userId) === String(userId));
  }

  public getJobDescriptionById(id: string): JobDescriptionDocument | undefined {
    return (this.data.jobDescriptions || []).find((j) => j.id === id);
  }

  public saveJobDescription(job: JobDescriptionDocument): JobDescriptionDocument {
    if (!this.data.jobDescriptions) this.data.jobDescriptions = [];
    this.data.jobDescriptions.unshift(job);
    this.save();
    return job;
  }

  // --- Interviews & History Management ---
  public getInterviewsByUser(userId: string): InterviewSession[] {
    return (this.data.interviews || []).filter((i) => String(i.userId) === String(userId));
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

  public createInterview(interview: InterviewSession): InterviewSession {
    return this.saveInterview(interview);
  }

  public updateInterview(id: string, updates: Partial<InterviewSession>): InterviewSession | undefined {
    if (!this.data.interviews) return undefined;
    const idx = this.data.interviews.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.data.interviews[idx] = { ...this.data.interviews[idx], ...updates };
    this.save();
    return this.data.interviews[idx];
  }

  public clearInterviewHistory(userId: string): boolean {
    if (!this.data.interviews) this.data.interviews = [];
    this.data.interviews = this.data.interviews.filter((i) => String(i.userId) !== String(userId));
    if (this.data.secureAssessments) {
      this.data.secureAssessments = this.data.secureAssessments.filter((s) => String(s.candidateId) !== String(userId));
    }
    this.save();
    return true;
  }

  public clearInterviewsByUser(userId: string): boolean {
    return this.clearInterviewHistory(userId);
  }

  public deleteInterview(id: string, userId?: string): boolean {
    if (!this.data.interviews) return false;
    const prevCount = this.data.interviews.length;
    this.data.interviews = this.data.interviews.filter((i) => {
      if (userId) return !(i.id === id && String(i.userId) === String(userId));
      return i.id !== id;
    });
    const removed = this.data.interviews.length < prevCount;
    if (removed) this.save();
    return removed;
  }

  public clearActiveCandidateSessions(candidateId: string): void {
    if (!this.data.secureAssessments) this.data.secureAssessments = [];
    this.data.secureAssessments.forEach((s) => {
      if (String(s.candidateId) === String(candidateId) && s.status === 'IN_PROGRESS') {
        s.status = 'COMPLETED';
        s.endedAt = new Date().toISOString();
        s.updatedAt = new Date().toISOString();
      }
    });

    if (!this.data.interviews) this.data.interviews = [];
    this.data.interviews.forEach((i) => {
      if (String(i.userId) === String(candidateId) && i.status === 'IN_PROGRESS') {
        i.status = 'COMPLETED';
        i.completedAt = new Date().toISOString();
      }
    });
    this.save();
  }

  // --- Performance & Achievements ---
  public getPerformancesByUser(userId: string): PerformanceRecord[] {
    return (this.data.performances || []).filter((p) => String(p.userId) === String(userId));
  }

  public addPerformance(perf: PerformanceRecord): PerformanceRecord {
    if (!this.data.performances) this.data.performances = [];
    this.data.performances.push(perf);
    this.save();
    return perf;
  }

  public getAchievementsByUser(userId: string): AchievementItem[] {
    return (this.data.achievements || []).filter((a) => String(a.userId) === String(userId));
  }

  public addAchievement(item: AchievementItem): AchievementItem {
    if (!this.data.achievements) this.data.achievements = [];
    this.data.achievements.unshift(item);
    this.save();
    return item;
  }

  // --- Notifications ---
  public getNotificationsByUser(userId: string): NotificationItem[] {
    return (this.data.notifications || []).filter((n) => String(n.userId) === String(userId));
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
  public getXpSettings(): XpSettings {
    return this.data.xpSettings;
  }

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

  // Supports both single object argument and positional arguments
  public deductXpWithTransaction(
    paramOrUserId: any,
    amountArg?: number,
    actionArg?: any,
    descriptionArg?: string,
    metadataArg?: Record<string, any>
  ): { success: boolean; deducted: number; newXp: number; level: string; balanceAfter: number; transaction?: XpTransaction } {
    let userId: string;
    let amount: number;
    let description: string;
    let referenceId: string | undefined;

    if (typeof paramOrUserId === 'object') {
      userId = paramOrUserId.userId;
      amount = paramOrUserId.amount || 0;
      description = paramOrUserId.description || 'Assessment Deduction';
      referenceId = paramOrUserId.referenceId;
    } else {
      userId = paramOrUserId;
      amount = amountArg || 0;
      description = descriptionArg || 'XP Deduction';
      referenceId = metadataArg?.interviewId || metadataArg?.referenceId;
    }

    const user = this.getUserById(userId);
    const result = this.deductXp(userId, amount);
    const oldBalance = user ? user.xpPoints || 0 : 0;
    const newBalance = result.xp;

    const transaction = this.recordTransaction({
      userId: String(userId),
      userEmail: user?.email || '',
      userName: user?.name || '',
      userRole: user?.role || 'USER',
      type: 'XP_DEDUCTED',
      action: 'DEDUCTION',
      amount: -result.deducted,
      balanceBefore: oldBalance,
      balanceAfter: newBalance,
      referenceId,
      description,
      status: 'COMPLETED',
    });

    return {
      success: result.success,
      deducted: result.deducted,
      newXp: result.xp,
      balanceAfter: newBalance,
      level: result.level,
      transaction,
    };
  }

  // Award XP with transaction (supports both object parameter and positional arguments)
  public awardXpWithTransaction(
    paramOrUserId: any,
    amountArg?: number,
    actionArg?: any,
    descriptionArg?: string,
    metadataArg?: Record<string, any>
  ): { xp: number; level: string; leveledUp: boolean; transaction: XpTransaction } {
    let userId: string;
    let amount: number;
    let description: string;
    let referenceId: string | undefined;

    if (typeof paramOrUserId === 'object') {
      userId = paramOrUserId.userId;
      amount = paramOrUserId.points || paramOrUserId.amount || 0;
      description = paramOrUserId.description || 'XP Awarded';
      referenceId = paramOrUserId.referenceId;
    } else {
      userId = paramOrUserId;
      amount = amountArg || 0;
      description = descriptionArg || 'XP Bonus';
      referenceId = metadataArg?.referenceId || metadataArg?.interviewId;
    }

    const user = this.getUserById(userId);
    const oldBalance = user ? user.xpPoints || 0 : 0;
    const result = this.awardXp(userId, amount);
    const newBalance = result.xp;

    const transaction = this.recordTransaction({
      userId: String(userId),
      userEmail: user?.email || '',
      userName: user?.name || '',
      userRole: user?.role || 'USER',
      type: 'BONUS_EARNED',
      action: 'ADDITION',
      amount,
      balanceBefore: oldBalance,
      balanceAfter: newBalance,
      referenceId,
      description,
      status: 'COMPLETED',
    });

    return {
      ...result,
      transaction,
    };
  }

  public refundXpWithTransaction(params: {
    userId: string;
    amount: number;
    type?: string;
    referenceId?: string;
    description?: string;
    reason?: string;
    originalTransactionId?: string;
  }): XpTransaction {
    const user = this.getUserById(params.userId);
    const oldBalance = user?.xpPoints || 0;
    const awardResult = this.awardXp(params.userId, params.amount);

    return this.recordTransaction({
      userId: String(params.userId),
      userEmail: user?.email || '',
      userName: user?.name || '',
      userRole: user?.role || 'USER',
      type: 'BONUS_EARNED',
      action: 'ADDITION',
      amount: params.amount,
      balanceBefore: oldBalance,
      balanceAfter: awardResult.xp,
      referenceId: params.referenceId,
      description: params.description || 'System Refund',
      status: 'COMPLETED',
    });
  }

  // Permanently persists transaction into local store and MongoDB Atlas collection
  public recordTransaction(txn: Omit<XpTransaction, 'id' | 'createdAt'>): XpTransaction {
    const transaction: XpTransaction = {
      id: `xp_txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...txn,
      userId: String(txn.userId),
    };

    if (!Array.isArray(this.data.xpTransactions)) {
      this.data.xpTransactions = [];
    }
    this.data.xpTransactions.unshift(transaction);
    this.save();

    // Persist to MongoDB Atlas 'xp_transactions' collection
    XpTransactionModel.create(transaction)
      .then(() => console.log(`[MongoDB Atlas] Transaction successfully stored: ${transaction.id}`))
      .catch((err: any) => console.warn(`[MongoDB Atlas] Error saving transaction to Atlas:`, err?.message));

    return transaction;
  }

  public getXpTransactionByReference(userId: string, referenceId: string, action?: string): XpTransaction | undefined {
    return (this.data.xpTransactions || []).find((t) => {
      const matchUser = String(t.userId) === String(userId);
      const matchRef = t.referenceId === referenceId;
      const matchAction = action ? t.action === action : true;
      return matchUser && matchRef && matchAction;
    });
  }

  // --- XP Transactions Retrieval for UI History ---
  public getXpTransactions(): XpTransaction[] {
    return this.data.xpTransactions || [];
  }

  public getAllXpTransactions(): XpTransaction[] {
    return this.data.xpTransactions || [];
  }

  public getXpTransactionsByUser(userId: string): XpTransaction[] {
    if (!this.data.xpTransactions) return [];
    const normalizedTarget = String(userId).trim();
    const user = this.getUserById(userId);
    const userEmail = user?.email?.toLowerCase();

    return this.data.xpTransactions.filter((t) => {
      const matchId = String(t.userId).trim() === normalizedTarget;
      const matchEmail = userEmail && t.userEmail && String(t.userEmail).toLowerCase() === userEmail;
      return matchId || matchEmail;
    });
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
    if (!this.data.interviewQuestions) this.data.interviewQuestions = [];
    if (adminId) return this.data.interviewQuestions.filter((q) => !q.adminId || q.adminId === adminId);
    return this.data.interviewQuestions;
  }

  // --- Scheduled Interviews ---
  public getScheduledInterviews(adminId?: string): ScheduledInterview[] {
    if (!this.data.scheduledInterviews) this.data.scheduledInterviews = [];
    if (adminId) return this.data.scheduledInterviews.filter((si) => si.adminId === adminId);
    return this.data.scheduledInterviews;
  }

  public getScheduledInterviewsByCandidate(candidateId: string): ScheduledInterview[] {
    if (!this.data.scheduledInterviews) this.data.scheduledInterviews = [];
    return this.data.scheduledInterviews.filter((si) => String(si.candidateId) === String(candidateId));
  }

  public getScheduledInterviewById(id: string): ScheduledInterview | undefined {
    return (this.data.scheduledInterviews || []).find((si) => si.id === id);
  }

  public updateScheduledInterview(id: string, updates: Partial<ScheduledInterview>): ScheduledInterview | undefined {
    if (!this.data.scheduledInterviews) return undefined;
    const idx = this.data.scheduledInterviews.findIndex((si) => si.id === id);
    if (idx === -1) return undefined;
    this.data.scheduledInterviews[idx] = { ...this.data.scheduledInterviews[idx], ...updates };
    this.save();
    return this.data.scheduledInterviews[idx];
  }

  // --- Secure Assessment / Proctoring Methods ---
  public getSecureAssessments(): SecureAssessmentSession[] {
    return this.data.secureAssessments || [];
  }

  public getActiveAssessmentByCandidate(candidateId: string): SecureAssessmentSession | null {
    return (
      (this.data.secureAssessments || []).find(
        (s) => String(s.candidateId) === String(candidateId) && s.status === 'IN_PROGRESS'
      ) || null
    );
  }

  public getSecureAssessmentById(id: string): SecureAssessmentSession | undefined {
    return (this.data.secureAssessments || []).find((s) => s.id === id || s.assessmentId === id);
  }

  public getSecureAssessmentByInterviewId(interviewId: string): SecureAssessmentSession | undefined {
    return (this.data.secureAssessments || []).find(
      (s) => s.assessmentId === interviewId || (s as any).interviewId === interviewId
    );
  }

  public startSecureAssessment(params: {
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    interviewId?: string;
    assessmentId?: string;
    assessmentType: AssessmentType;
    title?: string;
    assessmentTitle?: string;
    targetRole?: string;
    durationMinutes?: number;
    initialProgress?: any;
  }): { session?: SecureAssessmentSession; restored?: boolean; error?: string } {
    if (!this.data.secureAssessments) this.data.secureAssessments = [];

    const effectiveAssId = params.assessmentId || params.interviewId || `ass_${Date.now()}`;

    const existing = this.data.secureAssessments.find(
      (s) => (s.assessmentId === effectiveAssId || s.id === effectiveAssId) && String(s.candidateId) === String(params.candidateId)
    );

    if (existing) {
      if (existing.status === 'TERMINATED') {
        return {
          session: existing,
          error: 'Assessment was terminated due to security policy violations.',
        };
      }
      return {
        session: existing,
        restored: true,
      };
    }

    const now = new Date().toISOString();
    const session: SecureAssessmentSession = {
      id: `sec_ass_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      candidateId: String(params.candidateId),
      candidateName: params.candidateName,
      candidateEmail: params.candidateEmail,
      assessmentType: params.assessmentType,
      assessmentId: effectiveAssId,
      assessmentTitle: params.assessmentTitle || params.title || 'AI Assessment',
      status: 'IN_PROGRESS',
      startedAt: now,
      durationMinutes: params.durationMinutes || 45,
      violations: [],
      createdAt: now,
      updatedAt: now,
      ...(params.initialProgress ? { progress: params.initialProgress } : {}),
    } as any;

    this.data.secureAssessments.unshift(session);
    this.save();
    return { session, restored: false };
  }

  public updateSecureAssessmentProgress(assessmentId: string, progress: any): SecureAssessmentSession | undefined {
    const session = this.getSecureAssessmentById(assessmentId);
    if (!session) return undefined;
    (session as any).progress = progress;
    session.updatedAt = new Date().toISOString();
    this.save();
    return session;
  }

  public terminateSecureAssessment(params: {
    assessmentIdOrId: string;
    violationType: ViolationType;
    details?: string;
    finalProgress?: any;
  }): SecureAssessmentSession | undefined {
    const session = this.getSecureAssessmentById(params.assessmentIdOrId);
    if (!session) return undefined;

    session.status = 'TERMINATED';
    session.terminationReason = params.details || 'Unauthorized activity detected.';
    session.endedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
    if (params.finalProgress) {
      (session as any).progress = params.finalProgress;
    }

    if (!session.violations) session.violations = [];
    session.violations.push({
      id: `viol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: params.violationType,
      timestamp: new Date().toISOString(),
      details: params.details || '',
    });

    this.save();
    return session;
  }

  public completeSecureAssessment(assessmentIdentifier: string, finalProgress?: any): SecureAssessmentSession | null {
    const session = (this.data.secureAssessments || []).find(
      (s) =>
        s.id === assessmentIdentifier ||
        s.assessmentId === assessmentIdentifier ||
        (s as any).interviewId === assessmentIdentifier
    );
    if (!session) return null;
    session.status = 'COMPLETED';
    session.endedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
    if (finalProgress) {
      (session as any).progress = finalProgress;
    }
    this.save();
    return session;
  }

  public endSecureAssessment(sessionId: string): SecureAssessmentSession | null {
    return this.completeSecureAssessment(sessionId);
  }

  public createSecureAssessment(params: any): any {
    return this.startSecureAssessment(params);
  }

  public createAssessment(params: any): any {
    return this.startSecureAssessment(params);
  }

  public getAssessmentById(id: string): SecureAssessmentSession | undefined {
    return this.getSecureAssessmentById(id);
  }
}

export const db = new DatabaseService();