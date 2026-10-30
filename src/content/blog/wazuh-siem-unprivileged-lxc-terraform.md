---
title: "Running a Wazuh SIEM in an unprivileged LXC with Terraform"
description: "Building Wazuh all-in-one in a firewalled Proxmox container with Terraform, publishing it behind Cloudflare Access, and labelling every event as decoy or production through agent groups."
date: 2026-10-30
category: writeup
tags: ["Wazuh", "SIEM", "Terraform", "Proxmox", "Cloudflare Access", "Detection engineering"]
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

**TL;DR:** I run Wazuh (indexer, server and dashboard) in one unprivileged container at security.atharvvadehra.dev. Terraform builds it, firewalls it from the hypervisor, and puts a Cloudflare Access login in front of it. Agent groups tell Wazuh whether a machine is a decoy or a real host, and that label travels with every event.

## The problem

A honeypot without monitoring only collects dust. I needed a SIEM to receive logs from the decoys and, later, from real machines I run on the internet, and I wanted it reproducible, reachable from anywhere by me only, and not a new hole in my network.

## Design

```text
you    ─▶ security.atharvvadehra.dev ─▶ Cloudflare Access (email PIN) ─▶ tunnel ─▶ dashboard on 127.0.0.1:443
agents ─▶ manager :1514 events / :1515 enrolment   (only from the addresses in agent_sources)
```

**Build.** One unprivileged Debian 12 container with 4 cores, 6 GB RAM and 50 GB disk. Wazuh's minimum is 4 GB, and the extra 2 GB gives headroom for a handful of agents. `app.tf` runs the all-in-one installer over SSH through the Proxmox host. A first apply takes 10 to 20 minutes, almost all of it the installer.

**Access.** Two logins: Cloudflare Access (an email PIN for anyone on the guest list) and then Wazuh's own `admin` login. The installer generates the Wazuh password and it stays on the container, not in Terraform state.

**Network.** The hypervisor firewall drops everything by default. The dashboard and SSH are open to the Proxmox host only. Agent ports are open only to listed addresses, so with an empty `agent_sources` nothing can enrol. Outbound is DNS, NTP, the MongoDB log store (placed above the private-range drops), and the public web.

## Agent groups: what is this machine?

The part I like most is how Wazuh learns what each agent is. Terraform creates two groups with their own configuration:

| Group | Meaning | Labels added to every event |
|---|---|---|
| `honeypots` | Intentional decoys | `decoy=true`, `origin=honeypot` |
| `internet-hosts` | Real machines I run | `decoy=false`, `origin=production` |

For decoys, the hardening benchmark (SCA) and rootcheck are switched off, since scoring a honeypot against a hardening policy it is meant to violate only creates noise. Classification depends on where I enrolled the machine, not on a heuristic. A real host joins with `WAZUH_AGENT_GROUP=internet-hosts`. The group files are validated with `verify-agent-conf` before use.

## Rules that cannot break the manager

My custom rules (IDs 100100 to 100199) live in an XML file that Terraform copies to the manager. The install step then runs `wazuh-analysisd -t`. If the test fails, the file is **deleted** and the apply fails, so a typo cannot leave the manager down. Only after a clean test does it restart the service. The rules themselves are described in the [honeypot write-up](/blog/honeypots-in-lxc-cowrie-snare-wazuh/).

## What went wrong

- **A host kernel setting.** The indexer needs `vm.max_map_count >= 262144`, and a container cannot change that. The script now checks it and stops with a clear message instead of failing deep inside the installer.
- **Partial upgrades.** Unattended upgrades could split Wazuh's three packages across versions, so they are on `apt-mark hold`, and changing `wazuh_version` does not upgrade an existing install.
- **Failed installs.** The recovery is `bash wazuh-install.sh -u` on the container and `terraform apply -replace=null_resource.app`.

## Results and what I would change

I now have a SIEM that I can destroy and recreate from code, with every event carrying its origin. Agent enrolment currently uses Wazuh's default of no password, protected only by the firewall's `agent_sources`. Enrolment passwords would be a cheap improvement. The TLS between the tunnel and the dashboard uses Wazuh's own certificate over loopback with verification off, which is acceptable only because it never leaves the machine.

See the [Wazuh project page](/projects/wazuh-siem-homelab/) and the [code](https://github.com/vadehraatharv7-hub/homelab/tree/main/projects/wazuh).

---

*This article was written by AI.*
