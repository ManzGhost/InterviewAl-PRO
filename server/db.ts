import fs from 'fs';
import path from 'path';
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

  // MongoDB Atlas se real users ko memory me sync karna
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
    } catch (err: any) {
      console.warn(`[MongoDB Atlas] Sync from Atlas waiting for DB connection...`);
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
          users: [], // Local disk par save nahi honge, Atlas se direct aayenge
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
      // Non-user sessions save honge, users hamesha khali rahega
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

  // --- CRUD: Strictly via MongoDB Atlas ---
  public createUser(user: User): User {
    this.data.users.push(user);

    UserModel.create(user)
      .then(() => console.log(`[MongoDB Atlas] User successfully persisted: ${user.email}`))
      .catch((err: any) => console.error(`[MongoDB Atlas] Error persisting user:`, err?.message));

    return this.populateAssignedAdmin(user);
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };

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
    this.data.secureAssessments = (this.data.secureAssessments || []).filter((s) => (s as any).candidateId !== userId);

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

  // Clear Interview History (Controller dono method names ko call kar sakta hai)
  public clearInterviewHistory(userId: string): boolean {
    if (!this.data.interviews) this.data.interviews = [];
    this.data.interviews = this.data.interviews.filter((i) => i.userId !== userId);

    if (this.data.secureAssessments) {
      this.data.secureAssessments = this.data.secureAssessments.filter(
        (s) => s.candidateId !== userId
      );
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
      if (userId) return !(i.id === id && i.userId === userId);
      return i.id !== id;
    });
    const removed = this.data.interviews.length < prevCount;
    if (removed) this.save();
    return removed;
  }

  // Release any stuck or pending sessions to eliminate 409 Conflict
  public clearActiveCandidateSessions(candidateId: string): void {
    if (!this.data.secureAssessments) this.data.secureAssessments = [];
    this.data.secureAssessments.forEach((s) => {
      if (s.candidateId === candidateId && s.status === 'IN_PROGRESS') {
        s.status = 'COMPLETED';
        s.endedAt = new Date().toISOString();
        s.updatedAt = new Date().toISOString();
      }
    });

    if (!this.data.interviews) this.data.interviews = [];
    this.data.interviews.forEach((i) => {
      if (i.userId === candidateId && i.status === 'IN_PROGRESS') {
        i.status = 'COMPLETED';
        i.completedAt = new Date().toISOString();
      }
    });

    this.save();
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

  public deductXpWithTransaction(
    userId: string,
    amount: number,
    action: any,
    description: string,
    metadata?: Record<string, any>
  ): { success: boolean; deducted: number; newXp: number; level: string; transaction?: XpTransaction } {
    const user = this.getUserById(userId);
    const result = this.deductXp(userId, amount);
    const oldBalance = user ? user.xpPoints : 0;
    const newBalance = result.xp;

    const transaction = this.recordTransaction({
      userId,
      userEmail: user?.email || '',
      userName: user?.name || '',
      userRole: user?.role || 'USER',
      type: 'XP_DEDUCTED',
      action: 'DEDUCTION',
      amount: -result.deducted,
      balanceBefore: oldBalance,
      balanceAfter: newBalance,
      referenceId: metadata?.interviewId || metadata?.referenceId,
      description,
      status: 'COMPLETED',
    });

    return {
      success: result.success,
      deducted: result.deducted,
      newXp: result.xp,
      level: result.level,
      transaction,
    };
  }

  public awardXpWithTransaction(
    userId: string,
    amount: number,
    action: any,
    description: string,
    metadata?: Record<string, any>
  ): { xp: number; level: string; leveledUp: boolean; transaction: XpTransaction } {
    const user = this.getUserById(userId);
    const oldBalance = user ? user.xpPoints : 0;
    const result = this.awardXp(userId, amount);
    const newBalance = result.xp;

    const transaction = this.recordTransaction({
      userId,
      userEmail: user?.email || '',
      userName: user?.name || '',
      userRole: user?.role || 'USER',
      type: 'BONUS_EARNED',
      action: 'ADDITION',
      amount,
      balanceBefore: oldBalance,
      balanceAfter: newBalance,
      referenceId: metadata?.interviewId || metadata?.referenceId,
      description,
      status: 'COMPLETED',
    });

    return {
      ...result,
      transaction,
    };
  }

  public getXpSettings(): XpSettings {
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
    return this.data.scheduledInterviews.filter((si) => si.candidateId === candidateId);
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
        (s) => s.candidateId === candidateId && s.status === 'IN_PROGRESS'
      ) || null
    );
  }

  public getSecureAssessmentById(id: string): SecureAssessmentSession | undefined {
    return (this.data.secureAssessments || []).find((s) => s.id === id);
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
  }): SecureAssessmentSession {
    if (!this.data.secureAssessments) this.data.secureAssessments = [];

    // Purane running sessions ko safely close karna
    this.data.secureAssessments.forEach((s) => {
      if (s.candidateId === params.candidateId && s.status === 'IN_PROGRESS') {
        s.status = 'COMPLETED';
        s.endedAt = new Date().toISOString();
        s.updatedAt = new Date().toISOString();
      }
    });

    const now = new Date().toISOString();
    const session: SecureAssessmentSession = {
      id: `sec_ass_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      candidateId: params.candidateId,
      candidateName: params.candidateName,
      candidateEmail: params.candidateEmail,
      assessmentType: params.assessmentType,
      assessmentId: params.assessmentId || params.interviewId || `ass_${Date.now()}`,
      assessmentTitle: params.assessmentTitle || params.title || 'AI Assessment',
      status: 'IN_PROGRESS',
      startedAt: now,
      durationMinutes: params.durationMinutes || 45,
      violations: [],
      createdAt: now,
      updatedAt: now,
    };

    this.data.secureAssessments.unshift(session);
    this.save();
    return session;
  }

  public recordViolation(
    sessionId: string,
    violationType: ViolationType,
    details?: string
  ): { session: SecureAssessmentSession; terminated: boolean } | null {
    const session = this.getSecureAssessmentById(sessionId);
    if (!session || session.status !== 'IN_PROGRESS') return null;

    if (!session.violations) session.violations = [];
    const record: ViolationRecord = {
      id: `viol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: violationType,
      timestamp: new Date().toISOString(),
      details: details || '',
    };

    session.violations.push(record);
    session.updatedAt = new Date().toISOString();

    let terminated = false;
    if (session.violations.length >= 3) {
      session.status = 'TERMINATED';
      session.terminationReason = 'Exceeded maximum allowed security violations';
      session.endedAt = new Date().toISOString();
      terminated = true;
    }

    this.save();
    return { session, terminated };
  }

  public completeSecureAssessment(assessmentIdentifier: string): SecureAssessmentSession | null {
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
    this.save();
    return session;
  }

  public endSecureAssessment(sessionId: string): SecureAssessmentSession | null {
    return this.completeSecureAssessment(sessionId);
  }
}

export const db = new DatabaseService();