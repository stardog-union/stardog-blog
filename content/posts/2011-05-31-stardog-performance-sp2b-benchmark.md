+++
title = "Stardog Performance: SP2B Benchmark"
date = "2011-05-31"
author = "Kendall Clark"
+++

As you may already know, we're working hard on
[Stardog](http://stardog.com/), our upcoming RDF database. It's presently
in closed alpha testing (55 testers), at version 0.5.3, and progressing
rapidly.<!--more--> The overriding goals for Stardog, which we've repeated often, are:

1. insanely fast performance on complex SPARQL queries in the out-of-the-box, untuned configuration
1. feature-rich: logical inference, statistical inference, transactions, store procedures, etc.
1. lightweight and pure Java

We think we're on track to meet those goals for a 1.0 release in Q3, 2011.

In advance of Mike Grove's
[talk](http://semtech2011.semanticweb.com/sessionPop.cfm?confid=62&proposalid=3943) next week at Semantic Technology Conference 2011, and since the
[Dydra peeps](http://blog.dydra.com/2011/05/27/sp2b-benchmarks) are
publishing SP2B benchmark numbers, too, I thought we'd say a bit about
Stardog performance.

## SP2B Benchmark Performance

In short, it's pretty awesome. We're reporting SP2B---the leading SPARQL
benchmark for complex, real-world performance---results that are noteworthy.

<img src="http://dl.dropbox.com/u/126772/stardog-perf.png">

As you can see, we're reporting SP2B benchmarks for six dataset sizes: 10k,
50k, 250k, 1M, 5M, and 25M. We're not aware of any RDF database previously
reporting *any* numbers for 25M SP2B dataset size. Note, too, that the
y-axis is logarithmic in *milliseconds*.

With the exception of query Q5a---about which more below---the performance
numbers are quite good; the benchmark machine was quite modest (an iMac
with 2 i7s using 8GB RAM), a bit under-powered in comparison to the average
production machine these days.

In particular, note Q7, which Stardog evaluates for 1M dataset in less than
1 second; at 5M in about 5 seconds; and at 25M---which no other RDF database
has reported *any* performance numbers---in about 12 seconds. For Q4, at 5M,
Stardog completes in 45 seconds. The next fastest RDF database, for which
SP2B results have been reported, completes Q4 for 1M dataset in 134 seconds.

## State of the Art

A brief word about SP2B query Q5a; despite what Arto [said
recently](http://blog.dydra.com/2011/05/27/sp2b-benchmarks), we don't
believe there's any mistake in the SP2B benchmark for Q5a. It is simply
a very hard query, requiring the detection of an implicit join for good
performance.

We're not aware of any RDF database that is able to detect this implicit
join *generally*. Stardog has an optimization that detects it for Q5a and
for similar queries, which will be available in a future release, pending
some additional engineering. These benchmark results do not include that
optimization.


## Conclusion

It's an exciting time to be a semantic technology
vendor, especially in the [RDF database
market](http://weblog.clarkparsia.com/2010/09/23/the-rdf-database-market/) which
is still seeing rapid innovation and maturation. We're happy that the
Dydra folks are using SP2B as a benchmark; we agree with them that SP2B
is the "gold standard of SPARQL benchmarks" and will continue to develop
[Stardog](http://stardog.com/) with SP2B as one measure of progress among
many.
