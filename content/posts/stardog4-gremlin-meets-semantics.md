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

<pre><code>
kendall--knows-->marko
</pre></code>

This single feature alone enables a graph to support a heterogenous set of
entities (vertices) connected by a heterogenous set of relationships (edges).
Furthermore, it is this feature that provides the sophisticated reasoning
languages and capabilities adored in the RDF community.

An interesting difference between the RDF and Property Graph communities is their
respective query lanuages. In the RDF world, the _de facto_ query language is
SPARQL. In the Property Graph world, Gremlin of Apache TinkerPop. SPARQL allows the user to
express a query in terms of a pattern match. For instance, the query below asks:

> Which people know each other that also work for the same company?

<pre><code>
SELECT ?a,?b WHERE {
  ?a knows ?b
  ?b worksFor ?c
  ?a worksFor ?c
}
</pre></code>

Gremlin also supports graph pattern-matching with the analagous query below.

<pre><code>
g.V().match(
  as('a').out('knows').as('b'),
  as('b').out('worksFor').as('c'),
  as('a').out('worksFor').as('c')).
    select('a','c')
</pre></code>

However, one of the primary charms of Gremlin is its ability to express graph
traversals. A graph traversal is an algorithmic walk over the graph structure.
The Gremlin traversal below asks:

> Who does Marko know that works for Complexible?

<pre><code>
g.V().has('name','marko').out('knows').
  where(out('worksFor').has('name','Complexible'))
</pre></code>

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

