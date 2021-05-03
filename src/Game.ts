// TODO resetting game
// TODO start screen
// TODO picking lowest cards for human
// TODO points system?

// createjs typescript definition for TypeScript
/// <reference path="./../node_modules/@types/createjs/index.d.ts" />

// importing createjs framework
import "createjs";
// importing game constants
import { STAGE_WIDTH, STAGE_HEIGHT, FRAME_RATE, ASSET_MANIFEST, TURN_DELAY } from "./Constants";
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
let playerTotalCount:number = 4;  // 4 or 3
let turnIndex:number = 0;
let turnTimer:number;
let playType:number;
let passCounter:number;
let roundOn:boolean;
let phase:number;

// --------------------------------------------------- private methods
function startGame():void {
    // initialization
    if (playerTotalCount == 3) {           
        computerPlayer1.orientation = Player.ORIENTATION_LEFT;
        computerPlayer2.orientation = Player.ORIENTATION_RIGHT;
        players = [humanPlayer, computerPlayer1, computerPlayer2];
    } else {
        computerPlayer1.orientation = Player.ORIENTATION_LEFT;
        computerPlayer2.orientation = Player.ORIENTATION_TOP;
        computerPlayer3.orientation = Player.ORIENTATION_RIGHT;
        players = [humanPlayer, computerPlayer1, computerPlayer2, computerPlayer3];
    }
    
    // hard reset all players
    players.forEach(player => player.reset(true));  

    // table needs to know who all the players re
    table.players = players;
    table.reset();
    
    // // when game first starts, randomly pick who goes first
    // // turnIndex = randomMe(0, players.length - 1);
    // turnIndex = 0;
    // table.player = players[turnIndex];

    // start the round with manual event dispatch
    stage.dispatchEvent(new createjs.Event("roundStart", true, false));
}

function processCards():void {
    if (!roundOn) return;

    // has the current player won the round by dropping a two OR everyone passing on last turn?
    if (playType == Player.PLAYED_TWO) {
        console.log("=> CLEARED WITH TWO");
        table.clearTable();
        passCounter = 0;
    } else if (playType == Player.PLAYED_PASS) {
        console.log("=> PASSED!");
        table.showPass();
        passCounter++;
    }
    
    // move index to next player (or find next player that is still in the game) as long as no two dropped
    if ((playType != Player.PLAYED_TWO) || (players[turnIndex].state == Player.STATE_OUT)) {
        if (++turnIndex == playerTotalCount) turnIndex = 0;
        while (players[turnIndex].state == Player.STATE_OUT) {
            if (++turnIndex == playerTotalCount) turnIndex = 0;
        }
    }

    // if no pass occurred then reset the counter
    if (playType != Player.PLAYED_PASS) passCounter = 0;  
}

// --------------------------------------------------- event handlers
function onTurn() { 
    if (phase == 1) {
        // TURN PHASE I : highlighting current player
        console.log("********* PLAYER TURN ********************");       
        // setup table for turn
        table.currentPlayer = players[turnIndex];
        table.hidePass();
        table.showTurnMarker();

        // first clear table if player won by all others passing
        if (passCounter == (players.length - 1)) {
            console.log("=> CLEARED WITH PASS");
            table.clearTable();
            passCounter = 0;
        }
        phase++;
    } else if (phase == 2) {
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
            table.showTurnMarker();
        } 
        phase++;
    } else {
        // TURN PHASE III : processing played cards
        processCards();
        phase = 1;
    }
}

