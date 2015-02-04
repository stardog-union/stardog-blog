+++
date = "2015-01-22T12:28:02-05:00"
draft = false 
author = "Kendall Clark, Evren Sirin, Mike Grove, Fernando Hernandez, Edgar Rodriguez, and Pavel Klinov"
title = "A Preview of Stardog 3"
+++

Stardog 3 is the result of more than **10,000 commits** and it's
headed this way. Let's preview the goodness. <!--more-->In this long post
we'll look at notable improvements in Stardog 3, including

* HA Cluster and performance improvements
* improvements to Stardog's reasoning capabilities
* improvements to ICV, search, and some miscellaneous items

## High Availability Cluster

Stardog HA Cluster beta was released in Fall, 2014; while it was
usable, it wasn't as robust as we wanted. Let's start by saying that
distributed systems of any kind are hard And distributed semantic
graph databases are even harder. But for the 3.0 release Edgar
Rodriguez Diaz and Fernando Hernandez beat the Cluster into shape.

{{% figure src="/img/change.jpg" class="inliner" %}}

We've improved Cluster by using ZooKeeper more efficiently, having better
stability in the system, and making it more tolerant to corner-case
failures. The group membership mechanism we used in beta was based on
a heartbeat component, which was replaced by ZK's ephemeral
znodes. Which gives us a better representation of the participants and
their membership properties within the cluster.

We also fixed the case where Stardog nodes lose connection with the
ZooKeeper ensemble because of network problems. Now Cluster can detect
when Stardog nodes need to wait for an available connection, for
example.  Cluster state is now handled by using `NodeCache` and
`PathChildrenCache` recipes from Curator, which allow us to replace
most of the znode watchers we'd implemented, letting Curator manage
znode information updates.

We also improved leader-follower replication mechanism for distributed
transactions in Cluster. We were using blocking calls to replicate the
data from the leader node to follower nodes; however, this scaled
poorly. Instead we implemented a variant of two-phase commit with
ZooKeeper, which uses asynchronous calls for replicating the data
across nodes. When a new transaction is started, the leader will
create a znode corresponding to the transaction. Then follower nodes
will create equivalent znodes for their transactions; the leader will
subscribe to those follower-znodes in order to detect status updates
and orchestrate the transaction in a reactive manner.

With these improvements you can expect the distributed transaction
throughput to be comparable to Stardog 2.x single-server write
throughput; of course, there is some overhead involved in the
orchestration of the distributed transaction, but for large
databases it tends to be negligible.

Stardog 3 is ready for continuous operations.

### Annual Subscription License Model

Since HA Cluster is ready for production now, we're introducing a new
wrinkle in the Stardog licensing model: per-node annual subscriptions,
which are optimized for multi-node clusters.

Annual subscription fees include maintenance, support, and access to
all releases. This is a particularly good choice for running Stardog
in the cloud since it's based on JVMs, not servers or VMs. Fees are
based on the number of nodes (i.e., JVMs) you need (counting only
Stardogs, not ZooKeepers) and are priced to provide real high
availability (i.e., at least a 3-node cluster) for the same license
fees as a single machine pre-3.0 license; annual subscription fees
also have the advantage of shifting your spend from cap-ex to op-ex in
most cases. A 3-node cluster is the smallest annual subscription we
offer and discount curves are pretty steep starting at 9 nodes.

Get in [touch](mailto:sales@clarkparsia.com) to discuss licensing.

## Query Performance

Stardog has always been optimized for SPARQL query evaluation
performance. We continue to treat slow queries as bugs to be fixed as
quickly as possible. Here are a few of the changes that improve query
performance in Stardog 3.

**We made hash and loop joins more memory efficient.** The classic
hash and (nested) loop join algorithms are memory intensive. For
example, `HashJoin(A, B)` would typically create an in-memory
hashtable for B and then look up joinable solutions while iterating
over `A`. This is problematic if `B` produces a lot of bindings since
they all have to sit in memory. They might even sit there long enough
to be promoted to the old GC generation with all the entailed
problems.

