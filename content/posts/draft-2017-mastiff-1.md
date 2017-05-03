+++
Title = "Stardog in the Storage Wars"
date = "2017-04-19"
categories = ["Storage", "Concurrency"]
author = "Scott Fines"
draft = true
discourseUsername = "scott"
+++

It's time for a new storage engine in Stardog. You won't believe what happened
next!<!--more-->

Like all persistent database system, Stardog has a storage engine. This storage
engine has its quirks, but has generally served us pretty well. But we aren't
satisfied with "pretty well", so recently we've been taking a long hard look at
that engine in order to ask ourselves if there are things that we can do better.
In the end, we have found a few things that we think are severe enough to merit
restructuring how we store data on disk, and so we are currently deep into the
process of doing just that.

But wait, Scott, you say. Changing a Storage engine isn't like changing the oil
in a car. It's a massive, central component to the database! Changes made to the
Storage engine will have reverberations throughout the entirety of Stardog, from
query and update performance through to our transaction and concurrency support,
and it even affects how we model our clustered environment. To which I say:
indeed. We do not take the Storage engine lightly, so it behooves us to take a
moment to discuss what our current engine is, and what we think is good and bad
about it, and why we ultimately decided that we needed to make this move in the
first place.

## The Current Storage System

The current storage model is a "Copy-on-write B-Tree". B-Trees are famous.
They've been around in database systems since the 1970's, mainly because they
work pretty well; they provide very good read performance, ok write performance,
and relatively easy configuration.

The thing about B-Trees, though, is that transactional concurrency is tricky.
You have to write locks for rows, pages, tables, and a half-dozen other units.
These locks can deadlock, so you have to maintain some semblance of deadlock
detection to ensure that you don't run into those problems. Each lock has to be
tested, and can interact in unusual ways. In short, lock-based concurrency in a
B-Tree is complicated and hard. A much simpler model is to use "copy-on-write"
semantics.

With a Copy-on-write B-Tree, each write transaction will make a copy of the
Tree, then modify that copy directly(Actually, we only make physical copies of
the pages which are affected); when the transaction is ready to commit, we swap
out the original Tree and replace it with the new copy; anyone who wishes to
read from the tree while we are writing just looks at the original copy.

Copy-on-write B-Trees have the same read performance as a classic B-Tree, but
_much_ better read concurrency, because there are no locks or other mechanisms
which block readers at _any_ point during a read. However, they pay a
significant price in both write performance and write concurrency. Because we
make copies of entire pages during the write phase, we are actually performing
more physical writing than in a traditional B-Tree. Secondly, the copy-on-write
semantics can lead to conflicts between multiple writers: for example, if writer
A and B attempt to perform a write simultaneously, we have the following
sequence:

1. Writer A gets initial Tree information (Tree in State 0)
2. Writer B gets initial Tree information (Tree in State 0)
3. Writer A makes changes, creating Tree State 1
4. Writer B makes changes, creating Tree State 2
5. Writer A attempts commit, moving shared tree from state 0 to 1
6. Writer B attempts commit, moving shared tree from state 1 to 2

In this sequence of events, A's writes are lost, which is obviously a bad thing.
This is a classic example of a write-write conflict, but Copy-on-write semantics
don't specify what we do here. We essentially have a choice: we can allow A to
succeed, but somehow perform a detection on B to indicate that the state has
changed out from under it, or we can only allow a single writer at a time.
Allowing a single writer at a time to manipulate the tree is easy, but results
in very poor write concurrency. On the other hand, if we try to allow A but fail
B, then B would need to retry her writes against A's state. This would result in
B doing the same work multiple times, with no guarantee of success at any point
--after all, a new Writer could come in and do more writes before B can finish
her work. In the end, it's functionally the same as only allowing a single
writer through at a time.

The main strength of the Copy-on-write B-Tree is the scenario where you load
some data, then do a bunch of different queries on it. As long as that's your
model, the current engine works pretty well for you. In this situation, you have
many different read transactions going on, but maybe only one or two writers
writing relatively large volumes of data at long intervals. Unfortunately, this
scenario isn't the only way that someone would like to use Stardog, so we need
to consider what we should do to improve performance for other workloads.

