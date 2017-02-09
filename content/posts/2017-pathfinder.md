+++
title = "A Path of Our Own: Extending SPARQL with Graph Paths"
date = "2017-02-29"
author = "Evren Sirin"
categories = ["graph", "rdf", "knowledge graph"]
draft = false
discourseUsername = "evren"
+++

Stardog's knowledge graph capabilities 

## Introduction

RDF provides a flexible graph data model, but when we query this graph model with SPARQL the results we get is either a table (SELECT queries) or a graph with a fixed template (CONSTRUCT queries). We know that table representation has limitations and this hurts the usability of query results. As a result users need to write multiple queries to get results or spend more effort post processing query results. This limitation might also cause people to write more complicated queries than necessary. We need more flexible query results to support use cases where tabular results are not enough as in the case of Pathfinder feature (STEP 5).

# Requirements

A SPARQL solution is defined to be a mapping from variable names to RDF terms. We should extend this definition so variables can be mapped to a value where value is either an RDF term, array of values, or a solution.

## Functional Requirements

* Allow a solution to map a variable to an array of values
* Allow a solution to map a variable to another solution
* Define ways how these kind of solutions would be generated in queries
* Regular SPARQL queries should not be affected

## Non-functional Requirements

* Mapping extended solutions to JSON objects should be possible

## User Interfaces

We would need to update the CLI query outputs and the webconsole to display extended solutions.

## Required Integrations

None.

# Feature Design

## Solution Definition

