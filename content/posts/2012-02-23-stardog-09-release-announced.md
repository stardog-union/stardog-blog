+++
title = "Stardog 0.9 Release" 
date = "2012-02-23"
author = "Kendall Clark"
+++

We're happy to announce the release of **Stardog 0.9**, the first
*feature-complete* version of Stardog.<!--more--> Please
[download](http://stardog.com/) it and send feedback to the
[support forum](https://groups.google.com/a/clarkparsia.com/group/stardog/about).

Notable changes in this release:

*  new security system, including user management, granular roles and permissions model
*  new native protocol, SNARL, based on Netty and Google's Protocol Buffers 
*  new system catalog for all system info, metadata, etc.
*  new search system over RDF literals, integrated with SPARQL query eval
*  new server management: online, offline databases; better server startup, shutdown, and locking
*  CLI now supports remote db administration, many new subcommands
*  new Quartz-based job scheduler with cron expression scheduling
*  new, optimized index support for named graphs and triples-only databases
*  new, differential write indexes with customizable merge thresholds 
*  new statistics computation & recomputation algorithms
*  new customizable TBOX (i.e., reasoning schema or ontology) extraction & management
*  new Stardog configuration system, including database creation templates
*  new reasoning services (explanation, satisfiability, consistency checking) available programmatically
*  reasoning extended to named graphs
*  ICV validation extended to named graphs
*  new or improved support for NQUADS, Trig, TSV, and CSV
*  improved concurrency in data loading
*  consistent use of <tt>mmap()</tt> for better performance
*  load GZIP-compressed files directly, including ZIP files with multiple RDF
*  many (many!) known bugs fixed
*  updated documentation

The upcoming 0.9.x releases will focus on query and reasoning
performance improvements and bug fixes. We anticipate several point
releases before the final 1.0 release. Thanks to all the *closed
alpha* testers for their hard work: about 200 of them downloaded
Stardog, sent bug reports, fixes, ideas, and feedback.
