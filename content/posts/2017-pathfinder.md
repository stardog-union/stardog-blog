+++
title = "A Path of Our Own: Extending SPARQL"
date = "2017-02-28"
author = "Evren Sirin"
categories = ["graph", "rdf", "knowledge graph"]
draft = false
discourseUsername = "evren"
+++

We're extending Stardog's knowledge graph capabilities to include arbitrary graph algorithms that aren't easily expressed in SPARQL or in some cases aren't possible in SPARQL at all. But first we have to fix SPARQL solutions.<!--more-->

## Introduction

RDF provides a flexible graph data model, but when we query RDF graphs with SPARQL we get a table (`SELECT`-queries) or a graph with a fixed template (`CONSTRUCT`-queries). There's no easy way to query a *subgraph*. The table representation is often the exactly perfect thing, but in other cases its limitations hurt the usability of query results. As a result sometimes we need to write multiple queries to get results or spend more effort post-processing query results. The limitation can even cause us to write more complicated queries than necessary. We need more flexible query results to support use cases where tabular results are not the right thing: for example, arbitrary path-based queries that return a subgraph.

{{% figure link="http://metmuseum.org/art/collection/search/438821" src="/img/p1.jpg" class="inliner" %}}


## Requirements

A SPARQL solution is a mapping from variable names to RDF terms. We are extending it such that variables can be mapped to an RDF term, an array of values, or a solution. So the function requirements for this extension are to

* allow a solution to map a variable to an array of values
* allow a solution to map a variable to another solution
* define how these kind of solutions would be generated in queries
* not perturb existing SPARQL queries
* map extended solutions to JSON objects.

## Solution Definition

