+++
date = "2015-07-15T15:04:24-04:00"
draft = true 
author = "Kendall Clark"
title = "A Preview of Stardog 4"
+++

Stardog 4 is headed this way. Let's preview the goodness. <!--more-->In this post
we'll look at the big changes coming in Stardog 4, including

* TinkerPop 3 property graph & Gremlin support
* virtual graphs via R2RML
* Pelorus faceted navigation
* Geospatial query answering
* Cluster simplifications
* *require Java 8*

## Gremlin Meets Stardog
{{% figure src="/img/gremlin.jpg" class="inliner" %}}

### What?

[Gremlin](http://tinkerpop.apache.org/) is a (widely implemented)
domain-specific language (DSL) for traversing graphs; Gremlin is to property
graphs as (roughly) SPARQL is to RDF.

When we shipped Stardog 1.0 we included a (toy) implementation of Gremlin, the
property graph DSL for graph traversal. No one showed the least interest in
using it so we deprecated it soon after.

However, things have changed since then. Stardog has matured and so has Gremlin,
especially with the TinkerPop 3 move to Apache Foundation. And increasingly our
customers ask about traversing *semantic graphs*, that is, Gremlin support in
Stardog including rules and axiomatic reasoning.

Maybe this is a terrible intro...

### Why?

## Virtual Graphs are Integration Hubs
{{% figure src="/img/hub.jpg" class="inliner" %}}

In enterprise settings *where the data comes from or lives* is an important
consideration...

Query-time, dynamic integration via declarative mappings

{{% figure src="/img/pelorus.jpg" class="inliner" %}}
## Faceted Graph Browsing with Pelorus

Screenshots...Mention joys of Cljs.

## Geospatial Query
{{% figure src="/img/geo.jpg" class="inliner" %}}
Gist...a bit of description...

## Cluster Simplified
{{% figure src="/img/grape.jpg" class="inliner" %}}

Dumping proxy for yr load balancer...

## Requiring Java 8
{{% figure src="/img/java.jpg" class="inliner" %}}

It was time and it brings opportunities, hence... API changes...

## API Changes
{{% figure src="/img/interface.jpg" class="inliner" %}}

More lambda, more streaming, more auto-closing, etc.

## Conclusion

Thanks to everyone who worked so hard on this release. Thanks to our
users and customers for helping us in numerous ways.

Watch this space for the Stardog 3.0 release announcement later in
February.
