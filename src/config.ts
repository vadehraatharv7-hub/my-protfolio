// Single source of truth for identity data used by the UI, JSON-LD, llms.txt and RSS.
export const PERSON = {
  name: 'Atharv Vadehra',
  alias: 'ARV',
  alternateNames: ['ARV', 'Atharv Vadehra (ARV)', 'Atharv Vadehra ARV'],
  jobTitle: 'Cybersecurity MSc student building the bridge between AI/ML and cyber security, DevOps / cloud engineer',
  email: 'atharv@vadehra.me',
  location: 'Greater Copenhagen, Denmark',
  locality: 'Copenhagen',
  country: 'DK',
  linkedin: 'https://www.linkedin.com/in/atharv-vadehra/',
  github: 'https://github.com/vadehraatharv7-hub',
  employer: { name: 'Technical University of Denmark (DTU)', url: 'https://www.dtu.dk' },
  alumniOf: { name: 'Atria University', url: 'https://atriauniversity.edu.in' },
  knowsAbout: [
    'Cybersecurity', 'Cloud security', 'Network security', 'SIEM', 'Detection engineering',
    'MITRE ATT&CK', 'Threat detection', 'Zero Trust', 'Least privilege', 'IAM',
    'DevOps', 'DevSecOps', 'Kubernetes', 'Terraform', 'Ansible',
    'AWS', 'Google Cloud', 'Microsoft Azure', 'Docker', 'CI/CD', 'Honeypots',
    'Artificial intelligence', 'Large language models', 'LLM-assisted threat triage',
    'Retrieval-augmented generation', 'Vector search', 'Embeddings', 'MLOps',
    'Observability', 'Python', 'Linux',
  ],
  headshot: '/images/atharv-vadehra.jpg',
} as const;

export const SITE_TITLE = 'Atharv Vadehra (ARV)';
export const SITE_TAGLINE = 'Cybersecurity MSc student at DTU, bridging AI/ML and cyber security, with a DevOps & cloud background';
export const DEFAULT_DESCRIPTION =
  'Atharv Vadehra (ARV) is a cybersecurity MSc student at DTU in Copenhagen with a DevOps and cloud background, building the bridge between AI/ML and cyber security: LLM-assisted threat triage, RAG, SIEM, honeypots and secure AI infrastructure.';

export const CATEGORIES = {
  writeup: { label: 'Write-up', plural: 'Write-ups', blurb: 'Deep dives into projects I have built.' },
  'cyber-news': { label: 'Cyber news', plural: 'Cyber news', blurb: 'Notes on what is happening in security.' },
  'ai-news': { label: 'AI news', plural: 'AI news', blurb: 'Notes on what is happening in AI.' },
} as const;
export type CategoryKey = keyof typeof CATEGORIES;
