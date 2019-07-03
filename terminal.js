/**
 * The actual Terminal instance
 */
var terminal;

/**
 * List of readers on the account
 */
var recentlyDiscoveredReaders = [];

/**
 * Object used to hold information about the PaymentIntent associated with a charge
 */
var paymentIntent;

/**
 * Backend API host.
 * For this demo to work, Stripe's example backend should be running
 * https://github.com/stripe/example-terminal-backend
 */
var BACKEND_HOST = 'http://localhost:4567';







/**
 * 1. INITIALIZING THE SDK
 */

 /**
  * Actually initialize the SDK by calling StripeTerminal.create().
  * 
  * See more: https://stripe.com/docs/terminal/sdk/js#initialize
  */
function initializeSDK() {
  terminal = StripeTerminal.create({
    onFetchConnectionToken: fetchConnectionToken,
    onUnexpectedReaderDisconnect: handleReaderDisconnect
  });

  show('step-1-done');
  setStatus('initialized');
}

 /**
  * Callback method passed into in StripeTerminal.create(). 
  * 
  * This method should return a Promise that resolves to the `secret` field found in Stripe's 
  * response from the /v1/terminal/connection_tokens endpoint. (You must call that endpoint
  * from your backend using the secret key, hence the API call to the backend here.)
  * 
  * This method isn't called directly with StripeTerminal.create(), but the Terminal
  * SDK manages its lifecycle and calling this method when necessary.
  * 
  * See more: https://stripe.com/docs/terminal/sdk/js#connection-token-client-side
  */
function fetchConnectionToken() {
  return fetch(BACKEND_HOST + '/connection_token', {method: 'POST'})
    .then(response => response.json())
    .then(data => data.secret)
    .catch(err => console.log(err))
  ;
}

/**
 * Callback method passed into in StripeTerminal.create().
 * 
 * Should contain logic to handle disconnects.
 */
function handleReaderDisconnect() {
  setStatus('unexpected disconnect from reader!');
}



/**
 * 2. DISCOVER READERS
 */

/**
 * Calls terminal.discoverReaders() and prints the result to a list. 
 * 
 * Saves the actual discovery result to a global -- the actual Reader
 * objects returned from terminal.discoverReaders() must be later
 * passed into terminal.connectReader()
 * 
 * Passes simulated:true if the checkbox is checked
 * 
 * See more: https://stripe.com/docs/terminal/readers/connecting/verifone-p400#discover-reader
 */
function discoverReaders() {
  var config = {
    simulated: document.getElementById('use-simulated').checked
  };

  terminal.discoverReaders(config)
    .then(function (discoverResult) {
      recentlyDiscoveredReaders = discoverResult.discoveredReaders;
      writeReadersToScreen();
      show('step-2-done');
      setStatus(`discovered ${discoverResult.discoveredReaders.length} reader(s)`);
    })
  ;
}

/**
 * Utility method to write the discovery results to the page
 */
function writeReadersToScreen() {
  if (recentlyDiscoveredReaders.length > 0) {
    var htmlString = ''; // what we're eventually going to write to the screen
    recentlyDiscoveredReaders.map((reader, idx) => {
      htmlString += `<li>
        <strong>Reader</strong><br />
        ID: ${reader.id} <br />
        Location: ${reader.location} <br />
        Label: ${reader.label} <br />
        <button onclick="connectReader(${idx})">Connect to this reader</button>
      </li>`;
    });

    document.getElementById('readers-list').innerHTML = htmlString;
  }
}



/**
 * 3. CONNECT TO A READER
 */

/**
 * Calls terminal.connectReader() to actually connect this SDK instance
 * to a reader and enable charging or reading of cards to the account.
 * 
 * See more: https://stripe.com/docs/terminal/readers/connecting/verifone-p400#connect-reader
 * 
 * @param {Number} readerIndex the index of the reader we want to connect to
 */
function connectReader(readerIndex) {
  var selectedReader = recentlyDiscoveredReaders[readerIndex];

  // NOTE: terminal.connectReader() takes an *instance of a Reader object* itself,
  // and NOT a string ID
  terminal.connectReader(selectedReader)
    .then(function(connectResult) {
      if (connectResult.error) {
        // show error
        setStatus('error - ' + connectResult.error.message);
      } else {
        // you're now connected to the reader!
        setStatus('connected to ' + selectedReader.id);
        show('step-3-done');
      }
    });
}



