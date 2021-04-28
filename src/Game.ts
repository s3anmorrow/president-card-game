// createjs typescript definition for TypeScript
/// <reference path="./../node_modules/@types/createjs/index.d.ts" />

// importing createjs framework
import "createjs";
// importing game constants
import { STAGE_WIDTH, STAGE_HEIGHT, FRAME_RATE, ASSET_MANIFEST , MAX_COMPUTER_PLAYERS, TURN_DELAY } from "./Constants";
import AssetManager from "./AssetManager";
import Card from "./Card";
import HumanPlayer from "./HumanPlayer";
import ComputerPlayer from "./ComputerPlayer";
import Player from "./Player";
import Table from "./Table";

// game variables
let stage:createjs.StageGL;
let canvas:HTMLCanvasElement;

// assetmanager object
let assetManager:AssetManager;

// game objects
let table:Table;
let humanPlayer:HumanPlayer;
let computerPlayers:ComputerPlayer[];
let players:Player[];
let deck:Card[];

// other variables
let playerCount:number = 4;
let turnIndex:number = 0;
let turnDelayTimer:number;

// --------------------------------------------------- private methods
function startGame():void {
    if (playerCount == 3) {           
        computerPlayers[0].orientation = Player.ORIENTATION_LEFT;
        computerPlayers[1].orientation = Player.ORIENTATION_RIGHT;
        players = [humanPlayer, computerPlayers[0], computerPlayers[1]];
    } else {
        computerPlayers[0].orientation = Player.ORIENTATION_LEFT;
        computerPlayers[1].orientation = Player.ORIENTATION_TOP;
        computerPlayers[2].orientation = Player.ORIENTATION_RIGHT;
        players = [humanPlayer, computerPlayers[0], computerPlayers[1], computerPlayers[2]];
    }

    // resetting for new game
    players.forEach(player => player.reset());    

    // when game first starts, randomly pick who goes first
    // turnIndex = randomMe(0, players.length - 1);
    turnIndex = 0;
    // table.playerTakingTurn = players[turnIndex];

}

function startRound():void {
    // ?????????????????????????
    // sort players in order of status (president / vice / vice-asshole / asshole)
    // ...



    // deal cards to all players
    while (true) {
        for (let n:number=0; n<playerCount; n++) players[n].dealCard();    
        if (deck.length <= 0) break;
    }

    // start the turns if not currently human's turn
    if (turnIndex == 0) onPlayerTurn();
    else turnDelayTimer = window.setInterval(onPlayerTurn, TURN_DELAY);

}

// --------------------------------------------------- event handlers
function onPlayerTurn() {
    // set table to currently playing player
    table.player = players[turnIndex];

    // has the current player won the round?
    if (table.playerStartingRound == players[turnIndex]) {
        console.log("STARTING new round!");
        table.clearTable();
    }    

    if (players[turnIndex] instanceof ComputerPlayer) {
        console.log("********* COMPUTER'S TURN ********************");
        
        if (players[turnIndex].takeTurn() != Player.PLAYED_TWO) {
            if (++turnIndex == playerCount) turnIndex = 0;
        }

    } else {
        console.log("********* HUMAN'S TURN ********************");
        // wait for human to take turn (enable for interactivity)
        humanPlayer.enableMe();
        // stop turns
        window.clearInterval(turnDelayTimer);
        // listen for click on playspot on table
        table.playSpot.on("cardsSelected", (e:createjs.Event) => {
            if (players[turnIndex].takeTurn() != Player.PLAYED_TWO) {
                if (++turnIndex == playerCount) turnIndex = 0;
                turnDelayTimer = window.setInterval(onPlayerTurn, TURN_DELAY);
            }
        }, this, true);
    }

}


// function onGameEvent(e:createjs.Event):void {
//     switch (e.type) {
//         case "takingTurn":
//             // increment index to next player
//             if (++turnIndex == playerCount) turnIndex = 0;
//             // update table to new player taking turn
//             table.playerTakingTurn = players[turnIndex];
//             // is this player a computer?
//             if (players[turnIndex] instanceof ComputerPlayer) {
//                 console.log("********* COMPUTER'S TURN ********************");
//                 // have computer take turn automatically
//                 players[turnIndex].takeTurn();
//             } else {
//                 console.log("********* HUMAN'S TURN ********************");
//                 // wait for human to take turn (enable for interactivity)
//                 humanPlayer.enableMe();
//             }
//             console.log("************ turn ended *******************");


//             if (table.playerStartingRound == players[turnIndex]) {
//                 console.log("STARTING new round!");
//                 table.reset();
//                 if (--turnIndex < 0) turnIndex = playerCount - 1;
//             }



//             break;

//         case "playerDroppedTwo":
//             // current player takes another turn
//             turnIndex--;

//             console.log("!!! NEW ROUND");

//             break;
//         case "roundEnded":

//             break;
//         case "gameOver":

//             break;
//     }
// }

function onReady(e:createjs.Event):void {
    console.log(">> adding sprites to game");

    // construct Table
    table = new Table(stage, assetManager);
    // construct deck of Cards
    deck = [];
    for (let n:number=2; n<=14; n++) {
        deck.push(new Card(stage, assetManager, table, "C",n));
        deck.push(new Card(stage, assetManager, table, "H",n));
        deck.push(new Card(stage, assetManager, table, "D",n));
        deck.push(new Card(stage, assetManager, table, "S",n));
    }
    // construct human player
    humanPlayer = new HumanPlayer(stage, assetManager, deck, table);
    // construct computer players - need additional access to humanPlayer and table for AI
    computerPlayers = [];
    for (let n:number=0; n<MAX_COMPUTER_PLAYERS; n++) computerPlayers.push(new ComputerPlayer(stage, assetManager, deck, humanPlayer, table));

    // ??????????????
    startGame();
    startRound();
    // ??????????????

    // stage.on("humanTookTurn", onGameEvent);
    // stage.on("computerTurn", onGameEvent);
    // stage.on("playerDroppedTwo", onGameEvent);
    // stage.on("computerTurnTaken", onGameEvent);

    // startup the ticker
    createjs.Ticker.framerate = FRAME_RATE;
    createjs.Ticker.on("tick", onTick);        
    console.log(">> game ready");
}      


function onTick(e:createjs.Event):void {
    // TESTING FPS
    document.getElementById("fps").innerHTML = String(createjs.Ticker.getMeasuredFPS());

    // game loop
    humanPlayer.update();

    // update the stage!
    stage.update();
}

// --------------------------------------------------- main method
function main():void {
    console.log(">> initializing");

    // get reference to canvas
    canvas = <HTMLCanvasElement> document.getElementById("game-canvas");
    // set canvas width and height - this will be the stage size
    canvas.width = STAGE_WIDTH;
    canvas.height = STAGE_HEIGHT;

    // create stage object
    stage = new createjs.StageGL(canvas, { antialias: false });
    stage.enableMouseOver();

    // AssetManager setup
    assetManager = new AssetManager(stage);
    stage.on("allAssetsLoaded", onReady, null, true);
    // load the assets
    assetManager.loadAssets(ASSET_MANIFEST);    
}

main();