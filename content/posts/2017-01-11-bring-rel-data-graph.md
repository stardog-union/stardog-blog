+++
title = "Bringing Relational Data into the Graph"
date = "2017-01-11"
categories = ["R2RML", "virtual graphs", "relational databases"]
author = "Jess Balint"
+++

Here at Stardog we believe in what we're doing. We believe that the
graph data model is essential for data unification due to it's
flexibility while retaining rich semantic modeling capabilities. We
believe that declarative reasoning is am important addition due to
it's unique ability to map data and retain consistency. When applied
to relational data sources, Stardog facilitates powerful query and
integration features. This blog post introduces Stardog's _virtual
graph_ feature and explores how to access data from existing
relational databases.<!--more-->

## Mapping and R2RML

Traditional data integration tools are based on the relational data
model and employ vendor-specific mapping languages and methods. The
difficulty arises when combining several sources which were modeled
differently and conform to independent sets of rules and
constraints. First, a single shared data model must be build
representing a global view over the sources. Additionally, a
significant amount of manipulation and cleansing is required to
transform between the source and target schema as well as make the
source data conform to a set of standardized rules.

Stardog adopts the
standardized [W3C R2RML](https://www.w3.org/TR/r2rml/) mapping
language for defining how data in a relational system maps to RDF
triples in the graph. In addition, we've created
the
[Stardog Mapping Syntax](http://docs.stardog.com/#_stardog_mapping_syntax) to
simplify the process of writing these mappings. Mappings of this sort
specify the relationship between source data, i.e. relational data in
the form of a table or SQL query, to target data, a set of RDF
triples. Once the mapping is created, Stardog's virtual graph feature
supports both federation (live query) and materialization (extraction)
methods to access the relational data.

### R2RML Example

Let's take a look at some examples of mappings and how they can be
used in Stardog. We'll first build a mapping and create a virtual
graph in Stardog. Following that, we'll show how it can be used for
both federated queries and materialization.

We'll use the good old relational example tables `EMP` and `DEPT` as
given
[here](https://www.w3.org/TR/r2rml/#example-input-database). We'll
need to create an R2RML _triples map_ for relation or table that we
want to access in the form of triples. A triples map is comprised of
three sections - a source "logical" relation/table, a target subject
map and a set of target predicate-object maps. Each row in the source
table is used to create one triple for each predicate-object pair. The
subject is fixed for all triples built from a single row. We can see
the basic intuition by examining how a single row maps to a set of
triples. We first need to define a triples map's logical table and
subject map:

```
<#TriplesMap1>
    rr:logicalTable [ rr:tableName "EMP" ];
    rr:subjectMap [
        rr:template "http://data.example.com/employee/{EMPNO}";
        rr:class ex:Employee;
    ];
```

This says that we'll use the `EMP` table and that the subject of all
triples created by rows in this table will be an IRI based on the
template over the `EMPNO` field. Conceptually, each row represents an
employee where the `EMPNO` field uniquely identifies the employee and
the remaining fields (`ENAME`, `JOB`, `DEPTNO`) are attributes of the
employee. Our mapping also specifies that an employee represented by a
row in the table is a member of the `ex:Employee` class in our RDF
model. We'll add to this two predicate-object maps indicating that two
triples will be created for each row:

```
    rr:predicateObjectMap [
        rr:predicate ex:department;
        rr:objectMap [ rr:template "http://data.example.com/department/{DEPTNO}" ];
    ];
    rr:predicateObjectMap [
        rr:predicate ex:name;
        rr:objectMap [ rr:column "ENAME" ];
    ].
```

Finally, let's take a look at the result of applying this mapping to a
single row from the `EMP` table. Given the row:

```
 emp_no | ename | dept_no 
--------+-------+---------
   7369 | SMITH |      10
```

We can expect that three triples will be created:

```
<http://data.example.com/employee/7369> rdf:type ex:Employee.
<http://data.example.com/employee/7369> ex:name "SMITH".
<http://data.example.com/employee/7369> ex:department <http://data.example.com/department/10>.
```

Hopefully it's clear how the triples are _generated_ from the input
row given the R2RML mappings. Now let's see how to use this type of
mapping by creating a virtual graph in Stardog.

### Working with Virtual Graphs

Mapped relational sources are exposed in the same way as named graphs
in the RDF model. The triples representing the source relational data
are considered to be in a named graph that is not present in the local
RDF graph and hence we consider that named graph to be _virtual_. So
let's create this virtual graph. In addition to the mappings we need
to specify the connection information to the source relational
system. This is basically a JDBC URL and credentials. Rather than
repeat it here, I'll
just
[link to the documentation](http://docs.stardog.com/#_managing_virtual_graphs).



## Virtual Graphs and Reasoning

....

## other integration (multiple graphs)


