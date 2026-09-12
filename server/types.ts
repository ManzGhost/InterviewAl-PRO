export type UserRole = 'ADMIN' | 'CANDIDATE' | 'SUPER_ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  adminCode?: string; // Unique Administrator Code for ADMIN and SUPER_ADMIN
  adminId?: string; // Assigned Administrator ID for candidates (USER role)
  assignedAdmin?: {
    id: string;
    name: string;
    email: string;
    adminCode?: string;
  };
  college?: string;
  education?: string;
  experienceYears?: number | string;
  skills: string[];
  preferredJobRole?: string;
  profileImage?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  xpPoints: number;
  level: string; // 'Beginner' | 'Intermediate' | 'Advanced' | 'Interview Master'
  currentStreak: number;
  emailVerified: boolean;
  isOnLeaderboard: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeDocument {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileContentText?: string;
  extractedSkills: string[];
  resumeScore: number;
  atsScore: number;
  strongSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  weakAreas: string[];
  grammarSuggestions: string[];
  projectSuggestions: string[];
  extractedData?: {
    name?: string;
    education?: string;
    experience?: string;
    projects?: string[];
    technologies?: string[];
  };
  createdAt: string;
}

export interface JobDescriptionDocument {
  id: string;
  userId: string;
  companyName: string;
  jobRole: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequirements?: string;
  technologies?: string[];
  createdAt: string;
}

export type InterviewType = 'Technical Interview' | 'HR Interview' | 'Coding Interview' | 'Behavioral Interview' | 'Mixed Interview';
export type InterviewDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type InterviewMode = 'Text' | 'Voice' | 'Live Video AI';

export interface VideoDetectionMetrics {
  eyeContactPercentage: number;
  postureStatus: 'Upright & Centered' | 'Slight Tilt' | 'Needs Re-centering';
  facialExpression: 'Confident' | 'Attentive' | 'Smiling' | 'Neutral' | 'Nervous';
  confidenceScore: number;
  feedback: string;
}

export interface QuestionItem {
  id: string;
  interviewId: string;
  questionNumber: number;
  question: string;
  category: string;
  difficulty: InterviewDifficulty;
  userAnswer?: string;
  aiEvaluation?: AnswerEvaluation;
  timeSpentSeconds?: number;
  videoMetrics?: VideoDetectionMetrics;
  answeredAt?: string;
}

export interface AnswerEvaluation {
  overallScore: number; // 0 to 10
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  completenessScore: number;
  problemSolvingScore: number;
  relevanceScore: number;
  strengths: string[];
  weaknesses: string[];
  incorrectConcepts?: string[];
  suggestions: string[];
  betterAnswerExample: string;
  starEvaluation?: {
    situation: string;
    task: string;
    action: string;
    result: string;
    feedback: string;
  };
}

export interface InterviewSession {
  id: string;
  userId: string;
  interviewType: InterviewType;
  jobRole: string;
  companyName?: string;
  difficulty: InterviewDifficulty;
  mode: InterviewMode;
  totalQuestions: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'TERMINATED';
  currentQuestionIndex: number;
  questions: QuestionItem[];
  startedAt: string;
  completedAt?: string;
  terminationReason?: string;
  violations?: ViolationRecord[];
  overallScore?: number; // 0 to 100
  categoryScores?: {
    technicalKnowledge: number;
    communication: number;
    confidence: number;
    problemSolving: number;
    hrSkills: number;
  };
  summaryReport?: {
    strengths: string[];
    weaknesses: string[];
    aiSuggestions: string[];
    learningRoadmap: Array<{ day: string; topic: string; details: string }>;
    cheatSheet: Array<{ topic: string; concepts: string[]; quickNotes: string }>;
  };
}

export interface PerformanceRecord {
  id: string;
  userId: string;
  topic: string;
  score: number; // 0 - 100
  interviewId: string;
  createdAt: string;
}

export interface AchievementItem {
  id: string;
  userId: string;
  badge: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface McqQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ACHIEVEMENT' | 'STREAK' | 'PERFORMANCE' | 'REMINDER';
  read: boolean;
  createdAt: string;
}

export interface InterviewQuestion {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  expectedAnswer: string;
  adminId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ScheduledInterviewQuestion {
  id: string;
  questionNumber: number;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  expectedAnswer: string;
  candidateAnswer?: string;
  score?: number; // 0 - 100
  feedback?: string;
  answeredAt?: string;
}

export interface ScheduledInterview {
  id: string;
  title: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  adminId: string;
  adminName: string;
  scheduledDate: string; // e.g. "2026-09-15"
  scheduledTime: string; // e.g. "10:30 AM"
  durationMinutes: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'TERMINATED';
  questions: ScheduledInterviewQuestion[];
  totalScore?: number;
  adminNotes?: string;
  resultEnabled: boolean; // Controls whether the candidate can view the result
  terminationReason?: string;
  violations?: ViolationRecord[];
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export type AssessmentType = 'AI_INTERVIEW' | 'MCQ_PRACTICE' | 'CODING_INTERVIEW' | 'ASSIGNMENT_INTERVIEW';

export type AssessmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'TERMINATED' | 'CANCELLED';

export type ViolationType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'PAGE_HIDDEN'
  | 'FULLSCREEN_EXIT'
  | 'UNAUTHORIZED_NAVIGATION'
  | 'CONCURRENT_ASSESSMENT_ATTEMPT'
  | 'DEVTOOLS_OPEN';

export interface ViolationRecord {
  id: string;
  type: ViolationType;
  timestamp: string;
  details: string;
}

export interface SecureAssessmentSession {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  assessmentType: AssessmentType;
  assessmentId: string;
  assessmentTitle: string;
  status: AssessmentStatus;
  startedAt: string;
  durationMinutes: number;
  remainingSeconds?: number;
  endedAt?: string;
  terminationReason?: string;
  violations: ViolationRecord[];
  progress?: any;
  createdAt: string;
  updatedAt: string;
}

export type XpTransactionType =
  | 'INTERVIEW_SCHEDULING'
  | 'AI_INTERVIEW'
  | 'MCQ_PRACTICE'
  | 'CODING_INTERVIEW'
  | 'ASSIGNMENT_INTERVIEW'
  | 'XP_PURCHASE'
  | 'BONUS_EARNED'
  | 'ADMIN_ADJUSTMENT'
  | 'INTERVIEW_CANCELLED_REFUND'
  | 'SYSTEM_ERROR_REFUND'
  | 'XP_DEDUCTED'
  | 'XP_REFUNDED';

export type XpAction = 'DEDUCTION' | 'ADDITION';

export interface XpTransaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  type: XpTransactionType;
  action: XpAction;
  amount: number; // Negative for deduction (-10), positive for addition (+100)
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string; // Interview ID, Assessment ID, or Payment ID for deduplication
  description: string;
  reason?: string;
  status?: 'COMPLETED' | 'REFUNDED';
  originalTransactionId?: string;
  createdAt: string;
}

export interface XpSettings {
  adminScheduleInterviewCost: number; // default: 10 XP
  aiInterviewCost: number;             // default: 10 XP
  mcqPracticeCost: number;             // default: 5 XP
  codingInterviewCost: number;         // default: 10 XP
  assignmentInterviewCost: number;     // default: 10 XP
  initialUserXp: number;               // default: 100 XP
}

