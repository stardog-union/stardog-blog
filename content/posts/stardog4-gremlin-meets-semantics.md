+++
date = "2015-10-08T15:04:24-04:00"
draft = true
author = "Kendall Clark, Marko Rodriguez, and Edgar Rodriguez-Diaz"
title = "Stardog 4: Gremlin Meets Semantics"
+++

Stardog 4 is semantic graph technology to solve the enterprise data integration
problems. That means *semantics* AND *graphs*...In this post we describe the
combination in detail.<!--more-->

## The Power of Semantic Graphs

RDF and Property Graphs are two sides of the same coin. The differences between
them are quite minor, despite what property graph vendors have been saying for
years. The really interesting difference has always been between SPARQL and
Gremlin, i.e., the difference between querying and traversing a graph (and, in
truth, even then these exist together on a continuum).

The commitment in Stardog is to *semantic graph* technology for solving
enterprise integration problems. A result of that dual commitment is that
Stardog 4 blends semantic and property graphs, SPARQL and Gremlin, Gremlin and
reasoning seamlessly. Stardog 4 accomplishes this by offering a new
implementation of the Apache TinkerPop 3 (TP3) APIs.

**Why take only one piece when you can have the whole pie?**

## Gremlin, SPARQL, OWL, and Rules

Stardog 4 is the first TP3 implementation that seamlessly blends with reasoning and
other semantic services. Which is to say that a Gremlin traversal can interact with
inferred edges, nodes, and node properties.

For example, consider...

{Edgar writes some examples...}

## Implementation 

Our implementation strategy generally in Stardog is to reduce various services
(internally) to SPARQL query evaluation and then to optimize the hell out of
SPARQL query evaluation. The same goes for our TP3 implementation.

{Edgar says some stuff about the implementation...}

## What's Next?

In 4.1 we'll release Pelorus---our faceted graph browser---integrated into the
Stardog Web Console. In the rest of the 4.x release cycle we'll focus on
scalability, HDFS integration, SPARQL performance, and refinement of existing
capabilities. All of that on the way to Stardog 5, which will be the first
horizontally distributed semantic graph platform.

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
