import AssetManager from "./AssetManager";
import Player from "./Player";

export default class ScreenManager {
    // custom event for dispatching
    private eventStartGame:createjs.Event;
    private eventResetGame:createjs.Event;

    private assetManager:AssetManager;
    private introScreen:createjs.Container;
    private gameOverScreen:createjs.Container;
    private txtScores:createjs.BitmapText[];
    private summaryScreen:createjs.Container;
    private stage:createjs.StageGL;

    private eventNewGame:createjs.Event;

    constructor(stage:createjs.StageGL, assetManager:AssetManager) {
        this.stage = stage;
        this.assetManager = assetManager;

        // // using containers to contain several displayobjects for easy adding / removing from stage
        // this.introScreen = new createjs.Container(); 
        // this.introScreen.addChild(assetManager.getSprite("sprites","misc/backgroundIntro",0,0));
        // this.introScreen.addChild(bugSprite);

        this.summaryScreen = new createjs.Container();
        this.summaryScreen.x = 123;
        this.summaryScreen.y = 140;
        this.txtScores = [];
        let dropY:number = 115;
        for (let n:number=0; n<4; n++) {
            let txtScore:createjs.BitmapText = new createjs.BitmapText("0", assetManager.getSpriteSheet("glyphs"));
            txtScore.x = 436;
            txtScore.y = dropY;
            this.txtScores.push(txtScore);
            dropY += 35;
        }

        // this.gameOverScreen = new createjs.Container();
        // this.gameOverScreen.addChild(assetManager.getSprite("sprites","misc/backgroundGame",0,0));
        // let gameOverSprite:createjs.Sprite = assetManager.getSprite("sprites","misc/gameOver",70,240);
        // this.gameOverScreen.addChild(gameOverSprite);

        // this.gameScreen = assetManager.getSprite("sprites","misc/backgroundGame",0,0);

        // construct custom event objects
        this.eventNewGame = new createjs.Event("newGame", true, false);
        // this.eventResetGame = new createjs.Event("gameReset", true, false);
    }

    // -------------------------------------------------- public methods
    // public showIntro():void {        
    //     this.hideAll();
    //     this.stage.addChildAt(this.introScreen,0);

    //     // wire up listener to detect click event once and dispatch custom event
    //     this.stage.on("click", (e) => {
    //         this.stage.dispatchEvent(this.eventStartGame);
    //     }, this, true);        
    // }

    // public showGame():void {
    //     this.hideAll();
    //     this.stage.addChildAt(this.gameScreen,0);
    // }

    // public showGameOver():void {
    //     this.hideAll();
    //     this.stage.addChildAt(this.gameOverScreen,0);

    //     // wire up listener to detect click event once and dispatch custom event
    //     this.stage.on("click", (e) => {
    //         this.stage.dispatchEvent(this.eventResetGame);
    //     }, this, true);
    // }

    public showSummary(players:Player[]):void {
        this.hideAll();
        let dropY:number = 115;

        // clear all children of container
        this.summaryScreen.removeAllChildren();
        this.summaryScreen.addChild(this.assetManager.getSprite("sprites","screens/summary",0,0));

        // building summary screen
        players.forEach((player, index) => {
            this.summaryScreen.addChild(this.assetManager.getSprite("sprites","screens/summary" + player.name, 139, dropY));
            
            let statusName:string;
            if (player.status == 2) statusName = "President";
            else if (player.status == 1) statusName = "VicePresident";
            else if (player.status == 0) statusName = "Neutral";
            else if (player.status == -1) statusName = "ViceAhole";
            else if (player.status == -2) statusName = "Ahole";
            this.summaryScreen.addChild(this.assetManager.getSprite("sprites","screens/summary" + statusName, 173, dropY));

            this.txtScores[index].text = player.score.toString();
            this.summaryScreen.addChild(this.txtScores[index]);
            dropY += 35;
        })
        this.stage.addChildAt(this.summaryScreen,1);

        // wire up listener to detect click event once and dispatch custom event
        this.summaryScreen.on("click", (e) => {
            this.stage.dispatchEvent(this.eventNewGame);
        }, this, true);
    }

    // -------------------------------------------------- private methods
    private hideAll():void {
        // before every screen change remove all screens from stage
        this.stage.removeChild(this.summaryScreen);
        // this.stage.removeChild(this.gameOverScreen);
        // this.stage.removeChild(this.gameScreen);
    }
}