For example, consider the following data in
[vehicles.trig](https://github.com/Complexible/stardog-examples/blob/master/examples/api/data/vehicles.trig),
which contains a graph for the schema (tbox) and the data (abox) in the default graph:

```
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix vh: <http://example.org/vehicles/> .
@prefix : <http://myvehicledata.com/> .
@prefix rule: <tag:stardog:api:rule:> .

# Tbox
vh:schema
{
	vh:Vehicle a owl:Class .                                    # top class in our hierarchy
	vh:Car rdfs:subClassOf vh:Vehicle .                         # Car -> Vehicle
	vh:SportsCar rdfs:subClassOf vh:Car .                       # SportsCar -> Car

	vh:LatestModel a owl:Class .				                 # latest model class
	vh:OldModel a owl:Class .  	 				                 # old model class

	# throwing some rules here
	[] a rule:SPARQLRule ;						                 # (1)
		rule:content """
			PREFIX vh: <http://example.org/vehicles/>
			IF {
				?v a vh:Vehicle ;
					vh:yearModel ?year .
				bind(year(now()) - ?year as ?yearDiff) .
				FILTER(?yearDiff = 0) .
			}
			THEN {
				?v a vh:LatestModel .
			}
		""" .

	[] a rule:SPARQLRule ;						                 # (2)
    		rule:content """
    			PREFIX vh: <http://example.org/vehicles/>
    			IF {
    				?v a vh:Vehicle ;
    					vh:yearModel ?year .
    				bind(year(now()) - ?year as ?yearDiff) .
    				FILTER(?yearDiff > 10) .
    			}
    			THEN {
    				?v a vh:OldModel .
    			}
    		""" .
}

# default graph contains Abox data
{
	:car1 a vh:Car ;
		vh:model "Camaro" ;
		vh:yearModel "2001"^^xsd:int .

	:car2 a vh:Car ;
		vh:model "Tesla" ;
		vh:yearModel "2015"^^xsd:int .

	:car3 a vh:SportsCar ;
		vh:model "Ferrari" ;
		vh:yearModel "2009"^^xsd:int .
}
```

The schema contains two simple rules in the [Stardog Rules Syntax](http://docs.stardog.com/#_stardog_rules_syntax). The
rules determine the following:

```
(1) if a vehicle's year model is the current year, then it's a latest model
(2) if a vehicle's year model more than 10 years old, then it's an old model
```

Data in the default graph states that `:car1` and `:car2` are of type `vh:Car` and `:car3` is a `vh:SportsCar`. Every
non-literal is considered a vertex in the property graph, so in order to get which elements are of type `vh:Car` we
could do a traversal over the in-edges of the `vh:Car` vertex and get the source vertices:

> _Without reasoning_

```
gremlin> g2.V('http://example.org/vehicles/Car').in()
==>v[http://myvehicledata.com/car2]
==>v[http://myvehicledata.com/car1]
```

The previous results show the stated data, but common sense (and our Class hierarchy) tells us that sports cars are
just cars too, so we can conclude that we have a dumb graph.

Property graphs with semantics provide enhanced access to your graph, taking into account your data semantics in the
schema with reasoning, but allowing you to traverse and consume your graph the same way you would normally do with a
property graph, using traversals, making your graphs smarter.

> _With reasoning_

```
gremlin> g.V('http://example.org/vehicles/Car').in()
==>v[http://myvehicledata.com/car3]
==>v[http://myvehicledata.com/car1]
==>v[http://myvehicledata.com/car2]
```

Stardog Rules are applied seamlessly and triggered automatically when reasoning is performed in stardog at query time;
from the point of view of the property graph it's just like edges and vertices that always have been there. E.g.
there's no stated data saying if any car instance in our graph is an old model (`vh:OldModel`) or a latest model
(`vh:LatestModel`), but it has a year model property for each car and our stardog rules in the schema encode the logic
that makes our graph smarter, allowing it to determine which car is old or new.

So if we want to retrieve old model or latest model cars from our property graph using the semantics defined in the
schema, we just need to traverse the incoming edges of the `vh:OldModel` or `vh:LatestModel` vertex and get the source
vertices of those in-edges, just like we did in the previous examples for `vh:Car`:

> _With reasoning_

```
gremlin> g.V('http://example.org/vehicles/OldModel').in()
==>v[http://myvehicledata.com/car1]
gremlin> g.V('http://example.org/vehicles/OldModel').in().valueMap()
==>[yearModel:[2001], model:[Camaro]]

gremlin> g.V('http://example.org/vehicles/LatestModel').in()
==>v[http://myvehicledata.com/car2]
gremlin> g.V('http://example.org/vehicles/LatestModel').in().valueMap()
==>[yearModel:[2015], model:[Tesla]]
```

The following table demonstrate the difference in vertices/edges of _Smart Property Graphs with Semantics_ vs.
_Dumb Property Graphs_, showing all the inferred vertices/edges for the property graph with reasoning.

<table>
  <tr>
      <th>Traversal</th>
      <th>Smart Property Graph (With Reasoning)</th>
      <th>Dumb Property Graph (Traditional No-Reasoning)</th>
  </tr>
  <tr>
    <td><code>g.V()</code></td>
    <td>
      <list>
        <li style="list-style-type: none;"><code>v[http://example.org/vehicles/Car]</code></li>
        <li style="list-style-type: none;"><code>v[http://example.org/vehicles/LatestModel]</code></li>
        <li style="list-style-type: none;"><code>v[http://example.org/vehicles/OldModel]</code></li>
        <li style="list-style-type: none;"><code>v[http://example.org/vehicles/SportsCar]</code></li>
        <li style="list-style-type: none;"><code>v[http://example.org/vehicles/Vehicle]</code></li>
        <li style="list-style-type: none;"><code>v[http://myvehicledata.com/car1]</code></li>
        <li style="list-style-type: none;"><code>v[http://myvehicledata.com/car2]</code></li>
        <li style="list-style-type: none;"><code>v[http://myvehicledata.com/car3]</code></li>
        <li style="list-style-type: none;"><code>v[http://www.w3.org/2002/07/owl#Thing]</code></li>
      </list>
    </td>
    <td>
      <list>
        <li style="list-style-type: none;"><code>v[http://example.org/vehicles/Car]</code></li>
        <li style="list-style-type: none;"><code>v[http://example.org/vehicles/SportsCar]</code></li>
        <li style="list-style-type: none;"><code>v[http://myvehicledata.com/car1]</code></li>
        <li style="list-style-type: none;"><code>v[http://myvehicledata.com/car2]</code></li>
        <li style="list-style-type: none;"><code>v[http://myvehicledata.com/car3]</code></li>
      </list>
    </td>
	</tr>
	<tr>
		<td><code>g.E()</code></td>
    <td>
      <list>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car1-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/OldModel]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car3-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/Car]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car3-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/SportsCar]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car2-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/Car]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car1-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/Vehicle]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car2-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/Vehicle]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car3-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://www.w3.org/2002/07/owl#Thing]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car3-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/Vehicle]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car2-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://www.w3.org/2002/07/owl#Thing]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car2-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/LatestModel]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car1-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://www.w3.org/2002/07/owl#Thing]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car1-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/Car]</li>
      </list>
    </td>
    <td>
			<list>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car3-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/SportsCar]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car2-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/Car]</li>
				<li style="list-style-type: none;"><code>e[http://myvehicledata.com/car1-http://www.w3.org/1999/02/22-rdf-syntax-ns#type->http://example.org/vehicles/Car]</li>
			</list>
    </td>
  </tr>
</table>

Some things to note:

* **Look ma! No SPARQL!**

  Even though our data is originally in an RDF representation and contains semantics, we're *only* using traversals to
	access the graph data.

* **Reasoning and inferred information are just edges and vertices**

  When using _Smart Property Graphs_ in Stardog there's really no more concepts involved other than edges, vertices
	and traversals, which people using property graphs already know about, making it straightforward to use; really,
	who doesn't want their graphs to be smart!?

* **Don't get locked with one approach**

  Using the _"property graph way"_ in Stardog doesn't mean you can't use SPARQL or any other tool available is
	Stardog, which makes everything so much flexible when working with graphs in general.

Code for this example is available at the
[TinkerPop3Example](https://github.com/Complexible/stardog-examples/blob/master/examples/api/main/src/com/complexible/stardog/examples/tinkerpop/TinkerPop3Example.java)
in the [stardog-examples](https://github.com/Complexible/stardog-examples) repo.

## Implementation

Our implementation strategy generally in Stardog is to reduce various services
(internally) to SPARQL query evaluation and then to optimize the hell out of
SPARQL query evaluation. The same goes for our TP3 implementation.

In order to be able to represent property graphs in Stardog and query them via
SPARQL, we needed to introduce a form of reification that would allow us to express
edge properties in the RDF model. Stardog 4.0 introduces a reification function
which computes an statement identifier for any RDF quad in a Stardog database,
extending this model to have a notion of virtual "quints".

Reasoning in Property Graphs via TP3 is just a natural by-product of Stardog's amazing
reasoning capabilities and our query optimizer, which also made it easier for us to implement.
Once we were able to represent property graph access with SPARQL queries, reasoning can
be applied to those generated queries, letting our implementation interpret SPARQL
results in the regular way to translate back to property graph concepts.
There's really no specific code to handle reasoning vs non-reasoning usage of
Stardog's TP3 implementation internally.
You can choose to use reasoning or not with Property Graphs, given that reasoning in Stardog happens
at query time, you only pay for what you use.

More details about the internal representation and how to use TinkerPop3 with Stardog can be found in the
[Stardog Documentation](http://docs.stardog.com/#_motivation_implementation).

## What's Next?

In 4.1 we'll release Pelorus---our faceted graph browser---integrated into the
Stardog Web Console. In the rest of the 4.x release cycle we'll focus on
scalability, HDFS integration, SPARQL performance, and refinement of existing
capabilities. All of that on the way to Stardog 5, which will be the first
horizontally distributed semantic graph platform.

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
