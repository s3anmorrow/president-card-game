import AssetManager from "./AssetManager";
import Player from "./Player";
import HumanPlayer from "./HumanPlayer";
import { STAGE_WIDTH, STAGE_HEIGHT } from "./Constants";

export default class ScreenManager {
    public static STATE_INTRO:number = 0;
    public static STATE_GAME:number = 1;
    public static STATE_SUMMARY:number = 2;
    public static STATE_SWAP:number = 3;
    public static STATE_GAME_OVER:number = 4;

    private assetManager:AssetManager;
    private introScreen:createjs.Container;
    private summaryScreen:createjs.Container;
    private txtScores:createjs.BitmapText[];
    private swapScreen:createjs.Container;
    private swapPrompt:createjs.Sprite;
    private cursor:createjs.Sprite;
    private humanPlayer:HumanPlayer;
    private selectionCount:number;
    private gameScreen:createjs.Container;
    private gameOverScreen:createjs.Container;
    private winnerPrompt:createjs.Sprite;
    private txtRounds:createjs.BitmapText;
    private stage:createjs.StageGL;
    private state:number;

    private eventShowIntroScreen:createjs.Event;
    private eventShowSwapScreen:createjs.Event;
    private eventStartAnotherRound:createjs.Event;
    private eventStartGameFor3:createjs.Event;
    private eventStartGameFor4:createjs.Event;
    private eventShowGameOver:createjs.Event;

    constructor(stage:createjs.StageGL, assetManager:AssetManager) {
        this.selectionCount = 0;
        this.state = ScreenManager.STATE_INTRO;
        this.stage = stage;
        this.assetManager = assetManager;

        // construct background sprite
        let background:createjs.Sprite = assetManager.getSprite("sprites","screens/background",0,0);
        background.scaleX = STAGE_WIDTH;
        background.scaleY = STAGE_HEIGHT;
        stage.addChild(background);  
        stage.addChild(assetManager.getSprite("sprites","screens/corner",0,0));  
        stage.addChild(assetManager.getSprite("sprites","screens/corner",STAGE_WIDTH - 6,0));  
        stage.addChild(assetManager.getSprite("sprites","screens/corner",0, STAGE_HEIGHT - 6));
        stage.addChild(assetManager.getSprite("sprites","screens/corner",STAGE_WIDTH - 6, STAGE_HEIGHT - 6));

        // cursor sprite
        this.cursor = assetManager.getSprite("sprites", "cursors/checkmark", 0, 0);

        // intro screen initialization
        this.introScreen = new createjs.Container(); 
        this.introScreen.x = 125;
        this.introScreen.y = 138;   
        this.introScreen.addChild(assetManager.getSprite("sprites", "screens/intro", 0, 0));     
        let btnThreePlayers:createjs.Sprite = this.assetManager.getSprite("sprites","screens/btnThreePlayers",55,165);
        btnThreePlayers.on("mouseover", this.onOver, this);
        btnThreePlayers.on("mouseout", this.onOut, this);
        let btnFourPlayers:createjs.Sprite = this.assetManager.getSprite("sprites","screens/btnFourPlayers",55,225);
        btnFourPlayers.on("mouseover", this.onOver, this);
        btnFourPlayers.on("mouseout", this.onOut, this);
        this.introScreen.addChild(btnThreePlayers);
        this.introScreen.addChild(btnFourPlayers);
        btnThreePlayers.on("click", (e:createjs.Event) => this.closeScreen(this.eventStartGameFor3), this);
        btnFourPlayers.on("click", (e:createjs.Event) => this.closeScreen(this.eventStartGameFor4), this);

        // game screen initialization
        this.gameScreen = new createjs.Container();
        this.gameScreen.addChild(assetManager.getSprite("sprites","screens/tableLabel1",400,145));
        this.gameScreen.addChild(assetManager.getSprite("sprites","screens/tableLabel2",400,354));
        this.gameScreen.addChild(assetManager.getSprite("sprites","screens/tableLabel3",400,376));  

        // summary screen initialization
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
        this.summaryScreen.on("mouseover", this.onOver, this);
        this.summaryScreen.on("mouseout", this.onOut, this);

        // card swap screen initialization
        this.swapScreen = new createjs.Container();
        this.swapScreen.x = 123;
        this.swapScreen.y = 140;
        this.swapPrompt = this.assetManager.getSprite("sprites","screens/swapPresident",0,0);
        this.swapScreen.addChild(this.swapPrompt);
        this.swapScreen.on("mouseover", this.onOver, this);
        this.swapScreen.on("mouseout", this.onOut, this);
        this.swapScreen.on("click", this.onSwapSelection, this);

        // game over screen initialization
        this.gameOverScreen = new createjs.Container();
        this.gameOverScreen.x = 150;
        this.gameOverScreen.y = 140;   
        this.gameOverScreen.addChild(assetManager.getSprite("sprites","screens/gameOver",0,0));
        this.winnerPrompt = assetManager.getSprite("sprites","screens/gameOverYou",22,80);
        this.gameOverScreen.addChild(this.winnerPrompt);
        this.txtRounds = new createjs.BitmapText("0", assetManager.getSpriteSheet("glyphs"));
        this.txtRounds.x = 380;
        this.txtRounds.y = 130;
        this.gameOverScreen.addChild(this.txtRounds);
        let btnMenu:createjs.Sprite = assetManager.getSprite("sprites","screens/btnMenu",30,190);
        btnMenu.on("mouseover", this.onOver, this);
        btnMenu.on("mouseout", this.onOut, this);
        btnMenu.on("click", (e:createjs.Event) => this.closeScreen(this.eventShowIntroScreen), this);
        this.gameOverScreen.addChild(btnMenu);

        // construct custom event objects
        this.eventShowIntroScreen = new createjs.Event("showIntroScreen", true, false);
        this.eventShowSwapScreen = new createjs.Event("showSwapScreen", true, false);
        this.eventStartAnotherRound = new createjs.Event("startAnotherRound", true, false);
        this.eventStartGameFor3 = new createjs.Event("startGameFor3", true, false);
        this.eventStartGameFor4 = new createjs.Event("startGameFor4", true, false);
        this.eventShowGameOver = new createjs.Event("showGameOver", true, false);
    }

