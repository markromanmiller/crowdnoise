// Game Selection
var gamePk;
var favHome;

// Game Status
var winProbability = 50;
var homeScore = 0;
var awayScore = 0;
var halfInning = 0;
var outs = 0;
var base1 = 0;
var base2 = 0;
var base3 = 0;
var excitementIndex = 1;

function getExcitementIndex() {
    var t = (homeScore - awayScore) + 10;
    t = t * 18 + halfInning + (outs >= 3);
    t = t * 3 + (outs % 3);
    t = t * 8 + 4 * base1 + 2 * base2 + base3;
    console.log(t);
    return excitement_indexes[t];
}

function getHomeWinProbability() {
    const request = new XMLHttpRequest();
    request.open("GET", "https://statsapi.mlb.com/api/v1/game/" + gamePk + "/contextMetrics", false);
    request.send(null);
    winProbability = JSON.parse(request.responseText).homeWinProbability;
}

function refreshDisplay() {
    console.log(document.getElementById("display").innerHTML);
    document.getElementById("display").innerHTML =
        "homeScore" + homeScore + "  " +
        "awayScore" + awayScore + "  " +
        "inning" + (halfInning % 2 ? "bot" : "top") + (Math.floor(halfInning / 2) + 1) + "  " +
        "outs" + outs + "  " +
        "base1" + base1 + "  " +
        "base2" + base2 + "  " +
        "base3" + base3 + "  " +
        "winProb" + winProbability + "  " +
        "excitement" + getExcitementIndex();
}

function refreshStatusData() {
    // get linescore data.
    const request = new XMLHttpRequest();
    request.open("GET", "https://statsapi.mlb.com/api/v1.1/game/747208/feed/live", false);
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
    getHomeWinProbability();
    refreshStatusData();
    refreshDisplay();

    // check whether to update the excitement level
    newExcitementIndex = getExcitementIndex()
    if (excitementIndex != newExcitementIndex) {
        updateVolume(excitementIndex, getExcitementIndex());
        excitementIndex = newExcitementIndex;
    }
}

// https://statsapi.mlb.com/api/v1/schedule?sportId=1

// Sound Stuff!
function getRandomFrequency() {
    // range: 300 to 700 centered
    return 250 + winProbability * 4 + Math.random() * 100; // Random frequency between 400 and 450
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

// Functions to start and stop the sound
function startSound() {
    pinkNoise.start();
    pinkNoise.mute = false; // Unmute the white noise
}
function stopSound() {
    pinkNoise.mute = true; // Mute the white noise
}
document.getElementById("startSound").addEventListener("click", startSound);
document.getElementById("stopSound").addEventListener("click", stopSound);


// general setup

gamePk = 747208;

refreshEverything();
const gameUpdateInterval = setInterval(refreshEverything, 15 * 1000);

