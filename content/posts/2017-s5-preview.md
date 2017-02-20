+++
oldtitle = "What's Coming in Stardog 5"
title = "8 Reasons Stardog 5 is Awesome"
date = "2017-02-28" 
author = "Kendall Clark"
draft = false 
categories = []
series = ["release-preview"]
discourseUsername = "kendall"
+++

We're preparing Stardog 5 for release at the end of the month. This post
describes the high points of the best damn enterprise knowledge graph platform
on the planet.<!--more-->

Despite the title of this post, there's only *one* reason why Stardog 5 is
awesome: **my coworkers are an unstoppable force of software power.**
Seriously, I've been doing this since the mid-90s and I am deeply impressed.

That said, if this post isn't a listicle, I will lose my junior SEO monkey
card and then what would I do?

## 1. Queries, Writes, Search are all Faster

More or less everything in Stardog 5 is faster, more scalable, and generally
more performant compared to Stardog 4. Here are some of the highlights:

{{% figure src="http://images.metmuseum.org/CRDImages/an/original/hb54_117_23.jpg" class="inliner" %}}

### Query Evaluation

#### New Statistics

yago benchmark
34285.71    2017-02-06-6f6068a-v4.2.3-SNAPSHOT -- S4
2144.35    2017-02-03-8be4755-v4.2.3-SNAPSHOT -- S5 

#### Grace Hash Joins

Need something here...

#### What else?

### Search

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

### Spatial Queries

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

## 2. Garbage Collection (almost) Never Happens

{{% figure src="http://images.metmuseum.org/CRDImages/rl/original/1424-1.jpg" class="inliner" %}}


% time in GC
BSBM throughput

## 3. Server is Easier to Extend
{{% figure src="http://images.metmuseum.org/CRDImages/gr/original/DP269822.jpg" class="inliner" %}}


We replaced Netty with Undertow for many reasons, not least async reactive streams (link) and:

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

## 4. Virtual Graphs are Faster and Easier to Extend

{{% figure src="http://images.metmuseum.org/CRDImages/es/original/DP132915.jpg" class="inliner" %}}

* New Virtual Graph engine (called **VEGA** internally) uses Apache Calcite extensively
* Support for subqueries & aggregates
* Reduction of unnecessary self joins
* Improved query generation (more concise, less "noise")

performance?

## 5. High Availability Cluster is More Resilient 

{{% figure src="http://images.metmuseum.org/CRDImages/as/original/10_211_309_sf.jpg" class="inliner" %}}

Completely reworked how we use Zk

Added extensive test suite/tortue testing/chaos testing using Blockade

After some initial runs of the chaos tests against Stardog 4:

Best case I’ve seen 117 pass / 48 fail

Worst case 63 pass / 102 fail

compared to latest develop+zkReorg 161 pass / 4 fail

it’s just that sync time does not block writes, so duration of writes being
blocked by joins went from == sync time, to, effectively zero, just the cost of
a couple reads and a write to ZK

### Improved Tx Perf

Evren's tx performance numbers

## 6. Query Engine Understands Hints 

{{% figure src="http://images.metmuseum.org/CRDImages/as/original/79_2_893_O1_sf.jpg" class="inliner" %}}

sp2b q5 with and without hint

## 7. AWS Deployments are Trivially Easy

{{% figure src="http://images.metmuseum.org/CRDImages/as/original/2015_300_257a_Burke_website.jpg" class="inliner" %}}

Point to Graviton piece and embed video

## 8. First-class Citizen in Pivotal Cloud Foundry

{{% figure src="http://images.metmuseum.org/CRDImages/as/original/DT6718.jpg" class="inliner" %}}

embed video

Stardog 5 will be the fastest, most scalable Knowledge Graph platform available anywhere.

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
