# 🌌 Anti-Gravity Cyber Portfolio & Markdown Intelligence Log

> **High-tech, zero-gravity personal portfolio and statically compiled Markdown blog system designed for Atharv Vadehra (Cybersecurity Master's Student & Cloud/DevOps Architect). Engineered for seamless deployment to GitHub Pages.**

---

## ⚡ Tech Stack & Highlights

- **Framework**: [Astro 4](https://astro.build/) — Zero-JS footprint by default, lightning-fast static HTML generation.
- **Hosting Target**: **GitHub Pages** (via automated GitHub Actions CI/CD pipeline).
- **Aesthetic**: Dark hacker / cyberpunk HUD interface with phosphor green (`#00ff66`), electric cyan (`#00f0ff`), and alert crimson (`#ff0055`) accents.
- **Anti-Gravity Engine**: Interactive HTML5 Canvas particle void with cursor gravitational repulsion, paired with multi-layer CSS float/levitation keyframes and weightless hover lift effects.
- **Markdown Pipeline**: Built on Astro Content Collections with typed Zod validation schemas for blog posts and project documentation sub-pages.
- **CRT Scanlines**: Interactive togglable retro CRT scanline monitor simulation.

---

## 📂 Repository Architecture

```text
portfolio/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated GitHub Actions workflow for GitHub Pages
├── public/
│   ├── favicon.svg             # Cyberpunk [λ] vector favicon
│   └── images/                 # Standalone SVG vector diagrams and artworks
│       ├── k8s-mesh.svg
│       ├── anomaly-detect.svg
│       ├── sports-telemetry.svg
│       └── proxmox-lab.svg
├── src/
│   ├── content.config.ts       # Astro 5 Content Layer with glob loaders
│   ├── content/
│   │   ├── blog/               # Markdown blog posts (.md) with requested YAML schema
│   │   │   ├── 01-zero-trust-ebpf-kubernetes.md
│   │   │   ├── 02-offensive-defense-network-telemetry.md
│   │   │   └── 03-proxmox-hardened-homelab.md
│   │   └── projects/           # Markdown project documentation sub-pages (.md)
│   │       ├── zero-trust-k8s-mesh.md
│   │       ├── network-anomaly-detector.md
│   │       ├── sports-analytics-pipeline.md
│   │       └── proxmox-seclab.md
│   ├── components/
│   │   ├── Header.astro        # Cyber HUD navigation bar with mobile drawer
│   │   ├── Footer.astro        # Telemetry footer with PGP fingerprint
│   │   ├── ParticleVoid.astro  # Interactive zero-gravity particle simulation
│   │   ├── FloatingTechStack.astro # Weightless orbiting tech badges
│   │   ├── ProjectCard.astro   # Anti-gravity hover lift project card
│   │   └── CyberHudStatus.astro# Real-time DEFCON and UTC telemetry ribbon
│   ├── layouts/
│   │   ├── Layout.astro        # Master HTML layout with glow cursor and scanlines
│   │   ├── BlogPostLayout.astro# Classified terminal log / decrypted intelligence layout
│   │   └── ProjectDocLayout.astro # Deep engineering architecture documentation layout
│   ├── pages/
│   │   ├── index.astro         # Anti-gravity hero, terminal console, quick stats
│   │   ├── projects/
│   │   │   ├── index.astro     # Projects directory with interactive category filtering
│   │   │   └── [slug].astro    # Dynamic route for project documentation sub-pages
│   │   ├── blog/
│   │   │   ├── index.astro     # Blog archive with live keyword & tag search
│   │   │   └── [...slug].astro # Dynamic route for Markdown blog posts
│   │   └── 404.astro           # "Packet Lost into Void" classified error screen
│   └── styles/
│       └── cyber-theme.css     # Monospace typography, neon glows, anti-gravity keyframes
├── astro.config.mjs            # Static export & GitHub Pages base configuration
├── package.json
└── tsconfig.json
```

---

## 🚀 Quickstart & Local Scaffolding

### 1. Install Dependencies

Ensure you have **Node.js 18+** or **Node.js 20+** installed:

```bash
cd /home/marcos_007/Documents/portfolio
npm install
```

### 2. Start Local Development Server

```bash
npm run dev
```

Open your browser to [http://localhost:4321](http://localhost:4321) to explore the anti-gravity hero, floating tech stack, interactive projects space, and classified Markdown blog.

### 3. Build Static Files Locally

To test the static compilation:

```bash
npm run build
```

This compiles pure static HTML/CSS/JS into the `dist/` directory.

You can preview the production static build with:

```bash
npm run preview
```

---

## 🌐 Deploying to GitHub Pages

This project is configured out of the box with an automated GitHub Actions deployment workflow at [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml).

### Step-by-Step Deployment:

1. **Initialize Git and Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial anti-gravity cyber portfolio and markdown blog"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git push -u origin main
   ```

2. **Configure Base Path in `astro.config.mjs` (If hosting under a repository subpath)**:
   - If your repository is named `portfolio` and hosted at `https://<YOUR-USERNAME>.github.io/portfolio/`, set:
     ```js
     // astro.config.mjs
     export default defineConfig({
       site: 'https://<YOUR-USERNAME>.github.io',
       base: '/portfolio/',
       // ...
     });
     ```
   - If hosting at a custom domain (e.g. `https://atharvvadehra.dev`) or as a user site `https://<YOUR-USERNAME>.github.io/`, leave `base: '/'`.

3. **Enable GitHub Actions in GitHub Repository Settings**:
   - Go to your GitHub repository in your browser.
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
   - Push a commit to `main` (or run manually under the **Actions** tab via "Run workflow").
   - GitHub Pages will automatically compile and deploy your static site!

---

## 📝 Markdown-Driven Blog System

Blog posts live in [`src/content/blog/`](file:///src/content/blog/). Every post is an `.md` file adhering strictly to the YAML frontmatter schema:

```yaml
---
title: "Hardening Kubernetes Ingress with Cilium eBPF and SPIRE Zero-Trust Attestation"
subtitle: "Eliminating perimeter assumptions through kernel-level packet inspection, cryptographic workload identity, and mutual TLS enforcement."
date: "2026-08-14"
time: "11 min read"
header_image: "/images/k8s-mesh.svg"
author: "Atharv Vadehra"
sources:
  - "https://cilium.io/blog/2023/10/19/ebpf-security/"
  - "https://spiffe.io/docs/latest/spire-about/overview/"
  - "NIST Special Publication 800-207: Zero Trust Architecture Standards"
tags:
  - "Kubernetes"
  - "eBPF"
  - "Zero-Trust"
classification: "TOP SECRET // LEVEL-4 EYES ONLY"
---

## 0x01 // Heading Title

Your markdown content here. Supports standard Markdown syntax, syntax highlighted code blocks, tables, and blockquotes.
```

### Parsing Logic
Astro's Content Collection API guarantees type-safety through the Zod schema defined in [`src/content.config.ts`](file:///src/content.config.ts). When the dynamic route [`src/pages/blog/[...slug].astro`](file:///src/pages/blog/[...slug].astro) executes:
- It parses all frontmatter attributes.
- Falls back to `Atharv Vadehra` if `author` is omitted.
- Formats `sources` into classified intelligence citation badges at the bottom of the article.
- Renders the post inside [`BlogPostLayout.astro`](file:///src/layouts/BlogPostLayout.astro) with the classified terminal decrypt aesthetic.

---

## 🛠️ Adding New Projects

Projects are located in [`src/content/projects/`](file:///src/content/projects/). To add a new project with its own dedicated documentation subpage:

Create a new file, e.g. `src/content/projects/my-new-project.md`:

```yaml
---
title: "Kubernetes HoneyNet & Deception Grid"
tagline: "Dynamic deception pods mimicking vulnerable Redis and SSH nodes to capture adversary zero-days."
description: "An automated deceptive computing mesh designed to detect unauthorized lateral traversal in Kubernetes clusters."
category: "Cloud Security" # Options: Cloud Security | DevOps & IaC | Network Security | Homelab & Virtualization | Distributed Systems
technologies:
  - "Kubernetes"
  - "Go"
  - "Docker"
  - "Cilium"
github: "https://github.com/atharvvadehra/k8s-honeynet"
demo: "https://honeynet.atharvvadehra.dev"
featured: true
status: "OPERATIONAL"
metrics:
  Interceptions: "142 Attempts"
  Alert Latency: "< 100ms"
---

## 0x01 // Threat Matrix & Deception Strategy

Detailed architecture documentation, threat models, configuration snippets, and benchmarks go here.
```

This automatically populates the **Projects Space** grid with the anti-gravity hover lift effect and creates a dedicated sub-page at `/projects/my-new-project`!

---

## 🎨 Customizing Theme & Anti-Gravity Effects

- **Color Palette & Glows**: Modify CSS custom properties in [`src/styles/cyber-theme.css`](file:///src/styles/cyber-theme.css):
  - `--color-neon-cyan`: Electric blue/cyan (`#00f0ff`)
  - `--color-neon-green`: Phosphor green (`#00ff66`)
  - `--color-neon-crimson`: Alert red (`#ff0055`)
- **Anti-Gravity Physics**: Customize `@keyframes anti-gravity-float` in [`src/styles/cyber-theme.css`](file:///src/styles/cyber-theme.css) or adjust particle density in [`src/components/ParticleVoid.astro`](file:///src/components/ParticleVoid.astro).
- **CRT Scanlines**: Toggle live on any page using the `CRT` button in the top navigation bar.

---

## 🛡️ License & Attestation

Authored by **Atharv Vadehra**. Open for personal portfolio customization and educational cyber-defense research.
