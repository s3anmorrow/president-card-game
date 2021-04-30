// TODO resetting game
// TODO start screen
// TODO setting status of players after round
// TODO picking lowest cards for human
// TODO points system?

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
let computerPlayer1:ComputerPlayer;
let computerPlayer2:ComputerPlayer;
let computerPlayer3:ComputerPlayer;
let players:Player[];
let deck:Card[];

// other variables
let playerCount:number = 4;
let turnIndex:number = 0;
let turnDelayTimer:number;
let playType:number;

// --------------------------------------------------- private methods
function startGame():void {
    // initialization
    if (playerCount == 3) {           
        computerPlayer1.orientation = Player.ORIENTATION_LEFT;
        computerPlayer2.orientation = Player.ORIENTATION_RIGHT;
        players = [humanPlayer, computerPlayer1, computerPlayer2];
    } else {
        computerPlayer1.orientation = Player.ORIENTATION_LEFT;
        computerPlayer2.orientation = Player.ORIENTATION_TOP;
        computerPlayer3.orientation = Player.ORIENTATION_RIGHT;
        players = [humanPlayer, computerPlayer1, computerPlayer2, computerPlayer3];
    }
    
    // resetting for new game
    players.forEach(player => player.reset());    
    
    // when game first starts, randomly pick who goes first
    // turnIndex = randomMe(0, players.length - 1);
    turnIndex = 0;
    
}

function startRound():void {
    // initialization
    
    
    // ?????????????????????????
    // sort players in order of status (president / vice / vice-asshole / asshole)
    // ...
    
    
    
    // deal cards to all players
    while (true) {
        for (let n:number=0; n<playerCount; n++) players[n].dealCard();    
        if (deck.length <= 0) break;
    }
    
    // start the turn timer if not currently human's turn
    playType = Player.PLAYED_CARD;
    if (turnIndex == 0) onPlayerTurn();
    else turnDelayTimer = window.setInterval(onPlayerTurn, TURN_DELAY);
    
}

function nextPlayer():void {
    // move index to next player (or find next player that is still in the game) as long as no two dropped
    if (playType != Player.PLAYED_TWO) {
        if (++turnIndex == playerCount) turnIndex = 0;
        while (players[turnIndex].state == Player.STATE_OUT) {
            if (++turnIndex == playerCount) turnIndex = 0;
        }
    }
}

// --------------------------------------------------- event handlers
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
    computerPlayer1 = new ComputerPlayer(stage, assetManager, deck, humanPlayer, table);
    computerPlayer2 = new ComputerPlayer(stage, assetManager, deck, humanPlayer, table);
    computerPlayer3 = new ComputerPlayer(stage, assetManager, deck, humanPlayer, table);

    // ??????????????
    startGame();
    startRound();
    // ??????????????

    // startup the ticker
    createjs.Ticker.framerate = FRAME_RATE;
    createjs.Ticker.on("tick", onTick);        
    console.log(">> game ready");
}     

function onPlayerTurn() { 
    // set table to currently playing player
    table.player = players[turnIndex];
    
    // has the current player won the round by dropping a two OR everyone passing on last turn?
    if ((playType == Player.PLAYED_TWO) || (table.playerStartingRound == players[turnIndex])) {
        console.log("STARTING new round!");
        table.clearTable();
        playType = Player.PLAYED_NONE;

    } else if (players[turnIndex] instanceof ComputerPlayer) {
        console.log("********* COMPUTER'S TURN ********************");       
        players[turnIndex].selectCards();
        playType = table.playCards();
        nextPlayer();
    } else {
        console.log("********* HUMAN'S TURN ********************");
        // wait for human to take turn (enable for interactivity)
        window.clearInterval(turnDelayTimer);
        humanPlayer.enableMe();
        // listen for click on playspot on table
        table.playSpot.on("cardsSelected", (e:createjs.Event) => {
            players[turnIndex].selectCards();
            playType = table.playCards();
            nextPlayer();
            turnDelayTimer = window.setInterval(onPlayerTurn, TURN_DELAY);
        }, this, true);
    }   
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