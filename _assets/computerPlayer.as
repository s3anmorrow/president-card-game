// computerPlayer Class
// a**hole card game
// Sean Morrow
// May 18, 2006

dynamic class computerPlayer extends player {
	//
	//---------------- constructor method
	//
	public function computerPlayer(nID,sName) {
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
			mMyHand.attachMovie("cardBlue",sCardInst,n);
			// update card's properties
			mMyHand[sCardInst].sID = _aHand[n];
			mMyHand[sCardInst].nPlayer = _nID;
			mMyHand[sCardInst].sSuit = _aHand[n].suitMe();
			mMyHand[sCardInst].nRank = _aHand[n].rankMe();
			mMyHand[sCardInst]._y = nDropSpot;
			// increment dropspot
			nDropSpot = nDropSpot + (game.cardSpread/2);
		}
	};
	
	public function selectMe(sCardID){
		// add selected card to list
		_aSelected.push(sCardID);
	};
		
	public function deSelectMe(sCardID){
		// remove selected card from list
		_aSelected.removeMe(sCardID);
	};
	
	public function enableMe(){
		// enables player		
		_nState = 1;
		game.pauseMe("_root.player" + _nID + ".playMe");
	};
	
	public function disableMe(){
		// disables player
		_nState = 0;
		clearInterval(nPauseInterval);
	};	
	//
	//---------------- private methods
	//
	public function revealMe(){
		// flips over and reveals all cards in the computer's hand
		var nDropSpot:Number = 71;	
		// remove current backs of cards and add matching faces
		for (n=0; n<_aHand.length; n++){
			var sCardInst:String = "i" + _aHand[n];
			mMyHand[sCardInst].removeMovieClip();
			if (mMyHand._x < 0) {
				mMyHand.attachMovie(_aHand[n],sCardInst,n);								
			} else {
				mMyHand.attachMovie(_aHand[n],sCardInst,_aHand.length - n);
			}
			mMyHand[sCardInst]._y = nDropSpot;
			mMyHand[sCardInst]._rotation = 270;
			// increment dropspot
			nDropSpot = nDropSpot + (game.cardSpread/2);
		}
	};

	private function probabilityMe(nPercentage):Boolean{
		// returns true based on percentage
		if (Math.floor(Math.random() * (101)) <= nPercentage) return true;
		return false;
	};		
	
	private function passMe(){
		// display pass cursor over playspot
		with (_root.iPlaySpot) {
			attachMovie("iconPass","iIconPass",500);
			iIconPass._x = (_width - iIconPass._width)/2;
			iIconPass._y = (_height - iIconPass._height)/2;
		}
		game.pauseMe("_root.iPlaySpot.passMe");
	};
	
	private function playMe(){
		trace("-------------------------------------------------------------------");
		trace("!!! Computer playing cards now... " + _nID);
		trace("hand: " + _aHand);
		
		// number of cards that signifies a low card count
		var nLowCardThres:Number = 4;
		// collect information how many cards do I need to play?
		var nPlayedCount:Number = game.aPlayed.length;
		// what is the rank of cards played?
		var nPlayedRank:Number = game.aPlayed[0].rankMe();
		if (nPlayedRank == undefined) nPlayedRank = 2;
		// number of 2s in my hand
		var nTwoCount:Number = _aHand.countRankMe(2);
		
		// is my card count low?
		var bMyLowAlert:Boolean = false;
		if (_aHand.length < nLowCardThres) bMyLowAlert = true;
		// is human player's card count low?
		var bHumanLowAlert:Boolean = false;
		if (_root.player1.aHand.length < nLowCardThres) bHumanLowAlert = true;

		// search through hand and find all playable cards save in array		
		var nTarget:Number;
		var aPlayableCards:Array = new Array();
		for (n=0; n<_aHand.length; n++){
			if ((_aHand.countRankMe(_aHand[n].rankMe()) >= nPlayedCount) && (_aHand[n].rankMe() > nPlayedRank)) {				
				aPlayableCards.push(_aHand[n]);
			}
		}
		
		if (nPlayedCount == 0) {
			// STARTING NEW ROUND
			if (aPlayableCards.length > 0){
				//if ((bOtherLowAlert) && (probabilityMe(65)) && (!bMyLowAlert)) {
				/*
				if ((bOtherLowAlert) && (probabilityMe(65)) {
					// drop highest cards to screw over other players
					for (m=aPlayableCards.length - aPlayableCards.countRankMe(aPlayableCards[aPlayableCards.length -1].rankMe()); m<aPlayableCards.length; m++){
						selectMe(aPlayableCards[m]);
					}
				} else {
					if (!bHumanLowAlert) {
						// play lowest card set
						for (m=0; m<aPlayableCards.countRankMe(aPlayableCards[0].rankMe()); m++){
							selectMe(aPlayableCards[m]);
						}
					} else {
						// drop highest cards to screw over other players
						for (m=aPlayableCards.length - aPlayableCards.countRankMe(aPlayableCards[aPlayableCards.length -1].rankMe()); m<aPlayableCards.length; m++){
							selectMe(aPlayableCards[m]);
						}
					}
				}
				*/
				if (!bHumanLowAlert) {
					// play lowest card set
					for (m=0; m<aPlayableCards.countRankMe(aPlayableCards[0].rankMe()); m++){
						selectMe(aPlayableCards[m]);
					}
				} else {
					// drop highest cards to screw over human player
					for (m=aPlayableCards.length - aPlayableCards.countRankMe(aPlayableCards[aPlayableCards.length -1].rankMe()); m<aPlayableCards.length; m++){
						selectMe(aPlayableCards[m]);
					}
				}
			} else {
				// drop the twos if nothing left!
				selectMe(_aHand[0]);
			}
		
		} else {
			// CONTINUING PREVIOUS ROUND - decision tree based on spying
			if (aPlayableCards.length == 0) {
				// aggressive play
				//if ((nTwoCount > 0) && (probabilityMe(30)) && (_aHand.length <= 6)) {
				if (nTwoCount > 0) {					
					// check if any twos you can drop				
					selectMe(_aHand[0]);
				} else {
					// passing
					passMe();
				}

			} else if (bHumanLowAlert) {
				// aggressive play
				
				// clear with 2
				if (nTwoCount > 0){
					// check if any twos you can drop				
					selectMe(_aHand[0]);
				} else {
					// play high card(s)
					for (m=0; m<nPlayedCount; m++){
						selectMe(aPlayableCards[(aPlayableCards.length - 1 - m)]);
					}
				}

			} else if (bMyLowAlert) {
				// defensive play
				
				// clear with 2
				/*
				if (nTwoCount > 0){
					// check if any twos you can drop				
					selectMe(_aHand[0]);
				} else {
					// play low card(s) to get rid of them
					for (m=0; m<nPlayedCount; m++){
						selectMe(aPlayableCards[m]);
					}
				}
				*/
				
				// play low card(s) to get rid of them
				for (m=0; m<nPlayedCount; m++){
					selectMe(aPlayableCards[m]);
				}

			} else if (probabilityMe(5)) {
				// passing
				passMe();
				
			} else {
				// normal play
				if ((probabilityMe(5)) && (nTwoCount > 0)) {
					// small probability player drops a 2 to clear away
					selectMe(_aHand[0]);
				} else {
					// ?????????? don't break low card sets
					//if (probabilityMe(85)){
					if (_aHand.length > 6){						
						// play low card(s)						
						for (m=0; m<nPlayedCount; m++){
							selectMe(aPlayableCards[m]);
						}
					} else {
						if (probabilityMe(85)){
							// play high card(s)
							for (m=0; m<nPlayedCount; m++){
								selectMe(aPlayableCards[(aPlayableCards.length - 1 - m)]);
							}
						} else {
							// play low card(s)						
							for (m=0; m<nPlayedCount; m++){
								selectMe(aPlayableCards[m]);
							}
						}
					}
				}
			}
		}
		
		trace("selected to play: " + _aSelected);
		
		// play the selected cards
		_root.iPlaySpot.playMe();
	};
}