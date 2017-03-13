+++
title = "A Path of Our Own"
date = "2017-03-06"
author = "Evren Sirin"
categories = ["graph", "rdf", "knowledge graph"]
draft = true
discourseUsername = "evren"
+++

Path finding is not easily achievable in SPARQL mainly because a path of edges
cannot be naturally represented in the tabular result format of SPARQL. Now that
we [extended the SPARQL solutions](extending-the-solution), we can introduce
a path finding extension to SPARQL.

## Background

SPARQL is a powerful [graph query standard](http://www.w3.org/TR/sparql11-query/) 
for RDF that provides a SQL-like syntax that allows 
querying graph patterns along with many other features like optional patterns, unions,
subqueries, aggregation and negation. As we briefly touched on our [previous post](extending-the-solution),
there is one limitation with SPARQL: finding paths between nodes is not easy.

SPARQL has a [property path](https://www.w3.org/TR/sparql11-query/#propertypaths)
feature that can be used for queries that recursively traverse the RDF graph and 
find two nodes connected via a 
complex path of edges. But the result of a property path query is only the
start and end nodes of the path and does not include the intermediate nodes. In order to find
the intermediate nodes additional and/or more complex queries are needed.

This kind of limitation makes the proponents of the so-called "native graph" systems, 
which of course has no real technical meaning and just a marketing cudgel,
claim SPARQL is not a "real" graph query language  because
those systems mainly provide a graph traversal capability. This is a mostly harmless 
but often irritating confusion. But setting marketing polemics  aside, 
it's clear that Stardog as the leading Knowledge Graph platform should have a query 
language that provides an easy way to find paths between nodes in a graph.

{{% figure src="https://i.ytimg.com/vi/uWP2iFOSaoc/maxresdefault.jpg" class="inliner" %}}

## Finding Our Own Path

We are working on extending Stardog so users have an easy way of expressing a path 
finding query inside SPARQL, which will allow finding **and retrieving** paths of 
arbitrary complexity. We codenamed this extension **Pathfinder**.

The primary goal of Pathfinder is to have a concise syntax for path queries in SPARQL. 
There are many different kinds of path finding problems we 
want to address with this extension. We might want to find paths between a fixed
pair of nodes or between all nodes (of course latter is practical only for graphs of 
certain size). We might be looking for any path versus only shortest 
paths possibly based on a weight. And sometimes there might not be an explicit edge 
between two nodes but there might be a graph pattern corresponding to a relationship
that links these nodes. It should be possible to find paths over these implied
relationship edges.

We will publish more details about the syntax and the semantics of this extension later
but in this post we will simply describe how path queries will work using some examples.
First, let's look at how the syntax of path queries looks like:

```
PATH ?p FROM ?s[=startNode] TO ?e[=endNode] {
   GRAPH PATTERN
}
[ORDER BY condition] 
[LIMIT int] 
```

Suppose we have this very simple social network where people are connected via `knows` relationship:

{{% figure src="/img/pathfinder_graph.png" class="inliner" %}}

Now, suppose we want to find all the people Alice is connected to in this graph and
how she is connected to the those people. The corresponding path query looks like this:

```sparql
path ?p from ?x = :Alice to ?y {
   ?x :knows ?y
}
```

Note that we specified a start node for the path query but the end node is unrestricted
so all the paths starting from Alice will be returned. This query is effectively equivalent
to the SPARQL property path `:Alice :knows+ ?y` but the difference is that the results
will include the intermediate nodes in the paths.

The results of a path query is a list of solutions just like in a SELECT query but we
will be using the [extended solutions](extending-the-solution) introduced before. 
The result of the above query would look like this:

```json
[
  {"p": [ {"x": ":Alice", "y": ":Bob"} ] },
  {"p": [ {"x": ":Alice", "y": ":Bob"}, {"x": ":Bob", "y": ":Charlie"} ] },
  {"p": [ {"x": ":Alice", "y": ":Bob"}, {"x": ":Bob", "y": ":David"} ] }
]
```

In the results there is one solution for each path found. In each solution the path 
variable `?p` is bound to one and only one array of edges. Each edge is itself a
solution that binds the variables of the graph pattern in the graph pattern.

The execution of a path query is done by recursively evaluating the graph pattern
in the query and replacing the start variable with the binding of the end variable
in the previous execution. If the query specifies a start node, that value is used 
for the first evaluation of the graph pattern. If the query specifies an end node 
(above example doesn't) execution stops when we reach the end node. Cycles are not 
allowed in the results.

Graph patterns inside the path queries can be arbitrarily complex. Suppose, we
want to find undirected path between Alice and Eve in this graph. Then we can
make the graph pattern to match both outgoing and incoming edges:

```sparql
path ?p from ?x = :Alice to ?y = :Eve {
   ?x :knows|^:knows ?y
}
```

This query would return:

```json
[
  {"p": [ {"x": ":Alice", "y": ":Bob"}, {"x": ":Bob", "y": ":David"}, {"x": ":David", "y": ":Eve"} ] }
]
```

But here the results don't show the direction of the relationship at each step. We can 
instead use a UNION to query both directions and use another variable to indicate direction: 
 
```sparql
path ?p from ?x = :Alice to ?y = :Eve {
   { ?x :knows ?y BIND(true as ?forward) }
   UNION
   { ?y :knows ?x BIND(false as ?forward) }
}
```

The results for the query is as follows:

```json
[
  {"p": [ {"x": ":Alice", "y": ":Bob", "forward": true}, 
          {"x": ":Bob", "y": ":David", "forward": true}, 
          {"x": ":David", "y": ":Eve", "forward": false} ] }
]
```

{{% figure src="https://i1.wp.com/www.classtools.net/blog/wp-content/uploads/2015/04/bacon.jpg?w=550" class="inliner" %}}

Using graph patterns can be very useful when there are no direct edges between the nodes. For example,
consider the [Six Degrees of Bacon](https://en.wikipedia.org/wiki/Six_Degrees_of_Kevin_Bacon) game
against the [DBpedia](http://dbpedia.org/) dataset. There are no direct links between actors/actresses
in the graph but there are movies in which they acted together. The path query for finding the path
between Keanu Reeves and Kevin Bacon is as follows:

```
PATH ?path FROM ?start = dbr:Keanu_Reeves TO ?end = dbr:Kevin_Bacon  {
     ?movie a dbo:Film ;
        dbp:starring ?start ;
        dbp:starring ?end .
}
ORDER BY length(?path)
LIMIT 1
```

The result for the query would look like this:

```
[
  {"path": [ {"movie": "dbr:The_Matrix", "start": "dbr:Keanu_Reeves", "end": "dbr:Laurence_Fishburne"},
             {"movie": "dbr:Mystic_River_(film)", "start": "dbr:Laurence_Fishburne", "end": "dbr:Kevin_Bacon"} ] }
]
```

Note that, in this query we used `ORDER BY length(?path)` to return the shortest paths first and `LIMIT 1`
will cause the query to return a single path. Recall that `length` function was defined as part of 
[extended solutions](https://blog.stardog.com/extending-the-solution/) and returns the number of elements 
in an array which is this case is the number of edges in a path.

If there are multiple paths with the same length then arbitrary
one would be returned. The path query specification does not say anything about how the functionality
will be implemented but Stardog implementation will be taking these modifiers into account to use the
most efficient path finding algorithm.

We can use a very similar query to compute the [Erdös_number](https://en.wikipedia.org/wiki/Erd%C5%91s_number)
of people using the [DBLP Bibliography Database](http://dblp.l3s.de/d2r/):
```sparql
SELECT (length(?path) AS ?erdosNumber) ?path {
PATH ?path FROM ?start = :Evren_Sirin TO ?end = :Paul_Erdos {
   ?article a foaf:Document ;
     	dc:creator ?start ;
     	dc:creator ?end
}
ORDER BY length(?path)
LIMIT 1
}
```

This query highlights the fact that just like other query types we can use path queries as subqueries.
In this example, we are using the outer SELECT expression to assigning the length of the path to the 
`erdosNumber` variable.

{{% figure src="https://imgs.xkcd.com/comics/paths.jpg" class="inliner" %}}

Shortest path problems sometimes involves assigning a weight to each edge and finding the path with
lowest total weight. For example, the following query is for finding the shortest route between two 
cities based on distance:

```sparql
PATH ?p FROM ?city1 TO ?city2 {
     ?r a :Road ;
        :startsAt ?city1 ;
        :endsAt ?city2 ;
        :distanceInMiles ?distance
}
ORDER BY sum(project(?p, ?distance)) 
LIMIT 1
```

The order condition first uses the `project` function which takes as input an array of solutions and
then projects the bindings of a given variable as an array. Then we apply the `sum` aggregation function 
to the array of values to compute the total distance.

{{% figure src="https://media.makeameme.org/created/the-possibilities-theyre.jpg" class="inliner" %}}

The possibilities with path queries are endless. We mention several more examples briefly to show
different uses of path queries..

Find cyclic dependencies in a graph:

```
SELECT ?cycle {
  PATH ?cycle FROM ?x TO ?y {
     ?x :dependsOn ?y
  }
  BIND (get(project(?cycle, ?x), 1) AS ?start)
  BIND (get(project(?cycle, ?y), length(?cycle)) AS ?end) 
  FILTER (?start = ?end)
}
```

Admittedly this query looks much more complex than the SPARQL query `?x :dependsOn+ ?x` which would
detect cyclic dependencies. However, the result for this SPARQL query only tells us that a cycle 
exists but does not show the nodes involved in the cycle.


Retrieve the [Concise-bounded description (CBD)](https://www.w3.org/Submission/CBD/)
of a specific `resource`:

```sparql
CONSTRUCT { ?s ?p ?o }
WHERE {
  PATH ?path FROM ?s = :resource TO ?o {
     ?s ?p ?o
     FILTER (isBlank(?s) || ?s = :resource)
  }
}
```

## Summary

We are actively working on the Pathfinder extension and will release this feature in Stardog
later this year. Let us know below if you have any feedback for this extension.



**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**

