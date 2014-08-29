function InitSPHParticle(i, x, y, z, vx, vy, vz) {
    var pos = userData.position;
    var vel = userData.velocity;
    var ii = 4*i;
    
    pos[ii + 0] = x;
    pos[ii + 1] = y;
    pos[ii + 2] = z;
    pos[ii + 3] = 0;
    
    vel[ii + 0] = vx;
    vel[ii + 1] = vy;
    vel[ii + 2] = vz;
}

function InitBreakDamParticlesRand() {
    
    for (var i=kParticleCount; i > 0; i--)  {
        
        var x =  .5 * RAND0TO1() * kViewWidth;
        var y = -.5 * RAND0TO1() * kViewHeight;
        var z =  .5 * RANDM1TO1() * kViewDepth;
        
        var vx = 0.0;
        var vy = 0.0;
        var vz = 0.0;
        
        InitSPHParticle(i, x, y, z, vx, vy, vz);
    }
}

function InitBreakDam() {

    var count = 0;

    for (var i = -kViewWidth/2; i < kViewWidth/2; i+=kCellSize/2)
    {
        for (var j = -kViewHeight/2; j < kViewHeight/2; j+=kCellSize/2)
        {
            for (var k = -kViewDepth/2; k < kViewDepth/2; k+=kCellSize/2)
            {
                if (count < kParticleCount)
                {
                    var x = i;
                    var y = j;
                    var z = k;
                    
                    var vx = 0;
                    var vy = 0;
                    var vz = 0;

                    InitSPHParticle(count, x, y, z, vx, vy, vz);
                    // console.log("particle " + count + " - position (" + x + ", " + y + ", " + z + ")");
                    count++;
                }
            }
        }
    }
}

function InitMidAirDrop() {

    var count = 0;

    for (var j = -kViewHeight/2; j < kViewHeight/2; j+=kCellSize/2)
    {
        for (var i = -kViewWidth/4; i < 0; i+=kCellSize/2)
        {
            for (var k = -kViewDepth/4; k < kViewDepth/4; k+=kCellSize/2)
            {
                if (count < kParticleCount/2)
                {
                    var x = i;
                    var y = j;
                    var z = k;
                    
                    var vx = 0;
                    var vy = 0;
                    var vz = 0;

                    InitSPHParticle(count, x, y, z, vx, vy, vz);
                    // console.log("particle " + count + " - position (" + x + ", " + y + ", " + z + ")");
                    count++;
                }
            }
        }
    }

    for (var j = -kViewHeight/2; j < kViewHeight/2; j+=kCellSize/2)
    {
        for (var i = 0; i < kViewWidth/4; i+=kCellSize/2)    
        {
            for (var k = -kViewDepth/4; k < kViewDepth/4; k+=kCellSize/2)
            {
                if (count < kParticleCount)
                {
                    var x = i;
                    var y = j;
                    var z = k;
                    
                    var vx = 0;
                    var vy = 0;
                    var vz = 0;

                    InitSPHParticle(count, x, y, z, vx, vy, vz);
                    // console.log("particle " + count + " - position (" + x + ", " + y + ", " + z + ")");
                    count++;
                }
            }
        }
    }

}

function InitTwoCubes() {
    var count = 0;

    for (var j = -kViewHeight/2; j < kViewHeight/2; j+=kCellSize/2)
    {
        for (var i = -kViewWidth/2; i < 0; i+=kCellSize/2)
        {
            for (var k = 0; k < kViewDepth/2; k+=kCellSize/2)
            {
                if (count < kParticleCount/3)
                {
                    var x = i;
                    var y = j;
                    var z = k;
                    
                    var vx = 0;
                    var vy = 0;
                    var vz = 0;

                    InitSPHParticle(count, x, y, z, vx, vy, vz);
                    // console.log("particle " + count + " - position (" + x + ", " + y + ", " + z + ")");
                    count++;
                }
            }
        }
    }

    for (var j = -kViewHeight/2; j < kViewHeight/2; j+=kCellSize/2)
    {
        for (var i = 0; i < kViewWidth/2; i+=kCellSize/2)    
        {
            for (var k = -kViewDepth/2; k < 0; k+=kCellSize/2)
            {
                if (count < kParticleCount)
                {
                    var x = i;
                    var y = j;
                    var z = k;
                    
                    var vx = 0;
                    var vy = 0;
                    var vz = 0;

                    InitSPHParticle(count, x, y, z, vx, vy, vz);
                    // console.log("particle " + count + " - position (" + x + ", " + y + ", " + z + ")");
                    count++;
                }
            }
        }
    }

}