## LSM Trees

We could try and move to a traditional B-Tree based system, of course. But that
would require entering into the complicated world of locking structures that
we've already mentioned, and that's not really very much fun for us. Even if we
did go through that torment, we'd end up with a data structure that doesn't
perform all _that_ well on write workloads. For databases like our relational
counterparts, this isn't a huge deal, because they really don't write data into
too many locations: most relational stores recommend using only one or two
indices for each table, in order to avoid damaging write performance. Alas,
Stardog maintains 8 separate disk-based indices. So B-Trees are probably not the
correct data structure for us.

An alternative approach is that of a Log-Structured Merge Tree (or LSM Tree).
LSM Trees have been growing in popularity lately, mainly due to the success of
Cassandra, HBase, and LevelDB, each of which attempted to solve the problem of
write-performance and concurrency issues in B-Trees themselves.

At it's most basic level, an LSM tree is a write-ahead-log, a set of sorted
files, and a sorted in-memory representation. When you want to write a record,
it is first written to the Write-ahead-log (henceforward called the WAL), then
to an in-memory sorted structed called the _Memstore_. When the Memstore reaches
a configured memory space limit, it is _flushed_ to disk, creating a single file
(called an _sstable_) which is sorted in the same order as the Memstore was.
When you wish to read some data, you read from each sstable and the memstore,
merging the results together to form a single sorted representation of the data.

This basic approach solves the write-performance problem and the
write-concurrency problem in a single swipe: Write performance is very fast,
because the only IO required is a single entry in the write-ahead log; because
the entries in the WAL are ordered only by the time which the write was
submitted, the concurrency on a write is only bounded by the hardware on the
machine it's running on.

However, it is done at a significant cost to read performance. Over time, as
more and more writes are made against the system, more and more files are
created which will need to be accessed in order to perform a read. Over time,
the cost of merging all these files together poses an unacceptable burden on our
read speed. In order to avoid this, LSM trees usually include a _compaction_
system, which selects a subset of all written sstables and merges them into a
single sstable containing all the data pre-merged. This keeps the number of
files in an index to a reasonable number and helps keep read performance within
acceptable bounds. Alas, it also tends to cause a lot of disk IO to happen in a
big burst, which can negatively affect both read and write performance while
compactions are ongoing. As a result, tuning compaction frequency and compaction
strategies tends to occupy a not-insignificant portion of and administrator's
time.

With Compactions in mind, we can maintain good write performance and concurrency
while holding steady on read performance. But what about Read concurrency? Do we
pay a price there? As it turns out, not much: there is some coordination
overhead in reading data from the memstore, but high-concurrency data structures
like SkipLists help resolve that, and reading the sstables require no
synchronization at all, because all sstables are _immutable_--they are never
modified in place, only copied into new sstables during compactions.

So, on the whole, LSM trees have _much_ better write performance and write
concurrency, while paying a modest price in read performance and no penalty at
all in read concurrency. All in all, LSM trees are a much better solution to
Stardog's storage problems than B-Trees are in any form.

Unfortunately, the move from a Copy-on-write B-Tree to an LSM tree is not that
easy, because Copy-on-write B-trees manage the transactional state as part of
the data structure itself, rather than as a function of the data contained in
the structure. By contrast, LSM trees provide no global concurrency control
mechanisms with which to accomplish the same task. Instead, we must devise our
own transactional support to work with LSM trees.

We could, of course, fall back on the same row-lock, region-lock, table-lock
system that B-Trees use, but that would not be great for our read or write
concurrency, as well as being complicated and deadlock-prone. Instead, we use
_Multi-Version Concurrency Control_, storing transactional information along
with the data itself inside the index. This uses more disk space, but allows us
to construct a simple transactional model with the same guarantees that our
current structure does, without requiring us to fidget around with locks for the
next 10 years.

## Conclusion

@CTA
