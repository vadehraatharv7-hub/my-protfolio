---
title: "DVWA Training Lab Shared Through Cloudflare Access"
tagline: "A deliberately vulnerable web app in a firewalled, unprivileged container that invited guests can use with just an email address."
description: "Terraform for an unprivileged Debian LXC running Damn Vulnerable Web Application on Apache, PHP 8.2 and MariaDB. A hypervisor firewall contains it, and a Terraform-managed Cloudflare Tunnel plus Cloudflare Access one-time-PIN login lets guests use it without joining my network."
category: "Network Security"
technologies:
  - "Terraform"
  - "Proxmox VE"
  - "LXC"
  - "Proxmox Firewall"
  - "Cloudflare Tunnel"
  - "Cloudflare Access"
  - "DVWA"
  - "Web Application Security"
  - "Zero Trust"
  - "Network Segmentation"
  - "Least Privilege"
  - "Apache"
  - "PHP"
  - "MariaDB"
github: "https://github.com/vadehraatharv7-hub/homelab/tree/main/projects/dvwa"
order: 10
---

## Why I built this

The best way I know to learn web security is to attack something legal, and it is better with other people. I wanted friends and classmates to practise on a real target in my lab, without giving them access to my network. The project is about inviting people in without letting the danger out. The story is in [I wanted friends to practise hacking on my lab](/blog/sharing-dvwa-safely-cloudflare-access/).

## The problem

I wanted a place where other people could practise web exploitation, without lending out my network and without putting a vulnerable app on the open internet. [DVWA](https://github.com/digininja/DVWA) is exploitable on purpose (SQL injection, command injection, file upload) and ships with the public login `admin` / `password`. Exposed directly, it is an open shell for anyone who finds it.

## Architecture

```text
guest ─▶ dvwa.example.com ─▶ Cloudflare Access (one-time PIN to an allowed email)
                              ─▶ tunnel (outbound from the container) ─▶ Apache on 127.0.0.1
```

`terraform apply` builds all of it:

| File | What it does |
|---|---|
| `lxc.tf` | An unprivileged container (1 core, 768 MB, 6 GB), static IP, key-only root SSH |
| `firewall.tf` | Writes the Proxmox firewall file for the container |
| `cloudflare.tf` | Creates the tunnel, a proxied DNS record and the Access application and policy |
| `app.tf` | Over SSH through the Proxmox host: installs Apache, PHP, MariaDB, DVWA and `cloudflared` |

Terraform creates the tunnel itself and reads back its token, so there is no token to copy out of the Cloudflare dashboard.

## Sharing without a VPN

A guest needs a browser and an email address. To invite someone I add them to `share_emails` (or a whole domain to `share_email_domains`) and run `terraform apply`. Removing them and applying revokes access. Sessions last 24 hours by default.

The DNS record has an explicit `depends_on` on the Access application, so the public name can never exist before the login wall does. A Terraform `check` block also refuses to apply if sharing is on but nobody is on the guest list.

## Why it is contained

I assume a guest gets a shell inside the container, since command injection and file upload are the lessons.

- **Unprivileged LXC.** Root inside is an ordinary user on the host.
- **Hypervisor firewall.** The rules live in `/etc/pve/firewall/<vmid>.fw` and are enforced outside the container, so a shell inside cannot switch them off. Policy is drop in both directions, with MAC and IP spoofing filters on.
  - Inbound: SSH and HTTP from the Proxmox host only.
  - Outbound: DNS, NTP, web and the Cloudflare tunnel port, to the public internet only.
  - RFC 1918, Tailscale (`100.64.0.0/10`) and link-local ranges are dropped *before* the web is allowed, because the first matching rule wins. So it cannot reach the home LAN, my other containers or the tailnet.
- **No secrets worth stealing.** No Tailscale, no deploy user, only a random database password.
- **Loopback services.** Apache and MariaDB listen on `127.0.0.1` when sharing; the tunnel is outbound-only.
- **Easy reset.** Re-running DVWA's setup page (Create / Reset Database) or recreating the container undoes anything a guest breaks.

## Day-to-day operations

| Task | How |
|---|---|
| Add or remove a guest | Edit `share_emails`, run `terraform apply` |
| Reset the lab data | DVWA Setup, Create / Reset Database |
| Change the default difficulty | `dvwa_security_level` and apply |
| Upgrade DVWA | Change `dvwa_ref` and apply |
| Remove everything | `terraform destroy` (container, firewall file, tunnel, DNS and Access app) |

## What I learned

The Proxmox Terraform provider has no firewall resources, so the firewall file is rendered by Terraform and copied to the host over SSH, with a destroy-time provisioner that removes it. That pattern is reused by every other stack in the repository.

Related write-up: [Sharing a deliberately vulnerable app safely](/blog/sharing-dvwa-safely-cloudflare-access/).

---

*This project page was written by AI, with Atharv in the loop, about work he did. [How this site is made](/about-this-site/).*
