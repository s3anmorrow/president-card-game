// game Class
// a**hole card game
// Sean Morrow
// May 18, 2006

dynamic class Game {
	// GAME CONSTANTS
	// full deck of cards
	private var aNewDeck:Array = new Array("C:14","C:13","C:12","C:11","C:10","C:9","C:8","C:7","C:6","C:5","C:4","C:3","C:2","D:14","D:13","D:12","D:11","D:10","D:9","D:8","D:7","D:6","D:5","D:4","D:3","D:2","H:14","H:13","H:12","H:11","H:10","H:9","H:8","H:7","H:6","H:5","H:4","H:3","H:2","S:14","S:13","S:12","S:11","S:10","S:9","S:8","S:7","S:6","S:5","S:4","S:3","S:2");
	//var aNewDeck:Array = new Array("C:4","C:3","C:2","D:4","D:3","D:2","H:4","H:3","H:2","S:4","S:3","S:2");
	// 3D array of player data (position, possible status, points)
	private var aSeating:Array = new Array([[95,340],[-60,50],[560,50]],[[165,340],[-60,220],[-60,20],[560,20],[560,220]]);
	private var _aRankings:Array = new Array(["No Status","President","Neutral","A**Hole"],["No Status","President","Vice-President","Neutral","Vice-A**Hole","A**Hole"]);
	private var aPoints:Array = new Array([0,1,0,-1],[0,2,1,0,-1,-2]);
	// delay before each step in gameplay (in seconds)
	private var _playDelay:Number = 0.1;	
	// number of pixel spread of cards in hand
	private var _cardSpread:Number = 20;
	// number of pixels card pops up when selected
	private var _cardPop:Number = 10;
		
	// GAME PROPERTIES
	// current deck of cards (empty by default)
	private var _aDeck:Array = new Array();
	// array to hold cards currently in play : empty be default
	private var _aPlayed:Array = new Array();	
	// the queue of player's turns
	private var _aTurnQueue:Array = new Array();	
	// array of selected cards for play
	private var _aSelected:Array;
	// number of cards in the deck
	private var _nCardTotal:Number;
	// number of players in game
	private var _playerCount:Number;
	// reference to the current player object
	private var _oPlayer:Object;		
	// counter keeping track of how many passes have occurred
	private var _nPassCount:Number = 0;

	// GAME VARIABLES
	// array index number of set of data for aSeating and _aRankings depending on number of players
	private var nDataSet:Number = 0;
	// the next rank to be awarded as players get rid of all their cards
	private var nAwardedRank:Number;
	// pointer to the current player whose turn it is
	private var nTurnCounter:Number;
	// the current delay between steps in gameplay
	private var nCurDelay:Number = _playDelay;	
	// local shared object to store all player's points
	private var playerData:SharedObject;		
	//
	//---------------- constructor method
	//
	public function Game(){

	};
	//
	//---------------- Public Properties
	//
	public function get cardSpread():Number {
		return _cardSpread;
	};
	
	public function get cardPop():Number {
		return _cardPop;
	};

	public function get oPlayer():Object {
		return _oPlayer;
	};
	
	public function get aRankings():Array {
		return _aRankings;
	};
	
	public function get aDeck():Array {
		return _aDeck;
	};
	public function set aDeck(value:Array) {
		_aDeck = value;
	};	
	
	public function get aPlayed():Array {
		return _aPlayed;
	};
	public function set aPlayed(value:Array) {
		_aPlayed = value;
	};	
	
	public function get aTurnQueue():Array {
		return _aTurnQueue;
	};
	public function set aTurnQueue(value:Array) {
		_aTurnQueue = value;
	};	
	
	public function get nCardTotal():Number {
		return _nCardTotal;
	};
	
	public function get playerCount():Number {
		return _playerCount;
	};	
	
	public function get nPassCount():Number {
		return _nPassCount;
	};	
	public function set nPassCount(value:Number) {
		_nPassCount = value;
	};	
		
	public function get aSelected():Array {
		return _aSelected;
	};	
	public function set aSelected(value:Array) {
		_aSelected = value;
	};	
	
	public function set playDelay(value:Number) {
		_playDelay = value;
		nCurDelay = value;
	};		
	//
	//---------------- public methods
	//
	public function startMe(nCount){
		// game variable defaults
		_playerCount = nCount;
		nAwardedRank = 1;
		_aTurnQueue = new Array();
		for (z=1; z<=nCount; z++){
			_aTurnQueue.push(z);
		}
		nTurnCounter = -1;	
		// setup variable that points to correct datasets in arrays
		if (nCount == 3) {
			nDataSet = 0;
		} else if (nCount == 5) {
			nDataSet = 1;		
		}
		
		// remove any previous player objects and movieclips from any previous games
		for (z=1; z<=5; z++) {
			_root["player" + z].killMe();
		}
		
		// construct player objects
		for (z=1; z<=nCount; z++){
			if (z==1) {
				var sHumanName:String = _root.iOptionsPanel.txtName.text;				
				if (_root.iOptionsPanel.txtName.text == "Name Here") sHumanName = "Human Player";
				_root["player" + z] = new humanPlayer(z,sHumanName);
			} else {
				_root["player" + z] = new computerPlayer(z,"Opponent " + (z - 1));
			}
		}

		// restore points if appropriate
		playerData = SharedObject.getLocal(sHumanName + _playerCount);
		if (playerData.data.points[0] == undefined) {
			playerData.data.points = new Array();
		} else {
			// update points of all players
			for (z=1; z<=playerData.data.points.length; z++){
				_root["player" + z].nPoints = playerData.data.points[z-1];
			}
			playerData.flush();
		}
		
		// setup the game to build a new hand
		dealMe();
	};
	
	public function demoMe(nCount){
		startMe(nCount);
		_root.player1.disableMe();
		_root.player1.mMyPointer.gotoAndStop("off");
	};
	
	public function turnMe(){
		// turn off old player's pointer
		_oPlayer.mMyPointer.gotoAndStop("off");
		
		// check to see if this player is now out
		if ((_oPlayer.aHand.length <= 0) && (_oPlayer != undefined)) {
			_oPlayer.nStatus = nAwardedRank;
			// update points
			_oPlayer.nPoints = _oPlayer.nPoints + aPoints[nDataSet][nAwardedRank];
			playerData.data.points[_oPlayer.nID - 1] = _oPlayer.nPoints;
			// remove player from turn queue
			_aTurnQueue.splice(nTurnCounter,1);
			nTurnCounter = nTurnCounter - 1;
			// is this player the human player?
			if (_oPlayer.nID == 1) nCurDelay = nCurDelay/5;
			nAwardedRank++;	
			// player is done then decrement passcount so if all pass then the player to the left of player gets to play
			_nPassCount--;
		}
		
		if (_aPlayed[0].rankMe() == 2) {
			// player plays again
			iPlaySpot.clearMe();
			if (_oPlayer.aHand.length <= 0) {
				// onto next player's turn		
				if (nTurnCounter >= (_aTurnQueue.length - 1)){
					nTurnCounter = 0;
				} else {
					nTurnCounter++;
				}
			}
		} else if (_nPassCount >= (_aTurnQueue.length - 1)) {
			/// this player wins the hand
			iPlaySpot.clearMe();
			_nPassCount = 0;
			// onto next player's turn		
			if (nTurnCounter >= (_aTurnQueue.length - 1)){
				nTurnCounter = 0;
			} else {
				nTurnCounter++;
			}
		} else {
			// onto next player's turn		
			if (nTurnCounter >= (_aTurnQueue.length - 1)){
				nTurnCounter = 0;
			} else {
				nTurnCounter++;
			}
		}
	
		// save pointer to new current player
		_oPlayer = _root["player" + _aTurnQueue[nTurnCounter]];
		
		// check to see if round is over (only one player left)
		if (_aTurnQueue.length <= 1) {
			// ROUND OVER
			_oPlayer.nStatus = nAwardedRank;
			// update points
			_oPlayer.nPoints = _oPlayer.nPoints + aPoints[nDataSet][nAwardedRank];
			playerData.data.points[_oPlayer.nID - 1] = _oPlayer.nPoints;
			// flip over all cards left if a computer player
			if (_oPlayer.nID != 1) _oPlayer.revealMe();
			pauseMe("game.dealMe",3);
		} else {
			// NEXT PLAYER'S TURN
			// turn on new player's turn pointer
			_oPlayer.mMyPointer.gotoAndStop("on");
			// enable the new player
			_oPlayer.enableMe();
		}
		// save to local shared object
		playerData.flush();		
	};
	
	public function ruleMe():Boolean {
		// rule set : one 2 to clear any number of cards
		// number of cards selected and in play must be the same number
		if (_aPlayed.length == 0) {
			return true;
		} else {
			if ((_oPlayer.aSelected.length == _aPlayed.length) || (_oPlayer.aSelected[0].rankMe() == 2)) {
				// rank must be higher
				if ((_oPlayer.aSelected[0].rankMe() > _aPlayed[0].rankMe()) || (_oPlayer.aSelected[0].rankMe() == 2)) {
					return true;
				}
			}
		}
		return false;
	};
	
	public function dealMe(){
		// global variable resets/prepping
		nAwardedRank = 1;
		// pointer to the current player whose turn it is
		nTurnCounter = -1;
		_nPassCount = 0;
		nCurDelay = _playDelay;
		
		// clear play spot
		iPlaySpot.clearMe();
				
		// reset the deck prior to dealing
		_aDeck = new Array();
		_aDeck = _aDeck.concat(aNewDeck);
		_nCardTotal = _aDeck.length;
	
		var aSeats:Array = aSeating[nDataSet];
		if (_root.player1.nStatus != 0) {
			// RE-DEALING FOR ANOTHER ROUND
			// seat players according to social status : construct new turn queue
			_aTurnQueue = new Array(_playerCount);
			var nHumanIndex:Number;
			for (w=1; w<=_playerCount; w++){
				_aTurnQueue[(_root["player" + w].nStatus - 1)] = w;
				if (w == 1) nHumanIndex = (_root["player" + w].nStatus - 1);
			}
			
			// deal cards to players according to social status
			for (w=1; w<=_playerCount; w++){
				_root["player" + _aTurnQueue[w-1]].dealMe();
			}		
			
			// change seats of computer players according to social status
			var aSeatQueue:Array = _aTurnQueue.slice(nHumanIndex + 1,_aTurnQueue.length).concat(_aTurnQueue.slice(0,nHumanIndex))
			for (w=0; w<aSeatQueue.length; w++){
				_root["player" + aSeatQueue[w]].seatMe(aSeats[w+1][0],aSeats[w+1][1]);
			}
			// swapout cards between social status players - this will start game with turnMe
			swapMe();
		} else {
			// BRAND NEW GAME		
			// deal cards to players in order of IDs
			for (w=1; w<=_playerCount; w++){
				_root["player" + w].dealMe();
			}		
			// no social status : seat players normally clockwise
			for (w=0; w<_playerCount; w++){
				_root["player" + (w+1)].seatMe(aSeats[w][0],aSeats[w][1]);
			}
			// start the game with human player
			turnMe();
		}
	};
	
	public function pauseMe(sTargetFunction,nTargetDelay){
		var nDelay:Number;
		if (nTargetDelay != undefined){
			nDelay = nTargetDelay * 1000;
		} else {
			nDelay = nCurDelay * 1000;			
		}
		// pauses for predetermined amount of time before continuing on to targetFunction
		if (nPauseInterval != undefined){
			_root.onMouseUp();			
		} else {
			_root.onMouseUp = function(){
				delete _root.onMouseUp;
				clearInterval(nPauseInterval);
				nPauseInterval = undefined;
				// break apart and reassemble target path
				var sPath:String = "";
				var aPath:Array = sTargetFunction.split(".");
				for (w=0; w<aPath.length-1; w++){
					sPath += aPath[w];
					if (w < (aPath.length-2)) sPath += ".";
				}
				// go to target function
				eval(sPath)[aPath[aPath.length-1]]();	
			};
			nPauseInterval = setInterval(this, "pauseMe", nDelay, sTargetFunction);
		}
	};
	//
	//---------------- private methods
	//
	private function swapMe(){
		var aLowCards:Array;
		var aHighCards:Array;
		// maximum number of cards to swap (five player = 2; three player = 1)
		var nSwapCount:Number;
		
		// determine number of cards to swap
		if (_playerCount == 5){
			// five player game
			nSwapCount = 2;
		} else {
			// three player game
			nSwapCount = 1;	
		}
		
		for (v=1; v<=nSwapCount; v++) {
			// find president/vice and asshole/vice
			var nPresIndex:Number = _aTurnQueue[nSwapCount-v];
			var nAssIndex:Number = _aTurnQueue[_playerCount-(nSwapCount-v+1)];
	
			trace("asshole: " + _root["player" + nAssIndex].aHand);
			trace("president: " + _root["player" + nPresIndex].aHand);
			
			// remove best and worst cards	
			aLowCards = _root["player" + nPresIndex].worstMe(v);
			aHighCards = _root["player" + nAssIndex].bestMe(v);
			// splicing arrays messes up data types : go through each array and force datatypes are string still
			for (q=0; q<aLowCards.length; q++){
				aLowCards[q] = String(aLowCards[q]);
			}
			for (q=0; q<aHighCards.length; q++){
				aHighCards[q] = String(aHighCards[q]);
			}
		
			// add to each player's hand & refresh hand
			_root["player" + nPresIndex].aHand = aHighCards.concat(_root["player" + nPresIndex].aHand);
			_root["player" + nAssIndex].aHand = aLowCards.concat(_root["player" + nAssIndex].aHand);
			_root["player" + nPresIndex].refreshMe();
			_root["player" + nAssIndex].refreshMe();
			
			trace("asshole: " + _root["player" + nAssIndex].aHand  + ": aHighCards: " + aHighCards);
			trace("president: " + _root["player" + nPresIndex].aHand + ": aLowCards: " + aLowCards);	
			
			// notify human player of newly added cards (low or high)
			for (q=0; q<_root.player1.aHand.length; q++){
				for (t=0; t<nSwapCount; t++){
					if ((_root.player1.aHand[q] == aHighCards[t]) || (_root.player1.aHand[q] == aLowCards[t])) {
						_root.player1.mMyHand.attachMovie("iconAdd","iIconAdd" + t,300 + t);
						_root.player1.mMyHand["iIconAdd" + t]._x = _root.player1.mMyHand["i" + _root.player1.aHand[q]]._x;
						_root.player1.mMyHand["iIconAdd" + t]._y = _root.player1.mMyHand["i" + _root.player1.aHand[q]]._y - 20;
					}
				}
			}
	
		}
		// fire score spot
		_root.iScoreSpot.updateMe();
	};	
}