/**
 * Hirely LinkedIn Copilot — Shared Skill Extraction, Match Scoring & URL Builder
 * Mirrors Hirely's core matching logic while also handling general keyword overlap
 * for non-technical & niche roles directly on LinkedIn.
 */

const HirelyMatcher = (() => {
  const SKILL_CATALOG = [
    // Frontend & Mobile
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte',
    'HTML', 'CSS', 'Tailwind CSS', 'Sass', 'Redux', 'GraphQL', 'Webpack', 'Vite',
    'React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Responsive Design',
    // Backend & APIs
    'Node.js', 'Express', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask',
    'Java', 'Spring Boot', 'C#', '.NET', 'Go', 'Rust', 'PHP', 'Laravel', 'Ruby on Rails',
    'REST APIs', 'Microservices', 'WebSockets', 'gRPC', 'C++',
    // Databases & Data Engineering
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Firebase',
    'Supabase', 'DynamoDB', 'Kafka', 'Apache Spark', 'Airflow', 'Snowflake', 'dbt',
    'Databricks', 'BigQuery', 'ETL', 'Data Warehousing',
    // Cloud, DevOps & Security
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
    'GitHub Actions', 'Jenkins', 'Linux', 'Nginx', 'Git', 'DevOps', 'SRE',
    'Cybersecurity', 'OAuth', 'IAM',
    // AI & Data Science
    'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Scikit-learn',
    'LangChain', 'LLMs', 'Prompt Engineering', 'NLP', 'Computer Vision', 'RAG',
    'Data Science', 'Data Analysis', 'Pandas', 'NumPy', 'Tableau', 'Power BI', 'Looker',
    // QA & Testing
    'Jest', 'Cypress', 'Playwright', 'Selenium', 'Unit Testing', 'QA Testing',
    // Product, Design & Management
    'Figma', 'UI/UX Design', 'Design Systems', 'User Research', 'Prototyping',
    'Product Management', 'Agile', 'Scrum', 'Jira', 'Notion', 'Roadmapping',
    'A/B Testing', 'Google Analytics', 'Stakeholder Management',
    // Business, Marketing, Sales & Finance
    'Excel', 'Financial Modeling', 'Accounting', 'QuickBooks', 'Salesforce',
    'HubSpot', 'CRM', 'SEO', 'SEM', 'Digital Marketing', 'Content Marketing',
    'Copywriting', 'Project Management', 'Operations', 'Supply Chain', 'Recruiting',
    'B2B Sales', 'Cold Outreach', 'Customer Success', 'Communication', 'Leadership',
  ];

  const ALIASES = {
    nodejs: 'node.js',
    node: 'node.js',
    nextjs: 'next.js',
    reactjs: 'react',
    vuejs: 'vue.js',
    k8s: 'kubernetes',
    postgres: 'postgresql',
    tailwind: 'tailwind css',
    tailwindcss: 'tailwind css',
    dotnet: '.net',
    golang: 'go',
    ml: 'machine learning',
    genai: 'llms',
    'rest api': 'rest apis',
    restful: 'rest apis',
    ux: 'ui/ux design',
    'ui/ux': 'ui/ux design',
    pm: 'product management',
  };

  const STOP_WORDS = new Set([
    'about', 'above', 'after', 'again', 'against', 'all', 'also', 'always', 'among',
    'and', 'any', 'are', 'around', 'because', 'been', 'before', 'being', 'below',
    'between', 'both', 'build', 'building', 'business', 'can', 'candidates', 'company',
    'create', 'creating', 'data', 'day', 'deliver', 'description', 'develop', 'developing',
    'different', 'driven', 'during', 'each', 'email', 'employee', 'employees', 'employer',
    'engineering', 'ensure', 'environment', 'equal', 'every', 'excellent', 'experience',
    'fast', 'features', 'for', 'from', 'full', 'future', 'good', 'great', 'growth',
    'has', 'have', 'help', 'high', 'highly', 'hiring', 'how', 'ideal', 'impact',
    'including', 'industry', 'into', 'join', 'job', 'jobs', 'key', 'knowledge', 'large',
    'lead', 'leading', 'learn', 'learning', 'level', 'like', 'location', 'looking',
    'make', 'manage', 'managing', 'many', 'may', 'more', 'most', 'must', 'need', 'needs',
    'new', 'not', 'now', 'offer', 'office', 'only', 'opportunity', 'other', 'our', 'out',
    'over', 'own', 'part', 'people', 'per', 'platform', 'plus', 'position', 'preferred',
    'problems', 'process', 'product', 'products', 'provide', 'qualifications', 'quality',
    'related', 'remote', 'required', 'requirements', 'responsibilities', 'results', 'role',
    'roles', 'same', 'scale', 'see', 'seeking', 'should', 'similar', 'skills', 'small',
    'solutions', 'some', 'someone', 'strong', 'such', 'support', 'systems', 'take',
    'team', 'teams', 'technical', 'technology', 'than', 'that', 'the', 'their', 'them',
    'then', 'there', 'these', 'they', 'this', 'those', 'through', 'time', 'together',
    'tools', 'top', 'under', 'understand', 'understanding', 'use', 'using', 'various',
    'very', 'want', 'way', 'well', 'were', 'what', 'when', 'where', 'which', 'while',
    'who', 'will', 'with', 'within', 'without', 'work', 'working', 'world', 'would',
    'years', 'you', 'your', 'ability', 'across', 'apply', 'based', 'benefits', 'best',
  ]);

  function normalizeSkill(s) {
    const clean = String(s || '')
      .toLowerCase()
      .replace(/\.js\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const mapped = ALIASES[clean.replace(/\s+/g, '')] || ALIASES[clean] || clean;
    return mapped.replace(/[^a-z0-9#+]/g, '');
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function textContainsSkill(text, skill) {
    if (!text || !skill) return false;
    const escaped = escapeRegex(skill);
    // Special boundary handling for C++, C#, .NET
    if (/[^a-zA-Z0-9]$/.test(skill) || /^[^a-zA-Z0-9]/.test(skill)) {
      const rx = new RegExp(`(^|\\s|[/(,])${escaped}(\\s|[)/.,;:]|$)`, 'i');
      return rx.test(text);
    }
    const rx = new RegExp(`\\b${escaped}\\b`, 'i');
    return rx.test(text);
  }

  function extractSkillsFromText(text) {
    if (!text) return [];
    const found = [];
    const seen = new Set();

    for (const skill of SKILL_CATALOG) {
      if (textContainsSkill(text, skill)) {
        const norm = normalizeSkill(skill);
        if (!seen.has(norm)) {
          seen.add(norm);
          found.push(skill);
        }
      }
    }

    // Check key aliases explicitly
    for (const [alias, canonical] of Object.entries(ALIASES)) {
      if (alias.length >= 3 && textContainsSkill(text, alias)) {
        const norm = normalizeSkill(canonical);
        if (!seen.has(norm)) {
          seen.add(norm);
          const display = SKILL_CATALOG.find((s) => normalizeSkill(s) === norm) || canonical;
          found.push(display);
        }
      }
    }

    return found;
  }

  function extractTopKeywords(text, limit = 16) {
    const words = String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

    const counts = new Map();
    for (const w of words) {
      counts.set(w, (counts.get(w) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([w]) => w);
  }

  function hasResumeSkill(candidateSkills, resumeText, targetSkill) {
    const normTarget = normalizeSkill(targetSkill);
    if (
      candidateSkills.some((s) => {
        const n = normalizeSkill(s);
        return n === normTarget || (normTarget.length >= 3 && n.includes(normTarget));
      })
    ) {
      return true;
    }
    return textContainsSkill(resumeText, targetSkill);
  }

  function scoreJobAgainstResume(job, resume) {
    if (!resume || (!resume.resumeText && !(resume.skills && resume.skills.detected && resume.skills.detected.length))) {
      return {
        hasResume: false,
        score: 0,
        fitBadge: 'No Resume',
        matchedSkills: [],
        missingSkills: [],
        jobSkills: extractSkillsFromText(`${job.title || ''} ${job.description || ''}`),
        summary: 'Sync your resume from Hirely or paste your resume in the extension popup to unlock instant match scoring.',
      };
    }

    const candidateSkills = [
      ...((resume.skills && resume.skills.detected) || []),
      ...((resume.extracted && resume.extracted.skills) || []),
      ...extractSkillsFromText(resume.resumeText || ''),
    ];
    const resumeText = resume.resumeText || '';
    const fullJobText = `${job.title || ''}\n${job.description || ''}`;
    const jobSkills = extractSkillsFromText(fullJobText);

    const matchedSkills = [];
    const missingSkills = [];

    for (const req of jobSkills) {
      if (hasResumeSkill(candidateSkills, resumeText, req)) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    }

    // Compute score accurately whether structured skills exist or it's a general/non-IT job
    let skillRatio = 0;
    let kwMatched = [];
    let kwMissing = [];

    if (jobSkills.length >= 2) {
      skillRatio = matchedSkills.length / jobSkills.length;
    } else {
      const topKws = extractTopKeywords(fullJobText, 12);
      const lowerResume = resumeText.toLowerCase();
      for (const kw of topKws) {
        if (lowerResume.includes(kw)) kwMatched.push(kw);
        else kwMissing.push(kw);
      }
      skillRatio = topKws.length ? kwMatched.length / topKws.length : 0.6;
    }

    const titleWords = String(job.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    const lowerResume = resumeText.toLowerCase();
    const titleMatches = titleWords.filter((w) => lowerResume.includes(w)).length;
    const titleFactor = titleWords.length ? Math.min(1, 0.35 + (titleMatches / titleWords.length) * 0.65) : 0.65;

    const atsScore = (resume.ats && resume.ats.score) || 75;
    const atsFactor = Math.min(atsScore / 100, 1);

    let rawScore = Math.round(skillRatio * 66 + titleFactor * 24 + atsFactor * 10);
    rawScore = Math.max(32, Math.min(98, rawScore));

    const effectiveMatched = matchedSkills.length ? matchedSkills : kwMatched;
    const effectiveMissing = missingSkills.length ? missingSkills : kwMissing.slice(0, 5);

    let fitBadge = 'Low Match';
    if (rawScore >= 85) fitBadge = 'Best Fit';
    else if (rawScore >= 72) fitBadge = 'High Match';
    else if (rawScore >= 56) fitBadge = 'Near-Miss';

    const topHit = effectiveMatched.slice(0, 3).join(', ');
    const topGap = effectiveMissing.slice(0, 2).join(' & ');
    let summary = '';
    if (rawScore >= 85) {
      summary = `Strong match! Your background in ${topHit || 'this domain'} aligns closely with ${job.company || 'this role'}.`;
    } else if (rawScore >= 72) {
      summary = `Solid fit on ${topHit || 'core requirements'}. Highlighting ${topGap || 'a couple of key terms'} will sharpen your application.`;
    } else if (rawScore >= 56) {
      summary = `Near-miss opportunity (${rawScore}%). Closing the gap on ${topGap || 'missing requirements'} can push you into top-tier contention.`;
    } else {
      summary = `Stretch role — missing key requirements (${effectiveMissing.slice(0, 3).join(', ') || 'specialized experience'}). Consider tailoring before applying.`;
    }

    return {
      hasResume: true,
      score: rawScore,
      fitBadge,
      matchedSkills: effectiveMatched,
      missingSkills: effectiveMissing,
      jobSkills,
      summary,
    };
  }

  function quickCardScore(cardTitle, resume) {
    if (!resume || !cardTitle) return null;
    const resumeText = (resume.resumeText || '').toLowerCase();
    const detected = ((resume.skills && resume.skills.detected) || []).map((s) => s.toLowerCase());
    const targetTitle = ((resume.jobTarget && resume.jobTarget.title) || '').toLowerCase();

    const words = cardTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

    if (!words.length) return null;
    let hits = 0;
    for (const w of words) {
      if (resumeText.includes(w) || targetTitle.includes(w) || detected.some((s) => s.includes(w))) {
        hits++;
      }
    }
    const ratio = hits / words.length;
    if (ratio >= 0.65) return { label: 'Strong Role Fit', tier: 'best', pct: Math.min(96, Math.round(78 + ratio * 18)) };
    if (ratio >= 0.35) return { label: 'Relevant Match', tier: 'good', pct: Math.round(62 + ratio * 20) };
    return { label: 'Check Requirements', tier: 'stretch', pct: Math.max(42, Math.round(45 + ratio * 25)) };
  }

  function suggestSearchKeywords(resume) {
    if (!resume) return 'Software Engineer';
    if (resume.jobTarget && resume.jobTarget.title) {
      return resume.jobTarget.title;
    }
    const exp = (resume.extracted && resume.extracted.experience) || [];
    if (exp.length > 0) {
      // First experience line often holds "Role at Company" or role title
      const first = String(exp[0]).split(/[@|•\-\n]/)[0].trim();
      if (first.length >= 4 && first.length <= 45) return first;
    }
    const skills = (resume.skills && resume.skills.detected) || [];
    if (skills.length >= 2) {
      return `${skills[0]} ${skills[1]}`;
    }
    return skills[0] || 'Software Engineer';
  }

  function buildLinkedInSearchUrl({ keywords = '', location = '', preset = 'best-match', remoteOnly = false, easyApply = false, past24h = false }) {
    const params = new URLSearchParams();
    let finalKeywords = (keywords || '').trim();

    if (preset === 'startups' && finalKeywords) {
      finalKeywords = `${finalKeywords} (startup OR "early stage" OR "small team" OR seed)`;
    } else if (preset === 'startups') {
      finalKeywords = 'startup OR "small team" OR "early stage"';
    }

    if (finalKeywords) params.set('keywords', finalKeywords);
    if (location && location.trim()) params.set('location', location.trim());

    if (preset === 'fresh-24h' || preset === 'early-bird' || past24h) {
      params.set('f_TPR', 'r86400'); // Last 24 hours
    } else {
      params.set('f_TPR', 'r604800'); // Last 7 days
    }

    if (preset === 'early-bird') {
      params.set('f_EA', 'true'); // Under 10 applicants
      params.set('sortBy', 'DD'); // Most recent
    } else if (preset === 'fresh-24h' || preset === 'startups') {
      params.set('sortBy', 'DD');
    }

    if (preset === 'remote-easy' || remoteOnly) {
      params.set('f_WT', '2'); // Remote
    }

    if (preset === 'remote-easy' || easyApply) {
      params.set('f_AL', 'true'); // Easy Apply
    }

    return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
  }

  return {
    SKILL_CATALOG,
    extractSkillsFromText,
    scoreJobAgainstResume,
    quickCardScore,
    suggestSearchKeywords,
    buildLinkedInSearchUrl,
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.HirelyMatcher = HirelyMatcher;
}
