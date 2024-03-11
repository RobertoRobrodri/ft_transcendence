// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Transcendencechads {

    struct Match {
        uint id;
        uint[2] playerIds;
        uint[2] score;
        uint date;
    }

    struct Tournament {
        string[] players;
        Match[] matches;
        uint tournamentId;
    }
    
    Tournament[] tournaments;

    // A new Tournament to the list
    function addTournament(Tournament calldata _newTournament) public {
        // assert(_newTournament.matches.length <= tournaments.length && _newTournament.matches.length > 0);
        // require(_newTournament.matches.length <= tournaments.length, "Array out of bounds");
        tournaments.push(_newTournament);
    }

    // Return the Tournament list
    function getTournaments() public view returns (Tournament[] memory) {
        return tournaments;
    }
}