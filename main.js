
// pull values that are placed on the scoreboard

// excitement_indexes

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
  //request.responseType = 'json';
  request.open("GET", "https://statsapi.mlb.com/api/v1/game/747208/contextMetrics", false); // `false` makes the request synchronous
  request.send(null);

  winProbability = JSON.parse(request.responseText).homeWinProbability;
}

function refreshDisplay() {
console.log(document.getElementById("display").innerHTML);
	document.getElementById("display").innerHTML = 
	"homeScore" + homeScore + "  " +
    "awayScore" + awayScore + "  " +
    "inning" + (halfInning % 2 ? "bot":"top") + (Math.floor(halfInning / 2) + 1) + "  " +
    "outs"  + outs + "  " +
    "base1"  + base1 + "  " +
    "base2"  + base2 + "  " +
    "base3"  + base3  + "  " +
    "winProb" + winProbability + "  " +
    "excitement" + getExcitementIndex();
}

function refreshStatusData() {
  const request = new XMLHttpRequest();
  //request.responseType = 'json';
  request.open("GET", "https://statsapi.mlb.com/api/v1.1/game/747208/feed/live", false); // `false` makes the request synchronous
  request.send(null);

  const linescore = JSON.parse(request.responseText).liveData.linescore;
  
  homeScore = linescore.teams.home.runs;
  //console.log("homescore", homeScore);
  
  awayScore = linescore.teams.away.runs;
  //console.log("awayscore", awayScore);
  
  halfInning = 2 * (linescore.currentInning - 1) + (1 - linescore.isTopInning);
  
  //console.log("halfinning", halfInning);
  
  outs = linescore.outs;
  
  base1 = linescore.offense.hasOwnProperty("first");
  base2 = linescore.offense.hasOwnProperty("second");
  base3 = linescore.offense.hasOwnProperty("third");
  
}

function refreshEverything() {
  getHomeWinProbability();
  refreshStatusData();
  refreshDisplay();
  newExcitementIndex = getExcitementIndex()
  if (excitementIndex != newExcitementIndex) {
  	updateVolume(excitementIndex, getExcitementIndex());
    excitementIndex = newExcitementIndex;
  }
}


// today's games:
// https://statsapi.mlb.com/api/v1/schedule?sportId=1
// game: 746890
// live endpoint: https://statsapi.mlb.com/api/v1.1/game/746890/feed/live

// liveData.linescore

// https://statsapi.mlb.com/api/v1/game/746890/contextMetrics ... awayWinProbability ... homeWinProbability... (hardcode home here.)

// excitement: get , and index.

// https://statsapi.mlb.com/api/v1/schedule?sportId=1



// Create a noise source
const whiteNoise = new Tone.Noise("pink");

const whiteNoiseVolume = new Tone.Volume(-10);

// Create a bandpass filter with a starting frequency of 425 Hz
const bandpassFilter = new Tone.Filter(425, "bandpass");

// Connect the noise source to the bandpass filter
whiteNoise.chain(whiteNoiseVolume, bandpassFilter, Tone.Destination);

function getRandomFrequency() {
	// range: 300 to 700 centered
  return 250 + winProbability * 4 + Math.random() * 100; // Random frequency between 400 and 450
}

// Function to update the filter's frequency
function updateFilterFrequency() {
  const newFrequency = getRandomFrequency(); // Get a new random frequency
  const currentTime = Tone.now(); // Current time in Tone.js
  const rampTime = 1; // Time to ramp to the new frequency (3 seconds)

  // Smoothly transition to the new frequency
  bandpassFilter.frequency.linearRampToValueAtTime(newFrequency, currentTime + rampTime);
  refreshDisplay();
}

function updateVolume(oldIndex, newIndex) {
console.log("updatingVolume");
console.log("oldIndex", oldIndex);
console.log("newIndex", newIndex);
// called when... excitement changes.
  const currentTime = Tone.now(); // Current time in Tone.js
  if (oldIndex > newIndex) {
  console.log("decreasing excitement");
  	whiteNoiseVolume.volume.linearRampToValueAtTime(-20, currentTime + 2);
  } else if (oldIndex < newIndex) {
  console.log("increasing excitement");
  whiteNoiseVolume.volume.linearRampToValueAtTime(0, currentTime + 2);
  }
  
  whiteNoiseVolume.volume.linearRampToValueAtTime(-15 + 1.5 * newIndex, currentTime + 10);
}

// Start the noise source (but initially mute it)
//whiteNoise.start();
//whiteNoise.mute = true;

// Start changing the filter frequency every 3 seconds
// const frequencyUpdateInterval = setInterval(updateFilterFrequency, 1000);
refreshEverything();
const gameUpdateInterval = setInterval(refreshEverything, 15 * 1000);

// Functions to start and stop the sound
function startSound() {
  whiteNoise.start();
  whiteNoise.mute = false; // Unmute the white noise
}

function stopSound() {
  whiteNoise.mute = true; // Mute the white noise
}

// Add event listeners to buttons
document.getElementById("startSound").addEventListener("click", startSound);
document.getElementById("stopSound").addEventListener("click", stopSound);
