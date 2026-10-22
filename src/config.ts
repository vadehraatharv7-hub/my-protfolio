// Single source of truth for identity data used by the UI, JSON-LD, llms.txt and RSS.
export const PERSON = {
  name: 'Atharv Vadehra',
  alias: 'ARV',
  alternateNames: ['ARV', 'Atharv Vadehra (ARV)', 'Atharv Vadehra ARV'],
  jobTitle: 'Cybersecurity MSc student and DevOps / cloud engineer',
  email: 'atharv@vadehra.me',
  location: 'Greater Copenhagen, Denmark',
  locality: 'Copenhagen',
  country: 'DK',
  linkedin: 'https://www.linkedin.com/in/atharv-vadehra/',
  github: 'https://github.com/vadehraatharv7-hub',
  employer: { name: 'Technical University of Denmark (DTU)', url: 'https://www.dtu.dk' },
  alumniOf: { name: 'Atria University', url: 'https://atriauniversity.edu.in' },
  knowsAbout: [
    'Cybersecurity', 'Cloud security', 'DevOps', 'Kubernetes', 'Terraform', 'Ansible',
    'AWS', 'Google Cloud', 'Microsoft Azure', 'Docker', 'CI/CD', 'Honeypots',
    'Retrieval-augmented generation', 'Observability', 'Python', 'Linux',
  ],
  headshot: '/images/atharv-vadehra.jpg',
} as const;

export const SITE_TITLE = 'Atharv Vadehra (ARV)';
export const SITE_TAGLINE = 'Cybersecurity MSc student at DTU and DevOps & cloud engineer';
export const DEFAULT_DESCRIPTION =
  'Atharv Vadehra (ARV) is a cybersecurity MSc student at the Technical University of Denmark (DTU) and DevOps / cloud engineer in Copenhagen. Projects, write-ups, and notes on cybersecurity and AI.';

export const CATEGORIES = {
  writeup: { label: 'Write-up', plural: 'Write-ups', blurb: 'Deep dives into projects I have built.' },
  'cyber-news': { label: 'Cyber news', plural: 'Cyber news', blurb: 'Notes on what is happening in security.' },
  'ai-news': { label: 'AI news', plural: 'AI news', blurb: 'Notes on what is happening in AI.' },
} as const;
export type CategoryKey = keyof typeof CATEGORIES;
