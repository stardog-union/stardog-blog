+++
author = "Kendall Clark"
categories = ""
date = "2017-04-17T00:00:00Z"
discourseUsername = "kendall"
draft = false
series = ["release-preview"]
title = "9 Reasons Stardog 5 is Awesome"
+++

We're preparing Stardog 5 beta for release. This post describes the high points of
the best enterprise knowledge graph platform on the planet. If data siloes are
ruling everything around you, you need Stardog.<!--more-->

Despite the following, there's only *one* actual reason why Stardog 5 is
awesome: **my coworkers are an unstoppable force of software power.** I get to
tell you about the amazing work of other people, but it is *those* amazing
people who did *this* amazing work.

**TLDR**: We made it easier, faster, more resilient, and more useful.

## 1. AWS Deployments are Trivial

Let's start with the stuff that gets you home from work on time: push button
cloud deployments. We've been working hard on AWS and Pivotal Cloud Foundry
integrations. It's *dead simple easy* to deploy Stardog.

[Stardog Graviton](https://github.com/stardog-union/stardog-graviton) compiles
to a single binary executable that lives on a client machine and provides a
"one-click virtual appliance" installation for Stardog HA Cluster.

Graviton leverages the power of [Amazon Web Services](https://aws.amazon.com/)
to deploy, configure, and launch all of the virtual hardware and software needed
for an optimal Stardog cluster deployment. All you have to provide is the AWS
account.

Now watch this video!

<iframe width="640" height="360"
src="https://www.youtube.com/embed/TnzGMqj5rJI?ecver=1" frameborder="0"
allowfullscreen></iframe>

We made Graviton so that Stardog on AWS would be easy. We made it
Apache-licensed so it could be extended to other cloud environments.

## 2. Pivotal Cloud Foundry are Even Easier!

That was so much fun we thought we'd do the same thing for the *other* cloud
environment we love, i.e., Pivotal's Cloud Foundry. Thanks to our good friend,
Stuart Charlton, for help on this one.

<iframe width="640" height="360"
src="https://www.youtube.com/embed/A09BcmewiVY?ecver=1" frameborder="0"
allowfullscreen></iframe>

Stardog's PCF Service Broker paves the way for Stardog on Pivotal Network as a
tiled service.

## 3. Queries, Search, and Spatial are Faster

More or less everything in Stardog 5 is faster, more scalable, and 
more performant compared to Stardog 4. 

### Faster SPARQL Queries 

Queries for which Stardog doesn't perform well are bugs and we treat them as
such. Please do likewise. Lots of small changes add up to non-trivial peformance
gains, but we also made some bigger changes, too.

#### New Statistics

Statistics are important for query costing and, hence, for query planning and
optimization. But they can be prohibitively expensive to compute and are one of
the true black arts of database design and programming.

Ideally in Stardog 5 we wanted more accurate and also cheaper statistics.
The [count-min sketch](https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch)
turned out to be just the thing. Stardog 5 computes statistics in a single
streaming pass through one index and doesn't build any auxiliary, persistent
data structures.

Stardog 5 stats include two probabilistic data structures to replace the
previous persistent maps to hold counts for object counts for each
characteristic set. 

*First*, we build a count-median-min sketch to answer frequency queries for
objects. This one is compact and very accurate for frequently occurring objects.
*Second*, to answer membership queries for rarely occurring objects, we use a
Bloom filter.

Unfortunately, they have linear space requirements which would make them
expensive to build and manage. Also, their size is difficult to know ahead of
time since we don't know the size of each characteristic set before we build it.
Therefore, we take a fixed-size uniform sample of objects occurring in each set
using the reservoir sampling technique and build the Bloom filter accordingly.

For some graphs the more accurate statistics make a huge difference in
performance. For example, on
[Yago](https://www.mpi-inf.mpg.de/departments/databases-and-information-systems/research/yago-naga/yago/demo/)
Stardog 5 is **1,600% faster** than Stardog 4.

#### Grace Hash Joins

We also added an implementation
of [grace hash join](https://en.wikipedia.org/wiki/Hash_join#Grace_hash_join),
which partitions the right operator, hashes each partition, and then iterates
over the left operator. This improves query performance dramatically in some
cases. @@TODO

### Faster Search, Too

We improved performance for Stardog's semantic search capability significantly,
primarily by optimizing the way we interact with Lucene's indexes. We reduced
search times in some hard cases from several seconds to milliseconds. This
involved using `SearchManager` more cleverly and deleting lots of unnecessary
code. It also involved recognzing our interactions with Lucene are batch- and
transaction-oriented, in which case it made more sense to use new `IndexWriter`s
with each transaction. They occupy a fair bit of memory and are only optimized
on `close()`.

Let's look at two cases:

1. A union of 100 `textMatch`, Stardog 5 is **1,300%** faster than Stardog 4
1. A join of 30 `textMatch`, Stadog 5 is **416% faster** than Stardog 4.

### One More Thing: Now Spatial is Stupid Fast!

We also improved the performance of spatial queries significantly, largely by
following some of the same tracks laid down in the base Lucene case. Some of
these numbers are, frankly, a little hard to believe, but they're real.

1. Queries with `geo:nearby`, from **13 seconds to 10 milliseconds**
1. Queries for objects in vicinity of several locations, from **12 seconds to 21 milliseconds**
1. Queries for a point `geo:within` a polygon, from 15 seconds to 2.5 seconds...a mere **600%** increase
1. Queries with `geo:wktLiteral`, from **10 seconds to 100 milliseconds**

Some other spatial performance improvements beyond query answering:

* Bulk-loading of spatial data is about **80% faster**
* Deletes with the search index about **100% faster overall**; when
  there are several named graphs improvement is even better, transactions that took minutes now take milliseconds
* Indexing of search data with named graphs is up to **300% faster**

## 4. Query Hints are a Thing! 

sp2b q5 with and without hint

## 5. Garbage Collection (almost) Never Happens

Alexander Toktarev blogged recently
(["Saying Goodbye to Garbage"]({{< ref "2017-mm.md" >}})) about how memory
management in Stardog 5 goes from the conventional Java garbage collection to
*not that thing at all*. Stardog 5 memory management uses a devilishly clever
trick to allocate memory in collections using byte arrays in such a way that no
JVM GC occurs. See Alex's post for some of the details.

% time in GC
BSBM throughput

## 6. Server is Easier to Extend

We replaced the Stardog server that used Netty with one that uses Undertow. The
main benefit here was deleting **about 60,000 lines of code**. What we get in
return is a much simpler, easier to extend and reason about, as well as faster
HTTP server.

The new Undertow-based server has:

1. Simplified threading model
    * Easier to segment requests by type into separate thread pools
        * Much easier to partition reads and writes and control the resources
          they use
    * What thread/thread pool something runs in is now obvious
    * Less prone to thread starvation
        * by overloading a pool
        * by inadvertantly blocking in an IO thread
1. Easier development
    * A more concise API with a much flatter, smaller learning curve
    * Greater reuse of services via composition
1. Implementation of SPARQL Protocol about 40% less code
1. No performance penalty

So user-defined extensions of Stardog server are now really easy. You just have
to implement a single interface, declare it such that the JDK service loader
picks it up, put in classpath, and restart the server.

Oh yeah: **12% better thruput...**

## 7. Virtual Graphs are Faster and Easier to Extend

* New Virtual Graph engine (called **VEGA** internally) uses Apache Calcite extensively
* Support for subqueries & aggregates
* Reduction of unnecessary self joins
* Improved query generation (more concise, less "noise")

performance?

## 8. High Availability Cluster is More Resilient 

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

## 9. Tableau for a Great Good

VSC is our platform for now. Studio an IDE for all things EKG. First baby step:
syntax highlighting for our languages. Next up: things. Electron.

## Conclusion


Before that, let's look at some software engineering stats really fast:

<!-- table with # of commits, # of changed lines, # of branches -->


Finally, to repeat the key point---these people are the real reason Stardog 5 is so great:

* Jess Balint
* John Bresnahan
* Adam Bretz
* Mark Ellis
* Scott Fines
* Michael Grove
* Pavel Klinov
* Paul Marshall
* Stephen Nowell
* Evren Sirin
* Ty Soehngen
* Alexander Toktarev

Stardog 5 will be the fastest, most scalable Knowledge Graph platform available anywhere.

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
