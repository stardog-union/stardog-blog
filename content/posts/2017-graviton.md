+++
title = "Stardog Graviton: AWS Made Easy"
date = "2017-01-26"
author = "John Bresnahan"
draft = false 
series = [""]
categories = ["AWS", "cloud", "cluster"]
+++

We think the user experience is crucial, even when dealing with something as
complex as a highly available cluster system. So we made Stardog Graviton.<!--more-->

[Stardog Graviton](https://github.com/stardog-union/stardog-graviton) compiles
to a single binary executable that lives on a client machine and provides a
"one-click virtual appliance" installation for Stardog HA Cluster.

It leverages the power
of [Amazon Web Services](https://aws.amazon.com/) to deploy, configure, and
launch all of the virtual hardware and software needed for an optimal Stardog
cluster deployment. All you have to provide is the AWS account.

{{% figure src="/img/rocks.jpg" class="inliner" %}}

**TLDR**: We made Graviton so that Stardog on AWS would be easy. We made it
Apache-licensed so it could be extended to other cloud environments.

## Background

Getting a distributed application running can be a challenge. Whether it is to
operate a service in production, setup a test environment, or just kick the
tires many applications require quite a bit of complicated configuration. Often
one needs to know about dependencies
like
[Zookeeper](https://zookeeper.apache.org/), [Kafka](https://kafka.apache.org/),
or one of dozens of other amazing, yet nuanced
distributed computing subsystems. 

Even worse, the hardware (or virtual hardware) should be laid out in specific
ways in order to have an optimal deployment. These complications often force
customers to become experts in a system far before they are certain that they
want to use it in production. 

**Graviton solves this problem.** Read on and I'll tell you how.

## Workflow

Here we describe the typical workflow when using Graviton. It is broken down
into steps to give you a better understanding of what is going on under the
hood. When Graviton runs, these steps are inferred from the current state and
then---unless otherwise specified---automatically run via a single command. If
any additional information is required the user will be prompted.

1. **Create the base VM image (AMI).** In this step a base AMI is created and
 associated with your AWS account. A version of Stardog will be burnt into this
 image along with all of the other software dependencies (Zookeeper, etc).
 Neither any of your secrets nor your Stardog license key will be associated
 with it.
 
2. **Create a deployment.** In this step, the size of the Stardog cluster (i.e., the
 number of nodes) is selected and
 an [Elastic Block Store (EBS)](https://aws.amazon.com/ebs/) volume is
 associated with each one. The volume is formatted and the requisite Stardog
 license is placed on the volume.
 
3. **Launch the cluster.** This step gets the cluster running. It starts
 [Elastic Load Balancers](https://aws.amazon.com/elasticloadbalancing/),
 [Auto Scaling Groups](https://aws.amazon.com/autoscaling/), and other AWS
 components used in the cluster deployment. It runs all the needed discovery and
 configuration to get the Stardog nodes talking to each other and to the
 Zookeeper cluster. Each node of both Stardog and Zookeeper will be monitored
 for health. If they are ever unhealthy for too long, then the VM in question
 will be killed and restarted.
 
This sounds like quite a bit more than a "one-click" setup. And it is! There is
quite a bit going on behind the scenes, but Graviton just requires the user to
simply run a command, answers a few questions, and *then be ready to start
unifying all the things...*

{{% figure src="/img/zero.jpg" class="inliner" %}}

## Running Graviton 

Because Graviton is a single (Golang!) executable, running it is very easy; however, there
are a couple of minor dependencies.

1. An AWS account and query token pairs that allow access to it. Details
on how to create these credentials can be
found
[here](http://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey).
Once you have obtained them you must set environment variables as shown below:
``` 
export AWS_ACCESS_KEY_ID=<aws access key>
export AWS_SECRET_ACCESS_KEY=<a valid aws secret key>
```

2. The programs [terraform](https://releases.hashicorp.com/terraform/0.7.9/)
 and [packer](https://releases.hashicorp.com/packer/0.10.2/) must be in your
 system path. They are also single file executables so this should not be too
 painful.
  
3. A Stardog license. Free trial
 licenses are available [here](http://stardog.com/#download).

Once those are in place build Graviton as described
[here](https://github.com/stardog-union/stardog-graviton/blob/master/README.md) 
and run it.  (A single executable beta release will be available soon).

A sample session might look something like this...
```
$ ./bin/stardog-graviton launch mystardog
What version of stardog are you launching?: 4.2
What is the path to the Stardog release?: 
There is no base image for version 4.2.
Do you wish to build one? (yes/no): yes
| Running packer to build the image...
done
AMI Successfully built: ami-0a1d486a
Creating the new deployment mystardog
EC2 keyname (default): stardog
Private key path: /Users/bresnaha/.ssh/stardog
What is the path to your Stardog license?: 
| Calling out to terraform to create the volumes...
- Calling out to terraform to stop builder instances...
Successfully created the volumes.
\ Creating the instance VMs...
Successfully created the instance.
Waiting for stardog to come up...
/ Waiting for external health check to pass...
The instance is healthy
Stardog is available here: http://mystardogsdelb-682913646.us-west-1.elb.amazonaws.com:5821
ssh is available here: mystardogbelb-1558182568.us-west-1.elb.amazonaws.com
The instance is healthy
Coordinator:
   10.0.100.6:5821
Nodes:
   10.0.101.168:5821
   10.0.100.243:5821
Success.
```

## Architecture


Ultimately the user of Graviton doesn't need to know anything about the
deployment other than Stardog's URL, but because it is always helpful to
understand how the lower layers work, we will describe the architecture here.

### Availability Zones (AZ)

[Availability Zones](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html#concepts-regions-availability-zones) are
a concept in AWS that provide some failure protection. The general practice is
to have each replicated node in a cluster run in a different AZ and thus if that
zone fails the entire application is not affected. When a Graviton deploys a
Stardog cluster it distributes all requested Stardog and Zookeeper nodes across
all AZs in a given region.

### Elastic Block Store (EBS)

One EBS volume is associated with each Stardog node and created in that node's
AZ. The volume has a longer life cycle than the Stardog node. If that node fails
and is restarted, or the deployment is paused, then no data is lost.

{{% figure src="/img/cubes.jpg" class="inliner" %}}

### Elastic Load Balancers (ELB)

ELBs are used in two ways. The first is, as you would expect, as a traditional
load balancer. A customer is presented with a URL for the application.
That URL points to the load balancer and the load balancer fans requests out to the
replicated Stardog nodes.

Because the set of Zookeeper nodes needs to be static, we also use ELBs in a
second way. They add a layer of indirection that makes each node in an
auto-scaling group reliably addressable, even when their IP addresses change.

### Autoscaling Groups (ASG)

ASGs are a crucial part of the deployment. While ASGs can be assigned policies
to add or remove nodes from a clustered application, Graviton uses then to
simply preserve *N* nodes. The ASG in conjunction with the ELB monitor the health
of each node. If the node is determined to be unhealthy for too long, the virtual
machine is terminated and a new one is started in its place. This auto detection
allows for the stable, highly-available cluster to be maintained hands-free.

## Conclusion

Graviton orchestrates a variety of cloud services in order to deploy and
configure a highly-available Stardog cluster. This is a nuanced and complicated
process, but to Graviton users it's a simple CLI app that launches a stable
database in the cloud.

A video demonstration of Graviton is available
[here](https://www.youtube.com/watch?v=TnzGMqj5rJI) (note that at the
time the video was created we had not yet named the software).

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
