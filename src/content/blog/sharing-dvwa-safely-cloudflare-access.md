---
title: "Sharing a deliberately vulnerable app safely with Cloudflare Access and a hypervisor firewall"
description: "How I let friends practise on DVWA without a VPN: a Terraform-built tunnel and Cloudflare Access email PIN in front, an unprivileged LXC and a hypervisor firewall behind."
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

**TL;DR:** DVWA is a web app built to be hacked, with a public default login. I run it in a firewalled, unprivileged container and share it through a Cloudflare Tunnel guarded by Cloudflare Access. A guest needs a browser and an email address; I add or remove them with one line of Terraform.

## The problem

Learning web exploitation needs a target. Running DVWA on your own laptop is fine, but I wanted friends and classmates to try the same lab, and I did not want to add them to my Tailscale network or open a port. Putting DVWA directly on the internet would hand out an open shell, since command injection and file upload are exactly what it teaches.

## Design

```text
guest ─▶ dvwa.example.com ─▶ Cloudflare Access (one-time PIN to an allowed email)
                              ─▶ tunnel opened from the container ─▶ Apache on 127.0.0.1
```

Two layers protect the home network. The **login wall** controls *who* reaches DVWA. The **containment** limits *what DVWA can reach* if somebody gets a shell anyway.

### The login wall

Terraform creates the whole chain: the tunnel, its configuration, a proxied CNAME to `<tunnel-id>.cfargotunnel.com`, an Access policy listing allowed emails (or whole domains), and the Access application for the hostname. Because Terraform creates the tunnel, there is no token to copy from the dashboard.

Two safeguards live in the code:

- The DNS record `depends_on` the Access application, so the public name can never exist before the login wall does.
- A `check` block fails the apply if sharing is on but the guest list is empty, which would otherwise create a site nobody can open.

Revoking a guest is removing their address and re-applying. Sessions last 24 hours by default.

### The containment

I assume a guest gets a shell. So:

- The container is **unprivileged**: root inside is an ordinary user on the host.
- The **Proxmox firewall** runs outside the container. Inbound is SSH and HTTP from the host only. Outbound is DNS, NTP, web and the tunnel port, to the public internet only. Private ranges, Tailscale addresses and link-local ranges are dropped first, so it cannot reach my LAN, my other containers or my tailnet.
- Apache and MariaDB listen on **loopback**, and the tunnel is outbound-only.
- The container holds **no secrets** beyond a random database password: no Tailscale, no deploy user.
- Anything broken is undone with DVWA's Create / Reset Database page, or by recreating the container.

## A gotcha worth knowing

Per-container rules are ignored until the Proxmox datacenter firewall is on, and the Terraform provider cannot write firewall rules at all. So I render the rule file in Terraform and copy it to `/etc/pve/firewall/<vmid>.fw` over SSH, with a destroy-time provisioner to delete it. That approach is the shared pattern for every other stack.

## Results and what I would change

Guests get a working lab with no software to install and I get a one-line way to grant or revoke access. If I ran this for a larger group I would add a per-guest container so one person's reset does not affect another, and restrict outbound web further, since DVWA does not need to reach the internet after installation.

The container code is in the [homelab repository](https://github.com/vadehraatharv7-hub/homelab/tree/main/projects/dvwa), with a summary on the [DVWA project page](/projects/dvwa-cloudflare-access-lab/).

---

*This article was written by AI.*