One way to address this issue, implemented in Stardog 2.x, is
persistent hashtables. This addresses the memory problem but at a
certain cost: persistent hashtables are slower to build and use.

Stardog 3 can take an operator and use it as a hashtable, which works
best if the operator is sorted so that each look-up can be done in
`O(logN)` time.  The new implementation doesn't incur any upfront cost
and is, thus, ideal for queries with a `LIMIT` clause or `ASK` form.

**We implemented new optimizations for the new hashtables.** Consider a
query:

<pre><code class="sparql">?x a :Type . #A
?x dc:creator ?creator . #B
?creator :ssn "XXX-XX-XXXX" #C</code></pre>

Imagine that `A` and `B` are unselective and `C` is very
selective. Stardog 2.x favors hash joins with small hash tables and
would create a join tree like `HashJoin(A MergeJoin(B, C))`. Since C
is selective, `MergeJoin(B, C)` may return few bindings, making the
hashtable of the top hash join small. But the top hash join requires
full iteration over `A`, which is a lot of IO.

Stardog 3 finds a better plan: `HashJoin(MergeJoin(B, C), A)`. Now we
iterate over the small number of bindings returned by `MergeJoin(B,
C)` and for each do a `O(logN)` lookup **directly** in the index for
`A`, which now looks like a hash table for the top hash join. This
requires very little IO and memory at only a marginal cost of look-up
`O(logN)`, instead of pseudo-constant time for real hashtables.

**We made in-memory hashtables more efficient.** It's still important to
have fast in-memory hashtables for those case where it seems like
building them leads to better plans. Stardog 3's hashtables were
rewritten to make sure no unnecessary memory is ever spent in any of
the relevant data structures.

**We made other query planner improvements.** Stardog 3 has a new cost
model for the planner to take full advantage of the new hash and loop
join algorithms. We also implemented a new algorithm for algebraic
rewriting, i.e., transforming the original SPARQL algebra into an
equivalent one for which it is more likely that the join order
optimizer will find the optimal join tree, which is particularly
important for complex queries with `UNION` and `OPTIONAL`. The trick
here is to figure out which `BGP`s can act like a key, propagate that
information throughout the plan tree, determine if cardinalities can
be reduced by joining with this key, and then compute chains of
patterns to connect the key with the relevant scopes.

## Write Performance

Stardog has till now privileged reads over writes; but that doesn't
mean we accept slow write performance. Stardog's write speed at
database creation time has been one of the best in the industry for a
while; and now with Stardog 3, updates to an existing database are
equally fast, which means a big speedup in the common case.

Stardog 3 is also more clever about handling updates so there are fewer
configuration options to tweak. The number of threads used for parsing
and processing files, the size of buffers used during processing,
etc. are automatically computed and adjusted so you can add a few
triples or a lot without tweaking.

{{% figure src="/img/writing.jpg" class="inliner" %}}

Concurrency for transactions has also been improved: read queries can
continue execution while a large update transaction is committed. This
means you can wipe and reload a database while it is online without
disrupting queries in-flight. As an added benefit, the logs will show
the progress for long write transactions, just like the progress of
database creation, so that you'll know when a huge update is going
to finish.

## Know Equals? No Equals.

Until the Stardog 3 release we supported query-time reasoning for OWL
and user-defined rules, but that didn't include equality reasoning. So
if you had `owl:sameAs` assertions in your database, they would not be
included in reasoning results. And axioms like `owl:hasKey` were not
be used to infer new `owl:sameAs` inferences. One reason for this
omission is that the semantics of equality---recall: equality is
reflexive, symmetric, and transitive---are difficult to implement
efficiently in a query rewriting system.

{{% figure src="/img/equal.jpg" class="inliner" %}}

