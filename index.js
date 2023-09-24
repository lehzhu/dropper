const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

// Initialize Twilio client
const accountSid = 'ACe991ddbaf5c99558d90349b2eee7a5a4';
const authToken = '60eb6d81378cb1cc5b9d2b702e9e0007';
const client = new twilio(accountSid, authToken);
const twilioNumber = '+12565989092'

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// In-memory storage for pickup data
const pickups = [];

// In-memory list of subscribed phone numbers
const subscribedNumbers = ['+16479165156']; // Replace with actual number

//Bootup message 
const instructionMessage = "Use this format for your requests: 'Drop - Item - Coordinates - Deadline - Price' or 'Pickup - Item";
subscribedNumbers.forEach(number => { 
  client.messages.create({ 
    body: instructionMessage,
    to: number,
    from:  twilioNumber
  });
});

let dropInfo = {}; 
app.post('/sms', (req, res) => { 
  const incomingMessage = req.body.Body;
  const fromNumber = req.body.From; 

  // Parse the incoming message if drop 
  if (incomingMessage.startsWith('Drop')) {
    // Parse the message and store the drop information
    const parts = incomingMessage.split('-').map(part => part.trim());
    const deadlineInHours = parseFloat(parts[3]);
    const deadlineTimestamp = Date.now() + deadlineInHours * 60 * 60 * 1000; // Convert to UTC timestamp
    dropInfo = {
        itemName: parts[1],
        coordinates: parts[2],
        deadlineTimestamp,
        price: parts[4],
        dropNumber: fromNumber
    };
  }
  //Parse incoming if pick 
  else if (incomingMessage.startsWith('Pick')) {
    const itemName = incomingMessage.split('-')[1].trim();
    
    // Check if this item is available for pickup
    if (dropInfo.itemName === itemName) {
        const timeLeftInMinutes = (dropInfo.deadlineTimestamp - Date.now()) / (60 * 1000);
        const responseMessage = `'${itemName}' available for pickup at ${dropInfo.coordinates}. Deadline in ${Math.round(timeLeftInMinutes)} minutes. $${dropInfo.price} asking. Interested? Y/N`;
        client.messages.create({
            body: responseMessage,
            to: fromNumber,
            from: 'yourTwilioNumber'
        });
    }
  }
  else if (incomingMessage === 'Y') {
    const timeLeftInMinutes = (dropInfo.deadlineTimestamp - Date.now()) / (60 * 1000);
    const responseMessage = `Someone is interested in '${dropInfo.itemName}'. Deadline in ${Math.round(timeLeftInMinutes)} minutes.`;
    client.messages.create({
        body: responseMessage,
        to: dropInfo.dropNumber,
        from: 'yourTwilioNumber'
    });
  }
  else { 
    const messageToBroadcast = `New pickup available at coordinates: ${incomingMessage}. description: undefined`;
    console.log(messageToBroadcast);
    // Code to send SMS to other subscribed numbers (using Twilio API or other methods)
    // Respond to the sender
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>Your pickup has been broadcasted.</Message>
      </Response>
    `);
  }
}
);

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
