# P2P Auction
A simplified implementation of a peer to peer auction using JavaScript and hyperswarm. In this project the clients can open, bid and close auction and propagate the message to other clients connected in peers.

## Setup
1. Install hyperdht globally:
```npm install -g hyperdht```
2. Run hyperdht
```hyperdht --bootstrap --host 127.0.0.1 --port 30001'```
3. Run package installation
```npm install```


## Usage
- To start multiple client peer run: `npm start` more that one terminal. 
- To open, bid or close auction press `ctrl+n` on terminal once the peer is running and connected to another peer.
- A prompt will be open to choose options for open (1), bid (2) or close (3) auction and ask to enter input.
  1.  `Open Auction`: inputs `Enter item` and `Enter amount` to open a new auction.
  2.  `Bid Auction`: inputs `Enter auctionId` and `Enter amount` to place bid
  3.  `Close Auction`: inputs `Enter auctionId` to close the auction
- To cancel the prompt press `ctrl+x`

## Auction Data Structure

The auction data structure is used to represent auctions within the distributed peer. Each client has its own list of auctions, organized by client ID. Each auction entry contains the following fields:

- `auctionId`: A unique identifier for the auction.
- `clientId`: The ID of the client who placed the open, bid or close auction.
- `amount`: The item sell price
- `item`: The item name for auction
- `status`: Auction status OPEN or CLOSE.
- `bids`: The list of clients placed bid for the auction.
  - `clientId`: The client id who place the bid on auction.
  - `amount`: The amount bid for auction by client
- `winnerId`: The client id of the winner of auction

## Limitations
- Data is not stored in any database like hypercore or hyperbee, instead it is shared among the connected peers and save in client instance temporarly until that peer is connected
