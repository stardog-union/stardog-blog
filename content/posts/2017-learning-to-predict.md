+++
title = "Learning to Predict"
date = "2017-04-27"
author = "Pedro Oliveira"
draft = false
series = [""]
categories = ["machine-learning"]
discourseUsername = "cpdomina"
heroShot = "https://blog.stardog.com/img/wabbit.jpg"
+++

We're adding machine learning to Stardog to make your Knowledge Graph even
smarter.<!--more-->

## Machine Learning in Stardog 

The thing about an enterprise knowledge graph is that it should *know stuff*.
And knowing stuff is a lot like learning stuff. People who know and learn stuff
are good. Machines that know and learn stuff aren't better, but they're tireless
and never take holiday.

So we're adding machine learning to Stardog. That is, we're adding *statistical*
inference to the *logical* inference Stardog already performs. 

{{% figure src="/img/neptune.jpg" caption="The Return of Neptune, John Singleton Copley" class="inliner" %}}

Our initial focus is **predictive analytics**: the ability to predict nodes and
edges in a knowledge graph. So you'll be able to use Stardog to extract patterns
from your data and make intelligent predictions based on those patterns.

In this blog post we give an overview of how to use the upcoming predictive
capabilities of Stardog. We’ll describe how to build a model and how to use it
for prediction.

### Training a Model

Before Stardog can perform predictions, we need to define what are we actually
trying to predict. This task is called "model training". You provide data and a
target, and Stardog learns a model that can be used to predict the value of the
target given some other, probably unseen, data. Let’s look at an example in
which we train a model to predict the genre of a film given its director,
studio, and year.

```sparql
prefix spa: <tag:stardog:api:analytics:>
    
INSERT {
   graph spa:model {
       :myModel  a spa:ClassificationModel ;
                 spa:algorithm "ksvm" ;
                 spa:arguments (?director ?year ?studio) ;
                 spa:predict ?genre .
      }
    }
WHERE {
   ?movie :directedBy ?director ;
          :year ?year ;
          :studio ?studio ;
          :genre ?genre .
}
```

Training a model can be naturally expressed in SPARQL using an `INSERT`. The
`WHERE` clause selects the data we are interested in, and a special graph,
`spa:model`, is used to specify the parameters of the training.

{{% figure src="/img/train-model.jpg" caption="Courtesy of Eli Christman" class="inliner" %}}

In this example, we are training a new model, `:myModel`, which will be used
for [classification](https://en.wikipedia.org/wiki/Statistical_classification).
We currently support binary classification, multi-class classification, and
regression. Our model will be trained to predict the value of `?genre` based on
the values of `?director` , `?year`, and `?studio` . Other configurations, such
as the training algorithm, can also be given at this stage.

### Making predictions

Now that we have trained a model, we are ready to use it for prediction as part
of query answering.

```sparql
prefix spa: <tag:stardog:api:analytics:>
    
SELECT * WHERE {
  graph spa:model {
      :myModel  spa:arguments (?director ?year ?studio) ;
                spa:predict ?predictedGenre .
  }
      
  :TheGodfather :directedBy ?director ;
          :year ?year ;
          :studio ?studio ;
          :genre ?originalGenre .
    }
```

We select a movie’s properties and use them as arguments to the model Stardog
previously learned. The magic comes with the `?predictedGenre` variable; its
value is not going to come from the data itself, but will instead be predicted
by the model, based on the values of the arguments. But query answering proceeds
as if the predicted value were present in the graph. 

The result of the query will look like this:

```sql
| director            | year | studio             | originalGenre | predictedGenre |
| ------------------- | ---- | ------------------ | ------------- | -------------- |
| :FrancisFordCoppola | 1972 | :ParamountPictures | Drama         | Drama          |
```

If the predicted values are constantly the same as the original ones, you’re on
the right path for having good predictions. Your model has a high accuracy, and
you can now focus on making its results
more [general](https://en.wikipedia.org/wiki/Overfitting).

{{% figure src="/img/wabbit.jpg" caption="Rabbit, Mitsuhiro Ōhara" class="inliner" %}}

### Increasing Expressivity

A `SELECT` returns tabular data, which limits the expressivity of model training
with high-relational data. We
are
[extending SPARQL solutions](https://blog.stardog.com/extending-the-solution/)
to include arrays, which can very nicely represent multi-valued arguments, such
as all actors in a movie:

```sparql
prefix spa: <tag:stardog:api:analytics:>
    
INSERT {
  graph spa:model {
      :myNewModel  a spa:ClassificationModel ;
                   spa:arguments (?director ?actors) ;
                   spa:predict ?genre .
  }
}
WHERE {
  select ?director ?genre (array(?actor) as ?actors) {
      ?movie :directedBy ?director ;
             :actors ?actor ;
             :genre ?genre .
  } group by ?director ?genre
}
```


## What’s next

We are expecting the first release of predictive analytics to be available this
summer. Right now we are working
with [Vowpal Wabbit](https://github.com/JohnLangford/vowpal_wabbit/), an
extremely efficient and scalable machine learning library, so expect more
features to be available at release time. We’re also looking at link mining,
inductive logic programming, similarity learning, and natural language
processing, too.

Knowledge graphs know stuff; your enterprise knowledge graph should know stuff
about your enterprise. And it should learn more stuff from the stuff that it
already knows. That’s where we’re headed. Stay tuned!

**[Download Stardog today](http://stardog.com/) to start your free 30-day
evaluation.**
