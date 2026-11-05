/**
 * Skill Gap & Actionable Learning Roadmap Engine
 * Analyzes missing skills for a target job opening and generates structured,
 * step-by-step roadmaps, hands-on portfolio projects, time-to-close estimates,
 * and ATS-ready resume bullets.
 */

import type { JobMatchAlert, SkillGapAnalysis, SkillGapItem } from '../types'

interface CuratedSkillTemplate {
  category: string
  timeToClose: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  whyItMatters: string
  steps: Array<{
    step: number
    title: string
    description: string
    actionItem: string
    recommendedProject: string
    resumeBulletExample: string
  }>
  resources: Array<{ name: string; url: string; free: boolean }>
  resumeBulletExample: string
}

export const CURATED_SKILL_ROADMAPS: Record<string, CuratedSkillTemplate> = {
  docker: {
    category: 'DevOps & Infrastructure',
    timeToClose: '4-7 days',
    difficulty: 'Intermediate',
    whyItMatters: 'Standardizes environments across dev, staging, and production; required for modern cloud deployments.',
    steps: [
      {
        step: 1,
        title: 'Core Container Concepts',
        description: 'Understand Images, Containers, Dockerfiles, Volumes, and Network isolation.',
        actionItem: 'Write a multi-stage Dockerfile for a React/Node app to minimize production image size.',
        recommendedProject: 'Containerized Full-Stack App (Frontend + API + PostgreSQL)',
        resumeBulletExample: 'Containerized frontend and backend services using multi-stage Dockerfiles, reducing build image size by 65%.',
      },
      {
        step: 2,
        title: 'Multi-Container Orchestration',
        description: 'Master docker-compose.yml for local multi-service orchestration with persistent volumes.',
        actionItem: 'Orchestrate an API, Redis cache, and Postgres DB with environment variables and healthchecks.',
        recommendedProject: 'Docker Compose Local Microservices Stack',
        resumeBulletExample: 'Orchestrated multi-service local development environment using Docker Compose with Redis caching and volume persistence.',
      },
      {
        step: 3,
        title: 'CI/CD & Registry Deployment',
        description: 'Push images to Docker Hub or GitHub Container Registry via GitHub Actions.',
        actionItem: 'Build automated CI workflow that tests, builds, and pushes tagged containers on every release.',
        recommendedProject: 'Automated GitHub Actions Container Deployment Pipeline',
        resumeBulletExample: 'Automated container build and release pipeline with GitHub Actions, pushing versioned images to GHCR on main branch merges.',
      },
    ],
    resources: [
      { name: 'Docker Official Get Started Guide', url: 'https://docs.docker.com/get-started/', free: true },
      { name: 'Docker Roadmap & Cheat Sheet (roadmap.sh)', url: 'https://roadmap.sh/docker', free: true },
      { name: 'FreeCodeCamp Docker 2-Hour Practical Course', url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', free: true },
    ],
    resumeBulletExample: 'Containerized microservices with multi-stage Docker builds and orchestrated local staging environments using Docker Compose.',
  },

  kubernetes: {
    category: 'Cloud & Orchestration',
    timeToClose: '1-2 weeks',
    difficulty: 'Advanced',
    whyItMatters: 'Industry-standard container orchestration platform used by mid-size and enterprise companies to manage high availability.',
    steps: [
      {
        step: 1,
        title: 'Pods, Deployments & Services',
        description: 'Learn fundamental declarative Kubernetes objects: Pods, Deployments, ReplicaSets, and ClusterIP/NodePort Services.',
        actionItem: 'Deploy a containerized application to a local Minikube or Kind cluster.',
        recommendedProject: 'Minikube Resilient Web App Deployment',
        resumeBulletExample: 'Deployed and scaled containerized web services on Kubernetes (K8s) with automated rolling updates and zero-downtime restarts.',
      },
      {
        step: 2,
        title: 'ConfigMaps, Secrets & Ingress',
        description: 'Manage decoupled environment configuration, sensitive credentials, and HTTP routing rules.',
        actionItem: 'Configure NGINX Ingress controller with SSL termination and secret injection.',
        recommendedProject: 'Multi-Tenant Ingress & Config-driven Web Cluster',
        resumeBulletExample: 'Configured Kubernetes Ingress routing, ConfigMaps, and encrypted Secrets for multi-environment cloud deployments.',
      },
      {
        step: 3,
        title: 'Horizontal Pod Autoscaling (HPA)',
        description: 'Implement automated autoscaling based on CPU and memory thresholds.',
        actionItem: 'Stress test an API deployment and observe HPA scale pods dynamically from 2 to 10 instances.',
        recommendedProject: 'Autoscaling Load-Tested Cloud Service',
        resumeBulletExample: 'Implemented Kubernetes Horizontal Pod Autoscaler (HPA) policies maintaining 99.9% availability during simulated peak traffic spikes.',
      },
    ],
    resources: [
      { name: 'Kubernetes Official Interactive Basics', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', free: true },
      { name: 'Kubernetes Roadmap (roadmap.sh)', url: 'https://roadmap.sh/kubernetes', free: true },
      { name: 'Kubernetes Course by TechWorld with Nana', url: 'https://www.youtube.com/watch?v=X48VuDVv0do', free: true },
    ],
    resumeBulletExample: 'Architected Kubernetes deployment manifests with automated rolling updates, Ingress controllers, and Horizontal Pod Autoscaling.',
  },

  typescript: {
    category: 'Programming & Web',
    timeToClose: '3-5 days',
    difficulty: 'Beginner',
    whyItMatters: 'Prevents runtime bugs, enables superior autocomplete, and is now demanded by 90%+ of modern React/Node teams.',
    steps: [
      {
        step: 1,
        title: 'Type Inference, Interfaces & Generics',
        description: 'Master strict type annotations, discriminated unions, utility types (Pick, Omit, Partial), and reusable generics.',
        actionItem: 'Refactor an existing JavaScript React or Node project to strict TypeScript with zero `any` types.',
        recommendedProject: 'Type-Safe REST API Client & Form Validation Library',
        resumeBulletExample: 'Converted 15+ legacy JavaScript modules to strict TypeScript, eliminating type-related runtime errors and boosting dev velocity.',
      },
      {
        step: 2,
        title: 'Type-Safe State & API Schemas',
        description: 'Integrate Zod or Yup schema validation to guarantee runtime and compile-time API safety.',
        actionItem: 'Build a schema-driven form and API fetcher that infers TypeScript types directly from validation schemas.',
        recommendedProject: 'Full-Stack Type-Safe Dashboard with Zod & React Hook Form',
        resumeBulletExample: 'Implemented end-to-end type safety across client and server with Zod schemas and TypeScript generics.',
      },
    ],
    resources: [
      { name: 'TypeScript Official Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', free: true },
      { name: 'Total TypeScript Interactive Tutorials by Matt Pocock', url: 'https://www.totaltypescript.com/tutorials', free: true },
      { name: 'TypeScript Roadmap (roadmap.sh)', url: 'https://roadmap.sh/typescript', free: true },
    ],
    resumeBulletExample: 'Engineered type-safe client applications using TypeScript and Zod validation, ensuring 100% compile-time type coverage.',
  },

  nextjs: {
    category: 'Frontend & Full-Stack',
    timeToClose: '4-7 days',
    difficulty: 'Intermediate',
    whyItMatters: 'The de-facto standard production framework for React, combining Server Components, SSR, static generation, and API routes.',
    steps: [
      {
        step: 1,
        title: 'App Router & React Server Components',
        description: 'Understand Server vs Client Components, streaming with Suspense, and file-system layout routing.',
        actionItem: 'Build a Next.js 14/15 application utilizing Server Components for zero-bundle-size database querying.',
        recommendedProject: 'Server-Rendered E-Commerce Product Catalog or Blog',
        resumeBulletExample: 'Architected high-performance Next.js web application utilizing React Server Components (RSC) to minimize initial JS payload by 40%.',
      },
      {
        step: 2,
        title: 'Server Actions & Caching Strategies',
        description: 'Master revalidatePath, revalidateTag, unstable_cache, and mutation with Server Actions.',
        actionItem: 'Implement optimistic UI updates with Server Actions for snappy user interactions.',
        recommendedProject: 'Collaborative Real-time Dashboard with Server Actions',
        resumeBulletExample: 'Implemented mutation workflows with Next.js Server Actions and on-demand cache revalidation, achieving sub-100ms UI updates.',
      },
    ],
    resources: [
      { name: 'Next.js Official Interactive Learn Course', url: 'https://nextjs.org/learn', free: true },
      { name: 'Next.js 14 Full Course by FreeCodeCamp', url: 'https://www.youtube.com/watch?v=wm5gMKuwSYk', free: true },
    ],
    resumeBulletExample: 'Developed production-grade Next.js application leveraging App Router, Server Components, and optimized caching strategies.',
  },

  aws: {
    category: 'Cloud Infrastructure',
    timeToClose: '1-2 weeks',
    difficulty: 'Intermediate',
    whyItMatters: 'Leading cloud provider powering the majority of modern production applications.',
    steps: [
      {
        step: 1,
        title: 'S3, CloudFront & Static Hosting',
        description: 'Deploy static web assets to S3 buckets fronted by CloudFront CDN with SSL and caching.',
        actionItem: 'Host a modern React build on S3 + CloudFront with custom domain routing and invalidation scripts.',
        recommendedProject: 'Global CDN-Accelerated Static Web Application',
        resumeBulletExample: 'Deploys web assets to Amazon S3 distributed globally via CloudFront CDN, achieving sub-second worldwide load times.',
      },
      {
        step: 2,
        title: 'Serverless Compute (Lambda + API Gateway)',
        description: 'Build serverless REST endpoints without managing EC2 instances.',
        actionItem: 'Deploy a Node.js Lambda function connected to DynamoDB through Amazon API Gateway.',
        recommendedProject: 'Serverless Thumbnail Generator or Webhook Processor',
        resumeBulletExample: 'Architected serverless microservices with AWS Lambda, API Gateway, and S3 event triggers to process asynchronous user uploads.',
      },
      {
        step: 3,
        title: 'IAM, RDS & VPC Security',
        description: 'Configure least-privilege IAM roles, security groups, and managed PostgreSQL with Amazon RDS.',
        actionItem: 'Secure a database inside a private subnet and connect via an application server in a public subnet.',
        recommendedProject: 'Production-ready VPC with RDS Postgres & EC2 Bastion',
        resumeBulletExample: 'Implemented secure AWS VPC architectures with managed RDS PostgreSQL and least-privilege IAM security policies.',
      },
    ],
    resources: [
      { name: 'AWS Skill Builder Free Training', url: 'https://explore.skillbuilder.aws/', free: true },
      { name: 'AWS Certified Cloud Practitioner FreeCodeCamp', url: 'https://www.youtube.com/watch?v=SOTamWNgDKc', free: true },
      { name: 'AWS Architecture Center & Whitepapers', url: 'https://aws.amazon.com/architecture/', free: true },
    ],
    resumeBulletExample: 'Architected and deployed scalable AWS cloud infrastructure utilizing S3, CloudFront, Lambda, and managed RDS PostgreSQL.',
  },

  redis: {
    category: 'Databases & Performance',
    timeToClose: '3-5 days',
    difficulty: 'Intermediate',
    whyItMatters: 'In-memory key-value store critical for sub-millisecond caching, rate-limiting, and session management.',
    steps: [
      {
        step: 1,
        title: 'In-Memory Caching & TTLs',
        description: 'Implement cache-aside pattern to reduce expensive database queries by 80%+.',
        actionItem: 'Wrap database read queries with Redis cache checks and configurable TTL invalidation.',
        recommendedProject: 'High-Throughput Cached API with Express & Redis',
        resumeBulletExample: 'Integrated Redis cache-aside layer across high-traffic REST endpoints, reducing average database query latency from 180ms to 8ms.',
      },
      {
        step: 2,
        title: 'Rate Limiting & Pub/Sub Messaging',
        description: 'Use Redis atomic operations (INCR) for token bucket rate limiting and pub/sub channels for real-time events.',
        actionItem: 'Build an API rate limiter middleware (100 req/min per IP) using Redis atomic keys.',
        recommendedProject: 'API Rate Limiter & Multi-Client Notification Broadcaster',
        resumeBulletExample: 'Built distributed rate-limiting middleware and real-time pub/sub notification service using Redis.',
      },
    ],
    resources: [
      { name: 'Redis University Free Courses', url: 'https://university.redis.com/', free: true },
      { name: 'Redis Quickstart & Data Structures', url: 'https://redis.io/docs/latest/develop/get-started/', free: true },
    ],
    resumeBulletExample: 'Optimized API response latency by 85% by implementing Redis in-memory caching and distributed token-bucket rate limiting.',
  },

  postgresql: {
    category: 'Databases & Backend',
    timeToClose: '4-7 days',
    difficulty: 'Intermediate',
    whyItMatters: 'The gold-standard relational database for web applications, featuring advanced indexing, JSONB, and ACID guarantees.',
    steps: [
      {
        step: 1,
        title: 'Schema Design, Foreign Keys & Migrations',
        description: 'Design normalized relational schemas with appropriate constraints and migration tools (Prisma / Drizzle / Knex).',
        actionItem: 'Design a clean 5-table schema with indexed foreign keys, cascade rules, and automated migration scripts.',
        recommendedProject: 'Relational SaaS Database Schema with Prisma or Drizzle',
        resumeBulletExample: 'Designed relational database schemas in PostgreSQL with automated migration pipelines and strict referential integrity.',
      },
      {
        step: 2,
        title: 'Indexing, EXPLAIN ANALYZE & Query Optimization',
        description: 'Master B-tree vs GIN indexes, composite indexes, and identifying sequential scans using EXPLAIN ANALYZE.',
        actionItem: 'Profile a slow multi-join query and optimize it with an index to drop execution time under 15ms.',
        recommendedProject: 'High-Performance Search & Analytics Query Optimization Suite',
        resumeBulletExample: 'Optimized complex PostgreSQL queries and added composite indexes, reducing p95 database response times by 70%.',
      },
    ],
    resources: [
      { name: 'PostgreSQL Tutorial (postgresqltutorial.com)', url: 'https://www.postgresqltutorial.com/', free: true },
      { name: 'PostgreSQL Exercises Interactive Practice', url: 'https://pgexercises.com/', free: true },
    ],
    resumeBulletExample: 'Engineered robust PostgreSQL data models, optimizing complex joins and indexes for low-latency query execution.',
  },

  graphql: {
    category: 'APIs & Backend',
    timeToClose: '3-6 days',
    difficulty: 'Intermediate',
    whyItMatters: 'Enables clients to request exactly what they need, eliminating over-fetching and consolidating multiple REST round-trips.',
    steps: [
      {
        step: 1,
        title: 'Schemas, Resolvers & Mutations',
        description: 'Understand TypeDefs, Queries, Mutations, and how resolvers map to underlying data sources.',
        actionItem: 'Build a Apollo Server / Yoga GraphQL API with type-safe schemas.',
        recommendedProject: 'E-Commerce GraphQL API with Product & Cart Resolvers',
        resumeBulletExample: 'Implemented GraphQL API gateway with Apollo Server, consolidating 5+ disparate endpoints into a unified query schema.',
      },
      {
        step: 2,
        title: 'DataLoader & N+1 Problem Prevention',
        description: 'Solve the classic GraphQL N+1 problem using batching and memoization with DataLoader.',
        actionItem: 'Integrate DataLoader to batch database lookups across nested GraphQL query fields.',
        recommendedProject: 'Batch-Optimized Social Feed with DataLoader',
        resumeBulletExample: 'Eliminated N+1 query bottlenecks in GraphQL resolvers using DataLoader batching, reducing database round-trips by 80%.',
      },
    ],
    resources: [
      { name: 'GraphQL Official Introduction & Tutorial', url: 'https://graphql.org/learn/', free: true },
      { name: 'Apollo Odyssey Free Interactive GraphQL Training', url: 'https://www.apollographql.com/tutorials/', free: true },
    ],
    resumeBulletExample: 'Developed type-safe GraphQL APIs with Apollo Server and DataLoader, eliminating over-fetching and resolving N+1 query bottlenecks.',
  },

  cicd: {
    category: 'DevOps & Automation',
    timeToClose: '3-5 days',
    difficulty: 'Beginner',
    whyItMatters: 'Automates testing, linting, building, and deployment, ensuring bug-free and rapid team code delivery.',
    steps: [
      {
        step: 1,
        title: 'Automated Testing & Linting Workflows',
        description: 'Write GitHub Actions workflows that trigger on pull requests to run ESLint, Prettier, and Vitest/Jest.',
        actionItem: 'Create `.github/workflows/ci.yml` that blocks merging pull requests if tests or typecheck fails.',
        recommendedProject: 'Multi-Stage GitHub Actions Test & Lint Pipeline',
        resumeBulletExample: 'Implemented automated CI pipelines with GitHub Actions for automated typechecking, linting, and unit testing on every PR.',
      },
      {
        step: 2,
        title: 'Continuous Deployment & Preview Environments',
        description: 'Configure automated deployments to Vercel, Netlify, or AWS on merges to the main branch.',
        actionItem: 'Set up staging and production deployment steps with automated Slack/Telegram build alerts.',
        recommendedProject: 'Zero-Downtime Continuous Deployment Pipeline',
        resumeBulletExample: 'Built continuous delivery (CD) workflows with GitHub Actions to automate staging preview environments and production releases.',
      },
    ],
    resources: [
      { name: 'GitHub Actions Documentation & Quickstart', url: 'https://docs.github.com/en/actions/quickstart', free: true },
      { name: 'CI/CD Roadmap (roadmap.sh)', url: 'https://roadmap.sh/devops', free: true },
    ],
    resumeBulletExample: 'Built end-to-end CI/CD pipelines with GitHub Actions, automating test suites, code quality checks, and production deployments.',
  },

  python: {
    category: 'Programming & Data/AI',
    timeToClose: '4-7 days',
    difficulty: 'Beginner',
    whyItMatters: 'Dominant language for AI engineering, backend APIs (FastAPI), data science, and scripting.',
    steps: [
      {
        step: 1,
        title: 'FastAPI & Async Web Development',
        description: 'Learn modern Python 3.11+ type hints, Pydantic data validation, and asynchronous endpoints with FastAPI.',
        actionItem: 'Build a high-performance REST API with automatic OpenAPI documentation and JWT authentication.',
        recommendedProject: 'Asynchronous REST API with FastAPI, Pydantic & SQLAlchemy',
        resumeBulletExample: 'Developed high-concurrency RESTful microservices using Python and FastAPI with automated Pydantic schema validation.',
      },
      {
        step: 2,
        title: 'Data Manipulation & AI SDK Integration',
        description: 'Connect Python applications with Pandas, NumPy, or LLM APIs (OpenAI/Gemini).',
        actionItem: 'Build an automated text processor or data pipeline that extracts and structures unstructured text.',
        recommendedProject: 'AI Document Summarizer & Data Pipeline',
        resumeBulletExample: 'Engineered Python data processing pipeline leveraging async clients and AI APIs to process and summarize complex documents.',
      },
    ],
    resources: [
      { name: 'FastAPI Official Interactive Tutorial', url: 'https://fastapi.tiangolo.com/tutorial/', free: true },
      { name: 'Python Roadmap (roadmap.sh)', url: 'https://roadmap.sh/python', free: true },
      { name: 'Python for Beginners Full Course (FreeCodeCamp)', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', free: true },
    ],
    resumeBulletExample: 'Built asynchronous backend APIs with Python and FastAPI, implementing strict Pydantic schemas and automated OpenAPI documentation.',
  },
}

/**
 * Normalizes a skill name for lookup in the roadmap dictionary
 */
function normalizeKey(skill: string): string {
  const s = skill.toLowerCase().trim()
  if (s.includes('docker')) return 'docker'
  if (s.includes('k8s') || s.includes('kubernetes')) return 'kubernetes'
  if (s.includes('typescript') || s === 'ts') return 'typescript'
  if (s.includes('next') || s.includes('nextjs') || s.includes('next.js')) return 'nextjs'
  if (s.includes('aws') || s.includes('amazon web')) return 'aws'
  if (s.includes('redis')) return 'redis'
  if (s.includes('postgres') || s.includes('psql') || s.includes('sql')) return 'postgresql'
  if (s.includes('graphql')) return 'graphql'
  if (s.includes('ci/cd') || s.includes('github action') || s.includes('pipeline')) return 'cicd'
  if (s.includes('python')) return 'python'
  return s.replace(/[^a-z0-9]/g, '')
}

/**
 * Builds a default roadmap item for any missing skill not in the curated dictionary
 */
function buildGenericSkillRoadmap(skill: string, jobTitle = 'Software Engineer'): SkillGapItem {
  return {
    skill,
    category: 'Engineering & Domain Knowledge',
    timeToClose: '4-7 days',
    difficulty: 'Intermediate',
    whyItMatters: `Explicitly listed as a key requirement for ${jobTitle}; mastering it signals high alignment and readiness.`,
    steps: [
      {
        step: 1,
        title: `Core Fundamentals of ${skill}`,
        description: `Review official documentation, core architectural patterns, and standard practices for ${skill}.`,
        actionItem: `Build a quick sandbox prototype implementing the primary use-cases of ${skill}.`,
        recommendedProject: `Hands-on proof-of-concept project demonstrating ${skill} integration.`,
        resumeBulletExample: `Utilized ${skill} to implement scalable features adhering to industry best practices and clean code standards.`,
      },
      {
        step: 2,
        title: `Practical Implementation & Portfolio Proof`,
        description: `Incorporate ${skill} into an end-to-end full stack project and document your architectural decisions on GitHub.`,
        actionItem: `Write a comprehensive README with architecture diagrams and performance benchmarks.`,
        recommendedProject: `Production-ready application featuring ${skill}`,
        resumeBulletExample: `Integrated ${skill} across core system workflows, improving application reliability and developer maintainability.`,
      },
    ],
    resources: [
      { name: `${skill} Official Documentation`, url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' official documentation tutorial')}`, free: true },
      { name: `Developer Roadmaps (roadmap.sh)`, url: 'https://roadmap.sh', free: true },
      { name: `FreeCodeCamp YouTube Guides`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + ' crash course')}`, free: true },
    ],
    resumeBulletExample: `Applied ${skill} to develop robust system features, ensuring maintainability, testability, and operational stability.`,
  }
}

/**
 * Evaluates skill gaps and produces a structured roadmap analysis for a job opening
 */
export function buildSkillGapAnalysis(alert: JobMatchAlert, candidateBackground?: string): SkillGapAnalysis {
  const missing = alert.missingSkills || []
  const isNearMiss = alert.score >= 60 && alert.score <= 84 && missing.length > 0

  const roadmaps: SkillGapItem[] = missing.map((skill) => {
    const key = normalizeKey(skill)
    const template = CURATED_SKILL_ROADMAPS[key]

    if (template) {
      return {
        skill,
        category: template.category,
        timeToClose: template.timeToClose,
        difficulty: template.difficulty,
        whyItMatters: template.whyItMatters,
        steps: template.steps,
        resources: template.resources,
        resumeBulletExample: template.resumeBulletExample,
      }
    }

    return buildGenericSkillRoadmap(skill, alert.opening.title)
  })

  let strategicAdvice = ''
  if (isNearMiss) {
    strategicAdvice = `You're in the High-Potential "Near-Miss" bracket (${alert.score}% match)! You already possess ${alert.matchingSkills.length} core requirements. By spending just 1–2 weeks bridging ${missing.slice(0, 2).join(' and ')}, you will qualify for top-tier interview consideration.`
  } else if (alert.score >= 85) {
    strategicAdvice = `Excellent match (${alert.score}%)! You meet virtually all requirements. Reviewing the minor gaps below will help you answer advanced technical interview questions with confidence.`
  } else {
    strategicAdvice = `This position has several new skill domains for you. Follow the sequential roadmap below to expand your stack systematically.`
  }

  return {
    jobId: alert.opening.id,
    jobTitle: alert.opening.title,
    company: alert.opening.company,
    overallMatchScore: alert.score,
    isNearMiss,
    matchingSkills: alert.matchingSkills,
    missingSkills: missing,
    roadmaps,
    strategicAdvice,
  }
}

