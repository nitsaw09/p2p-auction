const HyperSwarm = require('hyperswarm');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');
const { actions } = require('./utils/enum');
const DHT = require('hyperdht');
const Auction = require('./utils/auction');

const auction = new Auction();

const topic = Buffer.alloc(32).fill('p2p-auction'); 
const keyPair = DHT.keyPair(topic);

const dht = new DHT({
  port: 50001,
  keyPair, 
  bootstrap: [{ host: '127.0.0.1', port: 30001 }]
})

const swarm = new HyperSwarm({ dht });
const discovery = swarm.join(topic, { server: true, client: true });
discovery.flushed();

const publicKey = swarm.keyPair.publicKey.toString('hex');
console.log(`publicKey: ${publicKey}\n`);

const payload = {};
payload.clientId = `Client_${publicKey.substr(0,6)}`;
console.log(`ClientId: ${payload.clientId}\n`);

let closePrompt = false;

const connectedSockets = [];

swarm.on('connection', async (socket, pearInfo) => {
  console.log(`Connected to peer: ${pearInfo.publicKey.toString('hex')}\n`);
  
  connectedSockets.push(socket);
  
  // Handle incoming messages
  socket.on('data', (data) => {
    modifyAuction(JSON.parse(data.toString()));
  });

  socket.on('close', () => {
    const index = connectedSockets.indexOf(socket);
    if (index !== -1) {
      connectedSockets.splice(index, 1);
    }
  });
});

// Handle errors
swarm.on('error', (err) => {
  console.error('Swarm error:', err);
});

// Modify auction based on action like open, bid and close
function modifyAuction(data) {
  console.log(data);
  const { action, auctionId, clientId, item, amount } = data;

  let auctionData;

  // open new auction item
  if (action === actions.OPEN_AUCTION) {
    auctionData = auction.openAuction(auctionId, clientId, item, amount);
  } 
  
  // bid for auction item
  if (action === actions.BID_AUCTION) {
    auctionData = auction.submitBid(auctionId, clientId, amount);
  }

  // close the existing auction 
  if (action === actions.CLOSE_AUCTION) {
    auctionData = auction.closeAuction(auctionId, clientId);
  } 
  
  if (clientId !== payload.clientId) {
    console.log(auction.auctionItems);
    console.log(`Received new message: ${JSON.stringify(data)}\n`);
  }
  return auctionData;
}

// Broadcast the data to all connected clients
function broadcastData(data) {
  console.log(`Broadcasting the message to connected clients`);
  console.log(data);
  for (const conn of connectedSockets) {
    conn.write(JSON.stringify(data));
  }
  console.log(`Message broadcasted to connected clients`);
}

function checkAuctionExist(auctionId) {
  const data = auction.auctionItems[auctionId];
  if (data) {
    return {
      clientId: data.clientId,
      item: data.item,
      amount: data.amount
    };
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptUser() {
    rl.question(`\nDo you want to (1) Open an auction or (2) Place a bid or (3) close an auction? Enter 1, 2 or 3: `, (choice) => {
      console.log(`ClientId: ${payload.clientId}`);
      if(choice === '1') {
        payload.action = actions.OPEN_AUCTION;
        promptOpenAuction();
      } else if(choice === '2') {
        payload.action = actions.BID_AUCTION;
        promptBid();
      } else if(choice === '3') {
        payload.action = actions.CLOSE_AUCTION;
        promptCLoseAuction();
      } else {
        promptUser();
      }
    });
}

function promptOpenAuction() {
  if (!closePrompt) {
    payload.auctionId = uuidv4();
    console.log(`AuctionId: ${payload.auctionId}`);
    rl.question('Enter auction item: ', (item) => {
      if (!item) {
        console.log(`Item should not be empty`);
        promptOpenAuction();
        return;
      }
      payload.item = item;
      promptAmount();
    });
  }
}

function promptBid() {
  if (!closePrompt) {
    rl.question('Enter auctionId: ', (auctionId) => {
      if (!auctionId) {
        console.log(`AuctionId should not be empty`);
        promptBid();
        return;
      }
      const auctionExist = checkAuctionExist(auctionId);
      if (!auctionExist) {
        console.log(`Auction id doesn't exist for bid: ${auctionId}`);
        promptBid();
      }
      payload.auctionId = auctionId;
      payload.item = auctionExist.item;
      promptAmount(payload);
    });
  }
}

// Enter amount 
function promptAmount() {
  if (!closePrompt) {
    rl.question('Enter amount: ', (amount) => {
      payload.amount = Number(amount);
      if (!amount && payload.amount <= 0) {
        console.log(`Amount should be greater than zero`);
        promptAmount();
      }
      if(modifyAuction(payload)) {
        broadcastData(payload);
      }
    });
  }
}

function promptCLoseAuction() {
  rl.question('Enter AuctionId: ', (auctionId) => {
    if (!auctionId) {
      console.log(`AuctionId should not be empty`);
      promptBid();
    }
    const auctionExist = checkAuctionExist(auctionId);
    if (!auctionExist) {
      console.log(`Auction id doesn't exist for close: ${auctionId}`);
      promptCLoseAuction();
      return;
    }
    payload.auctionId = auctionId;
    payload.item = auctionExist.item;
    payload.amount = auctionExist.amount;
    if(modifyAuction(payload)) {
      broadcastData(payload);
    }
  });
}

rl.input.on('keypress', (key, data) => {
  if (connectedSockets.length > 0) {
    if (data.ctrl && data.name === 'n') {
      closePrompt = false;  
      promptUser(); 
    }
    if (data.ctrl && data.name === 'x') {
      closePrompt = true;
      console.log(`\nPrompt cancelled\n`);
    }
  } else {
    console.log(`No peer is connected yet please wait`)
  }
});