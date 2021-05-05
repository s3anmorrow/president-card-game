import Card from "./Card";
import Table from "./Table";
import { randomMe } from "./Toolkit";
import AssetManager from "./AssetManager";

export default abstract class Player {
    // state class constants
    public static STATE_NOT_PLAYING:number = 0;
    public static STATE_CARDS_SELECTED:number = 1;
    public static STATE_CARDS_NOT_SELECTED:number = 2;
    public static STATE_DISABLED:number = 3;
    public static STATE_OUT:number = 4;
    public static STATE_CARD_SWAPPING:number = 5;

    public static ORIENTATION_LEFT:number = 1;
    public static ORIENTATION_TOP:number = 2;
    public static ORIENTATION_RIGHT:number = 3;
    public static ORIENTATION_BOTTOM:number = 4;

    public static PLAYED_PASS:number = 0;
    public static PLAYED_TWO:number = 1;
    public static PLAYED_CARD:number = 2;
    public static PLAYED_NONE:number = 3;

    public static STATUS_PRES:number = 2;
    public static STATUS_VICE_PRES:number = 1;
    public static STATUS_NEUTRAL:number = 0;
    public static STATUS_VICE_AHOLE:number = -1;
    public static STATUS_AHOLE:number = -2;

    protected stage:createjs.StageGL;
    protected deck:Card[];
    protected table:Table;
    protected turnDelayTimer:number;

    protected _state:number;
    protected _name:string;
    protected _score:number;
    protected _hand:Card[];
    protected _orientation:number;
    protected _selectedCards:Card[];
    protected _status:number;

    constructor(name:string, stage:createjs.StageGL, assetManager:AssetManager, deck:Card[], table:Table) {
        this._name = name;
        this._score = 0;
        this.stage = stage;
        this.deck = deck;
        this.table = table;
        this._hand = [];
        this._orientation = Player.ORIENTATION_BOTTOM;
        this.hardReset();
    }

    // -------------------------------------------------- gets/sets
    public get name():string {
        return this._name;
    }

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

    public get score():number {
        return this._score;
    }

    // -------------------------------------------------- public methods
    public dealCard():boolean {
        if (this.deck.length <= 0) return true;

        // deal a single card to the player (remove it from the deck)
        let index:number = randomMe(0, this.deck.length - 1);
        this._hand.push(this.deck[index]);
        
        // reset card from possible previous game
        // this.deck[index].reset();

        this.deck.splice(index,1);

        // player is now playing!
        if (this._state != Player.STATE_DISABLED) this._state = Player.STATE_CARDS_NOT_SELECTED;

        return false;
	}

    public revealCards():void {
        this._hand.forEach(card => card.showFaceUp());
    }

    public returnCards():void {
        this._hand.forEach(card => this.deck.push(card));
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

        console.log("Player's selected cards:");
        console.log(this._selectedCards);
    }

    public updateScore():void {
        this._score = this._score + this._status;
        if (this._score < 0) this._score = 0;
    }

    public softReset(hard:boolean = false):void {
        this._state = Player.STATE_CARDS_NOT_SELECTED;        
        this._status = Player.STATUS_NEUTRAL;
        this._selectedCards = [];
        this.returnCards();
        this._hand = [];        
    }

    public hardReset():void {
        this.softReset();
        this._score = 0;
        this._state = Player.STATE_NOT_PLAYING; 
        this._orientation = Player.ORIENTATION_BOTTOM;   
    }

}