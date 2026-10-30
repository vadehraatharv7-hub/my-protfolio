---
title: "I wanted friends to practise hacking on my lab, without letting them near my network"
description: "Why I host a deliberately vulnerable web app (DVWA) for others to learn on, and how I share it safely using Cloudflare Access, an unprivileged container and a hypervisor firewall."
date: 2026-10-30
category: writeup
tags: ["DVWA", "Cloudflare Access", "Terraform", "Proxmox", "Web security", "Homelab"]
project: dvwa-cloudflare-access-lab
sources:
  - title: "DVWA (Damn Vulnerable Web Application)"
    url: "https://github.com/digininja/DVWA"
  - title: "Cloudflare Access policies"
    url: "https://developers.cloudflare.com/cloudflare-one/policies/access/"
  - title: "Cloudflare provider for Terraform"
    url: "https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs"
draft: false
---

**TL;DR:** The best way I know to learn web security is to attack something legal. I wanted other people to be able to do that on my lab too, so I set up DVWA (a web app built to be hacked) and worked out how to share it without giving anyone access to my network. This is chapter two of my [homelab story](/blog/hypervisor-firewall-pattern-homelab/).

## What I was trying to do

Practising on your own laptop is fine, but it's more fun, and you learn more, with other people. I wanted classmates and friends to be able to open a link, sign in, and try SQL injection or command injection against a real target.

The catch is that DVWA is *meant* to be exploitable. It even ships with a public login, `admin` / `password`. If I put it on the internet as it is, I'd be handing strangers a shell on a machine that sits next to my other projects. So the real project wasn't "install DVWA". It was "invite people in without letting the danger out".

## My approach: two separate protections

I thought about it as two different questions.

**Who can get in?** Only people I invite. A guest opens the link, types their email address, gets a one-time code, and they're through. They don't need to install anything or join my VPN. Cloudflare Access handles that. To invite someone I add their address to a list and re-run Terraform; to remove them I delete it and re-run.

**What if someone gets out?** I assume they will. DVWA teaches command injection and file upload, so a guest *will* get a shell inside the container. That shell has to be useless:

- The container is unprivileged, so "root" inside is an ordinary user on the host.
- A firewall on the hypervisor, outside the container's reach, blocks it from my home network, my other containers and my private VPN. It can reach the public internet only.
- There's nothing valuable inside: no VPN credentials, no keys, just a throwaway database password.
- If a guest breaks the app, I reset it from DVWA's setup page, or rebuild the container.

## Small details I'm proud of

- The public DNS name can't be created until the login wall exists, because I made it depend on the Access application. There's no window where the site is open.
- If sharing is on but the guest list is empty, Terraform refuses to apply, instead of quietly creating a site nobody can open.

## What I learned

Treat "who gets in" and "what happens if someone gets out" as separate problems, and solve both. Also, the Proxmox Terraform provider can't write firewall rules, so I render the rule file and copy it to the host. I now reuse that approach across every project.

## What I'd change next

If lots of people used it, I'd give each person their own container so one guest's mess doesn't affect another. I'd also tighten outbound traffic further, since DVWA doesn't need the internet once it's installed.

Next chapter: [giving the lab eyes with a SIEM](/blog/wazuh-siem-unprivileged-lxc-terraform/). The details are on the [project page](/projects/dvwa-cloudflare-access-lab/).

---

*This article was written by AI, with Atharv in the loop, about work he did. [How this site is made](/about-this-site/).*
