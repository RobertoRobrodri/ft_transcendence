export function drawTournament(data, Canvaid) {
    
    let totalRondas = data.length;
    let cont = 0;
    // console.log("Dibujamos torneo:");
    // console.log(data);
    var divTournament = document.getElementById(Canvaid);
    // Eliminamos todo lo que haya dentro del div de los torneos
    // por si se ha cargado algún torneo antes
    while (divTournament.firstChild) {
        divTournament.removeChild(divTournament.firstChild);
    }
    var tournamentDiv = document.createElement("div");
    tournamentDiv.classList.add("tournament-bracket");
    tournamentDiv.classList.add("tournament-bracket--rounded");
    // tournamentDiv.textContent = "Test";
    var divRounds = document.createElement("div");
    divRounds.classList.add("tournament-bracket__round");
    for (let ronda of data) {
        if(totalRondas != 1)
            if (cont === totalRondas - 1)
                break;

        var ulRound = document.createElement("ul");
        ulRound.classList.add("tournament-bracket__list");
        for (let participantes of ronda) {
            var liParticipantes = document.createElement("li");
            liParticipantes.classList.add("tournament-bracket__item");
            var divPartidos = document.createElement("div");
            divPartidos.classList.add("tournament-bracket__match");
            divPartidos.setAttribute("tabindex", "0");
            var tablePartidos = document.createElement("table");
            tablePartidos.classList.add("tournament-bracket__table");
            var tbodyTable = document.createElement("tbody");
            tbodyTable.classList.add("tournament-bracket__content");

            
            rellenarParticipantes(participantes, tbodyTable);
            
            // tablePartidos.appendChild(obtainCaptionDate("02/05/2024"));
            tablePartidos.appendChild(tbodyTable);
            divPartidos.appendChild(tablePartidos);
            liParticipantes.appendChild(divPartidos);
            ulRound.appendChild(liParticipantes);
        }
        divRounds.appendChild(ulRound);
        cont++;
    }
    divTournament.appendChild(divRounds);
    divTournament.appendChild(tournamentDiv);
}

function createTd(tdClass, text) {
    var newTD = document.createElement("td");
    newTD.classList.add(tdClass);

    if (tdClass === "tournament-bracket__country") {
        var p = document.createElement("p");
        p.classList.add("tournament-bracket__code");
        p.textContent = text;
        newTD.appendChild(p);
    }
    else {
        var span = document.createElement("span");
        span.classList.add("tournament-bracket__number");
        span.textContent = text;
        newTD.appendChild(span);
    }
    return newTD;
}

function createPlayerTr(player) {
    var trPlayer = document.createElement("tr");
    trPlayer.classList.add("tournament-bracket__team");

    trPlayer.appendChild(createTd("tournament-bracket__country", player.nickname));
    trPlayer.appendChild(createTd("tournament-bracket__number", player.points));

    return trPlayer;
}

function rellenarParticipantes(participantes, tbodyTable) {
    let player1 = {
        nickname: participantes[0].nickname,
        points: participantes[0].points
    }
    let player2 = {
        nickname: "Bye",
        points: 0
    }
    if (participantes.length === 2) {
        player2.nickname = participantes[1].nickname;
        player2.points = participantes[1].points;
    }
    var trPlayer1 = createPlayerTr(player1);
    var trPlayer2 = createPlayerTr(player2);

    if (player1.points > player2.points || player2.nickname == "Bye")
        trPlayer1.classList.add("tournament-bracket__team--winner");
    else
        trPlayer2.classList.add("tournament-bracket__team--winner");

    tbodyTable.appendChild(trPlayer1);
    tbodyTable.appendChild(trPlayer2);
}

// function obtainCaptionDate(fecha) {
//     var captionDate = document.createElement("caption");
//     captionDate.classList.add("tournament-bracket__caption");

//     var date = document.createElement("time");

//     // date.setAttribute("datetime", fecha);

//     date.textContent = fecha;
//     captionDate.appendChild(date);

//     return captionDate;
// }
