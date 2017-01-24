+++
title = "Stardog Memory Management"
date = "2017-01-20"
author = "Alexander Toktarev"
+++

The main problem of all heavily-loaded Java applications which operate on a huge amount of data is memory management.

JVM has an internal garbage collector but it has two fundamental problems:

1) Resource consumption during garbage collection process (stop-the-world pauses, CPU consumption).

2) OutOfMemoryException can be thrown in case if not enough memory for the processing.
[OutOfMemoryException cases](https://docs.oracle.com/javase/8/docs/technotes/guides/troubleshoot/memleaks002.html).

How can we resolve this problem ?

Of course we can say "Let's re-write our product using C++" - but what if we still want write in Java.

First of all, let's consider the main problem of general java approach.
Using simple Java Objects in heavily-loaded application we allocate memory for the object,
use this memory and release strong reference on the corresponding object.
If the number of such object is huge - it is a very big pressure on GC and memory overflow is not under
our control.

To prevent this problem we don't use Java Objects to store data and switch to byte-based
representation of the data. So we operate directly with serialized data and always control number
of allocated and used memory directly byte by byte. In case if no more memory - we can always use disk.
Because we always control each byte used for our data - we can prevent OutOfMemoryException at all.

We were inspired by Apache Flink approach:

[Juggling with Bits and Bytes](https://flink.apache.org/news/2015/05/11/Juggling-with-Bits-and-Bytes.html).

The same technique is used in such projects like: Apache Drill,
Apache Ignite (incubating), Apache Geode (incubating), Apache Spark (Project Tungsten).

## The general idea

Similar to Apache Flink approach we allocate memory by atomic blocks of memory.

Each block of memory is represented by MemoryBlock interface and can be heap or off-heap based.
If it is heap-based block it is backed by Java's byte[]-array.
If it is native-based block it is backed by native memory.
The size of block of the memory is 32Kb by default but can be modified.
Blocks are allocated and never released during application's work plus each block can be re-used.
This approach considerably reduce GC pressure plus we can control block's consumption and write data
to the disk when no more blocks to process;

So the main advantages of this approach are:

1) Strict memory monitoring, use disk on demand.
Handle difficult cases - everything will work even no more available memory in pool
so new element will be written to the disk.

2) Because of block's long life-time no need to run garbage collector so considerable reduction of
garbage collection pressure happens.

3) No overhead for data storage. Simple Java object causes bytes-overhead for the header,
in case of huge number of Java Objects this overhead will be considerable.

4) Good cache locality and gc-less architecture, all functional objects are long-lived and fly-weight.


## Memory management collections

Using described approach we implemented following collections:

**Simple array**

**Sorted array**

**Optimized Sorted array**

**HashTable**

**Aggregator**


All collections has constant architecture basis.
It has main chain of blocks where main data are being written.
The element can be spread between blocks.
Element can have start at one blocks and finish at another block.
So elements of any length can we written.

## Simple array

All elements are being subsequently written to the chain of memory blocks.
In case if no more block to write  - all used blocks are spilled to the disk and
memory blocks are re-used.

```
Data layout:

   _________________    __________________       __________________
   |  MemoryBlock1 |    |  MemoryBlock2  |       |  MemoryBlock_N |
   -----------------    ------------------       ------------------
   |length1 | data1|    |     data3      |       |     ...        |
   -----------------    ------------------       |                |
   |length2 | data2|    |length4 | data4 |  .... |                |
   -----------------    ------------------       |    data_K      |
   |length3 | data3|    |                |       |                |
   -----------------    |    ....        |       |      ...       |
   |      data3    |    |                |       |                |
   ────────────────-    ────────────────--       ──────────────────


   File on the disk with previously spilled elements:
   ----------------------------------------
   |length_1|data_1|length_2|data_2  .... |
   ----------------------------------------
```

## Sorted array

All elements are being subsequently written to the chain of memory blocks.
The index and offset of the element in the data layout is being subsequently
written to the blocks of the address layout.
If no more blocks to write pointer in address layout, pairs <index,offset> are being sorted in accordance
with binary comparator.
Using merge sort data from data layout are being written to the disk in the sorted format.
On iteration data are being sorted on address layout and using merge sort elements are being emit as an output.
In case if search is required we build solid sorted index in memory if only memory was used,
on the disk if disk was used. Using binary search certain element can be found inside the collection
with O(log(N)) time complexity.


