// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WeatherNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    // The metadata URI for the current "day" or "weather event"
    string public currentDailyURI;
    
    // Cost to mint the daily weather
    uint256 public mintPrice = 0.0001 ether; // Very cheap

    // Event emitted when the weather changes
    event WeatherChanged(string newURI, uint256 timestamp);

    constructor() ERC721("CryptoWeather", "CWTHR") Ownable(msg.sender) {}

    // Owner (the bot) sets the weather for the day
    function setDailyURI(string memory _uri) public onlyOwner {
        currentDailyURI = _uri;
        emit WeatherChanged(_uri, block.timestamp);
    }

    // Users mint the current weather
    function mintToday() public payable returns (uint256) {
        require(msg.value >= mintPrice, "Not enough ETH sent");
        require(bytes(currentDailyURI).length > 0, "Weather not set for today yet");

        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        
        // We are not setting the TokenURI for each token individually to save gas.
        // Instead, we might want to store a mapping of ID -> URI if we want history to stay static
        // For this MVP, let's create a mapping so the "weather" is frozen in time for that token.
        _setTokenURI(tokenId, currentDailyURI);

        return tokenId;
    }

    // Mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        _tokenURIs[tokenId] = _tokenURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }
    
    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
