/**
 * Curated Database of Active Job Openings
 * Spans Frontend, Full-Stack, Backend, AI/ML, Cloud/DevOps, Design, and Product.
 */

import type { JobOpening } from '../types'

export const CURATED_JOB_OPENINGS: JobOpening[] = [
  {
    id: 'job-str-01',
    title: 'Senior Full-Stack Engineer',
    company: 'Stripe',
    location: 'Remote (US / Global)',
    type: 'Full-time',
    department: 'Engineering',
    salaryRange: '$165,000 - $210,000',
    description:
      'We are looking for a Senior Full-Stack Engineer to build reliable, high-volume developer experiences and payment infrastructure. You will work across modern React, TypeScript, Node.js, and distributed systems to build intuitive interfaces and bulletproof APIs.',
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'PostgreSQL', 'System Design'],
    preferredSkills: ['Tailwind CSS', 'AWS', 'GraphQL', 'Next.js'],
    applyUrl: 'https://stripe.com/jobs',
    postedDate: '2026-11-04',
    featured: true,
  },
  {
    id: 'job-lin-02',
    title: 'Frontend React Engineer',
    company: 'Linear',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    department: 'Product Engineering',
    salaryRange: '$140,000 - $185,000',
    description:
      'Linear is hiring a Frontend Engineer obsessed with craft, speed, and fluid user interactions. You will own core product surfaces, optimize client performance, and build keyboard-first workflows using React, TypeScript, and modern CSS.',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Performance Optimization', 'Web Standards'],
    preferredSkills: ['Vite', 'State Management', 'WebSockets', 'UI/UX Design'],
    applyUrl: 'https://linear.app/careers',
    postedDate: '2026-11-05',
    featured: true,
  },
  {
    id: 'job-ver-03',
    title: 'AI Solutions & Frontend Architect',
    company: 'Vercel',
    location: 'Remote / San Francisco',
    type: 'Full-time',
    department: 'AI & Developer Experience',
    salaryRange: '$170,000 - $220,000',
    description:
      'Help shape the future of AI-powered web applications. In this role, you will build next-generation interfaces integrating Large Language Models, streaming responses, and edge compute for millions of developers.',
    requiredSkills: ['TypeScript', 'React', 'Next.js', 'LLMs', 'Prompt Engineering', 'API Design'],
    preferredSkills: ['Node.js', 'Serverless', 'Tailwind CSS', 'Edge Functions'],
    applyUrl: 'https://vercel.com/careers',
    postedDate: '2026-11-03',
    featured: true,
  },
  {
    id: 'job-air-04',
    title: 'Senior Software Engineer - Web Platform',
    company: 'Airbnb',
    location: 'Hybrid / Remote',
    type: 'Full-time',
    department: 'Web Infrastructure',
    salaryRange: '$160,000 - $205,000',
    description:
      'Join Airbnb’s Web Platform team to push forward component systems, accessibility, build pipelines, and render performance across our guest and host web products.',
    requiredSkills: ['JavaScript', 'TypeScript', 'React', 'HTML/CSS', 'Testing (Jest/Cypress)', 'Webpack/Vite'],
    preferredSkills: ['Design Systems', 'Microfrontends', 'Accessibility (a11y)'],
    applyUrl: 'https://careers.airbnb.com',
    postedDate: '2026-11-02',
  },
  {
    id: 'job-sup-05',
    title: 'Backend & Cloud Infrastructure Engineer',
    company: 'Supabase',
    location: 'Remote (Global)',
    type: 'Full-time',
    department: 'Cloud Platform',
    salaryRange: '$135,000 - $175,000',
    description:
      'Build open-source, scalable database tools and cloud infrastructure. You will architect resilient microservices, monitor production telemetry, and work with PostgreSQL, Docker, and distributed networking.',
    requiredSkills: ['PostgreSQL', 'Docker', 'Go or Node.js', 'Linux', 'Cloud Architecture (AWS/GCP)'],
    preferredSkills: ['Kubernetes', 'Redis', 'CI/CD Pipelines'],
    applyUrl: 'https://supabase.com/careers',
    postedDate: '2026-11-01',
  },
  {
    id: 'job-fig-06',
    title: 'Product Designer & Design Systems Lead',
    company: 'Figma',
    location: 'Remote / New York',
    type: 'Full-time',
    department: 'Product Design',
    salaryRange: '$150,000 - $190,000',
    description:
      'Drive world-class design systems and collaborative product experiences. You will partner with engineers and product leads to define ergonomic UI components, wireframes, and design guidelines.',
    requiredSkills: ['Figma', 'UI/UX Design', 'Design Systems', 'User Research', 'Prototyping'],
    preferredSkills: ['HTML/CSS', 'Design Tokens', 'Micro-interactions'],
    applyUrl: 'https://figma.com/careers',
    postedDate: '2026-11-05',
  },
  {
    id: 'job-dat-07',
    title: 'Full-Stack Software Engineer (Early Stage)',
    company: 'Datadog',
    location: 'Boston / Remote',
    type: 'Full-time',
    department: 'Core Analytics',
    salaryRange: '$145,000 - $180,000',
    description:
      'Help build real-time observability dashboards and visualizations. Looking for engineers comfortable jumping across React frontend code, backend services, and high-throughput data streams.',
    requiredSkills: ['React', 'JavaScript', 'TypeScript', 'Python or Go', 'SQL', 'Git'],
    preferredSkills: ['Data Visualization (D3.js)', 'Docker', 'Kafka'],
    applyUrl: 'https://datadoghq.com/careers',
    postedDate: '2026-11-04',
  },
  {
    id: 'job-gen-08',
    title: 'AI Application Developer / Prompt Engineer',
    company: 'Scale AI',
    location: 'Remote / San Francisco',
    type: 'Full-time',
    department: 'Generative AI',
    salaryRange: '$155,000 - $195,000',
    description:
      'Design, benchmark, and deploy generative AI applications, agents, and evaluation frameworks. You will work with cutting-edge models, semantic search, and web-scale datasets.',
    requiredSkills: ['Python', 'LLMs', 'Prompt Engineering', 'API Integration', 'Git'],
    preferredSkills: ['React', 'LangChain / LlamaIndex', 'Vector Databases (Pinecone/Chroma)'],
    applyUrl: 'https://scale.com/careers',
    postedDate: '2026-11-05',
  },
]

