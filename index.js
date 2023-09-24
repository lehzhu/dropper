const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

// Initialize Twilio client
const accountSid = 'ACe991ddbaf5c99558d90349b2eee7a5a4';
const authToken = 'e63bfd308f17ee4d1257bd7692dbc48c';
const client = new twilio(accountSid, authToken);
const twilioNumber = '+12565989092'

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// In-memory storage for pickup data
const pickups = [];

// In-memory list of subscribed phone numbers
const subscribedNumbers = ['+16479165156', '+16475760258']; // Replace with actual number

//Bootup message 
const instructionMessage = "Use this format for your requests: 'Drop - Item - Coordinates - Deadline - Price' or 'Pickup - Item";
Numbers.forEach(number => { 
  client.messages.create({ 
    body: instructionMessage,
    to: number,
    from:  twilioNumber
  });
});

// Endpoint to receive SMS via Twilio webhook
app.post('/sms', async (req, res) => {
  // Parse the incoming SMS
  const messageBody = req.body.Body;
  const messageArray = messageBody.split(';');
  const coordinates = messageArray[0];
  const description = messageArray[1];

  // Store the pickup data in-memory
  pickups.push({
    coordinates: coordinates,
    description: description,
  });

  // Notify all other users
  const notificationText = `New pickup available at coordinates: ${coordinates}. Description: ${description}`;
  for (let number of subscribedNumbers) {
    await client.messages.create({
      body: notificationText,
      from: twilioNumber, 
      to: number
    }).catch(err => console.log(err));
  }

  // Respond to Twilio
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message('Your pickup has been recorded.');
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

