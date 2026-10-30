---
title: "Proxmox Homelab as Code (Terraform, Cloudflare, Tailscale)"
tagline: "A public infrastructure-as-code repository that builds my homelab servers with zero open ports, least-privilege access and rollback-safe deploys."
description: "One Terraform repository for a Proxmox homelab: unprivileged LXC containers, Cloudflare Tunnels for publishing, Tailscale SSH for CI deploys only, hypervisor firewalls, and secret hygiene (git-ignored state, pre-commit gitleaks, push protection). It hosts the Budget Tracker app at budget.atharvvadehra.dev and every other lab in this section."
category: "Homelab & Virtualization"
technologies:
  - "Terraform"
  - "Proxmox VE"
  - "LXC"
  - "Cloudflare Tunnel"
  - "Cloudflare Access"
  - "Tailscale SSH"
  - "GitHub Actions"
  - "Bash"
  - "systemd"
  - "gitleaks"
github: "https://github.com/vadehraatharv7-hub/homelab"
demo: "https://budget.atharvvadehra.dev"
order: 2
---

## What it is

[`homelab`](https://github.com/vadehraatharv7-hub/homelab) is the repository that builds the servers I run at home. Everything is Terraform: a container is created, configured, firewalled, published and backed up from code, so I can destroy one and rebuild it the same way. It is public on purpose, because the code is the portfolio, which means the repository is also an exercise in keeping secrets out of version control.

It currently holds six stacks, one folder each, with their own state, README and `terraform.tfvars.example`:

| Stack | Purpose |
|---|---|
| `budget-tracker` | Hosts my Budget Tracker PWA at budget.atharvvadehra.dev (this page) |
| [`dvwa`](/projects/dvwa-cloudflare-access-lab/) | A deliberately vulnerable web app that I can safely share with invited guests |
| [`wazuh`](/projects/wazuh-siem-homelab/) | The Wazuh SIEM, published behind Cloudflare Access |
| [`honeypot-lxc`](/projects/homelab-honeypots-lxc/) | Cowrie and Snare/Tanner decoys that report to Wazuh |
| [`logstore`](/projects/mongodb-log-store/) | MongoDB that keeps every Wazuh event |
| [`honeypot`](/projects/proxmox-vlan-honeypot-platform/) | The VM and VLAN version of the honeypot platform, with Ansible |

## Architecture

```text
Users ──HTTPS──▶ Cloudflare (TLS, rate limit, optional Access login)
                       │  outbound tunnel opened by cloudflared
                       ▼
 Proxmox host ── NAT bridge 192.168.50.0/24 ──▶ LXC budget-tracker
                                                 cloudflared · Node app on 127.0.0.1:3000 · SQLite

GitHub Actions ──Tailscale SSH as tag:ci──▶ deploy user ──▶ sudo budget-update <sha>
Terraform (my Mac) ──Proxmox API token + SSH──▶ host
```

## Design decisions

- **No inbound ports.** `cloudflared` inside the container dials out to Cloudflare, which serves the public hostname and HTTPS. The router forwards nothing and the home IP address stays hidden.
- **The app listens on `127.0.0.1`.** Only the local tunnel process can reach it, so a firewall mistake still exposes nothing on the container's LAN address.
- **Two paths with two jobs.** Cloudflare publishes the app. Tailscale carries deploys only, so a problem with one does not affect the other.
- **Unprivileged LXC.** Root inside the container is an ordinary user on the host. Nesting is enabled only because systemd service sandboxing needs it.
- **A private NAT bridge** (`192.168.50.0/24`) isolates the containers from the home LAN. The host uplink is Wi-Fi, which cannot be bridged, so NAT was the practical choice. The trade-off is that machines outside the host reach a container only through the tunnel or Tailscale.

## Access control

| Actor | What it can do |
|---|---|
| Terraform on my Mac | A Proxmox API token scoped to container rights, plus SSH to the host for template download. It reaches containers by jumping through the host. |
| GitHub Actions runner | Joins the tailnet for the length of the job as `tag:ci` using an OAuth client. The tailnet policy allows `tag:ci` to reach the container on port 22 only, as user `deploy`. No SSH key is stored in GitHub. |
| `deploy` user | No password and no authorised keys; it is reachable only through Tailscale SSH. `sudoers` lets it run exactly one command, `budget-update`. |
| `budget` user | Runs the app under systemd and owns the data directory, nothing else. |

## Safe deploys

`budget-update <sha>` runs on the container and does four things:

1. Fetches the commit, runs `npm ci` and builds the web app into a side directory (`dist.next`).
2. Swaps the new build into place and restarts the service.
3. Calls the health endpoint.
4. If the health check fails, restores the previous build and the previous commit.

Re-running the Deploy workflow manually with an older SHA is the rollback path.

## Terraform layout

The stack grows in layers through conditional resources (`count = local.cf_enabled ? 1 : 0`), so it works with no Cloudflare credentials and then gains the tunnel, the rate limit and the login wall as tokens are added.

| File | Purpose |
|---|---|
| `providers.tf` | `telmate/proxmox` pinned to one version for every project, plus `null`, `random`, `external` and `cloudflare` |
| `variables.tf`, `locals.tf` | Validated inputs, derived names and feature switches |
| `template.tf` | Finds and downloads the newest Debian 12 template on the host |
| `lxc.tf` | The container: resources, static IP, key-only SSH, nesting |
| `app.tf` | Copies and runs `scripts/bootstrap.sh` through the host |
| `cloudflare.tf` | A login rate limit (5 password attempts per 10 seconds per visitor), plus an optional Cloudflare Access wall with a service token for iOS Shortcuts |
| `scripts/bootstrap.sh` | Installs Node, creates users and `sudoers`, writes `budget-update`, installs Tailscale and `cloudflared` |

## Secrets in a public repository

| Layer | Control |
|---|---|
| Prevent | `.gitignore` covers `terraform.tfstate*`, `terraform.tfvars`, `credential.auto.tfvars`, `inventory.ini` and `.terraform/` |
| Block locally | A `.githooks/pre-commit` hook refuses those files and runs gitleaks on staged changes |
| Block remotely | GitHub secret scanning with push protection, and a gitleaks workflow on every push and pull request |
| Verify | Full-history scans found no secrets |

Terraform state holds generated passwords, so it never leaves my machine. All projects share one Proxmox API token through a git-ignored symlink, so the secret exists once.

## Backups and recovery

A nightly Proxmox backup (vzdump, `suspend` mode) covers the container. I ran a restore to a new container ID and the app came up with its data.

## Known gaps

I list these in the repository too, because they are part of the design.

- Backups sit on the same disk as the container; an off-host copy is the next improvement.
- The Cloudflare Access wall is written but switched off for the Budget Tracker, because the app has its own login and throttling and Access would complicate the iPhone Shortcuts automation.
- The edge rate limit needs a narrowly scoped API token (Zone Read, Zone WAF Edit) and is not applied yet.
- Terraform state is local with no remote backend, so losing the Mac would mean importing resources again.
- It is a single host with no high availability.

Related write-ups: [Hosting an app at home with zero open ports](/blog/budget-tracker-zero-open-ports-proxmox/) and [One firewall pattern for every container](/blog/hypervisor-firewall-pattern-homelab/).

---

*This project page was written by AI.*
