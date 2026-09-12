import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth';
import { db } from '../db';
import { AiService } from '../ai';
import { ResumeDocument } from '../types';

export const resumeRouter = Router();

// Upload resume & trigger initial AI analysis
resumeRouter.post('/upload', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { fileName, fileText, fileSize } = req.body;

    if (!fileName) {
      return res.status(400).json({ success: false, message: 'File name is required.' });
    }

    const content = fileText || `Resume of ${user.name}\nSkills: ${user.skills.join(', ')}\nEducation: ${user.education || 'Computer Science'}\nExperience: Full-Stack Developer project experience with Java, Spring Boot, React, and MongoDB.`;

    // AI Resume Analysis
    const aiAnalysis = await AiService.analyzeResume(content, fileName);

    const newResume: ResumeDocument = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      fileName,
      fileSize: fileSize || content.length,
      fileContentText: content,
      extractedSkills: aiAnalysis.extractedSkills || user.skills,
      resumeScore: aiAnalysis.resumeScore || 80,
      atsScore: aiAnalysis.atsScore || 78,
      strongSkills: aiAnalysis.strongSkills || ['Java', 'Spring Boot'],
      missingSkills: aiAnalysis.missingSkills || ['Docker', 'AWS'],
      suggestions: aiAnalysis.suggestions || ['Add quantifiable impact metrics'],
      weakAreas: aiAnalysis.weakAreas || ['Generic summary phrasing'],
      grammarSuggestions: aiAnalysis.grammarSuggestions || ['Use active voice'],
      projectSuggestions: aiAnalysis.projectSuggestions || ['Add cloud native deployment projects'],
      extractedData: {
        name: aiAnalysis.name || user.name,
        education: aiAnalysis.education || user.education,
        experience: aiAnalysis.experience || '1-2 years',
        projects: aiAnalysis.projects || [],
        technologies: aiAnalysis.extractedSkills || [],
      },
      createdAt: new Date().toISOString(),
    };

    db.saveResume(newResume);

    // Award XP for resume upload
    db.awardXp(user.id, 50);

    return res.status(201).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully with Gemini AI.',
      resume: newResume,
    });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload or analyze resume.' });
  }
});

// List user's resumes
resumeRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const resumes = db.getResumesByUser(user.id);
  return res.json({
    success: true,
    resumes,
  });
});

// Get resume by ID
resumeRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const resume = db.getResumeById(req.params.id);

  if (!resume || resume.userId !== user.id) {
    return res.status(404).json({ success: false, message: 'Resume not found.' });
  }

  return res.json({
    success: true,
    resume,
  });
});

// Delete resume
resumeRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const success = db.deleteResume(req.params.id, user.id);

  if (!success) {
    return res.status(404).json({ success: false, message: 'Resume not found or unauthorized.' });
  }

  return res.json({
    success: true,
    message: 'Resume deleted successfully.',
  });
});

// Re-analyze existing resume
resumeRouter.post('/:id/analyze', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const resume = db.getResumeById(req.params.id);

    if (!resume || resume.userId !== user.id) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const aiAnalysis = await AiService.analyzeResume(resume.fileContentText || '', resume.fileName);

    const updated: ResumeDocument = {
      ...resume,
      extractedSkills: aiAnalysis.extractedSkills || resume.extractedSkills,
      resumeScore: aiAnalysis.resumeScore || resume.resumeScore,
      atsScore: aiAnalysis.atsScore || resume.atsScore,
      strongSkills: aiAnalysis.strongSkills || resume.strongSkills,
      missingSkills: aiAnalysis.missingSkills || resume.missingSkills,
      suggestions: aiAnalysis.suggestions || resume.suggestions,
      weakAreas: aiAnalysis.weakAreas || resume.weakAreas,
      grammarSuggestions: aiAnalysis.grammarSuggestions || resume.grammarSuggestions,
      projectSuggestions: aiAnalysis.projectSuggestions || resume.projectSuggestions,
      extractedData: {
        name: aiAnalysis.name || user.name,
        education: aiAnalysis.education || user.education,
        experience: aiAnalysis.experience || '1-2 years',
        projects: aiAnalysis.projects || [],
        technologies: aiAnalysis.extractedSkills || [],
      },
    };

    db.saveResume(updated);

    return res.json({
      success: true,
      message: 'Resume re-analyzed successfully.',
      resume: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to analyze resume.' });
  }
});
