+++
title = "Extending the Solution"
date = "2017-02-21"
author = "Evren Sirin"
categories = ["graph", "rdf", "knowledge graph"]
draft = false 
discourseUsername = "evren"
+++

We're extending Stardog's knowledge graph capabilities to include arbitrary
graph algorithms that aren't easily expressed in SPARQL. But first we have to
fix SPARQL solutions.<!--more-->

## Background

RDF is a flexible graph data model: entities are represented by nodes in the
graph, and entity properties and relationships between entities are represented
as edges. Unlike relational databases where the data needs to conform to a
predefined tabular structure, the graph model can represent heterogenous data
easily.

However, when we query RDF graphs with SPARQL we get the results either as a
table (`SELECT`-queries) or as a graph with a fixed template
(`CONSTRUCT`-queries). There's no easy way to query a *subgraph*. The table
representation can be the exactly perfect thing, but in other cases its
limitations hurt the usability of query results. As a result sometimes we need
to write multiple queries to get results or spend more effort post-processing
query results. The limitation can even mean writing more complicated queries
than necessary.

### Finding Paths

These limitations are most obvious in the case of a basic task for graphs:
finding paths between node. SPARQL
provides [property paths](https://www.w3.org/TR/sparql11-query/#propertypaths)
so one can write queries that recursively traverse the RDF graph and find two
nodes connected via a complex path of edges. But since the results need to be
turned into a tabular format, the result of property path queries return only the
start and end nodes of a path, not the intermediate nodes. In order to find
intermediate nodes and edges additional and/or more complex queries are needed.

We need more flexible query results to support use cases where tabular results
are not the right thing. This is exactly what we are working on right now to
make future versions of Stardog go beyond tabular results for graph queries. We
will next describe how we are extending the SPARQL to make this possible.

{{% figure link="http://metmuseum.org/art/collection/search/438821" src="/img/p1.jpg" class="inliner" %}}

## Beyond Tables

SPARQL **query results** are defined as a list of solutions where
a [solution](https://www.w3.org/TR/sparql11-query/#sparqlSolutions) is a mapping
from variable names to RDF terms. In this definition, variable names represent
columns of a table and each solution corresponds to a row in the table. For
example, consider a database that contains information about people, their birth
dates and children. The following query returns the birth date of people along
with their children:

```sparql
SELECT ?person ?name ?date {
  ?person :birthDate ?date ;
          :child ?child
}
```

Stardog displays the results of this query in a tabular format like this:

```sql
?person | ?date      | ?child
-----------------------------------
:John   | 1974-02-17 | :Alice
:John   | 1974-02-17 | :Bob
:John   | 1974-02-17 | :Charlie
:Jane   | 1963-11-03 | :David
:Jane   | 1963-11-03 | :Eve
```

In these results the names of a single person is spread over multiple rows.

To go beyond tabular results we first need to change the definition of a
solution such that a variable can be mapped to an array of values or to another
another solution. This means the definition
of [SPARQL solutions](https://www.w3.org/TR/sparql11-query/#sparqlSolutions) has
to be recursive. Informally, such a definition would look like this:

```
(1) Solution := { (V -> Value)* }    // solution: mapping from variables to values (unchanged)
(2) Value := RDF-Term                // an RDF term is a value (unchanged)
(3) Value := Solution                // a solution is a value (extended definition)
(4) Value := [ Value* ]              // an array of values is a value (extended definition)
```

This definition almost exactly matches how JSON objects are defined. A JSON
object is a collection of name-value pairs (see 1) where values can be atomic
(see 2), an object (see 3) or an array of values (see 4).

## Extending SPARQL Operators

We also need new operators in SPARQL that will generate these extended
solutions. We will not perturb existing SPARQL queries. If a query does not use
such operators then the results will be same as in original SPARQL definitions.

### `ARRAY` of Values

This is
the
[`GROUP_CONCAT` aggregate function](https://www.w3.org/TR/sparql11-query/#aggregates) *done
right*. It outputs an array of values instead of a concatenated string, which is
just horrifying to be honest!

Let's consider the previous example of retrieving names. We can rewrite that
query to group results by each person and output names as an array of solutions:

```sparql
SELECT ?person (sample(?date) as ?bdate) (array(?child) AS ?children) {
  ?person :birthDate ?date ;
          :child ?child 
}
GROUP BY ?person
```

The result would look like this:

```sql
?person | ?bdate      | ?names
---------------------------------------------
:John   | 1974-02-17 | [:Alice, :Bob, :Charlie]
:Jane   | 1963-11-03 | [:David, :Eve]
```

In textual format, these results don't look much different than what
`GROUP_CONCAT` would produce. However, there is a big difference because now we
have a structured array as the value of `?names`. This means we can define
functions that would operate over arrays: 

* `length(array)`: returns the number of elements in an array
* `get(array, index)`: returns the element at the specified index in an array
* `contains(array, values)`: returns true if the specified element exists in an array

Suppose we want to write a query that will return the eldest child for each
person. Even though this sounds like an easy query it is not possible to use a
combination of `GROUP BY`, `ORDER BY` and `LIMIT` to write this query. `LIMIT`
defines a global limit over all solutions whereas here we want to limit the
solutions for each group separately. But with arrays and functions that operate
over arrays this query is simple. We can first order children by their birth
date, group children by parent, and retrieve only the first child from the array
of ordered children:

```sparql
SELECT ?person (get(array(?child), 1) AS ?eldestChild)
{{ 
    SELECT * {
      ?person :hasChild ?child .
      ?child :birthDate ?date 
    }
    ORDER BY ?date
}}
GROUP BY ?person
```

### From Solutions to Objects

We have seen that the `array` aggregate function can collect the bindings of a
variable from a sequence of solutions and turn that into an array. We can also
use this function to create an array of objects. This can be achieved by
specifying multiple variables as input to the `array` function.

For example, consider we want to retrieve not only the children of a person but
the birth dates of those children as well:

```sparql
SELECT * {
   ?person :date ?bdate .
   { SELECT ?person (array(?child, ?date) AS ?children) {
       ?person :hasChild ?child .
       ?child :birthDate ?date 
     }
     GROUP BY ?person
   }
}
```

The `array(?child, ?date)` aggregate function constructs an object with two
properties (`child` and `date`) from each row of the solutions and collects all
those objects into an array that will be assigned to `children` variable. It is
not easy to represent these results in a tabular format so instead we illustrate
how these results would look in a simplified JSON results format:

```json
[
  {"person": ":John" ,
   "date": "1974-02-17" ,
   "children": [
        {"child": ":Alice", date: "1995-05-02"},
        {"child": ":Bob", date: "1999-09-22"},
        {"child": ":Charlie", date: "1999-09-22"}
   ]
  },     
  {"person": ":Jane" ,
   "bdate": "1963-11-03" ,
   "children": [
        {"child": ":David", date: "1992-08-12"},
        {"child": ":Eve", date: "1996-06-02"}
   ]
  }
]
```

Note that, as in
regular
[SPARQL JSON results format](https://www.w3.org/TR/sparql11-results-json/) each
key represents a variable from the query, but now we have arrays and nested
objects in the results.

## Paths of Glory

We started this blog post by mentioning path finding in graphs. We will talk
about path finding in more depth in my next blog post, but we will now briefly
mention how extended solutions relate to path finding. 

Suppose we are trying to find paths between people in our example graph using
child relationships. The following query uses regular SPARQL property paths to
check if Alice has a famous historical person as an ancestor:

```sparql
SELECT * {
   :FamousHistoricalPerson :child+ :Alice
}
```

But, as we mentioned before, property path queries do not return intermediate
nodes so you would need additional queries to find the people on the ancestral
path. SPARQL property
paths [may be (ab)used](http://stackoverflow.com/a/18032019) for this purpose,
but those workarounds fail when there are multiple paths between nodes and they
are inherently inefficient.

Extended solutions provide an easy way to represent the results of path finding
queries. Each edge of the path can be represented as an object and the path
itself can be represented as an array of such objects. In our simplified JSON
format, such paths would be represented as follows:

```
   "path": [
        {"parent": ":FamousHistoricalPerson", child: ":NotSoFamousPerson"},
        ... 
        {"parent": ":John", child: "Alice"}
   ]
```

Of course, we still need a special query construct that will produce paths
between nodes. We will talk about such path finding extensions in my next blog
post. Stay tuned.

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
