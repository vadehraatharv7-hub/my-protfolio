---
title: "AI-SOC & Azure Honeypot Project"
tagline: "A cloud honeypot platform on Azure: decoy sensors, a hardened private network, a Cosmos DB data layer, and SecDash, my own Go and React analytics dashboard that scores attackers and maps them to MITRE ATT&CK."
description: "System design of an Azure honeypot platform: Cowrie and Snare/Tanner sensors, Vector log shipping with delivery guarantees, a private-endpoint Cosmos DB (MongoDB API) store, SecDash analytics in Go and React, NSG-enforced isolation, and an eBPF/XDP agent that drops banned IPs. Built with Terraform and Ansible."
category: "Cloud Security"
technologies:
  - "Azure"
  - "Terraform"
  - "Ansible"
  - "Cowrie Honeypot"
  - "Snare / Tanner"
  - "Vector"
  - "Go"
  - "React"
  - "Azure Cosmos DB (MongoDB API)"
  - "Private Endpoint"
  - "Network Security Groups"
  - "MITRE ATT&CK"
  - "eBPF / XDP"
  - "nginx"
  - "Docker"
  - "Threat Detection"
  - "SOC Dashboards"
github: "https://github.com/vadehraatharv7-hub"
order: 1
---

## Why I built this

Anything on the internet is probed all day by scanners, credential stuffers and botnets. I wanted to see that traffic for myself and learn what it takes to run a platform that attracts it on purpose: decoys that look real, a network that keeps them from becoming a way in, and a pipeline that turns raw log lines into answers. The design below is the result, and it changed a lot as I built it.

The platform is three repositories:

| Repository | What it is |
|---|---|
| **honeypot-infra** | Terraform for the Azure environment, and Ansible roles that configure every machine |
| **SecDash** | The analytics platform: a Go backend and a React dashboard |
| **xdp-shield** | An eBPF/XDP agent that drops banned IP addresses on the sensors |

## System design

