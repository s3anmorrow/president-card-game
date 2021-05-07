// createjs typescript definition for TypeScript
/// <reference path="./../node_modules/@types/createjs/index.d.ts" />
// importing createjs framework
import "createjs";
// importing game constants
import { STAGE_WIDTH, STAGE_HEIGHT, FRAME_RATE, ASSET_MANIFEST, TURN_DELAY_DEFAULT, WIN_SCORE } from "./Constants";
import AssetManager from "./AssetManager";
import ScreenManager from "./ScreenManager";
import Card from "./Card";
import HumanPlayer from "./HumanPlayer";
import ComputerPlayer from "./ComputerPlayer";
import Player from "./Player";
import Table from "./Table";

// game variables
let stage:createjs.StageGL;
let canvas:HTMLCanvasElement;

// game objects
let assetManager:AssetManager;
let screenManager:ScreenManager;
let table:Table;
let humanPlayer:HumanPlayer;
let computerPlayer1:ComputerPlayer;
let computerPlayer2:ComputerPlayer;
let computerPlayer3:ComputerPlayer;
let players:Player[];
let deck:Card[];

// other variables
let playerCount:number = 4;  // 4 or 3
let turnIndex:number = 0;
let turnTimer:number;
let turnPhase:number;
let playType:number;
let passCounter:number;
let roundOn:boolean;
let gameOn:boolean;
let turnDelay:number;
let roundCounter:number;

// --------------------------------------------------- private methods
function startGame():void {
    gameOn = true;
    roundCounter = 0;

    // hard reset all possible players for new game (despite whether will be in game or not)
    humanPlayer.hardReset();
    computerPlayer1.hardReset();
    computerPlayer2.hardReset();
    computerPlayer3.hardReset();

    // setup table with players for new game
    if (playerCount == 3) players = table.setup(humanPlayer, computerPlayer1, computerPlayer2);
    else players = table.setup(humanPlayer, computerPlayer1, computerPlayer2, computerPlayer3);

    // new game - deal the cards before starting the round
    table.dealCards();
    // // on new game, randomly pick who goes first
    // turnIndex = randomMe(0, players.length - 1);
    startRound();
}

function startRound():void {
    roundOn = true;            
    passCounter = 0;
    turnIndex = 0;
    turnPhase = 1;
    playType = Player.PLAYED_NONE;
    turnDelay = TURN_DELAY_DEFAULT;

    // soft reset all players for new round
    players.forEach(player => player.softReset()); 

    table.currentPlayer = players[turnIndex];
    table.showMe();
    screenManager.showGame();

    // start the turn timer if not currently human's turn
    if (players[turnIndex] instanceof HumanPlayer) {
        onTurn();
        humanPlayer.enableMe();
    } else {
        turnTimer = window.setInterval(onTurn, turnDelay);
        humanPlayer.disableMe();
    }
}

function processCards():void {
    if (!roundOn) return;

    // has the current player won the round by dropping a two OR everyone passing on last turn?
    if (playType == Player.PLAYED_TWO) {
        console.log("=> 👍 CLEARED WITH TWO");
        table.clearTable();
        passCounter = 0;
    } else if (playType == Player.PLAYED_PASS) {
        console.log("=> ❌ PASSED!");
        table.showPass();
        passCounter++;
        createjs.Sound.play("pass");
    }
    
    // move index to next player (or find next player that is still in the game) as long as no two dropped
    if ((playType != Player.PLAYED_TWO) || (players[turnIndex].state == Player.STATE_OUT)) {
        if (++turnIndex == playerCount) turnIndex = 0;
        while (players[turnIndex].state == Player.STATE_OUT) {
            if (++turnIndex == playerCount) turnIndex = 0;
        }
    }

    // if no pass occurred then reset the counter
    if (playType != Player.PLAYED_PASS) passCounter = 0;  
}

// --------------------------------------------------- event handlers
function onTurn() { 
    if (turnPhase == 1) {
        // TURN PHASE I : highlighting current player
        console.log("********* PLAYER TURN ********************");       
        // setup table for turn
        table.currentPlayer = players[turnIndex];
        table.hidePass();
        table.showTurnMarker();
        // first clear table if player won by all others passing
        if (passCounter >= (table.playersInRoundCount - 1)) {
            console.log("=> 👍 CLEARED WITH PASS");
            table.clearTable();
            passCounter = 0;
        }
        turnPhase++;
    } else if (turnPhase == 2) {
        // TURN PHASE II : selecting and placing cards on table
        if (players[turnIndex] instanceof HumanPlayer) {
            console.log("=> PAUSED FOR HUMAN'S TURN");
            // wait for human to take turn (enable for interactivity)
            window.clearInterval(turnTimer);
            humanPlayer.enableMe();
        } else {
            console.log("=> COMPUTER'S TURN");       
            players[turnIndex].selectCards();
            table.refreshCards();
            playType = table.playCards();
            if (playType != Player.PLAYED_PASS) createjs.Sound.play("playCard");
        } 
        turnPhase++;
    } else {
        // TURN PHASE III : processing played cards
        processCards();
        turnPhase = 1;
    }
}

