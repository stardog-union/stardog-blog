+++
Title = "Stardog Rocks...Db!"
date = "2017-05-12"
categories = ["Storage", "Concurrency"]
author = "Scott Fines"
draft = true 
discourseUsername = "scott"
+++

This is my new, sexy lede.<!--more-->

## Background

## RocksDB

So if we are going to use an LSM tree, what tree should we choose? We could, of
course, write our own, but there are a number of existing LSM tree
implementations which are modular enough for us to make use of without requiring
that we write tons of logic. The most useful of these is RocksDB(<!-- link -->).
Based on the prior work of LevelDB(<!-- link -->) , the engineers at Facebook
created RocksDB to be a high-performance LSM tree implementation that can be
embedded in most any system, including Java systems like Stardog. This saves us
a bunch of work in ensuring that the physical disk writing is safe and
uncorrupted, and allows us to focus on optimizing how Stardog makes use of the
LSM tree, and improving Compactions in order to reduce the tuning required by
our customers in the end.

Of course, RocksDB is lacking a few features that we would like to see, so it is
reasonable to assume that we'll be digging into its guts significantly over the
next few months, as we move from our current storage engine over to an LSM-Tree
based storage engine.

## Rocks features we get for free etc