```
Address layout
   _________________    __________________       __________________
   |  MemoryBlock1 |    |  MemoryBlock2  |       | MemoryBlock_N  |
   -----------------    ------------------       ------------------
   |index1 |offset1|    |index5 | offset5|       |index9 |offset9 |
   -----------------    ------------------       ------------------
   |index2 |offset2|    |index6 | offset6|  .... |index10|offset10|
   -----------------    ------------------       ------------------
   |index3 |offset3|    |index7 | offset7|       |index11|offset11|
   -----------------    ------------------       ------------------
   |index4 |offset4|    |index8 | offset8|       |index12|offset12|
   ────────────────-    ────────────────--       ──────────────────

Data layout
   _________________    __________________       __________________
   |  MemoryBlock1 |    |  MemoryBlock2  |       | MemoryBlock_N  |
   -----------------    ------------------       ------------------
   |length1 | data1|    |     data3      |       |     ...        |
   -----------------    ------------------       |                |
   |length2 | data2|    |length4 | data4 |  .... |                |
   -----------------    ------------------       |      data_K    |
   |length3 | data3|    |                |       |                |
   -----------------    |    ....        |       |      ...       |
   |      data3    |    |                |       |                |
   ────────────────-    ────────────────--       ──────────────────


   File on the disk with previously spilled bytes in the sorted order
   ----------------------------------------
   |length_1|data_1|length_2|data_2  .... |
   ----------------------------------------
```

## Sorted array

In case when we can compare values using only 1 long-value we write corresponding
long-value of each element to the  address layout. It give considerable performance
improvement because of the architecture with a good cache locality.

```
Address layout
   __________________________       __________________________
   |        MemoryBlock1    |       |        MemoryBlockN    |
   |------------------------|       |------------------------|
   |index1 |offset1| long_1 |       |                        |
   |------------------------|       |                        |
   |index2 |offset2| long_2 |   ... |          ....          |
   |------------------------|       |                        |
   |index3 |offset3| long_3 |       |                        |
   |------------------------|       |------------------------|
   |index4 |offset4| long_4 |       |indexK | offsetK |long_K|
   |────────────────--------|       |────────────────--------|

Data layout
   _________________    __________________       __________________
   |  MemoryBlock1 |    |  MemoryBlock2  |       | MemoryBlock_N  |
   -----------------    ------------------       ------------------
   |length1 | data1|    |     data3      |       |     ...        |
   -----------------    ------------------       |                |
   |length2 | data2|    |length4 | data4 |  .... |                |
   -----------------    ------------------       |      data_K    |
   |length3 | data3|    |                |       |                |
   -----------------    |    ....        |       |      ...       |
   |      data3    |    |                |       |                |
   ────────────────-    ────────────────--       ──────────────────

   File on the disk with previously spilled bytes in the sorted order
   ----------------------------------------
   |length_1|data_1|length_2|data_2  .... |
   ----------------------------------------
```

## HashTable

All elements are being subsequently written to the chain of memory blocks.
We calculate partition hashCode of the element, obtain partition.
Using current block of the partition we insert current element to the
open addressing table of this block. If equal element exists, the reference
to the current element is being written to the tail of the previous written elements,
so all equal elements are stored as linked list in the data layout.
In case if only unique keys are required (HashSet keys) only one element will be stored in
the address block.

While lookup by the key, the partition will be calculated. After that all blocks inside the
partition are being used for the probe, plus additional block on the disk are being used for the probe.

We have a plan to build a special kind of index on the disk and achieve
logarithmic complexity to find the corresponding block on the disk which would provide
huge performance improvement during lookup.


