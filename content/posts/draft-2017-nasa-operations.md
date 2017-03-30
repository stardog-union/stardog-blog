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
a long-running production Stardog environment look like? Let’s take a look at 
our development process and how it flows across a series of Stardog servers.

Stardog integrates with ease into the NASA IT environment, where we run the Stardog
server on a number of secured and monitored virtual machines aligned with the 
NASA NPR 7120 workflow for system development. This includes:


* Development Environment that relaxes some security restrictions
* Testing Sandbox, which is a copy of production
* Production, which maintains uptime and data availability
* Training, which mirrors production in software but not data

## Our Development Workflow

Let's take a look at each of the major development stages, 
some of the tools we've used in each stage, and helpful notes on how to 
use Stardog in that particular environment.

### Development

Our team develops on Mac machiness, where we follow the [Stardog Quick Start Guide](https://docs.stardog.com/#_linux_and_osx) and typically run visualization applications in 
a vanilla Tomcat distribution. Name a Stardog language binding or API and we've used it -
at NASA they use a variety of tools.  Like many web based database applications, we faced
the question of what data do we keep in the local environment, how do we use that for developing,
and what does it mean for testing? To keep the local Stardog instances clean of sensitive
government data, we created a Stardog database generator that includes the ontology
and generates sample data that we expect to find in the live system.  We call this our reference data set, and we maintain it like we would any other source file in development.  Since there
are a number of data sources, we create mock XML web services, CSV, and Turtle generators
that are picked up by the ETL middleware and loaded into Stardog.  Any bugs found in
production make their way back to these database generators so we can always have a clean, valid,
reproducible environment.  These data sets also serve as our unit test data set, and
the Stardog servers can be loaded, tested, and then wiped with each iteration.  There are several tools we've used for generating the reference data set:

* [Stardog CSV as a Virtual Graph](https://docs.stardog.com/#_csv_as_virtual_graph) for CSV files that we expect to be maintained
* [CSV2RDF](https://github.com/clarkparsia/csv2rdf) for one time conversions 
* [Groovy Scripts](https://github.com/stardog-union/stardog-groovy) for quickly converting data from other systems
* Static RDF files committed in git, and loaded into Stardog with a cron job


Once local development is finished, we move on to the shared environment, 
with similar security restrictions as in production, but enough access to 
run several Stardog servers, applications, and visualizations to develop and test. 
If we compare a local development environment Stardog to the development server, the application is almost agnostic.
In general, an application that uses Stardog needs only the database name, credentails, and server address (host/port).
In this environment, our preference is always to have a test version of external systems accessible,
so we move from "mock" services/systems to live test data here.  
All of our applications take advantage of reasoning, so we always leave that turned on in the applications.
In some of the applications, we source this configuration with frameworks like
Spring or Grails, and in others we pass it in via the command line.


### Test

After using the development sandbox, we move on to testing in the production-like test server.
This Testing Sandbox instance is hosted in an environment similar to production, and includes production authentication and authorization facilities.
This is also the environment where a formal test execution cycle takes place and
all external system dependencies must be satisfied with real test systems - no mocks allowed!
One of our favorite tools to use is [Geb](http://www.gebish.org/) 
with [Spock](http://spockframework.org/) for automating UI testing.
Since each UI interaction typically generates a SPARQL query, we will turn on query logging.
A test run can then include information from the tests, the application under test, and the Stardog queries that ran.
To configure query logging, add the following properties `stardog.properties` in `$STARDOG_HOME`:

```
logging.slow_query.enabled=true
logging.slow_query.time=0s
```

As a NASA system, the test results go into an operational readiness review for approval prior to deployment in production.
We do include Stardog upgrades in this readiness review cycle for major upgrades. 
Additionally, the sandbox is configured to be within scope of security screens and audits, so any
changes that may impact the security posture of the system are covered here.

Per best practices, we run the Stardog server with a special user ID (UID) on Linux, different from that used by users and other servers.
The `$STARDOG_HOME` directory, software and log files are also owned 
by this special UID. We also created a distribution specific system startup script to start 
the Stardog server when the system starts up, and to shut it down when the system shuts
down. Here's the code:

```bash
#!/bin/bash

# This is startup script for stardog server to be executed during system startup
# (e.g., to be put in /etc/init.d together with other startup scripts)

##########################################################################
# IMPORTANT!!!                                                           #
# Replace the values below with the right values for your configuration  #
##########################################################################

# SCF:
# chkconfig: 35 99 01
# description: Starts and Stops the Stardog graph database

# Run stardog as the specified user
USERNAME=stardogdb

# path to the Stardog installation
STARDOG_HOME=/opt/stardog-4.2.4

# path to the directory where stardog CLI script is located
STARDOG_BIN=$STARDOG_HOME/bin

# specify port where server will be listening
PORT=5820

# Extra options for SCF
SCF_EXTRA_OPTS=""

# Path to bash
BASH=/bin/bash

start()
{
  echo "Starting stardog"
  su $USERNAME -l -c "cd ${STARDOG_HOME} && $BASH ${STARDOG_BIN}/stardog-admin server start $SCF_EXTRA_OPTS --port $PORT --home $STARDOG_HOME"
}

stop()
{
   echo "Stopping stardog"
   su $USERNAME -l -c "$BASH ${STARDOG_BIN}/stardog-admin server stop"
}

case "$1" in
    start)
        start
        ;;

    stop)
        stop
        ;;

    restart|reload)
        stop
        start
        ;;

    *)
        echo "Usage: $0 {start|stop|restart}"
        exit 1;
esac
```

At NASA (as in most installations), ports other than well known http
(80)/https (443) ports are closed to external access for security reasons.
To allow external clients to access and query the Stardog server, which
listens on port 5820 by default, we have configured a secure web application to
proxy traffic between the https port (443) and the Stardog server port (5820).
Although the proxy changes the port to access, interacting with Stardog is still via HTTP.
Over the years, we've tested Stardog with many different security proxies, firewalls, and connectors,
and haven't found any issue with sending a query to Stardog or getting results back.
The only configuration item to be aware of is HTTP
[content negotiation](https://docs.stardog.com/#_http_headers_content_type_accept), since the result formats returned by Stardog follow the specified standard.


### Production and Sustainment

Procedures exist for periodically upgrading the application features as well as
the Stardog database and other supporting components. We’ve
upgraded from Stardog 2.x to Stardog 4.x, all without an issue. Before new
versions of the software are deployed, the applications and Stardog database are
stopped, and all components and the database are [backed up](https://docs.stardog.com/man/db-backup.html). 
The application software is then upgraded, as well as the Stardog server and 
other components as necessary. The database and applications are restarted, and a smoke test is
performed to verify everything is working as it should. We coordinate the final deployment 
to production with relevant external systems, so everyone tests and verifies together.
To verify the data relationships, we use multiple custom reports with Stardog’s SPARQL query directly generating CSV
files, custom application reports, and ICV queries to confirm the data pedigree. 

A "training" instance is provided so that users can test and try out application
features without worrying about changing or deleting production data.
Our team performs usability testing, demonstrations, and initial training to new
users in this environment, so users can transition seamlessly into production
usage. The training, sandbox, and production systems can all go through the same
backup and restore procedures, using the private cloud facilities of the center.

In the production environment, we proactively monitor the state and health of
the applications and Stardog database. Infrastructure monitoring software called Nagios is deployed
to monitor the applications, services, operating systems, and network, and to collect system
metrics. Again, thanks to Stardog’s use of HTTP and JMX, standard tools and
monitors can be configured out of the box. There are several queries we like to 
test to assert readiness of the system:

* `GET address:port/database/size` for the size of the database, and rules on minimum value. 
* `GET address:port/database/query` for the standard SPARQL endpoint
* Complex SPARQL query, i.e. one with reasoning over data from multiple systems


When monitored in aggregate with the application, external systems, and Stardog monitors, the monitoring
system can provide accurate information on when and where problems arise. Typical monitoring 
agents are also setup for each hardware/software component on the system to check
the health of the servers and verify their availability. In addition, custom
security software performs security scans periodically to detect system
vulnerabilities, and ensure the applications properly respond to malicious
attacks and intrusions.  

## Conclusion 

Adopting Stardog into a development and deployment cycle is straightforward, and
even folks new to the project quicky feel at home with Unix-friendly command lines,
HTTP services, and industry standard application deployments.  The addition of Virtual Graphs
into Stardog makes system to system integration easier than ever, and there are many tools for 
systems with proprietary APIs or formats that you want promoted in the graph.  We've 
worked with many teams across data centers, and Stardog fits quite naturally into their environments.  


