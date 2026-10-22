---
title: "A rough week for the internet: PHP, LiteLLM and a compromised certificate authority"
description: "Critical PHP flaws, a poisoned LiteLLM release and leaked eMudhra CA keys: what was reported, and what a DevOps team should check."
date: 2026-10-22
category: cyber-news
tags: ["PHP", "Supply chain", "PKI", "LiteLLM", "Node.js"]
sources:
  - title: "TechCrunch — The internet is having a very bad cybersecurity day (21 Oct 2026)"
    url: "https://techcrunch.com/2026/10/21/the-internet-is-having-a-very-bad-cybersecurity-day/"
  - title: "CISA — Cybersecurity alerts and advisories"
    url: "https://www.cisa.gov/news-events/cybersecurity-advisories"
draft: false
---

**TL;DR:** Several unrelated incidents landed in the same week, reported by TechCrunch on 21 October 2026: critical PHP vulnerabilities, a malicious LiteLLM release, patched Node.js flaws and a certificate authority key compromise. The common thread for engineers: know what you run, and be able to patch or rotate fast.

*This is a summary of public reporting, not original research. Check the primary advisories linked below before acting.*

## What was reported

- **PHP.** TechCrunch, citing Reuters, reports that critical PHP vulnerabilities discovered with the help of AI led to government websites going offline around the world. The US NSA advised organisations to update immediately, or take affected systems offline until they could.
- **LiteLLM.** The open-source proxy for routing requests to multiple LLM providers had malicious code injected into releases published to PyPI, Docker Hub and GHCR. The payload reportedly included an information stealer aimed at cloud, password and AI-service credentials, plus a remote access trojan. The maintainers removed the releases and images.
- **Node.js.** The latest release patches four high-severity issues, including one remote code execution bug and two TLS validation bypasses.
- **eMudhra.** The Indian certificate authority reportedly had private keys compromised, which could let attackers issue fraudulent certificates. Security professionals quoted by TechCrunch described the clean-up as "bigger than Heartbleed".
- **Also mentioned:** a TiDB Cloud breach, Plex Media Server flaws being exploited, and a BeyondTrust Remote Support zero-day exploited since August and now patched.

## Why it matters

1. **Patch latency is the real exposure.** When a runtime like PHP or Node.js is affected, the question is how quickly you can find every place it runs, including container base images.
2. **Registry trust is not provenance.** The LiteLLM case shows that a package or image coming from an official registry does not prove it came from the maintainers' clean build.
3. **PKI failures are slow to fix.** A compromised CA affects everyone who trusts it, so the cleanup depends on browsers, operating systems and relying parties, not just the CA itself.

## A short checklist

- Inventory runtime versions (PHP, Node.js) across hosts *and* container images; rebuild images, not just hosts.
- Pin dependencies by digest or hash, and review any LiteLLM installs against the maintainers' remediation guidance. If you pulled an affected release, rotate every cloud and AI-provider credential that environment could reach.
- Keep CI secrets short-lived and scoped (OIDC federation instead of long-lived keys), so a stolen token has a small blast radius.
- Monitor Certificate Transparency logs for unexpected certificates on your domains.

## My take

The recurring pattern is attackers (and now AI-assisted researchers) shortening the time between a bug and its exploitation. Defence is mostly boring operational discipline: asset inventory, fast rebuilds, least-privilege credentials.
