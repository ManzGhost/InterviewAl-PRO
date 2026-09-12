import axios from 'axios';
import {
  AuthResponse,
  User,
  ResumeDocument,
  JobDescriptionDocument,
  InterviewSession,
  DashboardStats,
  PerformanceAnalyticsData,
  AchievementItem,
  NotificationItem,
  LeaderboardUser,
  InterviewQuestion,
  ScheduledInterview,
  SecureAssessmentSession,
  ViolationType,
  AssessmentType,
  XpSettings,
  XpTransaction,
} from '../types';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('interviewai_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('interviewai_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          if (res.data?.accessToken) {
            localStorage.setItem('interviewai_token', res.data.accessToken);
            apiClient.defaults.headers.common.Authorization = `Bearer ${res.data.accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('interviewai_token');
          localStorage.removeItem('interviewai_refresh_token');
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },
  register: async (data: any): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },
  validateAdminCode: async (code: string) => {
    const res = await apiClient.get<{
      success: boolean;
      valid: boolean;
      message: string;
      admin?: {
        id: string;
        name: string;
        email: string;
        adminCode: string;
        preferredJobRole?: string;
        college?: string;
      };
    }>('/auth/validate-admin-code', { params: { code } });
    return res.data;
  },
  getAdminCodes: async () => {
    const res = await apiClient.get<{
      success: boolean;
      codes: Array<{ code: string; name: string; email: string; id: string; role: string }>;
    }>('/auth/admin-codes');
    return res.data;
  },
  logout: async () => {
    return apiClient.post('/auth/logout');
  },
  forgotPassword: async (email: string) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (token: string, newPassword: string, email?: string) => {
    const res = await apiClient.post('/auth/reset-password', { token, newPassword, email });
    return res.data;
  },
  updateProfile: async (data: Partial<User>) => {
    return userService.updateProfile(data);
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    return userService.changePassword(data.currentPassword, data.newPassword);
  },
};

export const userService = {
  getProfile: async (): Promise<{ success: boolean; user: User }> => {
    const res = await apiClient.get('/users/profile');
    return res.data;
  },
  updateProfile: async (data: Partial<User>): Promise<{ success: boolean; user: User }> => {
    const res = await apiClient.put('/users/profile', data);
    return res.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await apiClient.put('/users/change-password', { currentPassword, newPassword });
    return res.data;
  },
  deleteAccount: async (password?: string) => {
    const res = await apiClient.delete<{
      success: boolean;
      message: string;
      deletedCounts?: {
        resumes: number;
        jobDescriptions: number;
        interviews: number;
        performances: number;
        achievements: number;
        notifications: number;
      };
    }>('/users/account', { data: { password } });
    return res.data;
  },
};

export const resumeService = {
  uploadResume: async (data: { fileName: string; fileText: string; fileSize?: number }) => {
    const res = await apiClient.post<{ success: boolean; resume: ResumeDocument }>('/resume/upload', data);
    return res.data;
  },
  getResumes: async () => {
    const res = await apiClient.get<{ success: boolean; resumes: ResumeDocument[] }>('/resume');
    return res.data;
  },
  getResumeById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; resume: ResumeDocument }>(`/resume/${id}`);
    return res.data;
  },
  deleteResume: async (id: string) => {
    const res = await apiClient.delete(`/resume/${id}`);
    return res.data;
  },
  reAnalyzeResume: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; resume: ResumeDocument }>(`/resume/${id}/analyze`);
    return res.data;
  },
};

export const jobDescService = {
  saveJobDescription: async (data: { companyName: string; jobRole: string; description: string }) => {
    const res = await apiClient.post<{ success: boolean; jobDescription: JobDescriptionDocument }>('/job-descriptions', data);
    return res.data;
  },
  getJobDescriptions: async () => {
    const res = await apiClient.get<{ success: boolean; jobDescriptions: JobDescriptionDocument[] }>('/job-descriptions');
    return res.data;
  },
  matchResume: async (jobId: string, resumeId?: string) => {
    const res = await apiClient.post(`/job-descriptions/${jobId}/match-resume`, { resumeId });
    return res.data;
  },
};

export const interviewService = {
  startInterview: async (params: {
    jobRole: string;
    interviewType: string;
    difficulty: string;
    companyName?: string;
    totalQuestions: number;
    mode: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; interview: InterviewSession }>('/interviews/start', params);
    return res.data;
  },
  getInterview: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; interview: InterviewSession }>(`/interviews/${id}`);
    return res.data;
  },
  submitAnswer: async (id: string, data: { questionId: string; userAnswer: string; timeSpentSeconds: number; skip?: boolean; videoMetrics?: any }) => {
    const res = await apiClient.post(`/interviews/${id}/answer`, data);
    return res.data;
  },
  completeInterview: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; interview: InterviewSession; xpDeducted?: number; remainingXp?: number; userLevel?: string; user?: any }>(`/interviews/${id}/complete`);
    return res.data;
  },
  getHistory: async () => {
    const res = await apiClient.get<{ success: boolean; interviews: InterviewSession[] }>('/interviews/history/all');
    return res.data;
  },
  deleteInterview: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/interviews/${id}`);
    return res.data;
  },
  clearAllHistory: async () => {
    const res = await apiClient.delete<{ success: boolean; message: string; removedCount: number }>('/interviews/history/clear');
    return res.data;
  },
};

