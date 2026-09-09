---
title: "Neural Network Anomaly & Intrusion Detection Pipeline"
tagline: "Real-time 10Gbps packet inspection streaming engine integrating Suricata, Zeek, Apache Kafka, and PyTorch heuristics."
description: "A distributed, wire-speed network threat detection pipeline built to monitor enterprise transit. Ingests raw network feeds, processes protocol metadata via Zeek and Suricata, and applies real-time streaming ML classification in Python to intercept zero-day C2 beacons."
category: "Network Security"
technologies:
  - "Python"
  - "FastAPI"
  - "Suricata"
  - "Zeek"
  - "Apache Kafka"
  - "PyTorch"
  - "Docker"
  - "AWS ECS"
github: "https://github.com/atharvvadehra/network-anomaly-detector"
demo: "https://soc-pipeline.atharvvadehra.dev"
featured: true
status: "OPERATIONAL"
metrics:
  Wire Speed: "10 Gbps"
  Detection Time: "< 820 ms"
  False Positives: "< 0.04%"
  Daily Events: "48 Million"
---

## 0x01 // Threat Detection Architecture

Modern adversaries disguise command-and-control (C2) channels inside legitimate HTTPS and DNS queries. Static signature matching fails against randomized beacons and domain-generation algorithms (DGA).

This pipeline pairs deterministic signature detection with statistical heuristics and lightweight PyTorch neural networks running on stream consumer groups:

```text
[ Network TAP ] ──► [ Zeek & Suricata IDS ] 
                              │
                    (EVE JSON Streams)
                              │
                              ▼
                   [ Apache Kafka Cluster ]
                              │
                              ├──► [ PyTorch DGA / C2 Classifier ]
                              └──► [ Automated Firewall Shunning Script ]
```

---

## 0x02 // Real-Time Feature Extraction Engine

The ingestion engine processes Zeek connection logs (`conn.log`, `dns.log`, `ssl.log`) to compute rolling statistical features:
- Connection duration vs. payload byte asymmetry
- Shannon entropy of requested Fully Qualified Domain Names (FQDNs)
- JA3/JA4 TLS client hello cryptographic fingerprinting
- Inter-arrival packet jitter distributions

```python
# Entropy analysis module snippet
import math

def calculate_shannon_entropy(payload_sample: bytes) -> float:
    if not payload_sample:
        return 0.0
    entropy = 0.0
    length = len(payload_sample)
    frequencies = [payload_sample.count(bytes([i])) for i in range(256)]
    for count in frequencies:
        if count > 0:
            prob = float(count) / length
            entropy -= prob * math.log2(prob)
    return entropy
```

---

## 0x03 // Defensive Shunning & Incident Response

Upon scoring a connection above the anomalous threshold ($P > 0.94$), the pipeline emits an automated webhook into the edge firewall to drop traffic from the offending IP for 60 minutes while exporting full context logs to the SOC team.
