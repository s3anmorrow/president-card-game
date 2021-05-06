import AssetManager from "./AssetManager";
import Card from "./Card";
import HumanPlayer from "./HumanPlayer";
import ComputerPlayer from "./ComputerPlayer";
import Player from "./Player";
import { PLAYER_CARD_SPREAD, COMPUTER_CARD_SPREAD, STAGE_WIDTH, STAGE_HEIGHT, WIN_SCORE } from "./Constants";

export default class Table {
    private stage:createjs.StageGL;
    private statusCounter:number;
    private statusRankings:number[];
    private passIndicator:createjs.Sprite;    
    private players:Player[];
    private playerName:createjs.Sprite;
    
    private _playersInRoundCount:number
    private _currentPlayer:Player;
    private _playedCards:Card[];
    private _playSpot:createjs.Container;

    private eventRoundOver:createjs.Event;
    private eventHumanOut:createjs.Event;
    
    constructor(stage:createjs.StageGL, assetManager:AssetManager) {
        // initialization
        this.stage = stage;
        this._playedCards = [];
        this.players = [];
        this.statusCounter = 0;
        this._playersInRoundCount = 0;

        // playspot where players drop cards
        this._playSpot = new createjs.Container();
        this._playSpot.x = 291;
        this._playSpot.y = 158;
        this._playSpot.addChild(assetManager.getSprite("sprites", "screens/playSpot", 0, 0));

        // construct passIndicator sprite for showing computer passed
        this.passIndicator = assetManager.getSprite("sprites", "cursors/pass", 109, 83);
        // player's name who is taking a turn
        this.playerName = assetManager.getSprite("sprites", "screens/turnYou", 400, 415);

        this.eventRoundOver = new createjs.Event("showSummaryScreen", true, false);
        this.eventHumanOut = new createjs.Event("humanOut", true, false);
    }

    // -------------------------------------------- gets/sets
    // the player object who is currently taking a turn
    public set currentPlayer(value:Player) {
        this._currentPlayer = value; 
    }
    public get currentPlayer():Player {
        return this._currentPlayer;
    }

    public get playSpot():createjs.Container {
        return this._playSpot;
    }

    public get playedCards():Card[] {
        return this._playedCards;
    }

    public get playersInRoundCount():number {
        return this._playersInRoundCount;
    }

    // -------------------------------------------- public methods
    public setup(...players:Player[]):Player[] {
        this.players = players;
        
        // set possible status rankings for number of players
        if (this.players.length == 4) this.statusRankings = [2,1,-1,-2];
        else this.statusRankings = [2,0,-2];
        
        // initialization of Computer Players
        if (this.players.length == 3) {           
            this.players[1].orientation = Player.ORIENTATION_LEFT;
            this.players[2].orientation = Player.ORIENTATION_RIGHT;
        } else {
            this.players[1].orientation = Player.ORIENTATION_LEFT;
            this.players[2].orientation = Player.ORIENTATION_TOP;
            this.players[3].orientation = Player.ORIENTATION_RIGHT;
        }
        
        // reset table
        this.reset();

        return this.players;
    }

    public clearTable():void {
        this._playedCards.forEach(card => card.hideMe());
        this._playedCards = [];
    }

    public showPass():void {
        if (this._currentPlayer instanceof ComputerPlayer) this._playSpot.addChild(this.passIndicator);
    }    
    
    public hidePass():void {
        this._playSpot.removeChild(this.passIndicator);
    }   

    public hideMe():void {
        this.stage.removeChild(this.playSpot);
    }

    public showMe():void {
        this.stage.addChildAt(this.playSpot,1);
    }

    public showTurnMarker(label:boolean = true):void {
        // hide all turn markers for all players
        this.players.forEach(player => player.hand.forEach(card => card.hideTurnMarker()));
        // show current player's turn markers
        this._currentPlayer.hand.forEach(card => card.showTurnMarker())
        // display player name for current turn
        if (label) {
            this.playerName.gotoAndStop("screens/turn" + this._currentPlayer.name);
            this.stage.addChild(this.playerName);
        }
    }

    public hideTurnMarker():void {
        this.players.forEach(player => player.hand.forEach(card => card.hideTurnMarker()));
        this.stage.removeChild(this.playerName);
    }    

    public dealCards():void {
        // all players return cards before dealing
        this.players.forEach(player => player.returnCards()); 

        // deal cards to all players
        while (true) {
            let finished:boolean;
            this.players.forEach(player => finished = player.dealCard());
            if (finished) break;
        }
        this.refreshCards();
    }

