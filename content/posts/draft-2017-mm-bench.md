+++
title = "Benchmarking Stardog 5's Native Memory Management"
date = "2017-02-14"
author = "Michael Grove"
series = []
categories = []
draft = true
discourseUsername = "mike"
+++

We're moving the Stardog community support forum from Google to Discourse, and
we're adding comments to this blog. <!--more-->

## What's the Frequency?

MemoryManagementBenchmarks.append_ArrayList       1000000  thrpt   10    1588510.102 ±  1288861.103  ops/s
MemoryManagementBenchmarks.append_LinkedList      1000000  thrpt   10    1699060.491 ±  1396131.476  ops/s
MemoryManagementBenchmarks.append_MMArray         1000000  thrpt   10   21843938.165 ±   607435.239  ops/s
MemoryManagementBenchmarks.iterate_ArrayList      1000000  thrpt   10        201.313 ±        9.152  ops/s
MemoryManagementBenchmarks.iterate_LinkedList     1000000  thrpt   10        109.946 ±        2.884  ops/s
MemoryManagementBenchmarks.iterate_MMArray        1000000  thrpt   10          8.276 ±        0.186  ops/s
MemoryManagementBenchmarks.readFirst_ArrayList    1000000  thrpt   10  230980974.733 ±  8644572.079  ops/s
MemoryManagementBenchmarks.readFirst_LinkedList   1000000  thrpt   10  241429873.802 ± 10041452.353  ops/s
MemoryManagementBenchmarks.readFirst_MMArray      1000000  thrpt   10   10920503.040 ±   261349.133  ops/s
MemoryManagementBenchmarks.readLast_ArrayList     1000000  thrpt   10  211368332.823 ± 10528103.129  ops/s
MemoryManagementBenchmarks.readLast_LinkedList    1000000  thrpt   10  216014331.285 ±  6127212.346  ops/s
MemoryManagementBenchmarks.readLast_MMArray       1000000  thrpt   10         50.673 ±        5.534  ops/s
MemoryManagementBenchmarks.readMiddle_ArrayList   1000000  thrpt   10  208045362.440 ±  5664760.271  ops/s
MemoryManagementBenchmarks.readMiddle_LinkedList  1000000  thrpt   10  205810930.404 ±  5722268.222  ops/s
MemoryManagementBenchmarks.readMiddle_MMArray     1000000  thrpt   10         53.591 ±        1.909  ops/s

We've started publishing blog posts about Stardog here weekly. We will keep that
up until we've run out of things to say or...well, we're going to keep it up
indefinitely!

{{% figure src="/img/discourse.jpg" class="inliner" %}}

But we don't want to monologue, so we've added blog comments here today.
However, a few provisos are in order:

1. Comments should be relevant, generally speaking. We will interpret this as
   charitably as possible, but it's best to stay on topic.
1. Comments are subject to
   our [code of conduct](https://community.stardog.com/t/stardog-community-code-of-conduct/27),
   which you should read. We will moderate comments that violate the policy.
1. Well, actually, that's it. **Be a merely decent person and everything will be fine.**

However, since we're using Discourse.org as our discussion forum, we decided to
make another change, too.

## Support Forum

The existing Stardog community support forum is hosted by Google Groups, which
ironically isn't very good at SEO and is generally an imperfect fit with a
community-led support forum. So we decided to move it
to [community.stardog.com](https://community.stardog.com/), too, along with blog
comments. We're impressed with the quality of community that tends to form
around Discourse. We expect our great Stardog community to get even better in
the new location.

We will have a 30-day transition to give people time to migrate, then the old
forum will be switched over to the new one.

Join us!

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
