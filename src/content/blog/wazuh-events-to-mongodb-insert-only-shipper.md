---
title: "I wanted my honeypots to have a memory: keeping every event in MongoDB"
description: "Why I keep every Wazuh event in a separate MongoDB database, so I can ask new questions of old attacks later, and how I made it tamper-resistant with an insert-only account."
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

**TL;DR:** Dashboards show you today. I wanted to be able to go back months later with a new idea and ask, "what else did that attacker do?" So I built a separate database that keeps every event my honeypots and servers produce, and made it hard to tamper with. This is chapter five of my [homelab story](/blog/hypervisor-firewall-pattern-homelab/).

## What I was trying to do

The point of running honeypots is learning, and learning means asking questions you didn't think of at the start. Which usernames were tried before last week? What commands came right after a successful login? Does one address show up on both my decoys?

Wazuh is great for live monitoring, but it rotates its files and purges the local archive after seven days, and its search index is built for dashboards. I wanted a plain, durable record of everything, not only the events that triggered an alert, with one extra rule: honeypot noise must never be mixed up with events from real machines.

## What I built

Two small pieces.

**A MongoDB database** in its own container, which only the Wazuh machine is allowed to talk to. Two collections: `events` for everything Wazuh decodes, and `alerts` for what matched a rule. Every record gets a clear tag, `honeypot` or `production`, taken from the group the machine was enrolled in.

**A small Python service** on the Wazuh machine that follows its log files and copies each line into MongoDB. I wanted it to be boring and reliable:

- It never stores the same line twice, because the record's ID is a hash of the line. If it crashes and replays, nothing duplicates.
- It only remembers where it got to after the database has confirmed the write, so an outage causes a replay, never a gap.
- It copes with daily log rotation and files being truncated.

## The security idea I'm happiest with

The shipper writes with an account that can **insert but not read and not delete**. If someone ever takes over the Wazuh machine, the credentials they find can add junk but can't read or erase my history. A second account can only read, and the all-powerful admin account is only for setup. That's least privilege applied to a log store: evidence you can't easily destroy.

## What went wrong

MongoDB 8.0 refused to start. On my host's Linux kernel version it hits a known memory bug (reported as SERVER-121912) and stops. MongoDB 7.0 doesn't have that check, so I pinned 7.0 and noted how to move to 8.0 later. It was a good reminder that your stack includes the kernel under it.

## What I'd improve

- Backups are a daily dump on the same disk. I want a copy somewhere else.
- Traffic to the database isn't encrypted. It only crosses my private network, but TLS would be better.

## What I'm looking forward to

Having the history is the point. Once the honeypots have collected enough, I want to write up what I find, with real numbers.

Previous chapter: [the honeypots](/blog/honeypots-in-lxc-cowrie-snare-wazuh/). Details are on the [project page](/projects/mongodb-log-store/).

---

*This article was written by AI.*
