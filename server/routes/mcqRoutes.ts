import { Router, Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth';
import { db } from '../db';
import { McqQuestion } from '../types';

export const mcqRouter = Router();

// Get MCQ categories
mcqRouter.get('/categories', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const categories = [
    'Java',
    'Spring Boot',
    'React',
    'JavaScript',
    'MongoDB',
    'DBMS',
    'SQL',
    'DSA',
    'OOP',
  ];
  return res.json({
    success: true,
    categories,
  });
});

// Get MCQ practice questions
mcqRouter.get('/questions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const category = req.query.category as string;
  const questions = db.getMcqQuestionsByCategory(category);

  // Strip correct answer index for candidate test taking
  const safeQuestions = questions.map((q) => ({
    id: q.id,
    category: q.category,
    question: q.question,
    options: q.options,
    difficulty: q.difficulty,
  }));

  return res.json({
    success: true,
    category: category || 'All',
    totalQuestions: safeQuestions.length,
    questions: safeQuestions,
  });
});

// Submit MCQ answers and calculate score
mcqRouter.post('/submit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { answers } = req.body; // Array of { questionId, selectedOptionIndex }

  if (!Array.isArray(answers)) {
    return res.status(400).json({ success: false, message: 'Answers array is required.' });
  }

  const allQuestions = db.getMcqQuestionsByCategory();
  const questionMap = new Map<string, McqQuestion>();
  allQuestions.forEach((q) => questionMap.set(q.id, q));

  let correctCount = 0;
  const results = answers.map((ans) => {
    const q = questionMap.get(ans.questionId);
    if (!q) {
      return {
        questionId: ans.questionId,
        isCorrect: false,
        explanation: 'Question not found',
      };
    }
    const isCorrect = q.correctAnswerIndex === ans.selectedOptionIndex;
    if (isCorrect) correctCount++;
    return {
      questionId: q.id,
      question: q.question,
      category: q.category,
      selectedOptionIndex: ans.selectedOptionIndex,
      correctAnswerIndex: q.correctAnswerIndex,
      correctAnswerText: q.options[q.correctAnswerIndex],
      isCorrect,
      explanation: q.explanation,
    };
  });

  const total = answers.length;
  const scorePercentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // Award XP
  const xpAwarded = correctCount * 15;
  db.awardXp(user.id, xpAwarded);

  return res.json({
    success: true,
    totalQuestions: total,
    correctCount,
    scorePercentage,
    xpAwarded,
    results,
  });
});

// Admin add MCQ question (Strictly restricted to Admin role - Candidates forbidden)
mcqRouter.post('/questions', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { category, question, options, correctAnswerIndex, explanation, difficulty } = req.body;
  if (!question || !options || options.length < 2) {
    return res.status(400).json({ success: false, message: 'Question and at least 2 options are required.' });
  }

  const newQ = db.addMcqQuestion({
    id: `mcq_${Date.now()}`,
    category: category || 'General',
    question,
    options,
    correctAnswerIndex: correctAnswerIndex ?? 0,
    explanation: explanation || '',
    difficulty: difficulty || 'Intermediate',
  });

  return res.json({
    success: true,
    question: newQ,
  });
});
