+++
author = "Kendall Clark"
categories = ["Stardog"]
title = "Invitation to Stardog Beta"
date = "2011-01-10"
+++

[Stardog](http://stardog.com/) is a fast, lightweight RDF
database. Today we're announcing limited access to our beta testing program,
in preparation for the 1.0 release. If you're interested in beta-testing
Stardog, [drop me an email](mailto:kendall@clarkparsia.com).<!--more-->

## What and why?

There's a niche in the [RDF commercial
market](http://weblog.clarkparsia.com/2010/09/23/the-rdf-database-market/)
that's not well-served---we built Stardog to fill this niche. After testing
many RDF databases, we couldn't find one that was exactly right for the use
cases and requirements that we care about: zero config, fast, transactional,
lightweight, embeddable, client-server, high-throughput, rich OWL 2
reasoning, stored procedures in any JVM-based language RDF database. Whew!

## Speed Kills

RDF and OWL are excellent technologies for building data integration and
analysis apps. Those apps invariably require complex query processing,
i.e., queries where there are lots of joins, complex logical conditions
to evaluate, etc. Stardog is targeted at absolute query performance for
*complex SPARQL queries*.

## Lightweight, Braindead Simple Deployment

Winners ship. No excuses. No one wants complex deployment models. Stardog
works out-of-the-box with minimal (none, typically) configuration. You
shouldn't have to fight to install or to tune an RDF database for days.
Because Stardog is pure Java, it will run anywhere, in any servlet
container, on any OS.

## OWL 2 Reasoning

Finally, Stardog has the most comprehensive and best OWL reasoning support
of any commercial RDF database available.

Stardog 1.0 will support: SPARQL 1.1 entailment regimes,
[Terp](http://weblog.clarkparsia.com/2010/04/01/pellet21-terp/), OWL 2 DL
schema reasoning via [PelletDb](http://clarkparsia.com/pelletdb/), OWL 2
QL (query-time reasoning), and OWL 2 closed world reasoning via [Pellet
ICV](http://clarkparsia.com/pellet/icv/). We'll add OWL 2 RL support to
Stardog in a future release.

Okay, there's a lot there and we'll unpack it all in good time; but for now
the point is that Stardog's reasoning support is not only more comprehensive
than any other RDF database, it's more consistent, rational, and tied
carefully to the W3C's OWL 2 standard. Stardog also encompasses all the
relevant points on the scalability-expressivity spectrum, as well as hitting
all of the significant reasoning modes of operation (batch, on-demand,
query-time).

## Next Steps

We're running a limited, private beta for Stardog starting 1 March and
running to 30 May. We've got a few open slots, and we want to cast a
wide net to find some new orgs and new faces with new use cases and
requirements for a commercial RDF database. If you're interested, [drop me
an email](mailto:kendall@clarkparsia.com).

