+++
title = "5 Hard Lessons about Serverless"
date = "2017-03-28"
categories = ["serverless", "node", "lambda", "aws"]
author = "Ty Soehngen"
draft = false 
discourseUsername = "tysoeh"
heroShot = "/img/egg1.jpg"
+++

Stardog's web team has been experimenting with
the [Serverless Framework](https://serverless.com/) to prototype a web app with
a purely AWS infrastructure. Serverless is to apps what baskets are to
eggs, basically.<!--more-->

{{% figure src="/img/egg-basket.jpg" class="inliner" %}}

Serverless aims to configure and
integrate [AWS Lambda](https://aws.amazon.com/lambda/) with other Amazon
services like [API Gateway](https://aws.amazon.com/api-gateway/) (to turn Lambda
functions into HTTP endpoints), [IAM](https://aws.amazon.com/iam/) (to manage
permission policies in the AWS
ecosystem), [Cognito](https://aws.amazon.com/cognito/) (for user
authentication), etc., all from a configuration file and a command line.

## What we've learned so far

Though we may move to a different architecture for production, we've learned a
bit about working with the framework effectively.


### 1. Test API Gateway locally

Serverless allows you to invoke AWS Lambda functions locally but has no such
support for API Gateway. As a result you can’t easily test your lambdas with the
inputs they’ll be receiving from API Gateway in production. API Gateway doesn’t
always process HTTP events in obvious ways either. Spending a few minutes to
deploy your lambdas each time you want an accurate event body will have you
barking at the moon. Catching
the [Serverless offline plugin](https://github.com/dherault/serverless-offline)
late in the game makes us wish we'd known about it much sooner.

### 2. Structure lambdas for unit tests

To test Lambda functions, they need to be exported for use by a testing
framework differently than they're exported for use by AWS Lambda. You can solve
this by exporting your business logic in a straight-forward way for your test
framework, and then write a wrapper to export _that_ export for AWS Lambda.
The
[Serverless docs](https://serverless.com/framework/docs/providers/aws/guide/testing/) do
a great job exhibiting this.

{{% figure src="/img/egg2.jpg" class="inliner" %}}

### 3. Authenticate on the client

Serverless allows you
to authorize against a
[Cognito user pool](https://serverless.com/framework/docs/providers/aws/events/apigateway#http-endpoints-with-custom-authorizers).
You can prevent headache and avoid unnecessary Lambda costs by using
the
[Cognito client-side SDK](http://docs.aws.amazon.com/cognito/latest/developerguide/setting-up-the-javascript-sdk.html) to
authenticate users with Cognito on the client, and then let Serverless use that
user's Cognito ‘identity’ to determine permissions on your HTTP endpoints.

### 4. Check for new resources regularly

Community support for the Serverless Framework is strong and lively. A search
that turned up nothing useful yesterday might provide exactly what you're
looking for today.
Here's
[an awesome, thorough walkthrough for building a Serverless React app](http://serverless-stack.com) which
was published a few weeks into our project, and discovered weeks later. If you
aren't finding what you need, look again next week.

### 5. IAM role policies are _strictly_ typed

Serverless allows you
to
[configure an IAM role](https://serverless.com/framework/docs/providers/aws/guide/iam/) that
your Lambdas will assume when interacting with other AWS services. Unless we
explicitly granted permission to perform specific actions on AWS resources (like
user pools or buckets), service calls from our Lambdas were typically denied-
even when we configured very flexible policies to the resources themselves.
Though never fervorless, our navigation of permissions issues was much easier
after
discovering [this list of IAM policy snippets](https://iam.cloudonaut.io/).

{{% figure src="/img/egg1.jpg" class="inliner" %}}

## Conclusion

On the whole, the Serverless Framework is a growing, well-supported framework
with good documentation. We foresee using it for odd jobs around the house when
AWS tools make sense. For application development, however, we’ll continue
to use app-specific platforms awhile longer.
