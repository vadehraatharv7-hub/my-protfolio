---
title: "I wanted to host my own app at home without opening a single port"
description: "Why I self-host my Budget Tracker on a Proxmox container, how I made it reachable without port forwarding, and how I deploy and roll back safely using Terraform, Cloudflare Tunnel and Tailscale."
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

**TL;DR:** I built a small Budget Tracker app and wanted to run it myself, at home, as a real service at budget.atharvvadehra.dev. The challenge I set myself: do it without opening any port on my router and without a server I'd be afraid to touch. This is the first chapter of my [homelab story](/blog/hypervisor-firewall-pattern-homelab/).

## What I was trying to do

I'm studying cybersecurity, and I didn't want my first "real" project to be a toy. The most honest test I could think of was to host something of my own, put it on the internet, and see what it takes to do that responsibly.

I set three goals:

- **Nothing exposed at home.** Port forwarding puts your router in front of the internet and reveals your home IP address. I wanted to avoid both.
- **Rebuildable from code.** If the server dies, I want one command to bring it back, not a weekend of remembering what I clicked.
- **Deploys I can trust.** When I push code, it should reach the server automatically, and if it breaks, it should undo itself.

## How I solved it, in plain terms

**Getting traffic in.** Instead of letting the internet connect to my house, the container connects *out* to Cloudflare, and Cloudflare hands visitors to it through that tunnel. Visitors see my hostname and a proper HTTPS certificate. My router forwards nothing. The app itself only listens on the container's own loopback address, so even a mistake elsewhere wouldn't expose it.

**Getting code out.** GitHub Actions deploys to the container over Tailscale for the duration of the job, using a special account that can run exactly one command: update the app. No SSH key sits in GitHub. I kept publishing (Cloudflare) and deploying (Tailscale) on separate paths on purpose, so a problem with one can't take out the other.

**Undoing mistakes.** The update script builds the new version on the side, swaps it in, checks the app's health endpoint, and restores the previous version if the check fails.

**Building it all.** Terraform creates the container, installs everything and sets up the tunnel. The first time I applied it with no Cloudflare credentials at all, then added the tunnel and CI access in layers.

## What I learned

- Security is mostly about limiting what each piece is allowed to do. The deploy account can do one thing. The container is unprivileged. The app can't be reached from the LAN.
- Choices are shaped by real constraints. My host's Wi-Fi can't be bridged, so I used a private NAT network, which fit my goals anyway.
- A backup you haven't restored isn't a backup. I restored mine to a new container and checked the app came back with its data.

## What's still not great

- Backups live on the same disk as the container. An off-host copy is next.
- Terraform's state is only on my Mac.
- It's a single machine, so there's no failover.

Next chapter: [how to share something deliberately vulnerable, safely](/blog/sharing-dvwa-safely-cloudflare-access/). The technical details are on the [project page](/projects/proxmox-homelab-iac/).

---

*This article was written by AI, with Atharv in the loop, about work he did. [How this site is made](/about-this-site/).*
