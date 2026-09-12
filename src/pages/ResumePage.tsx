import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  Check,
  AlertTriangle,
  Lightbulb,
  Trash2,
  RefreshCw,
  Award,
  ArrowRight,
} from 'lucide-react';
import { resumeService } from '../services/api';
import { ResumeDocument } from '../types';

export const ResumePage: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeDocument | null>(null);
  const [fileName, setFileName] = useState('alex_johnson_resume.pdf');
  const [fileText, setFileText] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleInserted, setSampleInserted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sampleResume = `ALEX JOHNSON
Software Engineer | alex@university.edu | (555) 123-4567 | San Francisco, CA

SUMMARY
Enthusiastic Full Stack Engineer with 2+ years experience building scalable web applications using Java, Spring Boot, React, and MongoDB.

EDUCATION
B.Tech in Computer Science, Stanford University (2020 - 2024)

TECHNICAL SKILLS
Languages: Java, JavaScript, TypeScript, SQL
Frameworks: Spring Boot, Spring Security, React, Express
Databases: PostgreSQL, MongoDB, Redis
DevOps: Docker, Git, CI/CD, AWS

PROJECTS
• AI Mock Interview Platform: Built high-throughput microservices using Spring Boot & React, optimizing API latency by 35%.
• E-Commerce Distributed Checkout: Implemented distributed locking with Redis and RabbitMQ messaging queue.`;

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const res = await resumeService.getResumes();
      if (res.success && res.resumes) {
        setResumes(res.resumes);
        if (res.resumes.length > 0 && !selectedResume) {
          setSelectedResume(res.resumes[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    }
  };

  const handleUploadAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileText.trim()) return;

    setError(null);
    setAnalyzing(true);

    try {
      const res = await resumeService.uploadResume({
        fileName: fileName || 'candidate_resume.pdf',
        fileText,
        fileSize: fileText.length,
      });

      if (res.success && res.resume) {
        setSelectedResume(res.resume);
        setResumes((prev) => [res.resume, ...prev]);
        setFileText('');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to analyze resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this resume from your profile?')) return;
    await resumeService.deleteResume(id);
    setResumes((prev) => prev.filter((r) => r.id !== id));
    if (selectedResume?.id === id) {
      setSelectedResume(resumes.find((r) => r.id !== id) || null);
    }
  };

  const handleInsertSample = () => {
    setFileName('alex_johnson_fullstack_resume.pdf');
    setFileText(sampleResume);
    setSampleInserted(true);
    setTimeout(() => setSampleInserted(false), 3000);
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setFileText(content);
        setSampleInserted(true);
        setTimeout(() => setSampleInserted(false), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Gemini ATS Parser & Skill Diagnostic</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          AI Resume & ATS Intelligence
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Scan your resume text against modern technical hiring benchmarks to uncover ATS gaps and keyword fixes.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Upload / Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload / Paste Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Input Resume Text
              </h3>
              <button
                type="button"
                id="insert-sample-resume-btn"
                onClick={handleInsertSample}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm active:scale-95 cursor-pointer ${
                  sampleInserted
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:shadow'
                }`}
                title="Populate candidate engineering resume"
              >
                {sampleInserted ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-in fade-in" />
                    <span className="font-bold">Sample Loaded ✓</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>Insert Sample Resume</span>
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleUploadAndAnalyze} className="space-y-4">
              {/* Drag & Drop File Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 scale-[1.01]'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.rtf,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <Upload className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Drop resume file here, or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Supports .pdf, .txt, .md, .docx or paste text below
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  File Reference Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="alex_johnson_resume.pdf"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Resume Content (Paste text or project summaries)
                </label>
                <textarea
                  rows={9}
                  required
                  value={fileText}
                  onChange={(e) => setFileText(e.target.value)}
                  placeholder="Paste your education, skills, and work experience here..."
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono resize-y"
                />
              </div>

              <button
                type="submit"
                id="analyze-resume-btn"
                disabled={analyzing || !fileText.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {analyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing ATS Compatibility with Gemini...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Run ATS Diagnostic</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Past Uploads */}
          {resumes.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">
                Uploaded Versions ({resumes.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedResume(r)}
                    className={`flex items-center justify-between p-3 rounded-xl text-xs cursor-pointer border transition-all ${
                      selectedResume?.id === r.id
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="truncate">
                      <p className="truncate font-semibold">{r.fileName}</p>
                      <span className="text-[10px] text-zinc-400">ATS Score: {r.atsScore}/100</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(r.id);
                      }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                      title="Delete Resume"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: ATS Report */}
        <div className="lg:col-span-7 space-y-6">
          {selectedResume ? (
            <div className="space-y-6">
              {/* ATS Score Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400">
                      ATS Report Summary
                    </span>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                      {selectedResume.fileName}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Scanned on {new Date(selectedResume.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-center p-3 px-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        {selectedResume.atsScore}
                      </span>
                      <span className="text-[10px] block font-bold text-zinc-400">ATS Score</span>
                    </div>

                    <div className="text-center p-3 px-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900">
                      <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                        {selectedResume.resumeScore}
                      </span>
                      <span className="text-[10px] block font-bold text-zinc-400">Impact Score</span>
                    </div>
                  </div>
                </div>

                {/* Skills Detected vs Missing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-2">
                      Detected Strong Skills ({selectedResume.extractedSkills?.length || 0})
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedResume.extractedSkills || ['Java', 'Spring Boot', 'React', 'SQL']).map((sk) => (
                        <span
                          key={sk}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-2">
                      Missing In-Demand Keywords
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedResume.missingSkills || ['Kubernetes', 'Microservices', 'GraphQL']).map((sk) => (
                        <span
                          key={sk}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-xs font-semibold"
                        >
                          + {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Bullet-Point Suggestions */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    Bullet Point & Impact Suggestions
                  </h3>
                </div>

                <ul className="space-y-3">
                  {(selectedResume.suggestions || [
                    'Quantify achievements with business metrics (e.g. reduced latency by 35%)',
                    'Highlight distributed systems or concurrency experience explicitly',
                  ]).map((sug, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2"
                    >
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <FileText className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                No Resume Scanned
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Paste your resume text on the left to generate an instant ATS score and keyword gap analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
