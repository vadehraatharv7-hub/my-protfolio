---
title: "Air-Gapped Proxmox VE SecLab: Automated IaC Provisioning with Terraform and OPNSense"
subtitle: "How I built an enterprise-grade virtualized security playground with VLAN micro-segmentation, Wazuh SIEM, and automated rollback triggers."
date: "2026-06-19"
time: "14 min read"
header_image: "/images/proxmox-lab.svg"
author: "Atharv Vadehra"
sources:
  - "https://pve.proxmox.com/wiki/Network_Configuration"
  - "https://registry.terraform.io/providers/bpg/proxmox/latest/docs"
  - "https://opnsense.org/about/features/"
  - "https://documentation.wazuh.com/current/getting-started/index.html"
tags:
  - "Proxmox"
  - "Terraform"
  - "Homelab"
  - "Wazuh"
  - "SIEM"
classification: "RESTRICTED // SOC_INTEL"
---

## 0x01 // Why Every Security Engineer Needs a Proxmox Cluster

Theory only takes you so far in cybersecurity. To understand how advanced malware operates, how active directory forests collapse under Kerberoasting attacks, or how microsegmentation halts ransomware spreading, you need a safe, isolated, enterprise-replica sandbox.

In this build, I designed an air-gapped **Proxmox Virtual Environment (PVE)** cluster driven completely by Infrastructure-as-Code (IaC) via **Terraform** and **Ansible**.

---

## 0x02 // Network Topology & Strict VLAN Micro-Segmentation

The homelab hardware consists of custom bare-metal nodes running Proxmox VE 8.2 on ZFS mirror storage pools. Network routing is managed through a virtualized **OPNSense** firewall appliance:

```text
[ WAN Uplink ]
       │
[ OPNSense Gateway (Virtual Appliance) ]
       ├──► VLAN 10 (Management / IPMI / Proxmox GUI) - 10.10.10.0/24
       ├──► VLAN 20 (SOC & SIEM Operations / Wazuh)    - 10.10.20.0/24
       ├──► VLAN 30 (Active Directory Enterprise Ring)  - 10.10.30.0/24
       └──► VLAN 66 (Air-Gapped Malware Detonation DMZ) - 10.10.66.0/24 [NO INTERNET]
```

### OPNSense Strict Egress Rule

VLAN 66 (the detonation playground) has zero default gateway routing to the internet and is strictly isolated from the management network. If an emulated adversary deploys wiper malware, it cannot reach production interfaces.

---

## 0x03 // Declarative VM Provisioning with Terraform

Instead of manually deploying VMs through the Proxmox Web GUI, everything is declared in Terraform using the `bpg/proxmox` provider. This enables 1-click teardown and recreation of vulnerable lab environments:

```hcl
terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "0.66.0"
    }
  }
}

resource "proxmox_virtual_environment_vm" "ad_domain_controller" {
  name        = "dc01-infra-lab"
  node_name   = "pve-node-01"
  vm_id       = 301

  cpu {
    cores = 4
    type  = "host"
  }

  memory {
    dedicated = 8192
  }

  network_device {
    bridge = "vmbr0"
    vlan_id = 30
  }

  disk {
    datastore_id = "local-zfs"
    size         = 60
    interface    = "scsi0"
  }

  operating_system {
    type = "win11"
  }
}
```

---

## 0x04 // Automated ZFS Snapshot & Rollback Triggers

Before running any offensive red team payload or exploit simulation, an automated bash trigger captures instantaneous ZFS copy-on-write snapshots:

```bash
# Automated snapshot hook executed via CI/CD runner
$ pvesh create /nodes/pve-node-01/qemu/301/snapshot --snapname "pre-detonation-$(date +%s)"
```

When the experiment completes, a single CLI command restores the clean state within 400 milliseconds, eliminating hours of manual OS reinstalls.

---

## 0x05 // Final Assessment

By bridging DevOps tooling (Terraform, CI/CD pipelines) with defensive security engineering (Wazuh SIEM, isolated VLANs, Suricata IDS), this homelab serves as an impenetrable testbed for real-world offensive defense research.
