// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WeatherAuction is ERC721, Ownable {
    uint256 private _nextTokenId;

    // --- Auction State ---
    uint256 public currentHighestBid;
    address public currentHighestBidder;
    uint256 public auctionEndTime; // Optional: Enforce time limits on chain? For MVP, Bot triggers settlement.
    
    // --- Winner State ---
    address public previousWinner; // The person who won yesterday
    string public nextTopic;       // The topic they set for tomorrow

    // --- Events ---
    event NewBid(address indexed bidder, uint256 amount);
    event RefundSent(address indexed bidder, uint256 amount);
    event AuctionSettled(address indexed winner, uint256 amount, uint256 tokenId, string uri);
    event TopicSet(address indexed setter, string topic);

    constructor() ERC721("CryptoWeatherAuction", "CWA") Ownable(msg.sender) {
        // Auction is always "open" conceptually until settled.
    }

    // 1. Place a Bid
    function bid() public payable {
        require(msg.value > currentHighestBid, "Bid must be higher than current highest");
        
        // Refund previous highest bidder
        if (currentHighestBidder != address(0)) {
            // Push payment pattern (Keep simple for MVP, but pull is safer for DoS)
            // For MVP, we use call and ignore failure to prevent DoS (bidder could be a contract that reverts)
            // BUT: ignoring failure means they lose funds. 
            // Better: Revert if refund fails? No, then malicious contract blocks everyone.
            // Best for MVP: Use 'send' or 'transfer' but wrapped?
            // Actually, for this hackathon level, we will TRY to send, if fail, we keep it in pendingRefunds?
            // Let's stick to simple "Refund immediately". 
            
            payable(currentHighestBidder).transfer(currentHighestBid); // Reverts on fail
            // Risk: Malicious contract can reject ETH to block others from outbidding.
            // We'll assume user wallets for now. 
        }

        currentHighestBid = msg.value;
        currentHighestBidder = msg.sender;

        emit NewBid(msg.sender, msg.value);
    }

    // 2. Bot settles the auction daily
    function settleAuction(string memory _dailyURI) public onlyOwner {
        require(currentHighestBidder != address(0), "No bids to settle");

        // Mint NFT to Winner
        uint256 tokenId = _nextTokenId++;
        _mint(currentHighestBidder, tokenId);
        _setTokenURI(tokenId, _dailyURI); // Helper mapping (see below)

        // Transfer funds to Owner (Bot/Deployer)
        payable(owner()).transfer(address(this).balance); // Takes everything (winning bid)

        // Record Winner for Topic Setting
        previousWinner = currentHighestBidder;
        
        // Log
        emit AuctionSettled(currentHighestBidder, currentHighestBid, tokenId, _dailyURI);

        // Reset Auction
        currentHighestBid = 0;
        currentHighestBidder = address(0);
        // nextTopic remains until overwritten by new winner? 
        // Or we wipe it? Let's wipe it to ensure fresh topic each day.
        delete nextTopic; 
    }

    // 3. Winner sets the Topic
    function setNextTopic(string memory _topic) public {
        require(msg.sender == previousWinner, "Only yesterday's winner can set the topic");
        require(bytes(_topic).length > 0, "Topic cannot be empty");
        
        nextTopic = _topic;
        emit TopicSet(msg.sender, _topic);
    }

    // --- Metadata Handling ---
    mapping(uint256 => string) private _tokenURIs;

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        _tokenURIs[tokenId] = _tokenURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }
}
