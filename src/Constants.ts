// game constants
export const STAGE_WIDTH:number = 600;
export const STAGE_HEIGHT:number = 450;
export const FRAME_RATE:number = 30;
export const MAX_COMPUTER_PLAYERS:number = 3;
export const PLAYER_CARD_SPREAD:number = 20;
export const COMPUTER_CARD_SPREAD:number = 15;
export const TURN_DELAY:number = 1000;

export const ASSET_MANIFEST:Object[] = [
    {
        type:"json",
        src:"./lib/spritesheets/sprites.json",
        id:"sprites",
        data:0
    },
    {
        type:"image",
        src:"./lib/spritesheets/sprites.png",
        id:"sprites",
        data:0
    }
    /*,
    {
        type:"sound",
        src:"./lib/sounds/beep.ogg",
        id:"beep",
        data:4
    }  
    */   
];