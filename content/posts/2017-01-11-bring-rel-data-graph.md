+++
title = "Bringing Relational Data into the Graph"
date = "2017-01-11"
categories = ["R2RML", "virtual graphs", "relational databases"]
author = "Jess Balint"
draft = true
+++

When Stardog is used to unify relational data sources, it facilitates powerful
query and data management features. This post introduces Stardog's _virtual
graph_ feature and explores how to access data from existing relational
sources.<!--more-->

Stardog--an enterprise data unification system--is based around the graph data
model because we believe it's uniquely well-suited due to its flexibility and
expressivity. We believe declarative reasoning is key due to its unique ability
to map data and preserve consistency.

## Mapping and R2RML

Traditional data integration tools are based on the relational data model and
employ vendor-specific mapping languages and methods. The difficulty arises when
combining several sources which were modeled differently and conform to
independent sets of rules and constraints. First, a single shared data model
must represent a global view over the sources. Second, significant manipulation
and cleansing are typically required to transform between the source and target
schema as well as make the source data conform to a set of standardized rules.

Stardog supports the standard [W3C R2RML](https://www.w3.org/TR/r2rml/) mapping
language for defining how data in a relational system maps to RDF graphs. In
addition, we've created
the [Stardog Mapping Syntax](http://docs.stardog.com/#_stardog_mapping_syntax)
to simplify the process of writing these mappings. Mappings of this sort specify
the relationship between source data, i.e. relational data in the form of a
table or SQL query, to target data, a graph of RDF triples. Once the mapping is
created, **Stardog seamlessly supports both federation (live query) and
materialization (extraction) methods to access the relational data**.

### R2RML Example

Let's take a look at some examples of mappings and how they can be used in
Stardog. We'll first build a mapping and create a virtual graph in Stardog.
Then we'll show how it can be used for both federated queries and
materialization.

We'll use the classic RDBMS tables `EMP` and `DEPT` as
given [here](https://www.w3.org/TR/r2rml/#example-input-database). We'll need to
create an R2RML _triples map_ per relation or table that we want to access in
the form of triples. A triples map is comprised of three sections:

1. a source "logical" relation/table
1. a target subject map 
1. a set of target predicate-object maps. 

Each row in the source table is used to create one triple for each
predicate-object pair. The subject is fixed for all triples built from a single
row. We can see the basic intuition by examining how a single row maps to a set
of triples. We first need to define a triples map's logical table and subject
map:

```
<#TriplesMap1>
    rr:logicalTable [ rr:tableName "EMP" ];
    rr:subjectMap [
        rr:template "http://data.example.com/employee/{EMPNO}";
        rr:class ex:Employee;
    ];
```

This mapping says that we'll use the `EMP` table and that the subject of all
triples created by rows in this table will be an IRI based on the template over
the `EMPNO` field. Conceptually, each row represents an employee where the
`EMPNO` field uniquely identifies the employee and the remaining fields
(`ENAME`, `JOB`, `DEPTNO`) are attributes of the employee. Our mapping also
specifies that an employee represented by a row in the table is a member of the
`ex:Employee` class in our RDF model. We'll add to this two predicate-object
maps indicating that two triples will be created for each row:

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

Finally, let's take a look at the result of applying this mapping to a single
row from the `EMP` table. Given the row:

```
 emp_no | ename | dept_no 
--------|-------|---------
   7369 | SMITH |      10
```

We can expect that three triples will be created:

``` bash
<http://data.example.com/employee/7369> rdf:type ex:Employee.
<http://data.example.com/employee/7369> ex:name "SMITH".
<http://data.example.com/employee/7369> ex:department <http://data.example.com/department/10>.
```

Hopefully it's clear how the triples are _generated_ from the input
row, given the R2RML mappings. Now let's see how to use this type of
mapping by creating a Stardog virtual graph.

### Working with Virtual Graphs

Mapped relational sources are exposed in the same way as named graphs (i.e.,
subgraphs accessible by name) in the RDF model. The triples representing the
source relational data are considered to be in a named graph that is not present
(i.e., not materialized) in the local RDF graph; hence, we say that named graph
is _virtual_. So let's create this virtual graph. In addition to the mappings,
we need to specify the connection information to the source relational system.
This is basically a JDBC URL and credentials. Rather than repeat it here, I'll
just
[link to the documentation](http://docs.stardog.com/#_managing_virtual_graphs).

To create the virtual graph `dept` in Stardog, we first put the
mappings in a file called `dept.ttl` and the connection properties in a
file called `dept.properties`. We create the virtual graph from the
command line as follows:

```
$ virtual add dept.properties dept.ttl
```

At this point, we can begin querying the relational data by way of the
virtual graph just as easily as any other RDF data loaded into
Stardog. The graph name we use in SPARQL queries obtained by appending
the virtual graph to the `virtual://` prefix. We can query all
employees and their names from the virtual graph as follows:

```
select * where {
  graph <virtual://dept> {
    ?e a ex:Employee ; ex:name ?ename
  }
}
```

We can find the department and name of a specific employee:
```
select * where {
  graph <virtual://dept> {
    <http://data.example.com/employee/7369> a ex:Employee ;
       ex:name ?ename ;
       ex:dept ?dept
  }
}
```

We can join with locally maintained salary data:
```
select * where {
  graph <virtual://dept> {
    ?e a ex:Employee ; ex:name ?ename
  }
  ?e ex:salary ?salary
}
```

The utility and flexibility of virtual graphs cannot be
understated. These examples use a method of access called _federated_
queries. This means that SPARQL evaluation includes a step to connect
to the remote data source and request rows by way of a generated SQL
query. Federated queries are convenient during prototyping and
development but are not always the best choice for production
deployments. The data is always up to date but queries are subject to
availability and administration requirements of the source
system. Large queries may increase the load on databases backing
production applications. The next section examines an alternative
access method whereby virtual graph data is materialized into Stardog.

### Materialization of Virtual Graphs

Now that we've created a virtual graph and explored it with same basic
queries. We'll look at another deployment option -
materialization. Materialization consists of generating all possible
triples that can be mapped from the source database and storing them
directly in Stardog. Materialization contrasts to federated queries in
a few key ways:
* Queries over materialized data sets do not involve any communication
  with the source system. This means query performance characteristics
  shift as no data is transferred and all local Stardog query
  evaluation optimizations are possible. This also means that queries
  are not tied to availability of the source system.
* Materialization involves a (possibly lengthy) step of generating
  tuples and storing them in the Stardog RDF index. The view of the
  source data is essentially "frozen" at the point in time when the
  materialization is performance and updates must be managed
  separately. Additionally, some Stardog features such as the text
  search index are available over locally stored data.

The nice thing about virtual graphs in Stardog is that there's very
little difference between federation and materialization and it's easy
to switch between the two. To materialize a virtual graph in Stardog,
we use
the [virtual import](http://docs.stardog.com/man/virtual-import.html)
command. Materialization uses an optimized code path specifically
designed to generate and index the triples from the remote
source. Conveniently, it uses the same set of mappings and connection
properties as the federated approach. Here's an example of
materializing the employee/department data into a named graph
`http://data.example.com/employees` in the `emp` database:

``` bash
$ stardog-admin virtual import -g 'http://data.example.com/employees' emp dept.properties dept.ttl
```

Following the completion of this command, we now have all the triples
generated by the triples maps indexed in the
`http://data.example.com/employees` graph. All the queries shown in
the federated examples will work by change the graph name from
`virtual://dept` to `http://data.example.com/employees`.

## Virtual Graphs and Reasoning

Virtual graphs provide a way to view data from relational sources as
graphs. When combined with reasoning, we find a uniquely powerful data
unification platform. Stardog's OWL 2 reasoning engine is based on
query-time rewriting which means it works equally well with both
federated and materialized virtual graph access. This also means
reasoning works transparently with data combined from multiple
sources. It's possible to model relationships across data in different
databases with these relationships involved when queries are executed.

Many have extolled the benefits of reasoning but we can look at just a
few possibilities. It's common to require up-to-date employee data in
large organizations. Virtual graphs provide access to "raw" data and
reasoning provides a way to model higher-level views and
relationships. This can be combined with project management data,
third party performance appraisal, email, etc. The key components
enabling data unification are available in Stardog.

## Conclusion

We've looked at the Virtual Graph feature in Stardog. We've seen how
to create mappings, how virtual graphs can be accessed, and how they
can be used. Additional details are provided in
the
[docs](http://docs.stardog.com/#_structured_data_aka_virtual_graphs).