Extended solutions require changes to the semantic of SPARQL which are described in this section.
We will reuse the definitions of RDF term and solution sequence unchanged. We will update the definition of solution mapping found in the [Section 18.1.8](https://www.w3.org/TR/sparql11-query/#sparqlSolutions) to be recursive. Informally, this definition should look like this

```
Solution := { (V -> Value)* }    // solution is a mapping from variables to values (same as in SPARQL)
Value := RDF-Term                // an RDF term is a value (same as in SPARQL)
Value := Solution                // a solution is a value (new definition)
Value := [ Value* ]              // an array of values is a value (new definition)
```

Note that this definition of solutions almost exactly matches how JSON objects are defined.

We extend the compatibility of solution definition to include the compatibility of values:

1. An RDF term is compatible with itself
2. Two arrays α1 and α2 are compatible if |α1| = |α2| and for every non-negative i < |α1| α1(i) and α2(i) are compatible
3. Two solution mappings μ1 and μ2 are compatible if, for every variable v in dom(μ1) and in dom(μ2), μ1(v) and μ2(v) are compatible values


## Extended Solution Generation

Regular SPARQL operations will still generate regular solutions. There will be new operators that will generate extended solutions.

### ARRAY aggregate function

This is like GROUP_CONCAT aggregate function but done right. It outputs an array of values instead of a concatenated string.



**Example 1** Get all the labels for a person in the same row

```
SELECT ?person (array(?name) AS ?names) {
  ?person rdfs:label ?name
}
GROUP BY ?person

?person     ?names
--------------------------------------------
:John       ["John", "JohnDoe", "Doe, John"]
```

We can add an ORDER BY clause to this example to sort the labels with a preferred language order and then retrieve the first element from each array.


### BINDing SELECT results

We can now allow SELECT queries to be bound to a variable. This allows retrieving complex objects in query results without spreading them over multiple rows.


**Example 2** Get the information about a purchase order and all the items in that order:

```
SELECT * {
  ?order a :PurchaseOrder ;
  		dc:date ?date
  BIND ({ SELECT * {
           ?o :hasItem :item .
           ?item :product ?product ;
                 :quantity ?quantity
        }} AS ?item)
  FILTER(get(?item, "o") = ?order)     // not ideal but we need a way to join these two patterns
}


?order     ?date       ?items
-------------------------------------------------------------------------------------
:OrderABC  2016-01-01  [{?order -> :OrderABC, ?product -> :Product?X, ?quantity -> 1},
                        {?order -> :OrderABC, ?product -> :Product?Y, ?quantity -> 3}]
:OrderDEF  2016-01-02  [{?order -> :OrderDEF, ?product -> :Product?Z, ?quantity -> 2}]
```

The syntax for CLI output is for illustration purposes only. We can use a different serialization like nested tables instead:


```
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

Extended solutions would be most useful for path queries that are explained in STEP 5: Pathfinder. With extended solutions, we can represent a path simply as a list of solutions. This list of solutions will be bound to the path variable in the query.

**Example 3** Find all the friends of friends of Alice:

```
select * {
  path ?p from ?x=:alice to ?y {
     ?x :knows ?y
  }
}

p
----------------------------
[{?x -> :alice, ?y -> :bob}]

[{?x -> :alice, ?y -> :bob},
 {?x -> :bob, ?y -> :bob}]

[{?x -> :alice, ?y -> :bob},
 {?x -> :bob, ?y -> :david}]
```

## Functions for extended solutions

We need some additional functions that will operate over extended functions:

* isTerm(Value), isArray(Value), isSolution(Value)
* length(Array), get(Array, Number), contains(Array, Value)
* length(Solution), get(Solution, String)


## User Interfaces

We need a serialization format for extended solutions in the CLI as discussed above. Query results in the webconsole should be updated similarly.


## Implementation Details


### Solution representation

Internally we'll continue to store solutions as a mapping from integer variables to long values. We will adjust the `ValueInliner` to store arrays and solutions in newly designed memory blocks and inline the address into a long value. This will require making inliners stateful and specific to a query evaluation so the memory can be released after query execution.

TBD.

## Compatibility Issues

This will require changes to the API for the representation of query results. This might result in a backward-incompatible API change. Outside Stardog, none of the standard SPARQL result parsers would be able to parse extended solutions so we might need to provide open-source implementation of result parsing to make it easier for people to use these in their applications.

# Pathfinder
# Introduction/Motivation

SPARQL provides recursive property paths as a way to find (possibly complex) paths between two nodes in a graph; but this does not allow retrieval of the nodes in these paths. There is no easy way to retrieve this information other than implementing the path finding algorithm outside SPARQL, which is not efficient.

# Requirements

We should have an easy way to express a path finding query inside SPARQL. This should allow finding paths of arbitrary complexity; e.g. a graph pattern might be used to define what an edge is. It should also be possible to find weighted shortest paths using this feature.

## Functional Requirements

* SPARQL extension
* Find all-pair or single-pair paths
* Custom graph patterns to define what constitutes a path
* Option to define weight for each edge

## Non-functional Requirements

* Simple and intuitive syntax
* Pay-as-you-go complexity

## User Interfaces

None required.

## Required Integrations

Update to webconsole query view to support the new syntax.

# Feature Design

This feature only requires updates to the SPARQL parser and internals of query execution. There are two important points in the design:

1. SPARQL syntax
2. Structure of the results

It is necessary that path finding should not be just over the edges in the graph but over arbitrary BGPs. This means an edge in the resulting path is a solution; i.e. a mapping from variables to RDF terms. A path is defined as a sequence of solutions. Since SPARQL results are a sequence of solutions we'll have to flatten the path information. This will require us to coin an identifier for each path and use an index for each edge in each path. (We should have another STEP for extending the definition of solutions in SPARQL to include arrays.)

## Syntax and Semantics

The proposed syntax for the path extension is intended to be used inside any SPARL query and looks like this:

```
PATH [?p] FROM ?x[=startNode] TO ?y[=endNode] [INDEX ?i] [WEIGHT ?w] [LENGTH ?l] [LIMIT ?l] {
   GRAPH PATTERN
}
```

The exact name of the variables used in a query may be different. Regardless of the labels used in the query, the variables in a path expression are referred to as follows: path variable `?p`, start variable `?x`, end variable `?y`, index variable `?i`, weight variable `?w`, length variable `?l`, limit variable `?l`. The start variable, the end variable, and the weight variable should all exist in the graph pattern but none of the other variables should.

* A solution satisfying the graph pattern in the path expression constititutes an edge
* The binding of the start variable in the solution is the start node of the edge
* The binding of the end variable in the solution is the end node of the edge
* Two edges form a path if the start of an edge is same as the end of the other edge
* Each solution to the graph pattern corresponds to an edge in the path. The returned solution will have additional bindings for other variables if they have been used.
* All paths are returned by default with the shortest path first
* The length variable in a solution will be the length of the edges in the corresponding path. The length of the path is defined as the sum of the weights of all edges in the path.
* The weight of an edge is `1` by default. If the weight variable is used than the weight of an edge is the binding of the weight variable in that solution. It is an error if the weight variable is not bound to a positive integer.
* If the start variable is fixed with the expression `FROM ?x=startNode` then the binding of the start variable in the first edge of every path will be that node.
* If the end variable is fixed with the expression `TO ?y=endNode` then the binding of the end variable in the last edge of every path will that node.
* If the limit variable is defined then the number of paths returned will be less than or equal to that number. If no limit is defined then all the paths are returned.

## Examples

Consider the following example data about friends:

```
:alice :knows :bob .
:bob :knows :charlie .
:bob :knows :david .
:eve knows :david.
```

**Query 1:** Find all the friends of friends of Alice:

```
select ?p ?y ?i {
  path ?p from ?x=:alice to ?y index ?i {
     ?x :knows ?y
  }
}

p       i  y
====================
:uuid1  1  :bob
:uuid2  1  :bob
:uuid2  2  :charlie
:uuid3  1  :bob
:uuid3  2  :david

```

**Query 2:** Find one path of friends from Alice to David:

```
select ?i ?y {
  path from ?x=:alice to ?y=:david index ?i limit 1 {
     ?x :knows ?y
  }
}

i  y
===========
1  :bob
2  :david

```

**Query 3:** Find undirected path of friends from Alice to Eve:

```
select ?i ?y {
  path from ?x=:alice to ?y=:eve index ?i limit 1 {
     ?x :knows|^:knows ?y
  }
}

i  y
============
1  :bob
2  :david
3  :eve
```


**Query 4:** Find undirected path of friends from Alice to Eve ubt include edge direction:

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


**Query 5:** Return the elements of an rdf:List along with their index:

```
select ?element ?i {
  ?x a rdf:List .
  path from ?x to ?y=rdf:nil index ?i {
     ?x rdf:first ?element ;
        rdf:rest ?y
  }
}

```

**Query 6:** Find the shortest path of movies between Johhny Depp and Kevin Bacon:

```
select ?movie ?start ?end {
  path from ?start=:JohhnyDepp to ?end=:KevinBacon index ?i limit 1 {
     ?movie a :Movie .
     ?start ?role1 ?movie .
     ?end ?role2 ?movie .
  }
}

```

**Query 7:** Calculate Erdoes number:

```
SELECT DISTINCT ?erdoesNumber {
  PATH FROM ?start=:Evren_Sirin TO ?end=:Paul_Erdoes LIMIT 1 LENGTH ?erdoesNumber {
     ?article a :Article ;
     	dc:creator ?start ;
     	dc:creator ?end
  }
}


```

**Query 8:** [Concise-bounded description (CBD)](https://www.w3.org/Submission/CBD/):

```
CONSTRUCT { ?s ?p ?o }
WHERE {
  PATH FROM ?s=:node TO ?o {
     ?s ?p ?o
     FILTER (isBlank(?s) || ?s=:node)
  }
}

```

**Query 9:** Shortest route between two cities based on distance:

```
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

Having path edges spread across multiple solutions make it impossible to define filter conditions over a path.

Suppose you'd like to find the least common ancestor (LCA) of two nodes in a graph along with the path from each node to the LCA. An attempt would be like this:


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

Another example that doesn't work is something like finding flights between two cities (not that we'd want to do that with Stardog but example illustrates the problem). We can find the flights between two cities and even optimize the path based on time or cost but a valid path should also take the flight arrival and departure times into account as well. We cannot enforce such constraints with the proposed approach even as a post-processing step since each edge in a path is returned in a separate solution.

Returning all the information about a path in a single solution with the help of arrays and nested solutions would help with these problem. But that requires significant changes to query evaluation. Another possibility is to auto-generate variables that encode index of an edge in its name such that all the edges in a path can be put into a single solution. With this approach the query 2 example from above would look like this:

```
select * {
  path from ?x=:alice to ?y length ?length {
     ?x :knows ?y
  }
}

x.1     y.1   x.2   y.2      length
===================================
:alice  :bob                  1
:alice  :bob  :bob  :charlie  2
:alice  :bob  :bob  :david    2

```

This keeps the solutions as-is but requires the number of variables in a solution to be dynamic. We would need a way in SPARQL to test the values of such variables; e.g. to retrieve the starting node for the last edge use `array(?x, ?length)`.

## User Interfaces

None required. (Trivial but Web Console SPARQL highlighter would work out of box?)

## Implementation Details

It is relatively easy to update our property path implementations to track the additional solution bindings. We would need to enhance them to take the length of paths into account. The challenge is we already have 5 different operators for property paths. We don't want to track additional information if the query contains just regular property paths but we do not want to have 10 different operators either.