export const dashboardService = {
  getStats: async () => {
    const res = await apiClient.get<{ success: boolean; stats: DashboardStats }>('/dashboard/stats');
    return res.data;
  },
  getPerformance: async () => {
    const res = await apiClient.get<{ success: boolean } & PerformanceAnalyticsData>('/dashboard/performance');
    return res.data;
  },
};

export const mcqService = {
  getCategories: async () => {
    const res = await apiClient.get<{ success: boolean; categories: string[] }>('/mcq/categories');
    return res.data;
  },
  getQuestions: async (category?: string) => {
    const res = await apiClient.get<{ success: boolean; questions: any[] }>('/mcq/questions', { params: { category } });
    return res.data;
  },
  addQuestion: async (data: {
    category: string;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
    difficulty?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; question: any }>('/mcq/questions', data);
    return res.data;
  },
  submitTest: async (answers: Array<{ questionId: string; selectedOptionIndex: number }>) => {
    const res = await apiClient.post('/mcq/submit', { answers });
    return res.data;
  },
};

export const aiService = {
  reviewCode: async (params: { problemTitle: string; problemDescription: string; language: string; code: string }) => {
    const res = await apiClient.post('/ai/code-review', params);
    return res.data;
  },
  getRoadmap: async (role?: string, weakTopics?: string[]) => {
    const res = await apiClient.get('/ai/learning-roadmap', {
      params: { role, weakTopics: weakTopics?.join(',') },
    });
    return res.data;
  },
  getCheatSheet: async (role?: string) => {
    const res = await apiClient.get('/ai/cheat-sheet', { params: { role } });
    return res.data;
  },
  generateCodingProblem: async (params?: { topic?: string; difficulty?: string }) => {
    const res = await apiClient.post('/ai/generate-coding-problem', params || {});
    return res.data;
  },
  chat: async (params: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    systemInstruction?: string;
    model?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      reply: string;
      modelUsed: string;
      timestamp: string;
    }>('/ai/chat', params);
    return res.data;
  },
};

export const gamificationService = {
  getLeaderboard: async () => {
    const res = await apiClient.get<{ success: boolean; leaderboard: LeaderboardUser[]; currentUser?: any }>('/leaderboard');
    return res.data;
  },
  toggleLeaderboard: async (isOnLeaderboard: boolean) => {
    const res = await apiClient.post('/leaderboard/toggle', { isOnLeaderboard });
    return res.data;
  },
  getAchievements: async () => {
    const res = await apiClient.get<{ success: boolean; achievements: AchievementItem[] }>('/achievements');
    return res.data;
  },
  getNotifications: async () => {
    const res = await apiClient.get<{ success: boolean; notifications: NotificationItem[] }>('/notifications');
    return res.data;
  },
  markNotificationRead: async (id: string) => {
    const res = await apiClient.post(`/notifications/${id}/read`);
    return res.data;
  },
  buyXp: async (data: {
    xp: number;
    title?: string;
    price?: string;
    paymentMethod?: string;
    cardLast4?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      xp: number;
      level: string;
      leveledUp: boolean;
      user: any;
      transactionId?: string;
      paymentMethod?: string;
      amount?: string;
      timestamp?: string;
      clearingLatency?: string;
      settlementNetwork?: string;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
    }>('/xp/buy', data);
    return res.data;
  },
};

