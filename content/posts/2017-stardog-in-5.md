+++
title = "A Stardog App in 5 Easy Steps"
date = "2017-04-05"
categories = ["tutorial", "java"]
author = "Greg Coluni"
draft = false
discourseUsername = "gcoluni"
heroShot = "https://blog.stardog.com/img/5a.jpg"
+++

Stardog makes the Enterprise Knowledge Graph fast and easy. We're going to build
a Java app that talks to Stardog's RDF graph database in 5 easy
steps.<!--more-->

{{% figure src="/img/5a.jpg" class="inliner" %}}

1.	Download and install Stardog
2.	Create a Java project with Gradle
3.	Build a database
4.	Import data into the database
5.	Query and update the database

## 1. Download and Install Stardog

The first thing that we need to do is download and install Stardog. We will use
Linux. OS X would be very similar. If you would like to install on Windows,
the instructions are [available](http://docs.stardog.com/#_windows).

1.	Download Stardog [here](http://stardog.com/#download). Then unzip to a
      destination directory. We're using `/data/stardog`.

2.	Next we tell Stardog where its home directory is.

    ```shell
    $ export STARDOG_HOME=/data/stardog
    ```

3.	Copy `stardog-license-key.bin` into that location: 

    ```shell
    $ cp stardog-license-key.bin $STARDOG_HOME
    ```

4.	Start the Stardog server.

    ```shell
    $ /data/stardog/bin/stardog-admin server start
    ```

5.	Test that Stardog is running by
      visiting [`http://localhost:5820/`](http://localhost:5820/). Or you can do
      this instead:
      
      ```shell
      $ stardog-admin server status
      ```

## 2. Setup a Gradle Project

Now let's setup Gradle. Stardog components and subsystems are modular, so we can
use just the parts we need. For this post, we will start with a basic Gradle
configuration and add as we go. In this example we are just connecting to
Stardog over HTTP and the only dependency that we need is
`com.complexible.stardog:client-http:4.2.4`. The `build.gradle` is as follows:

```groovy
apply plugin: 'java'
apply plugin: 'application'

group 'com.stardog.examples'
version '1.0-SNAPSHOT'

repositories {
    maven { url "http://maven.stardog.com" }
    mavenLocal()
    mavenCentral()
}

dependencies {
    // Core Dependencies
    compile ('com.complexible.stardog:client-http:4.2.4')
}

mainClassName  = "com.stardog.examples.StardogClient"
```

Be honest: this is pretty simple stuff.

{{% figure src="/img/5b.jpg" class="inliner" %}}


## 3. Build a Database

We have Stardog installed and Gradle configured. Let’s start building our
database. The first thing is to create a connection to Stardog. This will allow
us to perform administrative actions such as creating a new database,
adding/removing data, etc.

We will use the `AdminConnectionConfiguration` utility to create the connection.
In the code snippet below, we create the `AdminConnectionConfiguration` by
specifying the server URL and user credentials. In this case, we are using the
default values--- 

* url = `http://localhost:5820`
* username = `admin`
* password = `admin`

Once connected, we will print out available databases, search for the database
we are about to create (just in case the code was run before), and create the
database on disk. 

```java
/**
 *  Creates a connection to the DBMS itself so we 
 *  can perform some administrative actions.
 */
public static void createAdminConnection() {
    try (final AdminConnection aConn = AdminConnectionConfiguration.toServer(url)
            .credentials(username, password)
            .connect()) {

        // A look at what databases are currently in Stardog
        aConn.list().forEach(item -> System.out.println(item));

        // Checks to see if the 'myNewDB' is in Stardog. If it is, we are 
        // going to drop it so we are starting fresh
        if (aConn.list().contains(to)) {aConn.drop(to);} 
        // Convenience function for creating a persistent 
        // database with all the default settings.
        aConn.disk(to).create();
    }
}
```

## 4. Import Data

Next it's time to import data and run queries against it. We need to create a
connection `ConnectionPool`. The `ConnectionConfiguration` will tell the pool
how to create the new connections. We then pass the `ConnectionConfiguration` to
the `ConnectionPoolConfig` as it is the basis of the pool. 

We can also provide additional detail about the pool such as min/max pool size,
expiration, and block wait time. We then create the pool and return so we can
start using it.


```java
ConnectionConfiguration connectionConfig = ConnectionConfiguration
        .to(to)
        .server(url)
        .reasoning(reasoningType)
        .credentials(username, password);
// creates the Stardog connection pool
ConnectionPool connectionPool = createConnectionPool(connectionConfig);  

/**
 * Now we want to create the configuration for our pool. 
 * @param connectionConfig the configuration for the connection pool
 * @return the newly created pool which we will use to get our Connections
 */
private static ConnectionPool createConnectionPool
                              (ConnectionConfiguration connectionConfig) {
    ConnectionPoolConfig poolConfig = ConnectionPoolConfig
            .using(connectionConfig)
            .minPool(minPool)
            .maxPool(maxPool)
            .expiration(expirationTime, expirationTimeUnit)
            .blockAtCapacity(blockCapacityTime, blockCapacityTimeUnit);

    return poolConfig.create();
}
```
{{% figure src="/img/5c.jpg" class="inliner" %}}

After we get a Stardog connection, we will use it to populate our database.
Changes to a database must occur within a transaction; i.e., `begin` followed by
`commit` or `rollback`. Changes are not visible to others until the transaction
is committed or until you perform a query operation to inspect the state of the
database within the transaction.

We will use `begin` and `commit` for import. Below is a snippet of that data
that we are importing followed by the code to import it. As you can see we
perform the begin, add the data by importing the file, and finally commit the
transaction.

```turtle
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

:incredibleHulk rdf:type foaf:Person ;
	foaf:name "Robert Bruce Banner"^^xsd:string ;
	foaf:title "Incredible Hulk"^^xsd:string ;
	foaf:givenname "Robert"^^xsd:string ;
	foaf:family_name "Banner"^^xsd:string ;
	foaf:knows :captainAmerica, :blackWidow, :thor, :ironMan .
```

Adding the data is easy, too.

```java
// first start a transaction. This will generate the contents of 
// the databse from the N3 file.
connection.begin();
// declare the transaction
connection.add().io()
                .format(RDFFormat.N3)
                .stream(new FileInputStream("src/main/resources/marvel.rdf"));
// and commit the change
connection.commit();
```

## 5. Query the Database

Since we have a populated database we will use the obtained Stardog connection
to query. We first create the SPARQL select statement and store it in the
`SelectQuery`. We then execute the query and store the result set in the
`TupleQueryResult` object. The result set can be used for many different
purposes. We are just going to print it to the console using `QueryResultIO`.

```java
// Query the database to get our list of Marvel superheroes 
// and print the results to the console
SelectQuery query = connection.select("PREFIX foaf:<http://xmlns.com/foaf/0.1/> 
  select * { ?s rdf:type foaf:Person }");
TupleQueryResult tupleQueryResult = query.execute();
QueryResultIO.writeTuple(tupleQueryResult, 
                         TextTableQueryResultWriter.FORMAT, System.out);
```

And the results:

```
+---------------------------------------+
|                   s                   |
+---------------------------------------+
| http://api.stardog.com/incredibleHulk |
| http://api.stardog.com/captainAmerica |
| http://api.stardog.com/blackWidow     |
| http://api.stardog.com/thor           |
+---------------------------------------+
```

We can add and remove data using the API statements feature. Just like the
initial data import transaction, we will use the begin and commit options to
update the database. We add `IronMan` to the list of superheroes and then we
will remove all references to `CaptainAmerica`. 

{{% figure src="/img/5d.jpg" class="inliner" %}}

As you can see in the add, we have `IronMan` as the subject for all the
statements while using different FOAF objects for the predicate and either a
FOAF object, literal, or another superhero as the object. In the remove
statement, we are removing all instances where `CaptainAmerica` is either the
subject or the object.

```java
// first start a transaction - This will add 
// Tony Stark A.K.A Iron Man to the database
connection.begin();
// declare the transaction
connection.add()
        .statement(IronMan, RDF.TYPE, FOAF.PERSON)
        .statement(IronMan, FOAF.NAME, literal("Anthony Edward Stark"))
        .statement(IronMan, FOAF.TITLE, literal("Iron Man"))
        .statement(IronMan, FOAF.GIVEN_NAME, literal("Anthony"))
        .statement(IronMan, FOAF.FAMILY_NAME, literal("Stark"))
        .statement(IronMan, FOAF.NICK, literal("Tony"))
        .statement(IronMan, FOAF.KNOWS, BlackWidow)
        .statement(IronMan, FOAF.KNOWS, CaptainAmerica)
        .statement(IronMan, FOAF.KNOWS, Thor)
        .statement(IronMan, FOAF.KNOWS, IncredibleHulk);
// and commit the change
connection.commit();

// Query the database again to see if any of Thor's friends 
// are not listed in the database and print the results to the console. 
// There should be no results in the query since we added Iron Man.
query = connection.select("PREFIX foaf:<http://xmlns.com/foaf/0.1/> 
   select * {<http://api.stardog.com/thor> foaf:knows ?o .\n" +
        "          filter not exists {?o rdf:type foaf:Person . } \n" +
        " } ");
tupleQueryResult = query.execute();
QueryResultIO.writeTuple(tupleQueryResult, 
                         TextTableQueryResultWriter.FORMAT, System.out);

// first start a transaction - this will remove 
// Captain America from the list where he is either the subject or the object
connection.begin();
// declare the transaction
connection.remove()
        .statements(CaptainAmerica, null, null)
        .statements(null, null, CaptainAmerica);
// and commit the change
connection.commit();
```

If we run the query to get the list of Marvel superheroes we can
see the results. The updated query result set is now:

```
+---------------------------------------+
|                   s                   |
+---------------------------------------+
| http://api.stardog.com/incredibleHulk |
| http://api.stardog.com/blackWidow     |
| http://api.stardog.com/thor           |
| http://api.stardog.com/ironMan        |
+---------------------------------------+
```

Finally, we must remember to release the connection that we obtained to perform
our tasks and shutdown the connection pool.

```java
connectionPool.release(connection);
connectionPool.shutdown();
```

{{% figure src="/img/5e.jpg" class="inliner" %}}

## Conclusion 

I showed you how to install Stardog on a Linux environment, create an
administration connection in order to perform administrative actions, create a
connection pool to the database, and use a connection from the pool to perform
transactions and queries. 

In my next post I'll expand on more of the features that Stardog has to offer as
well as provide an example on how to wire a Stardog client using Spring. The
full version of the code we've discussed here is in
the
[stardog-examples repo on Github](https://github.com/stardog-union/stardog-examples/tree/develop/weblog/stardog-client).

