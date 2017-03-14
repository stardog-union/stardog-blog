+++
title = "Stardog Case Study: Engineering Data for the Mission to Mars"
date = "2017-03-18"
categories = ["case study", "virtual graphs", "nasa"]
author = "Al Baker"
draft = false
discourseUsername = "albaker"
+++

The Engineering Data Challenge 

Aerospace engineering organizations in the public and private sector operate at in a nexus of functional areas including large-scale software and hardware engineering, manufacturing, logistics, safety, and operations to name a few.  These areas all have data sets that intersect, and each dataset may have tens to hundreds of thousands of objects.  For example, our team has the pleasure to work with NASA on the mission to Mars.  In that organization, within the systems engineering data set alone, a single requirement may have 50,000 children in its verification and validation hierarchy.  Many PLM, PDM, and other specialized systems face challenges in understanding one data set, let the unification of all of them. 

The need for a knowledge graph to answer questions about this data is undeniably apparent, as without it millions of dollars can be spent as engineers manually sift through data to find, integrate, qualify, and report on these key relationships. Every question becomes a new study, fire drill, or project to make an assessment. Many times a day, NASA engineers ask questions like: 

'''
“If we change this sensor, what is the impact to telemetry? Verification and Validation? Test, check out, and operations? Operational nomenclature for the crew?  Safety and Mission Assurance? Cross program and cross vendor integration? Schedules, risks, and downstream dependencies?”  Logistics and delivery?”
'''

Our team works with NASA to build this knowledge graph, using Stardog to answer these types of questions.  To do this, our team works with subject matter experts to develop the data model.  In many cases, this data model starts as a diagram on the board, and we then translate it to RDF.  As we go through each logical relationship, we look for a positive case that proves the relationship, and an incorrect example that disproves it.  The structural correctness rules in the model go into the ontology, and the examples of an issue with the data go into a Stardog ICV constraint definition.   This is an iterative process we recommend that introduces structure and logic relationships in just the right amount to meet then needs of the stakeholder.  In some cases, we identify limitations in a source system – such as the inability to show a cycle like the verification and analysis cycles used during the design of a spacecraft.  In these cases, we use ontology or Stardog Rules to knit together the data relationships as they are supposed to be and overcome the limitations in the source systems.  

PLM/PDM and lifecycle collaboration tool integration is not a new problem, and there are many players in the engineering tool space addressing the issue.  With each organization and contractor making their tool selections to fit their specific needs, Stardog can sit comfortably as the collector of knowledge with various features, data ingest, ETL, and web services accruing the data into the knowledge graph.  Stardog’s logic based modeling technology, and platform to query heterogeneous data provides several benefits:
 


* Virtual Graphs and Data Access: Stardog’s virtual graph and rich data services provide access to data in situ, which means that organization’s processes and best of breed tool selections go unchanged. From PTC Windchill, to Microsoft Sharepoint, to Cradle, data can be represented in a graph.

* Logic based models: Stardog provides full OWL 2 and rules based models that can represent any existing systems, which means that Stardog can seamlessly model heterogeneous systems and complex relationships such as verification cycles, spacecraft architecture, and systems engineering hierarchies.

* Rules based reasoning and integrity constraints: Stardog provides easy to develop rules for both representing data relationships that should be there, and ones that shouldn’t.  This means NASA can proactively enhance, repair, and report on interconnected data all through the simplicity of a Stardog query.

* Standards based: Stardog supports a variety of industry standards, and the lifecycle engineering tool standardization with Open Services for Lifecycle Collaboration (OSLC) can be easily used in Stardog without translation.  This means Stardog is the natural choice for representing a knowledge graph across lifecycle collaboration tools and systems.


Like all groups at NASA, our services group helps make an investment go a long way, so customers can incrementally build the knowledge graph based on the priority of the stakeholders and the target lifecycle milestones.  Our path to an integrated knowledge base started with taking an inventory of cross program data products and understanding the key relationships between them.  NASA then can scope benefits to plan subsequent integrations where the cost of the data integration goes down, the value of graph and queries compounds.


## Summary

Stardog is an enterprise Knowledge Graph platform that allows customers to query massive, disparate, heterogeneous data regardless of structure with simplicity of implementation. NASA, along with many other customers in the manufacturing and engineering space, elevate the value of their data with Stardog by eliminating hundreds to even thousands of person-hours with simple, repeatable queries and data visualizations.  We highlighted a number of key features we use to assist in the Mission to Mars.  In future blog posts, we’ll explore how a graph with logical modeling captures the function decomposition of a spacecraft  in a way not possible in other systems. 



