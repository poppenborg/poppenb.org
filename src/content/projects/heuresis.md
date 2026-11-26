---
title: Heuresis
summary: A research scaffold for machine creativity that only rewards novelty when it actually works.
year: 2026
date: 2026-11-26
status: In progress
stack: [Python, NumPy, pytest]
draft: false
---

Ask a language model for a surprising idea and you get the most probable surprising idea. That is not a bug in any one model. Pretraining models the expected, alignment narrows it further, and turning up the temperature adds noise rather than direction. Heuresis is my attempt to build a system where originality is the thing being optimised, and where "original" has to mean more than "unusual".

## Noise is the most original thing there is

The trap with rewarding novelty is obvious once you write it down: random garbage is maximally novel. So the first rule in the repository, guarded by a test, is that novelty without value earns nothing. The reward is gated:

```
R(x) = 1[V(x) >= tau] * ( V(x)^alpha * N(x)^beta + gamma * max(CP(x), 0) )
```

Below the value threshold `tau`, the reward is zero, full stop. Above it, value and novelty multiply. Every scoring function in the codebase also gets a "noise test": feed it random input and check that it earns nothing.

Two more rules keep the metric honest. Novelty is measured on what a program *does* (a descriptor of its outputs), never on how its text looks, so renaming variables doesn't count as an idea. And value comes only from executing the thing, never from a model's opinion of it. Ideas that read well and then fall apart when someone runs them are exactly the failure this project exists to avoid.

## Three pillars

The design answers three practical limits of today's models, one pillar each:

1. **Objective.** Reward value-gated novelty, and sample in proportion to that reward instead of maximising it, so the search keeps many good answers alive rather than collapsing onto one. Good solutions are kept in a quality-diversity archive (MAP-Elites), one per region of behaviour space.
2. **Judgement.** Critics are trained on executed outcomes: the input is the idea, the target is what happened when it ran. A confident critic that turns out wrong produces its own training data.
3. **Two levels.** Level 0 searches inside a space. Level 1 proposes new spaces, such as new primitives or abstractions, and is rewarded when they make hard problems cheap. The historical precedent is complex numbers: nobody needed them until cubic equations suddenly got a lot easier.

## Starting small on purpose

All of that is the plan. What runs today is Phase 0: a tiny list-manipulation language with fifteen primitives (`reverse`, `sort`, `keep_even`, `cumsum` and friends), an interpreter with a step limit, an exact verifier, and a random generator feeding the archive. Program synthesis was chosen because a cheap, exact verifier makes every score checkable. Fancier domains come only after the simple one passes its gates.

A demo run on the task "keep the even numbers, sorted descending" fills 8 archive cells in 800 steps. Its best solution is:

```
keep_even -> sort_desc -> sort_desc
```

Correct, and sorted twice for good measure. A random generator has no taste, which is precisely why the next item on the roadmap is a sampler that picks parents in proportion to reward and mutates them.

## The bet

The roadmap is a series of gates, each with a measurable claim and a rule that it only counts with logged runs across at least three seeds. Gate 0 asks whether the system beats best-of-n sampling from a frontier model at equal compute on coverage and diversity, without solving fewer held-out tasks. The real bet is Gate 2: if Level 1, the part that invents new spaces, can't beat the same system with Level 1 switched off, the "transformational" claim fails and the later phases aren't worth building. I'd rather find that out early.

There is also a fixed outer layer (budgets, the event log and the final metrics) that the system is not allowed to touch. A system that may rewrite its own search space should not also get to rewrite the scoreboard.

