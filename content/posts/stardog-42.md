+++
date = "2016-09-21T10:04:29-04:00"
draft = false 
title = "Stardog 4.2—Docs on Lockdown!"
author = "Kendall Clark"
+++

We're happy to announce the release of Stardog 4.2, our first major release
since closing our first funding round in July. Complete release notes 
are [available](http://docs.stardog.com/release-notes/). Let's review the highlights.<!--more-->

## Unstructured Data...Unified

Our mission is to unify all enterprise data, which includes, crucially, the
*unstructured* stuff. In 4.2 we've added new capabilities to store, search,
index, retrieve, and unify the unstructured data of documents and files.
User-defined NLP, text mining, or machine learning algorithms can (optionally)
be called at document ingest time to extract *structured* data, i.e., nodes and
edges, from unstructured data.

All the beautiful details are
available [here](http://blog.stardog.com/unifying-unstructured-data/)
and [here](http://docs.stardog.com/).

To be honest, this should have been Stardog 5.0 release based on this new set of
capabilities, but we have some backward-incompatible API changes coming up which
we will isolate in the 5.0 release.

## Named Queries

We've also added the ability to give queries a name (either per database or per
server) and then use that name any place where a query is legal. We serialize
the query in Stardog's system catalog and then look it up later. This paves the
way for a more general stored procedure-like capability in a future release;
but, note, that Stardog's declarative rule capability, which we've shipped
forever, is already quite sproc-like.

## Cluster Stability

We realized that update queries with auto transactions were causing cluster
nodes to be expelled; that's no good so we fixed it. And now cluster session and
connection timeouts are easily configured, which makes the cluster more stable
if network latency is high.

## Aggregate Queries Resilience

Off-heap support for query evaluation is extended in Stardog 4.2 to cover SPARQL
1.1 aggregates. This change makes Stardog more resilient to OOM errors on hard
queries that include aggregation. In low memory scenarious Stardog will move
partially computed aggregates off heap and then, if needed, spill them to disk.
 
This is especially important for queries that contain aggregates with `DISTINCT`
keyword—think: `COUNT(DISTINCT *)` or `SUM(DISTINCT ?x)`—which can require large
state during computation.

## Conclusion

Stardog 4.2 is our best release ever and moves us closer to our goal of unifying
all enterprise data. Check it out: free 30-day evals are waiting for you at
http://stardog.com/.
