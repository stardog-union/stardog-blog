+++
oldtitle = "What's Coming in Stardog 5"
title = "9 Reasons Stardog 5 is Awesome"
date = "2017-02-14" 
author = "Kendall Clark"
draft = true
categories = []
series = ["release-preview"]
discourseUsername = "kendall"
+++

We're preparing Stardog 5 for release at the end of the month. This post
describes the high points of the best damn enterprise knowledge graph platform
on the planet.<!--more-->

## Introduction

There's actually only *one* reason why Stardog 5 is awesome: **my coworkers are
an unstoppable force of software power...** Seriously, I've been doing this
since the mid-90s and I am deeply impressed. 

That said, if this post isn't a listicle, I will lose my junior SEO monkey
card and we can't have that.

## Performance & Scale

better performance & scalability across the board:

### 1. improved query engine: new stats, grace hash joins, what else?

#### New Stats

yago benchmark
34285.71    2017-02-06-6f6068a-v4.2.3-SNAPSHOT -- S4
2144.35    2017-02-03-8be4755-v4.2.3-SNAPSHOT -- S5 

#### grace hash

Need something here...

### 2. native memory management

% time in GC
BSBM throughput

### 3. core server rewrite from Netty to Undertow

* Simplified threading model
    * Easier to segment requests by type into separate thread pools
        * In particular, much easier to partition reads and writes and control the resources they use
    * What thread/thread pool something runs in is less opaque to developers
    * Less prone to thread starvation by overloading a pool, or inadvertantly blocking in an IO thread
* Easier development
    * A more concise API, lower learning curve
    * Greater reuse of services via composition
    * Smaller code foot print
    * ex: Implementation of SPARQL protocol about 40% less code
* No performance penalty
    * Still ultimately NIO under the hood

So extending our server is now yeah, and it’d be really easy. implement a single
interface, declare it so the JDK service loader picks it up, put in classpath,
restart server

Oh yeah 12% faster...

### 4. rewritten Virtual Graph system using Apache Calcite

* Support for subqueries & aggregates
* Reduction of unnecessary self joins
* Improved query generation (more concise, less "noise")

performance?

### 5. Blockade the Partitions

After some initial runs of the chaos tests against Stardog 4:

Best case I’ve seen 117 pass / 48 fail

Worst case 63 pass / 102 fail

compared to latest develop+zkReorg 161 pass / 4 fail

it’s just that sync time does not block writes, so duration of writes being
blocked by joins went from == sync time, to, effectively zero, just the cost of
a couple reads and a write to ZK

### 6. search & geospatial improvements

Pedro to give me something here

### 7. query hints

## "Easy D" is for Deployment

### 8. push button AWS cluster deployments with Stardog Graviton 

### 9. deeper Cloud Foundry integration


Stardog 5 will be the fastest, most scalable Knowledge Graph platform available anywhere.

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