```
Address layout with Open Addressing tables in each block

Partition1
   ____________________    _____________________       ________________________
   |  MemoryBlock1    |    |  MemoryBlock2     |       |   MemoryBlock_N      |
   --------------------    ---------------------       ------------------------
   |hashCode1|address1|    |hashCode5|address5 |       |hashCode13| address13 |
   --------------------    ---------------------       ------------------------
   |hashCode2|address2|    |hashCode6|address6 |  .... |hashCode14| address14 |
   --------------------    ---------------------       ------------------------
   |hashCode3|address3|    |hashCode7|address7 |       |hashCode15| address15 |
   --------------------    --------------------        ------------------------
   |hashCode4|address4|    |hashCode8|address8 |       |hashCode16| address16 |
   ────────────────────    ─────────────────────       ────────────────────────

........................

PartitionK
   ______________________  ______________________      ________________________
   |  MemoryBlock1      |  |  MemoryBlock2      |      |  MemoryBlock3        |
   ----------------------  ----------------------      ------------------------
   |hashCode30|address30|  |hashCode34|address34|      |hashCode38| address38 |
   ----------------------  ----------------------      ------------------------
   |hashCode31|address31|  |hashCode35|address35|      |hashCode39| address39 |
   ----------------------  ----------------------      ------------------------
   |hashCode32|address32|  |hashCode36|address36|      |hashCode40| address40 |
   ----------------------  ----------------------      ------------------------
   |hashCode33|address33|  |hashCode37|address37|      |hashCode41| address41 |
   ──────────────────────  ──────────────────────      ────────────────────────

Data layout
   _________________    __________________       __________________
   |  MemoryBlock1 |    |  MemoryBlock2  |       | MemoryBlock_N  |
   -----------------    ------------------       ------------------
   |length1 | data1|    |     data3      |       |     ...        |
   -----------------    ------------------       |                |
   |length2 | data2|    |length4 | data4 |  .... |                |
   -----------------    ------------------       |      data_K    |
   |length3 | data3|    |                |       |                |
   -----------------    |    ....        |       |      ...       |
   |      data3    |    |                |       |                |
   ────────────────-    ────────────────--       ──────────────────

   File with the spilled hash tables
   File_partition1:
   ----------------------------------------------------------------
   |open_addressin_table_1 | open_addressin_table_2 | .... | ...  |
   ----------------------------------------------------------------
..
   File_partitionK:
   ----------------------------------------------------------------
   |open_addressin_table_1 | open_addressin_table_2 | .... | ...  |
   ----------------------------------------------------------------


   File on the disk with previously spilled elements:
   ----------------------------------------
   |length_1|data_1|length_2|data_2  .... |
   ----------------------------------------
```


## Aggregator

Aggregator's structure is very similar to the HashTable.
The difference is during spilling to the disk.
Data are being written to the file in pre-aggregated format.
Plus we support Functor for the aggregator.
For example we need to calculate  function over all elements in the group.
We can don't write elements as the sequence and calculate function's value directly in
block of the memory. It will let us to reduce memory consumption.
Plus we write pre-calculated function's values on the disk.
We support 2-nd level of aggregation when elements in the first level can be aggregated
using 2-nd level aggregation strategies.


```
Address layout with Open Addressing tables in each block

Partition1
   ____________________    _____________________       ________________________
   |  MemoryBlock1    |    |  MemoryBlock2     |       |   MemoryBlock_N      |
   --------------------    ---------------------       ------------------------
   |hashCode1|address1|    |hashCode5|address5 |       |hashCode13| address13 |
   --------------------    ---------------------       ------------------------
   |hashCode2|address2|    |hashCode6|address6 |  .... |hashCode14| address14 |
   --------------------    ---------------------       ------------------------
   |hashCode3|address3|    |hashCode7|address7 |       |hashCode15| address15 |
   --------------------    --------------------        ------------------------
   |hashCode4|address4|    |hashCode8|address8 |       |hashCode16| address16 |
   ────────────────────    ─────────────────────       ────────────────────────

........................

PartitionK
   ______________________  ______________________      ________________________
   |  MemoryBlock1      |  |  MemoryBlock2      |      |  MemoryBlock3        |
   ----------------------  ----------------------      ------------------------
   |hashCode30|address30|  |hashCode34|address34|      |hashCode38| address38 |
   ----------------------  ----------------------      ------------------------
   |hashCode31|address31|  |hashCode35|address35|      |hashCode39| address39 |
   ----------------------  ----------------------      ------------------------
   |hashCode32|address32|  |hashCode36|address36|      |hashCode40| address40 |
   ----------------------  ----------------------      ------------------------
   |hashCode33|address33|  |hashCode37|address37|      |hashCode41| address41 |
   ──────────────────────  ──────────────────────      ────────────────────────

Data layout
   _________________    __________________       __________________
   |  MemoryBlock1 |    |  MemoryBlock2  |       | MemoryBlock_N  |
   -----------------    ------------------       ------------------
   |length1 | data1|    |     data3      |       |     ...        |
   -----------------    ------------------       |                |
   |length2 | data2|    |length4 | data4 |  .... |                |
   -----------------    ------------------       |      data_K    |
   |length3 | data3|    |                |       |                |
   -----------------    |    ....        |       |      ...       |
   |      data3    |    |                |       |                |
   ────────────────-    ────────────────--       ──────────────────


   File on the disk are stored in the pre-aggregated format:
   --------------------------------------------------------------------------------------
   |partition_1|hash_code_1|elements_count_1| length_1|data_1|length_2|data_2|    ....  |
   --------------------------------------------------------------------------------------
   |partition_2|hash_code_2|elements_count_2| length_3|data_3|length_4|data_4 |   ....  |
   --------------------------------------------------------------------------------------
   ...
   --------------------------------------------------------------------------------------
   |partition_k|hash_code_k|elements_count_k|length_(L-1)|data_(L-1)|length_(L)|data_(L)|
   --------------------------------------------------------------------------------------
.....
```

