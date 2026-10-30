---
title: "AI-SOC & Azure Honeypot Project"
tagline: "Azure honeypots built with Terraform and Ansible, feeding SecDash: my own Go and React platform that scores attackers, links campaigns and maps behaviour to MITRE ATT&CK."
description: "Cowrie (SSH/Telnet) and Snare/Tanner (web) honeypots on Microsoft Azure, provisioned with Terraform and Ansible. Events flow through Vector into SecDash, a custom Go and React analytics dashboard backed by Azure Cosmos DB, with a local rule engine for ATT&CK mapping and an eBPF/XDP agent that drops banned IPs."
category: "Cloud Security"
technologies:
  - "Azure"
  - "Terraform"
  - "Ansible"
  - "Cowrie Honeypot"
  - "Snare / Tanner"
  - "Vector"
  - "Go"
  - "React"
  - "Azure Cosmos DB (MongoDB API)"
  - "MITRE ATT&CK"
  - "eBPF / XDP"
  - "Threat Detection"
  - "SOC Dashboards"
  - "Network Security Groups"
  - "Private Endpoint"
github: "https://github.com/vadehraatharv7-hub"
order: 1
---

## What it is

Internet-facing machines are probed all day by scanners, credential stuffers and botnets. This project puts decoys in front of that traffic on **Microsoft Azure**, captures everything the attackers do, and turns the raw logs into answers: who is attacking, how far they got, which attackers are the same operation, what malware they dropped and which MITRE ATT&CK techniques they used.

It has three parts, which I built as separate repositories:

| Part | What it is |
|---|---|
| **honeypot-infra** | Terraform for the Azure environment, and Ansible roles that configure every machine |
| **SecDash** | The analytics dashboard: a Go backend and a React frontend |
| **xdp-shield** | An eBPF/XDP agent that drops banned IP addresses at the network interface |

## Architecture

```text
Internet attackers
   │  SSH 22 / Telnet 23                 HTTP(S) 80 / 443
   ▼                                     ▼
[ vm-honeypot: Cowrie ]          [ vm-snare: nginx (TLS) ─► Snare ─► Tanner ]
   │                                     │
   └── Vector (acknowledged batches, shared ingest key) ──┐
                                                          ▼  POST /api/ingest/stream
                                    [ vm-monitoring: SecDash backend (Go) ]
                                          │  in-memory analytics + WebSocket
                                          │                      ▲
                                          ▼                      │ polls /api/threats/banned
                    [ Azure Cosmos DB (MongoDB API), reached through a Private Endpoint ]
                                          │
                                          ▼
                                   [ React dashboard ]            xdp-shield on each honeypot
```

## Infrastructure as code

**Terraform** declares the Azure resources: a resource group and virtual network with separate subnets for the honeypot, the web decoy, monitoring and the database; network security groups; public IPs; three Ubuntu 22.04 virtual machines; and a Cosmos DB account (MongoDB API) that is reachable only through an Azure **Private Endpoint** with private DNS, so the database is not exposed to the internet.

**Ansible** then configures each machine with roles for Vector (log shipping), the Cowrie honeypot, Snare and Tanner, the monitoring hub, and xdp-shield. Terraform writes the inventory, secrets stay on the controller and out of git, and the playbooks are idempotent.

## SecDash: the analytics platform

SecDash is my own replacement for a generic dashboard stack. It ingests Cowrie-style JSON events, normalises and geolocates them, stores them, and streams them to the browser live.

| Area | What it answers |
|---|---|
| Command Center | KPIs against the previous period, an attack funnel (scan, login, shell, payload), activity timeline, map and top sources |
| Attackers | Every source IP with a 0-100 risk score, a behaviour class (scanner, brute-forcer, credential validator, intruder, malware dropper, web recon) and credential style (dictionary, spraying, stuffing) |
| Sessions | Reconstructed sessions with a replayable command transcript and a 7-stage kill chain |
| Campaigns | IPs linked by shared payload hash, payload URL or identical command playbook |
| Credentials and Commands | What was guessed, what was accepted, and commands grouped into recon, download, persistence, evasion and mining |
| ATT&CK Coverage | A matrix of observed MITRE ATT&CK techniques, with click-through to the sessions |
| Alerts and Blocklist | Slack, Discord or webhook alerts with per-IP rate limits, and a blocklist that xdp-shield consumes |

### A local rule engine, not an LLM

The detection knowledge lives in a Go package of command and web-request signatures, malware-family markers and the ATT&CK mapping, with scoring and campaign clustering in a separate analytics package. Both have unit tests. Locations are never invented: an IP with no resolved location simply has none.

An earlier version of this project used an LLM to summarise attacks. I removed it, and the analysis is now a local, deterministic rule engine.

### Designed around a free-tier database

Cosmos DB's free tier allows 400 request units per second, so the design avoids hitting the database for reads. The newest events are held in memory and every chart is derived from them, so the database is used for writes and one load at startup. Vector sends at most 30 events per second, and an event is only confirmed once it has been saved.

### Securing the platform itself

- Sensors must send a shared ingest key, so a compromised machine in the sensor subnet cannot inject fake events.
- Dashboard accounts use username and password with bcrypt-hashed storage, 12-hour signed session tokens, and lockout after repeated failures.
- Webhook targets that resolve to private or loopback addresses are refused.

## Hardening the decoys

The honeypots are expected to be attacked, so they are boxed in:

- Outbound traffic is limited to the dashboard, web (80/443) and NTP.
- Cowrie caps concurrent connections per IP, purges old captures daily, runs with systemd resource limits, and presents a consistent Ubuntu identity instead of Cowrie's well-known defaults.
- Snare sits behind an nginx proxy that terminates TLS, hides Snare and Tanner's identifying header and cookie, and logs the real client address. Its containers are pinned by image digest, drop capabilities and have memory and process limits.

Known gaps, which I list in the repository: Cowrie's SSH handshake and default fake filesystem remain recognisable to a careful attacker.

## xdp-shield: dropping bad traffic in the kernel

`xdp-shield` is a small Go and C program. A C eBPF/XDP program drops packets from banned addresses at the network interface, before the normal network stack sees them, and a Go loader (using the Cilium eBPF library) keeps the kernel's address map in sync by polling SecDash's `/api/threats/banned` endpoint. Per its README, the map is an LRU hash holding up to 65,536 addresses. It originally used a Redis message feed; I replaced that with REST polling and removed Redis from the stack.

## How it changed

The first version used Cowrie with a Promtail, Loki and Grafana pipeline and an LLM triage component. The current design replaces that with a purpose-built dashboard, Vector for log shipping, a Cosmos DB database behind a Private Endpoint, an ingest key and logins, and the XDP agent. Grafana and Loki are no longer part of it.

## What I want to do next

Bring machine learning back on top of the structured data SecDash already produces (risk scores, behaviour classes, campaigns and ATT&CK techniques), and measure how well it does against the rule engine. That is a plan, not a result, and I'll write it up when I have findings. It connects to my [homelab honeypots](/projects/homelab-honeypots-lxc/), which feed a Wazuh SIEM, and to [why I'm building the bridge between AI/ML and cybersecurity](/blog/bridging-ai-ml-and-cybersecurity/).

---

*This project page was written by AI, with Atharv in the loop, about work he did. [How this site is made](/about-this-site/).*
