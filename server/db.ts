import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
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
    candidateId: 'user_demo_002', // Alex Johnson
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
    candidateId: 'user_cand_004', // Marcus Chen
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
          const adminPasswordHash = bcrypt.hashSync('Admin@12345', salt);
          const demoPasswordHash = bcrypt.hashSync('Pass@12345', salt);

          // Filter out removed administrator Sarah Miller if present
          parsed.users = parsed.users.filter((u: User) => u.id !== 'user_admin_002' && u.email !== 'sarah.admin@interviewai.com');

          // Ensure any candidates assigned to user_admin_002 are reassigned to primary admin
          const fallbackAdmin = parsed.users.find((u: User) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN');
          if (fallbackAdmin) {
            for (const u of parsed.users) {
              if (u.adminId === 'user_admin_002') {
                u.adminId = fallbackAdmin.id;
              }
            }
          }

          // Ensure every administrator has a unique adminCode
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

          // Ensure Priya Sharma (assigned to Sarah Miller) exists
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

          // Ensure Marcus Chen (assigned to System Admin) exists
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

          // Ensure every candidate strictly has an assigned Administrator
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
          if (!Array.isArray(parsed.xpTransactions) || parsed.xpTransactions.length === 0) {
            const adminUser = parsed.users.find((u: any) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') || parsed.users[0];
            const candUser = parsed.users.find((u: any) => u.role === 'USER' || u.role === 'CANDIDATE') || parsed.users[0];
            parsed.xpTransactions = [
              {
                id: 'xp_txn_init_001',
                userId: adminUser ? adminUser.id : 'user_admin_001',
                userEmail: adminUser ? adminUser.email : 'admin@interviewai.io',
                userName: adminUser ? adminUser.name : 'System Administrator',
                userRole: adminUser ? adminUser.role : 'ADMIN',
                type: 'BONUS_EARNED',
                action: 'ADDITION',
                amount: adminUser?.xpPoints || 1000,
                balanceBefore: 0,
                balanceAfter: adminUser?.xpPoints || 1000,
                referenceId: 'init_admin_credit',
                description: 'Administrator Initial Provisioning Balance',
                createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
              },
              {
                id: 'xp_txn_init_002',
                userId: candUser ? candUser.id : 'user_cand_001',
                userEmail: candUser ? candUser.email : 'candidate@interviewai.io',
                userName: candUser ? candUser.name : 'Candidate User',
                userRole: candUser ? candUser.role : 'CANDIDATE',
                type: 'BONUS_EARNED',
                action: 'ADDITION',
                amount: candUser?.xpPoints || 100,
                balanceBefore: 0,
                balanceAfter: candUser?.xpPoints || 100,
                referenceId: 'init_welcome_credit',
                description: 'Welcome Bonus Starter Pack',
                createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
              },
            ];
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

    const candidatePriya: User = {
      id: 'user_cand_003',
      name: 'Priya Sharma',
      email: 'priya.sharma@tech.edu',
      passwordHash: demoPasswordHash,
      role: 'USER',
      adminId: 'user_admin_001',
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
    };

    const candidateMarcus: User = {
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
    };

    const seedMCQs: McqQuestion[] = [
      {
        id: 'mcq_1',
        category: 'Java',
        question: 'Which principle in Java allows an object to take many forms?',
        options: ['Encapsulation', 'Polymorphism', 'Inheritance', 'Abstraction'],
        correctAnswerIndex: 1,
        explanation: 'Polymorphism allows methods to do different things based on the object it is acting upon (method overloading & overriding).',
        difficulty: 'Beginner',
      },
      {
        id: 'mcq_2',
        category: 'Java',
        question: 'What is the purpose of the volatile keyword in Java?',
        options: [
          'Prevents a variable from being modified',
          'Ensures visibility of variable changes across multiple threads',
          'Allocates variable memory in the PermGen area',
          'Forces variable to serialize across network calls'
        ],
        correctAnswerIndex: 1,
        explanation: 'The volatile keyword in Java guarantees that value changes to a variable are written directly to and read from main memory, avoiding thread caching issues.',
        difficulty: 'Intermediate',
      },
      {
        id: 'mcq_3',
        category: 'Spring Boot',
        question: 'Which annotation is used to auto-wire dependencies into a Spring bean?',
        options: ['@Injectable', '@Autowired', '@Component', '@Service'],
        correctAnswerIndex: 1,
        explanation: '@Autowired is Spring framework annotation for constructor, field, or setter dependency injection.',
        difficulty: 'Beginner',
      },
      {
        id: 'mcq_4',
        category: 'Spring Boot',
        question: 'What is the default embedded web server in Spring Boot Web starter?',
        options: ['Jetty', 'Undertow', 'Tomcat', 'Netty'],
        correctAnswerIndex: 2,
        explanation: 'Spring Boot uses Apache Tomcat as the default embedded servlet container.',
        difficulty: 'Beginner',
      },
      {
        id: 'mcq_5',
        category: 'React',
        question: 'In React, what hook is recommended for handling side-effects like data fetching?',
        options: ['useState', 'useEffect', 'useMemo', 'useRef'],
        correctAnswerIndex: 1,
        explanation: 'useEffect is specifically designed to perform side effects in functional components.',
        difficulty: 'Beginner',
      },
      {
        id: 'mcq_6',
        category: 'MongoDB',
        question: 'Which command creates an index in MongoDB on a field?',
        options: ['db.collection.makeIndex()', 'db.collection.createIndex()', 'db.collection.setIndex()', 'db.collection.addIndex()'],
        correctAnswerIndex: 1,
        explanation: 'createIndex({ fieldName: 1 }) is the standard method to create an index in MongoDB collections.',
        difficulty: 'Intermediate',
      },
      {
        id: 'mcq_7',
        category: 'DBMS',
        question: 'Which ACID property guarantees that all database transactions are either fully completed or completely rolled back?',
        options: ['Consistency', 'Atomicity', 'Isolation', 'Durability'],
        correctAnswerIndex: 1,
        explanation: 'Atomicity ensures all-or-nothing execution of database transactions.',
        difficulty: 'Beginner',
      },
      {
        id: 'mcq_8',
        category: 'DSA',
        question: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
        correctAnswerIndex: 2,
        explanation: 'A balanced BST reduces the search space by half at each step, yielding O(log n) time complexity.',
        difficulty: 'Beginner',
      },
      {
        id: 'mcq_9',
        category: 'OOP',
        question: 'Restricting direct access to some of an object components and bundling data with methods is known as:',
        options: ['Inheritance', 'Encapsulation', 'Polymorphism', 'Overloading'],
        correctAnswerIndex: 1,
        explanation: 'Encapsulation keeps fields private and provides controlled access via getters and setters.',
        difficulty: 'Beginner',
      },
      {
        id: 'mcq_10',
        category: 'SQL',
        question: 'Which SQL clause is used to filter records resulting from a GROUP BY clause?',
        options: ['WHERE', 'HAVING', 'FILTER', 'ORDER BY'],
        correctAnswerIndex: 1,
        explanation: 'HAVING filters aggregated groups, whereas WHERE filters individual rows before grouping.',
        difficulty: 'Intermediate',
      }
    ];

    const seedAchievements: AchievementItem[] = [
      {
        id: 'ach_1',
        userId: 'user_demo_002',
        badge: '🏆',
        title: 'First Interview',
        description: 'Successfully completed your first AI mock interview session!',
        icon: 'Trophy',
        earnedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: 'ach_2',
        userId: 'user_demo_002',
        badge: '🔥',
        title: '5 Day Streak',
        description: 'Maintained an active interview practice streak for 5 consecutive days.',
        icon: 'Flame',
        earnedAt: new Date().toISOString(),
      },
      {
        id: 'ach_3',
        userId: 'user_demo_002',
        badge: '⭐',
        title: 'Score Above 80',
        description: 'Attained a stellar score above 80% on a full technical interview.',
        icon: 'Star',
        earnedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      }
    ];

    const seedInterviews: InterviewSession[] = [
      {
        id: 'int_sample_001',
        userId: 'user_demo_002',
        interviewType: 'Technical Interview',
        jobRole: 'Java Full Stack Developer',
        companyName: 'Google',
        difficulty: 'Intermediate',
        mode: 'Text',
        totalQuestions: 5,
        status: 'COMPLETED',
        currentQuestionIndex: 5,
        startedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        completedAt: new Date(Date.now() - 3 * 86400000 + 1200000).toISOString(),
        overallScore: 84,
        categoryScores: {
          technicalKnowledge: 88,
          communication: 82,
          confidence: 80,
          problemSolving: 85,
          hrSkills: 85,
        },
        questions: [
          {
            id: 'q_1',
            interviewId: 'int_sample_001',
            questionNumber: 1,
            question: 'Can you explain how Spring Boot dependency injection and inversion of control work under the hood?',
            category: 'Spring Boot',
            difficulty: 'Intermediate',
            userAnswer: 'Spring Boot uses the ApplicationContext to manage bean lifecycles. When classes are annotated with @Component, @Service, or @Repository, Spring scans for them. It injects dependencies using constructor injection or @Autowired via reflection, achieving inversion of control.',
            aiEvaluation: {
              overallScore: 9,
              technicalScore: 9,
              communicationScore: 8.5,
              confidenceScore: 9,
              completenessScore: 9,
              problemSolvingScore: 8.5,
              relevanceScore: 9.5,
              strengths: ['Accurate explanation of ApplicationContext and component scanning', 'Highlighted constructor injection best practice'],
              weaknesses: ['Could mention circular dependency resolution mechanisms'],
              suggestions: ['Mention BeanFactory vs ApplicationContext distinction for advanced questions'],
              betterAnswerExample: 'Spring Inversion of Control delegates object lifecycle and dependency management to the IoC container (BeanFactory/ApplicationContext). During startup, Spring performs classpath scanning for stereotype annotations, creates bean definitions, instantiates singleton beans via reflection, and resolves dependencies through constructor or field injection.',
            },
            timeSpentSeconds: 95,
            answeredAt: new Date(Date.now() - 3 * 86400000 + 120000).toISOString(),
          }
        ],
        summaryReport: {
          strengths: ['Strong Java & Spring Boot Core Knowledge', 'Clear articulation of architectural concepts', 'Confident delivery and structured problem framing'],
          weaknesses: ['Spring Security JWT validation deep-dive', 'Microservices resilience patterns (Circuit Breakers)'],
          aiSuggestions: ['Practice designing distributed transaction fallbacks with Sagas', 'Review multi-threaded race conditions in high-throughput APIs'],
          learningRoadmap: [
            { day: 'Day 1', topic: 'Spring Security Filter Chain & JWT', details: 'Deep dive into OncePerRequestFilter, SecurityFilterChain bean, and token parsing.' },
            { day: 'Day 2', topic: 'Database Indexing & Query Optimizations', details: 'Analyze execution plans and composite indexing in MongoDB/PostgreSQL.' },
            { day: 'Day 3', topic: 'Microservices Communication & Resilience4j', details: 'Configure circuit breakers, fallbacks, and rate limiters.' },
            { day: 'Day 4', topic: 'React Concurrency & Custom Hooks', details: 'Build memoized hooks with TypeScript and manage clean side-effect cleanups.' },
            { day: 'Day 5', topic: 'System Design: Distributed Cache', details: 'Design Redis cluster caching patterns, cache-aside, write-through, and eviction policies.' }
          ],
          cheatSheet: [
            { topic: 'Spring Boot', concepts: ['IoC Container', 'Bean Scopes (Singleton, Prototype)', 'Spring Boot Auto-configuration'], quickNotes: '@SpringBootApplication combines @Configuration, @EnableAutoConfiguration, and @ComponentScan.' },
            { topic: 'Java Concurrency', concepts: ['CompletableFuture', 'ConcurrentHashMap', 'Virtual Threads (Java 21)'], quickNotes: 'Virtual threads provide lightweight concurrency with near zero OS thread overhead.' },
            { topic: 'React & State', concepts: ['Re-render cycles', 'useCallback / useMemo memoization', 'Server-Sent Events / WebSockets'], quickNotes: 'Always keep dependency arrays minimal and stable to prevent infinite loops.' }
          ]
        }
      }
    ];

    const seedPerformances: PerformanceRecord[] = [
      { id: 'perf_1', userId: 'user_demo_002', topic: 'Java', score: 88, interviewId: 'int_sample_001', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 'perf_2', userId: 'user_demo_002', topic: 'Spring Boot', score: 85, interviewId: 'int_sample_001', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 'perf_3', userId: 'user_demo_002', topic: 'React', score: 78, interviewId: 'int_sample_001', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 'perf_4', userId: 'user_demo_002', topic: 'MongoDB', score: 80, interviewId: 'int_sample_001', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 'perf_5', userId: 'user_demo_002', topic: 'DSA', score: 72, interviewId: 'int_sample_001', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 'perf_6', userId: 'user_demo_002', topic: 'OOP', score: 90, interviewId: 'int_sample_001', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 'perf_7', userId: 'user_demo_002', topic: 'HR', score: 86, interviewId: 'int_sample_001', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    ];

    const seedNotifications: NotificationItem[] = [
      {
        id: 'notif_1',
        userId: 'user_demo_002',
        title: 'Daily Practice Streak Active!',
        message: "You're on a 5-day streak! Practice today to keep your momentum going toward the 7-day badge.",
        type: 'STREAK',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif_2',
        userId: 'user_demo_002',
        title: 'New Achievement Unlocked: Score Above 80',
        message: 'Congratulations! You earned a Star badge for your Google Java Full Stack interview.',
        type: 'ACHIEVEMENT',
        read: true,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      }
    ];

    const initialDb: DatabaseSchema = {
      users: [adminUser, demoUser, candidatePriya, candidateMarcus],
      resumes: [],
      jobDescriptions: [],
      interviews: seedInterviews,
      performances: seedPerformances,
      achievements: seedAchievements,
      mcqQuestions: seedMCQs,
      interviewQuestions: defaultInterviewQuestions,
      scheduledInterviews: defaultScheduledInterviews,
      notifications: seedNotifications,
      secureAssessments: defaultSecureAssessments,
      xpTransactions: [],
      xpSettings: { ...defaultXpSettings },
      aiRequestsCount: 14,
    };

    return initialDb;
  }

  // --- Users & Candidate-Administrator Relationship ---
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

  public reassignAllCandidates(
    fromAdminId: string,
    toAdminId: string
  ): { success: boolean; reassignedCount: number; message: string } {
    const targetAdmin = this.getUserById(toAdminId);
    if (!targetAdmin || (targetAdmin.role !== 'ADMIN' && targetAdmin.role !== 'SUPER_ADMIN')) {
      return {
        success: false,
        reassignedCount: 0,
        message: 'Target Administrator not found or lacks administrator privileges.',
      };
    }

    let count = 0;
    for (const u of this.data.users) {
      if ((u.role === 'USER' || u.role === 'CANDIDATE') && u.adminId === fromAdminId) {
        u.adminId = targetAdmin.id;
        u.updatedAt = new Date().toISOString();
        count++;

        this.addNotification({
          id: `notif_${Date.now()}_${count}`,
          userId: u.id,
          title: 'Administrator Reassigned',
          message: `Your designated Administrator portfolio has been updated to ${targetAdmin.name} (${targetAdmin.email}).`,
          type: 'REMINDER',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (count > 0) {
      this.save();
    }

    return {
      success: true,
      reassignedCount: count,
      message: `Successfully reassigned ${count} candidate(s) to ${targetAdmin.name} (${targetAdmin.email}).`,
    };
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

  public assignCandidateAdmin(
    candidateId: string,
    targetAdminId: string
  ): { success: boolean; message: string; candidate?: User; assignedAdmin?: { id: string; name: string; email: string } } {
    const candidateIdx = this.data.users.findIndex((u) => u.id === candidateId);
    if (candidateIdx === -1) {
      return { success: false, message: 'Candidate account not found.' };
    }

    const candidate = this.data.users[candidateIdx];
    if (candidate.role !== 'USER' && candidate.role !== 'CANDIDATE') {
      return { success: false, message: 'Only candidate accounts can be assigned to an Administrator.' };
    }

    const targetAdmin = this.data.users.find(
      (u) => u.id === targetAdminId && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
    );
    if (!targetAdmin) {
      return { success: false, message: 'Target Administrator not found or lacks administrator role.' };
    }

    candidate.adminId = targetAdmin.id;
    candidate.updatedAt = new Date().toISOString();
    this.save();

    // Add notification for the candidate
    this.addNotification({
      id: `notif_${Date.now()}`,
      userId: candidate.id,
      title: 'Administrator Assigned',
      message: `Your designated Administrator has been set to ${targetAdmin.name} (${targetAdmin.email}).`,
      type: 'REMINDER',
      read: false,
      createdAt: new Date().toISOString(),
    });

    const populatedCandidate = this.populateAssignedAdmin(candidate);

    return {
      success: true,
      message: `Candidate ${candidate.name} is now assigned to ${targetAdmin.name} (${targetAdmin.email}).`,
      candidate: populatedCandidate,
      assignedAdmin: {
        id: targetAdmin.id,
        name: targetAdmin.name,
        email: targetAdmin.email,
      },
    };
  }

  public createUser(user: User): User {
    if (user.role === 'USER' && !user.adminId) {
      user.adminId = 'user_admin_001';
    }
    this.data.users.push(user);
    this.save();
    return this.populateAssignedAdmin(user);
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.users[idx];
  }

  public permanentlyDeleteUserAndAllData(userId: string): {
    success: boolean;
    deletedUser?: User;
    deletedCounts: {
      resumes: number;
      jobDescriptions: number;
      interviews: number;
      performances: number;
      achievements: number;
      notifications: number;
    };
  } {
    const userIdx = this.data.users.findIndex((u) => u.id === userId);
    if (userIdx === -1) {
      return {
        success: false,
        deletedCounts: {
          resumes: 0,
          jobDescriptions: 0,
          interviews: 0,
          performances: 0,
          achievements: 0,
          notifications: 0,
        },
      };
    }

    const [deletedUser] = this.data.users.splice(userIdx, 1);

    const initialResumes = this.data.resumes.length;
    this.data.resumes = this.data.resumes.filter((r) => r.userId !== userId);
    const resumesDeleted = initialResumes - this.data.resumes.length;

    const initialJobDescs = this.data.jobDescriptions.length;
    this.data.jobDescriptions = this.data.jobDescriptions.filter((j) => j.userId !== userId);
    const jobDescsDeleted = initialJobDescs - this.data.jobDescriptions.length;

    const initialInterviews = this.data.interviews.length;
    this.data.interviews = this.data.interviews.filter((i) => i.userId !== userId);
    const interviewsDeleted = initialInterviews - this.data.interviews.length;

    const initialPerformances = this.data.performances.length;
    this.data.performances = this.data.performances.filter((p) => p.userId !== userId);
    const performancesDeleted = initialPerformances - this.data.performances.length;

    const initialAchievements = this.data.achievements.length;
    this.data.achievements = this.data.achievements.filter((a) => a.userId !== userId);
    const achievementsDeleted = initialAchievements - this.data.achievements.length;

    const initialNotifs = this.data.notifications.length;
    this.data.notifications = this.data.notifications.filter((n) => n.userId !== userId);
    const notifsDeleted = initialNotifs - this.data.notifications.length;

    // If Candidate account is deleted before interview starts: refund 100% XP to Administrator
    if (this.data.scheduledInterviews && Array.isArray(this.data.scheduledInterviews)) {
      for (const si of this.data.scheduledInterviews) {
        if (si.candidateId === userId && si.status === 'SCHEDULED') {
          si.status = 'CANCELLED';
          si.cancelledAt = new Date().toISOString();
          si.cancelReason = `Candidate account (${deletedUser.name}) was deleted before interview started`;

          if (si.adminId) {
            const deductionTxn = this.getXpTransactionByReference(si.adminId, si.id, 'DEDUCTION');
            const refundCost = deductionTxn ? Math.abs(deductionTxn.amount) : (this.data.xpSettings?.adminScheduleInterviewCost || 10);
            this.refundXpWithTransaction({
              userId: si.adminId,
              amount: refundCost,
              type: 'INTERVIEW_CANCELLED_REFUND',
              referenceId: si.id,
              description: `Interview Cancelled Refund (+${refundCost} XP): Candidate ${deletedUser.name} deleted`,
              reason: 'Candidate account deleted before interview started',
              originalTransactionId: deductionTxn?.id,
            });
          }
        }
      }
    }

    // If an administrator is deleted, reassign any assigned candidates to primary system admin so candidates are not orphaned
    if (deletedUser.role === 'ADMIN' || deletedUser.role === 'SUPER_ADMIN') {
      const fallbackAdmin = this.data.users.find(
        (u) => (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') && u.id !== userId
      );
      const fallbackId = fallbackAdmin ? fallbackAdmin.id : 'user_admin_001';
      for (const u of this.data.users) {
        if (u.role === 'USER' && u.adminId === userId) {
          u.adminId = fallbackId;
          u.updatedAt = new Date().toISOString();
        }
      }
    }

    this.save();

    return {
      success: true,
      deletedUser,
      deletedCounts: {
        resumes: resumesDeleted,
        jobDescriptions: jobDescsDeleted,
        interviews: interviewsDeleted,
        performances: performancesDeleted,
        achievements: achievementsDeleted,
        notifications: notifsDeleted,
      },
    };
  }

  public deleteUser(id: string): boolean {
    const result = this.permanentlyDeleteUserAndAllData(id);
    return result.success;
  }

  // --- Resumes ---
  public getResumesByUser(userId: string): ResumeDocument[] {
    return this.data.resumes.filter((r) => r.userId === userId);
  }

  public getResumeById(id: string): ResumeDocument | undefined {
    return this.data.resumes.find((r) => r.id === id);
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

  public getJobDescriptionById(id: string): JobDescriptionDocument | undefined {
    return this.data.jobDescriptions.find((j) => j.id === id);
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

  public getAllInterviews(): InterviewSession[] {
    return this.data.interviews;
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

  public deleteInterview(id: string): boolean {
    const initialLen = this.data.interviews.length;
    this.data.interviews = this.data.interviews.filter((i) => i.id !== id);
    if (this.data.interviews.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public clearInterviewsByUser(userId: string): number {
    const initialLen = this.data.interviews.length;
    this.data.interviews = this.data.interviews.filter((i) => i.userId !== userId);
    const removedCount = initialLen - this.data.interviews.length;
    if (removedCount > 0) {
      this.save();
    }
    return removedCount;
  }

  // --- Performance ---
  public getPerformancesByUser(userId: string): PerformanceRecord[] {
    return this.data.performances.filter((p) => p.userId === userId);
  }

  public addPerformance(perf: PerformanceRecord): PerformanceRecord {
    this.data.performances.push(perf);
    this.save();
    return perf;
  }

  // --- Achievements & XP ---
  public getAchievementsByUser(userId: string): AchievementItem[] {
    return this.data.achievements.filter((a) => a.userId === userId);
  }

  public addAchievement(item: AchievementItem): AchievementItem {
    this.data.achievements.unshift(item);
    this.save();
    return item;
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

  // --- XP Settings & Transactions ---
  public getXpSettings(): XpSettings {
    if (!this.data.xpSettings) {
      this.data.xpSettings = { ...defaultXpSettings };
      this.save();
    }
    return this.data.xpSettings;
  }

  public updateXpSettings(updates: Partial<XpSettings>): XpSettings {
    const current = this.getXpSettings();
    this.data.xpSettings = {
      adminScheduleInterviewCost:
        typeof updates.adminScheduleInterviewCost === 'number'
          ? Math.max(0, updates.adminScheduleInterviewCost)
          : current.adminScheduleInterviewCost,
      aiInterviewCost:
        typeof updates.aiInterviewCost === 'number'
          ? Math.max(0, updates.aiInterviewCost)
          : current.aiInterviewCost,
      mcqPracticeCost:
        typeof updates.mcqPracticeCost === 'number'
          ? Math.max(0, updates.mcqPracticeCost)
          : current.mcqPracticeCost,
      codingInterviewCost:
        typeof updates.codingInterviewCost === 'number'
          ? Math.max(0, updates.codingInterviewCost)
          : current.codingInterviewCost,
      assignmentInterviewCost:
        typeof updates.assignmentInterviewCost === 'number'
          ? Math.max(0, updates.assignmentInterviewCost)
          : current.assignmentInterviewCost,
      initialUserXp:
        typeof updates.initialUserXp === 'number'
          ? Math.max(0, updates.initialUserXp)
          : current.initialUserXp,
    };
    this.save();
    return this.data.xpSettings;
  }

  public getXpTransactions(userId?: string): XpTransaction[] {
    if (!Array.isArray(this.data.xpTransactions)) {
      this.data.xpTransactions = [];
    }
    if (!userId) {
      return [...this.data.xpTransactions];
    }
    return this.data.xpTransactions.filter((t) => t.userId === userId);
  }

  public getXpTransactionByReference(userId: string, referenceId: string, action: XpAction = 'DEDUCTION'): XpTransaction | undefined {
    if (!Array.isArray(this.data.xpTransactions)) {
      this.data.xpTransactions = [];
      return undefined;
    }
    return this.data.xpTransactions.find((t) => t.userId === userId && t.referenceId === referenceId && t.action === action);
  }

  public deductXpWithTransaction(params: {
    userId: string;
    amount: number;
    type: XpTransactionType;
    referenceId?: string;
    description: string;
  }): {
    success: boolean;
    alreadyDeducted?: boolean;
    error?: string;
    currentXp: number;
    requiredXp: number;
    balanceAfter: number;
    transaction?: XpTransaction;
  } {
    const user = this.getUserById(params.userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found.',
        currentXp: 0,
        requiredXp: params.amount,
        balanceAfter: 0,
      };
    }

    const currentXp = user.xpPoints || 0;
    const cost = Math.max(0, params.amount);

    // 1. Idempotency Check (Prevent duplicate deduction on refresh, double-clicks, or retries)
    if (params.referenceId) {
      const existing = this.getXpTransactionByReference(user.id, params.referenceId, 'DEDUCTION');
      if (existing) {
        return {
          success: true,
          alreadyDeducted: true,
          currentXp,
          requiredXp: cost,
          balanceAfter: currentXp,
          transaction: existing,
        };
      }
    }

    // 2. Strict Balance Validation
    if (currentXp < cost) {
      return {
        success: false,
        error: 'Insufficient XP balance.',
        currentXp,
        requiredXp: cost,
        balanceAfter: currentXp,
      };
    }

    // 3. Deduct atomically
    const balanceAfter = currentXp - cost;
    let newLevel = 'Beginner';
    if (balanceAfter >= 3000) newLevel = 'Interview Master';
    else if (balanceAfter >= 1800) newLevel = 'Advanced';
    else if (balanceAfter >= 800) newLevel = 'Intermediate';

    this.updateUser(user.id, { xpPoints: balanceAfter, level: newLevel });

    // 4. Create Transaction Record
    const transaction: XpTransaction = {
      id: `xp_txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      type: params.type,
      action: 'DEDUCTION',
      amount: -cost,
      balanceBefore: currentXp,
      balanceAfter,
      referenceId: params.referenceId,
      description: params.description,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(this.data.xpTransactions)) {
      this.data.xpTransactions = [];
    }
    this.data.xpTransactions.unshift(transaction);
    this.save();

    return {
      success: true,
      currentXp,
      requiredXp: cost,
      balanceAfter,
      transaction,
    };
  }

  public refundXpWithTransaction(params: {
    userId: string;
    amount: number;
    type: XpTransactionType;
    referenceId?: string;
    description: string;
    reason?: string;
    originalTransactionId?: string;
  }): {
    success: boolean;
    alreadyRefunded?: boolean;
    error?: string;
    currentXp: number;
    balanceAfter: number;
    transaction?: XpTransaction;
  } {
    const user = this.getUserById(params.userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found.',
        currentXp: 0,
        balanceAfter: 0,
      };
    }

    if (!Array.isArray(this.data.xpTransactions)) {
      this.data.xpTransactions = [];
    }

    // 1. Duplicate Transaction Protection: Never process a refund more than once
    if (params.referenceId) {
      const existingRefund = this.data.xpTransactions.find(
        (t) =>
          t.userId === params.userId &&
          t.referenceId === params.referenceId &&
          t.action === 'ADDITION' &&
          (t.type === 'INTERVIEW_CANCELLED_REFUND' ||
            t.type === 'SYSTEM_ERROR_REFUND' ||
            t.type === 'XP_REFUNDED' ||
            t.description.toLowerCase().includes('refund'))
      );

      if (existingRefund) {
        return {
          success: true,
          alreadyRefunded: true,
          currentXp: user.xpPoints || 0,
          balanceAfter: user.xpPoints || 0,
          transaction: existingRefund,
        };
      }
    }

    if (params.originalTransactionId) {
      const existingRefund = this.data.xpTransactions.find(
        (t) => t.originalTransactionId === params.originalTransactionId
      );
      if (existingRefund) {
        return {
          success: true,
          alreadyRefunded: true,
          currentXp: user.xpPoints || 0,
          balanceAfter: user.xpPoints || 0,
          transaction: existingRefund,
        };
      }
    }

    const currentXp = user.xpPoints || 0;
    const refundAmount = Math.max(0, params.amount);
    const balanceAfter = currentXp + refundAmount;

    let newLevel = 'Beginner';
    if (balanceAfter >= 3000) newLevel = 'Interview Master';
    else if (balanceAfter >= 1800) newLevel = 'Advanced';
    else if (balanceAfter >= 800) newLevel = 'Intermediate';

    this.updateUser(user.id, { xpPoints: balanceAfter, level: newLevel });

    // Mark original deduction as refunded if found
    let originalDeduction: XpTransaction | undefined;
    if (params.originalTransactionId) {
      originalDeduction = this.data.xpTransactions.find((t) => t.id === params.originalTransactionId);
    } else if (params.referenceId) {
      originalDeduction = this.data.xpTransactions.find(
        (t) => t.userId === params.userId && t.referenceId === params.referenceId && t.action === 'DEDUCTION'
      );
    }
    if (originalDeduction) {
      originalDeduction.status = 'REFUNDED';
    }

    const transaction: XpTransaction = {
      id: `xp_txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      type: params.type,
      action: 'ADDITION',
      amount: refundAmount,
      balanceBefore: currentXp,
      balanceAfter,
      referenceId: params.referenceId,
      description: params.description,
      reason: params.reason || 'XP Refund processed by system',
      status: 'COMPLETED',
      originalTransactionId: params.originalTransactionId || originalDeduction?.id,
      createdAt: new Date().toISOString(),
    };

    this.data.xpTransactions.unshift(transaction);
    this.save();

    return {
      success: true,
      currentXp,
      balanceAfter,
      transaction,
    };
  }

  public awardXpWithTransaction(params: {
    userId: string;
    points: number;
    type?: XpTransactionType;
    referenceId?: string;
    description: string;
  }): {
    xp: number;
    level: string;
    leveledUp: boolean;
    transaction: XpTransaction;
  } {
    const user = this.getUserById(params.userId);
    const oldXp = user ? (user.xpPoints || 0) : 0;
    const result = this.awardXp(params.userId, params.points);

    const transaction: XpTransaction = {
      id: `xp_txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: params.userId,
      userEmail: user?.email || '',
      userName: user?.name || '',
      userRole: user?.role || 'USER',
      type: params.type || 'BONUS_EARNED',
      action: 'ADDITION',
      amount: params.points,
      balanceBefore: oldXp,
      balanceAfter: result.xp,
      referenceId: params.referenceId,
      description: params.description,
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(this.data.xpTransactions)) {
      this.data.xpTransactions = [];
    }
    this.data.xpTransactions.unshift(transaction);
    this.save();

    return {
      ...result,
      transaction,
    };
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

  public addMcqQuestion(q: McqQuestion): McqQuestion {
    this.data.mcqQuestions.push(q);
    this.save();
    return q;
  }

  public deleteMcqQuestion(id: string): boolean {
    const idx = this.data.mcqQuestions.findIndex((q) => q.id === id);
    if (idx === -1) return false;
    this.data.mcqQuestions.splice(idx, 1);
    this.save();
    return true;
  }

  public updateMcqQuestion(id: string, updates: Partial<McqQuestion>): McqQuestion | null {
    const idx = this.data.mcqQuestions.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    this.data.mcqQuestions[idx] = { ...this.data.mcqQuestions[idx], ...updates };
    this.save();
    return this.data.mcqQuestions[idx];
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

  public markNotificationRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (!notif) return false;
    notif.read = true;
    this.save();
    return true;
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

  // --- Question Bank (Interview Questions) ---
  public getInterviewQuestions(adminId?: string): InterviewQuestion[] {
    if (!this.data.interviewQuestions) {
      this.data.interviewQuestions = [...defaultInterviewQuestions];
      this.save();
    }
    // If adminId is provided, include admin's custom questions plus default platform questions
    if (adminId) {
      return this.data.interviewQuestions.filter((q) => !q.adminId || q.adminId === adminId);
    }
    return this.data.interviewQuestions;
  }

  public getInterviewQuestionById(id: string): InterviewQuestion | undefined {
    return (this.data.interviewQuestions || []).find((q) => q.id === id);
  }

  public addInterviewQuestion(data: {
    title: string;
    category: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    expectedAnswer: string;
    adminId?: string;
  }): InterviewQuestion {
    if (!this.data.interviewQuestions) {
      this.data.interviewQuestions = [...defaultInterviewQuestions];
    }
    const newQ: InterviewQuestion = {
      id: `iq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim(),
      category: data.category.trim() || 'General Technical',
      difficulty: data.difficulty || 'Intermediate',
      expectedAnswer: data.expectedAnswer.trim(),
      adminId: data.adminId,
      createdAt: new Date().toISOString(),
    };
    this.data.interviewQuestions.unshift(newQ);
    this.save();
    return newQ;
  }

  public updateInterviewQuestion(id: string, updates: Partial<InterviewQuestion>): InterviewQuestion | null {
    if (!this.data.interviewQuestions) return null;
    const idx = this.data.interviewQuestions.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    this.data.interviewQuestions[idx] = {
      ...this.data.interviewQuestions[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.interviewQuestions[idx];
  }

  public deleteInterviewQuestion(id: string): boolean {
    if (!this.data.interviewQuestions) return false;
    const idx = this.data.interviewQuestions.findIndex((q) => q.id === id);
    if (idx === -1) return false;
    this.data.interviewQuestions.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Scheduled Interviews ---
  public getScheduledInterviews(adminId?: string): ScheduledInterview[] {
    if (!this.data.scheduledInterviews) {
      this.data.scheduledInterviews = [...defaultScheduledInterviews];
      this.save();
    }
    if (adminId) {
      return this.data.scheduledInterviews.filter((si) => si.adminId === adminId);
    }
    return this.data.scheduledInterviews;
  }

  public getScheduledInterviewsByCandidate(candidateId: string): ScheduledInterview[] {
    if (!this.data.scheduledInterviews) {
      this.data.scheduledInterviews = [...defaultScheduledInterviews];
      this.save();
    }
    return this.data.scheduledInterviews.filter((si) => si.candidateId === candidateId);
  }

  public getScheduledInterviewById(id: string): ScheduledInterview | undefined {
    if (!this.data.scheduledInterviews) {
      this.data.scheduledInterviews = [...defaultScheduledInterviews];
      this.save();
    }
    return this.data.scheduledInterviews.find((si) => si.id === id);
  }

  public createScheduledInterview(params: {
    title: string;
    candidateId: string;
    adminId: string;
    adminName: string;
    scheduledDate: string;
    scheduledTime: string;
    durationMinutes?: number;
    questionIds: string[];
    resultEnabled?: boolean;
    adminNotes?: string;
  }): ScheduledInterview {
    if (!this.data.scheduledInterviews) {
      this.data.scheduledInterviews = [...defaultScheduledInterviews];
    }
    const candidate = this.getUserById(params.candidateId);
    const candidateName = candidate?.name || 'Candidate';
    const candidateEmail = candidate?.email || '';

    // Retrieve selected questions from the question bank
    const questionsPool = this.getInterviewQuestions();
    const selectedQuestions: ScheduledInterviewQuestion[] = [];

    params.questionIds.forEach((qId, idx) => {
      const found = questionsPool.find((q) => q.id === qId);
      if (found) {
        selectedQuestions.push({
          id: found.id,
          questionNumber: idx + 1,
          title: found.title,
          category: found.category,
          difficulty: found.difficulty,
          expectedAnswer: found.expectedAnswer,
        });
      }
    });

    const newScheduledInterview: ScheduledInterview = {
      id: `sch_int_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: params.title.trim() || 'Technical Interview Session',
      candidateId: params.candidateId,
      candidateName,
      candidateEmail,
      adminId: params.adminId,
      adminName: params.adminName,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      durationMinutes: params.durationMinutes || 45,
      status: 'SCHEDULED',
      questions: selectedQuestions,
      resultEnabled: params.resultEnabled !== undefined ? params.resultEnabled : true,
      adminNotes: params.adminNotes,
      createdAt: new Date().toISOString(),
    };

    this.data.scheduledInterviews.unshift(newScheduledInterview);

    // Deduct candidate XP when administrator schedules interview slot
    const SCHEDULED_XP_COST = 100;
    const xpResult = this.deductXp(params.candidateId, SCHEDULED_XP_COST);

    // Notify candidate
    this.addNotification({
      id: `notif_${Date.now()}_sched`,
      userId: params.candidateId,
      title: 'Interview Scheduled (-100 XP) ⚡',
      message: `Administrator ${params.adminName} has scheduled "${newScheduledInterview.title}" for ${params.scheduledDate} at ${params.scheduledTime}. 100 XP was deducted for this scheduled interview slot. Current balance: ${xpResult.xp} XP (${xpResult.level}).`,
      type: 'REMINDER',
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.save();
    return newScheduledInterview;
  }

  public updateScheduledInterview(id: string, updates: Partial<ScheduledInterview>): ScheduledInterview | null {
    if (!this.data.scheduledInterviews) return null;
    const idx = this.data.scheduledInterviews.findIndex((si) => si.id === id);
    if (idx === -1) return null;
    this.data.scheduledInterviews[idx] = {
      ...this.data.scheduledInterviews[idx],
      ...updates,
    };
    this.save();
    return this.data.scheduledInterviews[idx];
  }

  public cancelScheduledInterview(
    id: string,
    cancelledByUserId: string,
    reason?: string
  ): {
    success: boolean;
    interview?: ScheduledInterview;
    refunded: boolean;
    refundAmount: number;
    error?: string;
    canRefund?: boolean;
    transaction?: XpTransaction;
  } {
    if (!this.data.scheduledInterviews) {
      this.data.scheduledInterviews = [...defaultScheduledInterviews];
    }
    const interview = this.data.scheduledInterviews.find((si) => si.id === id);
    if (!interview) {
      return { success: false, refunded: false, refundAmount: 0, error: 'Scheduled interview not found.' };
    }

    // Rules:
    // Candidate has already started:
    if (interview.status === 'IN_PROGRESS') {
      return {
        success: false,
        refunded: false,
        refundAmount: 0,
        canRefund: false,
        error: 'Cancellation not allowed: The candidate has already started the interview.',
      };
    }
    // Already completed:
    if (interview.status === 'COMPLETED') {
      return {
        success: false,
        refunded: false,
        refundAmount: 0,
        canRefund: false,
        error: 'Cancellation not allowed: The interview has already been completed.',
      };
    }
    // Terminated due to cheating / violation:
    if (interview.status === 'TERMINATED') {
      return {
        success: false,
        refunded: false,
        refundAmount: 0,
        canRefund: false,
        error: 'Cancellation not allowed: The interview was terminated due to anti-cheating violations.',
      };
    }
    // Already cancelled:
    if (interview.status === 'CANCELLED') {
      return {
        success: false,
        refunded: false,
        refundAmount: 0,
        canRefund: false,
        error: 'This interview is already cancelled.',
      };
    }

    // Must be in SCHEDULED status
    interview.status = 'CANCELLED';
    interview.cancelledAt = new Date().toISOString();
    interview.cancelReason = reason || 'Cancelled by Administrator before candidate started';

    // Refund 100% XP to administrator
    const adminToRefund = interview.adminId || cancelledByUserId;
    const deductionTxn = this.getXpTransactionByReference(adminToRefund, interview.id, 'DEDUCTION');
    const cost = deductionTxn ? Math.abs(deductionTxn.amount) : (this.data.xpSettings?.adminScheduleInterviewCost || 10);

    const refundRes = this.refundXpWithTransaction({
      userId: adminToRefund,
      amount: cost,
      type: 'INTERVIEW_CANCELLED_REFUND',
      referenceId: interview.id,
      description: `Interview Cancelled Refund (+${cost} XP): ${interview.title}`,
      reason: reason || 'Administrator cancelled interview before candidate started',
      originalTransactionId: deductionTxn?.id,
    });

    this.save();

    return {
      success: true,
      interview,
      refunded: refundRes.success,
      refundAmount: cost,
      transaction: refundRes.transaction,
    };
  }

  public deleteScheduledInterview(id: string): boolean {
    if (!this.data.scheduledInterviews) return false;
    const idx = this.data.scheduledInterviews.findIndex((si) => si.id === id);
    if (idx === -1) return false;
    this.data.scheduledInterviews.splice(idx, 1);
    this.save();
    return true;
  }

  public toggleResultVisibility(id: string, enabled: boolean): ScheduledInterview | null {
    if (!this.data.scheduledInterviews) return null;
    const interview = this.data.scheduledInterviews.find((si) => si.id === id);
    if (!interview) return null;
    interview.resultEnabled = enabled;
    this.save();
    return interview;
  }

  public submitCandidateInterviewAnswer(
    interviewId: string,
    questionId: string,
    answer: string
  ): boolean {
    if (!this.data.scheduledInterviews) return false;
    const interview = this.data.scheduledInterviews.find((si) => si.id === interviewId);
    if (!interview) return false;
    const question = interview.questions.find((q) => q.id === questionId);
    if (!question) return false;

    question.candidateAnswer = answer;
    question.answeredAt = new Date().toISOString();

    // Basic heuristic evaluation against expected answer keywords
    const candidateWords = answer.toLowerCase().split(/\W+/).filter(Boolean);
    const expectedWords = question.expectedAnswer.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const matchedCount = expectedWords.filter((w) => candidateWords.includes(w)).length;
    const ratio = expectedWords.length > 0 ? matchedCount / expectedWords.length : 0.8;
    const rawScore = Math.min(100, Math.max(50, Math.round(55 + ratio * 45)));

    question.score = rawScore;
    question.feedback =
      rawScore >= 85
        ? 'Excellent, precise technical answer covering key architectural concepts.'
        : rawScore >= 70
        ? 'Solid conceptual answer. Can be strengthened with deeper architectural details.'
        : 'Good effort. Review expected answer highlights to deepen technical completeness.';

    if (interview.status === 'SCHEDULED') {
      interview.status = 'IN_PROGRESS';
    }

    this.save();
    return true;
  }

  public finalizeCandidateScheduledInterview(interviewId: string): ScheduledInterview | null {
    if (!this.data.scheduledInterviews) return null;
    const interview = this.data.scheduledInterviews.find((si) => si.id === interviewId);
    if (!interview) return null;

    interview.status = 'COMPLETED';
    interview.completedAt = new Date().toISOString();

    // Compute average score
    const scores = interview.questions.map((q) => q.score || 75);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
    interview.totalScore = avgScore;

    // Award XP to candidate
    const candidate = this.getUserById(interview.candidateId);
    if (candidate) {
      candidate.xpPoints = (candidate.xpPoints || 1000) + 150;
      candidate.currentStreak = (candidate.currentStreak || 1) + 1;
    }

    // Notify candidate
    this.addNotification({
      id: `notif_${Date.now()}`,
      userId: interview.candidateId,
      title: 'Interview Submitted Successfully',
      message: `You completed "${interview.title}". Your answers have been recorded for administrator review.`,
      type: 'PERFORMANCE',
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Notify admin
    this.addNotification({
      id: `notif_adm_${Date.now()}`,
      userId: interview.adminId,
      title: 'Candidate Completed Interview',
      message: `${interview.candidateName} completed "${interview.title}". Score: ${avgScore}/100.`,
      type: 'PERFORMANCE',
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.save();
    return interview;
  }

  // --- Secure Assessments & Anti-Cheating ---
  public getSecureAssessments(): SecureAssessmentSession[] {
    if (!this.data.secureAssessments) {
      this.data.secureAssessments = [...defaultSecureAssessments];
    }
    return this.data.secureAssessments;
  }

  public getSecureAssessmentById(id: string): SecureAssessmentSession | null {
    const all = this.getSecureAssessments();
    return all.find((s) => s.id === id || s.assessmentId === id) || null;
  }

  public getActiveAssessmentByCandidate(candidateId: string): SecureAssessmentSession | null {
    const all = this.getSecureAssessments();
    return all.find((s) => s.candidateId === candidateId && s.status === 'IN_PROGRESS') || null;
  }

  public startSecureAssessment(params: {
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    assessmentType: AssessmentType;
    assessmentId: string;
    assessmentTitle: string;
    durationMinutes?: number;
    initialProgress?: any;
  }): { session: SecureAssessmentSession; restored?: boolean; error?: string } {
    if (!this.data.secureAssessments) {
      this.data.secureAssessments = [...defaultSecureAssessments];
    }

    // Check if candidate already has an active assessment with a different ID
    const active = this.data.secureAssessments.find(
      (s) => s.candidateId === params.candidateId && s.status === 'IN_PROGRESS' && s.assessmentId !== params.assessmentId
    );
    if (active) {
      return {
        session: active,
        error: `Another assessment (${active.assessmentTitle}) is currently active. Zero-tolerance policy strictly forbids concurrent assessments.`,
      };
    }

    // Check if this assessment is already registered
    const existing = this.data.secureAssessments.find(
      (s) => s.candidateId === params.candidateId && s.assessmentId === params.assessmentId
    );

    if (existing) {
      if (existing.status === 'TERMINATED') {
        return {
          session: existing,
          error: 'This assessment session has been terminated due to detected unauthorized activity and cannot be resumed.',
        };
      }
      if (existing.status === 'IN_PROGRESS') {
        const elapsed = Math.floor((Date.now() - new Date(existing.startedAt).getTime()) / 1000);
        const totalDuration = (existing.durationMinutes || 45) * 60;
        existing.remainingSeconds = Math.max(0, totalDuration - elapsed);
        existing.updatedAt = new Date().toISOString();
        this.save();
        return { session: existing, restored: true };
      }
    }

    const duration = params.durationMinutes || 45;
    const now = new Date().toISOString();
    const newSession: SecureAssessmentSession = {
      id: `sec_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      candidateId: params.candidateId,
      candidateName: params.candidateName,
      candidateEmail: params.candidateEmail,
      assessmentType: params.assessmentType,
      assessmentId: params.assessmentId,
      assessmentTitle: params.assessmentTitle,
      status: 'IN_PROGRESS',
      startedAt: now,
      durationMinutes: duration,
      remainingSeconds: duration * 60,
      violations: [],
      progress: params.initialProgress || null,
      createdAt: now,
      updatedAt: now,
    };

    this.data.secureAssessments.unshift(newSession);

    // Update parent entities if relevant
    if (params.assessmentType === 'ASSIGNMENT_INTERVIEW') {
      const scheduled = this.getScheduledInterviewById(params.assessmentId);
      if (scheduled && scheduled.status === 'SCHEDULED') {
        this.updateScheduledInterview(params.assessmentId, {
          status: 'IN_PROGRESS',
          startedAt: now,
        });
      }
    } else if (params.assessmentType === 'AI_INTERVIEW') {
      const aiSess = this.getInterviewById(params.assessmentId);
      if (aiSess && aiSess.status !== 'TERMINATED') {
        aiSess.status = 'IN_PROGRESS';
      }
    }

    this.save();
    return { session: newSession };
  }

  public updateSecureAssessmentProgress(assessmentIdOrId: string, progress: any): SecureAssessmentSession | null {
    if (!this.data.secureAssessments) return null;
    const sess = this.data.secureAssessments.find(
      (s) => s.id === assessmentIdOrId || s.assessmentId === assessmentIdOrId
    );
    if (!sess) return null;
    if (sess.status === 'TERMINATED') return sess; // Locked!

    sess.progress = { ...sess.progress, ...progress };
    sess.updatedAt = new Date().toISOString();
    this.save();
    return sess;
  }

  public terminateSecureAssessment(params: {
    assessmentIdOrId: string;
    violationType: ViolationType;
    details: string;
    finalProgress?: any;
  }): SecureAssessmentSession | null {
    if (!this.data.secureAssessments) {
      this.data.secureAssessments = [...defaultSecureAssessments];
    }
    const sess = this.data.secureAssessments.find(
      (s) => s.id === params.assessmentIdOrId || s.assessmentId === params.assessmentIdOrId
    );
    if (!sess) return null;

    const now = new Date().toISOString();
    const violation: ViolationRecord = {
      id: `viol_${Date.now()}`,
      type: params.violationType,
      timestamp: now,
      details: params.details || 'Zero-tolerance unauthorized activity detected.',
    };

    sess.status = 'TERMINATED';
    sess.terminationReason = 'CHEATING_DETECTED';
    sess.endedAt = now;
    sess.remainingSeconds = 0;
    sess.violations.push(violation);
    if (params.finalProgress) {
      sess.progress = { ...sess.progress, ...params.finalProgress };
    }
    sess.updatedAt = now;

    // Update parent entities
    if (sess.assessmentType === 'ASSIGNMENT_INTERVIEW') {
      const scheduled = this.getScheduledInterviewById(sess.assessmentId);
      if (scheduled) {
        this.updateScheduledInterview(sess.assessmentId, {
          status: 'TERMINATED',
          terminationReason: 'CHEATING_DETECTED',
          violations: sess.violations,
          completedAt: now,
        });
      }
    } else if (sess.assessmentType === 'AI_INTERVIEW') {
      const aiSess = this.getInterviewById(sess.assessmentId);
      if (aiSess) {
        aiSess.status = 'TERMINATED';
        aiSess.terminationReason = 'CHEATING_DETECTED';
        aiSess.violations = sess.violations;
        aiSess.completedAt = now;
      }
    }

    // Security alert notification to Candidate
    this.addNotification({
      id: `notif_term_${Date.now()}`,
      userId: sess.candidateId,
      title: 'Assessment Terminated: Security Policy Violation',
      message: `Your ${sess.assessmentTitle} session has been permanently terminated. Reason: ${params.violationType.replace(/_/g, ' ')}.`,
      type: 'PERFORMANCE',
      read: false,
      createdAt: now,
    });

    // Alert candidate's assigned Administrator
    const candidate = this.getUserById(sess.candidateId);
    const adminId = candidate?.adminId || 'user_admin_001';
    this.addNotification({
      id: `notif_adm_term_${Date.now()}`,
      userId: adminId,
      title: 'Security Alert: Candidate Terminated for Cheating',
      message: `${sess.candidateName} was terminated from ${sess.assessmentTitle} (${sess.assessmentType}) due to ${params.violationType.replace(/_/g, ' ')}.`,
      type: 'PERFORMANCE',
      read: false,
      createdAt: now,
    });

    this.save();
    return sess;
  }

  public completeSecureAssessment(assessmentIdOrId: string, finalProgress?: any): SecureAssessmentSession | null {
    if (!this.data.secureAssessments) return null;
    const sess = this.data.secureAssessments.find(
      (s) => s.id === assessmentIdOrId || s.assessmentId === assessmentIdOrId
    );
    if (!sess) return null;
    if (sess.status === 'TERMINATED') return sess;

    const now = new Date().toISOString();
    sess.status = 'COMPLETED';
    sess.endedAt = now;
    sess.remainingSeconds = 0;
    if (finalProgress) {
      sess.progress = { ...sess.progress, ...finalProgress };
    }
    sess.updatedAt = now;

    if (sess.assessmentType === 'ASSIGNMENT_INTERVIEW') {
      const scheduled = this.getScheduledInterviewById(sess.assessmentId);
      if (scheduled && scheduled.status !== 'TERMINATED') {
        this.updateScheduledInterview(sess.assessmentId, {
          status: 'COMPLETED',
          completedAt: now,
        });
      }
    }

    this.save();
    return sess;
  }
}

export const db = new DatabaseService();