## Show me a numbers

We provide compare benchmarks between generic Java collections and Stardog collections with memory management.

All tests was run on the following environment:  Heap size - 2G,  2,2 GHz Intel Core i7.

Each collection's element is Solution object backed by long[]-java array of length 4.
For the sorted array elements are being sorted using first register for the long[]-array.

All time is in milliseconds.

```
_________________________________________________________________
|           |  Java ArrayList  |      Simple array              |
|           |                  |                                |
|______________________________|________________________________|
| Elements count: 10_000_000                                    |
|_______________________________________________________________|
| 10_000_000|                  |                                |
| Insertion |   1267           |        1110                    |
|   time    |                  |                                |
|___________|__________________|________________________________|
|           |                  |                                |
| Iteration |   201            |        1797                    |
|    time   |                  |                                |
|           |                  |                                |
|___________|__________________|________________________________|
| Elements count: 15_000_000                                    |
|___________|___________________________________________________|
|           |                  |                                |
| Insertion |   9294           |        1932                    |
|   time    |                  |                                |
|___________|__________________|________________________________|
|           |                  |                                |
| Iteration |   187            |        2548                    |
|    time   |                  |                                |
|           |                  |                                |
|___________|__________________|________________________________|
```

```
_________________________________________________________________
|   Time    |  Java ArrayList  |     Optimized Sorted array     |
|___________|__________________|________________________________|
| Elements count:  10_000_000                                   |
|_______________________________________________________________|
|           |                  |                                |
| Insertion |      1371        |           1248                 |
|   time    |                  |                                |
|___________|__________________|________________________________|
| Sort Time |      133         |           460                  |
____________|__________________|________________________________|
|           |                  |                                |
| Iteration |      164         |           13                   |
|    time   |                  |                                |
|           |                  |                                |
|___________|__________________|________________________________|
| Elements count:  15_000_000                                   |
|_______________________________________________________________|
|           |                  |                                |
| Insertion |                  |                                |
|   time    |      9907        |            1932                |
|___________|__________________|________________________________|
| Sort Time |      197         |            654                 |
|___________|__________________|________________________________|
|           |                  |                                |
| Iteration |      204         |            15                  |
|    time   |                  |                                |
|___________|__________________|________________________________|

```


## Garbage collection behaviour

Test was run on the following environment:  Heap size - 2G,  2,2 GHz Intel Core i7.
We insert 20_000_000 elements to the Simple array and Java ArrayList
Each collection's element is Solution object backed by long[]-java array of length 4.


Simple array:
GC logs: 2017-01-23T14:47:58.316-0300: 1.765: [GC (Allocation Failure) [PSYoungGen: 524800K->87036K(611840K)] 524800K->484051K(2010112K), 0.1956802 secs] [Times: user=0.21 sys=0.88, real=0.20 secs]
Time: 2282 ms.


Java ArrayList:
2017-01-23T14:51:56.207-0300: 0.610: [GC (Allocation Failure) [PSYoungGen: 524800K->87024K(611840K)] 524800K->486809K(2010112K), 0.5298367 secs] [Times: user=2.06 sys=0.32, real=0.53 secs]
2017-01-23T14:51:56.857-0300: 1.259: [GC (Allocation Failure) [PSYoungGen: 611824K->87024K(611840K)] 1011609K->1013977K(2010112K), 1.7088052 secs] [Times: user=8.50 sys=0.40, real=1.71 secs]
2017-01-23T14:51:58.566-0300: 2.968: [Full GC (Ergonomics) [PSYoungGen: 87024K->0K(611840K)] [ParOldGen: 926952K->1009949K(1398272K)] 1013977K->1009949K(2010112K), [Metaspace: 6484K->6484K(1056768K)], 4.6200895 secs] [Times: user=32.03 sys=0.57, real=4.62 secs]
2017-01-23T14:52:03.273-0300: 7.676: [Full GC (Ergonomics) [PSYoungGen: 524800K->131583K(611840K)] [ParOldGen: 1009949K->1397915K(1398272K)] 1534749K->1529498K(2010112K), [Metaspace: 6484K->6484K(1056768K)], 4.9325762 secs] [Times: user=33.11 sys=0.90, real=4.93 secs]
Time=12271 ms.


## Conclusions

Described memory management approach provides good stability for the heavy-loaded application.
But as we can see in benchmarks sometimes simple Java Collections are faster.
It happens for the low number of elements, however increasing number of inserted elements
we can see that collections with memory management provide considerably better performance
and stability then generic Java Collections.

