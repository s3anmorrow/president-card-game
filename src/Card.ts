import AssetManager from "./AssetManager";
import Table from "./Table";

export default class Card {
    // state class constants
    public static STATE_ENABLED:number = 1;
    public static STATE_SELECTED:number = 2;
    public static STATE_DISABLED:number = 3;
    public static STATE_FACEDOWN:number = 4;
    public static STATE_PLAYED:number = 5;

    private eventSelected:createjs.Event;
    private eventDeselected:createjs.Event;

    // private property variables
	private _suit:string;
	private _rank:number;
    private _state:number;

    private stage:createjs.StageGL;
    private sprite:createjs.Sprite;
    private table:Table;
    private upFrame:string;
    private overFrame:string;
    private faceDownFrame:string;

    constructor(stage:createjs.StageGL, assetManager:AssetManager, table:Table, mySuit:string, myRank:number) {
        // initialization
        this.stage = stage;
        this.table = table;
        this._state = Card.STATE_ENABLED;
        this._suit = mySuit;
        this._rank = myRank; 

        this.upFrame = `cards/${this._suit}-${this._rank}_up`;
        this.overFrame = `cards/${this._suit}-${this._rank}_over`;
        this.faceDownFrame = "cards/facedown";

        this.sprite = assetManager.getSprite("sprites", this.upFrame, 0, 0);

        this.sprite.on("mouseover", this.onOver, this);
        this.sprite.on("mouseout", this.onOut, this);
        this.sprite.on("click", this.onSelect, this);

        this.eventSelected = new createjs.Event("cardSelected", true, false);
        this.eventDeselected = new createjs.Event("cardDeselected", true, false);
    }

    // --------------------------------------- gets/sets
    public get rank():number {
        return this._rank;
    }    

    public get state():number {
        return this._state;
    }

    // --------------------------------------- event handlers
    private onOver(e:createjs.Event):void {
        if ((this._state == Card.STATE_ENABLED) || (this._state == Card.STATE_SELECTED)) this.sprite.gotoAndStop(this.overFrame);
    }

    private onOut(e:createjs.Event):void {
        if ((this._state == Card.STATE_ENABLED) || (this._state == Card.STATE_SELECTED)) this.sprite.gotoAndStop(this.upFrame);
    } 
    
    private onSelect(e:createjs.Event):void {
        if (this._state == Card.STATE_ENABLED) {
            this._state = Card.STATE_SELECTED;
            this.sprite.y -= 10;
            this.stage.dispatchEvent(this.eventSelected);
        } else if (this._state == Card.STATE_SELECTED) {
            this._state = Card.STATE_ENABLED;
            this.sprite.y += 10;
            this.stage.dispatchEvent(this.eventDeselected);
        }
    }

    // --------------------------------------- public methods
    public positionMe(x:number, y:number):void {
        this.sprite.x = x;
        this.sprite.y = y;
    }

    public showFaceUp():void {
        this.sprite.gotoAndStop(this.upFrame);
        this.stage.addChild(this.sprite);
    }

    public showFaceDown():void {
        this.sprite.gotoAndStop(this.faceDownFrame);
        this.stage.addChild(this.sprite);
    }

    public rotateMe(degree:number):void {
        this.sprite.rotation = degree;
    }

    public playMe():void {
        this.rotateMe(0);
        this._state = Card.STATE_PLAYED;
        this.sprite.gotoAndStop(this.upFrame);
        this.disableMe();
        this.table.playSpot.addChild(this.sprite);
    }

    public hideMe():void {
        this.stage.removeChild(this.sprite);
        this.table.playSpot.removeChild(this.sprite);
    }

    public disableMe():void {
        this._state = Card.STATE_DISABLED;
    }

    public enableMe():void {
        this._state = Card.STATE_ENABLED;
    }

    public reset():void {
        this._state = Card.STATE_ENABLED;
        this.hideMe();


    }

}