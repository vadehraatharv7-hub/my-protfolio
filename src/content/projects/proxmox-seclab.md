---
title: "Air-Gapped Proxmox VE SecLab & SIEM Infrastructure"
tagline: "Fully automated, IaC-driven enterprise virtualization testbed with strict OPNSense VLAN segregation and Wazuh SIEM telemetry."
description: "A private bare-metal security research laboratory engineered to emulate enterprise Active Directory forests, cloud hybrid bridges, and malware detonation sandbox rings. Features declarative Terraform provisioning and instantaneous ZFS state rollbacks."
category: "Homelab & Virtualization"
technologies:
  - "Proxmox VE"
  - "Terraform"
  - "OPNSense"
  - "Wazuh SIEM"
  - "Ansible"
  - "ZFS Storage"
  - "Linux Hardening"
github: "https://github.com/atharvvadehra/proxmox-seclab-iac"
demo: "https://homelab-status.atharvvadehra.dev"
featured: true
status: "HARDENED / AIR-GAPPED"
metrics:
  Hypervisors: "3 Nodes"
  Storage: "ZFS RAID-10"
  VLANs: "4 Segments"
  Snapshot Rollback: "< 450 ms"
---

## 0x01 // Laboratory Objectives & Segmentation

Security research demands an environment that behaves exactly like an enterprise network without risking cross-contamination or unauthorized external beacons.

### Network Topology

- **VLAN 10 [MGMT]**: Proxmox cluster nodes, IPMI/iDRAC management, SSH keys only.
- **VLAN 20 [SOC/SIEM]**: Wazuh Manager, OpenSearch indices, Grafana telemetry.
- **VLAN 30 [CORP]**: Windows Server Domain Controller, Windows 11 Enterprise workstations.
- **VLAN 66 [DMZ/DETONATE]**: Completely isolated sandbox with zero internet egress, utilized for malicious binary execution.

---

## 0x02 // Automated Wazuh SIEM Agent Deployment

Using Ansible playbooks, newly provisioned Terraform VMs automatically register with the Wazuh security manager:

```yaml
- name: Deploy and Configure Wazuh Agent
  hosts: all_nodes
  become: yes
  tasks:
    - name: Import Wazuh GPG Key
      apt_key:
        url: https://packages.wazuh.com/key/GPG-KEY-WAZUH
        state: present

    - name: Install Wazuh Agent
      apt:
        name: wazuh-agent
        state: present
        update_cache: yes

    - name: Configure SIEM Manager Address
      lineinfile:
        path: /var/ossec/etc/ossec.conf
        regexp: '<address>.*</address>'
        line: '<address>10.10.20.10</address>'

    - name: Enable & Start Wazuh Service
      systemd:
        name: wazuh-agent
        enabled: yes
        state: started
```

---

## 0x03 // Recovery & Anti-Contamination Protocols

All virtual disks reside on ZFS mirror pools. Automated pre-detonation snapshots enable single-command instantaneous rollbacks, guaranteeing clean state reproducibility across all security experiments.
