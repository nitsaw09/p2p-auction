const { statuses } = require('./enum');

class Auction {
  constructor() {
    this.auctionItems = {};
  }

  // Add a new auction to the book
  openAuction(auctionId, clientId, item, amount) {
    const auction = {
      auctionId,
      clientId,
      item,
      status: statuses.OPEN,
      amount,
      bids: []
    };

    this.auctionItems[auctionId] = auction;
    console.log('Auction submitted successfully\n');
    return auction;
  }

  // Submit a bid for a specific auction
  submitBid(auctionId, clientId, amount) {
    const auction = this.auctionItems[auctionId];
    if (auction && auction.status === statuses.OPEN) {
      const auctionBidExits = auction.bids.find((bid) => bid.clientId === clientId);
      if (auctionBidExits) {
        console.log(`Already bid is placed for this auction, clientID: ${clientId}\n`);
        return;
      }
      this.auctionItems[auctionId].bids.push({ clientId, amount });
    }
    return auction;
  }

  // Close an auction and notify clients about the result
  closeAuction(auctionId, clientId) {
    const auction = this.auctionItems[auctionId];
    if (auction && auction.status === statuses.OPEN) {
      if (auction.clientId !== clientId) {
        console.log(`Client is not the owner of auction\n`);
        return;
      }
      this.auctionItems[auctionId].status = statuses.CLOSE;
      const bids = this.auctionItems[auctionId].bids;
      let maxBidAmount = 0;
      for (const bid of bids) {
        if (bid.amount > maxBidAmount) {
          maxBidAmount = bid.amount;
          this.auctionItems[auctionId].winnerId = bid.clientId;
        }
      }
      return this.auctionItems[auctionId];
    }
    console.log(`Auction is already closed\n`);
    return null;
  }
}

module.exports = Auction;
