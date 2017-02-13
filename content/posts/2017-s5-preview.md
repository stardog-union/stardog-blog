+++
title = "Reactive, Streaming Stardog Kernel"
date = "2017-01-17" 
author = "Mike Grove"
draft = true
categories = ["kernel", "API"]
series = ["Reactive Stardog"]
discourseUsername = "mike"
+++

core server rewrite from Nettty to Undertow
rewritten Virtual Graph system using Apache Calcite
push button AWS cluster deployments with Stardog Graviton
deeper Cloud Foundry integration
better performance & scalability across the board:
query hints
improved query engine: new stats, grace hash joins, etc
native memory management
HA Cluster
search & geospatial
Stardog 5 will be the fastest, most scalable Knowledge Graph platform available anywhere.

The Stardog kernel API is morphing into a system based asynchronous, reactive
streams; in this post we discuss motivations and design goals.<!--more-->

## Background

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