<div class="diagram">
<svg viewBox="0 0 960 600" role="img" aria-label="Architecture of the Azure honeypot platform" xmlns="http://www.w3.org/2000/svg">
<style>
.a-t{fill:var(--text);font:600 13px system-ui,sans-serif}
.a-s{fill:var(--text-muted);font:12px system-ui,sans-serif}
.a-h{fill:var(--text-muted);font:600 11px ui-monospace,monospace}
.a-box{fill:var(--bg-elev);stroke:var(--border-strong);stroke-width:1.2}
.a-zone{fill:none;stroke:var(--border-strong);stroke-width:1.2}
.a-vnet{fill:none;stroke:var(--accent);stroke-width:1.4;stroke-dasharray:6 5}
.a-bad{stroke:#ef4444;stroke-width:1.8;fill:none}
.a-ok{stroke:var(--accent);stroke-width:1.8;fill:none}
.a-ban{stroke:var(--text-muted);stroke-width:1.4;fill:none;stroke-dasharray:5 4}
</style>
<defs>
<marker id="a-ar-bad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#ef4444"/></marker>
<marker id="a-ar-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--accent)"/></marker>
<marker id="a-ar-ban" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--text-muted)"/></marker>
</defs>
<rect class="a-box" x="8" y="200" width="124" height="120" rx="12"/>
<text class="a-t" x="22" y="236">Internet</text>
<text class="a-s" x="22" y="258">scanners</text>
<text class="a-s" x="22" y="276">botnets</text>
<text class="a-s" x="22" y="294">credential stuffers</text>
<rect class="a-vnet" x="150" y="10" width="670" height="580" rx="16"/>
<text class="a-h" x="166" y="32">AZURE VNET  vnet-honeypot  10.0.0.0/16  ·  rg-honeypot-prod  ·  Denmark East</text>
<rect class="a-zone" x="170" y="50" width="270" height="190" rx="10"/>
<text class="a-h" x="184" y="70">subnet-internal 10.0.1.0/24 + NSG</text>
<rect class="a-box" x="186" y="80" width="238" height="148" rx="8"/>
<text class="a-t" x="200" y="102">vm-honeypot</text>
<text class="a-s" x="200" y="124">Cowrie: SSH :22, Telnet :23</text>
<text class="a-s" x="200" y="144">Vector (acknowledged batches)</text>
<text class="a-s" x="200" y="164">xdp-shield (eBPF / XDP)</text>
<text class="a-s" x="200" y="184">fail2ban, key-only sshd :22222</text>
<text class="a-s" x="200" y="204">Standard_B1s, Ubuntu 22.04</text>
<rect class="a-zone" x="170" y="260" width="270" height="190" rx="10"/>
<text class="a-h" x="184" y="280">subnet-snare 10.0.4.0/24 + NSG</text>
<rect class="a-box" x="186" y="290" width="238" height="148" rx="8"/>
<text class="a-t" x="200" y="312">vm-snare</text>
<text class="a-s" x="200" y="334">nginx :80 / :443, TLS, rate limit</text>
<text class="a-s" x="200" y="354">Snare, Tanner (Docker, pinned)</text>
<text class="a-s" x="200" y="374">forwarder: real client IP</text>
<text class="a-s" x="200" y="394">xdp-shield (eBPF / XDP)</text>
<text class="a-s" x="200" y="414">Standard_B1s, Ubuntu 22.04</text>
<rect class="a-zone" x="480" y="110" width="320" height="260" rx="10"/>
<text class="a-h" x="494" y="130">subnet-monitoring 10.0.2.0/24 + NSG</text>
<rect class="a-box" x="496" y="140" width="288" height="218" rx="8"/>
<text class="a-t" x="510" y="162">vm-monitoring  10.0.2.4</text>
<text class="a-s" x="510" y="184">nginx :8081  sensor ingest + ban list</text>
<text class="a-s" x="510" y="204">nginx :443  dashboard (admin IP only)</text>
<text class="a-s" x="510" y="228">SecDash API (Go) :8080</text>
<text class="a-s" x="510" y="248">React dashboard (PM2) :3000</text>
<text class="a-s" x="510" y="268">in-memory index, WebSocket, alerts</text>
<text class="a-s" x="510" y="292">auth: bcrypt, signed 12 h tokens</text>
<text class="a-s" x="510" y="312">ingest key, lockout, geo enrichment</text>
<text class="a-s" x="510" y="336">Standard_B1s (1 GB), Ubuntu 22.04</text>
<rect class="a-zone" x="480" y="400" width="320" height="180" rx="10"/>
<text class="a-h" x="494" y="420">subnet-database 10.0.3.0/24</text>
<rect class="a-box" x="496" y="430" width="288" height="50" rx="8"/>
<text class="a-t" x="510" y="452">Private Endpoint  pe-cosmos</text>
<text class="a-s" x="510" y="470">privatelink.mongo.cosmos.azure.com</text>
<rect class="a-box" x="496" y="500" width="288" height="68" rx="8"/>
<text class="a-t" x="510" y="522">Azure Cosmos DB (MongoDB API)</text>
<text class="a-s" x="510" y="542">honeypot_db · public access disabled</text>
<text class="a-s" x="510" y="558">free tier · 400 RU/s · Session consistency</text>
<rect class="a-box" x="836" y="190" width="116" height="96" rx="12"/>
<text class="a-t" x="850" y="216">Admin</text>
<text class="a-s" x="850" y="238">allow-listed IP</text>
<text class="a-s" x="850" y="256">HTTPS :443</text>
<text class="a-s" x="850" y="272">SSH :22222</text>
<line class="a-bad" x1="132" y1="240" x2="184" y2="150" marker-end="url(#a-ar-bad)"/>
<text class="a-s" x="104" y="170" fill="#ef4444" style="fill:#ef4444">22, 23</text>
<line class="a-bad" x1="132" y1="282" x2="184" y2="350" marker-end="url(#a-ar-bad)"/>
<text class="a-s" x="104" y="392" style="fill:#ef4444">80, 443</text>
<line class="a-ok" x1="424" y1="132" x2="496" y2="190" marker-end="url(#a-ar-ok)"/>
<line class="a-ok" x1="424" y1="338" x2="496" y2="280" marker-end="url(#a-ar-ok)"/>
<line class="a-ban" x1="496" y1="226" x2="424" y2="176" marker-end="url(#a-ar-ban)"/>
<line class="a-ban" x1="496" y1="300" x2="424" y2="392" marker-end="url(#a-ar-ban)"/>
<line class="a-ok" x1="640" y1="358" x2="640" y2="430" marker-end="url(#a-ar-ok)"/>
<text class="a-s" x="648" y="398">MongoDB protocol</text>
<line class="a-ok" x1="640" y1="480" x2="640" y2="500" marker-end="url(#a-ar-ok)"/>
<line class="a-ok" x1="836" y1="238" x2="784" y2="238" marker-end="url(#a-ar-ok)"/>
<rect class="a-box" x="8" y="440" width="134" height="140" rx="10"/>
<text class="a-h" x="20" y="462">LEGEND</text>
<line class="a-bad" x1="20" y1="480" x2="52" y2="480"/>
<text class="a-s" x="60" y="484">attacks</text>
<line class="a-ok" x1="20" y1="502" x2="52" y2="502"/>
<text class="a-s" x="60" y="506">events, data</text>
<line class="a-ban" x1="20" y1="524" x2="52" y2="524"/>
<text class="a-s" x="60" y="528">ban list poll</text>
<text class="a-s" x="20" y="552">sensor feed: HTTP</text>
<text class="a-s" x="20" y="568">:8081 + ingest key</text>
</svg>
</div>