Extended solutions require changes to the semantic of SPARQL which are described next. We will reuse the definitions of RDF term and solution sequence unchanged. We will update solution mappings (definition of which in the [SPARQL spec](https://www.w3.org/TR/sparql11-query/#sparqlSolutions)) to be recursive. Now, informally, this definition should look like the following:

```
Solution := { (V -> Value)* }    // solution is a mapping from variables to values (same as in SPARQL)
Value := RDF-Term                // an RDF term is a value (same as in SPARQL)
Value := Solution                // a solution is a value (new definition)
Value := [ Value* ]              // an array of values is a value (new definition)
```

This definition almost exactly matches how JSON objects are defined. We also have to extend the compatibility of solution definition to include the compatibility of values:

1. An RDF term is compatible with itself
1. Two arrays α1 and α2 are compatible if |α1| = |α2| and for every non-negative i < |α1| α1(i) and α2(i) are compatible
1. Two solution mappings μ1 and μ2 are compatible if---for every variable v in dom(μ1) and in dom(μ2)---μ1(v) and μ2(v) are compatible values

## Extended Solution Generation

Internally, regular SPARQL operations will still generate regular solutions, but there will be new query operators that will generate extended solutions.

### `ARRAY` aggregate function

This is like the `GROUP_CONCAT` aggregate function *done right*. It outputs an array of values instead of a concatenated string, which is just horrifying to be honest!

Let's consider some examples.

Get all the labels for a person:

```sparql
SELECT ?person (array(?name) AS ?names) {
  ?person rdfs:label ?name
}
GROUP BY ?person
```

Which returns

```sql
?person     ?names
--------------------------------------------
:John       ["John", "JohnDoe", "Doe, John"]
```

We can add an `ORDER BY`-clause to this example to sort the labels with a preferred language order and then retrieve the first element from each array.

### `BIND SELECT` Results

We can now allow SELECT queries to be bound to a variable. This allows retrieving complex objects in query results without spreading them over multiple rows.

Get the information about a purchase order and all the items in that order:

```sparql
SELECT * {
  ?order a :PurchaseOrder ;
  		dc:date ?date
  BIND ({ SELECT * {
           ?o :hasItem :item .
           ?item :product ?product ;
                 :quantity ?quantity
        }} AS ?item)
  // not ideal but we need a way to join these two patterns
  FILTER(get(?item, "o") = ?order)     
}
```

{{% figure link="http://metmuseum.org/art/collection/search/39353" src="/img/p2.jpg" class="inliner" %}}

Which returns

```sql
?order     ?date       ?items
--------------------------------------------------------
:OrderABC  2016-01-01  ?order     ?product     ?quantity
                       ---------------------------------
                       :OrderABC  :Product?X   1
                       :OrderABC  :Product?Y   3

:OrderDEF  2016-01-02  ?order     ?product     ?quantity
                       ---------------------------------
                       :OrderDEF  :Product?Z   2
```

### Path queries

The preceding examples are a nice improvement over bog standard SPARQL, but we're most interested in *path queries*. With our extended solutions, we can represent a path simply as a list of solutions. This list of solutions will be bound to the path variable in the query.

Consider a social network example. Let's find all the friends of friends of Alice:

```
select * {
  path ?p from ?x=:alice to ?y {
     ?x :knows ?y
  }
}
```

Which returns

```sql
p
----------------------------
[{?x -> :alice, ?y -> :bob}]

[{?x -> :alice, ?y -> :bob},
 {?x -> :bob, ?y -> :bob}]

[{?x -> :alice, ?y -> :bob},
 {?x -> :bob, ?y -> :david}]
```

@@TODO another example would be nice

### Implementation Details

Let's consider some issues around implementation. Internally we'll continue to store solutions as a mapping from integer variables to long values. We will adjust the `ValueInliner` to store arrays and solutions in newly designed memory blocks and inline the address into a long value. This will require making inliners stateful and specific to a query evaluation so that the memory can be released after query execution.

{{% figure link="http://metmuseum.org/art/collection/search/53176" src="/img/p3.jpg" class="inliner" %}}

Extending solutions in this way will also require changes to the API for the representation of query results. This might result in a backward-incompatible API change. We will open source our result parsers to make it easier for people to use Stardog.

## Finding Our Own Path

So far we've been looking at the tail instead of looking at the dog. The point of extending solutions is to enable *path finding queries* as we briefly mentioned above. SPARQL provides recursive property paths as a way to find (possibly complex) paths between two nodes in a graph, but property paths don't allow retrieval of the nodes in these paths. Frankly, that's a pretty dumb restriction. There is no easy way to retrieve this information other than implementing the path finding algorithm outside SPARQL, which sucks.

Stardog users need easy way to express a path finding query inside SPARQL, which should allow finding **and retrieving** paths of arbitrary complexity; e.g. a graph pattern might be used to define what an edge is. It should also be possible to find weighted shortest paths using this extension. We codenamed it **Pathfinder**.

The requirements of Pathfinder are something like this:

* Embedded in SPARQL with a nice syntax 
* Find all-pair or single-pair paths
* Custom graph patterns to define what constitutes a path
* Ability to define weight for each edge
* Pay-as-you-go complexity

This feature only requires updates to the SPARQL parser and internals of query execution. There are two important points in the design:

1. SPARQL syntax
2. Structure of the results

It is necessary that path finding should not be just over the edges in the graph but over arbitrary basic graph patterns, too. 

This means an edge in the resulting path is a solution; i.e. a mapping from variables to RDF terms. A path is defined as a sequence of solutions. Since SPARQL results are a sequence of solutions, we'll have to flatten the path information. This will require us to coin an identifier for each path and use an index for each edge in each path.

{{% figure link="http://metmuseum.org/art/collection/search/483130" src="/img/p4.jpg" class="inliner" %}}

### Syntax and Semantics

Our candidate syntax for Pathfinder queries can be used inside any SPARL query:

```
PATH [?p] FROM ?x[=startNode] TO ?y[=endNode] 
          [INDEX ?i] 
          [WEIGHT ?w] 
          [LENGTH ?l] 
          [LIMIT ?l] {
   GRAPH PATTERN
}
```

Regardless of the labels used in the query, the variables in a path expression are referred to as follows: path variable `?p`, start variable `?x`, end variable `?y`, index variable `?i`, weight variable `?w`, length variable `?l`, limit variable `?l`. The start variable, the end variable, and the weight variable should all exist in the graph pattern but none of the other variables should.

### Design and Implementation Constraints

1. A solution satisfying the graph pattern in the path expression constititutes an **edge**.
1. The binding of the start variable in the solution is the **start** node of the edge.
1. The binding of the end variable in the solution is the **end** node of the edge.
1. Two edges form a **path** if the start of an edge is the same as the end of the other edge.
1. Each solution to the graph pattern corresponds to an edge in the path. The returned solution will have additional bindings for other variables if they have been used.
1. All paths are returned by default with the shortest path **first**.
1. The length variable in a solution will be the length of the edges in the corresponding path. The length of the path is defined as the **sum of the weights of all edges in the path**.
1. The weight of an edge is `1` by default. If the weight variable is used, then the weight of an edge is the binding of the weight variable in that solution. It is an error if the weight variable is not bound to a positive integer.
1. If the start variable is fixed with the expression `FROM ?x=startNode`, then the binding of the start variable in the **first** edge of every path will be that node.
1. If the end variable is fixed with the expression `TO ?y=endNode`, then the binding of the end variable in the **last** edge of every path will that node.
1. If the limit variable is defined, then the number of paths returned will be less than or equal to that number. If no limit is defined, then **all** the paths are returned.

### Examples

Consider the following example data about friends:

```
:alice :knows :bob .
:bob :knows :charlie .
:bob :knows :david .
:eve knows :david.
```

Find all the friends of friends of Alice:

@@TODO can the start and end node variables be optional if you don't need them? Or do you always need at least one of them?

```sparql
select ?p ?y ?i {
  path ?p from ?x=:alice to ?y index ?i {
     ?x :knows ?y
  }
}
```
Which returns

```sql
p       i  y
====================
:uuid1  1  :bob
:uuid2  1  :bob
:uuid2  2  :charlie
:uuid3  1  :bob
:uuid3  2  :david

```

Find a path of friends from Alice to David:

```sparql
select ?i ?y {
  path from ?x=:alice to ?y=:david index ?i limit 1 {
     ?x :knows ?y
  }
}
```

Which returns

```
i  y
===========
1  :bob
2  :david
```

Find an undirected path of friends from Alice to Eve:

```sparql`
select ?i ?y {
  path from ?x=:alice to ?y=:eve index ?i limit 1 {
     ?x :knows|^:knows ?y
  }
}
```

Which returns

```
i  y
============
1  :bob
2  :david
3  :eve
```

Find an undirected path of friends from Alice to Eve and include edge direction:

```
select ?i ?y {
  path from ?x=:alice to ?y=:eve index ?i limit 1 {
     { ?x :knows ?y BIND(true as ?forward) }
     UNION
     { ?y :knows ?x BIND(false as ?forward) }
  }
}

i  y       forward
====================
1  :bob    true
2  :david  true
3  :eve    false
```

@@todo maybe delete this one?
Return the elements of an rdf:List along with their index:

```sparql
select ?element ?i {
  ?x a rdf:List .
  path from ?x to ?y=rdf:nil index ?i {
     ?x rdf:first ?element ;
        rdf:rest ?y
  }
}
```

Find the shortest path of movies between Johhny Depp and Kevin Bacon:

```sparql
select ?movie ?start ?end {
  path from ?start=:JohhnyDepp to ?end=:KevinBacon index ?i limit 1 {
     ?movie a :Movie .
     ?start ?role1 ?movie .
     ?end ?role2 ?movie .
  }
}
```

Calculate my Erdoes number:

```sparql
SELECT DISTINCT ?erdoesNumber {
  PATH FROM ?start=:Evren_Sirin TO ?end=:Paul_Erdoes LIMIT 1 LENGTH ?erdoesNumber {
     ?article a :Article ;
     	dc:creator ?start ;
     	dc:creator ?end
  }
}
```

[Concise-bounded description (CBD)](https://www.w3.org/Submission/CBD/):

```sparql
CONSTRUCT { ?s ?p ?o }
WHERE {
  PATH FROM ?s=:node TO ?o {
     ?s ?p ?o
     FILTER (isBlank(?s) || ?s=:node)
  }
}
```

Shortest route between two cities based on distance:

```sparql
SELECT {
  PATH FROM ?c1=:startCity TO ?c2=:endCity WEIGHT ?distance {
     ?r a :Road ;
        :startsAt ?c1 ;
        :endsAt ?c2 ;
        :distanceInMiles ?distance
  }
}
```

## Issues

Having path edges spread across multiple solutions makes it impossible to define filter conditions over a path. Suppose you'd like to find the least common ancestor (LCA) of two nodes in a graph along with the path from each node to the LCA. An attempt would be like this:

```
SELECT {
  PATH FROM ?x=:node1 TO ?ancestor {
  	?ancestor :ancestorOf ?x
  }
  PATH FROM ?y=:node2 TO ?ancestor {
  	?ancestor :ancestorOf ?y
  }
}
```

This would return the LCA but all the intermediate nodes in the paths would be filtered out since the `?ancestor` binding would not join.

Another example that doesn't work is something like finding flights between two cities. We can find the flights between two cities and even optimize the path based on time or cost, but a valid path should also take the flight arrival and departure times into account as well. We cannot enforce such constraints with the proposed approach even as a post-processing step since each edge in a path is returned in a separate solution.

Returning all the information about a path in a single solution with the help of arrays and nested solutions would help with these problem. But that requires significant changes to query evaluation. Another possibility is to auto-generate variables that encode index of an edge in its name such that all the edges in a path can be put into a single solution. With this approach the query 2 example from above would look like this:

```
select * {
  path from ?x=:alice to ?y length ?length {
     ?x :knows ?y
  }
}
```

```
x.1     y.1   x.2   y.2      length
===================================
:alice  :bob                  1
:alice  :bob  :bob  :charlie  2
:alice  :bob  :bob  :david    2

```

This keeps the solutions as-is but requires the number of variables in a solution to be dynamic. We would need a way in SPARQL to test the values of such variables; e.g. to retrieve the starting node for the last edge use `array(?x, ?length)`.

### Implementation Details

It is relatively easy to update our property path implementations to track the additional solution bindings. We would need to enhance them to take the length of paths into account. The challenge is we already have 5 different operators for property paths. We don't want to track additional information if the query contains just regular property paths but we do not want to have 10 different operators either.

