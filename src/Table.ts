import AssetManager from "./AssetManager";
import Card from "./Card";
import HumanPlayer from "./HumanPlayer";
import ComputerPlayer from "./ComputerPlayer";
import Player from "./Player";
import { PLAYER_CARD_SPREAD, COMPUTER_CARD_SPREAD, STAGE_WIDTH, STAGE_HEIGHT } from "./Constants";

export default class Table {
    private stage:createjs.StageGL;
    private sprite:createjs.Sprite;    
    private turnMarker:createjs.Sprite;

    private statusCounter:number;
    private statusRankings:number[];

    private _playersInGame:number
    private passIndicator:createjs.Sprite;    
    
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
        
        // table sprites
        this.sprite = assetManager.getSprite("sprites", "screens/table", 300, 200);
        this.stage.addChild(this.sprite);

        // turn pointer
        this.turnMarker = assetManager.getSprite("sprites","screens/turnMarker",0,0);
        this.stage.addChild(this.turnMarker);

        // playspot where players drop cards
        this._playSpot = new createjs.Container();
        this._playSpot.x = 220;
        this._playSpot.y = 133;
        let playSpotBackground:createjs.Sprite = assetManager.getSprite("sprites", "screens/playSpot", 0, 0);
        this._playSpot.addChild(playSpotBackground);
        this.stage.addChild(this._playSpot);

        // construct passIndicator sprite for showing computer passed
        this.passIndicator = assetManager.getSprite("sprites", "cursors/pass", 77, 58);

        this.eventGameOver = new createjs.Event("gameOver", true, false);
        this.eventHumanOut = new createjs.Event("humanOut", true, false);
    }

    // -------------------------------------------- gets/sets
    // the player object who is currently taking a turn
    public set player(value:Player) {
        this._player = value;
        // adjust turn pointer
        switch (this._player.orientation){
            case Player.ORIENTATION_BOTTOM:
                this.turnMarker.rotation = 0;
                this.turnMarker.x = 300;
                this.turnMarker.y = 400;
                break;
            case Player.ORIENTATION_TOP:
                this.turnMarker.rotation = 180;
                this.turnMarker.x = 300;
                this.turnMarker.y = 0;
                break;
            case Player.ORIENTATION_LEFT:
                this.turnMarker.rotation = 90;
                this.turnMarker.x = -10;
                this.turnMarker.y = 225;
                break;
            case Player.ORIENTATION_RIGHT:
                this.turnMarker.rotation = 270;
                this.turnMarker.x = 610;
                this.turnMarker.y = 225;
                break;            
        }
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
        // reveal its cards
        loser.revealCards();
        loser.status = this.statusRankings[this.statusCounter];
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
            let dropSpotX:number = (155 - ((selectedCards.length - 1) * PLAYER_CARD_SPREAD) - 71) / 2;
            selectedCards.forEach(card => {
                card.positionMe(dropSpotX, 10);
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
            if (this._player instanceof HumanPlayer) this.sprite.dispatchEvent(this.eventHumanOut);
            // is the round over?
            if (this._playersInGame <= 1) this.sprite.dispatchEvent(this.eventGameOver);
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

    public refreshCards(player:Player):void {
        let dropSpotX:number = 0;
        let dropSpotY:number = 340;
        let cards:Card[] = player.hand;
        // sort cards
        cards.sort(this.sortCompare);

        if (player instanceof HumanPlayer) {
            // calculating card x drop spot so all cards are centered on stage
            dropSpotX = Math.floor((STAGE_WIDTH - (((cards.length - 1) * PLAYER_CARD_SPREAD) + 71))/2);
            // placing onto table
            for (let card of cards){
                card.positionMe(dropSpotX, dropSpotY);
                card.showFaceUp();
                dropSpotX = dropSpotX + PLAYER_CARD_SPREAD;
            }
        } else {
            // calculating card x drop spot so all cards are centered on stage
            if (player.orientation == ComputerPlayer.ORIENTATION_LEFT) {
                dropSpotX = 40;
                dropSpotY = Math.floor((STAGE_HEIGHT - (((cards.length - 1) * COMPUTER_CARD_SPREAD) + 71))/2);
            } else if (player.orientation == ComputerPlayer.ORIENTATION_RIGHT) {
                dropSpotX = 650;
                dropSpotY = Math.floor((STAGE_HEIGHT - (((cards.length - 1) * COMPUTER_CARD_SPREAD) + 71))/2);
            } else {
                dropSpotX = Math.floor((STAGE_WIDTH - (((cards.length - 1) * COMPUTER_CARD_SPREAD) + 71))/2);
                dropSpotY = -40;
            }

            // placing cards onto table
            for (let card of cards) {
                card.positionMe(dropSpotX, dropSpotY);
                card.showFaceDown();
                // these are computer cards so no interactivity required
                card.disableMe();
                if ((player.orientation == ComputerPlayer.ORIENTATION_LEFT) || (player.orientation == ComputerPlayer.ORIENTATION_RIGHT)) {
                    card.rotateMe(90);
                    dropSpotY = dropSpotY + COMPUTER_CARD_SPREAD;
                } else {
                    card.rotateMe(0);
                    dropSpotX = dropSpotX + COMPUTER_CARD_SPREAD;
                }
            }
        }

        this.stage.addChild(this._playSpot);
    }

    // --------------------------------------------- private methods   
    private sortCompare(a:Card, b:Card):number {
        if (a.rank < b.rank) {
            return -1;
        } else if (a.rank > b.rank) {
            return 1;
        } else {
            return 0;
        }
    }   
}