---
title: "Honeypot Platform on Proxmox: VLANs, Terraform and Ansible"
tagline: "Four VMs in two isolated VLAN zones: Cowrie and Snare decoys in the DMZ, the SecDash dashboard and MongoDB in the core."
description: "Terraform builds four unattended-install Ubuntu VMs on Proxmox with per-VM hypervisor firewalls, and Ansible hardens them, installs Cowrie, Snare/Tanner, MongoDB and the SecDash dashboard, then proves zone isolation with failing-connection tests. Not yet run on real hardware."
category: "Network Security"
technologies:
  - "Terraform"
  - "Ansible"
  - "Proxmox VE"
  - "VLAN"
  - "Proxmox Firewall"
  - "Cowrie"
  - "Snare"
  - "MongoDB"
  - "XDP / eBPF"
  - "Network Segmentation"
  - "Threat Detection"
  - "Deception Technology"
  - "Least Privilege"
  - "Go"
github: "https://github.com/vadehraatharv7-hub/homelab/tree/main/projects/honeypot"
order: 11
---

## Why I built this

A honeypot is a machine you expect to lose, so the dashboard and database around it must not be lost with it. The question behind this design: how do I let the traps be compromised without giving an attacker any path to the data? It is also where I practise network segmentation, automated builds, and proving that isolation works. It is the larger sibling of my [container honeypots](/projects/homelab-honeypots-lxc/), and the story is in [The bigger design](/blog/vlan-honeypot-platform-terraform-ansible/).

## What it is

The Proxmox build of the honeypot platform I first ran on Azure: two honeypots, the SecDash dashboard and a MongoDB database, separated into two network zones. The Azure version stays as it is; this one targets a Proxmox host that has a VLAN-aware bridge and a router.

```text
Internet ─(router port forwards)─▶ DMZ  VLAN 66 10.66.0.0/24         CORE VLAN 67 10.67.0.0/24
                                    vm-honeypot .10  Cowrie           vm-monitoring .10  SecDash
 22, 23 ──────────────────────────▶ (SSH/Telnet decoy) ──8081────────▶ (dashboard, ban list)
 80, 443 ─────────────────────────▶ vm-snare    .11  Snare                  │
                                    (web decoy)    ──8081──────────────────┘ ──27017─▶ vm-database .11  MongoDB
```

**Security model:** the honeypots will be compromised; the dashboard and database must not be.

## Terraform: what it creates

| File | Does |
|---|---|
| `iso.tf` | Downloads the Ubuntu 22.04 server ISO onto Proxmox, verified by SHA-256 |
| `seed.tf` | Builds one unattended-install seed ISO per VM (user, SSH key, static IP, SSH on port 22222, packages) |
| `vms.tf` | Four VMs on the zone VLANs with the installer and seed ISO attached and the firewall on |
| `firewall.tf` | Renders and copies `/etc/pve/firewall/<vmid>.fw` for each VM |
| `inventory.tf` | Writes the Ansible inventory, including the database password, for the existing roles |

VM IDs are 9101 to 9104, and host names match Azure so the dashboard names sensors consistently.

## Isolation, enforced twice

1. **VLANs.** One per zone, so the zones are different networks.
2. **Hypervisor firewall on every NIC.** Policy drop in both directions, enforced outside the guest, with `macfilter` and `ipfilter` against MAC, IP and ARP spoofing.

| Role | In | Out |
|---|---|---|
| Honeypots (DMZ) | Decoy ports from anywhere; SSH 22222 from the admin range | Dashboard 8081, DNS, NTP, public web only |
| Dashboard (core) | 8081 from the DMZ; UI and SSH from the admin range | Database 27017, DNS, NTP, public web only |
| Database (core) | 27017 from the dashboard only; SSH from the admin range | DNS, NTP, public web only |

Nothing in the DMZ can reach the database, the LAN or any other private network. The router adds a second layer: inter-zone rules, and port forwards for 22, 23, 80 and 443 without NAT on the source address, so the honeypots log real attackers instead of the router.

## Ansible: configuration and verification

`site.yml` runs these in order:

| Step | What happens |
|---|---|
| `proxmox-installs.yml` | Types the one confirmation each Ubuntu installer needs (`qm sendkey` on the host), then waits for every VM to answer on SSH |
| `common` | Updates, NTP, hardened `sshd`, fail2ban on port 22222, unattended security updates, kernel hardening |
| `mongodb` | MongoDB 8.0 from the official repository, version held, bound to the private address, authentication on, application account, daily backup |
| `monitoring` | The Go backend and React frontend of SecDash, PM2, nginx with HTTPS, admin login and tokens |
| `vector`, `honeypot`, `snare`, `xpd_shield` | Cowrie, Snare/Tanner behind a TLS proxy, log shipping, and the XDP ban filter |
| `verify.yml` | Checks every service **and** that the zones are isolated |

Everything is idempotent, so a second run changes nothing that is already right.

### Tests that must fail

`verify.yml` does not just check that services are up. From inside each honeypot it tries to open connections that *must* fail: the database (27017), the dashboard's SSH (22222) and its web UI (443). From the dashboard it tries the honeypot's admin SSH. If any connection succeeds, the run stops and tells me to check the Proxmox firewall. That is how a still-disabled datacenter firewall or a missing rule file gets caught.

## XDP ban filter

The dashboard publishes a ban list, and `xdp-shield` (built from Go sources in my `Multi_ML_HoneyPot` project) reads it on each honeypot and runs as a systemd service to drop banned addresses early in the network path, before they reach the decoy. XDP needs a real kernel of its own, which is why it is not part of the container variant.

## Honest limits

- **Not applied against real hardware yet.** It passes `terraform validate`, and the firewall files, install seed and inventory were rendered and inspected, but nothing has been run against a Proxmox host. The README says to run `terraform plan` first.
- The provider cannot create bridges, VLANs or firewall rules, so those come from the VLAN-aware bridge, the router and the rendered files.
- `terraform.tfstate` contains the database password and a throw-away OS password, so it must be treated as a secret.
- Backups sit on the database VM's disk; traffic to MongoDB is unencrypted but confined to the core VLAN.

Related write-up: [Designing a two-zone honeypot platform with Terraform and Ansible](/blog/vlan-honeypot-platform-terraform-ansible/).

---

*This project page was written by AI, with Atharv in the loop, about work he did. [How this site is made](/about-this-site/).*