    // -------------------------------------------------- public methods
    public showIntro():void {  
        this.state = ScreenManager.STATE_INTRO;      
        this.hideAll();
        this.stage.addChildAt(this.introScreen,1);
    }

    public showGame():void {
        this.state = ScreenManager.STATE_GAME;
        this.hideAll();
        this.stage.addChildAt(this.gameScreen, 1);
    }

    public showSummary(players:Player[], gameOn:boolean = true):void {
        this.state = ScreenManager.STATE_SUMMARY;
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

        // wire up event listener according to whether game is on or not after summary screen
        if (gameOn) this.summaryScreen.on("click", (e:createjs.Event) => this.closeScreen(this.eventShowSwapScreen), this, true);
        else this.summaryScreen.on("click", (e:createjs.Event) => this.closeScreen(this.eventShowGameOver), this, true);
    }

    public showCardSwap(humanPlayer:HumanPlayer):void {
        this.state = ScreenManager.STATE_SWAP;
        this.hideAll();

        // does the human player have to select cards to swap?
        this.humanPlayer = humanPlayer;
        if (humanPlayer.status > Player.STATUS_NEUTRAL) {
            // change cursor to xmark (until cards selected for unloading)
            this.cursor.gotoAndStop("cursors/xmark");
            this.selectionCount = humanPlayer.status;
        }

        // display correct prompt according to human player's status
        if (humanPlayer.status == Player.STATUS_PRES) this.swapPrompt.gotoAndStop("screens/swapPresident");
        else if (humanPlayer.status == Player.STATUS_VICE_PRES) this.swapPrompt.gotoAndStop("screens/swapVicePresident");
        else if (humanPlayer.status == Player.STATUS_NEUTRAL) this.swapPrompt.gotoAndStop("screens/swapNeutral");
        else if (humanPlayer.status == Player.STATUS_VICE_AHOLE) this.swapPrompt.gotoAndStop("screens/swapViceAhole");
        else if (humanPlayer.status == Player.STATUS_AHOLE) this.swapPrompt.gotoAndStop("screens/swapAhole");
        this.stage.addChildAt(this.swapScreen, 1);
    }

    public showGameOver(winner:Player):void {
        this.state = ScreenManager.STATE_GAME_OVER;
        this.hideAll();
        this.winnerPrompt.gotoAndStop("screens/gameOver" + winner.name);
        this.txtRounds.text = "123";
        this.stage.addChildAt(this.gameOverScreen, 1);
    }

    // --------------------------------------------------- public methods
    public update():void {
        this.cursor.x = this.stage.mouseX;
        this.cursor.y = this.stage.mouseY;
        if (this.state == ScreenManager.STATE_SWAP) {
            if (this.humanPlayer.selectedCards.length != this.selectionCount) this.cursor.gotoAndStop("cursors/xmark");
            else this.cursor.gotoAndStop("cursors/checkmark");
        }
    }     

    // -------------------------------------------------- event handlers
    private onSwapSelection(e:createjs.Event):void {
        if (this.humanPlayer.selectedCards.length != this.selectionCount) {

            // ????????????
            console.log("DENIED!");

        } else {
            this.closeScreen(this.eventStartAnotherRound);
        }
    }

    private onOver(e:createjs.Event):void {
        // hide real cursor
        this.introScreen.cursor = "none";
        this.summaryScreen.cursor = "none";
        this.swapScreen.cursor = "none";
        this.gameOverScreen.cursor = "none";
        this.cursor.x = this.stage.mouseX;
        this.cursor.y = this.stage.mouseY;
        this.stage.addChild(this.cursor);
    }

    private onOut(e:createjs.Event):void {
        // reset cursor back to real cursor
        this.introScreen.cursor = "default";
        this.summaryScreen.cursor = "default";
        this.swapScreen.cursor = "default";
        this.gameOverScreen.cursor = "default";
        this.stage.removeChild(this.cursor);
    }

    // -------------------------------------------------- private methods
    private closeScreen(event:createjs.Event):void {
        this.introScreen.cursor = "default";
        this.summaryScreen.cursor = "default";
        this.swapScreen.cursor = "default";        
        this.stage.removeChild(this.cursor);
        this.hideAll();
        this.cursor.gotoAndStop("cursors/checkmark");
        this.selectionCount = 0;
        this.stage.dispatchEvent(event);        
    }

    private hideAll():void {
        // before every screen change remove all screens from stage
        this.stage.removeChild(this.introScreen);
        this.stage.removeChild(this.summaryScreen);
        this.stage.removeChild(this.swapScreen);
        this.stage.removeChild(this.gameScreen);
        this.stage.removeChild(this.gameOverScreen);
    }
}