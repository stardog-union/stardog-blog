+++
title = "Stardog at NASA"
date = "2017-03-22"
categories = ["case study", "nasa", "cloud"]
author = "Michael Soren"
draft = true
discourseUsername = "msoren"
+++

One of our oldest running Stardog deployments is NASA, which has had a Stardog
server running since 2013. Out at the NASA AMES Research Center Supercomputing
Facility, our team runs several virtual machines in one of their cloud
environments to support the SLS, Orion and GSDO engineering community. What does
a long-running production Stardog environment look like? Let’s take a look.

We run a production application on combination public internet and government
intranet facing site. To support the production application, we run several
instances of Stardog and the application:

* Production, which maintains uptime and data availability
* Testing Sandbox, which is a copy of production
* Training, which mirrors production in software but not data
* Development Environment

Development starts in a shared environment, with similar security restrictions
in place to production but enough access to run several Stardog servers,
applications, and visualizations to develop and test. Developers build new
features, enhancements and bug fixes on a separate development instance over
which they have total control: the Stardog database can be started, stopped,
loaded, erased, and configured in any way required by the developer. Our team
configures the development server with similar surrounding software, such as web
containers, proxies, and other services similar to production but without the
severe access restrictions. Typically, we will run a local Stardog on individual
workstations, and then move to the shared development environment to confirm no
environment specific changes impact the application.

Once developers are satisfied their changes are correct and unit testing is
complete, they can use a more production-like "sandbox" instance to test and
verify their delivery. This "Testing Sandbox" instance is hosted in an
environment similar to production, and includes production authentication and
authorization facilities. This is also the environment where a formal test
execution cycle takes place. As a NASA system, the test results go into the
operational readiness review for approval to deploy to production.

A "training" instance is provided so that users can test and try out application
features without worrying about changing or deleting production information. Our
team performs usability testing, demonstrations, and initial training to new
teams in this environment so users can transition seamlessly into production
usage. The training, sandbox, and production systems can all go through the same
backup and restore procedures, using the private cloud facilities of the center.

Our team sets up several special configuration items when running Stardog in a
production environment. Per Linux best practices, the Stardog server runs with a
special user ID (UID), different from that used by users and other servers. We
also created a distribution specific system startup script to start the Stardog
server when the system starts up, and to shut it down when the system shuts
down. At NASA (as in most installations), ports other than well known http
(80)/https (443) ports are closed to prevent external access for security
reasons. To allow external clients to access and query the Stardog server, which
listens on port 5820 by default, we have configured a secure application to
proxy traffic between the https(443) port and the Stardog server. The NASA
applications and data visualizations that use this Stardog instance all utilize
the HTTP protocols, so the administration team configures additional security,
firewall, and routing features transparent to the Stardog servers.

Procedures exist for periodically upgrading the application features as well as
the Stardog database and other supporting components. Over the years, we’ve
upgraded from Stardog 2.x to Stardog 4.x, all without an issue. Before new
versions of the software are deployed, the application and Stardog database are
stopped, and all components and the database are backed up. The application
software is then upgraded, as well as the Stardog server and other components as
necessary. The database and application are restarted, and a smoke test is
performed to verify everything is working as it should. In many cases, Stardog
uses data from other systems, so these interfaces go through the development to
sandbox to production pipeline as well. To verify the data relationships, we use
multiple custom reports with Stardog’s SPARQL query directly generating CSV
files, custom application reports using various programming languages, and ICV
queries to confirm the data pedigree.

In the production environment, we proactively monitor the state and health of
the applications. Infrastructure monitoring software called Nagios is deployed
to monitor the applications, services, operating systems, network and system
metrics. Again, thanks to Stardog’s use of HTTP and JMX, standard tools and
monitors can be configured out of the box. The Nagios configuration delivers
alerts when potential threats arise, so action can be taken as quickly as
possible. Periodic requests directed at each hardware/software component check
the health of the servers and verify their availability. In addition, custom
security software performs security scans periodically to detect system
vulnerabilities, and ensure the applications properly respond to malicious
attacks and intrusions.

