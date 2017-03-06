+++
author = "Kendall Clark"
categories = ""
date = "2017-03-17T00:00:00Z"
discourseUsername = "kendall"
draft = true 
series = ["release-preview"]
title = "8 Reasons Stardog 5 is Awesome"
+++

We're preparing Stardog 5 for release at the end of the month. This post
describes the high points of the best damn enterprise knowledge graph platform
on the planet.<!--more-->

Despite the title of this post, there's really only *one* reason why Stardog 5 is awesome: **my coworkers are an unstoppable force of software power.** I get to write about the amazing work of other people, but it is those amazing people who did this amazing work. I am very lucky to work with them.

## 1. Queries, Search, and Spatial are Faster

More or less everything in Stardog 5 is faster, more scalable, and 
more performant compared to Stardog 4. Here are some of the highlights:

{{% figure src="http://images.metmuseum.org/CRDImages/an/original/hb54_117_23.jpg" class="inliner" %}}

### Query Evaluation

Queries for which Stardog doesn't perform well are 
bugs and we treat them as such. Please do likewise. Lots of small changes add up to non-trivial peformance gains, but we also made some bigger changes, too.

#### New Statistics

Statistics are important for query costing and, hence, for query planning and optimization. But they can be prohibitively expensive to compute and are one of the true black arts of database design and programming.

Ideally in Stardog 5 we wanted more accurate and also cheaper statistics. The [count-min sketch](https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch) turned out to be just the thing. Stardog 5 computes statistics in a single streaming pass through one index and doesn't build any auxiliary, persistent data structures.

Stardog 5 stats include two probabilistic data structures to replace the previous persistent maps to hold counts for object counts for each characteristic set. First, we build a count-median-min sketch to answer frequency queries for objects. This one is compact and very accurate for frequently occurring objects. Second, to answer membership queries for rarely occurring objects, we use a Bloom filter. Unfortunately, they have linear space requirements which would make them expensive to build and manage. Also, their size is difficult to pick upfront given that we don't know the size of each characteristic set before we build it. Therefore, we take a fixed-size uniform sample of objects occurring in each set using the reservoir sampling technique and build the Bloom filter accordingly. 

For some graphs the more accurate statistics make a huge difference in performance. For example, on the [Yago](https://www.mpi-inf.mpg.de/departments/databases-and-information-systems/research/yago-naga/yago/demo/) dataset, Stardog 5 is **1,600% faster** than Stardog 4.

#### Grace Hash Joins

We also added an implementation of [grace hash join](), which partitions the right operator, hashes each partition, and then iterates over the left operator. 

### Search

We improved performance for Stardog's semantic search capability significantly, primarily by optimizing the way we interact with Lucene's indexes. We reduced exec times from several seconds to milliseconds. This involved using `SearchManager` more cleverly and deleting lots of unnecessary code. It also involved recognzing our interactions with Lucene are batch- and transaction-oriented, in which case it made more sense to use new `IndexWriter`s with each transaction. They occupy a fair bit of memory and are only optimized on `close()`.

Let's look at two cases:

1. A union of 100 `textMatch`, Stardog 5 is **1,300%** faster than Stardog 4
1. A join of 30 `textMatch`, Stadog 5 is **416% faster** than Stardog 4.

### Spatial 

We also improved the performance of spatial queries significantly, largely by following some of the same tracks laid down in the base Lucene case. Some of these numbers are, frankly, a little hard to believe, but they'r real.

1. Queries with `geo:nearby`, from **13 seconds to 10 milliseconds**
1. Queries for objects in vicinity of several locations, from **12 seconds to 21 milliseconds**
1. Queries for a point `geo:within` a polygon, from 15 seconds to 2.5 seconds...a mere **600%** increase
1. Queries with `geo:wktLiteral`, from **10 seconds to 100 milliseconds**

Some other spatial performance improvements beyond query answering:

* Bulk-loading of spatial data is about **80% faster**
* Deletes with the search index about **100% faster overall**; when
  there are several named graphs improvement is even better, transactions that took minutes now take milliseconds
* Indexing of search data with named graphs is up to **300% faster**

## 2. Query Hints are a Thing! 

{{% figure src="http://images.metmuseum.org/CRDImages/as/original/79_2_893_O1_sf.jpg" class="inliner" %}}

sp2b q5 with and without hint

## 3. Garbage Collection (almost) Never Happens

Alexander Toktarev blogged recently (["Saying Goodbye to Garbage"]({{< ref "2017-mm.md" >}})) about how memory management in Stardog 5 goes from the conventional Java garbage collection to *not that thing at all*. Stardog 5 memory management uses a devilishly clever trick to allocate memory in collections using byte arrays in such a way that no JVM GC occurs. See Alex's post for some of the details.

{{% figure src="http://images.metmuseum.org/CRDImages/rl/original/1424-1.jpg" class="inliner" %}}

% time in GC
BSBM throughput

## 3. Server is Easier to Extend

We replaced the Stardog server that used Netty with one that uses Undertow. The main benefit here was deleting **about 60,000 lines of code**. What we get in return is a much simpler, easier to extend and reason about, as well as faster HTTP server.

The new Undertow-based server has:

1. Simplified threading model
    * Easier to segment requests by type into separate thread pools
        * Much easier to partition reads and writes and control the resources they use
    * What thread/thread pool something runs in is now obvious
    * Less prone to thread starvation
        * by overloading a pool 
        * by inadvertantly blocking in an IO thread
1. Easier development
    * A more concise API with a much flatter, smaller learning curve
    * Greater reuse of services via composition
1. Implementation of SPARQL Protocol about 40% less code
1. No performance penalty

So user-defined extensions of Stardog server are now really easy. You just have to implement a single interface, declare it such that the JDK service loader picks it up, put in classpath, and restart the server.

Oh yeah: **12% better thruput...**

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

{{% figure src="http://images.metmuseum.org/CRDImages/gr/original/DP269822.jpg" class="inliner" %}}

it’s just that sync time does not block writes, so duration of writes being
blocked by joins went from == sync time, to, effectively zero, just the cost of
a couple reads and a write to ZK

### Improved Tx Perf

Evren's tx performance numbers

## 7. AWS Deployments are Trivially Easy

{{% figure src="http://images.metmuseum.org/CRDImages/as/original/2015_300_257a_Burke_website.jpg" class="inliner" %}}

Point to Graviton piece and embed video

## 8. First-class Citizen in Pivotal Cloud Foundry

{{% figure src="http://images.metmuseum.org/CRDImages/as/original/DT6718.jpg" class="inliner" %}}

embed video

Stardog 5 will be the fastest, most scalable Knowledge Graph platform available anywhere.

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**