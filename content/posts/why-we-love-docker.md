+++
date = "2015-02-09T11:51:10-05:00"
draft = false 
title = "Why We ♥ Docker"
author = "Kendall Clark and Fernando Hernandez"
+++

We love Docker. But the "why" is more interesting than the
"that".<!--more--> After all, we haven't shipped anything with Docker
and we haven't really used it very much. We know that it's full of
warts, bugs, and dumb ideas. So explaining why we love it, and why
we're committing to it in a big way, may be interesting.

## What is Docker?

Docker is basically an implementation of, and an ecosystem built
around, Linux Containers, that is, OS-level virtualization environment
for running isolated groups of processes. Docker adds a lot of other
stuff to LXC, but the point is to manage and control *groups of
processes* at the OS-level in an isolated fashion.

This is the key to why we love it: it changes the relationship between
us as a graph database vendor and our customers in an interesting,
useful, and productive fashion.

## Extending Our Control...

What is our world like without Docker? We develop, test, and ship
Stardog as a pure Java system. That is, our interface with our
customers is defined and limited by the JVM/JDK and, generally, the
Java ecosystem. We also love Java, but Stardog Cluster is already a
complex *ensemble of systems* including Stardog, ZooKeeper, and our
Cluster proxy. That makes it complex to develop, test, ship, deploy,
and administer.

So we own Stardog as a pure JVM system, but our customers have to
configure and run it, as well as Stardog Cluster, in *their computing
environment*. Every customer has a different computing environment,
which they own; we own Stardog; but there's a set of things in this
environment where there is no single owner. Instead, there is
confusing and uncertain overlap between our responsibilities as a
vendor and the customer's responsibilities as, well, a customer.

That leads to brittle systems. And brittle is bad...for our business
and for our customers' business, too.

Docker fundamentally redefines the interface or technology contract
between us as vendor and our customer. It does this by giving us a
larger surface area that *we exclusively own*, that is, till we hand
it over to the customer, at which point the customer *exclusively owns
it*. There is no overlap, no uncertainty, and no ambiguity.

## Means Extending Our Value Proposition

This redefined interface allows us to extend our value proposition
beyond Java and Stardog per se. Today, if we figure out an innovative
improvement for running Stardog that lies *outside the JVM ecosystem*,
it's effectively lost (or significantly attenuated) by the fact that
we don't own anything outside of the JVM ecosystem. And trying to own
anything outside of that ecosystem, without Docker, means that we have
to have direct contact with the total complexity of all of our
customers' computing environments. Even for the biggest software
companies on the planet, that's to be avoided. For us? Deadly
stupid. We simply can't do it.

But Docker changes this by letting us abstract away from the
multiplicity of those environments. We own the container. We configure
it, optimize it, tweak it, update it, and fill it full of graph
database goodness. Then we pass it to the customer. Then they own the
container. And they fill it with data, business logic, etc. Their only
direct dependency is Docker. And we have zero exposure to the surface
area of their environment. But we can pack into the container, while
we own it, improvements to Stardog, its environment, its devops,
deployment, and management lifecycles all without directly touching or
even knowing about the customer's world.

## The Economics of Software

Now every change that could create value for our customers can be
passed on to them via Docker in a way that changes our costs *not at
all* (relative to the status quo), changes their costs *not at all*
(in fact, using Docker will tend toward reducing their costs); but
improves their use and experience of Stardog directly. Let's review
the economics here: I can keep my costs and my customer's costs
fixed, or lower them, while providing *more* value to my
customer. Uh...why wouldn't we do this?

What happens in the Docker-future when we create a new deployment best
practice, a cluster management tool in a non-JVM language, a new
system-level tweak or setting that improves Stardog performance? All
of these can be tested, verified, and then put into the Docker
container that we ship to the customer. Instead of sending an email or
updating documentation, we capture that value at the point of its
creation and then immediately provide it to customers via a Docker
update.

## The Future

We're headed to the Big Data market in 2015. We're going to address
"the forgotten 'V'" of Big Data, i.e., variety (i.e., schema
heterogeneity). We'll radically change how Stardog works by taking
advantage of new technology.

That's going to put us into a market in which (1) our customers'
operations and environments matter to us a great deal, but (2) in
which there is a wide range of configurations. We must have some
isolation from this multiplicity. Docker---plus some other stuff we'll
talk about in future posts---gives us that isolation and gives us a
mechanism to deliver more value for customers.
