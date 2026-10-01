---
title: "BYOLLM is open source"
description: "On Friday I said the next post would be about what I've been building."
pubDate: "2026-09-28"
source: "linkedin"
dateIsCeiling: false
dateSource: "posted"
originalKey: "linkedin:2026-09-28"
wordCount: 425
archive: true
---

*First posted on LinkedIn, September 28, 2026.*

On Friday I said the next post would be about what I've been building. This is the first and biggest piece of it, because most of what comes next runs on it and couldn't be done affordably without it: I've open-sourced BYOLLM – Bring Your Own LLM. 0.1.1 is on npm, MIT licensed, six small packages. And a promise: nothing in the core ships commercially before it ships in the open-source libraries.

The idea is simple to say. You install one small program on your computer (or on a server you control). Websites that support BYOLLM then use the AI you already have – a free model running on your machine, or the subscription you already pay for – instead of the website paying for AI and passing the cost to you.

For you: your favorite model on every site that supports it, new models the moment you get them, and your prompts encrypted end-to-end to your own device. Your subscriptions are never shared – usable only by you. That is a protocol rule, not a setting.

For anyone building a site: zero AI bills. Your users bring their own compute, so you never pay for, meter or rate-limit inference. Free trials cost you nothing to offer. Ship the AI features you kept private for fear of the API bill. It is a three-line integration.

If you are like me, you have a GitHub full of what I call unborn apps – a cool idea, built, never launched. I have 146 of them. I built BYOLLM because keeping even a few small apps alive on somebody else's API costs real money every month, so they never left my computer. Run them on the user's own compute and it costs nothing.

The whole stack is open – daemon, server adapter, protocol, relay, conformance kit, control plane – so the pieces that decide who runs what can be read by anyone. Nineteen providers on day one, from Ollama on your laptop to the Claude plan you already have.

It works today, end to end, with your prompts encrypted to your own device. The protocol is at version 2 and settling; the software is early, and I'm building the rest in public. Bug reports, integrations and contributions are what I want most – the repo is where to join in.

Site and source: byo-llm.com · github.com/oftomorrowinc/byollm

There is also a hosted version, byollm.cloud, so you do not have to run the relay yourself. It is opening in waves. If you want in early, the list is at byollm.cloud/early-access.
