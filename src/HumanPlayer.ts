import Player from "./Player";
import Card from "./Card";
import Table from "./Table";
import AssetManager from "./AssetManager";

export default class HumanPlayer extends Player {

    private playSpot:createjs.Container;
    private cursor:createjs.Sprite;
    private eventCardsSelected:createjs.Event;

    constructor(name:string, stage:createjs.StageGL, assetManager:AssetManager, deck:Card[], table:Table) {
        super(name, stage, assetManager, deck, table);

        // initialialization
        this.playSpot = table.playSpot;
        // construct cursor sprite for mouse pointer (human player)
        this.cursor = assetManager.getSprite("sprites", "cursors/pass", 0, 0);

        // add event listeners
        this.playSpot.on("mouseover", this.onOver, this);
        this.playSpot.on("mouseout", this.onOut, this);
        this.playSpot.on("click", this.onClick, this);

        // human player needs to listen for card events
        stage.on("cardSelected", this.onCardEvent, this);
        stage.on("cardDeselected", this.onCardEvent, this);

        this.eventCardsSelected = new createjs.Event("cardsSelected", true, false);
    }
   
    // --------------------------------------------------- public methods
    public update():void {
        if (this._state == Player.STATE_DISABLED) return;
        this.cursor.x = this.stage.mouseX;
        this.cursor.y = this.stage.mouseY;
    }    

    public enableMe():void {
        this._hand.forEach(card => card.enableMe());
        this._state = Player.STATE_CARDS_NOT_SELECTED;
    }

    public disableMe():void {
        this._hand.forEach(card => card.disableMe());
        this.playSpot.cursor = "default";
        this.stage.removeChild(this.cursor);
        this._state = Player.STATE_DISABLED;
    }

    public enableForCardSwap():void {
        // how many low cards am I swapping?
        console.log(this._status);
        // ?????? only swap is this._status > 0 (vice/pres)


        // enable all cards for picking ones to swap
        this._hand.forEach(card => card.enableMe());
        this._state = Player.STATE_CARD_SWAPPING;
    }

    // --------------------------------------------------- event handlers
    private onClick():void {
        if ((this._state == Player.STATE_DISABLED) || (this._state == Player.STATE_CARD_SWAPPING)) return;
        if (this._state == Player.STATE_CARDS_SELECTED) {
            // human playing is playing cards - check if selected cards are valid?
            if (this.table.validateCards() == false) return;
            // player has made a selection for his/her turn
            this.disableMe();
        } else if (this._state == Player.STATE_CARDS_NOT_SELECTED) {
            this._selectedCards = [];
            // human player is passing
            this.disableMe();
        }

        this.playSpot.dispatchEvent(this.eventCardsSelected);
    }

    private onOver(e:createjs.Event):void {
        if ((this._state == Player.STATE_DISABLED) || (this._state == Player.STATE_CARD_SWAPPING)) return;
        // hide real cursor
        this.playSpot.cursor = "none";
        // replace cursor with sprite
        if (this._state == Player.STATE_CARDS_SELECTED) this.cursor.gotoAndStop("cursors/pointer");
        else this.cursor.gotoAndStop("cursors/pass");
        this.cursor.x = this.stage.mouseX;
        this.cursor.y = this.stage.mouseY;
        this.stage.addChild(this.cursor);
    }

    private onOut(e:createjs.Event):void {
        // reset cursor back to real cursor
        this.playSpot.cursor = "default";
        this.stage.removeChild(this.cursor);
    }

    private onCardEvent(e:createjs.Event):void {
        this._selectedCards = [];

        if (this._state == Player.STATE_CARD_SWAPPING) {
            switch (e.type) {
                case "cardSelected":

                    break;
                case "cardDeselected":

                    break;
            }

            // regardless of outcome above - update selectedCards array
            this._hand.forEach(card => {
                if (card.state == Card.STATE_SELECTED) this._selectedCards.push(card);
            });

        } else {

            
            switch (e.type) {
                case "cardSelected":
                    // what is the rank of the selected card?
                    let rank:number = this._hand.find(card => card.state == Card.STATE_SELECTED).rank;
                    // disable all cards except those of the same rank
                    this._hand.forEach(card => {
                        if ((card.state != Card.STATE_SELECTED) && (card.rank != rank)) card.disableMe();
                    });
                    break;
                case "cardDeselected":
                    // are all cards unselected?
                    if (this._hand.find(card => card.state == Card.STATE_SELECTED) == undefined) {
                        this._hand.forEach(card => card.enableMe());
                    }
                    break;
            }

            // regardless of outcome above - update selectedCards array
            this._hand.forEach(card => {
                if (card.state == Card.STATE_SELECTED) this._selectedCards.push(card);
            });

            // adjust state if cards selected or not
            if (this._selectedCards.length > 0) this._state = Player.STATE_CARDS_SELECTED;
            else this._state = Player.STATE_CARDS_NOT_SELECTED;
        }  
        

    }
}