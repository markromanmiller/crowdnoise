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

function getExcitementIndex() {
    if (Math.abs(homeScore - awayScore) > 10) {
        return 1;
    }
    excitementIndex = excitement_indexes[getStatusIndex()];
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


function boolFill(id, fill) {
    document.getElementById(id).className.baseVal = fill ? "filled" : "";
}

function boolActive(id, active) {
    document.getElementById(id).style.display = active ? "block" : "none";
}

function refreshDisplay() {

    // scores
    document.getElementById("homescore").innerHTML = homeScore;
    document.getElementById("awayscore").innerHTML = awayScore;

    // winprob:
    const winprobMeter = document.getElementById("winprob-meter");
    const background = document.getElementById("winprob-back");
    const fullHeight = background.height.baseVal.value;
    const realHight = winprobMeter.height.baseVal.value = winProbability / 100 * fullHeight;
    if (favHome) {
        winprobMeter.y.baseVal.value = background.y.baseVal.value + (1 - winProbability / 100) * fullHeight;
    } else {
        winprobMeter.y.baseVal.value = background.y.baseVal.value;
    }

    const inning = (Math.floor(halfInning / 2) + 1);

    // innings, half innings
    if (halfInning % 2 == 0) {
        // top half:
        boolActive("minifield-awaybatting", true);
        boolActive("minifield-homebatting", false);
        boolActive("top-inning-obj", true);
        boolActive("bottom-inning-obj", false);
        document.getElementById("top-inning-text").innerHTML = "TOP " + inning;

        // boolFill
        boolFill("out1-away", outs >= 1);
        boolFill("out2-away", outs >= 2);
        boolFill("out3-away", outs >= 3);
        // bases
        boolFill("base1-away", base1);
        boolFill("base2-away", base2);
        boolFill("base3-away", base3);
        // outs
    } else {
        boolActive("minifield-homebatting", true);
        boolActive("minifield-awaybatting", false);
        boolActive("top-inning-obj", false);
        boolActive("bottom-inning-obj", true);
        document.getElementById("bottom-inning-text").innerHTML = "BOT " + inning;
        // bottom half
        // outs
        // boolFill
        boolFill("out1-home", outs >= 1);
        boolFill("out2-home", outs >= 2);
        boolFill("out3-home", outs >= 3);
        // bases
        boolFill("base1-home", base1);
        boolFill("base2-home", base2);
        boolFill("base3-home", base3);
    }
    // set up winprob (darker is better)
    for (var i = 1; i <= 10; i++) {
	console.log(excitementIndex);
        boolFill("excitement-" + i, excitementIndex >= i);
        console.log("excitement-" + i);
	console.log(excitementIndex >= i);
    }

    // excitement

}

function refreshDisplay2() {
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
        "excitement " + excitementIndex;
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
    const oldWinProb = winProbability;
    refreshStatusData();
    getWinProbability();
    getWinProbability2();
    getExcitementIndex();
    refreshDisplay();

    // check whether to update the excitement level
    updateVolume(oldWinProb);
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

function updateVolume(oldWinProb) {
    const currentTime = Tone.now();
    const deltaWinProb = winProbability - oldWinProb;

    var timeExtension = 0;
    const baselineVolume = -20 + 1.5 * excitementIndex;
    if (deltaWinProb < 0) {
        pinkNoiseVolume.volume.linearRampToValueAtTime(baselineVolume + deltaWinProb, currentTime + 3);
    } else if (deltaWinProb < 10) {
        pinkNoiseVolume.volume.linearRampToValueAtTime(baselineVolume + deltaWinProb, currentTime + 3);
    } else { //# above 10
        timeExtension = deltaWinProb - 10;
        pinkNoiseVolume.volume.linearRampToValueAtTime(baselineVolume + 10, currentTime + 3);
        pinkNoiseVolume.volume.linearRampToValueAtTime(baselineVolume + 10, currentTime + timeExtension + 3);
    }
    pinkNoiseVolume.volume.linearRampToValueAtTime(baselineVolume, currentTime + timeExtension + 15);
}

// general setup

const buttonsDiv = document.getElementById("buttons");
const ahTeamsMap = new Map();

function selectGame(gamePkArg, favHomeArg) {
    gamePk = gamePkArg;
    favHome = favHomeArg;

    pinkNoise.start();
    buttonsDiv.style.display = "none";
    document.getElementById("away-logo").href.baseVal = "https://midfield.mlbstatic.com/v1/team/" + ahTeamsMap[gamePkArg][0] + "/spots/256";
    document.getElementById("home-logo").href.baseVal = "https://midfield.mlbstatic.com/v1/team/" + ahTeamsMap[gamePkArg][1] + "/spots/256";

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

        ahTeamsMap[game.gamePk] = [game.teams.away.team.id, game.teams.home.team.id];

        const buttonPar = document.createElement("p");
        buttonPar.appendChild(awayButton);
        buttonPar.append(" at ");
        buttonPar.appendChild(homeButton);
        buttonsDiv.appendChild(buttonPar);
    }
});

console.log(ahTeamsMap);
