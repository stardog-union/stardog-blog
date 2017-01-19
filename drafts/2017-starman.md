# Starman: The Stardog Virtual Appliance

Getting a distributed application running can be a challenge.
Whether it is to operate a service in production, setup a test environment, or
just kick the tires many applications require quite a bit of complicated
configuration.  Often times one needs to know about dependencies like
[Zookeeper](https://zookeeper.apache.org/) , [Kafka](https://kafka.apache.org/),
or one of dozens of other amazing, yet nuanced
distributed computing subsystems.  Further, the hardware (or virtual hardware)
must be laid out in specific ways in order to have an optimal deployment.
These complications often force customers to become experts in a system far
before they are even certain that they want to use it in production.

At Stardog Union the user experience is very important to us.  We want
our highly available cluster as easy to deploy as possible.  For this reason
we will soon be offering Starman.  Starman is a single binary executable that
lives on a client side machine and provides a "one-click virtual appliance".
It does this by leveraging the power of
[Amazon Web Services](https://aws.amazon.com/) (more cloud drivers coming 
soon!) to deploy, configure, and launch all of the virtual hardware and
software needed for an optimal Stardog cluster deployment.  All the customer
needs to provide is the AWS account.

## Workflow

Here we will describe the typical workflow when using Starman.  It is broken
down into steps to give the reader a better understanding of what is going on
under the hood, however when Starman runs these steps are inferred from
the current state and, unless otherwise specified, automatically run via a
single command.  If any additional information is required the user will be
prompted.

1. Create the base VM image (AMI).  In this step a base AMI is created and 
 associated with your AWS account.  A version of stardog will be burnt into
 this image along with all of the other software dependencies (Zookeeper etc)
 however no secrets nor your license will be associated with it.
 
2. Create a deployment.  In this step the number of stardog nodes is selected
 and an [Elastic Block Store (EBS)](https://aws.amazon.com/ebs/) volume is
 associated with each one.  The volume is formatted and the needed Stardog
 license is placed on the volume.
 
3. Launch the cluster.  This step gets the cluster running.  It starts up
 [Elastic Load Balancers](https://aws.amazon.com/elasticloadbalancing/)
 [Autoscaling Groups](https://aws.amazon.com/autoscaling/) and other AWS
 components.  It runs all the needed discovery and configuration to have
 Stardog nodes discover each other and the Zookeeper cluster.  Each node of
 both Stardog and Zookeeper will be monitored for health.  If they are ever
 unhealthy to too long the VM in question will be killed and restarted.
 
The above list sounds like quite a bit more than a "one-click" setup, and it is.
There is quite a bit going on behind the scenes but Starman makes it so that
the user simply runs the command, answers a few questions, and then is ready
to start unifying all the things!

## Running it

Because Starman is a single executable file running it is very easy, however
there are a couple of minor dependencies.

1. An AWS account and query token pairs which will allow access to it. Details
on how to create these credentials can be found
[here](http://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey). 
Once you have obtained them you must set environment variables as shown below:
```
export AWS_ACCESS_KEY_ID=<aws access key>
export AWS_SECRET_ACCESS_KEY=<a valid aws secret key>
export STARDOG_CLUSTER_PASSWORD=admin
```
2. The programs [terraform](https://releases.hashicorp.com/terraform/0.7.9/)
 and [packer](https://releases.hashicorp.com/packer/0.10.2/) must be in your 
 system path.  They are also single file executables so this should not be too
 painful.
  
3. A Stardog license.  If you are just kicking the tires you can get a free
 trial license [here](http://stardog.com/#download).

Once those are in place simply download (available soon!) the Starman executable 
that matches your operating system and run it.  A sample session is below:
```
$ ./bin/sdva launch mystardog
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