function onGameEvent(e:createjs.Event):void {
    switch (e.type) {
        case "cardsSelected":
            console.log("=> HUMAN'S TURN");
            players[turnIndex].selectCards();
            table.refreshCards();
            playType = table.playCards();
            table.showTurnMarker();
            processCards();
            phase = 1;
            // start up turn timer again since was paused for human to take turn
            if (roundOn) {
                console.log("=> UNPAUSING FOR HUMAN");
                turnTimer = window.setInterval(onTurn, TURN_DELAY);
            }
            break;
        case "humanOut":
            // speed up game
            // window.clearInterval(turnTimer);
            // turnTimer = window.setInterval(onTurn, TURN_DELAY/2);           
            break;
        case "roundOver":
            roundOn = false;
            window.clearInterval(turnTimer);
            table.showLoser();
            // sort players in order of status for next game / summary screen
            players.sort((a:Player, b:Player) => {
                if (a.status > b.status) return -1;
                else if (a.status < b.status) return 1;
                else return 0;
            });
            // update score for each player
            players.forEach(player => player.updateScore());
            humanPlayer.disableMe();
            table.hideMe();
            screenManager.showSummary(players);
            break;
        case "roundCardSwap":
            console.log("CARD SWAP");
            console.table(deck);

            table.dealCards();
            table.refreshCards();
            table.showMe();

            // ?????????? perhaps not do this but hide all turn markers?
            // find human player and set table to display turn marker
            turnIndex = players.findIndex(player => player instanceof HumanPlayer);
            table.currentPlayer = players[turnIndex];
            table.showTurnMarker();


            // isolate players according to status
            let president:Player = players.find(player => player.status == 2);
            let vicePresident:Player = players.find(player => player.status == 1);
            let neutral:Player = players.find(player => player.status == 0);
            let viceAhole:Player = players.find(player => player.status == -1);
            let ahole:Player = players.find(player => player.status == -2);

            // automatically swap out high cards
            let highCards:Card[];
            let lowCards:Card[];
            highCards = ahole.hand.splice(ahole.hand.length - 3, 2);
            highCards.forEach(card => president.hand.push(card));

            console.log("presidents new cards");
            console.table(highCards);

            highCards = viceAhole.hand.splice(viceAhole.hand.length - 2, 1);
            highCards.forEach(card => vicePresident.hand.push(card));

            console.log("vice presidents new cards");
            console.table(highCards);

            // lowCards = president.hand.splice(0, 2);
            // lowCards.forEach(card => ahole.hand.push(card));

            // console.log("aholes new cards");
            // console.table(lowCards);

            // lowCards = vicePresident.hand.splice(0, 2);
            // lowCards.forEach(card => viceAhole.hand.push(card));

            // console.log("vice aholes new cards");
            // console.table(lowCards);

            table.refreshCards();

            // // does the human need to pick one or two lowest card to swap?
            // if ((president instanceof HumanPlayer) || (vicePresident instanceof HumanPlayer)) {
            //     humanPlayer.enableForCardSwap();
            // }
            
            screenManager.showCardSwap();

        
            break;
        case "roundStart":
            console.log("NEW ROUND");

            passCounter = 0;
            turnIndex = 0;
            table.currentPlayer = players[turnIndex];
            phase = 1;
            roundOn = true;            
            playType = Player.PLAYED_NONE;
            table.dealCards();

            // start the turn timer if not currently human's turn
            if (players[turnIndex] instanceof HumanPlayer) {
                onTurn();
                humanPlayer.enableMe();
            } else {
                turnTimer = window.setInterval(onTurn, TURN_DELAY);
                humanPlayer.disableMe();
            }
            break;
        case "gameOver":
                
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
    // for (let n:number=2; n<=10; n++) {
        deck.push(new Card(stage, assetManager, table, "C",n));
        deck.push(new Card(stage, assetManager, table, "H",n));
        // deck.push(new Card(stage, assetManager, table, "D",n));
        // deck.push(new Card(stage, assetManager, table, "S",n));
    }
    // construct human player
    humanPlayer = new HumanPlayer("You", stage, assetManager, deck, table);
    // construct computer players - need additional access to humanPlayer and table for AI
    computerPlayer1 = new ComputerPlayer("Shifty", stage, assetManager, deck, humanPlayer, table);
    computerPlayer2 = new ComputerPlayer("Janky", stage, assetManager, deck, humanPlayer, table);
    computerPlayer3 = new ComputerPlayer("Clyde", stage, assetManager, deck, humanPlayer, table);
    
    // listen for custom game events
    stage.on("roundOver", onGameEvent);
    stage.on("roundStart", onGameEvent);
    stage.on("roundCardSwap", onGameEvent);
    stage.on("gameOver", onGameEvent);
    stage.on("humanOut", onGameEvent);
    stage.on("cardsSelected", onGameEvent);
    
    // ??????????????
    startGame();
    // startRound();
    // ??????????????
    
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