import Card from "./Card";
import Table from "./Table";
import { randomMe } from "./Toolkit";
import AssetManager from "./AssetManager";

export default abstract class Player {
    // state class constants
    public static STATE_CARDS_SELECTED:number = 1;
    public static STATE_CARDS_NOT_SELECTED:number = 2;
    public static STATE_NOT_PLAYING:number = 3;
    public static STATE_DISABLED:number = 4;
    public static STATE_OUT:number = 3;

    public static ORIENTATION_LEFT:number = 1;
    public static ORIENTATION_TOP:number = 2;
    public static ORIENTATION_RIGHT:number = 3;
    public static ORIENTATION_BOTTOM:number = 4;

    public static STATUS_PRESIDENT:number = 2
    public static STATUS_VICE_PRESIDENT:number = 1;
    public static STATUS_NEUTRAL:number = 0;
    public static STATUS_VICE_ASSHOLE:number = -1;
    public static STATUS_ASSHOLE:number = -2;

    public static PLAYED_PASS:number = 0
    public static PLAYED_TWO:number = 1;
    public static PLAYED_CARD:number = 2;
    public static PLAYED_NONE:number = 3;

    protected stage:createjs.StageGL;
    protected deck:Card[];
    protected table:Table;
    protected turnDelayTimer:number;
    protected cursor:createjs.Sprite;

    protected _state:number;
    protected _hand:Card[];
    protected _orientation:number;
    protected _selectedCards:Card[];
    protected _status:number;

    constructor(stage:createjs.StageGL, assetManager:AssetManager, deck:Card[], table:Table) {
        this.reset();
        this.stage = stage;
        this.deck = deck;
        this.table = table;
        this._state = Player.STATE_NOT_PLAYING;
        this._status = Player.STATUS_NEUTRAL;
        this._orientation = Player.ORIENTATION_BOTTOM;

        // construct cursor sprite for mouse pointer (human player) or pass icon (computer player)
        this.cursor = assetManager.getSprite("sprites", "cursors/pass", 0, 0);
    }

    // -------------------------------------------------- gets/sets
    public get hand():Card[] {
        return this._hand;
    }

    public get cardCount():number {
        return this._hand.length;
    }

    public get state():number {
        return this._state;
    }

    public set state(value:number) {
        this._state = value;
    }

    public get selectedCards():Card[] {
        return this._selectedCards;
    }

    public get status():number {
        return this._status;
    } 
    
    public set status(value:number) {
        this._status = value;
    }

    public set orientation(value:number) {
        this._orientation = value;
    }

    public get orientation():number {
        return this._orientation;
    }

    // -------------------------------------------------- public methods
    public dealCard():void {
        if (this.deck.length <= 0) return;
        // deal a single card to the player (remove it from the deck)
        let index:number = randomMe(0, this.deck.length - 1);
        this._hand.push(this.deck[index]);
        // reset card from possible previous game
        this.deck[index].reset();
        this.deck.splice(index,1);	

        // player is now playing!
        this._state = Player.STATE_CARDS_NOT_SELECTED;

        // cards are dealt - position on stage
        this.table.refreshCards(this);
	}

    public revealCards():void {
        this._hand.forEach(card => card.showFaceUp());
    }

    public returnCards(deck:Card[]):void {
        for (let card of this._hand) deck.push(card);
        this._hand = [];
    }

    public selectCards():void {
        // remove played cards from hand
        this._selectedCards.forEach(selectedCard => {
            let index:number = this._hand.findIndex(card => card == selectedCard);
            // put cards back into deck
            this.deck.push(this._hand[index]);
            // hide turn marker for card
            this._hand[index].hideTurnMarker();
            // remove card from hand
            this._hand.splice(index,1);
        });
                
        // reposition the cards now that cards have been played
        this.table.refreshCards(this);

        console.log("Player's selected cards:");
        console.log(this._selectedCards);
    }

    public reset():void {
        // all players are assumed not playing until dealt cards
        this._state = Player.STATE_NOT_PLAYING;
        this._status = Player.STATUS_NEUTRAL;
        this._hand = [];
        this._selectedCards = [];
    }
}