function InitBallDrop() {
    var count = 0;

    var count = 0;

    for (var k = -kViewDepth/4; k < kViewDepth/4; k+=kCellSize/2)
    {
        for (var i = -kViewWidth/4; i < kViewWidth/4; i+=kCellSize/2)
        {
            for (var j = kViewHeight/4; j < kViewHeight/2; j+=kCellSize/2)    
            {
                if (count < kParticleCount/3)
                {
                    var x = i;
                    var y = j;
                    var z = k;
                    
                    var vx = 0;
                    var vy = 0;
                    var vz = 0;

                    InitSPHParticle(count, x, y, z, vx, vy, vz);
                    // console.log("particle " + count + " - position (" + x + ", " + y + ", " + z + ")");
                    count++;
                }
            }
        }
    }

    for (var j = -kViewHeight/2; j < 0; j+=kCellSize/2)
    {
        for (var k = -kViewDepth/2; k < kViewDepth/2; k+=kCellSize/2)    
        {
            for (var i = -kViewWidth/2; i < kViewWidth/2; i+=kCellSize/2)                
            {
                if (count < kParticleCount)
                {
                    var x = i;
                    var y = j;
                    var z = k;
                    
                    var vx = 0;
                    var vy = 0;
                    var vz = 0;

                    InitSPHParticle(count, x, y, z, vx, vy, vz);
                    // console.log("particle " + count + " - position (" + x + ", " + y + ", " + z + ")");
                    count++;
                }
            }
        }
    }

}

function InitPoints() {

    var count = 0;

    for (var i = -kViewWidth/2; i <= kViewWidth/2; i+=kCellSize)
    {
        for (var j = -kViewHeight/2; j <= kViewHeight/2; j+=kCellSize)
        {
            for (var k = -kViewDepth/2; k <= kViewDepth/2; k+=kCellSize)
            {
                if (count < kParticleCount)
                {
                    var x = i;
                    var y = j;
                    var z = k;
                    
                    var vx = 0;
                    var vy = 0;
                    var vz = 0;

                    InitSPHParticle(count, x, y, z, vx, vy, vz);
                    console.error("particle " + count + " position (" + x + ", " + y + ", " + z + ")" + " velocity (" + vx + ", " + vy + ", " + vz + ")");
                    count++;
                }
                else
                    break;
            }
        }
    }
}

function InitBreakDamParticles() {
    
    var i, j, k;
    var vx = 0.0;
    var vy = 0.0;
    var vz = 0.0;
    var centerer = 0.5;
    var counter = 0;

    for (k = 1; k < gridVolumeSize - 1; k++) {
        for (j = 1; j < gridVolumeSize - 1; j++) {
            for (i = 1; i < gridVolumeSize / 4; i++) {
                if (counter < kParticleCount)
                {
                    InitSPHParticle(counter, (i + centerer) / gridVolumeSize, (j + centerer) / gridVolumeSize, (k + centerer) / gridVolumeSize, vx, vy, vz);
                    counter++;
                }
                else
                    break;
            }
        }
    }
}

function InitBreakDamParticlesUniform() {

    var dim = Math.ceil(Math.pow(kParticleCount, 1/3));

    var i, j, k;
    var totalParticle = 0;

    for (i = -1.0; i < 1.0; i += 2.0/dim)
    {
        for (j = -1.0; j < 1.0; j += 2.0/dim)
        {
            for (k = -1.0; k < -.25; k += 2.0/dim)
            {
                var vx = 0.0;
                var vy = 0.0;
                var vz = 0.0;

                if (totalParticle < kParticleCount)
                {
                    InitSPHParticle(totalParticle, i, j, k, vx, vy, vz);
                    totalParticle++;
                }
            }
        }
    }
}

// particles are in the cube: x:[-1,1], y:[-1,1], z:[-1,1]
// 
function InitRandomParticles() { 
    for (var i=0; i < kParticleCount; i++)  {
        var x = RANDM1TO1();
        var y = RANDM1TO1();
        var z = RANDM1TO1();
        var vx = 0;
        var vy = 0;
        var vz = 0;
        InitParticle(i, x, y, z, vx, vy, vz);
    }
}

// particles are on the surface on the sphere C=(0,0,0), r=0.5
//
function InitParticlesOnSphere() {
    for (var i=0; i < kParticleCount; i++)  {
        var r = 0.5;
        var theta = Math.PI * RAND0TO1();
        var phi = 2 * Math.PI * RAND0TO1();
        
        var x = r * Math.sin(theta) * Math.cos(phi);
        var y = r * Math.sin(theta) * Math.sin(phi);
        var z = r * Math.cos(theta);
        var vx = 0;
        var vy = 0;
        var vz = 0;
        InitParticle(i, x, y, z, vx, vy, vz);
    }
}

