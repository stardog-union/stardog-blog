+++
date = "2015-04-23T14:59:52-04:00"
draft = false
title = "Simpler Graphs in Stardog 3"
author = "Kendall Clark"
+++

A reason many graph databases don't offer reasoning is that it is difficult to
engineer correctly. Most vendors simply don't have the skill or expertise
required to do it right.<!--more--> So most of them do an ad hoc hodgepodge of
reasoning bits and bobs. At best the attitude is : "Hey, let's plug in some kind
of Prolog engine and hope for the best!" Somewhere after that you get handed a
"graph metamodel" and told to do it yourself. Whee! At worst, the vendor spreads
FUD about the value of reasoning altogether. Because, yeah, no users could
possibly understand Venn diagrams...

## Fear, Uncertainty, and Dummies

How do I know it's FUD? Two reasons.

First, it's FUD because these same vendors love declarative systems to, say,
build software. Their objection isn’t to declarative systems. Their objection is
to declarative processing of graphs. Apparently declarative data modeling and
analysis systems aren’t fit for their customers.

Second, it’s FUD because in the absence of reasoning, you have to do the work by
hand, yourself, anyway and it isn't easy! Why not let the database figure it out
for you instead?

## The Whole Truth and Nothing But the Truth...Maintenance

In Stardog reasoning isn’t enabled by default so that our users do not pay the
performance penalties if they don’t need the features. Some kinds of “inference”
can be performed by using the SPARQL CONSTRUCT form to generate triples that are
not explicitly stated in the database. For example, you can add that an
individual has an aunt if she has a parent with a sibling who is female or
married to a female. Knowing the latter few facts can create the former
statement. The constructed triples can be added back to the database and then
queried directly.

The problem with this approach is that truth maintenance is a tricky
business. If the aforementioned child had an aunt solely because her father's
brother was married, if the uncle gets divorced, she may no longer technically
have one. At this point, you would still have the fact that she has an aunt in
the database. While it is certainly possible to remove that fact, knowing that
you can or should is not usually obvious. If it is stored in the default graph,
you may lose track of whether it had been asserted explicitly or derived from a
constructed rule.

This is why query-based reasoning is so powerful. Inferred triples can be
generated at query time based on the state of the database. Should that change,
the inferred results would change, but database administrators don't have to
worry about segmenting or cleaning up inferred statements.

Stardog has always been positioned as the leading graph database for high
performance querying and unequaled reasoning capabilities. We are always trying
to find ways to improve performance, increase the capabilities, and lower the
effort for users to benefit from these features. In Stardog 3.0, we have done
all three. We'll focus on performance improvements in the future, but for now
we'd like to draw your attention to two important improvements in Stardog's
reasoning abilities.

## Simple Scales > Easy

The first improvement is that users no longer need to know which reasoning level
to engage for basic kinds of inference. Most people can benefit from the feature
without having to know the difference between QL, RL, EL, RDFS and SL. The
distinctions between these levels are important in certain circumstances, but
they won't be for large numbers of uses. To remove this confusion, it is now
possible to simply turn reasoning on by setting a flag to "true". Consult the
[docs](http://docs.stardog.com/#_reasoning_levels) for specifics.

## All Things Being Equal...

The other major new addition is full support for OWL 2 equality reasoning. Which
means Stardog is the only graph database to offer complete support for
OWL 2. Our competitors do have some lovely excuses, however.

So what can you do with equality reasoning? One way you can indicate that two
URIs point to the same resource is to explicitly connect them via the
`owl:sameAs` property. This suggests that any facts about the one resource are
also true about the other. It sounds simple in practice, but the complexity
escalates quickly. `owl:sameAs` is also symmetric and transitive. This means
that the equality applies in both directions (as it would) and that if A is
`owl:sameAs` B and B is `owl:sameAs` C, then A is `owl:sameAs` C. This is a
tremendously useful tool for integrating data sets and it is used widely in the
Linked Data space. In other words, the Berlin mentioned in DBPedia is the same
as the Berlin mentioned in the GeoNames project.

In the end, simpler scales better than easier and reasoning is simpler than
doing it yourself, but only when you pick the right database.
