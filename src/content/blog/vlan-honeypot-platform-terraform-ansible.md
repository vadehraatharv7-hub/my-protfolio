---
title: "A two-zone honeypot platform on Proxmox with Terraform and Ansible"
description: "Designing a honeypot platform with a DMZ and a core VLAN: unattended VM installs, per-VM hypervisor firewalls from Terraform, Ansible roles, and isolation tests that are supposed to fail."
date: 2026-10-30
category: writeup
tags: ["Honeypot", "Terraform", "Ansible", "Proxmox", "VLAN", "Network segmentation"]
project: proxmox-vlan-honeypot-platform
sources:
  - title: "Proxmox VE Firewall"
    url: "https://pve.proxmox.com/wiki/Proxmox_VE_Firewall"
  - title: "Ansible documentation"
    url: "https://docs.ansible.com/"
  - title: "Terraform provider for Proxmox (Telmate)"
    url: "https://registry.terraform.io/providers/Telmate/proxmox/latest/docs"
  - title: "Cowrie SSH/Telnet honeypot"
    url: "https://github.com/cowrie/cowrie"
draft: false
---

**TL;DR:** This is the Proxmox version of my honeypot platform: two decoys in a DMZ VLAN, a dashboard and a database in a core VLAN. Terraform creates the VMs and their hypervisor firewalls, Ansible configures them, and a verification playbook tries connections that must fail to prove the zones are isolated. It has been validated and rendered but not yet run against real hardware.

## The problem

A honeypot is a machine you expect to lose. The platform around it, the dashboard that shows attacks and the database that stores them, must not be lost with it. The design question is how to make the DMZ decoys compromisable without handing an attacker a path to the data.

## Design

```text
Internet ─▶ DMZ  VLAN 66 10.66.0.0/24                      CORE VLAN 67 10.67.0.0/24
            vm-honeypot .10  Cowrie (SSH 22, Telnet 23) ──8081──▶ vm-monitoring .10  SecDash dashboard
            vm-snare    .11  Snare/Tanner (80, 443)     ──8081──▶         │
                                                                          └──27017──▶ vm-database .11  MongoDB
```

Isolation is enforced twice:

1. **Separate VLANs** per zone, with the router refusing inter-zone traffic except DMZ to the dashboard on 8081.
2. **A hypervisor firewall on every VM's NIC**, policy drop both ways, with MAC and IP spoofing filters. Honeypots may talk only to the dashboard on 8081, DNS, NTP and the public internet. Only the dashboard may reach the database on 27017. Real SSH moved to port 22222, key-only and from the admin range.

## Terraform

Terraform handles everything up to a running OS:

- It downloads the Ubuntu 22.04 server ISO and checks its SHA-256.
- It builds one seed ISO per VM carrying the unattended-install configuration: user, SSH key, static IP, SSH port, packages.
- It creates the four VMs on the zone VLANs and renders one firewall file per VM.
- It writes the Ansible inventory, so the next tool needs no manual input.

Ubuntu's installer insists on asking `Continue with autoinstall?` because the install wipes the disk. A playbook handles that one prompt with `qm sendkey` on the Proxmox host, and then waits for each VM to answer on SSH.

## Ansible

Roles run in order: common hardening (updates, NTP, hardened `sshd`, fail2ban on 22222, unattended security updates, kernel hardening), MongoDB 8.0 (authentication on, bound to the private address, version held, daily backup), the SecDash dashboard (Go backend, Node frontend, PM2, nginx with HTTPS), then the sensors: Cowrie, Snare and Tanner, log shipping with Vector, and the XDP ban filter. Everything is idempotent, so a second run changes nothing that is already right.

## Tests that are supposed to fail

The step I find most useful is `verify.yml`. Checking that services are running proves little about isolation, so it also does the following:

- From each honeypot it tries to reach the database (27017), the dashboard's SSH (22222) and its web UI (443). All must fail.
- From the dashboard it tries the honeypot's admin SSH. That must fail too.

If any connection succeeds, the run stops and points to the Proxmox firewall. This is how you find out that the datacenter firewall is still switched off, or that a firewall file never got written.

## What I would be honest about

- **It has not been applied to real hardware.** It passes `terraform validate`, and the firewall files, seeds and inventory were rendered and inspected, but I recommend `terraform plan` first. I would rather say this than imply a tested deployment.
- The provider cannot create bridges, VLANs or firewall rules, so those depend on a VLAN-aware bridge I already have, my router, and the rendered files.
- `terraform.tfstate` holds the database password and a throwaway OS password, so state is a secret.
- Backups remain on the database VM's disk, and MongoDB traffic is unencrypted though confined to the core VLAN.

The lighter container version for a single NAT bridge is on the [honeypot LXC page](/projects/homelab-honeypots-lxc/), and this design is on its [project page](/projects/proxmox-vlan-honeypot-platform/).

---

*This article was written by AI.*
