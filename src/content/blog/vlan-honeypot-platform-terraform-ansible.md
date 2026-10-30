---
title: "The bigger design: a honeypot platform with separate network zones"
description: "My plan for a larger honeypot platform on Proxmox: decoys in one network zone, the data in another, built with Terraform and Ansible and tested by connections that must fail. Not yet run on hardware."
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

**TL;DR:** My container-based honeypots are small by design. This is the larger version I designed for when I have the hardware: the traps in one isolated network zone and everything valuable in another, built entirely from code. It's validated, but I haven't run it on real hardware yet, and I'll say so plainly. This is the sixth part of my [homelab story](/blog/hypervisor-firewall-pattern-homelab/).

## What I was trying to do

A honeypot is a machine you expect to lose. The dashboard that shows the attacks and the database that stores them must not be lost with it. The question that drove this design was: **how do I let the traps be compromised without giving an attacker any path to the data?**

I'd already done a version of this on Azure. I wanted the same platform on my own Proxmox host, and I wanted to practise the skills a real security team uses: network segmentation, automated builds and proving your isolation works.

## The design

Two zones, each its own VLAN:

- **DMZ (the exposed zone):** a Cowrie SSH/Telnet decoy and a Snare/Tanner web decoy.
- **Core (the protected zone):** the dashboard and the MongoDB database.

The only thing the traps may send to the core is their events, to the dashboard on one port. Only the dashboard may talk to the database. Nothing in the DMZ can reach the database, my home network, or any private network.

I enforce that twice, on purpose: the router limits traffic between zones, and a firewall on the hypervisor guards every virtual machine's network card. If I get one wrong, the other still stands.

## How it's built

- **Terraform** downloads and verifies the operating-system image, creates four VMs that install themselves unattended, and writes each VM's firewall rules.
- **Ansible** then hardens each machine and installs the right software for its role: SSH hardening, automatic security updates, the database, the dashboard and the decoys. It's idempotent, so running it twice changes nothing that's already right.

## The part I find most useful: tests that must fail

Checking that services are running doesn't prove isolation. So my verification playbook tries connections that should be impossible: from each decoy it tries to reach the database, the dashboard's admin SSH and its web UI, and from the dashboard it tries the decoy's admin SSH. If any of them connects, the run stops and tells me to check the firewall.

That's the only reliable way I know to find out that a firewall switch is off, or a rule file was never written. A security control you haven't tried to break is just a hope.

## Being honest about where it is

- **It hasn't been run on real hardware.** It passes Terraform's validation, and I rendered and inspected the firewall rules, install files and inventory, but I'd run a `terraform plan` first and I won't claim a tested deployment.
- Terraform can't create bridges, VLANs or firewall rules for me, so those depend on my network setup.
- The state file contains passwords, so it's treated as a secret.
- Backups still sit on the same disk.

## Why I'm sharing it

Because designing something carefully, saying which parts are proven and which aren't, and planning how to test it, is the work I want to be doing. The lighter version that runs today is [here](/blog/honeypots-in-lxc-cowrie-snare-wazuh/), and the details of this one are on its [project page](/projects/proxmox-vlan-honeypot-platform/).

---

*This article was written by AI, with Atharv in the loop, about work he did. [How this site is made](/about-this-site/).*