    public unloadHumanCards():void {
        // find human player (donor)
        let donor:Player = this.players.find(player => player instanceof HumanPlayer);

        // any cards to unload?
        if (donor.selectedCards.length == 0) return;

        let receiver:Player;
        // find targetted computer player (receiver)
        if (donor.status == Player.STATUS_PRES) {
            receiver = this.players.find(player => player.status == Player.STATUS_AHOLE);
        } else if (donor.status == Player.STATUS_VICE_PRES) {
            receiver = this.players.find(player => player.status == Player.STATUS_VICE_AHOLE);
        }
        // move cards from donor to receiver
        donor.selectedCards.forEach(card => {
            donor.hand.splice(donor.hand.findIndex(myCard => myCard == card), 1);
            receiver.hand.push(card);
        });
        this.refreshCards();
    }

    public swapCards():boolean {
        let donor:Player;
        let cardsToSwap:Card[];
        let selectionReq:boolean = false;

        this.players.forEach(receiver => {
             cardsToSwap = [];
 
            if (receiver.status == Player.STATUS_PRES) {
                // president - find asshole and get his best 2 cards
                donor = this.players.find(player => player.status == Player.STATUS_AHOLE);
                // isolate twos and all other cards (reversed!)
                let twos:Card[] = donor.hand.filter(card => card.rank == 2);
                let others:Card[] = donor.hand.filter(card => card.rank >= 3).reverse();
                // join two arrays as one in usable order and splice to correct number of cards
                cardsToSwap = [...twos, ...others].splice(0, 2);

            } else if (receiver.status == Player.STATUS_VICE_PRES) {
                // vice-president - find vice asshole and get his best 1 card
                donor = this.players.find(player => player.status == Player.STATUS_VICE_AHOLE);
                let twos:Card[] = donor.hand.filter(card => card.rank == 2);
                let others:Card[] = donor.hand.filter(card => card.rank >= 3).reverse();
                cardsToSwap = [...twos, ...others].splice(0, 1);

            } else if (receiver.status == Player.STATUS_NEUTRAL) {
                // neutral - no swap
            } else if (receiver.status == Player.STATUS_VICE_AHOLE) {
                // vice-ahole - find vice-pres and get worst card - only if vice-pres is a computer
                donor = this.players.find(player => player.status == Player.STATUS_VICE_PRES);
                if (donor instanceof ComputerPlayer) cardsToSwap = donor.hand.filter(card => card.rank >= 3).splice(0, 1);
                else selectionReq = true;
            } else if (receiver.status == Player.STATUS_AHOLE) {
                // ahole - find president and get his worst 2 cards - only do swap if prez is a computer
                donor = this.players.find(player => player.status == Player.STATUS_PRES);
                if (donor instanceof ComputerPlayer) cardsToSwap = donor.hand.filter(card => card.rank >= 3).splice(0, 2);
                else selectionReq = true;
            }

            cardsToSwap.forEach(card => {
                // remove card from donor's hand
                donor.hand.splice(donor.hand.findIndex(myCard => myCard == card), 1);
                // add card to receiver's hand
                receiver.hand.push(card);
                if (receiver instanceof HumanPlayer) card.showAddMarker();
            });
        });

        // force refresh of table
        this.refreshCards();

        return selectionReq;
    }

    public playCards():number {
        // isolating player's selected cards about to be played
        let selectedCards:Card[] = this._currentPlayer.selectedCards;

        // determine type of play placed on table
        let playType:number = Player.PLAYED_CARD;
        if (selectedCards.length == 0) playType = Player.PLAYED_PASS;
        else if (selectedCards[0].rank == 2) playType = Player.PLAYED_TWO;

        if (playType != Player.PLAYED_PASS) {
            // hide cards underneath
            this._playedCards.forEach(card => card.hideMe());
            // selected cards are now officially the played cards
            this._playedCards = selectedCards;

            // positioning selected cards in playspace
            let dropSpotX:number = (218 - ((selectedCards.length - 1) * PLAYER_CARD_SPREAD) - 99) / 2;
            selectedCards.forEach(card => {
                card.positionMe(dropSpotX, 15);
                card.playMe();
                dropSpotX = dropSpotX + PLAYER_CARD_SPREAD;
            });
        }
          
        // check if player is out of round
        if (this._currentPlayer.hand.length == 0) {
            // update player
            this._currentPlayer.state = Player.STATE_OUT;
            this._currentPlayer.status = this.statusRankings[this.statusCounter];
            this.statusCounter++;
            this._playersInRoundCount--;
            createjs.Sound.play("playerOut");
            // is this player the human?
            if (this._currentPlayer instanceof HumanPlayer) this.stage.dispatchEvent(this.eventHumanOut);
            // is the round over?
            if (this._playersInRoundCount <= 1) this.stage.dispatchEvent(this.eventRoundOver);
        }

        return playType;
    }