/**
 * 4. START CHECKOUT PROCESS
 */

/**
 * If you want to actually collect a payment, ask the backend to create a PaymentIntent
 * and pass its secret to used here in the client.
 * 
 * See more: https://stripe.com/docs/terminal/payments#create
 */
function initiateCheckout() {
  var formData = new URLSearchParams();
  formData.append("amount", 4800);
  formData.append("currency", 'usd');
  formData.append("description", `Test at ${new Date().toISOString()}`);

  fetch(BACKEND_HOST + '/create_payment_intent', 
    {
      method: 'POST',
      body: formData
    }
   )
    .then(response => response.json())
    .then(response => {
      paymentIntent = response;
    })
    .then(() => setReaderDisplay())
    .then(() => {
      setStatus(`sever created PaymentIntent (${paymentIntent.intent}); waiting payment method from reader`);
      show('step-4-done');
    })
    .catch(err => console.log(err))
}

/**
 * Use this method to call terminal.readReusableCard() if you simply want to save a card for use later.
 * 
 * See more: https://stripe.com/docs/terminal/payments/saving-cards#read-reusable-card
 */
function saveCardForLater() {
  terminal.readReusableCard().then(function(result) {
    if (result.error) {
      // Placeholder for handling result.error
      setStatus('error - ' + result.error.message);
    } else {
      // Placeholder for sending result.paymentMethod.id to your backend.
      setStatus('created new PaymentMethod - ' + result.payment_method.id);
    }
  });
}



/**
 * 5. COLLECT PAYMENT
 */

 /**
  * Calls terminal.collectPaymentMethod() to actually begin the process of prompting
  * the user for their card. After the user presents their card, this calls
  * terminal.processPayment() which actually processes the payment and runs
  * an authorization on the card.
  * 
  * This uses the `paymentIntent` global that was returned from the server
  * in the previous step.
  * 
  * The result here is a PaymentIntent on Stripe that needs to be captured
  * server-side (next step).
  * 
  * See more: https://stripe.com/docs/terminal/payments#collect
  * And: https://stripe.com/docs/terminal/payments#process
  */
function collectPaymentFromReader() {
  terminal.collectPaymentMethod(paymentIntent.secret).then(function(result) {
    setStatus('collecting payment method');
    if (result.error) {
      // Placeholder for handling result.error
      setStatus('error - ' + connectResult.error.message);
    } else {
      // Placeholder for processing result.paymentIntent
      // NOTE: this must be an object
      return terminal.processPayment(result.paymentIntent).then(function(result) {
        if (result.error) {
          // Placeholder for handling result.error
          setStatus('error - ' + result.error.message);
        } else if (result.paymentIntent) {
          // Placeholder for notifying your backend to capture result.paymentIntent.id
          setStatus('payment processed (needs capture)');
          show('step-5-done');
        }
      });
    }
  });
}

/**
 * 6. CAPTURE PAYMENT
 */

/**
 * At this point we have an uncaptured PaymentIntent that we need to tell our server
 * to capture.
 * 
 * See more: https://stripe.com/docs/terminal/payments#capture
 */
function capturePaymentIntent() {
  var formData = new URLSearchParams();
  formData.append("payment_intent_id", paymentIntent.intent);

  fetch(BACKEND_HOST + '/capture_payment_intent', 
    {
      method: 'POST',
      body: formData
    }
   )
    .then(response => response.json())
    .then(() => terminal.clearReaderDisplay())
    .then(() => {
      setStatus('captured payment - ID: ' + paymentIntent.intent);
      show('step-6-done');
    })
    .catch(err => console.log(err))
}



/**
 * UTILITY METHODS
 */

function setReaderDisplay() {
  return terminal.setReaderDisplay({
    type: 'cart',
    cart: {
      line_items: [
        {
          description: 'Sample item',
          amount: 4400,
          quantity: 1,
        },
      ],
      tax: 400,
      total: 4800,
      currency: 'usd'
    }
  })
}

function show(id) {
  document.getElementById(id).style.display = 'inline';
}

function setStatus(status) {
  document.getElementById('connection-status-field').innerHTML = status;
}