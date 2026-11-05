/**
 * Curated Database of Active Job Openings & LinkedIn Integrations
 * Includes Early-Stage Startups, Small Teams, Boutique Agencies, Scale-ups, and Tech Companies.
 */

import type { JobOpening } from '../types'

/**
 * Builds a direct LinkedIn search URL based on job title, skills, or target company.
 */
export function buildLinkedInSearchUrl(keywords: string, location = 'Worldwide'): string {
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&f_TPR=r604800`
}

export const CURATED_JOB_OPENINGS: JobOpening[] = [
  // ─── STARTUPS & SMALL TEAMS ON LINKEDIN ────────────────────
  {
    id: 'job-sm-01',
    title: 'Frontend / React Developer',
    company: 'HyperFlow Labs',
    location: 'Remote (US / India / Global)',
    type: 'Full-time',
    department: 'Engineering',
    salaryRange: '$90,000 - $130,000',
    description:
      'HyperFlow Labs is a fast-growing, 10-person AI workflow startup. We are looking for a nimble Frontend Developer to build clean, fast React interfaces, work with interactive canvas UI, and integrate REST/WebSocket APIs. You will work directly with our founders.',
    requiredSkills: ['React', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'REST APIs', 'Git'],
    preferredSkills: ['Vite', 'State Management', 'UI/UX Design'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=HyperFlow+React+Developer',
    postedDate: '2026-11-05',
    featured: true,
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=React+Developer+Startup+Remote',
    hasEasyApply: true,
    companyType: 'Startup / Small Team',
    teamSize: '10 employees (Seed stage)',
    applicantCount: '9 applicants on LinkedIn · Be an early applicant',
  },
  {
    id: 'job-sm-02',
    title: 'Full-Stack JavaScript Engineer',
    company: 'KiteMetrics',
    location: 'Remote (Anywhere)',
    type: 'Full-time',
    department: 'Product',
    salaryRange: '$95,000 - $135,000',
    description:
      'KiteMetrics is a profitable, bootstrapped analytics SaaS with 15 team members. We need a generalist Full-Stack Engineer comfortable building dashboard visualizations in React, writing Node.js services, and querying PostgreSQL. Huge ownership and flexible hours.',
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'HTML/CSS', 'Git'],
    preferredSkills: ['Express', 'Docker', 'Chart.js / Recharts'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=KiteMetrics+Full-Stack+Engineer',
    postedDate: '2026-11-05',
    featured: true,
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Full-Stack+Developer+Bootstrapped+Remote',
    hasEasyApply: true,
    companyType: 'Startup / Small Team',
    teamSize: '15 employees (Bootstrapped)',
    applicantCount: '16 applicants on LinkedIn · High profile match',
  },
  {
    id: 'job-sm-03',
    title: 'Web Application Developer',
    company: 'Nexora Digital',
    location: 'Hybrid / Remote',
    type: 'Full-time',
    department: 'Web Development',
    salaryRange: '$80,000 - $115,000',
    description:
      'Nexora Digital is a modern 20-person digital product studio crafting high-end web applications and e-commerce platforms for clients worldwide. Looking for a developer with an eye for detail, clean CSS, responsive layouts, and modern React/Next.js frameworks.',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Responsive Design', 'REST APIs'],
    preferredSkills: ['Next.js', 'Figma', 'CMS Integration'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Nexora+Web+Developer',
    postedDate: '2026-11-04',
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Web+Application+Developer+Agency+Remote',
    hasEasyApply: true,
    companyType: 'Startup / Small Team',
    teamSize: '20 employees (Digital Studio)',
    applicantCount: '12 applicants on LinkedIn · Quick response rate',
  },
  {
    id: 'job-sm-04',
    title: 'AI & Frontend Engineer',
    company: 'EchoWave AI',
    location: 'Remote',
    type: 'Full-time',
    department: 'Core AI Products',
    salaryRange: '$110,000 - $150,000',
    description:
      'EchoWave AI is an 8-person YC-backed voice and audio AI startup. You will build user-friendly dashboard interfaces that connect with audio models, streaming LLM outputs, and real-time generation pipelines.',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'LLMs', 'API Integration', 'Git'],
    preferredSkills: ['Python', 'WebSockets', 'Prompt Engineering'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=EchoWave+AI+Engineer',
    postedDate: '2026-11-05',
    featured: true,
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=AI+Frontend+Developer+Startup+Remote',
    hasEasyApply: true,
    companyType: 'Startup / Small Team',
    teamSize: '8 employees (YC W25)',
    applicantCount: '21 applicants on LinkedIn',
  },
  {
    id: 'job-sm-05',
    title: 'Junior to Mid Cloud / DevOps Engineer',
    company: 'StackPulse Technologies',
    location: 'Remote',
    type: 'Full-time',
    department: 'Infrastructure',
    salaryRange: '$85,000 - $120,000',
    description:
      'StackPulse is a 25-person cloud automation startup. We help small engineering teams automate their AWS and container deployments. You will maintain CI/CD workflows, configure Docker images, and write infrastructure scripts.',
    requiredSkills: ['Docker', 'Linux', 'AWS', 'Git', 'CI/CD Pipelines', 'Bash or Python'],
    preferredSkills: ['Kubernetes', 'Terraform', 'PostgreSQL'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=StackPulse+Cloud+DevOps',
    postedDate: '2026-11-03',
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer+Startup+Remote',
    hasEasyApply: true,
    companyType: 'Startup / Small Team',
    teamSize: '25 employees (Series A)',
    applicantCount: '18 applicants on LinkedIn',
  },
  {
    id: 'job-sm-06',
    title: 'Full-Stack Web Specialist',
    company: 'Crestline Solutions',
    location: 'Remote (US / Remote)',
    type: 'Full-time',
    department: 'Engineering',
    salaryRange: '$85,000 - $115,000',
    description:
      'Crestline is a 14-person software team building internal management tools and customer portals for logistics companies. We value practical, working code over over-engineering. Stack: React, Node.js, SQL, and Tailwind.',
    requiredSkills: ['React', 'Node.js', 'JavaScript', 'SQL', 'HTML/CSS'],
    preferredSkills: ['TypeScript', 'Express', 'Git'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Crestline+Software+Developer',
    postedDate: '2026-11-04',
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Full+Stack+Web+Developer+Small+Company',
    hasEasyApply: true,
    companyType: 'Startup / Small Team',
    teamSize: '14 employees',
    applicantCount: '7 applicants on LinkedIn · Be an early applicant',
  },

  // ─── MID-SIZE / HIGH-GROWTH COMPANIES ─────────────────────
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
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Linear+Frontend+Engineer',
    hasEasyApply: false,
    companyType: 'Mid-Size',
    teamSize: '65 employees (Scale-up)',
    applicantCount: '48 applicants on LinkedIn · In top 10% of applicants',
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
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Supabase+Backend+Engineer',
    hasEasyApply: true,
    companyType: 'Mid-Size',
    teamSize: '90 employees',
    applicantCount: '32 applicants on LinkedIn · Early applicant opportunity',
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
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Figma+Product+Designer',
    hasEasyApply: true,
    companyType: 'Mid-Size',
    teamSize: '200+ employees',
    applicantCount: 'Over 150 applicants on LinkedIn',
  },

  // ─── LARGER / ESTABLISHED COMPANIES ───────────────────────
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
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Stripe+Senior+Full-Stack+Engineer',
    hasEasyApply: true,
    companyType: 'Enterprise',
    teamSize: 'Enterprise (1,000+)',
    applicantCount: 'Over 100 applicants on LinkedIn',
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
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Vercel+AI+Frontend+Architect',
    hasEasyApply: true,
    companyType: 'Enterprise',
    teamSize: 'Enterprise (500+)',
    applicantCount: 'Over 200 applicants on LinkedIn',
  },
  {
    id: 'job-meta-09',
    title: 'Full Stack Software Engineer - React / Python',
    company: 'Meta',
    location: 'Remote / Menlo Park, CA',
    type: 'Full-time',
    department: 'Product Infrastructure',
    salaryRange: '$175,000 - $235,000',
    description:
      'Meta is looking for a Full Stack Software Engineer to build scalable web experiences and high-throughput backend services. You will design, develop, and test web applications using modern JavaScript/TypeScript frameworks and distributed backend services.',
    requiredSkills: ['React', 'JavaScript', 'TypeScript', 'Python', 'Distributed Systems', 'Git'],
    preferredSkills: ['GraphQL', 'Relay', 'SQL', 'CI/CD'],
    applyUrl: 'https://www.metacareers.com',
    postedDate: '2026-11-05',
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Meta+Full+Stack+Software+Engineer',
    hasEasyApply: false,
    companyType: 'Enterprise',
    teamSize: 'Enterprise',
    applicantCount: 'Listed on LinkedIn 2 days ago',
  },
  {
    id: 'job-spot-10',
    title: 'Senior Frontend Developer - Web Experience',
    company: 'Spotify',
    location: 'Remote (Americas / EMEA)',
    type: 'Full-time',
    department: 'Core Web Platform',
    salaryRange: '$155,000 - $195,000',
    description:
      'Join Spotify’s Web Player team to deliver seamless audio and video streaming experiences to over 600 million users. You will write clean, well-tested TypeScript and React code, optimize web performance metrics, and push modern web capabilities.',
    requiredSkills: ['React', 'TypeScript', 'CSS/SCSS', 'Web Audio/Performance', 'Jest/RTL', 'REST/GraphQL'],
    preferredSkills: ['Next.js', 'WebAssembly', 'Micro-frontends'],
    applyUrl: 'https://www.lifeatspotify.com/jobs',
    postedDate: '2026-11-04',
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Spotify+Senior+Frontend+Developer',
    hasEasyApply: true,
    companyType: 'Enterprise',
    teamSize: 'Enterprise',
    applicantCount: '85 applicants on LinkedIn',
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
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Airbnb+Senior+Software+Engineer',
    hasEasyApply: false,
    companyType: 'Enterprise',
    teamSize: 'Enterprise',
    applicantCount: 'Over 100 applicants on LinkedIn',
  },
  {
    id: 'job-goog-11',
    title: 'Software Engineer III - Cloud & Developer Tools',
    company: 'Google',
    location: 'Sunnyvale, CA / Remote Eligible',
    type: 'Full-time',
    department: 'Google Cloud Platform',
    salaryRange: '$180,000 - $240,000',
    description:
      'Create tools, dashboards, and developer APIs that power millions of enterprise cloud users. Experience in building scalable frontend architectures with TypeScript, Angular or React, and communicating with high-throughput cloud endpoints.',
    requiredSkills: ['TypeScript', 'JavaScript', 'HTML/CSS', 'Data Structures & Algorithms', 'Cloud Systems'],
    preferredSkills: ['React or Angular', 'Go', 'GCP / Kubernetes'],
    applyUrl: 'https://www.google.com/about/careers',
    postedDate: '2026-11-05',
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Google+Software+Engineer+III',
    hasEasyApply: false,
    companyType: 'Enterprise',
    teamSize: 'Enterprise',
    applicantCount: 'Posted on LinkedIn 1 day ago',
  },
  {
    id: 'job-dat-07',
    title: 'Full-Stack Software Engineer (Core Analytics)',
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
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Datadog+Full-Stack+Engineer',
    hasEasyApply: false,
    companyType: 'Enterprise',
    teamSize: 'Enterprise',
    applicantCount: '62 applicants on LinkedIn',
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
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Scale+AI+Application+Developer',
    hasEasyApply: true,
    companyType: 'Mid-Size',
    teamSize: 'Scale-up',
    applicantCount: 'Over 90 applicants on LinkedIn',
  },
]

/**
 * Continuous Dynamic Influx Stream:
 * Fresh openings discovered and injected into the auto-refresh feed over time.
 */
export const SURFACED_FEED_STREAM: JobOpening[] = [
  {
    id: 'job-dyn-01',
    title: 'Full-Stack Product Engineer',
    company: 'PulseWave AI',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    department: 'Engineering',
    salaryRange: '$110,000 - $145,000',
    description:
      'PulseWave AI is an 11-person generative audio platform. We are seeking a Product Engineer proficient in React, Tailwind, and Node.js to build fast consumer-facing generation tools and integrate streaming API endpoints.',
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'Tailwind CSS', 'REST APIs'],
    preferredSkills: ['PostgreSQL', 'WebSockets', 'AI SDKs'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=PulseWave+Product+Engineer',
    postedDate: 'Just now',
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Full+Stack+Product+Engineer+Startup',
    hasEasyApply: true,
    companyType: 'Startup / Small Team',
    teamSize: '11 employees (Seed stage)',
    applicantCount: '4 applicants on LinkedIn · Be an early applicant',
  },
  {
    id: 'job-dyn-02',
    title: 'Frontend UI/UX Specialist',
    company: 'Veloce Design Systems',
    location: 'Remote',
    type: 'Full-time',
    department: 'Design Systems',
    salaryRange: '$95,000 - $130,000',
    description:
      'Veloce is a 16-person digital studio building high-fidelity component libraries and web experiences. We need a frontend developer who obsesses over fluid micro-interactions, responsive CSS, and accessible React components.',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Responsive Design', 'HTML/CSS'],
    preferredSkills: ['Framer Motion', 'Figma', 'Storybook'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Veloce+Frontend+Engineer',
    postedDate: '12m ago',
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Frontend+UI+Developer+Remote',
    hasEasyApply: true,
    companyType: 'Startup / Small Team',
    teamSize: '16 employees',
    applicantCount: '8 applicants on LinkedIn · Quick response rate',
  },
  {
    id: 'job-dyn-03',
    title: 'Cloud & DevOps Automation Engineer',
    company: 'Aether Cloud Technologies',
    location: 'Remote',
    type: 'Full-time',
    department: 'Cloud Infrastructure',
    salaryRange: '$120,000 - $160,000',
    description:
      'Aether Cloud provides automated multi-cloud provisioning for scale-ups. Looking for an infrastructure engineer to manage containerized deployments, optimize CI/CD pipelines, and configure Kubernetes clusters.',
    requiredSkills: ['Docker', 'AWS', 'Linux', 'CI/CD Pipelines', 'Git'],
    preferredSkills: ['Kubernetes', 'Terraform', 'Python / Bash'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Aether+Cloud+DevOps',
    postedDate: '24m ago',
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Cloud+DevOps+Engineer+Remote',
    hasEasyApply: true,
    companyType: 'Startup / Small Team',
    teamSize: '22 employees (Series A)',
    applicantCount: '11 applicants on LinkedIn',
  },
  {
    id: 'job-dyn-04',
    title: 'Junior-Mid Full-Stack Web Developer',
    company: 'Cloverleaf Systems',
    location: 'Remote',
    type: 'Full-time',
    department: 'Core Web',
    salaryRange: '$85,000 - $110,000',
    description:
      'Cloverleaf is a bootstrapped 9-person software company creating collaboration tools for remote teams. Great mentorship, direct founder collaboration, and healthy work-life balance.',
    requiredSkills: ['React', 'JavaScript', 'Node.js', 'REST APIs', 'Git'],
    preferredSkills: ['TypeScript', 'SQL', 'Tailwind CSS'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Cloverleaf+Web+Developer',
    postedDate: '45m ago',
    source: 'LinkedIn',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Junior+Web+Developer+Small+Company',
    hasEasyApply: true,
    companyType: 'Startup / Small Team',
    teamSize: '9 employees',
    applicantCount: '6 applicants on LinkedIn · Be an early applicant',
  },
]

const STORAGE_KEY_FEED_JOBS = 'hirely_custom_feed_jobs'

/**
 * Returns all active curated jobs plus any dynamically discovered feed openings
 */
export function getStoredFeedOpenings(): JobOpening[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEED_JOBS)
    if (raw) {
      const extra: JobOpening[] = JSON.parse(raw)
      const existingIds = new Set(CURATED_JOB_OPENINGS.map((j) => j.id))
      const combined = [...CURATED_JOB_OPENINGS]
      for (const item of extra) {
        if (!existingIds.has(item.id)) {
          combined.unshift(item)
          existingIds.add(item.id)
        }
      }
      return combined
    }
  } catch {
    // ignore
  }
  return [...CURATED_JOB_OPENINGS]
}

/**
 * Injects a new opening into the continuous feed
 */
export function injectFeedOpening(opening: JobOpening): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEED_JOBS)
    const list: JobOpening[] = raw ? JSON.parse(raw) : []
    if (!list.some((j) => j.id === opening.id)) {
      list.unshift(opening)
      localStorage.setItem(STORAGE_KEY_FEED_JOBS, JSON.stringify(list))
    }
  } catch {
    // ignore
  }
}

