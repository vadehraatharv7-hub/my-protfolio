---
title: "Kubernetes Production Cluster (Proxmox + k3s)"
tagline: "Self-hosted bare-metal Kubernetes cluster with k3s, Traefik, MetalLB, Prometheus, and Cloudflare Tunnels."
description: "Engineered and deployed a resilient bare-metal self-hosted Kubernetes cluster running k3s on a Proxmox virtualized hypervisor. Implemented Traefik ingress routing, MetalLB bare-metal load balancing, end-to-end automated SSL encryption, Prometheus & Grafana observability, and Cloudflare Zero-Trust edge tunnels."
category: "Homelab & Virtualization"
technologies:
  - "Kubernetes (k3s)"
  - "Proxmox VE"
  - "Traefik Ingress"
  - "MetalLB"
  - "Prometheus"
  - "Grafana"
  - "Cloudflare Tunnels"
  - "Docker"
github: "https://github.com/vadehraatharv7-hub"
order: 2
---

## Infrastructure Overview

Self-hosting production workloads requires enterprise-grade isolation, automated ingress routing, and reliable observability. This project documents the complete architecture and deployment of a multi-node **k3s** Kubernetes cluster hosted on **Proxmox Virtual Environment (PVE)**.

```text
[ Internet / Edge ]
       │
[ Cloudflare Zero-Trust Tunnel ] (Encrypted egress, zero open WAN ports)
       │
       ▼
[ Proxmox VE Hypervisor ]
       ├── [ Master / Control Plane (k3s) ]
       │         └── Traefik Ingress Controller
       ├── [ Worker Node 01 ] ──► MetalLB Layer-2 Virtual IP
       └── [ Worker Node 02 ] ──► Prometheus & Grafana Telemetry Pods
```

---

## Core Components & Architecture

1. **k3s Lightweight Kubernetes**: Stripped of legacy in-tree cloud providers and storage drivers, consuming less than 512MB RAM per control node.
2. **MetalLB Load Balancer**: Configured in Layer-2 mode to assign local LAN IP addresses from a dedicated pool (`192.168.1.200 - 192.168.1.220`) directly to Kubernetes Services of type `LoadBalancer`.
3. **Traefik Ingress with Automatic SSL**: Ingress routes automatically request and renew Let's Encrypt TLS certificates using ACME DNS-01 verification via Cloudflare API tokens.
4. **Cloudflare Tunnels**: Exposes internal cluster services to the public internet through outbound-only HTTPS tunnels, eliminating the security hazard of port-forwarding on home router firewalls.

---

## Observability & Monitoring Stack

A complete Prometheus and Grafana stack was deployed to monitor cluster resource utilization, pod memory pressure, and ingress request rates:

```yaml
# Prometheus k3s scraping manifest snippet
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: traefik-metrics
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: traefik
  endpoints:
  - port: metrics
    interval: 15s
```

The cluster hosts live services, automated backup routines, and provides a production-grade testing ground for cloud-native security research.
