# JS-only Stripe Terminal demo

Bare-bones basic integration showing all the relevant steps to getting set up with Terminal without using ReactJS.

Meant for illustrative purposes only. Code includes clear call-outs to documentation where you can find the original samples and learn more about the step.

See Stripe's official [Terminal demo](https://github.com/stripe/stripe-terminal-js-demo) for more features and integrated logging.

## Running the demo
This is meant to be used with Stripe's [example Terminal backend](https://github.com/stripe/example-terminal-backend) already running. The host is configurable in terminal.js.

Once your backend is running, all you have to do is run this client. Python provides a nice easy way:

```
$ cd js-only-terminal-demo
$ python -m SimpleHTTPServer 8080
Serving HTTP on 0.0.0.0 port 8080 ...
```
