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


Evren's tx performance numbers

### 6. search & geospatial improvements

Main improvements came from optimising our Lucene index usage patterns (#3417
and #3435). In both cases, we are talking about reducing average query time from
several seconds to milliseconds (PRs have concrete numbers).

#3417

In order to cache and manage IndexSearchers, used Lucene's SearchManager
To maintain uniqueness of IndexWriter, created IndexWriterManager
Deleted a lot of unnecessary code and checks
Since our patterns for inserts are batch/transaction based, makes more sense to open a new IndexWriter with each transaction, since they occupy a decent amount of memory and are only optimized on close().
Performance
q1 -> union of 100 textMatches
q2 -> join of 30 textMatches
stardog-admin perf query (mean time)

Query | old | new
q1 | 2539 | 190
q2 | 75 | 18

#3435

Implements the same usage patterns from #3417 with the spatial index.

Improvements on the spatial benchmark are really significant, from >10s to ms:

what spatial benchmark is this?

Query | Old | New
q1 | 13015 | 10
q2 | 12265 | 21
q3 | 13437 | 62
q4 | 15763 | 2583
q5 | 10257 | 97

Other improvements for which we have numbers:

- #3443 Faster bulk-loading of spatial data (~82% faster)

- #3499 Faster deletes with the search index (around 100% faster overall, when
  there are several named graphs even better, transactions that took minutes now
  take ms)

- #3507 Faster indexing of search data with named graphs (around 300% faster)

### 7. query hints

sp2b q5 with and without hint

## "Easy D" is for Deployment

### 8. push button AWS cluster deployments with Stardog Graviton 

Point to Graviton piece and embed video

### 9. deeper Cloud Foundry integration

embed video


Stardog 5 will be the fastest, most scalable Knowledge Graph platform available anywhere.

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
