// Radio Button Behaviour Class
// Learning Object Shell Development
// Jigsaw Interactive Inc.
// Version 1.0
// Date : Aug 16/05
// Author : Sean Morrow

// DESCRIPTION :
// Extends the movieclip class to cause a movieclip instance to behave like a ????

// USAGE :
// > enter class name into the "AS2.0 Class" property of the target movieclip which will become the radio button
// > in order to work, one of the radio buttons of each group needs to be initialized to receive required data
// > target movieclip must include labelled frames : up, over, down (selected), greyed (optional)
// > contains tooltip support

// movieclipname.initializeMe([radioGroupMembers],[whichRadioSelected]);
// [radioGroupMembers] : an array of strings containing the instance names of all radio buttons that belong to the group
// [whichRadioSelected] : the index of the radio button in the radioGroupMembers array which is to be selected by default
// if whichRadioSelected is omitted no radio buttons are selected by default
// initializeMe needs only be fired by one radio button per group to initialize them all

// PUBLIC PROPERTIES
// bSelected : [boolean | get] returns if current radio button is selected or not
// bEnabled : [boolean | get] radio button enabled or not
// bTips : [boolean | get / set] whether tooltips are used or not - with radios it isn't always efficient
// aGroup : [array of strings | get] array holding the instance names of all group members

// PUBLIC METHODS : 
// initializeMe(aryRadioGroup,numWhich) : initializes radio button group - must be fired before using
// getSelectedMe() : returns instance name of radio button in radio button group that is currently selected
// selectMe() : will select this radio button
// enableMe : enables the individual radio button (not group) so rollover behaviour occurs when mousing over; default setting
// disableMe : disables the individual radio button (not group) so no rollover behaviour occurs when mousing over
// resetMe : resets the individual radio button back to its default of not selected
// selectMe : selects the current radio button and resets all others in group back to off state - selecting via actionscript
// onChangeMe : empty method that fires when user changes the radio button selected in a group
// onPressMe : empty method that fires when user presses radio button
// onRollOverMe : empty method that fires when user rolls over the radio button
// onRollOutMe : empty method that fires when user rolls off the radio button

dynamic class radio extends MovieClip {
    // radio button group (array of strings of instance names)
    private var _aGroup:Array = new Array();
    // current state of radio button (on/off) for use with internal mc navigation
    private var sState:String;
	// button enabled or not
	private var _bEnabled:Boolean;
	// this radio button selected or not
	private var _bSelected:Boolean;
	// tooltips activated
	private var _bTips:Boolean;
	//
	//---------------- constructor method
	//
	public function radio() {
        resetMe();
        // radio buttons disabled by default
        disableMe();
		_bSelected = false;
		_bTips = true;
		_bEnabled = false;
		this._focusrect = false;
	}
	//
	//---------------- Public Properties
	//
	public function get bEnabled():Boolean {
		return _bEnabled;
	};	
	public function get bSelected():Boolean {
		return _bSelected;
	};		
	public function get aGroup():Array {
		return _aGroup;
	};
	public function get bTips():Boolean {
		return _bTips;
	};
	public function set bTips(value:Boolean) {
		_bTips = value;
	};
	//
	//---------------- event handler declaration
	//
    private function onRollOver(){
	    if (_bTips) tip.activate(this._name);
	    gotoAndStop("over");
		onRollOverMe();
    };
    private function onRollOut(){
        if (_bTips) tip.kill();
        gotoAndStop(sState);
		onRollOutMe();
    };
    
    private function onPress(){
        if (_bTips) tip.kill();
        selectMe();
		onPressMe();
    };
	
	private function releaseOutside(){
		if (_bTips) tip.kill();
	};
    //
	//---------------- public method declaration
	//
	public function enableMe(){
        gotoAndStop(sState);
		this.useHandCursor = true;
        this.enabled = true;
        _bEnabled = true;
	};
	
	public function disableMe(){
        // goes to norm first by default
        gotoAndStop("up");
        // if there is a greyed frame (dead state of button) then goes here - otherwise this is ignored
        gotoAndStop("greyed");
        this.useHandCursor = false;
        this.enabled = false;
        _bEnabled = false;
	};
    
    public function resetMe(){
		_bSelected = false;
        sState = "up";
        gotoAndStop(sState);
        this.enabled = true;
    };
	
	public function selectMe(){
        // resetting all radio buttons in group
        for (n=0; n<_aGroup.length; n++){
			_parent[_aGroup[n]].resetMe();
			if (!_parent[_aGroup[n]]._bEnabled){
				_parent[_aGroup[n]].disableMe();
			}
        }
		// turning on selected radio button
		_bSelected = true;
        sState = "down";
		this.enabled = false;
		gotoAndStop(sState);
		onChangeMe();
	};	
	
	public function getSelectedMe():String {
		// search through all radio buttons to see which one is selected
		for (n=0; n<_aGroup.length; n++){
			if (_parent[_aGroup[n]]._bSelected){
				return _aGroup[n];
			}
		}
	};		
	
    public function initializeMe(aryRadioGroup,numWhich){
        // initializing all radio buttons in the group
        for (n=0; n<aryRadioGroup.length; n++){
            _parent[aryRadioGroup[n]]._aGroup = aryRadioGroup; 
			// enable radio button
			_parent[aryRadioGroup[n]].enableMe();
			_parent[aryRadioGroup[n]]._bSelected = false;
            // setting default radio button as selected if provided
            if ((numWhich != undefined) && (n == numWhich)) {
				_parent[aryRadioGroup[n]]._bSelected = true;
                _parent[aryRadioGroup[n]].sState = "down";
				_parent[aryRadioGroup[n]].enabled = false;
				_parent[aryRadioGroup[n]].gotoAndStop(_parent[aryRadioGroup[n]].sState);				
            }
        }
    };
	//
	//---------------- custom event handler declarations
	//
    public function onChangeMe(){}
	public function onPressMe(){}
	public function onRollOverMe(){}
	public function onRollOutMe(){}
}   