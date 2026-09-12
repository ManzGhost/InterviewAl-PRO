export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'InterviewAI REST API Documentation',
    version: '1.0.0',
    description: 'Production-ready REST APIs for InterviewAI – AI-Powered Smart Interview Preparation & Career Intelligence Platform.',
    contact: {
      name: 'InterviewAI Engineering Team',
      email: 'engineering@interviewai.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Base URL',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new candidate or admin account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Alex Johnson' },
                  email: { type: 'string', example: 'alex@university.edu' },
                  password: { type: 'string', example: 'Pass@12345' },
                  college: { type: 'string', example: 'Stanford University' },
                  education: { type: 'string', example: 'B.Tech in Computer Science' },
                  skills: { type: 'array', items: { type: 'string' } },
                  preferredJobRole: { type: 'string', example: 'Java Full Stack Developer' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful with access and refresh tokens' },
          400: { description: 'Missing required fields' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user with email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'alex@university.edu' },
                  password: { type: 'string', example: 'Pass@12345' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authentication successful with JWT' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/users/profile': {
      get: {
        summary: 'Fetch current authenticated user profile',
        tags: ['User Profile'],
        responses: {
          200: { description: 'User profile retrieved successfully' },
        },
      },
      put: {
        summary: 'Update candidate profile, skills, and links',
        tags: ['User Profile'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  college: { type: 'string' },
                  education: { type: 'string' },
                  skills: { type: 'array', items: { type: 'string' } },
                  preferredJobRole: { type: 'string' },
                  linkedInUrl: { type: 'string' },
                  gitHubUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated successfully' },
        },
      },
    },
    '/resume/upload': {
      post: {
        summary: 'Upload resume file and trigger Gemini ATS analysis',
        tags: ['Resume'],
        responses: {
          201: { description: 'Resume parsed and analyzed with ATS score' },
        },
      },
    },
    '/interviews/start': {
      post: {
        summary: 'Initialize an AI mock interview session and generate first question',
        tags: ['Mock Interview'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jobRole: { type: 'string', example: 'Java Full Stack Developer' },
                  interviewType: { type: 'string', example: 'Technical Interview' },
                  difficulty: { type: 'string', example: 'Intermediate' },
                  companyName: { type: 'string', example: 'Google' },
                  totalQuestions: { type: 'number', example: 5 },
                  mode: { type: 'string', example: 'Text' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Interview started with question 1 generated' },
        },
      },
    },
    '/interviews/{id}/answer': {
      post: {
        summary: 'Submit answer for real-time Gemini evaluation and adaptive next question',
        tags: ['Mock Interview'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Answer graded with detailed breakdown and next question' },
        },
      },
    },
    '/dashboard/stats': {
      get: {
        summary: 'Retrieve dashboard metrics, streak, XP, and completed counts',
        tags: ['Dashboard'],
        responses: {
          200: { description: 'Stats payload' },
        },
      },
    },
    '/mcq/questions': {
      get: {
        summary: 'Fetch multiple-choice practice questions by category',
        tags: ['MCQ Practice'],
        responses: {
          200: { description: 'Questions array' },
        },
      },
    },
    '/admin/dashboard': {
      get: {
        summary: 'Admin platform metrics and telemetry overview',
        tags: ['Admin'],
        responses: {
          200: { description: 'Admin statistics' },
          403: { description: 'Forbidden' },
        },
      },
    },
  },
};
