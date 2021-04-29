// card Class
// a**hole card game
// Sean Morrow
// May 18, 2006

// required classes
import flash.geom.ColorTransform;
import flash.geom.Transform;

dynamic class card extends MovieClip {
	//
	//---------------- class properties
	//
	// card's suit and rank
	private var _sID:String;
	private var _sSuit:String;
	private var _nRank:Number;
	// player ID of owner of this card
	private var _nPlayer:Number;
	// card currently selected or not
	private var _bSelected:Boolean;
	// is card enabled at the moment?
	private var _bEnabled:Boolean;
	
	//
	//---------------- constructor method
	//
	public function card() {
		// property defaults
		_bEnabled = false;
		_bSelected = false;
		gotoAndStop(1);	
		// no hand cursor
		this.useHandCursor = false;
	};
	//
	//---------------- Public Properties
	//
	public function get sID():String {
		return _sID;
	};
	public function set sID(value:String) {
		_sID = value;
	};
	public function get sSuit():String {
		return _sSuit;
	};
	public function set sSuit(value:String) {
		_sSuit = value;
	};
	public function get nRank():Number {
		return _nRank;
	};
	public function set nRank(value:Number) {
		_nRank = value;
	};	
	public function get nPlayer():Number {
		return _nPlayer;
	};
	public function set nPlayer(value:Number) {
		_nPlayer = value;
	};		
	public function get bSelected():Boolean {
		return _bSelected;
	};
	//
	//---------------- event handler declaration
	//
    private function onRollOver(){
		if (_bEnabled){
			gotoAndStop(2);
		}
    };
	
    private function onRollOut(){
		if (_bEnabled){		
			gotoAndStop(1);		
		}
    };

    private function onRelease(){
		if (_bEnabled){
			// toggle selection property of card
			_bSelected = !_bSelected;
			// selecting card
			if (_bSelected) {
				_root["player" + _nPlayer].selectMe(_sID);
			} else {
				_root["player" + _nPlayer].deSelectMe(_sID);
			}
		}
    };
	
    private function onReleaseOutside(){
		gotoAndStop(1);
    };	
	
	//
	//---------------- public methods
	//
	public function disableMe(){
		_bEnabled = false;
		gotoAndStop(1);		
	};
	
	public function enableMe(){
		_bEnabled = true;
		// hacking collision detection to setup rollover on enabling - problems with hittest		
		if (this._parent.hitTest(_root._xmouse, _root._ymouse, true)){
			var nX:Number = _root["iPlayer" + _nPlayer]._xmouse;
			if ((nX >= this._x) && (nX <= this._x + game.cardSpread)) {
				gotoAndStop(2);				
			} else if (_sID == _root["player" + _nPlayer].aHand[_root["player" + _nPlayer].aHand.length - 1]) {
				if ((nX >= this._x) && (nX <= this._x + 71)) {
					gotoAndStop(2);								
				}
			}
		}
	};

	public function killMe(){
		this.removeMovieClip();
	};
	//
	//---------------- private methods
	//

}