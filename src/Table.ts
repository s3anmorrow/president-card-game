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

    private _player:Player;
    private _playerStartingRound:Player;
    private _playedCards:Card[];
    private _playSpot:createjs.Container;
    private _playersOut:Player[];

    constructor(stage:createjs.StageGL, assetManager:AssetManager) {
        // initialization
        this.stage = stage;
        this._playerStartingRound = null;
        this._playedCards = [];
        this._playersOut = [];

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

    public get playerStartingRound():Player {
        return this._playerStartingRound;
    }

    public get playSpot():createjs.Container {
        return this._playSpot;
    }

    public get playedCards():Card[] {
        return this._playedCards;
    }

    public get playersOut():Player[] {
        return this._playersOut;
    }

    // -------------------------------------------- public methods
    public reset():void {
        this.clearTable();
        this._playersOut = [];
        this._playerStartingRound = null;


    }

    public clearTable():void {
        console.log("CLEARING TABLE");
        this._playedCards.forEach(card => card.hideMe());
        this._playedCards = [];
        this._playerStartingRound = null;
    }

    public playCards():number {
        // isolating player's selected cards about to be played
        let selectedCards:Card[] = this._player.selectedCards;

        // determine type of play placed on table
        let playType:number = Player.PLAYED_CARD;
        if (selectedCards.length == 0) playType = Player.PLAYED_PASS;
        else if (selectedCards[0].rank == 2) playType = Player.PLAYED_TWO;

        if ((playType == Player.PLAYED_CARD) || (this._playerStartingRound == null)) {
            // keeping track of player that is starting the round
            this._playerStartingRound = this._player;
        }
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
            this._player.state = Player.STATE_OUT;
            // add player to list of out players
            this._playersOut.push(this._player);
            // set to null to indicate next player is starting round player
            console.log("*** PLAYER OUT");
            this._playerStartingRound = null;

            // is this player the human?
            // ????????????????? speed up game
        }

        // check if all but one player out of round
        // ???? flip over cards and end round

        

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