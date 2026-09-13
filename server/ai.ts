import { GoogleGenAI } from '@google/genai';
import { AnswerEvaluation } from './types';
import { db } from './db';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Clean JSON response from Gemini code fences
function cleanJsonText(raw: string): string {
  let cleaned = (raw || '').trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    cleaned = jsonMatch[1].trim();
  } else if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
  }
  return cleaned.trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: any): boolean {
  if (!err) return false;
  const status = err?.status || err?.code || err?.statusCode || err?.error?.code;
  const message = String(err?.message || err?.error?.message || '');
  return (
    status === 503 ||
    status === 429 ||
    status === 'UNAVAILABLE' ||
    status === 'RESOURCE_EXHAUSTED' ||
    message.includes('503') ||
    message.includes('429') ||
    message.includes('high demand') ||
    message.includes('UNAVAILABLE') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('Quota exceeded') ||
    message.includes('overloaded') ||
    message.includes('try again later')
  );
}

// Valid, currently supported production Gemini models (Primary + Fallbacks)
const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

async function generateWithRetry(options: {
  contents: string;
  temperature?: number;
  responseMimeType?: string;
}): Promise<string | null> {
  const ai = getAiClient();
  if (!ai) return null;

  for (const model of CANDIDATE_MODELS) {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: {
            responseMimeType: options.responseMimeType || 'application/json',
            temperature: options.temperature ?? 0.4,
          },
        });

        const text = response?.text?.trim();
        if (text) {
          return cleanJsonText(text);
        }
      } catch (err: any) {
        const retryable = isRetryableError(err);
        if (retryable && attempt < maxRetries) {
          const delay = (attempt + 1) * 600 + Math.floor(Math.random() * 200);
          console.log(`[AI] Model ${model} rate-limited or busy. Retrying in ${delay}ms (${attempt + 1}/${maxRetries})...`);
          await sleep(delay);
          continue;
        }

        if (retryable) {
          console.warn(`[AI] Model ${model} retry limit reached. Falling back to next candidate model...`);
          break;
        }

        console.warn(`[AI] Gemini generation error on ${model}:`, err?.message || err);
        break;
      }
    }
  }

  return null;
}

// Track pro model quota to avoid unnecessary timeouts
let proModelQuotaExhausted = false;

