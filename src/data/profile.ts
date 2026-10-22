// Shared profile data (sourced from the official resume PDF).
export const experience = [
  {
    role: 'ERP, Python & DevOps Engineer', org: 'Elmet.ai', kind: 'Full-time', dates: 'Aug 2025 – May 2026',
    points: [
      'Deployed and maintained secure cloud-native infrastructure with Kubernetes, AWS and FastAPI alongside developers.',
      'Troubleshot Linux environment and routing issues to keep daily team workflows uninterrupted.',
      'Implemented least-privilege IAM policies and acted as the team’s security advocate.',
    ],
  },
  {
    role: 'ERP, Python & DevOps Engineer', org: 'Elmet.ai', kind: 'Internship', dates: 'Feb 2025 – Aug 2025',
    points: [
      'Designed and built custom ERP modules with senior developers.',
      'Took part in stand-ups, sprint reviews and retrospectives with teams in India, and helped hire an intern.',
    ],
  },
  {
    role: 'DevOps & Security Architecture', org: 'Corover AI', kind: 'Internship', dates: 'Mar 2024 – Aug 2024',
    points: [
      'Designed secure GCP infrastructure aligned with SEBI (India’s securities regulator) compliance requirements.',
      'Automated SSL certificate management for 40+ AI services, removing manual work and avoiding downtime.',
      'Presented security risk analyses to stakeholders and optimised CI/CD pipelines, cutting deployment times by 70%.',
    ],
  },
  {
    role: 'Cloud Engineer', org: 'Field Engineers', kind: 'Internship', dates: 'Apr 2023 – Jul 2023',
    points: ['Deployed a Ghost CMS architecture on DigitalOcean, improving content delivery and platform SEO.'],
  },
];

export const skills = [
  ['Cloud & infrastructure', 'AWS, Google Cloud, Azure, DigitalOcean, Kubernetes (k3s), Docker, Proxmox'],
  ['Automation & CI/CD', 'Terraform, Ansible, GitHub Actions, GitLab CI, Bash, Python, Node.js'],
  ['Security & networking', 'IAM policy design, honeypots (Cowrie), OPNsense, Nmap, Wireshark, Kali Linux'],
  ['Data & observability', 'PostgreSQL, MongoDB, FAISS, ChromaDB, Grafana, Loki, Prometheus'],
];

export const talks = [
  { where: 'Konnect AI @ Google, Gurugram', when: 'Feb 2024', what: 'DevOps vs MLOps: where the pipelines diverge' },
  { where: 'Konnect AI @ Microsoft, Bangalore', when: 'Jan 2023', what: 'MLOps and security infrastructure' },
];

export const faq = [
  ['Who is Atharv Vadehra?', `Atharv Vadehra, also known as ARV, is a cybersecurity MSc student at the Technical University of Denmark (DTU) in Copenhagen with professional experience in DevOps, cloud infrastructure and security engineering. He holds a B.Tech in Digital Transformation from Atria University, Bangalore.`],
  ['What does Atharv Vadehra work on?', 'Secure cloud and Kubernetes infrastructure, infrastructure as code (Terraform, Ansible), CI/CD, honeypots and threat telemetry, and retrieval-augmented generation (RAG) systems.'],
  ['Is Atharv Vadehra available for work?', 'Yes. He is looking for a part-time studentermedhjælper (student assistant) role in the Copenhagen area, up to 90 hours per month on his student visa.'],
  ['What does ARV stand for?', 'ARV is the short name and online handle of Atharv Vadehra.'],
];


export const education = [
  { school: 'Technical University of Denmark (DTU)', degree: 'M.Sc. Computer Science, specialisation in Cyber Security', place: 'Copenhagen, Denmark', dates: '2026 – present' },
  { school: 'Atria University', degree: 'B.Tech in Digital Transformation', place: 'Bangalore, India', dates: '2021 – 2025' },
];
