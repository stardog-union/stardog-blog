+++
title = "Extending the Solution"
date = "2017-02-28"
author = "Evren Sirin"
categories = ["graph", "rdf", "knowledge graph"]
draft = false
discourseUsername = "evren"
+++

We're extending Stardog's knowledge graph capabilities to include arbitrary
graph algorithms that aren't easily expressed in SPARQL or in some cases aren't
possible in SPARQL at all. But first we have to fix SPARQL solutions.<!--more-->

## Introduction

RDF provides a flexible graph data model, but when we query RDF graphs with
SPARQL we get a table (`SELECT`-queries) or a graph with a fixed template
(`CONSTRUCT`-queries). There's no easy way to query a *subgraph*. The table
representation is often the exactly perfect thing, but in other cases its
limitations hurt the usability of query results. As a result sometimes we need
to write multiple queries to get results or spend more effort post-processing
query results. The limitation can even cause us to write more complicated
queries than necessary. We need more flexible query results to support use cases
where tabular results are not the right thing: for example, arbitrary path-based
queries that return a subgraph.

{{% figure link="http://metmuseum.org/art/collection/search/438821" src="/img/p1.jpg" class="inliner" %}}


## Requirements

A SPARQL solution is a mapping from variable names to RDF terms. We are
extending it such that variables can be mapped to an RDF term, an array of
values, or a solution. So the function requirements for this extension are to

* allow a solution to map a variable to an array of values
* allow a solution to map a variable to another solution
* define how these kind of solutions would be generated in queries
* not perturb existing SPARQL queries
* map extended solutions to JSON objects.

## Solution Definition

Extended solutions require changes to the semantic of SPARQL which are described
next. We will reuse the definitions of RDF term and solution sequence unchanged.
We will update solution mappings (definition of which in
the [SPARQL spec](https://www.w3.org/TR/sparql11-query/#sparqlSolutions)) to be
recursive. Now, informally, this definition should look like the following:

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

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