export const paymentService = {
  getRazorpayKey: async () => {
    const res = await apiClient.get<{ success: boolean; key_id: string; configured: boolean }>('/razorpay-key');
    return res.data;
  },
  createOrder: async (data: {
    amountInRupees?: number;
    amountInPaise?: number;
    amount?: number;
    xp: number;
    title: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      order_id: string;
      order: any;
      amount: number;
      currency: string;
      key_id: string;
      receipt: string;
      message?: string;
    }>('/create-order', data);
    return res.data;
  },
  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    xp: number;
    title?: string;
    amountInRupees?: number;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      xp: number;
      level: string;
      leveledUp: boolean;
      user: any;
      transactionId: string;
      paymentMethod: string;
      amount: string;
      timestamp: string;
      razorpayPaymentId: string;
      razorpayOrderId: string;
      clearingLatency?: string;
      settlementNetwork?: string;
    }>('/verify-payment', data);
    return res.data;
  },
};

export const adminService = {
  getDashboard: async () => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },
  getStats: async () => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },
  getPortfolio: async () => {
    const res = await apiClient.get<{
      success: boolean;
      admin: User;
      count: number;
      candidates: User[];
    }>('/admin/portfolio');
    return res.data;
  },
  getAdministrators: async () => {
    const res = await apiClient.get<{ success: boolean; administrators: User[] }>('/admin/administrators');
    return res.data;
  },
  getMyCandidates: async () => {
    const res = await apiClient.get<{
      success: boolean;
      adminId: string;
      adminName: string;
      count: number;
      candidates: User[];
    }>('/admin/my-candidates');
    return res.data;
  },
  getUsers: async (params?: { adminId?: string; role?: string; search?: string }) => {
    const res = await apiClient.get<{
      success: boolean;
      isSuperAdmin?: boolean;
      currentAdminId?: string;
      administrators?: User[];
      totalCount?: number;
      users: User[];
    }>('/admin/users', { params });
    return res.data;
  },
  getCandidateById: async (id: string) => {
    const res = await apiClient.get<{
      success: boolean;
      candidate: User;
      resumes: any[];
      interviews: any[];
      performance: any[];
    }>(`/admin/candidates/${id}`);
    return res.data;
  },
  assignCandidateAdmin: async (candidateId: string, adminId: string) => {
    const res = await apiClient.put<{
      success: boolean;
      message: string;
      candidate: User;
      assignedAdmin: { id: string; name: string; email: string };
    }>(`/admin/candidates/${candidateId}/assign-admin`, { adminId });
    return res.data;
  },
  getInterviews: async () => {
    const res = await apiClient.get<{ success: boolean; interviews: InterviewSession[] }>('/admin/interviews');
    return res.data;
  },
  deleteUser: async (id: string) => {
    const res = await apiClient.delete(`/admin/users/${id}`);
    return res.data;
  },
  deleteAdministrator: async (id: string) => {
    const res = await apiClient.delete(`/admin/administrators/${id}`);
    return res.data;
  },
  reassignAllCandidates: async (fromAdminId: string, targetAdminId: string) => {
    const res = await apiClient.put<{
      success: boolean;
      reassignedCount: number;
      message: string;
    }>(`/admin/administrators/${fromAdminId}/reassign-candidates`, { targetAdminId });
    return res.data;
  },
  updateCandidate: async (id: string, data: any) => {
    const res = await apiClient.put<{
      success: boolean;
      message: string;
      candidate: User;
    }>(`/admin/candidates/${id}`, data);
    return res.data;
  },
  deleteCandidate: async (id: string) => {
    const res = await apiClient.delete<{
      success: boolean;
      message: string;
      deletedCandidate?: any;
    }>(`/admin/candidates/${id}`);
    return res.data;
  },
  createQuestion: async (data: any) => {
    const res = await apiClient.post('/admin/questions', data);
    return res.data;
  },
  updateQuestion: async (id: string, data: any) => {
    const res = await apiClient.put(`/admin/questions/${id}`, data);
    return res.data;
  },
  deleteQuestion: async (id: string) => {
    const res = await apiClient.delete(`/admin/questions/${id}`);
    return res.data;
  },
  // --- Question Bank (Interview Questions) ---
  getInterviewQuestions: async () => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      questions: InterviewQuestion[];
    }>('/admin/interview-questions');
    return res.data;
  },
  createInterviewQuestion: async (data: {
    title: string;
    category: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    expectedAnswer: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      question: InterviewQuestion;
    }>('/admin/interview-questions', data);
    return res.data;
  },
  updateInterviewQuestion: async (
    id: string,
    data: Partial<InterviewQuestion>
  ) => {
    const res = await apiClient.put<{
      success: boolean;
      message: string;
      question: InterviewQuestion;
    }>(`/admin/interview-questions/${id}`, data);
    return res.data;
  },
  deleteInterviewQuestion: async (id: string) => {
    const res = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/admin/interview-questions/${id}`);
    return res.data;
  },
  // --- Scheduled Interviews ---
  getScheduledInterviews: async () => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      interviews: ScheduledInterview[];
    }>('/admin/scheduled-interviews');
    return res.data;
  },
  getScheduledInterviewById: async (id: string) => {
    const res = await apiClient.get<{
      success: boolean;
      interview: ScheduledInterview;
    }>(`/admin/scheduled-interviews/${id}`);
    return res.data;
  },
  createScheduledInterview: async (data: {
    title: string;
    candidateId: string;
    candidateIds?: string[];
    scheduledDate: string;
    scheduledTime: string;
    durationMinutes?: number;
    questionIds: string[];
    resultEnabled?: boolean;
    adminNotes?: string;
    clientRequestId?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      interview?: ScheduledInterview;
      interviews?: ScheduledInterview[];
      xpDeducted?: number;
      currentXp?: number;
      alreadyDeducted?: boolean;
      transaction?: any;
    }>('/admin/scheduled-interviews', data);
    return res.data;
  },
  updateScheduledInterview: async (id: string, data: Partial<ScheduledInterview>) => {
    const res = await apiClient.put<{
      success: boolean;
      message: string;
      interview: ScheduledInterview;
    }>(`/admin/scheduled-interviews/${id}`, data);
    return res.data;
  },
  deleteScheduledInterview: async (id: string) => {
    const res = await apiClient.delete<{
      success: boolean;
      message: string;
      refundInfo?: { refunded: boolean; refundAmount: number; transaction?: any };
      currentXp?: number;
    }>(`/admin/scheduled-interviews/${id}`);
    return res.data;
  },
  cancelScheduledInterview: async (id: string, reason?: string) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      interview: ScheduledInterview;
      refunded: boolean;
      refundAmount: number;
      currentXp: number;
      transaction?: any;
    }>(`/admin/scheduled-interviews/${id}/cancel`, { reason });
    return res.data;
  },
  toggleResultVisibility: async (id: string, enabled: boolean) => {
    const res = await apiClient.patch<{
      success: boolean;
      message: string;
      interview: ScheduledInterview;
    }>(`/admin/scheduled-interviews/${id}/result-visibility`, { enabled });
    return res.data;
  },
};

export const candidateInterviewService = {
  getMyScheduledInterviews: async () => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      interviews: ScheduledInterview[];
    }>('/candidate/my-interviews');
    return res.data;
  },
  getScheduledInterviewById: async (id: string) => {
    const res = await apiClient.get<{
      success: boolean;
      interview: ScheduledInterview;
    }>(`/candidate/scheduled/${id}`);
    return res.data;
  },
  startScheduledInterview: async (id: string) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
    }>(`/candidate/scheduled/${id}/start`);
    return res.data;
  },
  submitAnswer: async (id: string, questionId: string, answer: string) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
    }>(`/candidate/scheduled/${id}/answer`, { questionId, answer });
    return res.data;
  },
  submitInterview: async (id: string) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      interview: ScheduledInterview;
    }>(`/candidate/scheduled/${id}/submit`);
    return res.data;
  },
};

export const candidateService = {
  getCandidates: async (adminId?: string) => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      candidates: User[];
      adminId: string;
      isSuperAdmin: boolean;
    }>('/candidates', { params: adminId ? { adminId } : {} });
    return res.data;
  },
  getCandidateById: async (id: string) => {
    const res = await apiClient.get<{
      success: boolean;
      candidate: User;
      resumes: any[];
      interviews: any[];
      performance: any[];
    }>(`/candidates/${id}`);
    return res.data;
  },
  updateCandidate: async (id: string, data: any) => {
    const res = await apiClient.put<{
      success: boolean;
      message: string;
      candidate: User;
    }>(`/candidates/${id}`, data);
    return res.data;
  },
  deleteCandidate: async (id: string) => {
    const res = await apiClient.delete<{
      success: boolean;
      message: string;
      deletedCandidate?: any;
      deletedCounts?: any;
    }>(`/candidates/${id}`);
    return res.data;
  },
};

export const assessmentSecurityApi = {
  getActive: async () => {
    const res = await apiClient.get<{
      success: boolean;
      activeAssessment: SecureAssessmentSession | null;
    }>('/assessment/active');
    return res.data;
  },
  startSession: async (data: {
    assessmentType: AssessmentType;
    assessmentId: string;
    assessmentTitle?: string;
    durationMinutes?: number;
    initialProgress?: any;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      session?: SecureAssessmentSession;
      restored?: boolean;
      conflict?: boolean;
      terminated?: boolean;
      message?: string;
      activeAssessment?: SecureAssessmentSession;
    }>('/assessment/start', data);
    return res.data;
  },
  saveProgress: async (assessmentId: string, progress: any) => {
    const res = await apiClient.post<{
      success: boolean;
      session?: SecureAssessmentSession;
      message?: string;
    }>('/assessment/progress', { assessmentId, progress });
    return res.data;
  },
  terminateSession: async (data: {
    assessmentId: string;
    violationType: ViolationType;
    details?: string;
    finalProgress?: any;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      terminated: boolean;
      message: string;
      session?: SecureAssessmentSession;
    }>('/assessment/terminate', data);
    return res.data;
  },
  completeSession: async (assessmentId: string, finalProgress?: any) => {
    const res = await apiClient.post<{
      success: boolean;
      session?: SecureAssessmentSession;
      message?: string;
    }>('/assessment/complete', { assessmentId, finalProgress });
    return res.data;
  },
  getSession: async (id: string) => {
    const res = await apiClient.get<{
      success: boolean;
      session: SecureAssessmentSession;
      terminated: boolean;
    }>(`/assessment/session/${id}`);
    return res.data;
  },
  getAdminLogs: async (params?: { status?: string; type?: string; search?: string }) => {
    const res = await apiClient.get<{
      success: boolean;
      totalCount: number;
      terminatedCount: number;
      inProgressCount: number;
      completedCount: number;
      logs: SecureAssessmentSession[];
    }>('/assessment/admin/logs', { params });
    return res.data;
  },
};

export const xpService = {
  getXpBalance: async () => {
    const res = await apiClient.get<{
      success: boolean;
      xpPoints: number;
      level: string;
      currentStreak: number;
    }>('/gamification/xp-balance');
    return res.data;
  },
  getMyTransactions: async () => {
    const res = await apiClient.get<{
      success: boolean;
      transactions: XpTransaction[];
    }>('/gamification/xp-transactions');
    return res.data;
  },
  getXpSettings: async () => {
    const res = await apiClient.get<{
      success: boolean;
      settings: XpSettings;
    }>('/gamification/xp-settings');
    return res.data;
  },
  getAdminXpSettings: async () => {
    const res = await apiClient.get<{
      success: boolean;
      settings: XpSettings;
    }>('/admin/xp-settings');
    return res.data;
  },
  updateAdminXpSettings: async (settings: Partial<XpSettings>) => {
    const res = await apiClient.put<{
      success: boolean;
      message: string;
      settings: XpSettings;
    }>('/admin/xp-settings', settings);
    return res.data;
  },
  getAdminXpTransactions: async (params?: { userId?: string; type?: string; action?: string }) => {
    const res = await apiClient.get<{
      success: boolean;
      total: number;
      transactions: XpTransaction[];
    }>('/admin/xp-transactions', { params });
    return res.data;
  },
};

