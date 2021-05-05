import Player from "./Player";
import Card from "./Card";
import Table from "./Table";
import AssetManager from "./AssetManager";

export default class HumanPlayer extends Player {

    private playSpot:createjs.Container;
    private cursor:createjs.Sprite;
    private cardsRequiredToSwap:number;
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
        if ((this._state == Player.STATE_DISABLED) || (this._state == Player.STATE_OUT)) return;
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

    public startSwapSelection():void {
        // number of cards is same as the status (2,1)
        this.cardsRequiredToSwap = Math.abs(this._status);
        // enable all cards for picking ones to swap
        this._hand.forEach(card => card.enableMe());
        this._state = Player.STATE_CARD_SWAPPING;
    }

    // --------------------------------------------------- event handlers
    private onClick():void {
        if ((this._state == Player.STATE_DISABLED) || (this._state == Player.STATE_OUT)) return;
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
        if ((this._state == Player.STATE_DISABLED) || (this._state == Player.STATE_OUT)) return;
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
            // how many cards in the player's hand are selected?
            let count:number = this._hand.filter(card => card.state == Card.STATE_SELECTED).length;

            switch (e.type) {
                case "cardSelected":
                    if (count >= this.cardsRequiredToSwap) {
                        this._hand.forEach(card => {
                            if (card.state != Card.STATE_SELECTED) card.disableMe();
                        });  
                    }
                    break;
                case "cardDeselected":
                    // how many cards are selected?
                    if (count < this.cardsRequiredToSwap) {
                        this._hand.forEach(card => {
                            if (card.state != Card.STATE_SELECTED) {
                                card.enableMe();
                            }
                        });
                    }
                    break;
            }

            this._hand.forEach(card => {
                // regardless of outcome above - update selectedCards array
                if (card.state == Card.STATE_SELECTED) this._selectedCards.push(card);
                // show/hide remove marker of cards when selected
                if (card.state == Card.STATE_SELECTED) card.showRemoveMarker();
                else if (card.state == Card.STATE_ENABLED) card.hideRemoveMarker();
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