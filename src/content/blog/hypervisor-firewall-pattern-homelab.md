---
title: "One firewall pattern for every container: lessons from six Terraform homelab stacks"
description: "The Proxmox hypervisor firewall pattern reused across my homelab: drop by default, block private ranges before allowing the web, write rules from Terraform, and keep secrets out of a public repo."
date: 2026-10-30
category: writeup
tags: ["Proxmox", "Terraform", "Firewall", "Homelab", "Least privilege", "gitleaks"]
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

**TL;DR:** Across six stacks in my homelab repository, every container gets the same firewall: policy drop in both directions, spoofing filters on, a short allow list, and a rule that blocks all private address ranges *before* allowing the public web. It is written by Terraform, enforced by the hypervisor, and cannot be turned off from inside a compromised guest.

## The problem

My homelab runs things I do not fully trust: a deliberately vulnerable web app, honeypots that expect to be compromised, and a SIEM that holds logs from everything. They share a physical host with an app I use every day. The question for each new container was the same: if this one is owned, what can the attacker reach?

## The pattern

Each stack renders `/etc/pve/firewall/<vmid>.fw` and copies it to the host. The core of every file is identical:

```text
[OPTIONS]
enable: 1
policy_in: DROP
policy_out: DROP
macfilter: 1
ipfilter: 1

IN  ACCEPT  (a short list: the Proxmox host for SSH, plus whatever the role needs)
OUT ACCEPT  DNS to the resolver, NTP
OUT DROP    10.0.0.0/8  172.16.0.0/12  192.168.0.0/16  100.64.0.0/10  169.254.0.0/16
OUT ACCEPT  tcp 80,443   (and the Cloudflare tunnel port where one is used)
```

Four details do the real work:

1. **Enforced outside the guest.** The Proxmox firewall acts on the container's virtual NIC on the host. Root inside the container cannot disable it, which is the whole point for decoys and training targets.
2. **Order matters.** The first matching rule wins, so the private-range drops come *before* the public web is allowed. A compromised container can fetch packages from the internet but cannot reach the LAN, a sibling container, or a Tailscale address (`100.64.0.0/10`).
3. **Exceptions go above the drops.** The Wazuh container needs to reach MongoDB, which lives on the same private bridge, so that single rule is placed before the private-range drops. The honeypots get the same treatment for the Wazuh manager.
4. **Spoofing filters.** `macfilter` and `ipfilter` plus an IP set stop a guest forging another machine's MAC or address.

## Writing it from Terraform

The `telmate/proxmox` provider cannot manage firewall rules, so each stack uses a `null_resource` with a `file` provisioner to write the rules, and a destroy-time provisioner that removes the file. Because destroy provisioners may only read `self`, the values they need are stored in `triggers`. The rules are hashed (`sha256(local.firewall_file)`), so any change to the allow list re-applies the file.

One prerequisite catches people out: per-container rules do nothing until the datacenter firewall is switched on.

## Per-role allow lists

| Container | Inbound | Outbound extras |
|---|---|---|
| DVWA | SSH and HTTP from the host | none |
| Wazuh | SSH and 443 from the host; 1514 and 1515 from listed agent addresses | MongoDB on 27017 |
| Log store | SSH from the host; 27017 from the Wazuh manager | none |
| Cowrie decoy | Admin SSH from the host; 22 and 23 from the lab | Wazuh manager on 1514 and 1515 |
| Web decoy | SSH from the host; 80 and 443 from the lab | Wazuh manager; tunnel port |

## Beyond the firewall

- **Unprivileged LXC** everywhere, so root in a container is a normal user on the host.
- **One Proxmox API token**, shared by symlink to a git-ignored file, so the secret exists once.
- **A public repository with no secrets.** `.gitignore` covers state, tfvars, credentials and inventory files. A pre-commit hook blocks them and runs gitleaks. GitHub push protection and a gitleaks workflow check again on the remote. If a secret is ever committed, the order is: rotate first (it is public the moment it is pushed), then clean the history.
- **Conditional resources and validated inputs**, so a stack can be applied in layers and a `check` block fails loudly if, for example, sharing is on with an empty guest list.

## What I would change

The firewall is as strong as the bridge it protects. Everything shares one NAT bridge, so a container that is allowed to talk to Wazuh can in principle try the same port on that address. VLANs per zone, as in my [two-zone honeypot platform](/projects/proxmox-vlan-honeypot-platform/), would be the next tightening for the container stacks. Outbound web is also still open for decoys that need to fetch attacker downloads, which is a known abuse path.

See the projects that use this pattern: [DVWA](/projects/dvwa-cloudflare-access-lab/), [Wazuh](/projects/wazuh-siem-homelab/), [honeypots](/projects/homelab-honeypots-lxc/) and the [log store](/projects/mongodb-log-store/).

---

*This article was written by AI.*
