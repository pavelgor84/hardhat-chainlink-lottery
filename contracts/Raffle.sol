// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerbaseV2.sol";

error Raffle_notEnoughFeeToEnter();

contract Raffle {
    //State vars
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    // Events
    event raffleEnter(address player);

    constructor(uint256 entranceFee) {
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable {
        //require(msg.value > i_entranceFee, "Not enough ETH") - gas unoptimised
        if (msg.value < i_entranceFee) {
            revert Raffle_notEnoughFeeToEnter();
        }
        s_players.push(payable(msg.sender));
        emit raffleEnter(msg.sender);
    }

    function pickRandomWinner() external {}

    //View functions
    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }
}
