---
title: "Homelab Honeypots: Cowrie and Snare/Tanner in LXC"
tagline: "SSH, Telnet and web decoys in firewalled containers, with custom Wazuh rules mapped to MITRE ATT&CK."
description: "A slim, Proxmox-LXC version of my honeypot platform: a Cowrie SSH/Telnet decoy and a Snare/Tanner web decoy, each in an unprivileged hypervisor-firewalled container with a Wazuh agent. Seven custom rules and the built-in web-attack rules turn attacker behaviour into alerts."
category: "Network Security"
technologies:
  - "Cowrie"
  - "Snare"
  - "Tanner"
  - "Wazuh"
  - "MITRE ATT&CK"
  - "Docker"
  - "nginx"
  - "Terraform"
  - "Proxmox Firewall"
  - "Cloudflare Tunnel"
github: "https://github.com/vadehraatharv7-hub/homelab/tree/main/projects/honeypot-lxc"
order: 4
---

## What it is

Honeypots are systems that exist to be attacked, so that defenders can watch what attackers try. This is the homelab-sized version of my larger [Azure honeypot and AI-SOC project](/projects/ai-soc-azure-honeypot/): the same decoys, but with no separate dashboard or database, because **Wazuh is the dashboard**. Two unprivileged Debian 12 containers sit on the NAT bridge, each firewalled by the hypervisor and each running a Wazuh agent.

```text
internet ─▶ portal.example.com ─▶ Cloudflare (no login) ─▶ tunnel ─▶ nginx ─▶ Snare ─▶ Tanner    [hp-web]
lab (192.168.50.0/24) ─▶ :22 SSH, :23 Telnet ─▶ Cowrie                                         [hp-cowrie]
                      both ─▶ Wazuh agent ─▶ manager :1514 ─▶ rules 100100-100199
```

## The two decoys

| | `hp-cowrie` | `hp-web` |
|---|---|---|
| Decoy | [Cowrie](https://github.com/cowrie/cowrie) 3.1.3: a fake Debian shell on SSH 22 and Telnet 23 that records logins, commands and downloads | [Snare](https://github.com/mushorg/snare) (a cloned site) plus [Tanner](https://github.com/mushorg/tanner), behind nginx, in Docker with images pinned by digest |
| Reachable from | The lab only. Never published | The lab, and the internet through a Cloudflare Tunnel |
| Real admin SSH | Port 22222 (the decoy owns 22) | Port 22 |
| Size | 1 core, 768 MB, 8 GB | 2 cores, 1.5 GB, 10 GB |
| Wazuh log source | `cowrie.json` | nginx `access.log` in combined format |

## Detection rules

Both agents enrol in the `honeypots` group, so everything they report carries `decoy=true`. My rules live on the Wazuh manager:

| Rule | Level | Fires on | MITRE ATT&CK |
|---|---|---|---|
| 100101 | 4 | A connection to the SSH/Telnet decoy | |
| 100102 | 5 | A failed decoy login | T1110 Brute Force |
| 100103 | 9 | An attacker got into the decoy | T1078 Valid Accounts |
| 100104 | 10 | A command typed in the decoy shell | T1059 Command Interpreter |
| 100105 | 12 | A file downloaded or uploaded in the decoy | T1105 Ingress Tool Transfer |
| 100106 | 10 | Eight failed logins from one address within two minutes | T1110 |
| 100110 | 3 | An ordinary request to the web decoy | |

Wazuh's built-in 31xxx rules (levels 5 to 12) already cover SQL injection, XSS, shellshock, path traversal and 4xx scanning on the web decoy. Rule 100110 exists because Wazuh's rule 31108 swallows ordinary 2xx and 3xx requests at level 0, which would make a decoy's normal traffic invisible.

## Safety model: assume the decoys get compromised

- **Unprivileged containers** whose firewall is enforced by the hypervisor, outside their reach.
- **Inbound** only from the Proxmox host and the lab, on the decoy ports.
- **Outbound** DNS, NTP, the Wazuh manager, then the public internet only. Private ranges (LAN, the other containers, Tailscale) are dropped before the web is allowed, so a compromised decoy cannot pivot.
- **Cowrie** runs as an unprivileged user in a sandboxed systemd unit with a memory cap, binding ports 22 and 23 through `CAP_NET_BIND_SERVICE` alone.
- **Docker** containers drop all capabilities and have memory and process limits.
- **Trusted client address.** The tunnel reaches nginx from the Docker gateway, the only address trusted to report the visitor's real IP through `CF-Connecting-IP`. The log shows real attackers and lab users cannot spoof it.
- **No login on the web decoy, on purpose.** A honeypot nobody can reach catches nothing. Cloudflare's own WAF may block some payloads before they arrive, which is expected.

## Engineering notes

- **`keyctl` over SSH.** Docker inside an unprivileged container needs the `keyctl` feature, but Proxmox lets only `root@pam` set feature flags, not an API token. A `null_resource` runs `pct set` on the host and restarts the container once, and the provider is told to ignore feature drift so it does not undo it.
- **Fixed VMIDs.** Two containers created in parallel would race for the same "next free" ID, so IDs are fixed.
- **Ordering.** The Wazuh stack must be applied first with both container addresses in `agent_sources`, or enrolment fails with a hint.
- **Egress is the abuse path.** Outbound web is open because Cowrie fetches what attackers `wget`. Tightening it is a follow-up.
- **Rootcheck noise.** Wazuh's rootcheck reports many "anomalies" inside LXC containers that are not about the decoys.

Related write-up: [Cowrie and Snare/Tanner in LXC, with Wazuh rules](/blog/honeypots-in-lxc-cowrie-snare-wazuh/).

---

*This project page was written by AI.*