function onGameEvent(e:createjs.Event):void {
    switch (e.type) {
        case "showIntroScreen":
            // temporarily set the table with 4 players for intro screen
            table.setup(humanPlayer, computerPlayer1, computerPlayer2, computerPlayer3);
            table.dealCards();
            screenManager.showIntro();
            break;
        case "startGameFor3":
            playerCount = 3;
            startGame();
            break;
        case "startGameFor4":
            playerCount = 4;
            startGame();
            break;
        case "cardsSelected":
            console.log("=> HUMAN'S TURN");
            players[turnIndex].selectCards();
            table.refreshCards();
            playType = table.playCards();
            turnPhase = 1;
            // start up turn timer again since was paused for human to take turn
            if (roundOn) {
                processCards();
                if (playType != Player.PLAYED_PASS) createjs.Sound.play("playCard");
                table.showTurnMarker();
                console.log("=> UNPAUSING FOR HUMAN");
                turnTimer = window.setInterval(onTurn, turnDelay);
            }
            break;
        case "humanOut":
            // speed up game now that human is out of round
            turnDelay = turnDelay / 2;
            break;
        case "showSummaryScreen":
            roundOn = false;
            roundCounter++;
            window.clearInterval(turnTimer);
            gameOn = table.roundWrapup();
            table.hideTurnMarker();
            table.hideMe();
            screenManager.showSummary(players, gameOn);
            createjs.Sound.play("roundOver");
            break;
        case "showSwapScreen":
            table.reset();
            table.dealCards();
            if (table.swapCards()) {
                // human is pres or vice-pres - card selection required
                humanPlayer.startSwapSelection();            
                // show turn marker on human player
                table.currentPlayer = humanPlayer;            
            }
            table.showTurnMarker(false);
            screenManager.showCardSwap(humanPlayer);
            break;
        case "startAnotherRound":
            // unload cards from human to computer player of lower status if required
            table.unloadHumanCards();
            startRound();
            break;
        case "showGameOver":
            table.hideTurnMarker();
            let winner:Player = players.find(player => player.score >= WIN_SCORE);
            screenManager.showGameOver(winner, roundCounter);
            createjs.Sound.play("gameOver");
            break;
    }
}

function onReady(e:createjs.Event):void {
    console.log(">> adding sprites to game");

    // construct ScreenManager
    screenManager = new ScreenManager(stage, assetManager);    
    // construct Table
    table = new Table(stage, assetManager);
    // construct deck of Cards
    deck = [];
    for (let n:number=2; n<=14; n++) {
    // for (let n:number=2; n<=13; n++) {
        deck.push(new Card(stage, assetManager, table, "C",n));
        deck.push(new Card(stage, assetManager, table, "H",n));
        deck.push(new Card(stage, assetManager, table, "D",n));
        deck.push(new Card(stage, assetManager, table, "S",n));
    }
    // construct human player
    humanPlayer = new HumanPlayer("You", stage, assetManager, deck, table);
    // construct computer players - need additional access to humanPlayer and table for AI
    computerPlayer1 = new ComputerPlayer("Shifty", stage, assetManager, deck, humanPlayer, table);
    computerPlayer2 = new ComputerPlayer("Janky", stage, assetManager, deck, humanPlayer, table);
    computerPlayer3 = new ComputerPlayer("Clyde", stage, assetManager, deck, humanPlayer, table);
    
    // listen for custom game events
    stage.on("showIntroScreen", onGameEvent);
    stage.on("startGameFor3", onGameEvent);
    stage.on("startGameFor4", onGameEvent);
    stage.on("showSummaryScreen", onGameEvent);
    stage.on("showSwapScreen", onGameEvent);
    stage.on("startAnotherRound", onGameEvent);
    stage.on("showGameOver", onGameEvent);
    stage.on("humanOut", onGameEvent);
    stage.on("cardsSelected", onGameEvent);

    // kick off game with showing intro screen
    stage.dispatchEvent(new createjs.Event("showIntroScreen", true, false));
    
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
    screenManager.update();

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