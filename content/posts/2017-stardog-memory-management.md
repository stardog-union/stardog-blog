+++
title = "Stardog Memory Management"
date = "2017-01-20"
author = "Alexander Toktarev"
+++

The main problem of all heavily-loaded Java applications which operate on a huge amount of data is memory management.

JVM has an internal garbage collector but it has two fundamental problems:

1) Resource consumption during garbage collection process (stop-the-world pauses, CPU consumption).

2) OutOfMemoryException can be thrown in case when not enough memory for the processing.
[OutOfMemoryException cases](https://docs.oracle.com/javase/8/docs/technotes/guides/troubleshoot/memleaks002.html).

How can we resolve this problem ?

Of course we can say "Let's re-write our product using C++" - but what if we still want write in Java.

First of all, let's consider the main problem of general java approach.
Using simple Java Objects in high-loaded application we allocate memory for the object,
use this memory and release strong reference on the corresponding object.
If the number of such object is huge - it is a very big pressure on GC and memory overflow is not under
our control.

To prevent this problem we don't use Java Objects to store data and switch to byte-based
representation of the data. So we operate directly with serialized data and always control number
of allocated and used memory directly byte by byte. In case  if no more memory - we can always use disk.
Because we always control each byte used for our data - we can prevent OutOfMemoryException at all.

We were inspired by Apache Flink approach:

[Juggling with Bits and Bytes](https://flink.apache.org/news/2015/05/11/Juggling-with-Bits-and-Bytes.html).

The same technique is used in such projects like: Apache Drill,
Apache Ignite (incubating), Apache Geode (incubating), Apache Spark (Project Tungsten).

## The general idea

Similar to Apache Flink approach we allocate memory by atomic blocks of memory.

Each block of memory is represented by MemoryBlock interface and can be heap or off-heap based.
If it is heap-based block it is backed by Java's byte[]-array.
If it is native-based block it is backed by pointer to the native memory accessed by UNSAFE.
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

**Simple sequence**

**Sorted sequence**

**HashTable**

**Aggregator**


All collections has constant architecture basis.
It has main chain of blocks where main data are being written.
The element can be spread between blocks.
Element can have start at one blocks and finish at another block.
So elements of any length can we written.

## Simple sequence of elements

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

## Sorted sequence of elements

All elements are being subsequently written to the chain of memory blocks.
The index and offset of the element in the data layout is being subsequently written
to the blocks of the address layout.
If no more blocks to write pointer in address layout are being sorted in accordance
with binary comparator. Using merge sort data are being written to the disk in the sorted format.
On iteration data are being sorted on address layout and using merge sort elements are being emit
as an output.
In case if search is required there solid sorted index is build in memory if only memory was used,
only on the disk if disk was used. Using binary search certain element can be found inside the collection
with O(log(N)) time complexity.


```
Address layout
   _________________    __________________       __________________
   |  MemoryBlock1 |    |  MemoryBlock2  |       | MemoryBlock_N  |
   -----------------    ------------------       ------------------
   |index1 |offset1|    |index5 | offset5|       |index9 |offset9 |
   -----------------    ------------------       ------------------
   |length2 | data2|    |index6 | offset6|  .... |index10|offset10|
   -----------------    ------------------       ------------------
   |length3 | data3|    |index7 | offset7|       |index11|offset11|
   -----------------    ------------------       ------------------
   |length4 | data4|    |index8 | offset8|       |index12|offset12|
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

We have a plan to build special kind of index on the disk and achieve
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

## Show me the numbers











