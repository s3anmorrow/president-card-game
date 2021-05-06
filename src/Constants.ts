// game constants
export const STAGE_WIDTH:number = 800;
export const STAGE_HEIGHT:number = 600;
export const FRAME_RATE:number = 30;
export const PLAYER_CARD_SPREAD:number = 30;
export const COMPUTER_CARD_SPREAD:number = 17;
export const TURN_DELAY_DEFAULT:number = 200;
export const WIN_SCORE:number = 10;

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
    },
    {
        type:"json",
        src:"./lib/spritesheets/glyphs.json",
        id:"glyphs",
        data:0
    },
    {
        type:"image",
        src:"./lib/spritesheets/glyphs.png",
        id:"glyphs",
        data:0
    },
    {
        type:"sound",
        src:"./lib/sounds/ui.ogg",
        id:"ui",
        data:4
    },
    {
        type:"sound",
        src:"./lib/sounds/gameOver.ogg",
        id:"gameOver",
        data:4
    },
    {
        type:"sound",
        src:"./lib/sounds/pass.ogg",
        id:"pass",
        data:4
    },
    {
        type:"sound",
        src:"./lib/sounds/playCard.ogg",
        id:"playCard",
        data:4
    },
    {
        type:"sound",
        src:"./lib/sounds/playerOut.ogg",
        id:"playerOut",
        data:4
    },
    {
        type:"sound",
        src:"./lib/sounds/roundOver.ogg",
        id:"roundOver",
        data:4
    },
    {
        type:"sound",
        src:"./lib/sounds/select.ogg",
        id:"select",
        data:4
    },
    {
        type:"sound",
        src:"./lib/sounds/deselect.ogg",
        id:"deselect",
        data:4
    },
    {
        type:"sound",
        src:"./lib/sounds/error.ogg",
        id:"error",
        data:4
    }
];