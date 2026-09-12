import { Router, Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth';
import { AiService } from '../ai';

export const aiRouter = Router();

// Generate standalone interview question
aiRouter.post('/generate-question', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      jobRole = user.preferredJobRole || 'Software Engineer',
      interviewType = 'Technical Interview',
      difficulty = 'Intermediate',
      companyName,
      questionNumber = 1,
    } = req.body;

    const result = await AiService.generateQuestion({
      jobRole,
      interviewType,
      difficulty,
      companyName,
      skills: user.skills,
      questionNumber,
    });

    return res.json({
      success: true,
      question: result.question,
      category: result.category,
      difficulty: result.difficulty,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate question.' });
  }
});

// Evaluate standalone answer
aiRouter.post('/evaluate-answer', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { question, userAnswer, jobRole = 'Software Engineer', interviewType = 'Technical Interview', difficulty = 'Intermediate' } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({ success: false, message: 'Question and userAnswer are required.' });
    }

    const evaluation = await AiService.evaluateAnswer({
      question,
      userAnswer,
      jobRole,
      interviewType,
      difficulty,
    });

    return res.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to evaluate answer.' });
  }
});

// Analyze standalone resume
aiRouter.post('/analyze-resume', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resumeText, fileName = 'resume.pdf' } = req.body;
    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'Resume text is required.' });
    }

    const analysis = await AiService.analyzeResume(resumeText, fileName);
    return res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to analyze resume.' });
  }
});

// Analyze standalone Job Description
aiRouter.post('/analyze-job-description', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { companyName = 'Company', jobRole = 'Software Engineer', description } = req.body;
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    const user = req.user!;
    const match = await AiService.matchResumeWithJob({
      resumeText: `Skills: ${user.skills.join(', ')}`,
      resumeSkills: user.skills,
      companyName,
      jobRole,
      jobDescription: description,
    });

    const matchPercentage = match.matchPercentage ?? match.resumeMatchPercentage ?? match.skillMatchPercentage ?? 82;
    const enrichedMatch = {
      ...match,
      matchPercentage,
    };

    return res.json({
      success: true,
      match: enrichedMatch,
      matchResult: enrichedMatch,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to analyze job description.' });
  }
});

// Get personalized learning roadmap
aiRouter.get('/learning-roadmap', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const role = (req.query.role as string) || user.preferredJobRole || 'Java Full Stack Developer';
    const weakTopics = ((req.query.weakTopics as string) || '').split(',').filter(Boolean);

    const roadmap = await AiService.generateRoadmap({
      jobRole: role,
      skills: user.skills,
      weakTopics: weakTopics.length > 0 ? weakTopics : ['Spring Security', 'System Design', 'Concurrency'],
    });

    return res.json({
      success: true,
      roadmap: roadmap.roadmap,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate roadmap.' });
  }
});

// Get personalized cheat sheet
aiRouter.get('/cheat-sheet', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const role = (req.query.role as string) || user.preferredJobRole || 'Java Full Stack Developer';
    const topics = ((req.query.topics as string) || 'Java,Spring Boot,React,SQL,Microservices').split(',').map((t) => t.trim());

    const result = await AiService.generateCheatSheet({
      jobRole: role,
      topics,
    });

    return res.json({
      success: true,
      cheatSheet: result.cheatSheet,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate cheat sheet.' });
  }
});

// Review coding solution (safe AI review - no server execution)
aiRouter.post('/code-review', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { problemTitle, problemDescription, language, code } = req.body;
    if (!code || !problemTitle) {
      return res.status(400).json({ success: false, message: 'Code and problem title are required.' });
    }

    const review = await AiService.reviewCode({
      problemTitle,
      problemDescription: problemDescription || 'Algorithmic Problem',
      language: language || 'Java',
      code,
    });

    return res.json({
      success: true,
      review,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to review code.' });
  }
});

// Generate new algorithmic coding problem (Admin only)
aiRouter.post('/generate-coding-problem', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topic, difficulty } = req.body;
    const problem = await AiService.generateCodingProblem({
      topic: topic || 'Data Structures & Algorithms',
      difficulty: difficulty || 'Medium',
    });

    return res.json({
      success: true,
      problem,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate coding problem.' });
  }
});

// Multi-turn Gemini chatbot conversation endpoint
aiRouter.post('/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messages, systemInstruction, model } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'messages array is required with at least one message.',
      });
    }

    const sanitizedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = messages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: String(m.content || ''),
    }));

    const result = await AiService.sendChatMessage({
      messages: sanitizedMessages,
      systemInstruction,
      model,
    });

    return res.json({
      success: true,
      reply: result.reply,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to process chat message.',
    });
  }
});