Stardog 3 supports full equality reasoning, by materializing
`owl:sameAs` inferences, and thus offers a hybrid of materialized and
query-time reasoning capability. Equality inferences are automatically
computed so that query rewriting can use this information in a
straight-forward way. Equality inferences are automatically updated
when the database contents are changed and always reflect the latest
state. **Stardog 3 is the first and only graph database to support all
of OWL 2 and SWRL, including all of the OWL 2 profiles.**

## Automated Repair Plans

Stardog provides proof trees to explain why an integrity constraint is
violated. Proof trees show in detail which assertions were involved in
the violation and how these assertions interact with each other. You
can use this information to correct errors and repair violations.  If
you are faced with the problem of cleaning up a messy dataset, then
you might be looking at many violations that need to be fixed; but
examining each proof manually and serially is cumbersome.

Stardog 3 provides **automatically generated repair plans that will
fix a set of violations**. There are various configuration parameters
users can use to change what kind of repair plans will be
generated. For example, the default setting will try to minimize the
total number actions (additions or removals) required to fix all the
violations. So if removing a single triple could fix multiple
violations, it will likely be included in the repair plan since that
triple seems to contradict with many other assertions. Users can also
define custom metrics for generating repair plans.

{{% figure src="/img/vinyl.jpg" class="inliner" %}}

The repair plans generated by Stardog can be saved as SPARQL update
operations so that they are portable and can be shared with other 
parties or systems easily.

## Reasoning Simplified

While Stardog supports all OWL 2 profiles (EL, QL, and RL), as well as
OWL 2 DL, that doesn't mean users should have to learn all the
ins-and-outs of these profiles. It's confusing and sometimes
frustrating to tease out the differences. Users told us that they like
to being able to choose a reasoning level per query, but often didn't
like having to pick a particular kind of reasoning level.

{{% figure src="/img/simple.jpg" class="inliner" %}}

In Stardog 3 reasoning levels have been radically simplified. **Now
you just tell Stardog, per query, whether you want reasoning or
not**---true or false; one or zero; yes or no. It's that
simple. Stardog will choose the most appropriate reasoning level if
you request it; or it will execute your query without any reasoning if
you don't.

Making semantics simpler is good for everybody and we're on it.

## Semantic Search

We've been shipping Stardog with the default Lucene analyzer.  This
works fine in most cases; but there are situations where you'll want
to use your own stop word list or be able to include analyzers for
different languages. So in Stardog 3.0 we added the ability to
override the default and specify which Lucene Analyzer will be used
when indexing your RDF. **Now you can use any of the bundled Lucene
Analyzers, or even one of your own, when indexing in Stardog's
semantic search.**

## User-Defined Aggregates

SPARQL defines an extensibility mechanism for filter and bind
functions.  This is a convenient way for users to implement domain
specific functions, identified by URIs, and use them in filter, bind,
or projection expressions the same way they'd use any other function.

{{% figure src="/img/agg.jpg" class="inliner" %}}

Unfortunately, SPARQL does not allow for user-defined aggregate
functions and user-defined functions are not valid in aggregations.
In Stardog 3 we've added this capability. **Now users can specify
their own aggregate functions, such as geometric mean, using the same
mechanisms for custom user-defined functions.** This is done without
modifying SPARQL syntax; no new keywords are added.  The only catch is
you have to prefix your aggregate function with the token "agg:"...

<pre><code class="sparql">PREFIX agg: &lt;urn:agg>
PREFIX stardog: &lt;tag:stardog:api:>

SELECT (agg:stardog:gmean(distinct ?O) AS ?mean)
WHERE { ?S ?P ?O }
</code></pre>

Let's note a few things. First, the `PREFIX` declaration for `agg`
isn't needed. But including it makes the query portable across SPARQL
systems: since `agg:stardog:gmean` is a valid QName, including the
prefix means that the query will parse correctly in any compliant
SPARQL system. Third, Stardog 3 knows that `agg` is the
user-defined aggregate with the QName `stardog:gmean`.

## Conclusion

Thanks to everyone who worked so hard on this release. Thanks to our
users and customers for helping us in numerous ways.

Watch this space for the Stardog 3.0 release announcement later in
February.
