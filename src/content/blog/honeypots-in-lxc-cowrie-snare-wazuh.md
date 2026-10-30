---
title: "I built traps for attackers: honeypots that tell me how real attacks behave"
description: "Why I run honeypots (a fake SSH server and a fake website), what I want to learn from them, and how I wired them into Wazuh with detection rules, while keeping the traps from becoming a way in."
date: 2026-10-30
category: writeup
tags: ["Honeypot", "Cowrie", "Snare", "Tanner", "Wazuh", "MITRE ATT&CK", "Detection engineering"]
project: homelab-honeypots-lxc
sources:
  - title: "Cowrie SSH/Telnet honeypot"
    url: "https://github.com/cowrie/cowrie"
  - title: "Snare"
    url: "https://github.com/mushorg/snare"
  - title: "Tanner"
    url: "https://github.com/mushorg/tanner"
  - title: "MITRE ATT&CK T1110: Brute Force"
    url: "https://attack.mitre.org/techniques/T1110/"
  - title: "Wazuh documentation"
    url: "https://documentation.wazuh.com/current/"
draft: false
---

**TL;DR:** A honeypot is a machine that exists to be attacked. I run two: a fake SSH and Telnet server, and a fake website. They are my way of learning how real attacks behave, because the best teacher is watching one. This is chapter four of my [homelab story](/blog/hypervisor-firewall-pattern-homelab/).

## What I was trying to do

Anything connected to the internet is probed constantly by automated scanners. I've read about it, but I wanted to see it. What usernames do they try? What do they type once they think they're in? What do they try to download?

I already had an [Azure version of this](/projects/ai-soc-azure-honeypot/) with a custom dashboard. This time I wanted a smaller one that fits a homelab, using the SIEM I'd just built as the dashboard. My aims:

- **Learn from real behaviour**, not textbook examples.
- **Practise detection engineering**: turn raw logs into alerts that someone would actually act on.
- **Stay safe.** A honeypot is bait. If it gets owned, it must be a dead end.

## The two traps

**Cowrie** pretends to be an SSH and Telnet server. It looks like a Debian box, lets attackers "log in", and records everything: logins, commands, files they try to download. It's only reachable from my lab, never from the internet.

**Snare and Tanner** pretend to be a website. Snare clones a real site, and Tanner decides how to respond to what visitors try. This one is published to the internet through a tunnel with no login, on purpose, because a trap nobody can reach catches nothing.

## Turning logs into something meaningful

Raw logs are just noise, so I wrote detection rules in Wazuh, mapped to the MITRE ATT&CK framework that defenders use to describe attacker behaviour:

| What happens | Alert level | ATT&CK idea |
|---|---|---|
| Someone connects | low | |
| A failed login | low | Brute force |
| An attacker gets in | high | Valid accounts |
| They type a command | high | Command execution |
| They download or upload a file | highest | Ingress tool transfer |
| Eight failed logins from one address within two minutes | high | Brute force |

That last one is my favourite. It's a single alert for a persistent attacker instead of eight small ones, which is how a real analyst would want it. For the web trap I use Wazuh's built-in attack rules, plus one of mine so that ordinary visits show up too (Wazuh hides normal requests by default).

## Keeping the trap from becoming a way in

I assume both traps will be compromised. So:

- They're unprivileged containers behind a hypervisor firewall they can't switch off.
- They can't reach my home network, my other containers or my VPN. They can only reach the public internet, because Cowrie has to fetch whatever attackers try to download.
- The website trap runs in Docker with all extra permissions removed and memory limits applied, and it only trusts one address to tell it who the visitor really is, so nobody can forge their identity in my logs.

## What I learned

- Detection is a design problem. Deciding what deserves an alert is harder than collecting logs.
- Odd technical details bite. Docker inside an unprivileged container needs a feature that only the main Proxmox account can set, so I wrote a small step to set it over SSH.
- Outbound internet access from a honeypot is its biggest risk, and I want to tighten it later.

## An honest note

These are new, so I'm not going to quote attack statistics I haven't measured. Once there's real data, I want to write about what I find.

Next chapter: [keeping every event for later](/blog/wazuh-events-to-mongodb-insert-only-shipper/). Details are on the [project page](/projects/homelab-honeypots-lxc/).

---

*This article was written by AI.*