    public roundWrapup():boolean {
        // find which player is loser and turn cards face up
        let loser:Player = this.players.find(player => player.state != Player.STATE_OUT);
        // reveal his cards
        loser.revealCards();
        loser.status = this.statusRankings[this.statusCounter];
        
        // sort players in order of status for next round
        this.players.sort((a:Player, b:Player) => {
            if (a.status > b.status) return -1;
            else if (a.status < b.status) return 1;
            else return 0;
        });

        // update orientation of players to match status order
        let maxIndex:number = this.players.length - 1;
        let index:number = this.players.findIndex(player => player instanceof HumanPlayer);
        for (let orientCounter:number=1; orientCounter<=4; orientCounter++) {
            if ((this.players.length == 3) && (orientCounter == 3)) orientCounter = 4;
            this.players[index].orientation = orientCounter;
            index++;
            if (index > maxIndex) index = 0;
        }

        // update score for each player according to status
        this.players.forEach(player => player.updateScore());
        // has a player won?
        if (this.players.some(player => player.score >= WIN_SCORE)) return false;
        return true;
    }

    public validateCards():boolean {
        let selectedCards:Card[] = this._currentPlayer.selectedCards;
        // if no cards on the table everything is valid
        if (this._playedCards.length == 0) return true;
		// rule set : one 2 to clear any number of cards
		// number of cards selected and in play must be the same number
        if ((selectedCards.length == this._playedCards.length) || (selectedCards[0].rank == 2)) {
            // rank must be higher
            if ((selectedCards[0].rank > this._playedCards[0].rank) || (selectedCards[0].rank == 2)) {
                return true;
            }
        }
		return false;
	}

    public refreshCards():void {
        let dropSpotX:number;
        let dropSpotY:number;
        let cards:Card[];

        this.players.forEach(player => {
            cards = player.hand;

            // sort cards
            cards.sort((a:Card, b:Card) => {
                if (a.rank < b.rank) return -1;
                else if (a.rank > b.rank) return 1;
                else return 0;
            });

            // calculating card x drop spot so all cards are centered on stage
            if (player.orientation == Player.ORIENTATION_LEFT) {
                dropSpotX = 80;
                dropSpotY = Math.floor((STAGE_HEIGHT - (((cards.length - 1) * COMPUTER_CARD_SPREAD) + 99))/2) - 30;
            } else if (player.orientation == Player.ORIENTATION_RIGHT) {
                dropSpotX = 855;
                dropSpotY = Math.floor((STAGE_HEIGHT - (((cards.length - 1) * COMPUTER_CARD_SPREAD) + 99))/2) - 30;
            } else if (player.orientation == Player.ORIENTATION_TOP) {
                dropSpotX = Math.floor((STAGE_WIDTH - (((cards.length - 1) * COMPUTER_CARD_SPREAD) + 99))/2);
                dropSpotY = -55;
            } else {
                dropSpotX = Math.floor((STAGE_WIDTH - (((cards.length - 1) * PLAYER_CARD_SPREAD) + 99))/2);
                dropSpotY = 445;
            }

            // placing cards onto table
            cards.forEach(card => {
                card.positionMe(dropSpotX, dropSpotY);
                card.disableMe();
                if ((player.orientation == Player.ORIENTATION_LEFT) || (player.orientation == Player.ORIENTATION_RIGHT)) {
                    card.rotateMe(90);
                    card.showFaceDown();
                    dropSpotY = dropSpotY + COMPUTER_CARD_SPREAD;
                } else if (player.orientation == Player.ORIENTATION_TOP) {
                    card.rotateMe(0);
                    card.showFaceDown();
                    dropSpotX = dropSpotX + COMPUTER_CARD_SPREAD;
                } else {
                    card.rotateMe(0);
                    card.showFaceUp();
                    dropSpotX = dropSpotX + PLAYER_CARD_SPREAD;
                }
            });
        });
    }

    public reset():void {
        this.hidePass();
        this.clearTable();
        this._playersInRoundCount = this.players.length;
        this.statusCounter = 0;
        this._playedCards = [];
    }
}