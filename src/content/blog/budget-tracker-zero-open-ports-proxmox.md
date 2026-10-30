---
title: "Hosting an app at home with zero open ports: Terraform, Cloudflare Tunnel and Tailscale"
description: "How I run my Budget Tracker on a Proxmox LXC with no router port forwards, deploy to it from GitHub Actions through Tailscale SSH, and roll back automatically when a deploy is unhealthy."
date: 2026-10-30
category: writeup
tags: ["Terraform", "Proxmox", "Cloudflare Tunnel", "Tailscale", "GitHub Actions", "Homelab"]
project: proxmox-homelab-iac
sources:
  - title: "Cloudflare Tunnel documentation"
    url: "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/"
  - title: "Tailscale SSH"
    url: "https://tailscale.com/kb/1193/tailscale-ssh"
  - title: "Proxmox VE: Linux Container"
    url: "https://pve.proxmox.com/wiki/Linux_Container"
  - title: "Terraform provider for Proxmox (Telmate)"
    url: "https://registry.terraform.io/providers/Telmate/proxmox/latest/docs"
draft: false
---

**TL;DR:** My Budget Tracker app runs in an unprivileged Proxmox container at home and is reachable at budget.atharvvadehra.dev without opening a single port on my router. Terraform builds the container, Cloudflare Tunnel publishes it, and GitHub Actions deploys to it over Tailscale SSH with a user that can run exactly one command.

## The problem

I wanted to self-host an app I use every day, and I wanted the setup to be something I could rebuild from code, not a pet server I was afraid to touch. Self-hosting at home usually means port-forwarding, which exposes the home IP address and puts the router in front of the internet. I also wanted CI deploys without storing an SSH key in GitHub.

## Design

```text
Users ──HTTPS──▶ Cloudflare ──▶ tunnel (opened outbound by cloudflared) ──▶ app on 127.0.0.1:3000
GitHub Actions ──Tailscale SSH as tag:ci──▶ deploy user ──▶ sudo budget-update <sha>
Terraform on my Mac ──Proxmox API token + SSH──▶ the host
```

**Publishing.** `cloudflared` runs inside the container and dials out to Cloudflare. Cloudflare serves the hostname and the HTTPS certificate. The router forwards nothing, and the home IP never appears in DNS. The app itself binds to `127.0.0.1`, so even a wrong firewall rule would expose nothing on the container's LAN address.

**Deploys.** Tailscale is used for one job only. The runner joins the tailnet for the length of the workflow as `tag:ci`, using an OAuth client, so no SSH key is stored in GitHub. The tailnet policy lets that tag reach the container on port 22 as user `deploy` and nothing else. The `deploy` user has no password and no authorised keys, and `sudoers` allows it a single command: `budget-update`.

Keeping publishing (Cloudflare) and deploying (Tailscale) on separate paths means an outage or misconfiguration of one does not affect the other.

**The container.** It is an unprivileged Debian 12 LXC (root inside is an ordinary user on the host) on a private NAT bridge. Nesting is switched on only because systemd's service sandboxing needs it. A NAT bridge was a practical choice because my host's uplink is Wi-Fi, which cannot be bridged. The cost is that nothing outside the host reaches the container except through the tunnel or Tailscale, which fits the goal anyway.

## The Terraform stack

The stack is layered, and later layers switch on only when credentials exist:

1. `template.tf` finds and downloads the newest Debian 12 template on the host.
2. `lxc.tf` creates the container with a static IP and key-only SSH.
3. `app.tf` jumps through the Proxmox host and runs `bootstrap.sh`, which installs Node, creates the `budget` and `deploy` users, writes the sudoers rule and the `budget-update` script, and installs Tailscale and `cloudflared`.
4. `cloudflare.tf` adds a login rate limit and, optionally, a Cloudflare Access login wall.

Resources use `count = local.cf_enabled ? 1 : 0`, so the first `terraform apply` works with no Cloudflare token at all. That is how I first applied it: container first, tunnel and CI access afterwards.

## Safe deploys with automatic rollback

`budget-update <sha>` fetches the commit, runs `npm ci` and builds into `dist.next`. It then swaps the build into place, restarts the service and calls the health endpoint. If the check fails it restores the previous build and the previous commit. To roll back by hand, I re-run the Deploy workflow with an older SHA.

## Protecting the login

The app has its own password login. Cloudflare's free plan allows one rate-limit rule, so I use it where it matters: at most five `POST /api/login` requests per ten seconds per visitor. The stack can also place Cloudflare Access in front of the app, including a service token for the one path an iPhone Shortcut calls (`/api/shortcuts`), because a Shortcut cannot do an interactive login.

## Trade-offs and quirks

- The host's Wi-Fi uplink cannot be bridged, so NAT was the only practical network. The cost is that machines outside the host reach the container only through the tunnel or Tailscale.
- Proxmox returns container descriptions with a trailing newline, which made Terraform want to change them on every plan. `lifecycle { ignore_changes }` fixes that, and it also stops a newer template from rebuilding a running container.

## Results and what I would change

I ran a backup restore to a new container ID and the app came back with its data, which is the only backup test that counts. The gaps I still want to close:

- Backups are on the same disk as the container. An off-host copy is next.
- The edge rate limit needs a narrowly scoped token (Zone Read, Zone WAF Edit) and is not applied yet.
- Terraform state is local. A remote backend would let me recover from losing my Mac without importing resources.
- It is one host, so there is no high availability.

The code is in the [homelab repository](https://github.com/vadehraatharv7-hub/homelab), and the project summary is on the [Proxmox Homelab as Code](/projects/proxmox-homelab-iac/) page.

---

*This article was written by AI.*
