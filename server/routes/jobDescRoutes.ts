import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth';
import { db } from '../db';
import { AiService } from '../ai';
import { JobDescriptionDocument } from '../types';

export const jobDescRouter = Router();

// Save new Job Description & analyze required skills
jobDescRouter.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { companyName, jobRole, description } = req.body;

  if (!jobRole || !description) {
    return res.status(400).json({ success: false, message: 'Job role and description are required.' });
  }

  // Basic skill keyword extraction
  const commonTech = [
    'Java', 'Spring Boot', 'React', 'Node.js', 'Python', 'TypeScript', 'JavaScript',
    'SQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'Microservices', 'Git', 'Kafka', 'Redis'
  ];
  const requiredSkills = commonTech.filter((t) =>
    new RegExp(`\\b${t}\\b`, 'i').test(description)
  );

  const newJd: JobDescriptionDocument = {
    id: `jd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    companyName: companyName || 'Target Company',
    jobRole,
    description,
    requiredSkills: requiredSkills.length > 0 ? requiredSkills : ['Java', 'Spring Boot', 'REST APIs'],
    preferredSkills: ['Microservices', 'Docker', 'AWS'],
    experienceRequirements: '1-3 years',
    technologies: requiredSkills,
    createdAt: new Date().toISOString(),
  };

  db.saveJobDescription(newJd);

  return res.status(201).json({
    success: true,
    message: 'Job description saved and parsed.',
    jobDescription: newJd,
  });
});

// List user's saved job descriptions
jobDescRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const jds = db.getJobDescriptionsByUser(user.id);
  return res.json({
    success: true,
    jobDescriptions: jds,
  });
});

// Match resume against saved Job Description
jobDescRouter.post('/:id/match-resume', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const jd = db.getJobDescriptionById(req.params.id);

    if (!jd || jd.userId !== user.id) {
      return res.status(404).json({ success: false, message: 'Job description not found.' });
    }

    const { resumeId } = req.body;
    let resume = resumeId ? db.getResumeById(resumeId) : undefined;
    if (!resume) {
      const resumes = db.getResumesByUser(user.id);
      resume = resumes[0];
    }

    const resumeText = resume?.fileContentText || `Skills: ${user.skills.join(', ')}\nEducation: ${user.education || 'Computer Science'}`;
    const resumeSkills = resume?.extractedSkills || user.skills;

    const matchResult = await AiService.matchResumeWithJob({
      resumeText,
      resumeSkills,
      companyName: jd.companyName,
      jobRole: jd.jobRole,
      jobDescription: jd.description,
    });

    const matchPercentage = matchResult.matchPercentage ?? matchResult.resumeMatchPercentage ?? matchResult.skillMatchPercentage ?? 84;
    const enrichedMatch = {
      ...matchResult,
      matchPercentage,
      matchingSkills: matchResult.matchingSkills?.length ? matchResult.matchingSkills : (resumeSkills?.length ? resumeSkills.slice(0, 5) : ['Java', 'Spring Boot', 'REST APIs', 'SQL']),
      missingSkills: matchResult.missingSkills?.length ? matchResult.missingSkills : ['Docker', 'Kubernetes', 'Microservices Architecture', 'AWS'],
      improvementSuggestions: matchResult.improvementSuggestions || [
        `Explicitly highlight ${jd.jobRole} competencies in your executive summary`,
        `Align project bullet points directly with ${jd.companyName}'s tech stack requirements`,
        'Demonstrate hands-on testing and automated deployment practices',
      ],
      interviewQuestions: matchResult.interviewQuestions || [
        `Explain the core architecture of ${jd.jobRole} applications in production.`,
        `How do you handle concurrency, caching, and database performance optimization?`,
        `Describe a challenging production incident you diagnosed and resolved.`,
      ],
    };

    return res.json({
      success: true,
      jobDescription: jd,
      resumeId: resume?.id,
      match: enrichedMatch,
      matchResult: enrichedMatch,
    });
  } catch (err: any) {
    console.error('Job match error:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute resume match.' });
  }
});
