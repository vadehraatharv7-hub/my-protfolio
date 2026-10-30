---
title: "A lab you can't see into teaches you nothing: why I built my own SIEM"
description: "Why I run Wazuh as the eyes of my homelab, and how I built it from code: a firewalled container, a login-protected dashboard, and labels that tell decoys apart from real machines."
date: 2026-10-30
category: writeup
tags: ["Wazuh", "SIEM", "Security monitoring", "Terraform", "Proxmox", "Cloudflare Access", "Zero Trust", "Detection engineering"]
project: wazuh-siem-homelab
sources:
  - title: "Wazuh documentation"
    url: "https://documentation.wazuh.com/current/"
  - title: "Cloudflare Tunnel documentation"
    url: "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/"
  - title: "Proxmox VE Firewall"
    url: "https://pve.proxmox.com/wiki/Proxmox_VE_Firewall"
draft: false
---

**TL;DR:** Once I had things running in my lab, I realised I couldn't tell what was happening inside them. A SIEM fixes that: it collects logs from every machine and flags the suspicious ones. I built Wazuh in a container from code, put a login in front of it, and taught it the difference between my decoys and my real machines. This is chapter three of my [homelab story](/blog/hypervisor-firewall-pattern-homelab/).

## What I was trying to do

My goal is to understand how attacks look from the defender's side. That needs a place where events from many machines end up, get checked against rules, and can be searched. In a company this is the security operations centre. I wanted a small one of my own.

Three things mattered to me:

- **It has to be reproducible.** If I break it while experimenting, I want to rebuild it in one command, not repair it by hand.
- **It has to be safe.** A SIEM holds logs from everything, so it's a very attractive target. I shouldn't build the most sensitive machine in my lab and then leave it open.
- **It has to know what it's looking at.** Alerts from a honeypot and alerts from a machine I actually care about are completely different things.

## How I built it

I chose [Wazuh](https://wazuh.com/), an open-source SIEM, and ran it in one container with 4 cores, 6 GB of RAM and 50 GB of disk. Terraform builds the container, runs the installer, and sets up access, so the whole thing is a single `terraform apply` (the first run takes 10 to 20 minutes, mostly the installer).

**Who can see it.** It's published at security.atharvvadehra.dev, but behind two doors: Cloudflare Access (an emailed one-time code, only for people I list) and then Wazuh's own login.

**What it can reach.** The same containment as every other container in the lab: a firewall on the hypervisor that blocks everything by default. Only my listed machines can send it logs, and it can only talk out to a few places it needs.

## The part I like most: labels

Wazuh groups the machines that report to it. I made two groups:

| Group | Meaning | Label on every event |
|---|---|---|
| `honeypots` | Fake machines that exist to be attacked | `decoy=true`, `origin=honeypot` |
| `internet-hosts` | Real machines I run on the internet | `decoy=false`, `origin=production` |

So a machine is classified by where I *enrolled* it, not by a guess. That means a login attempt on a honeypot is noise I want to study, while one on a real host is something I want to be woken up for. For the decoys I also turned off the hardening checks, since grading a trap against a security checklist is meaningless.

## Rules that can't break the system

I write my own detection rules (more in the [honeypot post](/blog/honeypots-in-lxc-cowrie-snare-wazuh/)). Installing them is deliberately careful: the file is tested before use, and if it doesn't load it's deleted and the install stops. A typo should never take my SIEM offline.

## What I learned

- A good lab needs a way to see inside it. Building the tools is half the project; watching them is the other half.
- Real systems have prerequisites you only find by running them. The search engine inside Wazuh needs a host-wide kernel setting that a container can't change, so my script now checks for it and says so clearly.
- Pinning versions matters. The three Wazuh packages are held so an automatic update can't split them.

## What I'd improve

New agents currently enrol without a password; only the firewall protects that step. Adding enrolment passwords is a cheap win.

Next chapter: [the honeypots that feed it](/blog/honeypots-in-lxc-cowrie-snare-wazuh/). Details are on the [project page](/projects/wazuh-siem-homelab/).

---

*This article was written by AI, with Atharv in the loop, about work he did. [How this site is made](/about-this-site/).*
