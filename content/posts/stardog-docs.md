+++
date = "2016-07-22T15:05:23-04:00"
draft = true
author = "Kendall Clark and Jess Balint"
title = "Unifying Unstructured Data"
+++

Our mission is to unify all enterprise data in a single, coherent graph served
by Stardog, which includes, crucially at some organizations, *unstructured
data*. Let's preview some new features coming in Stardog to make unstructured
data unification with Stardog much easier. <!--more-->

## Documents & Databases

In the enterprise data is everywhere. Some of it is unstructured, free text of
the sort that's in every business document ever written or generated. Typically
you don't really care whether some fact you need to do your job exists in a
document or in some database. You just need access to the fact or, increasingly,
some software process or system needs to access that fact to perform some
analytic or calculation.

Since our mission is to unify *all* enterprise data, we can't ignore the
billions of enterprise documents that contain vital information.

## Making Stardog Smart about Documents

Of course Stardog is already really smart about unifying structured and
semistructured data using capabilities like Virtual Graphs. So we asked
ourselves and some of our customers what we could do to make it easier to unify
unstructured data, too. The key point here is that data from documents and data
from databases (or other structured sources) should appear in the Stardog graph
on an equal footing.

Facts are facts. Data is (or, if you prefer correctness, are) data. All Stardog
services and capabilities will just work over graphs of entities, their
properties and relations, seamlessly whatever their ultimate origin or source.

But Stardog will also store and manage documents, search documents, and process 
documents.

### Search Documents

Stardog's search system ... blah blah ... 

Extract "explicit metadata", too.

### Process Documents

At a very high level, the state of the art is to extract---using NLP, text
mining, machine learning, etc.---*structured and semistructured* data from
documents and store that data in the graph, together with a connection to the
original document and some of its metadata. 

Since "extraction algorithms" of this type work best when they are trained on
(or otherwise take advantage of) *your data*, we also need to support hooks to
call *your NLP or mining pipeline* and then store the data that it returns in
Stardog. The best NLP is *NLP specific to the document corpus in question*,
which means that in Stardog optimal exraction or mining of your documents is on
your side of the line.

### Store & Manage Documents

Think of this as out-of-band blob storage. Stardog will support an HTTP service
for storing and retrieving documents. Docs are not stored *in* the graph
(because that's silly) but, rather, in AWS S3, HDFS, or local file system.

Since NLP and text mining are lossy, imperfect techniques, in some use cases the
original document context, from which structured data has been extracted, should 
be retrievable for human inspection later on.

If you don't need Stardog to manage the documents you send to it for processing,
it's completely optional.

### What's Next

Our mission is to unify *all* enterprise data. To do that we're adding support
for document handling to the next major release of Stardog.

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
