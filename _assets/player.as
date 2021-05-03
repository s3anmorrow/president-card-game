// player Class
// a**hole card game
// Sean Morrow
// May 18, 2006

dynamic class player {
	//
	//---------------- class properties
	//
	// the movieclip where the player's cards/scoreboard are stored
	private var mMyHand:MovieClip;
	private var mMyPointer:MovieClip;
	
	// whether player is enabled or not
	private var _nState:Number;
	// ID of player
	private var _nID:Number;
	// array to hold cards
	private var _aHand:Array;
	// list of cards currently selected
	private var _aSelected:Array;
	// player's social status (1-president, 2-vice, etc)
	private var _nStatus:Number;
	// represents which seat around the game board player is in
	private var _nSeat:Number;
	// player's name
	private var _sName:String;
	// player's points
	private var _nPoints:Number;	
	//
	//---------------- constructor method
	//
	public function player(nID,sName){
		// property defaults
		_nID = nID;
		_aSelected = new Array();
		_aHand = new Array();
		_nSeat = _nID;
		_nStatus = 0;
		_nState = 0;
		_sName = sName;
		_nPoints = 0;
		
		// creating empty movieclip to hold cards
		_root.createEmptyMovieClip("iPlayer" + _nID,_nID);
		mMyHand = _root["iPlayer" + _nID];
		// attach turn pointer movieclip inside hand movieclip
		mMyHand.attachMovie("turnPointer","iTurnPointer",100);
		mMyPointer = mMyHand["iTurnPointer"];
	};
	//
	//---------------- Public Properties
	//
	public function get nID():Number {
		return _nID;
	};
	
	public function get aSelected():Array {
		return _aSelected;
	};
	public function set aSelected(value:Array) {
		_aSelected = value;
	};
	
	public function get aHand():Array {
		return _aHand;
	};
	public function set aHand(value:Array) {
		_aHand = value;
	};
	
	public function get nStatus():Number {
		return _nStatus;
	};
	public function set nStatus(value:Number) {
		_nStatus = value;
	};
	
	public function get nSeat():Number {
		return _nSeat;
	};
	public function set nSeat(value:Number) {
		_nSeat = value;
	};	
	
	public function get nState():Number {
		return _nState;
	};	
	
	public function get sName():String {
		return _sName;
	};
	
	public function get nPoints():Number {
		return _nPoints;
	};
	public function set nPoints(value:Number) {
		_nPoints = value;
	};		
	//
	//---------------- public methods
	//
	public function dealMe(){
		// empty my hand
		_aHand = new Array();
		// new card added to player hand
		var sNewCard:String;
		var nRandom:Number;
		
		// calculate number of cards each player should get to empty the deck
		var nCardCount:Number;
		var nBaseCardCount:Number = Math.floor(game.nCardTotal/game.playerCount);
		if ((game.aDeck.length % nBaseCardCount) == 0) {
			nCardCount = nBaseCardCount;
		} else {
			nCardCount = nBaseCardCount + 1;
		}
					
		for (n=0; n<nCardCount; n++){
			nRandom = random(game.aDeck.length);
			// add card to hand
			sNewCard = String(game.aDeck[nRandom]);
			_aHand.push(sNewCard);
			// remove card from deck
			game.aDeck.splice(nRandom,1);
		}
		// refresh screen		
		this.refreshMe();
	
		//trace("Player's hand: " + _aHand);
		//trace("Player's hand count: " + _aHand.length);
		//trace("Left in deck: " + game.aDeck);
	};	
	
	public function seatMe(nX,nY){
		// position player's hand
		mMyHand._x = nX;
		mMyHand._y = nY;
				
		// positioning player's turn pointer
		if (_nID == 1) {
			// human player
			mMyPointer._y = -28;
		} else {
			// computer player
			if (mMyHand._x < 0) {
				// hand off left of screen
				mMyPointer._rotation = 90;
				//mMyPointer._x = mMyHand._width + 3;
				mMyPointer._x = 123;
				
			} else {
				// hand off right of screen
				mMyPointer._rotation = 270;
				mMyPointer._x = -mMyPointer._width - 3;
				mMyPointer._y = mMyPointer._height;
			}
		}
	};
	
	public function bestMe(nNum):Array{
		// removes nNum best cards (counting twos)
		var nTwoCount:Number = _aHand.countRankMe(2);
		if (nTwoCount >= nNum) {
			// remove twos
			return _aHand.splice(0,nNum);		
		} else if ((nTwoCount > 0) && (nTwoCount < nNum)) {
			var aHighCards:Array = _aHand.splice(0,nTwoCount);
			aHighCards.push(_aHand.splice(_aHand.length - (nNum - nTwoCount),_aHand.length - 1));
			return aHighCards;
		} else {
			return _aHand.splice(_aHand.length - nNum,_aHand.length - 1);
		}
	};
	
	public function worstMe(nNum):Array{
		// removes nNum worse cards (not counting twos)
		var nTwoCount:Number = _aHand.countRankMe(2);
		// removing cards and returning array of two worst cards
		return _aHand.splice(nTwoCount,nNum);
	};

	public function clearMe(){
		// empties hand
		for (g=0; g<_aHand.length; g++){
			mMyHand["i" + _aHand[g]].removeMovieClip();			
		}
	};
	
	public function killMe(){
		_root["iPlayer" + _nID].removeMovieClip();
		delete this;
	};
	//
	//---------------- private methods
	//
	// sorting cards
	private function sortMe(a, b){
		var rank1:Number = Number(a.split(":")[1]);
		var rank2:Number = Number(b.split(":")[1]);	
		
		//trace("sorting: " + rank1 + " vs " + rank2);
		if (rank1 < rank2) {
			return -1;
		} else if (rank1 > rank2) {
			return 1;
		} else {
			return 0;
		}
	};	
}