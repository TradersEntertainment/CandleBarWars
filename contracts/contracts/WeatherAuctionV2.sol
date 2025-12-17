// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WeatherAuctionV2 is ERC721, Ownable {
    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 10000;

    // --- Auction State ---
    uint256 public currentHighestBid;
    address public currentHighestBidder;
    string public currentHighestBidderNickname;
    
    // --- Winner State ---
    address public previousWinner; 
    string public nextTopic;       

    // --- Events ---
    event NewBid(address indexed bidder, uint256 amount, string nickname);
    event AuctionSettled(address indexed winner, uint256 amount, uint256 tokenId, string uri);
    event TopicSet(address indexed setter, string topic);

    constructor() ERC721("CryptoWeatherV2", "CWV2") Ownable(msg.sender) {}

    // 1. Place a Bid with Nickname
    function bid(string memory nickname) public payable {
        require(msg.value > currentHighestBid, "Bid must be higher than current highest");
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");

        // Refund previous highest bidder
        if (currentHighestBidder != address(0)) {
            payable(currentHighestBidder).transfer(currentHighestBid);
        }

        currentHighestBid = msg.value;
        currentHighestBidder = msg.sender;
        currentHighestBidderNickname = nickname;

        emit NewBid(msg.sender, msg.value, nickname);
    }

    // 2. Bot settles the auction (~10 mins)
    function settleAuction(string memory _dailyURI) public onlyOwner {
        require(currentHighestBidder != address(0), "No bids to settle");
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");

        // Mint NFT to Winner
        uint256 tokenId = _nextTokenId++;
        _mint(currentHighestBidder, tokenId);
        _setTokenURI(tokenId, _dailyURI); 

        // Transfer funds to Owner
        payable(owner()).transfer(address(this).balance);

        // Record Winner
        previousWinner = currentHighestBidder;
        
        emit AuctionSettled(currentHighestBidder, currentHighestBid, tokenId, _dailyURI);

        // Reset Auction
        currentHighestBid = 0;
        currentHighestBidder = address(0);
        currentHighestBidderNickname = "";
        delete nextTopic; 
    }

    // 3. Winner sets the Topic
    function setNextTopic(string memory _topic) public {
        require(msg.sender == previousWinner, "Only previous winner can set topic");
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

    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }
}
