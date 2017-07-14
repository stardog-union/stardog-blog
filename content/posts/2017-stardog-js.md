+++
draft = true
date = "2017-07-13"
title = "Starodg.js Rewrite"
author = "Adam Bretz"
categories = ["javascript"]
discourseUsername = "arb"
heroShot = ""
+++

There hasn't been a meaningful commit to the stardog.js library in 522 days. A
lot has changed in the JavaScript and web landscape in those 522 days and I
think stardog.js needs some love. <!--more-->

## Backstory

When I applied for a job at Stardog, after having several conversations with the
leadership team and other engineers, my "homework" assignment was to do a code
review of the [stardog.js](https://github.com/stardog-union/stardog.js) library.
I turned in six or seven paragraph [technical
review](https://gist.github.com/arb/59e9061c61dd45c21a0935d8351f3fc0), got the
job, and never really thought about my review again.

It all came full circle when we needed to use stardog.js for a few new projects.
If you've never used it, stardog.js is a library to make communicating with the
Stardog HTTP server easier. It is considered a "universal" JavaScript library,
meaning it *should* work the same in Node and in a browser. It's a useful
library to be sure, but it was showing it's age.

The first and biggest issue was it wasn't really compatible with modern front
end tooling. The team was using webpack and ES6 `import` statements to load
stardog.js in a small react application. I was having trouble getting one of the
stardog.js calls working correctly, so I started to litter stardog.js with
`debugger` statements. Not a single one of them was being hit when making xhr
requests back to the Stardog server. After 20 minutes of confusion, I realized
what was happening; we were using the "node side" of the library.

A quick look at the [following
lines](https://github.com/stardog-union/stardog.js/blob/v0.3.1/js/stardog.js#L56-L57)

of code revealed what the issue was:
```js
var isNode = (typeof exports !== "undefined" && typeof module !== "undefined" &&
module.exports);
```
Using webpack, `module` and `module.exports` are always defined, so the code was
taking the `isNode` path and using all the Node libraries instead of the
browser-based ones. Everything was functioning, but certainly not as intended.
Behind the scenes, stardog.js uses
[restler](https://github.com/danwrong/restler) for making HTTP calls in the Node
execution context. It was supposed to be using jQuery for xhr calls in the
brower. 

The application we were building using only leveraged the basic functionality
provided by stardog.js and for those few things, it worked well enough but any
non-trivial project would eventually run into bad times. Additionally, like it
or not, pretty much every front end project uses some kind of bunder tooling so
stardog.js has to work correctly in those contexts. So with that as the
catalyst, it was time to start a rewrite of stardog.js

## Design Goals

Remember that technical review I did when I got hired? Good thing I kept that as
I would use that as a springboard for the work we needed to do to modernize
stardog.js. Below are the three main goals for the project rewrite:

1. Universal JavaScript library without environment detection
2. [fetch]() based. `fetch` is the standard way to make xhr requests from the
   browser
3. Leverage modern JavaScript tooling and language features

### Universal Javascript

With the rapid rise in popularity of Node and react, there has been an
expectation shift in the web development community; JavaScript should run the
same regardless of the environment. There are certainly exceptions to this (
HTTP servers, file system operations, animations) but in general, this is the
new expectation. 

The previous version of stardog.js achieved this using feature detection,
checking for `module.exports`. Detecting environments this way is unreliable and
should be avoided whenever possible. It is preferred to leverage tooling that
handles that for you.

The first thing we did was write the library for Node using standard CommonJS
`require` statements. This allowed us to structure the code in a much more
modular way. One catch of the Node first approach was that we couldn't use any
of Node's core modules like `url`, `http`, or `querystring` because they don't
exist in the browser. So any modules would have to be available on npm and be
universal.

Utility libraries like [lodash](https://lodash.com/), for example, are
inherently universal because they don't require any environment-specific
features. Other libraries, like
[form-data](https://github.com/form-data/form-data) use a special,
technically-not-spec-but-basically-spec field in package.json named "browser". 

The "browser" key instructs builder tools what file to use when they are
traversing the dependency tree. This ends up being much more reliable approach
than feature detection as library authors generally know what JavaScript files
they want to be used in which context. It does rely on builder tools respecting
that field, but all of the main players in the space currently do.

There is actually a third approach to handling universal JavaScript and that is
the idea of polyfills and ponyfills. Both techniques are essentially fancy-talk
for "if this functionality exists in the current environment, use the native
implementation, otherwise, use the supplied code." This is how the `fetch`
library we migrated to works.

### `fetch` based

Something that has gotten the JavaScript community very excited is a standard,
`Promise` based way to make `XMLHttpRequest` (xhr) requests. For many years,
there existed many libraries for making xhr requests and they all handled it
differently. The APIs were different, the response shapes and options were
different, and the behavior from one browser to the next could be different. 

Enter `fetch`. A first class xhr request machine. At the time of this writing,
[75%](http://caniuse.com/#search=fetch) of global browser usage supports native
`fetch` implementation. For that other 25%, there exists an [excellent
polyfill](https://github.com/github/fetch) maintained by the fine folks at
GitHub.

There is a lot of code in there to digest, so here are the salient bits. The
first thing the code does is check to see if `fetch` is currently implemented in
the current environment, the browser in this case, and if so, bail out and do
nothing. This causes all calls to the `fetch` API to use the native
implementation. 

If `fetch` isn't implemented, it is reimplemented using `XMLHttpRequest` and
made globally available. This is an ideal setup because in your user-land code
you can *always* use `fetch` and not worry about native or polyfill; to your
code, it is all the same.

Taking this one step further, we want to use `fetch` on the browser, whether
it's native or not, AND use `fetch` in Node. A single developer API, completely
context agnostic. Thankfully, there is a `fetch` implementation that is spec
compliant (mostly) written for Node called, surprise, surprise,
[node-fetch](https://github.com/bitinn/node-fetch).

By combining all of these `fetch` related concepts, stardog.js is able to use
`fetch` to make all of the requests to the Stardog HTTP server using the same
exact API and developer code regardless of the environment. If you look at the
new code, currently in the "development" branch, you won't see any branching
logic trying to guess how to make HTTP requests. It is all `fetch` all the way
down.

### Tooling for stardog.js

So, we wrote stardog.js with the intent of being universal, but the actual code
is littered with `require` statements which means less than nothing in a
browser. So while the code we wrote is environment agnostic, we still need to
*do something* so it can function as expected in the browser. We needed a tool
to read our code, in-line all of the dependencies and create a single JavaScript
file that can be used in the browser. We selected
[rollup.js](https://rollupjs.org/) because it's more tailored for small
libraries, rather than web applications.

In our case, rollup let us write stardog.js using the standard `require` and
CommonJS semantics we are used to, but then execute a build step to traverse and
bundle all of the dependencies up into something a browser can execute.

During the build phase is where the "browser" field in package.json comes into
play. When rollup follows a `require` statement, if it's an npm package, and it
has a specified "browser" field, that is the file that will be used to satisfy
the `require` statement.

Besides just flattening out `require` statements and inlining dependencies,
rollup.js lets us use many es2015 features not available in some browsers like
`Class`, object destructuring, default arguments, and arrow functions. These
features are "transpiled" with babel down to ES5 which is what all modern
browsers natively support. 

As you can see, in our package.json file, we've added a "browser" key pointing
to the built stardog.js file in the "dist" folder. So when you want to use
stardog.js in your project, just `require` or `import` it in and you'll be
communicating with the Stardog HTTP server faster than you can say SPARQL.

## Moving Ahead

Rewriting stardog.js was a much bigger job than we originally thought it was
going to be. It's been a great experience for us to go deep into an unfamiliar
code base and to try to understand and improve it. We also got to experiment
with new tooling and to dig deep into how JavaScript libraries are bundled and
distributed. 

We sincerely hope all of these changes add up to a better and more fun developer

experience when programming against the Stardog HTTP server. We encourage pull
requests of all kinds and welcome feedback and suggestions from the community.
