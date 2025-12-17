// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BarWars is ERC721, Ownable {
    uint256 private _nextTokenId;
    
    enum Side { NONE, BULL, BEAR }

    struct Period {
        uint256 pool;
        uint256 bullTickets;
        uint256 bearTickets;
        bool resolved;
        Side winner;
        uint256 winningTicketCount; // Snapshot at resolution to prevent post-resolution dilution
        uint256 payoutPerTicket;
    }

    struct Ticket {
        uint256 periodId;
        Side side;
        bool claimed;
    }

    uint256 public currentPeriodId;
    uint256 public constant TICKET_PRICE = 0.001 ether;

    mapping(uint256 => Period) public periods;
    mapping(uint256 => Ticket) public tickets;

    event BetPlaced(address indexed player, uint256 periodId, Side side, uint256 amount);
    event PeriodResolved(uint256 periodId, Side winner, uint256 pool, uint256 bullCount, uint256 bearCount);
    event RewardClaimed(address indexed player, uint256 tokenId, uint256 amount);

    constructor() ERC721("BarWarsTicket", "WAR") Ownable(msg.sender) {
        currentPeriodId = 1;
    }

    // 1. Place Bet (Buy Ticket)
    function bet(Side _side) public payable {
        require(msg.value == TICKET_PRICE, "Ticket price is 0.001 ETH");
        require(_side == Side.BULL || _side == Side.BEAR, "Invalid side");
        
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);

        tickets[tokenId] = Ticket({
            periodId: currentPeriodId,
            side: _side,
            claimed: false
        });

        Period storage p = periods[currentPeriodId];
        p.pool += msg.value;
        if (_side == Side.BULL) {
            p.bullTickets++;
        } else {
            p.bearTickets++;
        }

        emit BetPlaced(msg.sender, currentPeriodId, _side, msg.value);
    }

    // 2. Resolve Period (Bot only)
    function resolve(Side _winner) public onlyOwner {
        // V3.71: Allow Side.NONE (0) for House Wins (Tie)
        // require(_winner == Side.BULL || _winner == Side.BEAR, "Draws not supported");
        
        Period storage p = periods[currentPeriodId];
        require(!p.resolved, "Already resolved");

        p.resolved = true;
        p.winner = _winner;
        
        if (_winner == Side.BULL) {
            p.winningTicketCount = p.bullTickets;
        } else if (_winner == Side.BEAR) {
            p.winningTicketCount = p.bearTickets;
        } else {
            // Side.NONE (Tie) -> House Wins (No winning tickets)
            p.winningTicketCount = 0;
        }

        // Calculate payout shares
        if (p.winningTicketCount > 0) {
            p.payoutPerTicket = p.pool / p.winningTicketCount;
        } else {
            // House Wins (Tie) -> Send entire pool to specific House Address
            address payable house = payable(0xf8ec08905aca896dA3b118524E2B09f2c2E83334);
            house.transfer(p.pool);
        }

        emit PeriodResolved(currentPeriodId, _winner, p.pool, p.bullTickets, p.bearTickets);

        // Advance to next period
        currentPeriodId++;
    }

    // 3. Claim Reward
    function claimReward(uint256 _tokenId) public {
        require(ownerOf(_tokenId) == msg.sender, "Not ticket owner");
        Ticket storage t = tickets[_tokenId];
        require(!t.claimed, "Already claimed");

        Period storage p = periods[t.periodId];
        require(p.resolved, "Period not resolved yet");
        require(t.side == p.winner, "Ticket did not win");
        require(p.payoutPerTicket > 0, "No payout for this period");

        t.claimed = true;
        payable(msg.sender).transfer(p.payoutPerTicket);

        emit RewardClaimed(msg.sender, _tokenId, p.payoutPerTicket);
    }
    
    // View Functions
    function getCurrentStats() public view returns (uint256 period, uint256 pool, uint256 bulls, uint256 bears) {
        Period storage p = periods[currentPeriodId];
        return (currentPeriodId, p.pool, p.bullTickets, p.bearTickets);
    }
}
