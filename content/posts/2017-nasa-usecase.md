+++
title = "NASA: Stardog's Going to Mars!"
date = "2017-03-22"
categories = ["case study", "virtual graphs", "nasa"]
author = "Al Baker"
draft = false 
discourseUsername = "albaker"
heroShot = "https://blog.stardog.com/img/nasa2.jpg"
+++

Stardog is part of NASA's mission to Mars and we couldn't be prouder of that. In
this post I'll explain some of the how and the why.<!--more-->

{{% figure src="/img/nasa1.jpg" class="inliner" %}}


## Aerospace Engineering is Hard

Aerospace orgs in the public and private sectors overlap many disciplines:
large-scale software and hardware engineering, manufacturing, logistics, safety,
and operations. All of these have datasets that intersect, and
each dataset may have tens to hundreds of thousands of objects.

In NASA's Mars mission planning, within the systems engineering dataset alone, a
single requirement may have *50,000 children in its verification and validation
hierarchy*. Many PLM, PDM, and other specialized systems face challenges in
understanding one data set, let alone the unification of all of them.

The need for a knowledge graph to answer questions about this data is
undeniable. Without it millions of dollars get spent as engineers manually
sift through data to find, integrate, qualify, and report on complex 
relationships. Every question becomes a new study, fire drill, or project to
make an assessment. 

So why is this stuff so hard? Because **everything is connected to everything
else**, which makes the costs and risks of change very high. **Context
matters.**

## Knowledge Graph to the Rescue

All day NASA engineers ask questions like this:

> If we change this sensor, what is the impact to telemetry? Verification and
> Validation? Test, check out, and operations? Operational nomenclature for the
> crew? Safety and Mission Assurance? Cross program and cross vendor integration?
> Schedules, risks, and downstream dependencies? Logistics and delivery?

We work with NASA to build this knowledge graph, using Stardog to answer these
types of questions. 

Often this means building a bottom-up, composite data model that starts as
diagrams on a board, which gets translated to RDF. As we go through each
logical relationship, we look for a positive case that proves the relationship,
and an incorrect example that disproves it. 

Then the structural correctness rules in the model go into an ontology, and the
examples of an issue with the data go into a
Stardog
[integrity constraint](https://docs.stardog.com/#_validating_constraints). This
is an iterative process that introduces structure and declarative modeling in
just the right amount. In some cases, we identify limitations in a source
system. For example, being able to show a cycle like the verification and
analysis cycles used during the design of a spacecraft. In these cases, we
use
[declarative graph modeling and rules](https://docs.stardog.com/#_owl_rule_reasoning) to
knit together the data relationships as they are supposed to be and overcome
limits in the source systems.

{{% figure src="/img/nasa2.jpg" class="inliner" %}}

PLM/PDM and lifecycle collaboration tool integration is not a new problem, and
there are many players in the systems engineering space addressing the issue.
Stardog sits comfortably in the middle of many such systems, as the provider of
the resulting knowledge graph. Stardog’s approach to data modeling and
unification provides several benefits:

* [Virtual Graphs and Data Access](https://docs.stardog.com/#_structured_data_aka_virtual_graphs):
  Stardog’s virtual graph and rich data services provide access to data *in
  situ*, which means that organization’s processes and best of breed tool
  selections go unchanged.
  
* Logic based models: Stardog provides full OWL 2 and rules based models that
  can represent any existing data, which means seamlessly modeling
  heterogeneous systems and complex relationships...including stuff like spacecraft architecture!
  
* Rules based reasoning and integrity constraints: Stardog makes it easy to
  develop rules for both representing data relationships that should be there
  and ones that shouldn't. This means NASA can proactively enhance, repair, and
  report on interconnected data all through a SPARQL query.

* Standards based: Stardog supports a variety of industry standards, and the
  lifecycle engineering tool standardization with Open Services for Lifecycle
  Collaboration (OSLC) can be easily used in Stardog without translation. This
  means Stardog is the natural choice for representing a knowledge graph across
  lifecycle collaboration tools and systems.

## Summary

Stardog is an Enterprise Knowledge Graph platform that allows customers to query
massive, disparate, heterogeneous data regardless of structure with simplicity
of implementation. NASA--along with other customers in the manufacturing and
engineering space--incrementally enriches the value of its data by expensive
manual work with queries and data analytics. I talked about a few key features
we use to assist in the **Mission to Mars**. In future blog posts, I'll explore
how a graph with logical modeling captures the function decomposition of a
spacecraft in a way not possible in other systems.



