---
title: "MongoDB Log Store for Wazuh Events"
tagline: "Every event and alert from my honeypots and real hosts, tagged by origin, in an insert-only, firewalled MongoDB."
description: "An unprivileged LXC running MongoDB 7.0 plus a Python shipper on the Wazuh manager. The shipper follows Wazuh's JSON logs, tags each record honeypot or production, writes with an insert-only account, never duplicates a line, and resumes after outages."
category: "Distributed Systems"
technologies:
  - "MongoDB 7.0"
  - "Python"
  - "PyMongo"
  - "Wazuh"
  - "systemd"
  - "Terraform"
  - "Proxmox Firewall"
  - "Bash"
github: "https://github.com/vadehraatharv7-hub/homelab/tree/main/projects/logstore"
order: 9
---

## Why I built this

Learning from honeypots means asking questions I did not think of at the start, weeks or months later. I wanted my honeypots to have a memory: a durable record of every event, tagged so that decoy noise never mixes with real machines, and hard to tamper with even if the Wazuh machine is taken over. The story is in [I wanted my honeypots to have a memory](/blog/wazuh-events-to-mongodb-insert-only-shipper/).

## Why a separate log store

Wazuh's own indexer is tuned for dashboards and rolls data over. I wanted a plain, queryable, long-term record of *everything* the honeypots see, not only what matched a rule, so that I can reanalyse old traffic with new ideas. Wazuh archive files older than seven days are purged locally; MongoDB is the long-term store.

```text
honeypot agents ─┐                                                    ┌─ logs.events  every decoded event
                 ├─▶ Wazuh manager ─▶ archives.json / alerts.json ─▶ shipper ─▶ MongoDB ─┤
internet-hosts  ─┘   (labels each agent)                                    └─ logs.alerts  what matched a rule
```

## What is stored

Each document is Wazuh's own JSON plus three added fields:

| Field | Meaning |
|---|---|
| `ts` | The event time as a real BSON date. It is indexed, and the optional retention TTL uses it |
| `origin` | `honeypot`, `production`, `wazuh-manager` or `unlabelled` |
| `ingested_at` | When the shipper stored it |

`origin` comes from the agent's Wazuh label, which comes from its agent group, so classification depends on where a machine was enrolled. `_id` is the SHA-1 of the log line.

```js
// mongosh, database "logs"
db.alerts.find({ origin: "honeypot", "rule.level": { $gte: 10 } }).sort({ ts: -1 })
db.alerts.aggregate([{ $match: { origin: "production" } }, { $group: { _id: "$rule.id", n: { $sum: 1 } } }])
db.events.countDocuments({ origin: "honeypot", ts: { $gt: new Date(Date.now() - 86400e3) } })
```

## The shipper (`wazuh-mongo-shipper`)

A small Python service on the Wazuh manager, run by systemd as an unprivileged user.

- **At-least-once, and safe to repeat.** The document ID is the hash of the line, so a replay after a crash or outage inserts nothing twice. Duplicate-key errors are treated as the protection working; any other write error is a real failure.
- **Position saved only after acknowledgement.** The file offset is committed only once MongoDB has acknowledged the batch, so nothing is lost.
- **Rotation and truncation aware.** It tracks the file's inode, follows Wazuh's daily rotation and starts over if a file shrinks.
- **Half-written lines wait.** A line without a newline is not consumed until the rest arrives.
- **Graceful shutdown** on SIGTERM and SIGINT.

## Least-privilege accounts

| User | Can | Used by |
|---|---|---|
| `logshipper` | **Insert only**: no read, no delete (custom role `logInsert`) | The shipper |
| `analyst` | Read the `logs` database | Me, and the daily backup |
| `admin` | Everything | Setup only |

If the Wazuh manager is ever compromised, the attacker holds a credential that cannot read or erase the history. The shipper password is shared with the Wazuh stack through a git-ignored file; the other passwords are generated.

## Network containment

MongoDB accepts connections only from the Wazuh manager (`client_sources`). The hypervisor firewall drops everything else in both directions, and outbound is limited to DNS, NTP and web access for package installs. To query from my Mac, a Terraform output prints the `ssh -L` tunnel through the Proxmox host.

## Decisions and caveats

- **MongoDB 7.0, not 8.0.** 8.0 refuses to start on Linux kernels 6.19 to 7.0.13 because of a tcmalloc/rseq bug (SERVER-121912), and my Proxmox host runs one. Moving to 8.0 later needs a dump and restore, or a host kernel at 7.0.14 or newer.
- **Retention.** `log_retention_days = 0` keeps everything; any other value adds a TTL index. The disk is 40 GB by default.
- **Backups** are a daily `mongodump` (seven copies) on the same disk, so copying them off-host is still a to-do.
- **Traffic to MongoDB is not encrypted.** It crosses only the NAT bridge and the firewall allows only `client_sources`.

Related write-up: [Shipping Wazuh events to MongoDB with an insert-only account](/blog/wazuh-events-to-mongodb-insert-only-shipper/).

---

*This project page was written by AI.*
