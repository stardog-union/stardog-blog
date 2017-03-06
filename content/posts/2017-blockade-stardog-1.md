+++
title = "Blockading Stardog: Creating Order from Chaos"
date = "2017-02-24"
author = "Paul Marshall"
draft = false
series = [""]
categories = ["cluster", "chaos", "testing"]
discourseUsername = "pdmars"
+++

Scaling a database beyond a single node is a complex undertaking that introduces
a myriad of new challenges and avenues for failure. Stardog Cluster
solves many of these challenges and provides a highly-available
database that can be distributed across multiple servers in your infrastructure.<!--more-->

{{% figure src="/img/chaos1.jpg" class="inliner" %}}

However, any distributed system will experience unexpected node or network
failures. These failures, while relatively infrequent, can wreak havoc 
when they occur. Debugging and fixing these seemingly random
failures is often extremely difficult, if not impossible, depending on the
circumstances of the failure.

## Background

In this post we discuss the work we're doing at Stardog to solve a key challenge of
[chaos engineering](http://techblog.netflix.com/2014/09/introducing-chaos-engineering.html)
for Stardog Cluster by creating a suite of repeatable chaos tests that we call
"controlled chaos". The tests help us simulate, quickly diagnose, and fix issues
that may arise with Stardog Cluster as a result of unexpected node and network
failures. The controlled chaos tests supplement our extensive set of unit and
integration tests for Stardog.

When unexpected failures happen in production it is often very difficult to fix
them solely from a postmortem. 

First, you need to determine the cause of the
problem. Was it a node crashing? A network partition? Excessive network latency?
Excessive processing latency due to garbage collection? 

Once you identify the cause, you need to determine when, exactly, it
occurred and what services were impacted and for how long. If you can piece
that information together from logs and any other monitoring tools available
(if any), then you are forced to reason about potential problems that could
occur in the code as a result of the failure.

{{% figure src="/img/chaos3.jpg" class="inliner" %}}

When you think you've identified the problematic code, you have to
set about attempting to recreate the failure and testing your fix, repeating
the process if your fix doesn't work. 

And, finally, you need to add a regression
test to ensure the problem isn't reintroduced by future code.
While not always impossible to fix bugs in this manner, it's extremely
time consuming and often fraught with road blocks and trial and error.

Services like [Netflix's Chaos Monkey](https://github.com/Netflix/SimianArmy/wiki/Chaos-Monkey)
can help inflict failures on your application by randomly terminating Amazon
EC2 instances in your test or production environments. Killing an instance is a
worthwhile failure to ensure your application can withstand. But it's 
often one of the most straightforward failures to reason about and
recover from. 

There are many other types of failures that can cause your
application to behave unexpectedly, such as excessive latency or network
partitions. Finally, similar to any completely random failure, Chaos Monkey
doesn't make it easier to reproduce and help you
determine the root cause.

## Controlled Chaos

The idea behind our controlled chaos tests is to inject chaotic node and
network failures in a systematic fashion so that bugs can be easily recreated,
debugged, fixed, and added to our regression tests, ensuring that the issue is
not reintroduced in the future.

{{% figure src="/img/chaos2.jpg" class="inliner" %}}

It's ironic to talk about "chaos" and "systematic" or "deterministic" in the same sentence, but it's exactly what we're after. We want to be resilient in the face of a class of unpredictable errors or faults, and the best way to do that is to instrument them into the system in a programmatic and repeatable fashion.

### Blockade

To introduce node and network failures we use an open source tool,
[Blockade](https://github.com/worstcase/blockade), that is designed to insert
failures into distributed systems. Blockade assumes the
target application is running in Docker containers and causes failures by
terminating a container or using system commands like `iptables` and `tc`
to partition the network, add latency, or drop packets between different
groups of containers. Blockade can inject the following failures between
containers:

- Partition the network
- Add network latency
- Duplicate packets
- Drop packets
- Kill, stop, and restart containers

Blockade can be run as a standalone command line application or as a daemon,
providing access to Blockade operations via a
[REST API](http://blockade.readthedocs.io/en/latest/rest.html).

### Test Environment and Test Cases

Our controlled chaos test environment runs three Stardog nodes, three Zookeeper nodes, an HAProxy node, and Blockade, each in its own Docker containers. The
cluster is defined in a small [Docker Compose](https://docs.docker.com/compose/)
configuration file, allowing the cluster to be deployed on any Docker-enabled
host, including local Linux or Mac developer environments. 

The HAProxy and Stardog nodes use known static ports for themselves and are configured to point
to the dynamic Zookeeper ports setup by Docker.

{{% figure src="/img/order2.jpg" class="inliner" %}}

The cluster test suite is written in Java with JUnit and uses Blockade's REST
interface to manipulate the Stardog and Zookeeper Docker containers.
The initial set of controlled chaos tests covers a variety of Stardog
cluster use cases, including:

- Inserting and committing data
- Loading and querying datasets
- Copying databases
- Performing admin actions like adding and deleting users, roles, and databases

The tests iterate over the Blockade failure events and target Stardog and
Zookeeper instances, triggering failures at specific points throughout the test
by making REST calls to Blockade. For example, a test may create a database,
begin a transaction, insert triples, partition a Stardog node with Blockade and
then attempt to commit the transaction. 

Because Stardog Cluster prefers consistency over availability in the presence of a partition---that is, the C in [CAP theorem](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed)
parlance---the remaining Stardog nodes should expel the partitioned node from
the cluster and commit the transaction successfully. Of course, depending on the
size of the cluster and the number and type of nodes impacted by the partition,
Stardog may continue to provide both consistency and availability. When the
partition is resolved, the node will synchronize any changes and rejoin
the cluster.

There are currently about 250 controlled chaos tests that iterate over these
Stardog use cases, Blockade failures, and Stardog and Zookeeper node targets.
This provides a set of tests that perform specific database operations along with
specific node and network failures, occurring at inopportune times, directed
at specific targets that behave in the same manner every time they're run. The
tests also serve as a set of chaos regression tests as we continue to improve
and evolve Stardog Cluster.

This testing approach has dramatically improved the stability, resilience, and performance of Stardog Cluster and will be available in the upcoming 5.0 release.

## What's Next

The controlled chaos tests are only the beginning of Stardog Cluster chaos
testing. We're constantly adding additional use cases to help us identify
and fix issues. For example, we will integrate programmatic failure events at the filesystem level in order to improve Stardog's fault handling from filesystem faults and performance issues.

{{% figure src="/img/order1.jpg" class="inliner" %}}

We'll also be adding tests that are even more chaotic, similar to
Netflix Chaos Monkey, that introduce random failures (via Blockade in our case)
at completely random times on a cluster under load to demonstrate even higher
confidence in Stardog Cluster's ability to withstand chaotic node and network
failures. Look forward to more posts on this in the coming months!
