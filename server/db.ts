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
    expectedAnswer: 'HashMap is non-synchronized and permits one null key and multiple null values. In multi-threaded environments, concurrent modifications can cause race conditions or infinite loops. ConcurrentHashMap is thread-safe. In Java 8+, it achieves concurrency using CAS (Compare-And-Swap) for empty buckets and synchronized locks strictly on individual bucket nodes rather than locking the entire map (as Hashtable or SynchronizedMap did). It does not allow null keys or null values.',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'iq_002',
    title: 'JVM Garbage Collection & Memory Generations',
    category: 'Java',
    difficulty: 'Advanced',
    expectedAnswer: 'JVM heap memory is split into Young (Eden, S0, S1) and Old (Tenured) generations. Minor GC runs on the Young generation when Eden is full, promoting surviving objects with increased age to Old Generation. Major GC collects the Old generation. Collectors like G1 split the heap into equal-sized regions and prioritize regions with the most garbage (Garbage-First), while ZGC and Shenandoah achieve ultra-low pause times using concurrent marking and relocation.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'iq_003',
    title: 'Spring Boot Dependency Injection & Bean Lifecycle',
    category: 'Spring Boot',
    difficulty: 'Intermediate',
    expectedAnswer: 'Spring Boot achieves Inversion of Control via the IoC container. Dependencies are injected via constructor injection, setter, or field injection. The Bean lifecycle is: 1) Bean definition scan and instantiation, 2) Property population/injection, 3) Aware callbacks (BeanNameAware, ApplicationContextAware), 4) BeanPostProcessor pre-initialization, 5) Initialization (@PostConstruct, InitializingBean, init-method), 6) BeanPostProcessor post-initialization, 7) In service, and 8) Destruction (@PreDestroy, DisposableBean).',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'iq_004',
    title: 'Spring Security Filter Chain & JWT Stateless Authentication',
    category: 'Spring Boot',
    difficulty: 'Advanced',
    expectedAnswer: 'Spring Security intercepts HTTP requests through the DelegatedFilterProxy and SecurityFilterChain. For JWT stateless authentication, a custom OncePerRequestFilter extracts the Bearer token from the Authorization header, validates signature and expiration, retrieves the user claims/roles, and populates the SecurityContextHolder with an authenticated UsernamePasswordAuthenticationToken.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'iq_005',
    title: 'React Virtual DOM Reconciliation & Fiber Architecture',
    category: 'React',
    difficulty: 'Intermediate',
    expectedAnswer: 'React creates an in-memory Virtual DOM representation of the UI. When state or props change, React generates a new Virtual DOM tree and runs the Reconciliation diffing algorithm (O(n) heuristic). React Fiber introduced incremental rendering by breaking rendering work into smaller units of work (fibers) that can be paused, aborted, or prioritized based on urgency, keeping main thread animations fluid.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'iq_006',
    title: 'ACID Properties and Database Transaction Isolation Levels',
    category: 'SQL',
    difficulty: 'Intermediate',
    expectedAnswer: 'ACID guarantees Atomicity (all operations succeed or entire transaction rolls back), Consistency (data remains valid according to constraints), Isolation (concurrent transactions execute without interference), and Durability (committed data persists permanently). The 4 isolation levels are: Read Uncommitted (allows dirty reads), Read Committed (prevents dirty reads), Repeatable Read (prevents non-repeatable reads; default in MySQL InnoDB), and Serializable (strictest isolation; prevents phantom reads).',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'iq_007',
    title: 'Handling a Production Outage and System Incident (STAR Method)',
    category: 'Behavioral',
    difficulty: 'Beginner',
    expectedAnswer: 'Use STAR structure: Situation describes the incident severity (e.g. latency spike or 5xx surge); Task explains your ownership and triage role; Action outlines step-by-step containment (traffic routing, rollback, thread dump inspection, or hotfix deployment) with transparent cross-team stakeholder communication; Result summarizes recovery metrics, zero data loss, post-mortem findings, and automated alerting or guardrails established.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'iq_008',
    title: 'High-Throughput Distributed Rate Limiting System Design',
    category: 'System Design',
    difficulty: 'Advanced',
    expectedAnswer: 'A distributed rate limiter can be built using algorithms like Token Bucket, Leaky Bucket, or Sliding Window Log/Counter. Using Redis with Lua scripts ensures atomic read-and-decrement operations across multiple distributed server instances. Headers like X-RateLimit-Limit, X-RateLimit-Remaining, and Retry-After communicate status back to clients. A fallback local in-memory cache (Guava/Caffeine) handles temporary Redis cluster outages.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export const defaultScheduledInterviews: ScheduledInterview[] = [
  {
    id: 'sch_int_001',
    title: 'Java Full Stack Core Technical Round',
    candidateId: 'user_demo_002',
    candidateName: 'Alex Johnson',
    candidateEmail: 'alex@university.edu',
    adminId: 'user_admin_001',
    adminName: 'System Admin',
    scheduledDate: '2026-09-12',
    scheduledTime: '02:00 PM',
    durationMinutes: 45,
    status: 'SCHEDULED',
    resultEnabled: true,
    questions: [
      {
        id: 'iq_001',
        questionNumber: 1,
        title: 'HashMap vs ConcurrentHashMap Internal Architecture',
        category: 'Java',
        difficulty: 'Intermediate',
        expectedAnswer: 'HashMap is non-synchronized and permits one null key and multiple null values. In multi-threaded environments, concurrent modifications can cause race conditions or infinite loops. ConcurrentHashMap is thread-safe using CAS and node-level synchronized locks.',
      },
      {
        id: 'iq_003',
        questionNumber: 2,
        title: 'Spring Boot Dependency Injection & Bean Lifecycle',
        category: 'Spring Boot',
        difficulty: 'Intermediate',
        expectedAnswer: 'Spring Boot achieves Inversion of Control via the IoC container. Dependencies are injected via constructor injection, setter, or field injection. The Bean lifecycle follows scanning, instantiation, property population, aware callbacks, and init methods.',
      },
      {
        id: 'iq_005',
        questionNumber: 3,
        title: 'React Virtual DOM Reconciliation & Fiber Architecture',
        category: 'React',
        difficulty: 'Intermediate',
        expectedAnswer: 'React creates an in-memory Virtual DOM representation of the UI. When state or props change, React diffs the trees via Reconciliation. React Fiber introduced incremental rendering.',
      },
      {
        id: 'iq_007',
        questionNumber: 4,
        title: 'Handling a Production Outage and System Incident (STAR Method)',
        category: 'Behavioral',
        difficulty: 'Beginner',
        expectedAnswer: 'Use STAR structure: Situation describes incident severity; Task explains triage role; Action outlines step-by-step containment; Result summarizes recovery and guardrails.',
      },
    ],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'sch_int_002',
    title: 'Distributed Systems & Cloud Architecture Round',
    candidateId: 'user_cand_004',
    candidateName: 'Marcus Chen',
    candidateEmail: 'marcus.chen@alumni.mit.edu',
    adminId: 'user_admin_001',
    adminName: 'System Admin',
    scheduledDate: '2026-09-14',
    scheduledTime: '11:00 AM',
    durationMinutes: 60,
    status: 'COMPLETED',
    resultEnabled: true,
    totalScore: 88,
    adminNotes: 'Excellent understanding of JVM internals and distributed consensus. Clear communication and thoughtful trade-off analysis.',
    completedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    questions: [
      {
        id: 'iq_002',
        questionNumber: 1,
        title: 'JVM Garbage Collection & Memory Generations',
        category: 'Java',
        difficulty: 'Advanced',
        expectedAnswer: 'JVM heap memory is split into Young (Eden, S0, S1) and Old generations. Minor GC handles young objects, while Major GC collects Tenured. G1 divides heap into regions.',
        candidateAnswer: 'JVM divides heap into Eden and Survivor spaces for Young gen, and Tenured for Old gen. Minor GC handles young objects, while Full GC handles tenured objects. Modern collectors like G1 divide heap into regions and prioritize regions with the most garbage.',
        score: 90,
        feedback: 'Strong grasp of Young vs Old generational collectors and G1 regional layout.',
        answeredAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        id: 'iq_008',
        questionNumber: 2,
        title: 'High-Throughput Distributed Rate Limiting System Design',
        category: 'System Design',
        difficulty: 'Advanced',
        expectedAnswer: 'A distributed rate limiter can be built using algorithms like Token Bucket or Sliding Window with Redis Lua scripts ensuring atomicity.',
        candidateAnswer: 'I would use Redis with sliding window log or token bucket algorithms, executed atomically via Lua scripts to avoid race conditions across stateless API containers. Edge caching and local fallback caches keep latency low.',
        score: 86,
        feedback: 'Clear explanation of Redis atomic Lua execution and algorithm trade-offs.',
        answeredAt: new Date(Date.now() - 12 * 3600000 + 600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const defaultSecureAssessments: SecureAssessmentSession[] = [
  {
    id: 'sec_sess_sample_01',
    candidateId: 'user_cand_003',
    candidateName: 'Priya Sharma',
    candidateEmail: 'priya.sharma@tech.edu',
    assessmentType: 'MCQ_PRACTICE',
    assessmentId: 'mcq_sess_002',
    assessmentTitle: 'Spring Boot & React Architecture MCQ Test',
    status: 'TERMINATED',
    startedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    durationMinutes: 30,
    endedAt: new Date(Date.now() - 2 * 3600000 + 420000).toISOString(),
    terminationReason: 'CHEATING_DETECTED',
    violations: [
      {
        id: 'viol_001',
        type: 'TAB_SWITCH',
        timestamp: new Date(Date.now() - 2 * 3600000 + 420000).toISOString(),
        details: 'Candidate switched active browser tab during active assessment session.',
      },
    ],
    progress: { answers: { mcq_1: 1, mcq_2: 0 } },
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000 + 420000).toISOString(),
  },
  {
    id: 'sec_sess_sample_02',
    candidateId: 'user_cand_004',
    candidateName: 'Marcus Chen',
    candidateEmail: 'marcus.chen@alumni.mit.edu',
    assessmentType: 'CODING_INTERVIEW',
    assessmentId: 'two-sum',
    assessmentTitle: 'Two Sum Algorithmic Challenge',
    status: 'TERMINATED',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    durationMinutes: 45,
    endedAt: new Date(Date.now() - 86400000 + 580000).toISOString(),
    terminationReason: 'CHEATING_DETECTED',
    violations: [
      {
        id: 'viol_002',
        type: 'FULLSCREEN_EXIT',
        timestamp: new Date(Date.now() - 86400000 + 580000).toISOString(),
        details: 'Candidate exited secure fullscreen mode without authorization.',
      },
    ],
    progress: { code: 'class Solution { ... }', language: 'Java' },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 + 580000).toISOString(),
  },
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
        if (parsed.users && parsed.mcqQuestions) {
          const salt = bcrypt.genSaltSync(10);
          const demoPasswordHash = bcrypt.hashSync('Pass@12345', salt);

          parsed.users = parsed.users.filter((u: User) => u.id !== 'user_admin_002' && u.email !== 'sarah.admin@interviewai.com');

          const fallbackAdmin = parsed.users.find((u: User) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN');
          if (fallbackAdmin) {
            for (const u of parsed.users) {
              if (u.adminId === 'user_admin_002') {
                u.adminId = fallbackAdmin.id;
              }
            }
          }

          for (const u of parsed.users) {
            if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') {
              if (!u.adminCode) {
                if (u.id === 'user_admin_001') u.adminCode = 'ADMIN-SYS1';
                else {
                  const prefix = (u.name || 'ADM').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ADM');
                  u.adminCode = `ADMIN-${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
                }
              }
            }
          }

          if (!parsed.users.some((u: User) => u.id === 'user_cand_003')) {
            parsed.users.push({
              id: 'user_cand_003',
              name: 'Priya Sharma',
              email: 'priya.sharma@tech.edu',
              passwordHash: demoPasswordHash,
              role: 'USER',
              adminId: 'user_admin_002',
              college: 'Georgia Institute of Technology',
              education: 'B.S. in Computer Science',
              skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
              preferredJobRole: 'Frontend / Full Stack Engineer',
              profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              linkedInUrl: 'https://linkedin.com/in/priya-sharma-dev',
              gitHubUrl: 'https://github.com/priyasharma',
              xpPoints: 1650,
              level: 'Intermediate',
              currentStreak: 7,
              emailVerified: true,
              isOnLeaderboard: true,
              createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }

          if (!parsed.users.some((u: User) => u.id === 'user_cand_004')) {
            parsed.users.push({
              id: 'user_cand_004',
              name: 'Marcus Chen',
              email: 'marcus.chen@alumni.mit.edu',
              passwordHash: demoPasswordHash,
              role: 'USER',
              adminId: 'user_admin_001',
              college: 'Massachusetts Institute of Technology (MIT)',
              education: 'M.S. in Electrical Engineering & Computer Science',
              skills: ['Java', 'Distributed Systems', 'Kafka', 'Kubernetes', 'Docker'],
              preferredJobRole: 'Distributed Cloud Systems Engineer',
              profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
              linkedInUrl: 'https://linkedin.com/in/marcus-chen-cloud',
              gitHubUrl: 'https://github.com/marcuschen',
              xpPoints: 2200,
              level: 'Advanced',
              currentStreak: 11,
              emailVerified: true,
              isOnLeaderboard: true,
              createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }

          for (const u of parsed.users) {
            if (u.role === 'USER' && !u.adminId) {
              u.adminId = 'user_admin_001';
            }
          }

          if (!parsed.interviewQuestions || parsed.interviewQuestions.length === 0) {
            parsed.interviewQuestions = defaultInterviewQuestions;
          }
          if (!parsed.scheduledInterviews || parsed.scheduledInterviews.length === 0) {
            parsed.scheduledInterviews = defaultScheduledInterviews;
          }
          if (!parsed.secureAssessments || parsed.secureAssessments.length === 0) {
            parsed.secureAssessments = defaultSecureAssessments;
          }
          if (!parsed.xpSettings) {
            parsed.xpSettings = { ...defaultXpSettings };
          }

          fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
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
    const demoPasswordHash = bcrypt.hashSync('Pass@12345', salt);

    const adminUser: User = {
      id: 'user_admin_001',
      name: 'System Admin',
      email: 'admin@interviewai.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      adminCode: 'ADMIN-SYS1',
      college: 'Indian Institute of Technology (IIT)',
      education: 'M.Tech in Computer Science',
      skills: ['Java', 'Spring Boot', 'System Design', 'React', 'MongoDB', 'Cloud Architecture'],
      preferredJobRole: 'Lead Software Architect',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      linkedInUrl: 'https://linkedin.com/in/admin-interviewai',
      gitHubUrl: 'https://github.com/admin-interviewai',
      xpPoints: 3450,
      level: 'Interview Master',
      currentStreak: 12,
      emailVerified: true,
      isOnLeaderboard: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const demoUser: User = {
      id: 'user_demo_002',
      name: 'Alex Johnson',
      email: 'alex@university.edu',
      passwordHash: demoPasswordHash,
      role: 'USER',
      adminId: 'user_admin_001',
      college: 'Stanford University / State Tech Institute',
      education: 'B.Tech in Computer Science & Engineering',
      skills: ['Java', 'Spring Boot', 'React', 'TypeScript', 'SQL', 'MongoDB', 'REST APIs'],
      preferredJobRole: 'Java Full Stack Developer',
      profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      linkedInUrl: 'https://linkedin.com/in/alex-johnson-dev',
      gitHubUrl: 'https://github.com/alexjohnson',
      xpPoints: 1250,
      level: 'Intermediate',
      currentStreak: 5,
      emailVerified: true,
      isOnLeaderboard: true,
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialDb: DatabaseSchema = {
      users: [adminUser, demoUser],
      resumes: [],
      jobDescriptions: [],
      interviews: defaultScheduledInterviews as any,
      performances: [],
      achievements: [],
      mcqQuestions: [],
      interviewQuestions: defaultInterviewQuestions,
      scheduledInterviews: defaultScheduledInterviews,
      notifications: [],
      secureAssessments: defaultSecureAssessments,
      xpTransactions: [],
      xpSettings: { ...defaultXpSettings },
      aiRequestsCount: 14,
    };

    return initialDb;
  }

  public populateAssignedAdmin(user: User): User {
    if (user.role === 'USER' || user.role === 'CANDIDATE') {
      const targetAdminId = user.adminId || 'user_admin_001';
      const admin = this.data.users.find((u) => u.id === targetAdminId);
      return {
        ...user,
        adminId: targetAdminId,
        assignedAdmin: admin
          ? {
              id: admin.id,
              name: admin.name,
              email: admin.email,
              adminCode: admin.adminCode || 'ADMIN-SYS1',
            }
          : {
              id: 'user_admin_001',
              name: 'System Admin',
              email: 'admin@interviewai.com',
              adminCode: 'ADMIN-SYS1',
            },
      };
    }
    return user;
  }

  public generateUniqueAdminCode(namePrefix?: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let attempts = 0;
    while (attempts < 100) {
      attempts++;
      let suffix = '';
      for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const rawPrefix = (namePrefix || 'ADM').trim().toUpperCase().replace(/[^A-Z]/g, '');
      const prefix = rawPrefix.length >= 3 ? rawPrefix.substring(0, 3) : 'ADM';
      const code = `ADMIN-${prefix}${suffix}`.substring(0, 10);
      const exists = this.data?.users ? this.data.users.some((u) => u.adminCode?.toUpperCase() === code.toUpperCase()) : false;
      if (!exists) {
        return code;
      }
    }
    return `ADMIN-${Date.now().toString().slice(-4)}`;
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
      .map((a) => ({
        code: a.adminCode!,
        name: a.name,
        email: a.email,
        id: a.id,
        role: a.role,
      }));
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
    if (adminId) {
      return populated.filter((c) => c.adminId === adminId);
    }
    return populated;
  }

  // --- Core Write: Directly syncs newly created users to MongoDB Atlas ---
  public createUser(user: User): User {
    if (user.role === 'USER' && !user.adminId) {
      user.adminId = 'user_admin_001';
    }
    this.data.users.push(user);
    this.save();

    // Direct Mongoose write to MongoDB Atlas
    UserModel.create(user)
      .then(() => {
        console.log(`[MongoDB Atlas] User successfully synced: ${user.email}`);
      })
      .catch((err: any) => {
        console.error(`[MongoDB Atlas] Error syncing user:`, err?.message);
      });

    return this.populateAssignedAdmin(user);
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();

    // Direct Mongoose update to MongoDB Atlas
    UserModel.findOneAndUpdate({ id }, updates).catch((err: any) => {
      console.error(`[MongoDB Atlas] Error updating user:`, err?.message);
    });

    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const userIdx = this.data.users.findIndex((u) => u.id === id);
    if (userIdx === -1) return false;
    this.data.users.splice(userIdx, 1);
    this.save();

    UserModel.deleteOne({ id }).catch((err: any) => {
      console.error(`[MongoDB Atlas] Error deleting user:`, err?.message);
    });

    return true;
  }

  // --- Resumes ---
  public getResumesByUser(userId: string): ResumeDocument[] {
    return this.data.resumes.filter((r) => r.userId === userId);
  }

  public saveResume(resume: ResumeDocument): ResumeDocument {
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
    const idx = this.data.resumes.findIndex((r) => r.id === id && r.userId === userId);
    if (idx === -1) return false;
    this.data.resumes.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Job Descriptions ---
  public getJobDescriptionsByUser(userId: string): JobDescriptionDocument[] {
    return this.data.jobDescriptions.filter((j) => j.userId === userId);
  }

  public saveJobDescription(job: JobDescriptionDocument): JobDescriptionDocument {
    this.data.jobDescriptions.unshift(job);
    this.save();
    return job;
  }

  // --- Interviews ---
  public getInterviewsByUser(userId: string): InterviewSession[] {
    return this.data.interviews.filter((i) => i.userId === userId);
  }

  public getInterviewById(id: string): InterviewSession | undefined {
    return this.data.interviews.find((i) => i.id === id);
  }

  public saveInterview(interview: InterviewSession): InterviewSession {
    const idx = this.data.interviews.findIndex((i) => i.id === interview.id);
    if (idx >= 0) {
      this.data.interviews[idx] = interview;
    } else {
      this.data.interviews.unshift(interview);
    }
    this.save();
    return interview;
  }

  // --- Achievements & XP ---
  public getAchievementsByUser(userId: string): AchievementItem[] {
    return this.data.achievements.filter((a) => a.userId === userId);
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

  // --- MCQ ---
  public getMcqCategories(): string[] {
    const set = new Set(this.data.mcqQuestions.map((q) => q.category));
    return Array.from(set);
  }

  public getMcqQuestionsByCategory(category?: string): McqQuestion[] {
    if (!category || category.toLowerCase() === 'all') {
      return this.data.mcqQuestions;
    }
    return this.data.mcqQuestions.filter((q) => q.category.toLowerCase() === category.toLowerCase());
  }

  // --- Notifications ---
  public getNotificationsByUser(userId: string): NotificationItem[] {
    return this.data.notifications.filter((n) => n.userId === userId);
  }

  public addNotification(notif: NotificationItem): NotificationItem {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  // --- AI metrics ---
  public incrementAiRequests(): number {
    this.data.aiRequestsCount = (this.data.aiRequestsCount || 0) + 1;
    this.save();
    return this.data.aiRequestsCount;
  }

  public getAiRequestsCount(): number {
    return this.data.aiRequestsCount || 0;
  }

  // --- Question Bank ---
  public getInterviewQuestions(adminId?: string): InterviewQuestion[] {
    if (!this.data.interviewQuestions) {
      this.data.interviewQuestions = [...defaultInterviewQuestions];
      this.save();
    }
    if (adminId) {
      return this.data.interviewQuestions.filter((q) => !q.adminId || q.adminId === adminId);
    }
    return this.data.interviewQuestions;
  }
}

export const db = new DatabaseService();