// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Raffle__notEnoughFeeToEnter();
error Raffle__TransactionFail();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(uint256 players, uint256 balance, uint256 state);

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    //Types
    enum RaffleState {
        OPEN,
        CALCULATING
    } //uint256 0= OPEN, 1=CALCULATING

    //State vars
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;

    //Raffle vars
    address private s_recenWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    // Events
    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed player);

    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function enterRaffle() public payable {
        //require(msg.value > i_entranceFee, "Not enough ETH") - gas unoptimised
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__NotOpen();
        }
        if (msg.value < i_entranceFee) {
            revert Raffle__notEnoughFeeToEnter();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    /* In order to return True one must meet the following reqs:
    1. Time interval should be passed
    2. Must be at least one player with ETH deposited
    3. LINK tokens should be on the balance
    4. The lottery must be in open state
    
    */
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = (s_raffleState == RaffleState.OPEN);
        bool timePAssed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool isPlayers = (s_players.length > 0);
        bool isETH = (address(this).balance > 0);
        upkeepNeeded = (isOpen && timePAssed && isPlayers && isETH);
    }

    function performUpkeep(
        bytes calldata /*perform data*/
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(
                s_players.length,
                address(this).balance,
                uint256(s_raffleState)
            );
        }
        s_raffleState = RaffleState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords)
        internal
        override
    {
        uint256 index = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[index];
        s_recenWinner = recentWinner;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        s_raffleState = RaffleState.OPEN;
        (bool success, ) = s_recenWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle__TransactionFail();
        }
        emit WinnerPicked(recentWinner);
    }

    //View functions
    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getRecentWiner() public view returns (address) {
        return s_recenWinner;
    }

    function getState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }
}
