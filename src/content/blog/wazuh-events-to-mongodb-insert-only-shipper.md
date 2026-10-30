---
title: "Shipping every Wazuh event to MongoDB with an insert-only account"
description: "A small Python shipper copies Wazuh archives and alerts into MongoDB, tags each record honeypot or production, never duplicates a line, survives log rotation, and uses a write-only database role."
date: 2026-10-30
category: writeup
tags: ["MongoDB", "Wazuh", "Python", "Logging", "Least privilege", "Terraform"]
project: mongodb-log-store
sources:
  - title: "MongoDB built-in roles and custom roles"
    url: "https://www.mongodb.com/docs/manual/core/security-built-in-roles/"
  - title: "MongoDB TTL indexes"
    url: "https://www.mongodb.com/docs/manual/core/index-ttl/"
  - title: "PyMongo documentation"
    url: "https://pymongo.readthedocs.io/"
  - title: "Wazuh documentation"
    url: "https://documentation.wazuh.com/current/"
draft: false
---

**TL;DR:** Wazuh keeps data for dashboards. I wanted a durable record of every event, not only alerts, tagged by where it came from. A small Python service on the manager follows Wazuh's JSON logs and writes them to MongoDB 7.0 using an account that can insert but never read or delete.

## The problem

A honeypot is only useful if you can go back later with a new question: which usernames were tried before last week, which commands followed a successful login. Wazuh's archive files rotate and are purged after seven days locally, and the index is built for dashboards. I wanted a plain database that holds everything, separated by origin so honeypot noise never mixes with production signals.

## Design

```text
agents ─▶ Wazuh manager ─▶ archives.json ─┐
          (labels each agent)             ├─▶ shipper ─▶ MongoDB ─┬─ logs.events (every decoded event)
                          alerts.json ────┘                       └─ logs.alerts (what matched a rule)
```

MongoDB sits in its own unprivileged container. The hypervisor firewall lets only the Wazuh manager connect to port 27017, and lets nothing reach the LAN.

Each stored document is Wazuh's own JSON plus `ts` (a real BSON date, indexed), `origin` (`honeypot`, `production`, `wazuh-manager` or `unlabelled`) and `ingested_at`. The origin comes from the agent's group label, so classification is decided when a machine is enrolled.

## Shipper behaviour

The service is one Python file using PyMongo, run by systemd as an unprivileged user. The properties that matter:

- **Idempotent writes.** The `_id` is the SHA-1 of the raw log line. Re-sending a batch inserts nothing twice. `insert_many(ordered=False)` is used, and duplicate-key errors (code 11000) are the replay protection working; any other write error is raised.
- **Commit after acknowledgement.** The file offset is saved only after MongoDB acknowledges the batch, using an atomic temp-file-and-rename. A crash or outage causes a replay, never a gap.
- **Rotation-aware.** It stores the inode with the offset. If the path now points at a different inode it follows the new file, and if the file shrinks it starts over.
- **Partial lines wait.** A line with no trailing newline is left alone until the writer finishes it.
- **Clean shutdown** on SIGTERM and SIGINT.

## Three accounts, one of them blind

| User | Can | Used by |
|---|---|---|
| `logshipper` | Insert only (custom role `logInsert`) | The shipper |
| `analyst` | Read the `logs` database | Me and the daily backup |
| `admin` | Everything | Setup only |

If an attacker takes over the Wazuh manager they get a credential that can add junk but cannot read or delete history. That makes it a decent tamper-resistance property for a log store. I query from my Mac through an SSH tunnel via the Proxmox host, since MongoDB is not reachable from anywhere else.

## What went wrong

**MongoDB 8.0 would not start.** On the Proxmox host's kernel the server refuses to run because of a tcmalloc/rseq bug (SERVER-121912, affecting Linux 6.19 to 7.0.13). MongoDB 7.0 has no such check, so I pinned 7.0. Moving to 8.0 later needs a dump and restore, or a host kernel at 7.0.14 or newer.

**Ordering between stacks.** The log store must exist before the Wazuh stack is given its address, or the shipper has nowhere to write. The firewall rule to MongoDB also has to sit above the private-range drops.

## Results and what I would change

Queries like "high-level honeypot alerts, newest first" or "alert counts by rule for production hosts" are one-liners in `mongosh`. Retention is off by default (keep everything), with an optional TTL index on `ts`.

Remaining gaps, which I would fix next:

- Daily `mongodump` backups (seven copies) are on the same disk. They need to be copied off-host.
- Traffic to MongoDB is unencrypted. It crosses only the NAT bridge, but TLS would be better.

See the [log store project page](/projects/mongodb-log-store/) and the [Wazuh stack](/projects/wazuh-siem-homelab/).

---

*This article was written by AI.*
