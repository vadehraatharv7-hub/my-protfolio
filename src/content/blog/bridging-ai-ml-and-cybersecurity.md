---
title: "Why I'm building the bridge between AI/ML and cybersecurity"
description: "Why I study cybersecurity but keep building with AI: honeypot analytics, securing the infrastructure AI runs on, and what I want to learn next where the two fields meet."
date: 2026-10-30
category: writeup
tags: ["AI", "Machine learning", "Cybersecurity", "LLM", "RAG", "MITRE ATT&CK", "MLOps", "AI security"]
project: ai-soc-azure-honeypot
sources:
  - title: "MITRE ATT&CK"
    url: "https://attack.mitre.org/"
  - title: "OWASP Top 10 for Large Language Model Applications"
    url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/"
  - title: "Wazuh documentation"
    url: "https://documentation.wazuh.com/current/"
draft: false
---

**TL;DR:** I'm doing a master's in cyber security, but almost everything I build touches AI. That isn't a coincidence. I think the most interesting problems in both fields sit where they meet: AI that helps defend systems, and security for the systems AI runs on. This post explains how my projects fit that idea, and what I'm still working towards.

## The idea

I see two directions, and I want to work on both.

**AI for security.** Defenders drown in logs. An attacker types a string of shell commands and someone has to work out what they were trying to do, how serious it is, and what to do about it. That is a pattern-recognition and language problem, which is exactly what modern AI is good at.

**Security for AI.** AI systems are software with new weak spots: they sit on infrastructure that needs hardening, they handle sensitive data, and they accept natural language that attackers can abuse (prompt injection is the best-known example). Someone has to secure them.

If you only know one side, you miss the other. I want to be comfortable on both.

## How my work fits

**Turning raw attacks into structured data.** In my [AI-SOC and Azure honeypot project](/projects/ai-soc-azure-honeypot/), honeypots on Azure capture attacker sessions, and SecDash, a dashboard I built in Go and React, scores each attacker, classifies their behaviour, links campaigns and maps what they did to MITRE ATT&CK. An earlier version used an LLM to summarise attacks. I replaced it with a local rule engine, so today that analysis is deterministic, not AI. What it gives me is a clean, structured dataset about attacker behaviour, which is the raw material any machine-learning approach would need.

**Giving the data somewhere to live.** AI is only as useful as the data behind it. My [homelab](/blog/hypervisor-firewall-pattern-homelab/) collects honeypot events in a [Wazuh SIEM](/projects/wazuh-siem-homelab/) with my own [detection rules](/projects/homelab-honeypots-lxc/), and keeps every event in a [MongoDB log store](/projects/mongodb-log-store/), tagged `honeypot` or `production`. That separation matters: you can't study attacker behaviour if decoy noise is mixed up with real traffic.

**Securing the places AI runs.** At Corover AI I worked on secure GCP infrastructure aligned with SEBI requirements and automated SSL certificates for more than 40 AI services, so that none of them went down because of an expired certificate. That was my first real taste of what "security for AI" means in practice: unglamorous, essential infrastructure work.

**Building with AI myself.** I collaborated on a retrieval-augmented generation (RAG) pipeline using embeddings and vector search (FAISS and ChromaDB) behind production chatbot workflows, and the [project page](/projects/rag-vector-search/) describes the safeguards around its API: API keys, rate limiting and input sanitisation against prompt injection. I've also given talks on DevOps versus MLOps and on MLOps and security infrastructure, which is where I first said out loud that these two worlds belong together.

## Where I'm heading

I want to go deeper, not just stay at the surface of both fields. Specifically:

- Bring machine learning back on top of the data my honeypots already produce, and measure how it compares with my rule engine, including where it fails.
- Use my honeypot and SIEM lab as a hands-on testbed, because I control it and can break it safely.
- Get better at defending AI systems themselves, starting with prompt injection and the other risks in the OWASP list for LLM applications.

These are directions, not results. I'm not going to claim measurements or models I haven't built, and when I do have real findings, I'll write them up here.

## Why I'm sharing this

Partly so people who work on either side can tell me where I'm wrong. And partly because I'd like my next role, whether a student job or a collaboration, to be somewhere AI and security are treated as one subject.

---

*This article was written by AI, with Atharv in the loop, about work he did. [How this site is made](/about-this-site/).*
