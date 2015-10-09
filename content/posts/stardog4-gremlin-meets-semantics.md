+++
date = "2015-10-08T15:04:24-04:00"
draft = true
author = "Kendall Clark, Marko A. Rodriguez, and Edgar Rodriguez-Diaz"
title = "Stardog 4: Gremlin Meets Semantics"
+++

Stardog 4 is semantic graph technology to solve enterprise data integration
problems. That means *semantics* AND *graphs*...In this post we describe the
combination in detail.<!--more-->

## The Power of Semantic Graphs

RDF and Property Graphs are two graph data structures that share many features
in common. Perhaps their primary similarity is fact that both types of graphs support
labels on their edges. This enables data modelers to not only say that two
vertices are related, but also in which way they are related. For instance,

{code}
kendall--knows-->marko
{code}

This single feature alone enables a graph to support a heterogenous set of 
entities (vertices) connected by a heterogenous set of relationships (edges).
Furthermore, it is this feature that provides the sophisticated reasoning 
languages and capabilities adored in the RDF community. 

An interesting difference between the RDF and Property Graph communities is their
respective query lanuages. In the RDF world, the _de facto_ query language is 
SPARQL. In the Property Graph world, Gremlin of Apache TinkerPop. SPARQL allows the user to 
express a query in terms of a pattern match. For instance, the query below asks:

> Which people know each other that also work for the same company?

{code}
SELECT ?a,?b WHERE {
  ?a knows ?b
  ?b worksFor ?c
  ?a worksFor ?c
}
{code}

Gremlin also supports graph pattern-matching with the analagous query below.

{code}
g.V().match(
  as('a').out('knows').as('b'),
  as('b').out('worksFor').as('c'),
  as('a').out('worksFor').as('c')).
    select('a','c')
{code}

However, one of the primary charms of Gremlin is its ability to express graph 
traversals. A graph traversal is an algorithmic walk over the graph structure.
The Gremlin traversal below asks:

> Who does Marko know that works for Complexible?

{code}
g.V().has('name','marko').out('knows').
  where(out('worksFor').has('name','Complexible'))
{code}

Given the toy world presented in the queries above, suppose that the graph
dataset explicitly denotes that Kendall works for Stardog. However, it also
states that Stardog works for Complexible. The query above would 
not list Kendall as a person that Marko knows who works for Complexible. However,
with the power of OWL, it is possible to state that `worksFor` is a transitive
relationship in that if Kendall works for Stardog and Stardog works for 
Complexible, then Kendall works for Complexible. In this way, while
the fact that Kendall works for Complexible is not explicit in the graph structure,
it is implicit in the graph schema by means of the OWL ontology. With Stardog, the OWL
enables implicit relationships to appear explicit (generated at query time).
When combined with Gremlin, Gremlin has semantics!

Stardog provides its customers a *semantic graph* technology for solving 
enterprise integration problems. A result of that dual commitment is that 
Stardog 4 seemlessly blends semantic and property graphs, SPARQL and Gremlin, 
and with repsects to the thesis of this post, Gremlin and semantic reasoning. 
Stardog 4 is a fully featured, TinkerPop-enabled graph database (OLTP) 
and processor (OLAP).

## Gremlin, SPARQL, OWL, and Rules

Stardog 4 is the first TinkerPop3 (TP3) implementation that seamlessly blends with reasoning
and other semantic services. Which is to say that a Gremlin traversal can
interact with inferred edges, nodes, and node properties.

{We need a dataset (use http://grouplens.org/datasets/movielens/) and some rules
and constraints...}

For example, consider...

{Edgar writes some examples...}

* gremlin traversal
* sparql query
* one of each with reasoning
* ICV example

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
