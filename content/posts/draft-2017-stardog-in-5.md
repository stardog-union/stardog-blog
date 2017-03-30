+++
title = "Stardog Apps in 5 Easy Pieces"
date = "2017-03-22"
categories = ["tutorial", "java"]
author = "Greg Coluni"
draft = true
discourseUsername = "gcoluni"
+++

Stardog makes the Enterprise Knowledge Graph fast and easy. Let's see how easy
it is to create a client application that communicates with Stardog using Java
and Gradle. Our five easy pieces:

1.	Download and Install Stardog
2.	Create a Java project with Gradle
3.	Build a database
4.	Import data into the database
5.	Query and update the database

## 1. Download and Install Stardog

Obviously the first thing that we need to do is download and install Stardog. We
will use Linux here; OS X would be very similar. If you would like to install on
Windows, the instructions are available at http://docs.stardog.com/#_windows.

1.	The Stardog download is located at http://stardog.com/#download. Once downloaded, unzip to a destination directory, in this example, '/data/stardog'.

2.	Next, we have to tell Stardog where its home directory (where databases and other will be stored) is located

    ```
    $ export STARDOG_HOME=/data/stardog
    ```

3.	Copy the stardog-license-key.bin into the correction location

    ```
    $ cp stardog-license-key.bin $STARDOG_HOME
    ```

4.	Start the Stardog server.

    ```
    $ /data/stardog/bin/stardog-admin server start
    ```

5.	Test that Stardog is running by going to  http://localhost:5820/


## 2. Setup a Gradle Project

Now that Stardog is installed, lets setup our Gradle configuration. Since not
all the features of Stardog are required for this post, we will start with a
basic Gradle configuration and add as we go. In this example we are just
connecting to Stardog over http and the only dependency that we need is
com.complexible.stardog:client-http:4.2.1. The build.gradle is as follows:

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
    compile ('com.complexible.stardog:client-http:4.2.1')
}

mainClassName  = "com.stardog.examples.StardogClient"
```


## 3. Build a Database

We now have our Stardog instance installed and Gradle configured; let’s start
building our database. The first thing we have to do is create a connection to
the DBMS. This will allow us to perform administrative actions such as creating
a new database, adding/removing data, etc. We will use the
AdminConnectionConfiguration utility to create the connection to the DBMS. In
the code snippet bellow, we create the AdminConnectionConfiguration by
specifying the server url and the credentials of the user. In this case, we are
using the default values of:

* url = http://localhost:5820
* username = “admin”
* password = “admin

Once connected, we will print out the list of databases, default is only ‘myDB’,
search for the database we are about to create (just in case the code was run
before), and create the database on disk. Stardog has the ability to create an
embedded database and those examples can be found in the documentation at
http://docs.stardog.com/#_examples_3.

```java
/**
 *  Creates a connection to the DBMS itself so we can perform some administrative actions.
 */
public static void createAdminConnection() {
    try (final AdminConnection aConn = AdminConnectionConfiguration.toServer(url)
            .credentials(username, password)
            .connect()) {

        // A look at what databses are currently in Stardog - needed api and http
        aConn.list().forEach(item -> System.out.println(item));

        // Checks to see if the 'myNewDB' is in Stardog. If it is, we are going to drop it so we are
        // starting fresh
        if (aConn.list().contains(to)) {
            aConn.drop(to);
        }

        // Convenience function for creating a non-persistent in-memory database with all the default settings.
        aConn.disk(to).create();
    }
}
```


## 4. Import Data

Once our new database has been created, we will begin the process of importing
data and running queries against said data. In order to do this, we need to
create a connection to the database using a ConnectionPool. The
ConnectionConfiguration will tell the pool how to create the new connections. We
then pass the ConnectionConfiguration to the ConnectionPoolConfig as it is the
basis of the pool. We can also provide additional detail about the pool such as
min/max pool size, expiration, and block wait time. We then create the pool and
return so we can start using it to obtain a Stardog connection.

```java
ConnectionConfiguration connectionConfig = ConnectionConfiguration
        .to(to)
        .server(url)
        .reasoning(reasoningType)
        .credentials(username, password);
