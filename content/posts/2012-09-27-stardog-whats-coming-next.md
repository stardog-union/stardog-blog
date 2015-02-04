+++
title = "Stardog: What's Coming Next?"
date = "2012-09-27"
author = "Kendall Clark"
+++

Stardog is on the move; we got <a href="http://stardog.com/">Stardog
1.0</a> out the door without anyone dying; we've got customers; people
are using it; and we released Stardog Community, too.<!--more--> Since the 1.0
release in June we've done 6 releases, about one every two weeks. Most
of them have focused on small usability improvements, performance
tweaks, and, of course, bug fixes.

But where are we headed now with Stardog development?

## SPARQL 1.1

The most pressing need in Stardog is support for
[SPARQL 1.1](http://www.w3.org/TR/sparql11-query/). We got stuck
between the devil and the deep blue sea---trying to push the 1.0
release before the SPARQL Working Group was completely finished with
the SPARQL 1.1 spec. We were motivated to avoid reimplementing any
parts of SPARQL 1.1 because the spec shifted. So we decided SPARQL 1.0
for the Stardog 1.0 release. Then we told everyone that SPARQL 1.1
would be the highest priority item for the post-1.0 release cycle.

And so it's been. 

As of this writing, Stardog TRUNK supports all of SPARQL 1.1 query
language; property paths are not totally finished but we're close. We
already support a superset of the HTTP protocol for 1.1, so that's
good.) Finishing property paths, final testing, and tweaking will take
a bit longer: we expect Stardog 1.1 release to be out by the end of
October. It will include full SPARQL 1.1 support.

Except for the bits we don't like. 

Frankly we're nervous about adding update operations to SPARQL (the
query language; we already support update in our HTTP and SNARL
protocols) because we're worried about SPARQL injection attacks. So
we're going to take a bit more time to work out a secure design for
supporting update operations in the query language. Stay tuned for
those bits some time after the 1.1 release.

## User-defined Rules and Reasoning

Stardog already has the best and most comprehensive OWL 2 reasoning of
any RDF database; but we're not finished making it better. In Stardog
1.1 we'll debut user-defined rule reasoning; some domain modeling just
doesn't fit easily into OWL axioms. **Sometimes you really need to
write a damn rule!**

Stardog 1.1 will support user-defined rules using the SWRL syntax; it
will include all of the SWRL builtins, as well as a much-requested new
builtin that allows SWRL rules to create new individuals. (Strictly
speaking, this new builtin is a gun with which users may easily shoot
themselves a *non-terminating* wound. Don't say you weren't warned!)

Finally, we've added a Datalog engine to Stardog and we'll use that to
support the rest of OWL 2; that is, we'll use the new Datalog engine
to support transitivity (first) and (later) equality reasoning.

## Performance

SPARQL query performance is our primary obsession these days,
especially for very complex queries involving lots of joins, etc. We
think answering complex queries is the sweet spot for SPARQL and
RDF-based information systems. And since we reduce OWL reasoning to
SPARQL query answering (more or less), we have additional motivation
to make it really fast.

We've pushed many SPARQL FILTER operations down further into query
evaluation, with the result that in many cases queries with FILTERs
are much faster. We've also improved database write performance---which
is, admittedly, a lower priority than database read performance---by
being more clever with how we torture the disk head. We've also
increased Stardog write safety during system instability (power cord
got yanked?!) by writing more aggressively and more often to
disk. Finally, we're looking at some new data compression techniques
that may let us speed up disk reads substantially.

## Production Features

We're working on hot backup, i.e., backing up a Stardog database
without having to take it offline. We'll add that to the JMX
monitoring that's been sitting in a branch for nearly 9 months; the
new query management subsystem; and the long-awaited web
console. These production features will make life easier for the
operations people in yr life.

## Geospatial Query Answering

Finally, geospatial query answering and reasoning are coming to
Stardog. We're implementing GeoSPARQL and, while it's still very early
in the development cycle, we're excited and confident it'll be a very
useful addition.
