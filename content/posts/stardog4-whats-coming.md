+++
date = "2015-07-15T15:04:24-04:00"
draft = true 
author = "Kendall Clark"
title = "A Preview of Stardog 4"
+++

Stardog 4 will include some big changes. Let's preview them. Watch this space
for the Stardog 4 release announcement early this fall. <!--more-->

## Gremlin Joins SPARQL

**Stardog 4 supports property graphs, Gremlin, and TinkerPop 3.**

Stardog is now a polyglot graph database, equally useful for RDF and property
graphs. In fact Stardog is the only graph system that exposes the full power of rules
and OWL reasoning to graph traversals and the property graph model generally.

[Apache TinkerPop](http://tinkerpop.incubator.apache.org/) is the de facto API
for property graph implementations, and Gremlin is a DSL for traversing graphs.
Gremlin is to property graphs as SPARQL is to RDF graphs.

Stardog customers understand that smart graphs are better than dumb graphs and
that smart data is better than smart code. They want to query *and* traverse
(and search and learn and...) *semantic* graphs, which is why Stardog 4's
support for Gremlin including rules and axiomatic reasoning.

## Virtual Graphs and Enterprise Integration 

**Stardog 4 supports Virtual Graphs via R2RML for enterprise integration.**

In the enterprise, *where the data comes from* is an important consideration.
Put another way, the relationship between *systems of record* data and graph
data is crucial and largely ignored in graph databases. Stardog takes this
relationship to be central: it can model (and integrate and analyze) data that
lives in non-graph (and graph!) systems of record.

Stardog 4 virtual graphs support declarative mappings of any JDBC-accessible
RDBMS into a Stardog graph with query-time instatiation of the mappings.

**The real potential of graph databases is integrating hetereogenous enterprise
data behind the firewall in order to reduce the cost and increase the quality of
analytics.**

## Faceted Graph Browsing with Pelorus

**Stardog 4 embeds Pelorus, a faceted graph navigation browser.**

Stardog's semantic graphs often integrate very complex domains that are made up
of very many data sources. The domain model may itself be complex and dynamic in
a way that makes queries (or traversals) non-trivial.

One way to deal with this complexity is good UI. Pelorus is good UI for graphs.
It's also ~1500 lines of Clojurescript React functional goodness.

{{screenshot}}

## Geospatial Query

**Stardog 4 geospatial query... something something.**

Gist

## Moving to Java 8

**Stardog 4 requires Java 8 and will not work with an earlier version of Java.**

Java 6 and 7 are officially dead. So we jumped all the way to Java 8, especially
since it offers some new capabilities we were dying to bake into Stardog like
lambdas, parallelism, streams, etc.

## Core API Changes

**Stardog 4 includes core API changes.** More lambda, more streaming, more
  auto-closing, etc. Move to Java 8 opens up possibilities.

## HA Cluster Simplified

**Stardog 4 simplifies the High Availability Cluster by eliminating separate proxy.**

Dumping proxy for yr load balancer...

## What's Next?

For the 4.x release cycle we'll focus on three areas:

- scalability
   1. [HDFS](http://hadoop.apache.org/docs/r1.2.1/hdfs_design.html)-based LSM tree indexes;
   1. concurrent query evaluation; and
   1. a distributed cost model
- SPARQL performance
- refinement of existing capabilities