// particles are on disc in z=0 plane,  C=(0,0,0), r=0.5
//
function InitParticlesOnDisc() {
    for (var i=0; i < kParticleCount; i++)  {
        var r = 0.5 * RAND0TO1();
        var theta = 2 * Math.PI * Math.random();
        
        var x = r * Math.sin(theta);
        var y = r * Math.cos(theta);
        var z = 0;
        var vx = 0;
        var vy = 0;
        var vz = 0;
        InitParticle(i, x, y, z, vx, vy, vz);        
    }
}

// particles are on disc in z=0 plane,  C=(0,0,0), r=0.5
//
function InitParticlesOnSpinningDisc() {
    for (var i=0; i < kParticleCount; i++)  {
        var r = 0.5 * RAND0TO1();
        var theta = 2 * Math.PI * Math.random();
        
        var pos = [0, 0, 0];
        pos[0] = r * Math.sin(theta);
        pos[1] = r * Math.cos(theta);
        pos[2] = 0;
        
        var vel = [0, 0, 0];
        Vector3.normalize(vel, pos);
        
        // rotate 90 ccwise
        var tmp = vel[0];
        vel[0] = - vel[1];
        vel[1] = tmp;
        
        // scale
        Vector3.scale(vel, vel, 20 * (r/0.5));

        InitParticleV(i, pos, vel);        
    }
}


// particles are on the edge of a ring in z=0 plane,  C=(0,0,0), r=0.5
//
function InitParticlesOnRing() {
    for (var i=0; i < kParticleCount; i++)  {
        var r = 0.5;
        var theta = 2 * Math.PI * Math.random();
        
        var x = r * Math.sin(theta);
        var y = r * Math.cos(theta);
        var z = 0;
        var vx = 0;
        var vy = 0;
        var vz = 0;
        InitParticle(i, x, y, z, vx, vy, vz);        
    }
}

// two particles, separated by unit distance
//
function InitTwoParticles() {
    var  x; var  y; var  z;
    var vx; var vy; var vz;
    
    if(kParticleCount != 2) {
        console.error("Error: InitTwoParticles with kParticleCount != 2");
        return;
    }
    
    vx = vy = vz = 0;
    
    x = -0.5;
    y = 0;
    z = 0;
    InitParticle(0, x, y, z, vx, vy, vz);
            
    x = 0.5;
    y = 0;
    z = 0;
    InitParticle(1, x, y, z, vx, vy, vz);       
}

// four particles, separated by unit distance
//
function InitFourParticles() {
    if(kParticleCount != 4) {
        console.error("Error: InitTwoParticles with kParticleCount != 4");
        return;
    }
    
    var vx, vy, vz;
    vx = vy = vz = 0;
    
    InitParticle(0, -0.5, 0, 0, vx, vy, vz);
    InitParticle(1,  0.5, 0, 0, vx, vy, vz);   
    InitParticle(2, 0, -0.5, 0, vx, vy, vz);
    InitParticle(3, 0,  0.5, 0, vx, vy, vz);     
}


function InitParticle(i, x, y, z, vx, vy, vz) {
    var curPos = userData.curPos;
    var curVel = userData.curVel;
    var ii = 4*i;
    
    curPos[ii + 0] = x;
    curPos[ii + 1] = y;
    curPos[ii + 2] = z;
    curPos[ii + 3] = 500;
    
    curVel[ii + 0] = vx;
    curVel[ii + 1] = vy;
    curVel[ii + 2] = vz;
}

function InitParticleV(i, pos, vel) {
    var curPos = userData.curPos;
    var curVel = userData.curVel;
    var ii = 4*i;
    
    curPos[ii + 0] = pos[0];
    curPos[ii + 1] = pos[1];
    curPos[ii + 2] = pos[2];
    curPos[ii + 3] = 500;
    
    curVel[ii + 0] = vel[0];
    curVel[ii + 1] = vel[1];
    curVel[ii + 2] = vel[2];
}

var Vector3 = {};

Vector3.dot = function(a, b) {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
};

Vector3.scale = function(out, a, s) {
    out[0] = s * a[0];
    out[1] = s * a[1];
    out[2] = s * a[2];
};

Vector3.diff = function(out, a, b) {
    out[0] = a[0] = b[0];
    out[1] = a[1] = b[1];
    out[2] = a[2] = b[2];
};

Vector3.normalize = function(out, a) {
    var r = Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
    out[0] = a[0]/r;
    out[1] = a[1]/r;
    out[2] = a[2]/r;
};

Vector3.cross = function(out, a, b) {
    out[0] = a[1]*b[2] - a[2]*b[1]; // a2b3 - a3b2
    out[1] = a[2]*b[0] - a[0]*b[2]; // a3b1 - a1b3
    out[2] = a[0]*b[1] - a[1]*b[0]; // a1b2 - a2b1
};