The sensors are the most exposed machines, so they sit in their own subnets and can reach only one internal address (the dashboard on port 8081). The dashboard and database are never reachable from the internet except through an allow-listed admin address.

## The ingest pipeline and its guarantees

Everything a sensor records travels the same path. The design goal was that a slow or busy database may delay events, but never lose or duplicate them.

<div class="diagram">
<svg viewBox="0 0 960 270" role="img" aria-label="Event ingest pipeline from sensor log to dashboard" xmlns="http://www.w3.org/2000/svg">
<style>
.b-t{fill:var(--text);font:600 13px system-ui,sans-serif}
.b-s{fill:var(--text-muted);font:11.5px system-ui,sans-serif}
.b-box{fill:var(--bg-elev);stroke:var(--border-strong);stroke-width:1.2}
.b-ok{stroke:var(--accent);stroke-width:1.8;fill:none}
.b-bad{stroke:#f59e0b;stroke-width:1.6;fill:none;stroke-dasharray:6 4}
</style>
<defs>
<marker id="b-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--accent)"/></marker>
<marker id="b-ar2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#f59e0b"/></marker>
</defs>
<rect class="b-box" x="8" y="40" width="140" height="110" rx="10"/>
<text class="b-t" x="20" y="66">1. Sensor log</text>
<text class="b-s" x="20" y="88">Cowrie JSON</text>
<text class="b-s" x="20" y="104">nginx access log</text>
<text class="b-s" x="20" y="120">(Snare / Tanner)</text>
<rect class="b-box" x="168" y="40" width="140" height="110" rx="10"/>
<text class="b-t" x="180" y="66">2. Ship</text>
<text class="b-s" x="180" y="88">Vector / forwarder</text>
<text class="b-s" x="180" y="104">30 events, 1 req/s</text>
<text class="b-s" x="180" y="120">X-Ingest-Key header</text>
<rect class="b-box" x="328" y="40" width="140" height="110" rx="10"/>
<text class="b-t" x="340" y="66">3. Front door</text>
<text class="b-s" x="340" y="88">nginx :8081</text>
<text class="b-s" x="340" y="104">private subnets only</text>
<text class="b-s" x="340" y="120">(NSG allow-list)</text>
<rect class="b-box" x="488" y="40" width="140" height="110" rx="10"/>
<text class="b-t" x="500" y="66">4. Normalise</text>
<text class="b-s" x="500" y="88">check ingest key</text>
<text class="b-s" x="500" y="104">map to event schema</text>
<text class="b-s" x="500" y="120">geolocate the IP</text>
<rect class="b-box" x="648" y="40" width="140" height="110" rx="10"/>
<text class="b-t" x="660" y="66">5. Persist first</text>
<text class="b-s" x="660" y="88">drop known duplicates</text>
<text class="b-s" x="660" y="104">InsertMany, _id = hash</text>
<text class="b-s" x="660" y="120">retry on 429 throttle</text>
<rect class="b-box" x="808" y="40" width="144" height="110" rx="10"/>
<text class="b-t" x="820" y="66">6. Then publish</text>
<text class="b-s" x="820" y="88">in-memory index</text>
<text class="b-s" x="820" y="104">WebSocket live feed</text>
<text class="b-s" x="820" y="120">alert webhooks</text>
<line class="b-ok" x1="148" y1="95" x2="168" y2="95" marker-end="url(#b-ar)"/>
<line class="b-ok" x1="308" y1="95" x2="328" y2="95" marker-end="url(#b-ar)"/>
<line class="b-ok" x1="468" y1="95" x2="488" y2="95" marker-end="url(#b-ar)"/>
<line class="b-ok" x1="628" y1="95" x2="648" y2="95" marker-end="url(#b-ar)"/>
<line class="b-ok" x1="788" y1="95" x2="808" y2="95" marker-end="url(#b-ar)"/>
<path class="b-bad" d="M718,150 L718,212 L238,212 L238,152" marker-end="url(#b-ar2)"/>
<text class="b-s" x="260" y="204" style="fill:#f59e0b">database busy: HTTP 503, the sensor keeps the batch and sends it again</text>
<text class="b-s" x="260" y="236">Vector moves its file position only after the dashboard confirms the batch.</text>
</svg>
</div>

Each step exists to protect one property:

| Property | How it is enforced |
|---|---|
| **Only real sensors can write** | A shared ingest key (`X-Ingest-Key`, compared in constant time) generated once on the Ansible controller. Wrong keys are rate-limited and locked out. A compromised host in a sensor subnet cannot inject fake events. |
| **No lost events** | The event is saved to the database *before* the sensor is told it worked. If the database is busy, SecDash answers 503 and the sensor retries, so a slow database delays events instead of dropping them. |
| **No duplicate events** | Every event has a content fingerprint (a SHA-1 over the timestamp to the millisecond, sensor, type, session, IP, ports, credentials, input, URL and hash). It is the document `_id` in the database and is also remembered in memory, so a re-sent batch or a retry after a throttled request cannot create a second row. |
| **Replays can't flood the database** | Vector sends at most 30 events per second, sized to the database's request-unit budget, so catching up after an outage stays under the limit. |
| **Real attacker addresses** | The web decoy sits behind nginx, and a small forwarder reads *nginx's* access log, because Snare and Tanner only ever see the proxy's address. |

## The data layer

The database is the part of the design I iterated on most. The final shape is Azure Cosmos DB with the MongoDB API, reached only over a private network.

**How it is provisioned (Terraform):**

| Setting | Value and why |
|---|---|
| Account kind | MongoDB API (`EnableMongo`), so SecDash uses the standard Go MongoDB driver and can run against a plain MongoDB too |
| Tier | Free tier enabled, with 400 RU/s of provisioned throughput on the `honeypot_db` database, so the platform costs nothing to keep running |
| Network | `public_network_access_enabled = false`. The only way in is a **Private Endpoint** in `subnet-database`, with a private DNS zone (`privatelink.mongo.cosmos.azure.com`) linked to the VNet so the account name resolves to a private address |
| Consistency | Session, which gives read-your-writes for the one application that uses it |
| Region | A single region (no replication) |
| Secrets | The connection string is a sensitive output, written to the monitoring VM's `.env` (mode 0600). The sensors never receive it, because they are the most exposed machines and have no use for it |

**What is stored (database `honeypot_db`):**

| Collection | Contents |
|---|---|
| `logs` | Every normalised honeypot event. The `_id` is the event fingerprint. Indexed on `timestamp` (descending) and `src_ip`. |
| `banned_ips` | The blocklist that xdp-shield polls |
| `webhooks_v2` | Alert destinations (Slack, Discord, generic) and their trigger settings |
| `dash_users` | Dashboard accounts with bcrypt-hashed passwords |
| `dash_settings` | The signing secret for session tokens, kept in the database so logins survive a restart |

**Working within a small request-unit budget.** On a throttled free tier, every query matters, so the application is designed around that:

- **Writes only, mostly.** SecDash holds the newest events in memory (100,000 on the 1 GB VM, 250,000 by default) and derives every chart and table from that index. The database is used for inserts and for a single load at startup.
- **Paged loading.** Startup reads the newest events in pages of 2,000, newest first, so a throttled request costs one retried page, not the whole load.
- **Throttle-aware writes.** Cosmos answers 429 when request units run out, and inserts retry with a growing delay. Because the `_id` is deterministic, a retry that partly succeeded is safe: duplicate-key errors are treated as "already stored".
- **Cheap location updates.** When an IP is geolocated, only rows that have no location yet are updated. Rewriting every row of a busy address would cost thousands of request units.
- **Memory-sized for the VM.** About 0.45 KB per event plus cached analytics views, which is why the 1 GB VM is set to 100,000 events.

**Lessons that became code.** An earlier version re-inserted whole batches when the database throttled a request, which duplicated rows. A later fix made inserts idempotent and moved the commit point (never confirm an event that was not saved). Two small command-line tools came out of that: `dedupe` finds and removes extra copies using the same fingerprint as the server, and `export` dumps every collection to compressed JSON, deliberately skipping the accounts and signing secret. An export on 28 October 2026 held 84,105 stored events, about 8,400 of them duplicates left by the old behaviour, which the dashboard ignores when it loads.

## Network and access control

All isolation is declared in Terraform as network security groups, attached to both the subnets and the network interfaces.

| Machine | Inbound | Outbound |
|---|---|---|
| **vm-honeypot** | SSH decoy :22 and Telnet decoy :23 from anywhere; real SSH :22222 from the admin IP only | The dashboard on :8081 first, then **deny the whole VNet**, then web :80/:443 and NTP to the internet, then deny everything else |
| **vm-snare** | Web decoy :80 and :443 from anywhere; SSH :22222 from the admin IP only | The same egress rules as above |
| **vm-monitoring** | :8081 from the two sensor subnets only; :80, :443 and SSH :22222 from the admin IP only | Unrestricted, so it can reach the private endpoint and package sources |
| **Cosmos DB** | No public access; reachable only through the private endpoint | n/a |

The order of the outbound rules is the point: a compromised decoy can fetch tools from the internet but cannot scan or attack any other subnet, so the dashboard and database are unreachable from it. Port 22 being open to the whole internet is deliberate (it is the decoy), and the Terraform records that as an explicit, documented exception to the Checkov security-scanner rules instead of hiding it.

## The decoys

**vm-honeypot (Cowrie).** Cowrie presents a convincing Ubuntu 22.04 SSH server and a Telnet service aimed at IoT botnets. Ports 22 and 23 are redirected by iptables to unprivileged ports 2222 and 2223, and the machine's real SSH moved to 22222 with key-only login, root login off and fail2ban. To avoid the well-known Cowrie fingerprint it presents a consistent hostname, OpenSSH banner and kernel strings. It is boxed in too: a per-IP limit of 30 simultaneous connections, a 5 MB download cap, a 21-day purge of captures and logs, and a systemd unit with a 450 MB memory ceiling, a task limit, no new privileges, a read-only system and an empty capability set.

**vm-snare (Snare and Tanner).** A cloned website with an analysis back end, running in Docker with every image pinned by digest, all capabilities dropped, memory and process limits, and a read-only front container. An nginx front terminates TLS, applies a per-IP rate limit, strips the `Server` header and cookie that would identify Snare and Tanner, serves an ordinary nginx-style 404, and logs the real client address, which a forwarder ships to the dashboard.

## SecDash: turning logs into answers

SecDash is a Go backend with a React 19 dashboard (Vite and Tailwind) of about fifteen views. Its analysis is a deterministic rule engine with unit tests, not a model.

- **Normalisation.** Cowrie and Snare events become one schema with kinds such as connect, login failed, login success, command, download and HTTP request.
- **Sessions.** Events are regrouped into sessions, with multi-line pasted commands merged back into one command, and each session can be **replayed** as a transcript.
- **Seven-stage kill chain.** Each session is placed on a chain from reconnaissance and delivery, through initial access and discovery, to tool transfer, execution and persistence, and defence evasion and impact, with the evidence for each stage that was reached.
- **Attacker scoring.** Each source IP gets a behaviour class (scanner, web recon, brute-forcer, web exploiter, compromiser, intruder or malware dropper), which sets a base score from 5 to 80. The 0 to 100 risk score then rises with volume, persistence, evasion and impact techniques, activity across several sensors and known malware families, and maps to low, medium, high or critical.
- **Campaign detection.** IPs are linked into campaigns using a union-find clustering over shared payload hashes, shared payload URLs and identical command playbooks, so separate addresses running the same operation appear as one campaign.
- **MITRE ATT&CK.** Signatures for commands and web requests map to ATT&CK techniques, shown as a coverage matrix that links back to the sessions.
- **Alerts and blocking.** Webhooks fire on a successful login, malware, a critical command or a web exploit, rate-limited per IP, and they refuse to connect to private addresses. A blocklist feeds xdp-shield.
- **Honest data.** Locations come from local MaxMind-format databases when available, with an optional online fallback, and are never invented. Unresolved IPs simply have no location.

SecDash protects itself too: dashboard accounts use bcrypt, signed 12-hour tokens and lockout; the API tokens and the ingest key live on the Ansible controller, not in git; the dashboard is served over HTTPS (self-signed until it has a hostname) with security headers; and the ban-list endpoint is the one deliberately open read, because xdp-shield polls it without a token.

## xdp-shield: dropping known-bad traffic

`xdp-shield` is a small Go and C program on each sensor. A C eBPF program looks up every incoming IPv4 packet's source address in a kernel hash map (an LRU map of up to 65,536 addresses) and drops it if it is listed. A Go loader, using the Cilium eBPF library, attaches the program to the network interface in generic XDP mode and polls SecDash's `/api/threats/banned` endpoint every 10 seconds. It makes the kernel map *equal* to the dashboard's list, adding new bans and removing addresses that were unblocked. If the dashboard is unreachable, it keeps the current rules, so an outage neither blocks nor unblocks anyone. It originally took bans from a Redis feed, which I replaced with this simpler polling and removed from the stack.

## How it is deployed

Terraform builds the resource group, VNet, subnets, NSGs, public IPs, three VMs, the Cosmos DB account, private endpoint and DNS, and writes the Ansible inventory. Ansible then configures the machines in order: the honeypot (Vector, Cowrie, xdp-shield), the monitoring hub (nginx, Go, Node and PM2 for the dashboard), and the web sensor (Docker, Snare, Tanner, the forwarder). Some details I'm pleased with:

- The Go backend and xdp-shield are **cross-compiled on the Ansible controller** and copied to the VMs, so the small 1 GB machines do not need a Go build toolchain for them.
- Secrets are generated once on the controller (`~/.secdash_*`, mode 0600) and reused, so re-running the playbook keeps the same credentials and never writes them to git.
- The Terraform carries Checkov and TFLint configuration, and the playbooks are idempotent.
- Hard-won fixes are recorded in comments, for example restarting Vector after the group change that gives it access to Cowrie's logs (it had silently shipped nothing), and adding a package repository directly because Launchpad's API timed out in a real run.

## How it evolved

The first version was a Cowrie honeypot with a Promtail, Loki and Grafana pipeline and an LLM triage component. The current design replaced it with the purpose-built SecDash dashboard, Vector for shipping, a private-endpoint Cosmos DB, a second (web) decoy, an ingest key and logins, and xdp-shield. Grafana and Loki are no longer part of it, and the LLM was removed in favour of the local rule engine.

## Known gaps

- Cowrie's SSH handshake and default fake filesystem are still recognisable to a careful attacker, so varying sensors across providers and regions would help.
- Traffic from the sensors to the dashboard (:8081) is plain HTTP, though it only crosses private subnets and is guarded by the NSGs and the ingest key.
- The dashboard certificate is self-signed.
- A database network interface and security group remain in the Terraform from an earlier design with a self-hosted database VM; the database is now Cosmos DB, so they appear to be left over and are worth removing.
- It is a single region with no replication.

## What I want to do next

Bring machine learning back on top of the structured data SecDash already produces (risk scores, behaviour classes, kill-chain stages, campaigns and ATT&CK techniques), and measure how it compares with the rule engine. That is a plan, not a result, and I'll write it up when I have findings. It connects to my [homelab honeypots](/projects/homelab-honeypots-lxc/), which feed a Wazuh SIEM, and to [why I'm building the bridge between AI/ML and cybersecurity](/blog/bridging-ai-ml-and-cybersecurity/).

---

*This project page was written by AI, with Atharv in the loop, about work he did. [How this site is made](/about-this-site/).*
