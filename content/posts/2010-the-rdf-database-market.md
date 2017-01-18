+++
title = "The RDF Database Market"
date = "2010-09-23"
categories = ["RDF", "database", "business"]
author = "Kendall Clark"
+++

Update: [Stardog](http://stardog.com/) is our entry into the
commercial RDF database market.

There's plenty of talk about the purely technical aspects of RDF databases
but considerably less talk about the *RDF database market* as a commercial
software business.<!--more--> As I see it, the commercial RDF database market contains
at least seven systems, listed here in random order:

* [Oracle](http://www.oracle.com/technetwork/database/options/semantic-tech/index.html)
* [Virtuoso](http://virtuoso.openlinksw.com/)
* [AllegroGraph](http://www.franz.com/agraph/allegrograph/)
* [BigData](http://www.systap.com/bigdata.htm)
* [OWLIM](http://www.ontotext.com/owlim/)
* [5Store](http://4store.org/trac/wiki/5store)
* [Talis Platform](http://www.talis.com/platform/)

There are another 8 to 10 <em>technically viable RDF databases
available</em>. However, I want to talk about these seven systems as
comprising the <em>commercial market</em>, by which I mean systems that
satisfy two conditions: first, they are production-ready; and, second, they
are commercially licensed (that is, you have to pay money to use them). A
weaker version of the latter condition, which I'm happy with, is just
that there is a single entity which owns the system (i.e., they are not
community-owned) and that entity is commercial (i.e., profit-seeking) in
nature.

Most of these systems have a zero-cost version or are open-source
licensed. But they also all have commercial editions or commercial add-ons,
extensions, etc. (BigData is a variant: it's using the dual licensing (GPL
and commercial) model.) I also know that SDB, TDB, Sesame, and plenty of
others are production-ready, but none of them is commercially licensed, to
my knowledge&mdash;please post a comment if I've got that wrong.

A final qualification: the 5Store site says that it "may be possible to
license" it from Garlik. My guess (and it's only a guess) is that it's
more likely if you aren't licensing it in order to compete with Garlik's
commercial service offerings. I will just assume, however, that 5Store is
licensable generally.

I don't want to quibble about the contours of the definition; rather, I want
to speculate about how we might rank these systems in terms of commercial
impact; that is, who's earning the most revenue from license sales of these
systems, what are some of the features of the commercial market with respect
to messaging and positioning, etc.

## No Pure Plays

The first point to make is that there are no <em>pure plays</em>
here. BigData comes the closest to being a pure RDF database play; but
since it's currently GPL'd, it may be the case that its development is
being subsidized via commercial activities other than software licensing. I
hope Systap is licensing BigData and its extensions; but they may well be
generating revenue from customizations, installations, or other service
revenue.

Every other system is the product of either a larger software enterprise
(Virtuoso, AllegroGraph, OWLIM, Talis Platform), a <em>much</em> larger
software enterprise (Oracle), or a related business (5Store, which is
available from Garlik, a personal information management service in the UK).

I don't know of any RDF database produced as a pure play biz model. I don't
know what that means, if anything, but it's worth noting. Put another
way: if that's a viable business model, I don't know of anyone pursuing
it. Again, if you have other information, please let me know.

## Integrated Offerings

Most of the systems are integrated into a larger platform or framework
of additional offerings. That's obvious in the case of Oracle; everyone
knows that. Virtuoso has a lot of additional tools, libraries, etc.,
largely focused on Linked Data, but also including a full RDBMS, XML
support, etc. Judging informally, I would say Oracle and Virtuoso have
the biggest spread of integrated offerings to complement their respective
RDF systems. AllegroGraph has a wide variety of analytic systems that
are integrated with it, as well as editors, the RacerPro OWL reasoner,
etc. OWLIM has integrated NLP and related analytic tools, etc. Talis
Platform takes a slightly different approach; it includes an RDF database,
but it emphasizes the integrated offerings: the Linked Data publishing
platform, etc.

The outliers here are 5Store and BigData. As far as I know, 5Store is an RDF
database only, more or less. I am not certain about BigData: it has some
extensions (reasoning, temporal, HA); but I don't know their status.

## Focus on Scalability

This one is semi-technical: the marketing of each system explicitly focuses
on database scalability as the primary metric of evaluation. The marketing
in the RDF database market, such as it is, reminds me a lot of Carl Sagan:
billions and billions of stars, er..., I mean triples. The talk is not
of transactions per second or average query times for complex OLAP-style
queries. The most common metrics are loading time and the raw number of
triples. Several of the systems are built around some kind of distributed
or clustered architecture, the point of which is scalability (though
reliability is also a technical factor, but not one which any system except
BigData emphasizes). AllegroGraph is a near outlier here since it's now
being marketed explicitly for OLTP or transactional loads. Talis Platform
is also an outlier since it doesn't especially emphasize scalability in its
marketing, which is not to say that it isn't scalable (I don't know either
way).

Recall: my point here isn't purely technical; but, rather, how are each of
these systems marketed, what is their commercial messaging or positioning,
who's selling software, etc.

## Reasoning Required

Some kind of reasoning is part of all, or nearly all, of the systems in
the RDF database market. This is an important point to emphasize, since
it sometimes seems that there is a split between the RDF *qua* graph data
structure and RDF/OWL *qua* knowledge representation camps. That so-called
split isn't really evident when we look at the offerings in the RDF database
market:

* Oracle's system contains a forward-chaining reasoner at (more or less) the
OWL2 RL level
* Virtuoso appears to prefer backward chaining over an assortment of OWL and
RDFS property types
* AllegroGraph supports what they call &#8220;RDFS++ reasoning&#8221;, which
appears to be pretty similar to Virtuoso's property-based reasoning; it also
supports Prolog rules
* BigData supports RDFS plus some OWL properties
* OWLIM supports RDFS, OWL Horst, and OWL2 RL reasoning
* 5Store is an outlier here: it does not support reasoning of any kind (that I can determine)
* Talis Platform is an outlier, too: it does not support reasoning of any kind (that I can determine) 

There aren't any systems supporting more expressivity than OWL2 RL; but that
is what we should expect to see, given the technical affinities between
databases, rule engines, RDFS, and OWL2 RL.

## License Costs and Pricing Models

Licensing fees and pricing models are a mixed bag:

* OWLIM does per core licensing (900 Euros per core)
* Oracle Semantic Technologies is a free add-on to the Oracle Spatial extension
* BigData: unknown
* AllegroGraph: appears to be licensed per-CPU and list prices don't seem to be publicly available 
* 5Store: unknown
* Talis Platform: Software as a Service model; has both free and for-pay options

## SPARQL 1.1 Participation

The RDF database market achieves a high degree of core interoperability:
every system implements SPARQL. There may be interoperability issues at
the edge of these offerings, since most of those extensions are relatively
tool-specific.

That said, it's interesting to look at which vendors are participating in
the ongoing efforts to specify SPARQL 1.1. Talis, Oracle, Virtuoso, and
5Store are active in the SPARQL WG; BigData, OWLIM, and AllegroGraph are not
participating publicly in the WG.

## Conclusions

What's the upshot of all this? The market has some continuities
(standards-respecting, reasoning offerings pretty uniform, focus on
scalability) and some discontinuities (pricing, degree of integration with
other systems, business model). It'd be interesting to speculate about
which is the commercial leader, in the sense of largest volume of licensing
revenue. There do seem to be some parts of the market that aren't being
pursued commercially. I wonder, too, if we'll see any consolidation or
shakeout in this market anytime soon?

What do you think about the commercial RDF database market? Are your use
cases and requirements for a commercial system being met by the current
offerings?
