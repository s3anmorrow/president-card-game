import Player from "./Player";
import HumanPlayer from "./HumanPlayer";
import Table from "./Table";
import Card from "./Card";
import AssetManager from "./AssetManager";
import { probabilityMe } from "./Toolkit";

export default class ComputerPlayer extends Player {

    private humanPlayer:HumanPlayer;

    constructor(name:string, stage:createjs.StageGL, assetManager:AssetManager, deck:Card[], humanPlayer:HumanPlayer, table:Table) {
        super(name, stage, assetManager, deck, table);
        this.humanPlayer = humanPlayer;
    }

    // ---------------------------------------------- private methods
    private countCards(cards:Card[], rank:number):number {
        let count:number = 0;
        cards.forEach(card => {
            if (card.rank == rank) count++;
        });
        return count;
    }

    // ---------------------------------------------- public methods
    public selectCards():void  {
        // INTELLIGENCE GATHERING
        // number of cards that signifies a low card count
        const LOW_CARD_THRESHOLD:number = 4;
        // number of cards that signifies a high card count
        const HIGH_CARD_THRESHOLD:number = 6;

        // collect information how many cards do I need to play?
        let playedCount:number = this.table.playedCards.length;
        // what is the rank of cards played?
        let playedRank:number = 2;
        if (this.table.playedCards.length > 0) playedRank = this.table.playedCards[0].rank;
        
        // search through hand and find all playable cards and isolate in array
        let playableCards:Card[] = this._hand.filter(card => ((this.countCards(this._hand, card.rank) >= playedCount) && (card.rank > playedRank)));
        // initialize selected cards to none
        this._selectedCards = [];

        // number of 2s in my hand
        let twoCount:number = this.countCards(this._hand, 2);
        let lowCount:number = 0;
        let highCount:number = 0;
        if (playableCards.length > 0) {
            lowCount = this.countCards(playableCards, playableCards[0].rank);
            highCount = this.countCards(playableCards, playableCards[playableCards.length - 1].rank)
        }

        // is my card count low?
        let myLowAlert:boolean = (this._hand.length < LOW_CARD_THRESHOLD);
        // is human player's card count low?
        let humanLowAlert:boolean = (this.humanPlayer.hand.length < LOW_CARD_THRESHOLD);

        if (playedCount == 0) {
            // STARTING NEW ROUND
            if (playableCards.length > 0){
                if (humanLowAlert && probabilityMe(40)) {
                    // aggressive play - drop highest card set to screw over human player
                    this._selectedCards = playableCards.slice(-highCount);
                } else {
                    // passive play - play lowest card set
                    this._selectedCards = playableCards.slice(0, lowCount);
                } 
            } else if (twoCount > 0) {
                // drop a two if that is all that is left
                this._selectedCards = this._hand.slice(0, 1);
            }
        } else {
            // CONTINUING PREVIOUS ROUND - decision tree based on spying
            // does the player have any playable cards?
            if (playableCards.length > 0) {
                if (humanLowAlert) {
                    // aggressive play
                    if (twoCount > 0){
                        // drop two to clear board
                        this._selectedCards = this._hand.slice(0, 1);
                    } else {
                        // play high card(s)
                        this._selectedCards = playableCards.slice(-playedCount);
                    }
                } else if (myLowAlert) {
                    // defensive play
                    if ((twoCount > 0) && (probabilityMe(75))) {
                        // drop two to clear board
                        this._selectedCards = this._hand.slice(0, 1);                        
                    } else {
                        // play low card(s) to get rid of them
                        this._selectedCards = playableCards.slice(0, playedCount);
                    }
                } else if (this._hand.length > HIGH_CARD_THRESHOLD){						
                    // get rid of cards play - play low card(s)
                    this._selectedCards = playableCards.slice(0, playedCount);
                } else if ((twoCount > 0) && (probabilityMe(75))) {
                    // clear board play - player drops a two for no reason
                    this._selectedCards = this._hand.slice(0, 1);                    
                } else if (probabilityMe(10)) {
                    // pass play - 10% chance to pass for no reason
                    this._selectedCards = [];
                    // return;
                } else if (probabilityMe(50)) {
                    // high card play - play high card(s)
                    this._selectedCards = playableCards.slice(-highCount);
                } else {
                    // low card play - play low card(s)
                    this._selectedCards = playableCards.slice(0, playedCount);
                } 
            } else {
                // no playable cards to play - drop twos or pass
                if ((twoCount > 0) && (probabilityMe(60))) {
                    // drop two to clear board
                    this._selectedCards = this._hand.slice(0, 1);
                } else {
                    this._selectedCards = [];
                }
            }
        }       

        // do rest of work in superclass takeTurn()
        super.selectCards();
    }
}