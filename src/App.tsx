import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AssessmentSecurityProvider, useAssessmentSecurity } from './context/AssessmentSecurityContext';
import { SecureModeNotice } from './components/assessment/SecureModeNotice';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { InterviewSetupPage } from './pages/InterviewSetupPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { InterviewResultPage } from './pages/InterviewResultPage';
import { InterviewHistoryPage } from './pages/InterviewHistoryPage';
import { ResumePage } from './pages/ResumePage';
import { JobMatchPage } from './pages/JobMatchPage';
import { CodingInterviewPage } from './pages/CodingInterviewPage';
import { McqPracticePage } from './pages/McqPracticePage';
import { RoadmapPage } from './pages/RoadmapPage';
import { CheatSheetPage } from './pages/CheatSheetPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { DocsPage } from './pages/DocsPage';
import { AdminPage } from './pages/AdminPage';
import { AssignedInterviewsPage } from './pages/AssignedInterviewsPage';
import { AttendInterviewPage } from './pages/AttendInterviewPage';
import { AssignedInterviewResultPage } from './pages/AssignedInterviewResultPage';
import { SessionTerminatedPage } from './pages/SessionTerminatedPage';
import { ChatbotPage } from './pages/ChatbotPage';
import { FloatingChatWidget } from './components/chat/FloatingChatWidget';

// Main Application Layout with Navbar & Collapsible Sidebar
const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isSecureMode, remainingSeconds, enterFullscreen, isFullscreen } = useAssessmentSecurity();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      {isSecureMode && (
        <SecureModeNotice
          remainingSeconds={remainingSeconds}
          onEnterFullscreen={enterFullscreen}
          isFullscreen={isFullscreen}
        />
      )}
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`flex-1 ${isSecureMode ? 'px-2 sm:px-4 py-4 w-full' : 'lg:pl-64 px-4 sm:px-8 py-8 max-w-7xl w-full mx-auto'}`}>
          <Outlet />
        </main>
      </div>
      {!isSecureMode && <FloatingChatWidget />}
    </div>
  );
};

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Allow guest access if no auth for quick exploration, or redirect if needed
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Strict Administrator Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AssessmentSecurityProvider>
            <Routes>
              {/* Public Landing & Auth */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Dedicated Zero-Tolerance Session Terminated Route */}
              <Route path="/session-terminated" element={<SessionTerminatedPage />} />

              {/* Authenticated Application Shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Candidate Assigned Scheduled Interviews */}
                <Route path="/assigned-interviews" element={<AssignedInterviewsPage />} />
                <Route path="/attend-interview/:id" element={<AttendInterviewPage />} />
                <Route path="/assigned-interview/result/:id" element={<AssignedInterviewResultPage />} />

                <Route path="/interview/setup" element={<InterviewSetupPage />} />
                <Route path="/interview/room/:id" element={<InterviewRoomPage />} />
                <Route path="/interview/result/:id" element={<InterviewResultPage />} />
                <Route path="/history" element={<InterviewHistoryPage />} />
                <Route path="/resume" element={<ResumePage />} />
                <Route path="/job-match" element={<JobMatchPage />} />
                <Route path="/coding" element={<CodingInterviewPage />} />
                <Route path="/mcq" element={<McqPracticePage />} />
                <Route path="/roadmap" element={<RoadmapPage />} />
                <Route path="/cheat-sheet" element={<CheatSheetPage />} />
                <Route path="/chat" element={<ChatbotPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/docs" element={<DocsPage />} />

                {/* Strict Admin Protected Route */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AssessmentSecurityProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
