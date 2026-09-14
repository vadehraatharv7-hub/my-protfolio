---
title: "AI-SOC & Azure Honeypot Project"
tagline: "Cowrie SSH/Telnet honeypot on Azure with Terraform, Loki/Grafana telemetry, and LLM-powered attack triage."
description: "Provisioned a Cowrie honeypot on Microsoft Azure using Terraform infrastructure-as-code. Live attack telemetry is ingested through Loki and Grafana dashboards, with an integrated LLM-based analysis component that parses attack payloads and classifies incoming threats by attack vector, intent, and severity."
category: "Cloud Security"
technologies:
  - "Azure"
  - "Terraform"
  - "Cowrie Honeypot"
  - "Loki"
  - "Grafana"
  - "LLM Triage"
  - "Python"
  - "Docker"
github: "https://github.com/vadehraatharv7-hub"
demo: "https://vadehraatharv7-hub.github.io/my-protfolio/"
featured: true
status: "OPERATIONAL LAB"
metrics:
  Cloud Platform: "Microsoft Azure"
  IaC: "Terraform"
  Honeypot Engine: "Cowrie (SSH/Telnet)"
  Telemetry: "Grafana + Loki"
  AI Analysis: "LLM Threat Classification"
---

## 0x01 // Architectural Overview

Modern cloud infrastructure is continually probed by automated scanners, credential stuffers, and adversary botnets. This project provisions an automated, cloud-hosted **Cowrie Honeypot** on **Microsoft Azure** using **Terraform**, designed to capture, log, and classify adversary interactions in real-time.

```text
[ Internet Adversary / Botnet ]
               │
               ▼ (SSH / Telnet brute-force probes)
    [ Azure Virtual Network / NSG ]
               │
               ▼
   [ Cowrie Honeypot Container ]
               │
   ┌───────────┴──────────────────────────┐
   ▼                                      ▼
[ Raw TTY & Session Logs ]     [ Promtail Log Shipper ]
   │                                      │
   ▼                                      ▼
[ LLM Threat Classifier ]      [ Grafana Loki Central Store ]
(Pattern & Severity Triage)               │
   │                                      ▼
   └──────────────────────────────► [ Live SOC Dashboards ]
```

---

## 0x02 // Infrastructure-as-Code & Log Pipeline

1. **Automated Azure Provisioning**: All cloud resources—including Azure Resource Groups, Virtual Networks, Network Security Groups (NSG), and Virtual Machines—are declared via **Terraform** for reproducible and isolated lab spin-up.
2. **Cowrie Ingestion**: Emulates an interactive Linux terminal, capturing session replay logs, download hashes of uploaded malware binaries, and SSH key authentication attempts.
3. **Telemetry with Loki & Grafana**: Live attack logs are aggregated using Promtail and shipped to Grafana Loki, giving instant visibility into top attacking IP subnets, credentials used, and geo-origins.
4. **LLM-Based Threat Classification**: Incoming suspicious payloads and multi-step commands are piped through an LLM component that translates raw shell inputs into classified MITRE ATT&CK techniques, evaluating severity and potential intent.

---

## 0x03 // Observability & Incident Response

- Automated alerts notify upon high-severity exploit attempts (e.g., shellcode download or credential dumping).
- Zero lateral movement risk: The honeypot VM is isolated inside a DMZ subnet with strict egress filtering to prevent abuse.
