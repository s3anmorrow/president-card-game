// humanPlayer Class
// a**hole card game
// Sean Morrow
// May 18, 2006

dynamic class humanPlayer extends player {
	//
	//---------------- constructor method
	//
	public function humanPlayer(nID,sName) {
		super(nID,sName);
	};
	//
	//---------------- public methods
	//
	public function refreshMe(){
		this.clearMe();
		// dropspot for cards
		var nDropSpot:Number = 0;
		
		// sort my hand
		_aHand.sort(this.sortMe);
			
		// placing into playspace
		for (n=0; n<_aHand.length; n++){
			var sCardInst:String = "i" + _aHand[n];
			mMyHand.attachMovie(_aHand[n],sCardInst,n);
			// update card's properties
			mMyHand[sCardInst].sID = _aHand[n];
			mMyHand[sCardInst].nPlayer = _nID;
			mMyHand[sCardInst].sSuit = _aHand[n].suitMe();
			mMyHand[sCardInst].nRank = _aHand[n].rankMe();
			mMyHand[sCardInst]._x = nDropSpot;
			// increment dropspot
			nDropSpot = nDropSpot + game.cardSpread;
		}
	};
		
	public function selectMe(sCardID){
		// add selected card to list
		_aSelected.push(sCardID);
		// disable all cards except those of the same rank
		for (n=0; n<_aHand.length; n++) {
			if (_aHand[n].rankMe() != mMyHand["i" + sCardID].nRank) {
				mMyHand["i" + _aHand[n]].disableMe();
			}
		}
		// positioning card 
		mMyHand["i" + sCardID]._y = 0 - game.cardPop;
	};
		
	public function deSelectMe(sCardID){
		// remove selected card from list
		_aSelected.removeMe(sCardID);
		if (_aSelected.length == 0){
			// no cards currently selected now - enable all cards again
			enableMe();
		}
		// positioning card 
		mMyHand["i" + sCardID]._y = 0;
	};
	
	public function enableMe(){
		// enables player		
		_nState = 1;
		for (n=0; n<_aHand.length; n++) {
			mMyHand["i" + _aHand[n]].enableMe();
		}
		// enable cursor
		_root.iCursor.enableMe();
	};
	
	public function disableMe(){
		// disables player
		_nState = 0;		
		for (n=0; n<_aHand.length; n++) {
			mMyHand["i" + _aHand[n]].disableMe();
		}
		// disable cursor
		_root.iCursor.disableMe();
	};
}