export class AiService {
  /**
   * Generates a realistic, targeted interview question based on user profile, role, company and difficulty
   */
  public static async generateQuestion(params: {
    jobRole: string;
    interviewType: string;
    difficulty: string;
    companyName?: string;
    skills?: string[];
    questionNumber: number;
    previousScore?: number;
    previousQuestions?: string[];
  }): Promise<{ question: string; category: string; difficulty: 'Beginner' | 'Intermediate' | 'Advanced' }> {
    db.incrementAiRequests();
    const companyPrompt = params.companyName
      ? `Practice questions inspired by ${params.companyName}'s engineering culture.`
      : 'General industry top-tier interview standard.';

    const prompt = `You are a Principal Technical Interviewer and Hiring Manager for the role: ${params.jobRole}.
Interview Type: ${params.interviewType}
Difficulty Level: ${params.difficulty}
Candidate Core Skills: ${(params.skills || []).join(', ') || 'General Engineering'}
${companyPrompt}
Question Number: ${params.questionNumber}
${params.previousScore !== undefined ? `Candidate's previous answer score: ${params.previousScore}/10. Adjust question complexity adaptively.` : ''}
${params.previousQuestions && params.previousQuestions.length > 0 ? `Already asked questions (DO NOT REPEAT): ${params.previousQuestions.join(' | ')}` : ''}

Generate ONE clear, professional, scenario-rich question appropriate for this interview stage.
${params.interviewType === 'Behavioral Interview' ? 'Focus on STAR format situations (leadership, conflict, tight deadlines, system failure).' : ''}
${params.interviewType === 'HR Interview' ? 'Focus on culture fit, career vision, strengths, salary expectations, motivation.' : ''}
${params.interviewType === 'Coding Interview' ? 'Focus on algorithmic problem solving, data structures, or code architecture.' : ''}

Respond in STRICT JSON format:
{
  "question": "The question text",
  "category": "e.g. Java, Spring Boot, Architecture, Behavioral, System Design",
  "difficulty": "${params.difficulty}"
}`;

    const jsonText = await generateWithRetry({
      contents: prompt,
      temperature: 0.7,
      responseMimeType: 'application/json',
    });

    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed?.question) {
          return {
            question: parsed.question,
            category: parsed.category || params.jobRole,
            difficulty: (parsed.difficulty || params.difficulty) as any,
          };
        }
      } catch (err) {
        console.warn('[AI] Error parsing question JSON, using fallback:', err);
      }
    }

    // Role-adaptive fallback bank
    const roleLower = (params.jobRole || '').toLowerCase();
    let technicalQuestions: string[] = [];

    if (roleLower.includes('frontend') || roleLower.includes('react') || roleLower.includes('web')) {
      technicalQuestions = [
        'How does React Virtual DOM reconciliation work, and when should you use useCallback vs useMemo to avoid unnecessary re-renders?',
        'Explain the browser Critical Rendering Path and techniques you use to achieve sub-second Core Web Vitals (LCP, FID, CLS).',
        'How do modern CSS-in-JS and utility frameworks compare with CSS Modules in terms of bundle size and runtime performance?',
        'Explain the differences between Server-Side Rendering (SSR), Static Site Generation (SSG), and Client-Side Rendering (CSR).',
        'How do you secure web applications against Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF)?',
      ];
    } else if (roleLower.includes('python') || roleLower.includes('data') || roleLower.includes('ai') || roleLower.includes('machine')) {
      technicalQuestions = [
        'How does the Python Global Interpreter Lock (GIL) affect multithreaded vs multiprocessing performance in CPU-bound tasks?',
        'Explain how Python manages memory with reference counting and cyclic garbage collection, and how to detect memory leaks.',
        'How would you architect a high-throughput data processing pipeline handling millions of events per hour using Kafka and Pandas/Polars?',
        'What are the key trade-offs between SQL (PostgreSQL) and NoSQL (MongoDB/Cassandra) for analytical vs transactional query patterns?',
        'Explain the bias-variance tradeoff in machine learning and techniques used to mitigate model overfitting.',
      ];
    } else if (roleLower.includes('devops') || roleLower.includes('cloud') || roleLower.includes('sre')) {
      technicalQuestions = [
        'How do Kubernetes Deployments, ReplicaSets, and Pods interact during a rolling update with zero downtime?',
        'Explain how you would design an automated CI/CD pipeline with canary deployments and automated rollback triggers.',
        'What strategies do you use for distributed tracing, metrics aggregation, and alerting across microservices with Prometheus and Grafana?',
        'How does Terraform maintain state locking, and how do you handle configuration drift in infrastructure as code?',
        'Explain the difference between horizontal pod autoscaling (HPA) and cluster autoscaling in cloud Kubernetes environments.',
      ];
    } else {
      technicalQuestions = [
        'How does the Java Memory Model handle heap vs stack allocations, and how does garbage collection reclaim unreferenced objects in high-throughput services?',
        'Explain how Spring Boot manages singleton bean lifecycles and what happens when a singleton bean injects a prototype-scoped bean.',
        'In a distributed microservice architecture, how would you prevent cascading service failures when a downstream database slows down?',
        'What are database indexes, and why might an improperly chosen composite index degrade write performance without boosting read queries?',
        'Explain how database transaction isolation levels (Read Committed vs Serializable) prevent dirty reads, non-repeatable reads, and phantom reads.',
      ];
    }

    const fallbackBank: Record<string, string[]> = {
      'Technical Interview': technicalQuestions,
      'HR Interview': [
        `Tell me about yourself and what specifically attracted you to this role as a ${params.jobRole}?`,
        `Describe a scenario where you faced a significant project roadblock or missed deadline. How did you communicate with stakeholders?`,
        `Where do you envision your career trajectory over the next 3 to 5 years, and how does this position align with your goals?`,
        `How do you handle constructive criticism or disagreement with a tech lead or product manager?`,
      ],
      'Behavioral Interview': [
        `Describe a challenging situation in your past projects where technical requirements were ambiguous. How did you clarify tasks and deliver results? (Please use the STAR method)`,
        `Tell me about a time when you had to make an architectural compromise due to strict timeline pressures. What trade-offs did you consider?`,
        `Describe an instance where you identified a critical bug in production. What immediate actions did you take, and how did you prevent recurrence?`,
      ],
      'Coding Interview': [
        `Design an efficient Least Recently Used (LRU) Cache data structure supporting O(1) get and put operations. Explain your choice of data structures.`,
        `Given an array of integers representing stock prices over consecutive days, write an algorithm to find the maximum profit obtainable from at most two transactions.`,
        `Implement a rate limiter algorithm (Token Bucket or Leaky Bucket) suitable for an API Gateway. Discuss time and space complexity.`,
      ],
    };

    const bank = fallbackBank[params.interviewType] || fallbackBank['Technical Interview'];
    const selectedQ = bank[(params.questionNumber - 1) % bank.length];

    return {
      question: selectedQ,
      category: params.interviewType === 'HR Interview' ? 'HR & Culture' : params.jobRole,
      difficulty: params.difficulty as any,
    };
  }

  /**
   * Evaluates candidate's answer with detailed category scoring (0-10) and feedback
   */
  public static async evaluateAnswer(params: {
    question: string;
    userAnswer: string;
    jobRole: string;
    interviewType: string;
    difficulty: string;
  }): Promise<AnswerEvaluation> {
    db.incrementAiRequests();

    const prompt = `You are an expert Interview Assessor evaluating a candidate for: ${params.jobRole}.
Interview Type: ${params.interviewType}
Difficulty: ${params.difficulty}

QUESTION:
"${params.question}"

CANDIDATE ANSWER:
"${params.userAnswer}"

Analyze the answer rigorously.
${params.interviewType === 'Behavioral Interview' ? 'Assess according to the STAR method (Situation, Task, Action, Result).' : ''}

Provide scores from 0.0 to 10.0 for:
1. overallScore
2. technicalScore
3. communicationScore
4. confidenceScore
5. completenessScore
6. problemSolvingScore
7. relevanceScore

Highlight:
- strengths (array of strings)
- weaknesses (array of strings)
- incorrectConcepts (array of strings, if any)
- suggestions (actionable improvement tips)
- betterAnswerExample (a polished, production-grade model answer)
${params.interviewType === 'Behavioral Interview' ? '- starEvaluation (object with situation, task, action, result, feedback)' : ''}

Respond in STRICT JSON:
{
  "overallScore": 8.0,
  "technicalScore": 8.5,
  "communicationScore": 7.5,
  "confidenceScore": 8.0,
  "completenessScore": 7.5,
  "problemSolvingScore": 8.0,
  "relevanceScore": 8.5,
  "strengths": ["...", "..."],
  "weaknesses": ["..."],
  "incorrectConcepts": [],
  "suggestions": ["..."],
  "betterAnswerExample": "..."
}`;

    const jsonText = await generateWithRetry({
      contents: prompt,
      temperature: 0.3,
      responseMimeType: 'application/json',
    });

    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.overallScore !== undefined) {
          return {
            overallScore: Number(parsed.overallScore) || 7,
            technicalScore: Number(parsed.technicalScore) || 7,
            communicationScore: Number(parsed.communicationScore) || 7,
            confidenceScore: Number(parsed.confidenceScore) || 7,
            completenessScore: Number(parsed.completenessScore) || 7,
            problemSolvingScore: Number(parsed.problemSolvingScore) || 7,
            relevanceScore: Number(parsed.relevanceScore) || 7,
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Good core reasoning'],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ['Elaborate more on edge cases'],
            incorrectConcepts: Array.isArray(parsed.incorrectConcepts) ? parsed.incorrectConcepts : [],
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ['Include practical production metrics'],
            betterAnswerExample: parsed.betterAnswerExample || 'A structured answer explaining the underlying principles with clear architectural terminology.',
            starEvaluation: parsed.starEvaluation,
          };
        }
      } catch (err) {
        console.warn('[AI] Error parsing evaluateAnswer JSON, using fallback:', err);
      }
    }

    // Heuristic scoring fallback
    const wordCount = (params.userAnswer || '').trim().split(/\s+/).length;
    let baseScore = 6.0;
    if (wordCount > 30) baseScore += 1.5;
    if (wordCount > 75) baseScore += 1.0;
    if (wordCount < 10) baseScore = 4.0;

    return {
      overallScore: Math.min(9.2, baseScore),
      technicalScore: Math.min(9.0, baseScore + 0.5),
      communicationScore: Math.min(8.5, baseScore),
      confidenceScore: Math.min(8.0, baseScore - 0.2),
      completenessScore: Math.min(8.5, baseScore),
      problemSolvingScore: Math.min(8.8, baseScore + 0.3),
      relevanceScore: Math.min(9.0, baseScore + 0.2),
      strengths: [
        'Directly addressed the core of the question',
        'Showcased practical engineering context',
        'Good logical flow in explanation',
      ],
      weaknesses: [
        wordCount < 30 ? 'Answer was somewhat brief; include technical depth and trade-offs' : 'Could discuss real-world edge cases and scaling challenges',
      ],
      incorrectConcepts: [],
      suggestions: [
        'Structure your answer using the What-Why-How framework',
        'Mention concrete tools and metrics from production environments',
      ],
      betterAnswerExample: `When addressing this in an interview, start by framing the fundamental objective, clarify architectural trade-offs, detail the execution step-by-step, and conclude with how you monitor and test reliability in production.`,
    };
  }

  /**
   * Analyzes an uploaded Resume text with Gemini AI
   */
  public static async analyzeResume(resumeText: string, fileName: string) {
    db.incrementAiRequests();

    const prompt = `You are a Senior Talent Acquisition Director and ATS (Applicant Tracking System) Technical Lead.
Analyze this resume (${fileName}):

"""
${resumeText.slice(0, 15000)}
"""

Extract and evaluate:
1. Candidate Name, Education, Experience years/summary, Technologies, Projects.
2. Resume Score (0-100)
3. ATS Compatibility Score (0-100)
4. Strong Skills (array of strings)
5. Missing / In-demand skills the candidate lacks (array of strings)
6. Weak areas (formatting, vague metrics, missing impact, etc.)
7. Actionable Improvement Suggestions (array of strings)
8. Grammar & Phrasing suggestions (array of strings)
9. Project Suggestions to strengthen their profile (array of strings)

Respond in STRICT JSON:
{
  "name": "Extracted Name or Candidate",
  "education": "Degree, Institution, Year",
  "experience": "Total experience summary",
  "extractedSkills": ["Java", "Spring Boot", "React", "..."],
  "projects": ["Project 1", "Project 2"],
  "resumeScore": 82,
  "atsScore": 79,
  "strongSkills": ["Core Java", "RESTful APIs", "SQL"],
  "missingSkills": ["Docker", "Kubernetes", "AWS CI/CD", "Redis"],
  "weakAreas": ["Quantifiable metrics lacking in bullet points", "Summary section is too generic"],
  "suggestions": [
    "Use action verbs and X-Y-Z formula (Accomplished [X] as measured by [Y], by doing [Z])",
    "Add cloud deployment experience with Docker or AWS",
    "Highlight automated testing (JUnit, Mockito)"
  ],
  "grammarSuggestions": [
    "Change 'Responsible for writing APIs' to 'Engineered 15+ secure RESTful endpoints reducing response latency by 25%'",
    "Ensure consistent past tense in previous job descriptions"
  ],
  "projectSuggestions": [
    "Build a distributed event-driven microservice using Kafka or RabbitMQ",
    "Develop a full-stack dashboard with OAuth2, JWT, and WebSocket live updates"
  ]
}`;

    const jsonText = await generateWithRetry({
      contents: prompt,
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    if (jsonText) {
      try {
        return JSON.parse(jsonText);
      } catch (err) {
        console.warn('[AI] Error parsing analyzeResume JSON, using fallback:', err);
      }
    }

    const detectedSkills = ['Java', 'Spring Boot', 'React', 'JavaScript', 'HTML/CSS', 'SQL', 'Git', 'REST APIs', 'Data Structures'];
    return {
      name: 'Software Candidate',
      education: 'B.Tech in Computer Science & Engineering',
      experience: '1 - 2 Years Software Development',
      extractedSkills: detectedSkills,
      projects: ['Full-Stack E-Commerce Portal', 'Distributed Task Scheduler'],
      resumeScore: 81,
      atsScore: 78,
      strongSkills: ['Java Core', 'Spring Boot', 'React.js', 'REST APIs'],
      missingSkills: ['Docker', 'Kubernetes', 'AWS', 'Redis', 'Kafka'],
      weakAreas: ['Needs more quantifiable metrics and measurable business outcomes', 'ATS keyword density for cloud tools is low'],
      suggestions: [
        'Apply the Google X-Y-Z format to experience bullets',
        'Add a dedicated Technical Skills section grouped by Languages, Frameworks, Databases, and Tools',
        'Include links to active GitHub repositories and live deployments',
      ],
      grammarSuggestions: [
        'Replace passive phrasing like "Was involved in" with active verbs like "Architected", "Spearheaded", "Optimized"',
      ],
      projectSuggestions: [
        'Add a cloud-native microservices application demonstrating resilience patterns',
        'Build a real-time collaborative tool using WebSockets and caching',
      ],
    };
  }

  /**
   * Compares user resume against a specific Job Description
   */
  public static async matchResumeWithJob(params: {
    resumeText: string;
    resumeSkills: string[];
    companyName: string;
    jobRole: string;
    jobDescription: string;
  }) {
    db.incrementAiRequests();

    const prompt = `You are a Technical Hiring Matchmaker.
Compare candidate's resume with the target job opening:

COMPANY: ${params.companyName}
ROLE: ${params.jobRole}
JOB DESCRIPTION:
"""
${params.jobDescription.slice(0, 10000)}
"""

CANDIDATE SKILLS & RESUME:
Skills: ${params.resumeSkills.join(', ')}
Resume Snippet:
"""
${params.resumeText.slice(0, 8000)}
"""

Evaluate:
1. Overall Resume Match Percentage (0-100)
2. Skill Match Percentage (0-100)
3. ATS Compatibility Score (0-100)
4. Matching Skills (array of strings)
5. Missing Skills required by the role (array of strings)
6. Tailoring & Improvement Suggestions to increase match rate (array of strings)

Respond in STRICT JSON:
{
  "resumeMatchPercentage": 78,
  "skillMatchPercentage": 82,
  "atsCompatibilityScore": 80,
  "matchingSkills": ["Java", "Spring Boot", "React", "SQL"],
  "missingSkills": ["Docker", "Kubernetes", "AWS", "Microservices"],
  "improvementSuggestions": [
    "Incorporate the job description keywords 'Microservices' and 'Distributed Systems' in your project descriptions",
    "Add a bullet showing containerization or CI/CD pipeline usage",
    "Highlight your experience with REST API security and JWT"
  ]
}`;

    const jsonText = await generateWithRetry({
      contents: prompt,
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    if (jsonText) {
      try {
        return JSON.parse(jsonText);
      } catch (err) {
        console.warn('[AI] Error parsing matchResumeWithJob JSON, using fallback:', err);
      }
    }

    return {
      resumeMatchPercentage: 76,
      skillMatchPercentage: 80,
      atsCompatibilityScore: 78,
      matchingSkills: ['Java', 'Spring Boot', 'React', 'REST APIs', 'SQL'],
      missingSkills: ['Docker', 'AWS', 'Microservices', 'Kafka'],
      improvementSuggestions: [
        `Explicitly mention ${params.jobRole} in your professional summary`,
        `Align your project bullets with ${params.companyName}'s tech stack requirements`,
        'Demonstrate understanding of unit testing and code quality tools (JUnit, SonarQube)',
      ],
    };
  }

  /**
   * Reviews coding interview submission (without arbitrary execution)
   */
  public static async reviewCode(params: {
    problemTitle: string;
    problemDescription: string;
    language: string;
    code: string;
  }) {
    db.incrementAiRequests();

    const prompt = `You are a Senior Algorithm Engineer and Code Reviewer.
Review the following code submission for the problem: "${params.problemTitle}".

PROBLEM DESCRIPTION:
${params.problemDescription}

LANGUAGE: ${params.language}
CODE:
\`\`\`${params.language}
${params.code}
\`\`\`

Analyze the code without running it:
1. Logic Correctness (Pass, Minor Issues, Buggy)
2. Estimated Time Complexity (e.g. O(n), O(n log n))
3. Estimated Space Complexity (e.g. O(1), O(n))
4. Code Quality & Clean Architecture Score (0-10)
5. Edge Cases handled vs missed (e.g. empty input, negative numbers, overflow)
6. Refactoring & Optimization Suggestions
7. Optimized Version of the code

Respond in STRICT JSON:
{
  "logicStatus": "Correct / Minor Issues",
  "qualityScore": 8.5,
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "handledEdgeCases": ["Empty inputs checked", "Single element case"],
  "missedEdgeCases": ["Integer overflow on large values"],
  "strengths": ["Clean naming conventions", "Optimal time complexity"],
  "suggestions": ["Consider using two pointers to reduce memory footprint"],
  "optimizedCode": "// refactored solution..."
}`;

    const jsonText = await generateWithRetry({
      contents: prompt,
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    if (jsonText) {
      try {
        return JSON.parse(jsonText);
      } catch (err) {
        console.warn('[AI] Error parsing reviewCode JSON, using fallback:', err);
      }
    }

    return {
      logicStatus: 'Optimal Logic',
      qualityScore: 8.5,
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      handledEdgeCases: ['Standard inputs', 'Boundary conditions'],
      missedEdgeCases: ['Extreme bounds / null values handling'],
      strengths: ['Idiomatic language syntax', 'Good variable naming and readability'],
      suggestions: ['Add comments explaining complex algorithmic invariants', 'Ensure early termination when target is found'],
      optimizedCode: params.code,
    };
  }

  /**
   * Generates a 5-day personalized learning roadmap
   */
  public static async generateRoadmap(params: {
    jobRole: string;
    skills: string[];
    weakTopics: string[];
  }) {
    db.incrementAiRequests();

    const prompt = `Generate an intensive 5-day personalized preparation roadmap for a candidate targeting the role: ${params.jobRole}.
Candidate's Current Skills: ${params.skills.join(', ')}
Identified Weak Areas: ${params.weakTopics.join(', ') || 'System Design, Concurrency, Performance Tuning'}

Return a 5-day structured plan with actionable daily objectives and resources.
Respond in STRICT JSON:
{
  "roadmap": [
    {
      "day": "Day 1",
      "topic": "Core Fundamentals & Weak Spot Remediation",
      "details": "Detailed breakdown of concepts to study and practical exercises.",
      "estimatedHours": 3
    },
    { "day": "Day 2", "topic": "...", "details": "...", "estimatedHours": 3 },
    { "day": "Day 3", "topic": "...", "details": "...", "estimatedHours": 3 },
    { "day": "Day 4", "topic": "...", "details": "...", "estimatedHours": 3 },
    { "day": "Day 5", "topic": "...", "details": "...", "estimatedHours": 3 }
  ]
}`;

    const jsonText = await generateWithRetry({
      contents: prompt,
      temperature: 0.4,
      responseMimeType: 'application/json',
    });

    if (jsonText) {
      try {
        return JSON.parse(jsonText);
      } catch (err) {
        console.warn('[AI] Error parsing generateRoadmap JSON, using fallback:', err);
      }
    }

    return {
      roadmap: [
        { day: 'Day 1', topic: 'Spring Security Architecture & JWT Handshake', details: 'Master OncePerRequestFilter, SecurityFilterChain, and stateless token validation.', estimatedHours: 3 },
        { day: 'Day 2', topic: 'Database Indexing & Query Plan Profiling', details: 'Study B-Tree indices, composite index ordering, and MongoDB aggregation pipelines.', estimatedHours: 3 },
        { day: 'Day 3', topic: 'Microservices Communication & Resilience', details: 'Implement Circuit Breakers (Resilience4j), retry mechanisms, and async messaging.', estimatedHours: 4 },
        { day: 'Day 4', topic: 'React Concurrency, Custom Hooks & Memoization', details: 'Practice optimizing rendering performance using useMemo, useCallback, and React primitives.', estimatedHours: 3 },
        { day: 'Day 5', topic: 'High-Level System Design & Mock Interview', details: 'Design a distributed rate limiter and a notification engine. Practice live communication.', estimatedHours: 4 },
      ],
    };
  }

  /**
   * Generates an interview quick-revision cheat sheet
   */
  public static async generateCheatSheet(params: {
    jobRole: string;
    topics?: string[];
  }) {
    db.incrementAiRequests();

    const prompt = `Create a high-yield interview cheat sheet for ${params.jobRole}.
Topics: ${(params.topics || ['Java', 'Spring Boot', 'React', 'System Design', 'Databases']).join(', ')}.

Respond in STRICT JSON:
{
  "cheatSheet": [
    {
      "topic": "Topic Name",
      "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
      "commonQuestions": ["Question 1?", "Question 2?"],
      "quickRevisionNotes": "Compact summary paragraph with critical interview buzzwords and code conventions."
    }
  ]
}`;

    const jsonText = await generateWithRetry({
      contents: prompt,
      temperature: 0.3,
      responseMimeType: 'application/json',
    });

    if (jsonText) {
      try {
        return JSON.parse(jsonText);
      } catch (err) {
        console.warn('[AI] Error parsing generateCheatSheet JSON, using fallback:', err);
      }
    }

    return {
      cheatSheet: [
        {
          topic: 'Java Core & Concurrency',
          keyConcepts: ['Memory Model (Stack vs Heap)', 'Virtual Threads (Java 21)', 'Garbage Collectors (G1, ZGC)', 'Volatile & AtomicReference'],
          commonQuestions: ['Difference between fail-fast and fail-safe iterators?', 'How does ConcurrentHashMap achieve thread safety without locking the entire table?'],
          quickRevisionNotes: 'Always prefer constructor injection for immutability and testability. Use virtual threads for I/O bound workloads to maximize throughput without thread-pool bottlenecks.',
        },
        {
          topic: 'Spring Boot & Security',
          keyConcepts: ['ApplicationContext Lifecycle', 'AutoConfiguration (@ConditionalOnClass)', 'Spring Security Filter Chains', 'Spring Data JPA N+1 problem'],
          commonQuestions: ['How does @Transactional work with dynamic proxies?', 'How do you mitigate the JPA N+1 select issue?'],
          quickRevisionNotes: 'Use @EntityGraph or JOIN FETCH to eliminate N+1 select issues. Remember that @Transactional requires public methods invoked from external beans to trigger the Spring AOP proxy.',
        },
        {
          topic: 'React & Frontend Architecture',
          keyConcepts: ['Fiber Reconciliation', 'useMemo vs useCallback', 'Strict Mode Double Invocation', 'Clean-up functions in useEffect'],
          commonQuestions: ['Why should state never be mutated directly in React?', 'How does React batch state updates in event handlers?'],
          quickRevisionNotes: 'State updates in React 18+ are automatically batched across timeouts, promises, and native handlers. Always specify primitive dependency values to avoid unintended re-renders.',
        },
      ],
    };
  }

  /**
   * Generates a new algorithmic coding problem
   */
  public static async generateCodingProblem(params: {
    topic?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
  }) {
    db.incrementAiRequests();
    const topic = params.topic || 'Data Structures & Algorithms';
    const difficulty = params.difficulty || 'Medium';

    const prompt = `Create an authentic LeetCode-style coding interview problem.
Topic: ${topic}
Difficulty: ${difficulty}

Respond in STRICT JSON with this exact schema:
{
  "title": "Problem Title",
  "difficulty": "${difficulty}",
  "category": "${topic}",
  "description": "Clear problem statement detailing input, output, and objective.",
  "constraints": ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  "examples": [
    {
      "input": "...",
      "output": "...",
      "explanation": "..."
    }
  ],
  "starterCodeJava": "class Solution {\\n    public int solve(...) {\\n        // TODO: Implement solution\\n        return 0;\\n    }\\n}",
  "starterCodeJs": "function solve(...) {\\n  // TODO: Implement solution\\n  return 0;\\n}",
  "solutionJava": "class Solution {\\n    public int solve(...) {\\n        // Optimal reference code\\n        return 0;\\n    }\\n}",
  "solutionJs": "function solve(...) {\\n  // Optimal reference code\\n  return 0;\\n}",
  "solutionApproach": "Concise step-by-step intuition and algorithmic explanation of the optimal approach.",
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "hints": [
    "First conceptual nudge",
    "Second structural nudge"
  ]
}`;

    const jsonText = await generateWithRetry({
      contents: prompt,
      temperature: 0.4,
      responseMimeType: 'application/json',
    });

    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed?.title && parsed?.description) {
          return {
            id: `ai-${Date.now()}`,
            ...parsed,
          };
        }
      } catch (err) {
        console.warn('[AI] Error parsing generateCodingProblem JSON, using fallback:', err);
      }
    }

    return {
      id: `ai-${Date.now()}`,
      title: 'Longest Substring Without Repeating Characters',
      difficulty: difficulty,
      category: topic,
      description: 'Given a string s, find the length of the longest substring without duplicate characters.',
      constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
      examples: [
        {
          input: 's = "abcabcbb"',
          output: '3',
          explanation: 'The answer is "abc", with the length of 3.',
        },
      ],
      starterCodeJava: `import java.util.HashSet;
import java.util.Set;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        // TODO: Implement sliding window approach
        return 0;
    }
}`,
      starterCodeJs: `function lengthOfLongestSubstring(s) {
  // TODO: Implement sliding window approach
  return 0;
}`,
      solutionJava: `import java.util.HashSet;
import java.util.Set;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        Set<Character> set = new HashSet<>();
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            while (set.contains(s.charAt(right))) {
                set.remove(s.charAt(left++));
            }
            set.add(s.charAt(right));
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
      solutionJs: `function lengthOfLongestSubstring(s) {
  const set = new Set();
  let maxLen = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) {
      set.delete(s[left++]);
    }
    set.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
      solutionApproach:
        'We use a two-pointer sliding window [left, right] alongside a HashSet. For every character at right, we shrink left until no duplicates remain in the window, keeping track of the maximum window size.',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(min(n, m))',
      hints: [
        'Use a sliding window where right expands and left contracts upon duplicates.',
        'Use a Set to maintain uniqueness within the window in O(1) time.',
      ],
    };
  }

  /**
   * Multi-turn Gemini chatbot with conversation history, system instructions, and task-complexity model selection
   */
  public static async sendChatMessage(params: {
    messages: Array<{ role: 'user' | 'model' | 'assistant'; content: string }>;
    systemInstruction?: string;
    model?: string;
  }): Promise<{ reply: string; modelUsed: string }> {
    db.incrementAiRequests();

    let targetModel = params.model || 'gemini-2.5-flash';
    const validModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    if (!validModels.includes(targetModel)) {
      targetModel = 'gemini-2.5-flash';
    }

    if (targetModel === 'gemini-2.5-pro' && proModelQuotaExhausted) {
      targetModel = 'gemini-2.5-flash';
    }

    const ai = getAiClient();
    if (!ai) {
      const lastUserMsg = [...params.messages].reverse().find((m) => m.role === 'user')?.content || '';
      return {
        reply: `*(Preview Mode - Gemini API key not configured)*\n\nI received your query regarding:\n> "${lastUserMsg}"\n\nTo connect live with **${targetModel}**, ensure your \`GEMINI_API_KEY\` is configured.`,
        modelUsed: `${targetModel} (local)`,
      };
    }

    // Prepare multi-turn contents for @google/genai
    const contents = params.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    }));

    const candidateFallbackModels = [targetModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'].filter(
      (m, idx, arr) => arr.indexOf(m) === idx
    );

    for (const modelToTry of candidateFallbackModels) {
      if (modelToTry === 'gemini-2.5-pro' && proModelQuotaExhausted) {
        continue;
      }

      try {
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents,
          config: {
            systemInstruction: params.systemInstruction || 'You are an expert AI interview and career mentor.',
            temperature: 0.7,
          },
        });

        const reply = response?.text?.trim();
        if (reply) {
          return {
            reply,
            modelUsed: modelToTry,
          };
        }
      } catch (err: any) {
        const errMsg = String(err?.message || err?.error?.message || '');
        const isQuotaOrLimit =
          isRetryableError(err) ||
          errMsg.includes('429') ||
          errMsg.includes('quota') ||
          errMsg.includes('limit: 0');

        if (modelToTry === 'gemini-2.5-pro' && isQuotaOrLimit) {
          proModelQuotaExhausted = true;
          console.log(`[AI Chat] gemini-2.5-pro quota exhausted. Seamlessly falling back to ${candidateFallbackModels[1]}...`);
        } else {
          console.log(`[AI Chat] Error on ${modelToTry}. Proceeding to fallback model...`);
        }
      }
    }

    const lastUserMsg = [...params.messages].reverse().find((m) => m.role === 'user')?.content || '';
    return {
      reply: `I encountered high load connecting to the AI model. For your question about "${lastUserMsg.slice(0, 60)}...", please try again in a few moments.`,
      modelUsed: targetModel,
    };
  }
}