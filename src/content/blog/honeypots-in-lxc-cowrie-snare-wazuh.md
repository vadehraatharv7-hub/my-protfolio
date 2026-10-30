---
title: "Cowrie and Snare/Tanner in LXC: a small honeypot with real detection rules"
description: "Two firewalled LXC honeypots (Cowrie SSH/Telnet, Snare/Tanner web) reporting to Wazuh, with custom rules mapped to MITRE ATT&CK and a safety model that assumes the decoys will be compromised."
date: 2026-10-30
category: writeup
tags: ["Honeypot", "Cowrie", "Snare", "Tanner", "Wazuh", "MITRE ATT&CK", "Detection engineering"]
project: homelab-honeypots-lxc
sources:
  - title: "Cowrie SSH/Telnet honeypot"
    url: "https://github.com/cowrie/cowrie"
  - title: "Snare"
    url: "https://github.com/mushorg/snare"
  - title: "Tanner"
    url: "https://github.com/mushorg/tanner"
  - title: "MITRE ATT&CK T1110: Brute Force"
    url: "https://attack.mitre.org/techniques/T1110/"
  - title: "Wazuh documentation"
    url: "https://documentation.wazuh.com/current/"
draft: false
---

**TL;DR:** I rebuilt my honeypot platform as two small Proxmox containers: one running Cowrie (a fake SSH and Telnet shell) and one running Snare and Tanner (a cloned website with an analysis back end). Both send logs to Wazuh, where seven custom rules and Wazuh's built-in web-attack rules turn attacker behaviour into alerts mapped to MITRE ATT&CK.

## The problem

My original platform used four VMs, two VLANs and a custom dashboard. It suits a proper network, but it is heavy for a homelab host with a single NAT bridge. I wanted the same decoys and the same detections, using the SIEM I already run as the dashboard, with a design simple enough to rebuild in minutes.

## Design

```text
internet ─▶ portal.example.com ─▶ Cloudflare ─▶ tunnel ─▶ nginx ─▶ Snare ─▶ Tanner     [hp-web]
lab network ─▶ :22 SSH, :23 Telnet ─▶ Cowrie                                          [hp-cowrie]
both ─▶ Wazuh agent ─▶ manager :1514 ─▶ rules 100100-100199
```

**Cowrie** presents a fake Debian shell on ports 22 and 23 and records every login attempt, command and file transfer. It is never published; only the lab can reach it. My real admin SSH moved to port 22222.

**Snare and Tanner** clone a website and judge each request. They run in Docker behind nginx, with images pinned by digest, all capabilities dropped, and memory and process limits. This one *is* published through a Cloudflare Tunnel, with no login, because a honeypot nobody can reach catches nothing.

## The detections

The decoys' logs have to become something a human would act on. Cowrie writes JSON with an `eventid`, so one parent rule matches `^cowrie\.` and child rules branch from it:

| Rule | Level | Meaning | ATT&CK |
|---|---|---|---|
| 100101 | 4 | Connection to the decoy | |
| 100102 | 5 | Failed login | T1110 Brute Force |
| 100103 | 9 | Attacker logged in | T1078 Valid Accounts |
| 100104 | 10 | Command typed in the shell | T1059 Command Interpreter |
| 100105 | 12 | File downloaded or uploaded | T1105 Ingress Tool Transfer |
| 100106 | 10 | 8 failed logins from one address in 2 minutes | T1110 |

Rule 100106 is a frequency rule: it counts rule 100102 hits with `same_field` set to `src_ip` over a 120 second window, so one noisy scanner becomes one high-level alert, not eight low ones.

For the web decoy I reused Wazuh's built-in rules (SQL injection, XSS, shellshock, path traversal and 4xx scanning). The gap was ordinary requests: Wazuh's rule 31108 drops 2xx and 3xx traffic at level 0, which would make a decoy's normal traffic invisible. Rule 100110 matches the decoy's log path and surfaces it at level 3.

## The safety model: assume compromise

- Both containers are unprivileged and firewalled by the hypervisor, outside their reach.
- Inbound is limited to the Proxmox host and the lab, on the decoy ports.
- Outbound is DNS, NTP, the Wazuh manager, then the public internet only. Private ranges are dropped before the web is allowed, so a compromised decoy cannot reach the LAN, the other containers or Tailscale.
- Cowrie runs as an unprivileged user in a sandboxed systemd unit with a memory cap, and binds ports 22 and 23 through `CAP_NET_BIND_SERVICE` alone.
- The tunnel reaches nginx from the Docker gateway, which is the only address nginx trusts for the `CF-Connecting-IP` header. The logs show real attackers, and a lab user cannot forge that header.

## What went wrong

**Docker needs `keyctl`.** Running Docker in an unprivileged container requires that feature, but Proxmox lets only `root@pam` set feature flags, not an API token. The fix is a `null_resource` that runs `pct set` on the host over SSH and restarts the container once. The provider is told to ignore feature drift so it does not revert it.

**Parallel creation raced.** Two containers created at once could ask for the same "next free" ID, so IDs are fixed.

**Rootcheck noise.** Wazuh's rootcheck reports many anomalies inside LXC containers that have nothing to do with attackers, and I disabled hardening and rootcheck scans for the whole `honeypots` group.

## Results and what I would change

I now have two decoys, with detections and an audit trail, defined in code. The weakest point is egress: outbound web stays open because Cowrie must fetch what attackers `wget`, and Tanner may fetch URLs for remote-file-inclusion probes. If that worries me I can restrict it after the install. I also dropped the larger platform's XDP ban filter here, since it needs a real kernel. I make no claims about attack volumes, because the point of this write-up is the design.

See the [honeypot project page](/projects/homelab-honeypots-lxc/), the [Wazuh stack](/projects/wazuh-siem-homelab/) and my larger [Azure honeypot](/projects/ai-soc-azure-honeypot/).

---

*This article was written by AI.*
