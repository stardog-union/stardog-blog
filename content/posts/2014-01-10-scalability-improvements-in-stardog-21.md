+++
title = "Scalability Improvements in Stardog 2.1"
date = "2014-01-10" 
author = "Kendall Clark"
+++

The upcoming [Stardog 2.1](http://stardog.com/) release improves
query scalability by about 3 orders of magnitude and can handle 50
billion triples on a $10,000 server.<!--more--> We've never been overly
concerned about Stardog scalability per se: first we wanted to make it
easy to use; then we wanted to make it fast. We just assumed we'd get
around to make it *insanely scalable*, too. Stardog 2.1 makes giant
leaps in query, data loading, and reasoning scalability.

Running on $10,000 of server hardware (32 cores, 256 GB RAM), Stardog
2.1 can handle 20 to 50 billion triples. Compared to Stardog 2.0.x,
Stardog 2.1 loads ~100M triple datasets about two times faster; it
loads ~1B triple datasets about 3 times faster---all while using much
less memory. 2.1 can load 20B datasets at 300,000 triples per
second. We also improved query evaluation performance significantly so
that Stardog 2.1 is still very fast, even at much larger database
sizes. How did we do it?

## Improving Concurrency

Much of the performance improvement comes from taking care with
concurrency and reducing thread contention, especially during bulk
data loading (i.e., initial database creation with large amounts of
data being added at creation time). We're avoiding more locks and
using more non-blocking algorithms and data structures a lot more
often. Moving for example from `BitSet` to `ConcurrentLinkedQueue`
helps, even though the former is more space efficient than the
later. We're also using `ThreadLocal`s more aggressively to reduce
thread contention and avoid synchronization. As loading performance
improved, several LRU caches became problematic since evictions were
being swamped by additions. Batching evictions in a single thread
helps but increases memory pressure and GC times.

## Worse Hashing is Better Hashing

Stardog hashes URIs, bnodes, and literal values for storage in a
mapping dictionary; previously we used the 64-bit `MurmurHash` because
it's very fast, has low collision rate, and lets us store values as
longs. When handling collisions and cache misses, disk accesses are
required; at scale these random disk accesses are too
expensive. Moving to `SHA1` is perhaps non-intuitive since the hash
size goes from 64 to 160 bits. But since that makes hash collision
practically impossible, we're able to achieve significant speedups---it
also simplifies the mapping dictionary significantly.

## Off-Heap Memory Management

Before 2.1, we were using `mmap` aggressively during loading in order to use the operating system's VM, memory management, etc. But memory mapped files in JVM are notoriously crappy (`unmap`!), and we've seen frequent JVM crashes when we had a lot of memory mapped files around. Not good.

We also realized that memory mapped files were causing performance slowdowns when there was more than 64GB of RAM available. And since we have no control over when memory mapped files were flushed to disk, that was typically happening too often. But keeping this information on the Java heap was never a viable choice at scale because of GC processing. Stardog 2.1 moves to an off-heap memory allocation scheme, which gives us very fine-grained control over disk flushes, uses available system memory more efficiently, and is (roughly) as fast as memory mapping.

## Reducing GC Pauses

Finally, to significantly improve loading performance we needed to do
something about GC costs, which are important in bulk loading because
of high rate of object creation and destruction. Using immutable
objects makes it possible to improve concurrency but with the overhead
of additional garbage being created. Tuning the GC knobs and buttons
didn't really help appreciably. We've addressed the GC processing
costs by reworking places where we were unnecessarily creating
objects. That kind of careful software engineering is aided by the
relatively small size of the Stardog code base. It's like engineering
works or something!

This careful software re-engineering included, for example, delving
into the guts of the RDF parser to use a single `StringBuilder` that
was continuously reset rather than creating new builders for each RDF
value. We also reduced the amount of cache use on the heap to relieve
memory pressure. We now see GC pauses taking 1% or less of the overall
bulk loading time.

## Query Evaluation

It doesn't do much good to improve bulk data loading performance if
you don't also improve query evaluation performance at least as
much. So we did that, too. The key to improving query evaluation
performance in 2.1 came down to memory usage and how we handle
intermediate results. Consider a SPARQL query from
[SP2B](http://dbis.informatik.uni-freiburg.de/forschung/projekte/SP2B/):

<pre><code class="sparql">
SELECT DISTINCT ?name1 ?name2
  WHERE {
     ?article1 rdf:type bench:Article .
     ?article2 rdf:type bench:Article .
     ?article1 dc:creator ?author1 .
     ?author1 foaf:name ?name1 .
     ?article2 dc:creator ?author2 .
     ?author2 foaf:name ?name2 .
     ?article1 swrc:journal ?journal .
     ?article2 swrc:journal ?journal
  FILTER (?name1 &lt; ?name2)
}</code></pre>

For a 5M triple database, this query produces 18,362,955 (!) results
and the `DISTINCT` keeps them in memory. Unworkable at scale. Stardog
2.1 addresses this issue by reusing the new off-heap memory allocation
scheme. A small heap doesn't work; and GC processing kills you with a
large heap, so we just avoid the heap instead. Yes, that means we have
to manage memory manually, but that's actually achievable in a JVM
application. We implemented a memory manager based on various JVM
internals; it's responsible for allocating (and deallocating) data
used during query evaluation, including holding intermediate query
results. It manages the heap outside the JVM and will flow to disk
when needed. The new memory manager also performs some static analysis
of the query using database statistics to guide its behavior.

## Moving Forward

No public APIs were harmed in the creation of the new scalability
improvements. See
[this slide deck](http://presentboldly.com/kendall/stardog-21) for an
overview of some other changes in Stardog 2.1.
