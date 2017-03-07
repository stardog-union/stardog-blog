+++
title = "Reviewing 2016, Previewing 2017"
date = "2017-01-10" 
author = "Kendall Clark"
discourseUsername = "kendall"
+++

Year-end reviews, and year-beginning previews, offer us an opportunity for sober
reflection on the three fundamental questions of any cooperative, rational human
endeavor: What do we know? What should we do? What can we hope?<!--more-->

## Reviewing 2016

I've written already
about
[raising first institutional capital](http://blog.stardog.com/stardog-raises-a-seed-round/) in 2016.
That post is background for this one.

### Product Progress

We made significant progress in Stardog *qua* product in 2016. Let's review.

In January:

* **3 Stardog Engineers**
* Released **4.0.3**
* Evren Sirin made the first commit, 2 January.

By December:

* **10 Stardog Engineers**
* Released **4.2.2**
* Mike Grove made the last commit, 29 December.

In between January and December:

* **9** releases total (low by our historical standards)
* **1,143** commits, which is about 8% of all total commits to Stardog
   1. **2,811** files were changed
   1. **170,673** insertions
   1. **135,148** deletions
* Evren Sirin has the distinction of being the only Stardog engineer who removed
  more code than he added, about 6,600 lines. Not bad for the CTO!

These statistics don't include anything that was started in 2016 but hasn't yet
been merged, including outstanding branches on memory management, cluster, and
core server rewrite. There's some chance they would move our total code for the
year from positive to deficit, which we would clearly prefer.

In other words, we only increased the Stardog codebase by about **35,000**
lines, most but not all of which is code. That includes some non-trivial
highlights:

* reduced memory usage
* join-order optimizations and
   other
   [query planner improvements](http://blog.stardog.com/how-to-read-stardog-query-plans/)
* hardened cluster 
* native SPARQL parser
* [BITES](http://docs.stardog.com/#_unstructured_data)
* stored queries
* improve Virtual Graph performance
* and 220 bug fixes

As of this blog post, the Stardog codebase is about 575,000 lines of code, a
number that's been reasonably fixed for the past few years, while we've added
significant new user-facing capability to the system.

#### New Hires

Okay, how did we do *that*? Seven new engineering hires, who collectively raise
the sheer amount of engineering awesome around Stardog to new heights:

* **Jess Balint** (previously MySQL, Oracle) delivered BITES and is working on
  Virtual Graphs
* **Stephen Nowell** (previously BAH), who joins us from our services group, where
  he worked on NASA, to lock down tech support and work on the Stardog Web
  Console
* **Alex Toktarev** (previously NetCracker, Deutsche Bank, Hazelcast) is working
  on native memory management in Stardog
* **John Bresnahan** (previously Argonne, Red Hat, Dell) is working on cloud
  deployment and integration, including cluster management, as well as an
  unreleased (coming soon!) Stardog virtual appliance solution (codename
  "Starman") built with Golang
* **Paul Marshall** (previously Argonne, Rackspace, Dell) is also working on
  cloud integration and testing, including a
  Stardog-specific
  [Blockade](https://github.com/dcm-oss/blockade)/[Chaos Monkey](https://github.com/Netflix/SimianArmy/wiki/Chaos-Monkey) testing framework
* **Pedro Oliveira** (previously Stardog (!), Technicolor, Disqus) is working on
  search and spatial performance and was one of the first Stardog engineers
  originally before doing the "San Francisco thing" for a few years
* **Scott Fines** (previously NISC, Splice Machine) is working on distributed
  Stardog 6; he started on 2 January and got a PR accepted by 4
  January...clearly a slacker!

### Engineering Team

These great developers join an engineering team and technical staff of which I
could not be more proud:

* **Mike Grove** (founder), Stardog tech lead since the first commit; my first hire,
  ever, and that sure worked the fuck out!
* **Evren Sirin** (founder), a deep source of knowledge and insight who keeps
  everyone else running fast just to keep up--my second hire, ever.
* **Pavel Klinov**, whose integrity is exceeded only by his skill, ingenuity, and
  excellence of craft
* **Al Baker**, an experienced team lead and project manager 
* **Michael Soren**, the most maintenance-free developer I've known
* **Greg Coluni**, comes to us from working on DOD systems, and who has everything
  he touches on lockdown
* **Kate Belisle**, our data scientist of the frozen north, who's working next-gen
  R&D 
* **Kevin Long**, a stalwart project manager who did amazing work at NASA and in
  the oil & gas industry before coming to us

### Sales Progress

We also made big progress on the revenue side of the business. We moved from
perpetual licensing to annual subscription model in early 2016 and that
transition went much more smoothly than I could have guessed.

While it is somewhat artificial, given the new baseline, our MRR increased by
about 4,500% this year. Two hires on the sales team were key here:

* **Jonathan Doan** (previously Visual Sciences, Omniture, Limelight, eXelate,
  Tealium) is running global sales and has brought a new level of experience and
  professionalism to our enterprise sales game
* **Mark Wood** (previously Visual Sciences, Limelight, Tealium) is running EMEA
  enterprise sales and is, or so he claims, distantly related to British
  monarchy

## Previewing 2017

### Product Roadmap

We're working on improving Stardog every day. From a software engineering
perspective, we intend to return to the previous release pace, which was our
historic norm, of about 2 releases per month.

From a product management perspective, we are working on improving the user
experience and the power of Stardog by focusing on

* query performance (always)
* stability, especially in memory pressure situations, and in the cluster
* transacted writes performance
* scalability; look for big changes in 2017 here
* Stardog Studio (codename "Magnetar"), a native app for using, managing, and
   implementing Stardog

We will also be experimenting with our go-to market strategy. Maybe 30-day
evaluations should be 45-day evaluations. What is the right mix of features for
Stardog Developer, Enterprise, and Community? Should we have a non-commercial
variant? We need to be very deliberate this year about finding an increasingly
more efficient set of strategies and processes around how people evaluate and
learn Stardog.

### More New Hires

We're making more new hires this year including another East Coast sales rep, as
well as two front-end engineers to focus on Magnetar.
Please [get in touch](mailto:inquiries@stardog.com) if you are interested.

### Marketing? Yeah, Marketing!

To date, we've never spent a penny on marketing, advertising, etc. I don't say
that to brag, because it's surely nothing to brag about. I say it because,
first, it's true and, second, it's interesting. All of our revenue growth to
date has been organic, inbound growth. 

The goal in 2017 is twofold: to increase organic, inbound growth dramatically by
actively marketing Stardog as *the* solution to enterprise data unification; and
to learn how to tell the Stardog story in an outbound sales process that
complements our organic growth.

## Conclusion 

**What do we know?** We improve Stardog every day, both as a product and as a
business, and we can attribute that growth to three facts:

1. it solves a real need--data unification--that every big organization in the
   world has in spades
1. it solves that problem in a way unlike any other enterprise offering
1. the people responsible for the first two facts are very good at what they do
   and very passionate about doing it

**What should we do?** Insist on excellence from ourselves and help to elicit it
from others, too. Improve the product and the user experience *every single
day*. No zero days here. Kaizen forever, my people!

**What can we hope?** That markets are rational? Hmm, no, scratch that. We can
hope for more good breaks than bad and that political instability around the
globe diminishes instead of increases. And we can hope for opportunities every
day to tell people the Stardog story.

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
