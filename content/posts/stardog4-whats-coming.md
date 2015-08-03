+++
date = "2015-07-15T15:04:24-04:00"
draft = false
author = "Kendall Clark"
title = "A Preview of Stardog 4"
+++

Let's preview the big changes coming in Stardog 4. Watch this space for the
release soon. <!--more-->

## Gremlin Joins SPARQL

**Stardog 4 supports property graphs, Gremlin, and TinkerPop 3.** Stardog is now
a polyglot graph database and handles both RDF and property graphs. In fact
Stardog is the only graph system that exposes the full power of rules and OWL
reasoning to graph traversals and the property graph model generally.

[Apache TinkerPop](http://tinkerpop.incubator.apache.org/) is the de facto API
for property graph implementations, and Gremlin is a DSL for traversing graphs.
Gremlin is to property graphs as SPARQL is to RDF graphs.

Stardog users understand that smart graphs are better than dumb graphs and that
smart data is better than smart code. They want to query *and* traverse (and
search and learn and...) *semantic* graphs, which is why Stardog 4's support for
Gremlin including rules and axiomatic reasoning.

### Namespace-less Mode

Our property graph friends don't use URIs for node or edge labels; and sometimes even
semantic graph applications don't really need to pay that cost upfront. Stardog already 
supported stored namespaces and using these namespaces in SPARQL queries without prefix 
declarations making it easier to work with URIs. 

Stardog 4 supports omitting namespace  declarations in RDF files as well. Namespaces for RDF, RDFS, OWL, and XSD vocabularies are  automatically added to Stardog databases along with a default namespace making it possible 
to insert, delete, and query data without any prefix declarations at all.

## Virtual Graphs and Enterprise Integration 

**Stardog 4 supports Virtual Graphs for enterprise integration.** In the
enterprise, *where the data comes from* is an important consideration. Put
another way, the relationship between *systems of record* data and graph data is
crucial and largely ignored in graph databases. Stardog takes this relationship
to be central: it can model (and integrate and analyze) data that lives in
non-graph (and graph!) systems of record.

Stardog 4 virtual graphs support declarative mappings of any JDBC-accessible
RDBMS into a Stardog graph with query-time instatiation of the mappings.

**The real potential of graph databases is integrating hetereogenous enterprise
data to reduce the cost and increase the quality of analytics.**

## Geospatial Query

**Stardog 4 includes geospatial query support.** Graph data that uses the
  [WGS 84](http://www.w3.org/2003/01/geo/) or [OGC GeoSPARQL](http://www.opengeospatial.org/standards/geosparql) 
  vocabulary to
  [encode](http://www.w3.org/2003/01/geo/wgs84_pos) latitude & longitude will
  trigger Stardog 4 to spatially index every `geo:Feature` it can find. Then you
  can do `geo:relate`, `geo:distance`, `geo:within`, and `geo:area`, etc. in
  SPARQL queries.

All of this is user extensible by grabbing
[JTS](http://www.vividsolutions.com/jts/JTSHome.htm) and dropping the JAR into
the classpath, then setting `spatial.use.jts=true`, which enables WKT shapes,
including polygons, etc.

What does it look like? [Check it out](https://gist.github.com/kendall/b699db38ec4c0034eba2).

## Java 8

**Stardog 4 requires Java 8 and will not work with an earlier version of Java.**
Java 6 and 7 are officially dead. So we jumped all the way to Java 8, especially
since it offers some new capabilities we were dying to bake into Stardog like
lambdas, parallelism, streams, etc.

## Core API Changes

**Stardog 4 includes core API changes.** Some of these changes are to take
  advantage of Java 8 features like `Stream` and `java.nio.file#Path`. Others are
  cleanups to move Stardog to RDF 1.1.

## What's Next?

In the 4.1 we'll release [Pelorus](http://nasa.clarkparsia.com/)---our faceted
graph browser---integrated into the Stardog Web Console. Then in the remainder
of the 4.x release cycle we'll focus on scalability, HDFS integration, SPARQL
performance, and refinement of existing capabilities.

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