ConnectionPool connectionPool = createConnectionPool(connectionConfig);  // creates the Stardog connection pool
/**
 *  Now we want to create the configuration for our pool. 
 * @param connectionConfig the configuration for the connection pool
 * @return the newly created pool which we will use to get our Connections
 */
private static ConnectionPool createConnectionPool(ConnectionConfiguration connectionConfig) {
    ConnectionPoolConfig poolConfig = ConnectionPoolConfig
            .using(connectionConfig)
            .minPool(minPool)
            .maxPool(maxPool)
            .expiration(expirationTime, expirationTimeUnit)
            .blockAtCapacity(blockCapacityTime, blockCapacityTimeUnit);

    return poolConfig.create();
}
```


After we have obtained our Stardog connection, we will use it to populate our
database. You must always enclose changes to a database within a transaction
(begin followed by commit or rollback). Changes are local until the transaction is
committed or until you try and perform a query operation to inspect the state of
the database within the transaction. We will use the begin and commit for our
import. Below is a snippet of that data that we are importing followed by the
code to import it. As you can see we perform the begin, add the data by
importing the file, and finally commit the transaction.

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

```java
// first start a transaction. This will generate the contents of the databse from the N3 file.
connection.begin();
// declare the transaction
connection.add().io().format(RDFFormat.N3).stream(new FileInputStream("src/main/resources/marvel.rdf"));
// and commit the change
connection.commit();
```

## 5. Query the Database

Since we have a populated database, we will use the obtained Stardog connection
to query the database. The connection provides the ability to easily build and
execute SPARQL queries against the database. Using the connection, we first
create the SPARQL select statement and store it in the SelectQuery. We then
execute the query and store the result set in the TupleQueryResult object. The
result set can be used for many different purposes, but in this case, we are
just going to print it to the console using QueryResultIO.

```java
// Query the database to get our list of Marvel superheroes and print the results to the console
SelectQuery query = connection.select("PREFIX foaf:<http://xmlns.com/foaf/0.1/> select * { ?s rdf:type foaf:Person }");
TupleQueryResult tupleQueryResult = query.execute();
QueryResultIO.writeTuple(tupleQueryResult, TextTableQueryResultWriter.FORMAT, System.out);
```

The result of our query is:

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

We will now add and remove data from the database using the API statements
feature. Just like the initial data import transaction, we will use the begin
and commit options to update the database. Below we will first add `IronMan` to
the list of superheroes’ and then we will remove all references to
`CaptainAmerica`. As you can see in the add, we have ‘IronMan’ as the subject
for all the statements while using different FOAF objects for the predicate and
either a FOAF object, literal, or another superhero as the object. In the remove
statement, we are removing all instances where `CaptainAmerica` is either the
subject or the object.

```java
// first start a transaction - This will add Tony Stark A.K.A Iron Man to the database
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

// Query the database again to see if the any of the Thor's friends are not listed in the database and
// print the results to the console. There should be no results in the query since we added Iron Man.
query = connection.select("PREFIX foaf:<http://xmlns.com/foaf/0.1/> select * {<http://api.stardog.com/thor> foaf:knows ?o .\n" +
        "          filter not exists {?o rdf:type foaf:Person . } \n" +
        " } ");
tupleQueryResult = query.execute();
QueryResultIO.writeTuple(tupleQueryResult, TextTableQueryResultWriter.FORMAT, System.out);

// first start a transaction - this will remove Captain America from the list where he is eithe the
// subject or the object
connection.begin();
// declare the transaction
connection.remove()
        .statements(CaptainAmerica, null, null)
        .statements(null, null, CaptainAmerica);
// and commit the change
connection.commit();
```


If we run the query to get the list of Marvel superheroes in our database we can
see the result of our code. The updated query result set is now:

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


## Summary

In conclusion, we showed you how to install Stardog on a Linux environment,
create an administration connection in order to perform administrative actions,
create a connection pool to the database, and use a connection from the pool to
perform transactions and query’s. In the next blog, we will expand on more of
the features that Stardog has to offer as well as provide an example on how to
wire a Stardog client using Spring. The full version of the code is located at
https://github.com/stardog-union/stardog-examples/tree/develop/weblog/stardog-client.

