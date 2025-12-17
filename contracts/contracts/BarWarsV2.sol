// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BarWarsV2 is ERC721, Ownable {
    uint256 private _nextTokenId;
    
    enum Side { NONE, BULL, BEAR }

    struct Period {
        uint256 pool;
        uint256 bullTickets;
        uint256 bearTickets;
        bool resolved;
        Side winner;
        uint256 winningTicketCount; 
        uint256 payoutPerTicket;
    }

    struct Market {
        string symbol; // e.g., "BTC", "ETH"
        uint256 currentPeriodId;
        mapping(uint256 => Period) periods;
    }

    struct Ticket {
        string symbol;
        uint256 periodId;
        Side side;
        bool claimed;
    }

    // Supported Markets: "BTC", "ETH", "SOL", "XRP"
    mapping(string => Market) public markets;
    mapping(uint256 => Ticket) public tickets;
    // New: Track user bets per market for easier UI display
    // marketSymbol => userAddress => Side => count
    mapping(string => mapping(address => mapping(Side => uint256))) public userBets;

    uint256 public constant TICKET_PRICE = 0.001 ether;

    event BetPlaced(address indexed player, string symbol, uint256 periodId, Side side, uint256 amount);
    event PeriodResolved(string symbol, uint256 periodId, Side winner, uint256 pool, uint256 bullCount, uint256 bearCount);
    event RewardClaimed(address indexed player, uint256 tokenId, uint256 amount);

    constructor() ERC721("BarWarsTicketV2", "WAR2") Ownable(msg.sender) {
        // Initialize Markets
        markets["BTC"].symbol = "BTC";
        markets["BTC"].currentPeriodId = 1;

        markets["ETH"].symbol = "ETH";
        markets["ETH"].currentPeriodId = 1;

        markets["SOL"].symbol = "SOL";
        markets["SOL"].currentPeriodId = 1;

        markets["XRP"].symbol = "XRP";
        markets["XRP"].currentPeriodId = 1;
    }

    // 1. Place Bet
    function bet(string memory _symbol, Side _side) public payable {
        require(msg.value == TICKET_PRICE, "Ticket price is 0.001 ETH");
        require(_side == Side.BULL || _side == Side.BEAR, "Invalid side");
        require(markets[_symbol].currentPeriodId > 0, "Invalid market");
        
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);

        Market storage m = markets[_symbol];
        uint256 pId = m.currentPeriodId;

        tickets[tokenId] = Ticket({
            symbol: _symbol,
            periodId: pId,
            side: _side,
            claimed: false
        });

        Period storage p = m.periods[pId];
        p.pool += msg.value;
        if (_side == Side.BULL) {
            p.bullTickets++;
        } else {
            p.bearTickets++;
        }
        userBets[_symbol][msg.sender][_side]++;

        emit BetPlaced(msg.sender, _symbol, pId, _side, msg.value);
    }

    // 1b. Batch Bet
    function betBatch(string memory _symbol, Side _side, uint256 _count) public payable {
        require(_count > 0, "Count > 0");
        require(msg.value == TICKET_PRICE * _count, "Incorrect ETH");
        require(_side == Side.BULL || _side == Side.BEAR, "Invalid side");
        require(markets[_symbol].currentPeriodId > 0, "Invalid market");

        Market storage m = markets[_symbol];
        uint256 pId = m.currentPeriodId;
        Period storage p = m.periods[pId];

        for (uint256 i = 0; i < _count; i++) {
            uint256 tokenId = _nextTokenId++;
            _mint(msg.sender, tokenId);
            tickets[tokenId] = Ticket({
                symbol: _symbol,
                periodId: pId,
                side: _side,
                claimed: false
            });
        }

        p.pool += msg.value;
        if (_side == Side.BULL) {
            p.bullTickets += _count;
        } else {
            p.bearTickets += _count;
        }
        userBets[_symbol][msg.sender][_side] += _count;

        emit BetPlaced(msg.sender, _symbol, pId, _side, msg.value);
    }

    // 2. Resolve Period (Bot only)
    function resolve(string memory _symbol, Side _winner) public onlyOwner {
        require(_winner == Side.BULL || _winner == Side.BEAR, "Draws not supported");
        Market storage m = markets[_symbol];
        require(m.currentPeriodId > 0, "Invalid market");

        Period storage p = m.periods[m.currentPeriodId];
        require(!p.resolved, "Already resolved");

        p.resolved = true;
        p.winner = _winner;
        
        if (_winner == Side.BULL) {
            p.winningTicketCount = p.bullTickets;
        } else {
            p.winningTicketCount = p.bearTickets;
        }

        if (p.winningTicketCount > 0) {
            p.payoutPerTicket = p.pool / p.winningTicketCount;
        } else {
            payable(owner()).transfer(p.pool); // No winners, dev takes pot
        }

        emit PeriodResolved(_symbol, m.currentPeriodId, _winner, p.pool, p.bullTickets, p.bearTickets);

        // Advance to next period
        m.currentPeriodId++;
    }

    // 3. Claim Reward
    function claimReward(uint256 _tokenId) public {
        require(ownerOf(_tokenId) == msg.sender, "Not ticket owner");
        Ticket storage t = tickets[_tokenId];
        require(!t.claimed, "Already claimed");

        Market storage m = markets[t.symbol];
        Period storage p = m.periods[t.periodId];

        require(p.resolved, "Period not resolved yet");
        require(t.side == p.winner, "Ticket did not win");
        require(p.payoutPerTicket > 0, "No payout");

        t.claimed = true;
        payable(msg.sender).transfer(p.payoutPerTicket);

        emit RewardClaimed(msg.sender, _tokenId, p.payoutPerTicket);
    }
    
    // View Functions
    function getMarketStats(string memory _symbol) public view returns (uint256 period, uint256 pool, uint256 bulls, uint256 bears) {
        Market storage m = markets[_symbol];
        Period storage p = m.periods[m.currentPeriodId];
        return (m.currentPeriodId, p.pool, p.bullTickets, p.bearTickets);
    }

    function getUserMarketStats(string memory _symbol, address _user) public view returns (uint256 bulls, uint256 bears) {
        return (userBets[_symbol][_user][Side.BULL], userBets[_symbol][_user][Side.BEAR]);
    }
}
