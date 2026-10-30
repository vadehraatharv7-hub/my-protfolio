---
title: "Building a homelab where nothing is trusted: the story of six projects"
description: "Why I built a Proxmox homelab as code: to practise both sides of security, host real things safely, attract attackers on purpose, and watch them. How six small projects fit together."
date: 2026-10-30
category: writeup
tags: ["Homelab", "Proxmox", "Terraform", "Cybersecurity", "Zero Trust", "Least privilege", "Network security", "Firewall"]
project: proxmox-homelab-iac
sources:
  - title: "Proxmox VE Firewall"
    url: "https://pve.proxmox.com/wiki/Proxmox_VE_Firewall"
  - title: "gitleaks"
    url: "https://github.com/gitleaks/gitleaks"
  - title: "GitHub secret scanning push protection"
    url: "https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection"
draft: false
---

**TL;DR:** I'm studying cybersecurity, and I wanted somewhere to practise it for real, not just read about it. So I turned a spare Proxmox machine at home into a small lab, and I built it entirely from code so I can wipe and rebuild any part of it. This post is the big picture: what I'm trying to do, how the six projects connect, and what I'm learning.

## What I'm trying to do

Security is easy to study from the outside and hard to feel. I can read about brute-force attacks, command injection or log analysis, but it sticks when I have to run the thing, break it, defend it and explain what happened.

So I set myself a simple goal with three parts:

1. **Host real things safely**, so I learn what "safe" actually takes.
2. **Attract attackers on purpose** with honeypots, so I can watch how real attacks behave.
3. **Build the monitoring** to notice and record what happens, and keep the evidence.

The rule I gave myself: everything is code. If I can't rebuild it from a repository, I don't really understand it.

## The six projects, as one story

They look like separate folders, but I think of them as chapters:

1. **[Hosting my own app](/blog/budget-tracker-zero-open-ports-proxmox/).** I started with something normal: put my Budget Tracker app on the internet without opening a port on my home router.
2. **[A target to practise on](/blog/sharing-dvwa-safely-cloudflare-access/).** I built a deliberately vulnerable web app and worked out how to let friends attack it safely.
3. **[Eyes on everything](/blog/wazuh-siem-unprivileged-lxc-terraform/).** I set up a SIEM (Wazuh), because attacks you can't see teach you nothing.
4. **[Bait](/blog/honeypots-in-lxc-cowrie-snare-wazuh/).** I added honeypots, fake SSH and web servers that exist to be attacked, wired into the SIEM with my own detection rules.
5. **[Memory](/blog/wazuh-events-to-mongodb-insert-only-shipper/).** I made a separate database that keeps every event, so I can ask new questions of old data later.
6. **[The bigger design](/blog/vlan-honeypot-platform-terraform-ansible/).** I designed a larger version with separate network zones, for when I have the hardware and a proper router.

## The idea underneath: assume something will be compromised

The one habit I want to take away from this lab is a way of thinking. Instead of asking "how do I stop every attack?", I ask "when this one gets owned, what can the attacker reach?"

So every container gets the same treatment. It can't talk to anything it doesn't need to, and the rules that enforce that live on the hypervisor, outside the container, so someone with a shell inside can't turn them off. Concretely: block all inbound and outbound traffic by default, allow a short list, and block my home network and private ranges *before* allowing the public internet. The order matters, because the first matching rule wins.

I also keep it all in a public repository, which taught me its own lesson: how to keep secrets out of code. State files, passwords and tokens are git-ignored, a pre-commit hook scans for leaks, and GitHub checks again when I push.

## What I'm still figuring out

I'd rather be honest about the gaps than pretend it's finished:

- Everything shares one network, so a stricter split into zones is the next step (that's the larger design above).
- Backups sit on the same disk as the things they back up.
- The honeypots are new, so I'm not going to claim numbers about attacks I haven't measured yet.

## Why this matters to me

I want to be someone who can build infrastructure, secure it, and then prove it works by watching it get tested. This lab is where I'm practising all three. If you're working on something similar, I'd love to compare notes.

The code is in the [homelab repository](https://github.com/vadehraatharv7-hub/homelab), and the details of each stack are on the [project pages](/projects/).

---

*This article was written by AI, with Atharv in the loop, about work he did. [How this site is made](/about-this-site/).*
