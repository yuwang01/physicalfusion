/*
 *  Copyright 2011 Samsung Electronics, Incorporated.
 *  Advanced Browser Technology Project
 */
 
function FpsSampler(aSamplePeriod, aDivId, setconsole) {

    this.samplePeriod = aSamplePeriod;
    this.fpsDivId = aDivId;
    this.fpsDiv = null;
    this.fps = 0;
    this.frameCount = 0;
    this.tStart = null;
    
    this.markFrame = function() {
    	if(this.frameCount == 0) {
			this.tStart = new Date().valueOf();
        }

        if(this.frameCount === this.samplePeriod) {
            var tNow = new Date().valueOf();    
            var delta = Math.max(1, tNow - this.tStart);
            this.fps = Math.round((this.samplePeriod * 1000) / delta);
            this.frameCount = 0;
        }
        else {
            this.frameCount++;
        }
    };
       
    this.display = function() {
    	// if(this.fpsDiv === null) this.fpsDiv = document.getElementById(this.fpsDivId);
    	// this.fpsDiv.firstChild.nodeValue = this.fps;
        setconsole.FrameRate = this.fps;
    };
}

function MSecSampler(aSamplePeriod, aDivId, setconsole) {

    this.samplePeriod = aSamplePeriod;
    this.msDivId = aDivId;
    this.msDiv = null;
    this.ms = 0;
    this.msAccumulator = 0;
    this.frameCount = 0;
    this.tStart = null;
    this.isAccumulating = false;    // allow calling endFrame before startFrame
    
    this.startFrame = function() {
        if(this.isAccumulating) return;
        this.isAccumulating = true;
        
    	if(this.frameCount % this.samplePeriod == 0) {
            this.msAccumulator = 0;
    		this.frameCount = 0;
    	}
		this.tStart = new Date().valueOf();
    };
    
    this.endFrame = function() {
        if(!this.isAccumulating) return;
        this.isAccumulating = false;
        
    	var tNow = new Date().valueOf();	
        this.msAccumulator += (tNow - this.tStart);
		this.frameCount++;
        if(this.frameCount % this.samplePeriod == 0) {
            this.ms = Math.round(this.msAccumulator / this.frameCount);
            this.frameCount = 0;
        }
    };
    
    this.display = function() {
    	if(this.msDiv === null) this.msDiv = document.getElementById(this.msDivId);
    	// this.msDiv.firstChild.nodeValue = this.ms + " ms";
        if (aDivId == "sms")
            setconsole.SimFPS = this.ms;
        else if (aDivId == "dms") 
            setconsole.DrawFPS = this.ms;
    };
}
