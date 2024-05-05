// Game Selection
var gamePk;
var favHome;

// Game Status
var winProbability = 50;
var winProbability2 = 50;
var homeScore = 0;
var awayScore = 0;
var halfInning = 0;
var outs = 0;
var base1 = 0;
var base2 = 0;
var base3 = 0;
var excitementIndex = 1;

function getStatusIndex() {
    var t = (homeScore - awayScore) + 10;
    t = t * 18 + halfInning + (outs >= 3);
    t = t * 3 + (outs % 3);
    return t * 8 + 4 * base1 + 2 * base2 + base3;
}

function getExcitement() {
    if (Math.abs(homeScore - awayScore) > 10) {
        return 1;
    }
    return excitement_indexes[getStatusIndex()];
}

function getWinProbability() {
    if (Math.abs(homeScore - awayScore) > 10) {
        if ((homeScore > awayScore) == favHome) {
            winProbability = 99.9;
        } else {
            winProbability = 0.1;
        }
    } else if (favHome) {
        winProbability = winprob_vector[getStatusIndex()] * 100;
    } else {
        winProbability = (1 - winprob_vector[getStatusIndex()]) * 100;
    }
}

function getWinProbability2() {
    const request = new XMLHttpRequest();
    request.open("GET", "https://statsapi.mlb.com/api/v1/game/" + gamePk + "/contextMetrics", false);
    request.send(null);
    if (favHome) {
        winProbability2 = JSON.parse(request.responseText).homeWinProbability;
    } else {
        winProbability2 = JSON.parse(request.responseText).awayWinProbability;
    }
}

function refreshDisplay() {
    document.getElementById("display").innerHTML =
        "homeScore " + homeScore + "  " +
        "awayScore " + awayScore + "  " +
        "inning " + (halfInning % 2 ? "bot " : "top ") + (Math.floor(halfInning / 2) + 1) + "  " +
        "outs "  + outs + "  " +
        "base1 " + base1 + "  " +
        "base2 " + base2 + "  " +
        "base3 " + base3 + "  " +
        "winProb " + winProbability + "  " +
        "winProb2 " + winProbability2 + "  " +
        "excitement " + getExcitement();
}

function refreshStatusData() {
    // get linescore data.
    const request = new XMLHttpRequest();
    request.open("GET", "https://statsapi.mlb.com/api/v1.1/game/" + gamePk + "/feed/live", false);
    request.send(null);
    const linescore = JSON.parse(request.responseText).liveData.linescore;

    // extract linescore into relevant global variables
    homeScore = linescore.teams.home.runs;
    awayScore = linescore.teams.away.runs;

    halfInning = 2 * (linescore.currentInning - 1) + (1 - linescore.isTopInning);
    outs = linescore.outs;

    base1 = linescore.offense.hasOwnProperty("first");
    base2 = linescore.offense.hasOwnProperty("second");
    base3 = linescore.offense.hasOwnProperty("third");
}

function refreshEverything() {
    // get and show all the new data
    refreshStatusData();
    getWinProbability();
    getWinProbability2();
    refreshDisplay();

    // check whether to update the excitement level
    newExcitementIndex = getExcitement()
    if (excitementIndex != newExcitementIndex) {
        updateVolume(excitementIndex, getExcitement());
        excitementIndex = newExcitementIndex;
    }
}

// https://statsapi.mlb.com/api/v1/schedule?sportId=1

// Sound Stuff!
function getRandomFrequency() {
    // range: 300 to 700 centered
    return 250 + winProbability * 4 + Math.random() * 100; // Random frequency between 400 and 450
}

function updateFilterFrequency() {
    const newFrequency = getRandomFrequency();
    const currentTime = Tone.now();
    const rampTime = 2;

    bandpassFilter.frequency.linearRampToValueAtTime(newFrequency, currentTime + rampTime);
}

// Create a noise source
const pinkNoise = new Tone.Noise("pink");
const pinkNoiseVolume = new Tone.Volume(-10);
const bandpassFilter = new Tone.Filter(425, "bandpass");
pinkNoise.chain(pinkNoiseVolume, bandpassFilter, Tone.Destination);

function updateVolume(oldIndex, newIndex) {
    const currentTime = Tone.now();
    if (oldIndex > newIndex) {
        pinkNoiseVolume.volume.linearRampToValueAtTime(-20, currentTime + 2);
    } else if (oldIndex < newIndex) {
        pinkNoiseVolume.volume.linearRampToValueAtTime(0, currentTime + 2);
    }
    pinkNoiseVolume.volume.linearRampToValueAtTime(-15 + 1.5 * newIndex, currentTime + 10);
}

// general setup

const buttonsDiv = document.getElementById("buttons");

function selectGame(gamePkArg, favHomeArg) {
    gamePk = gamePkArg;
    favHome = favHomeArg;

    pinkNoise.start();
    buttonsDiv.style.display = "none";

    refreshEverything();
    const gameUpdateInterval = setInterval(refreshEverything, 15 * 1000);
    const updateFrequencyInterval = setInterval(updateFilterFrequency, 2 * 1000);
}

const request = new XMLHttpRequest();
request.open("GET", "https://statsapi.mlb.com/api/v1/schedule?sportId=1", false);
request.send(null);
const games = JSON.parse(request.responseText).dates[0].games;

games.forEach(game => {
    if (game.status.abstractGameState == "Live") {
        const awayButton = document.createElement("button");
        awayButton.textContent = game.teams.away.team.name;
        awayButton.onclick = function() {selectGame(game.gamePk, 0)};

        const homeButton = document.createElement("button");
        homeButton.textContent = game.teams.home.team.name;
        homeButton.onclick = function() {selectGame(game.gamePk, 1)};

        const buttonPar = document.createElement("p");
        buttonPar.appendChild(awayButton);
        buttonPar.append(" at ");
        buttonPar.appendChild(homeButton);
        buttonsDiv.appendChild(buttonPar);
    }
});