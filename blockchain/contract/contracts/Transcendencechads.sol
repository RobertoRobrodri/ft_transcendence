// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Transcendencechads {

    address public owner;
    
    // struct Player {
    //     uint256 userid;
    //     string nickname;
    //     uint256 points;
    // }
    
    // struct Pair {
    //     Player player1;
    //     Player player2;
    // }
    
    // struct Round {
    //     Pair[] pairs;
    // }

    // mapping(string => Round[]) private tournaments;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    mapping(string => string) private tournaments;

    function addTournament(string calldata key, string calldata jsonArray) external {
        tournaments[key] = jsonArray;
    }

    function getTournament(string calldata key) external view returns (string memory) {
        return tournaments[key];
    }
    
    // function addTournament(string calldata tournamentId, Player[][][] memory rounds) external onlyOwner {
    //     Round[] storage tournamentRounds = tournaments[tournamentId];
    //     for (uint256 i = 0; i < rounds.length; i++) {
    //         Player[][] memory pairs = rounds[i];
    //         Pair[] storage roundPairs = tournamentRounds[i].pairs;
    //         for (uint256 j = 0; j < pairs.length; j++) {
    //             Player[] memory pair = pairs[j];
    //             if (pair.length == 2) {
    //                 roundPairs.push(Pair(pair[0], pair[1]));
    //             } else if (pair.length == 1) {
    //                 roundPairs.push(Pair(pair[0], Player(0, "", 0))); // Añadir un jugador adicional como "vacío"
    //             } else {
    //                 revert("Invalid pair size");
    //             }
    //         }
    //     }
    // }
    
    // function getTournament(string calldata tournamentId) external view returns (Player[][][] memory) {
    //     Round[] memory rounds = tournaments[tournamentId];
    //     Player[][][] memory results = new Player[][][](rounds.length);
    //     for (uint256 i = 0; i < rounds.length; i++) {
    //         Round memory round = rounds[i];
    //         Pair[] memory pairs = round.pairs;
    //         Player[][] memory roundPlayers = new Player[][](pairs.length);
    //         for (uint256 j = 0; j < pairs.length; j++) {
    //             roundPlayers ;
    //             roundPlayers[j][0] = pairs[j].player1;
    //             roundPlayers[j][1] = pairs[j].player2;
    //         }
    //         results[i] = roundPlayers;
    //     }
    //     return results;
    // }
}
