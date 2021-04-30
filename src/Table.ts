import AssetManager from "./AssetManager";
import Card from "./Card";
import HumanPlayer from "./HumanPlayer";
import ComputerPlayer from "./ComputerPlayer";
import Player from "./Player";
import { PLAYER_CARD_SPREAD, COMPUTER_CARD_SPREAD, STAGE_WIDTH, STAGE_HEIGHT } from "./Constants";

export default class Table {
    private stage:createjs.StageGL;
    private statusCounter:number;
    private statusRankings:number[];
    private passIndicator:createjs.Sprite;    
    private labelContainer:createjs.Container;
    
    private _playersInGame:number
    private _player:Player;
    private _playedCards:Card[];
    private _playSpot:createjs.Container;
    private _playersTotalCount:number;

    private eventGameOver:createjs.Event;
    private eventHumanOut:createjs.Event;
    
    constructor(stage:createjs.StageGL, assetManager:AssetManager) {
        // initialization
        this.stage = stage;
        this._playedCards = [];
        this._playersTotalCount = 4;
        this.statusCounter = 0;
        this._playersInGame = 4;

        // construct background sprite
        let background:createjs.Sprite = assetManager.getSprite("sprites","screens/background",0,0);
        background.scaleX = STAGE_WIDTH;
        background.scaleY = STAGE_HEIGHT;
        stage.addChild(background);   
        
        // table label sprites
        this.labelContainer = new createjs.Container();
        this.labelContainer.addChild(assetManager.getSprite("sprites","screens/tableLabel1",400,145));
        this.labelContainer.addChild(assetManager.getSprite("sprites","screens/tableLabel2",400,354));
        this.labelContainer.addChild(assetManager.getSprite("sprites","screens/tableLabel3",400,376));
        this.stage.addChild(this.labelContainer);

        // playspot where players drop cards
        this._playSpot = new createjs.Container();
        this._playSpot.x = 291;
        this._playSpot.y = 168;
        let playSpotBackground:createjs.Sprite = assetManager.getSprite("sprites", "screens/playSpot", 0, 0);
        this._playSpot.addChild(playSpotBackground);
        this.stage.addChild(this._playSpot);

        // construct passIndicator sprite for showing computer passed
        this.passIndicator = assetManager.getSprite("sprites", "cursors/pass", 109, 83);

        this.eventGameOver = new createjs.Event("gameOver", true, false);
        this.eventHumanOut = new createjs.Event("humanOut", true, false);
    }

    // -------------------------------------------- gets/sets
    // the player object who is currently taking a turn
    public set player(value:Player) {
        this._player = value;
    }

    public get playSpot():createjs.Container {
        return this._playSpot;
    }

    public get playedCards():Card[] {
        return this._playedCards;
    }

    public get playersInGameCount():number {
        return this._playersInGame;
    }

    public set playersTotalCount(value:number) {
        this._playersTotalCount = value;
        this._playersInGame = value;

        if (this._playersTotalCount == 4) this.statusRankings = [2,1,-1,-2];
        else this.statusRankings = [1,0,-1];
    }

    // -------------------------------------------- public methods
    public reset():void {
        this.clearTable();
        this.hidePass();
        this.playersTotalCount = this._playersTotalCount;
        this.statusCounter = 0;
    }

    public clearTable():void {
        this._playedCards.forEach(card => card.hideMe());
        this._playedCards = [];
    }

    public showPass():void {
        if (this._player instanceof ComputerPlayer) this._playSpot.addChild(this.passIndicator);
    }    
    
    public hidePass():void {
        this._playSpot.removeChild(this.passIndicator);
    }   
    
    public showLoser(players:Player[]):void {
        // find which player is loser and turn cards face up
        let loser:Player = players.find(player => player.state != Player.STATE_OUT);
        // highlight the loser on table
        this.player = loser;
        this.showTurnMarker(players);
        // reveal its cards
        loser.revealCards();
        loser.status = this.statusRankings[this.statusCounter];
    }

    public hideMe():void {
        this.stage.removeChild(this.labelContainer);
        this.stage.removeChild(this.playSpot);
    }

    public showMe():void {
        this.stage.addChildAt(this.labelContainer,1);
        this.stage.addChildAt(this.playSpot,1);
    }

    public playCards():number {
        // isolating player's selected cards about to be played
        let selectedCards:Card[] = this._player.selectedCards;

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
        if (this._player.hand.length == 0) {
            // update player
            this._player.state = Player.STATE_OUT;
            this._player.status = this.statusRankings[this.statusCounter];
            this.statusCounter++;
            this._playersInGame--;

            console.log("*** PLAYER OUT with status " + this._player.status + " : number left " + this._playersInGame);

            // is this player the human?
            if (this._player instanceof HumanPlayer) this.stage.dispatchEvent(this.eventHumanOut);
            // is the round over?
            if (this._playersInGame <= 1) this.stage.dispatchEvent(this.eventGameOver);
        }

        return playType;
    }

    public validateCards():boolean {
        let selectedCards:Card[] = this._player.selectedCards;
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

    public showTurnMarker(players:Player[]):void {
        // hide all turn markers for all players
        players.forEach(player => player.hand.forEach(card => card.hideTurnMarker()));
        // show current player's turn markers
        this._player.hand.forEach(card => card.showTurnMarker())
    }

    public refreshCards(player:Player):void {
        let dropSpotX:number;
        let dropSpotY:number;
        let cards:Card[] = player.hand;

        // sort cards
        cards.sort((a:Card, b:Card) => {
            if (a.rank < b.rank) return -1;
            else if (a.rank > b.rank) return 1;
            else return 0;
        });

        // calculating card x drop spot so all cards are centered on stage
        if (player.orientation == Player.ORIENTATION_LEFT) {
            dropSpotX = 80;
            dropSpotY = Math.floor((STAGE_HEIGHT - (((cards.length - 1) * COMPUTER_CARD_SPREAD) + 99))/2);
        } else if (player.orientation == Player.ORIENTATION_RIGHT) {
            dropSpotX = 850;
            dropSpotY = Math.floor((STAGE_HEIGHT - (((cards.length - 1) * COMPUTER_CARD_SPREAD) + 99))/2);
        } else if (player.orientation == Player.ORIENTATION_TOP) {
            dropSpotX = Math.floor((STAGE_WIDTH - (((cards.length - 1) * COMPUTER_CARD_SPREAD) + 99))/2);
            dropSpotY = -50;
        } else {
            dropSpotX = Math.floor((STAGE_WIDTH - (((cards.length - 1) * PLAYER_CARD_SPREAD) + 99))/2);
            dropSpotY = 440;
        }

        // placing cards onto table
        for (let card of cards) {
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
        }
    }
}