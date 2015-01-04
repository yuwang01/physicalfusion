var WINW                = 800;          // drawing canvas width
var WINH                = 800;          // drawing canvas height

//////////////////////////////////////////////////////////////////////////////

var kScreenWidth = WINW;
var kScreenHeight = WINH;
var kViewWidth = 6.0;
var kViewHeight = kScreenHeight*kViewWidth/kScreenWidth;
var kViewDepth = 6.0;

var kPi = 3.1415926535;
var kParticleCount = 4096;

var kRestDensity = 40.0;
var kStiffness = 0.08;
var kNearStiffness = 0.1;
var kSurfaceTension = 0.0008;
var kLinearViscocity = 0.5;
var kQuadraticViscocity = 1.0;

var kParticleRadius = 0.05;
var kH = 6*kParticleRadius;
var kFrameRate = 30;
var kSubSteps = 4;

var kDt = (1.0/kFrameRate) / kSubSteps;
var kDt2 = kDt*kDt;
var kNorm = 20/(2*kPi*kH*kH);
var kNearNorm = 30/(2*kPi*kH*kH);

var kEpsilon = 0.00001;
var kEpsilon2 = kEpsilon*kEpsilon;

var kMaxNeighbourCount = 64;
var kWallCount = 4;

var kCellSize = kH;

var kGridWidth     = Math.ceil(kViewWidth  / kCellSize);
var kGridHeight    = Math.ceil(kViewHeight / kCellSize);
var kGridDepth     = Math.ceil(kViewDepth  / kCellSize);

var kGridCellCount = kGridWidth * kGridHeight * kGridDepth;

var mass = 1.0;

//////////////////////////////////////////////////////////////////////////////

var INNER_FLOPS         = 25;           // number of flops in inner loop of simulation

var SAMPLEPERIOD        = 20;           // calculate fps and sim/draw times over this many frames
var DISPLAYPERIOD       = 400;          // msecs between display updates of fps and sim/draw times

var POS_ATTRIB_SIZE     = 4;            // xyzm, xyzm, xyzm, ...
var VEL_ATTRIB_SIZE     = 4;            // vx, vy, vz, unused, vx, vy, vz, unused, ...
var CUBE_ATTRIB_SIZE    = 3;            // xyz, xyz, ...
var TRI_ATTRIB_SIZE     = 3;    
//////////////////////////////////////

// voxelization variables
var Nx = kGridWidth;
var Ny = kGridHeight;
var Nz = kGridDepth;
var voxel = Nx * Ny * Nz;

var volNx = 47;
var volNy = 47;
var volNz = 47;

var volInd = (volNx + 1) * (volNy + 1) * (volNz + 1);

var maxTri = 5 * volNx * volNy * volNz;

var Ntri;

var volEdgeX = kViewWidth / volNx;
var volEdgeY = kViewHeight / volNy;
var volEdgeZ = kViewDepth / volNz;

var isovalue = 10.5;

var frameCounter = 0;

function voxelInfo() {
    console.log("kParticleCount = " + kParticleCount);
    console.log("kParticleRadius = " + kParticleRadius);
    console.log("kCellSize = " + kCellSize);
    console.log("Nx = " + Nx);
    console.log("Ny = " + Ny);
    console.log("Nz = " + Nz);
    console.log("voxel = " + voxel);
    console.log("rest Density = " + kRestDensity + " Kg/m3");
    console.log("dt = " + kDt);
}

//////////////////////////////////////

//////////////////////////////////////
// SPH variable size

var POSITION_ATTRIB_SIZE             = 4;
var TEX_COORD_ATTRIB_SIZE            = 4;
var VELOCITY_ATTRIB_SIZE             = 4;
var ACCELERATION_ATTRIB_SIZE         = 4;
var PARTICLEIndex_ATTRIB_SIZE        = 2;
var GRIDCELLIndex_ATTRIB_SIZE        = 1;
var GRIDCELLIndexFixedUP_ATTRIB_SIZE = 1;
var NEIGHBOR_MAP_ATTRIB_SIZE         = kMaxNeighbourCount;

var TRIANGLE_ATTRIB_SIZE             = 3;

// each element is float4 (p0, p1, p2, val)
// there are 8 vertices recorded in each voxel
var GRIDCELLVERT_ATTRIB_SIZE         = 32;
var GRIDCELLCUBEINDEX_ATTRIB_SIZE    = 1;

var GRIDTRIANGLE_ATTRIB_SIZE         = 45;
var GRIDTRIANGLE_RENDER_ATTRIB_SIZE  = 45;

var GRIDTRIANGLECOUNT_ATTRIB_SIZE    = 1;

var DENSITY_ATTRIB_SIZE              = 1;
var PRESSURE_ATTRIB_SIZE             = 1;

var GRIDCELL_ATTRIB_SIZE             = 4;
var GRIDPOINT_ATTRIB_SIZE            = 8;
var GRIDCELL_GRAD_ATTRIB_SIZE        = 4;

//////////////////////////////////////

var JS_SIM_MODE         = false;         // simMode is boolean
var CL_SIM_MODE         = true;

var JS_DRAW_MODE        = false;         // drawMode is boolean
var GL_DRAW_MODE        = true;

var GLCL_SHARE_MODE     = true;         // shareMode is boolean

var FP64_ENABLED        = true;

var EPSSQR              = 50;           // softening factor
var DT                  = 0.005;        // time delta

var canvas;

function UserData() {

//////////////////////////////////////

// SPH data variables
    this.position       = null;
    this.sortedPosition = null;
    this.prevPosition = null;
    this.relaxedPos = null;
    this.sortedPrevPos = null;
    this.particleIndex  = null;
    this.velocity       = null;
    this.sortedVelocity = null;
    this.acceleration   = null;    
    this.gridCellIndex  = null;
    this.gridCellIndexFixedUp = null;
    this.neighborMap    = null;    
    this.density        = null;
    this.nearDensity    = null;    
    this.pressure       = null;
    this.nearPressure   = null;

//////////////////////////////////////

// Marching Cubes voxel information variables
    this.gridcell = null; // 4 components: (x, y, z, density)
    this.gridpoint = null; // 8 components: (the index of the 8 grid points)
    this.gridGrad = null; // 4 components: (the gradient of density at a grid cell point)
    this.cubeIndex = null; // 1 component: the cubeindex integer for each cube
    this.tri = null;
    this.norm = null;

//////////////////////////////////////

// SPH debug JS variables
    this.densityDEBUG   = null;
    this.pressureDEBUG  = null;    

//////////////////////////////////////

// SPH GL shared buffers
    this.positionVBO        = null;
    // this.sortedPositionVBO  = null;
    // this.prevPositionVBO  = null; 
    // this.relaxedPosVBO      = null;
    // this.sortedPrevPosVBO   = null;
    // this.velocityVBO        = null;
    // this.neighborMapVBO     = null;
    // this.densityVBO         = null;
    // this.neardensityVBO     = null;
    // this.pressureVBO        = null;
    // this.nearpressureVBO    = null;

// SPH shader variables
    this.particleProgram = null;
    // this.PosLoc          = null;
    // this.relaxedPosLoc   = null;
    // this.VelLoc          = null;
    // this.neighborMapLoc  = null;
    
    this.densityLoc      = null;
    this.neardensityLoc  = null;
    
    // this.pressureLoc     = null;
    // this.nearpressureLoc = null;

// SPH mvp matrix related variables
    this.mvpParticleLoc      = null; // location of mvp matrix in particle vertex shader    

// MC shader variables
    this.triangleProgram = null;

// Marching Cubes shared buffers
    this.trianglesVBO          = null;
    this.trianglesLoc          = null;
    this.triangleVertices      = null;
    this.trianglesNormVBO      = null;
    this.trianglesNormLoc      = null;

// Marching Cubes matrix related variables
    this.mvpTriangleLoc      = null;
    this.vpTriangleLoc       = null;
    this.vTriangleLoc        = null;
    this.pTriangleLoc        = null;

    this.ntri           = null;
//////////////////////////////////////
    
    this.mvpPointLoc    = null;         // location of mvp matrix in point vertex shader
    this.mvpCubeLoc     = null;         // location of mvp matrix in cube vertex shader
    this.vCubeLoc     = null;         // location of mvp matrix in cube vertex shader
    this.pCubeLoc     = null;         // location of mvp matrix in cube vertex shader
    this.npCubeLoc      = null;
    this.normalLoc       = null;

    // this.cubeVertices   = null;         // cube vertex array
    // this.cubeIndices    = null;         // cube indice array
    this.cubeLoc        = null;         // location of cube attribute in vertex shader
    this.cubeFacesVertices = null;
    this.cubeFacesIndices  = null;
    this.cubeFacesNormals = null;
    // this.pointProgram   = null;         // GL program with point shaders
    this.cubeProgram    = null;         // GL program with cube shaders
    // this.cubeVertexVBO  = null;
    // this.cubeIndiceVBO  = null;
    this.cubeFacesVertexVBO = null;
    this.cubeFacesIndexVBO = null;
    this.cubeFacesNormalVBO = null;

    this.planeProgram   = null;
    this.mvpplaneLoc    = null;
    this.npplaneLoc     = null;
    this.normalPlaneLoc = null;
    this.planeFacesVertices = null;
    this.planeFacesIndices = null;
    this.planeFacesNormals = null;

    this.planeFacesVerticesVBO = null;
    this.planeFacesIndicesVBO = null;
    this.planeFacesNormalsVBO = null;
    
    this.theta          = 0.6;                  // angle to rotate model
    this.modelMatrix    = new J3DIMatrix4();    // updated each frame
    this.vpMatrix       = new J3DIMatrix4();    // constant
    this.vMatrix       = new J3DIMatrix4();    // constant
    this.pMatrix       = new J3DIMatrix4();    // constant
    this.mvpMatrix      = new J3DIMatrix4();    // updated each frame
    this.npMatrix       = new J3DIMatrix4();

    this.simMode        = null;
    this.drawMode       = null;
    this.isSimRunning   = true;

    this.writeFrame     = false;

    this.initMode       = "Break Dam";

    this.is3D           = true;
    this.rotate         = false;
    this.isGLCLshared   = GLCL_SHARE_MODE;
    this.isFP64enabled  = FP64_ENABLED;

    this.ctx            = null;         // handle for Canvas2D context
    this.gl             = null;         // handle for GL context
    this.cl             = null;         // handle for CL context
    this.fpsSampler     = null;         // FPS sampler
    this.simSampler     = null;         // Sim time sampler
    this.drawSampler    = null;         // Draw time sampler
    this.gpu            = true;         // Use GPU as default device in CL context
}
    
function Console() {
    this.Rotate = false;
    this.CLSimMode = true;
    this.GLDrawMode = true;
    this.StartSim = true;
    this.WriteFrame = false;
    this.Start3D = true;
    this.GPU = true;
    this.FrameRate = "";
    this.GFLOPS = "";
    this.MFLOPS = "";
    this.Particles = "";
    this.SimFPS = "";
    this.DrawFPS = "";
    this.SimOption = "Break Dam";
}

var userData = null;
var setconsole = null;
var gui = null;
var container = null;

var rotate;
var framerate;
var gflops;
var mflops;
var particles;
var simfps;
var drawfps;
var gpu;
var gridsize;
var jssimmode;
var jsdrawmode;
var startsim;
var writeFrame;
var start3d;
var simOption;

function RANDM1TO1() { return Math.random() * 2 - 1; }
function RAND0TO1() { return Math.random(); }

function onLoad() {
    if(WINW !== WINH) {
        console.error("Error: drawing canvas must be square");
        return;
    }

    setconsole = new Console();
    gui = new dat.GUI({autoPlace: false});

    container = document.getElementById('my-gui-container');
    container.appendChild(gui.domElement);

    startsim = gui.add(setconsole, 'StartSim').listen();
    startsim.onChange(function(value){
        userData.isSimRunning = value;
    });

    writeFrame = gui.add(setconsole, 'WriteFrame').listen();
    writeFrame.onChange(function(value) {
        userData.writeFrame = value;
    });
    
    simOption = gui.add(setconsole, 'SimOption', [ '', 'Break Dam', 'Two Cube', 'Drop Cube', 'Drop Ball' ]).listen();
    simOption.onChange(function(value){
        userData.initMode = value;
    });

    framerate = gui.add(setconsole, 'FrameRate').listen();
    gflops = gui.add(setconsole, 'GFLOPS').listen();
    mflops = gui.add(setconsole, 'MFLOPS').listen();
    particles = gui.add(setconsole, 'Particles').listen();
    simfps = gui.add(setconsole, 'SimFPS').listen();
    drawfps = gui.add(setconsole, 'DrawFPS').listen();

    jssimmode = gui.add(setconsole, 'CLSimMode').listen();
    jssimmode.onChange(function(value) {
        userData.simMode = value;
        SetSimMode(userData.simMode);
    });
    
    device = gui.add(setconsole, 'GPU').listen();
    device.onChange(function(value){
        userData.gpu = value;
        if (value == true)
            InitCL();
    });
    
    jsdrawmode = gui.add(setconsole, 'GLDrawMode').listen();
    jsdrawmode.onChange(function(value){
        userData.drawMode = value;
        SetDrawMode(userData.drawMode);
    });

    start3d = gui.add(setconsole, 'Start3D').listen();
    start3d.onChange(function(value){
        userData.is3D = value;
    });

    rotate = gui.add(setconsole, 'Rotate').listen();
    rotate.onChange(function(value){
        userData.rotate = value;
    });

    this.CL_SIM_MODE = true;
    this.GL_DRAW_MODE = true;
    
    userData = new UserData();
    userData.fpsSampler = new FpsSampler(SAMPLEPERIOD, "fps", setconsole);
    userData.simSampler = new MSecSampler(SAMPLEPERIOD, "sms", setconsole);
    userData.drawSampler = new MSecSampler(SAMPLEPERIOD, "dms", setconsole);
    
    // setup work group size
    var clWorkGroupSize = GetWorkGroupSize();
    if (clWorkGroupSize !== null) {
        // assure particle count is a workgroup size multiple
        if (kParticleCount % clWorkGroupSize != 0)
        {
            kParticleCount = 4 * clWorkGroupSize;
        }
    }

//////////////////////////////////////

    // SPH data allocation
    userData.position             = new Float32Array(kParticleCount * POSITION_ATTRIB_SIZE);
    userData.sortedPosition       = new Float32Array(kParticleCount * POSITION_ATTRIB_SIZE);
    userData.prevPosition         = new Float32Array(kParticleCount * POSITION_ATTRIB_SIZE);
    userData.relaxedPos           = new Float32Array(kParticleCount * POSITION_ATTRIB_SIZE);
    userData.sortedPrevPos        = new Float32Array(kParticleCount * POSITION_ATTRIB_SIZE);
    
    userData.velocity             = new Float32Array(kParticleCount * VELOCITY_ATTRIB_SIZE);
    userData.sortedVelocity       = new Float32Array(kParticleCount * VELOCITY_ATTRIB_SIZE);
    
    userData.acceleration         = new Float32Array(kParticleCount * ACCELERATION_ATTRIB_SIZE);
    
    // each item is a 16 bit (2 byte) unsigned integer
    userData.particleIndex        = new Int32Array(kParticleCount * PARTICLEIndex_ATTRIB_SIZE);
    userData.gridCellIndex        = new Int32Array(voxel * GRIDCELLIndex_ATTRIB_SIZE);
    userData.gridCellIndexFixedUp = new Int32Array(voxel * GRIDCELLIndexFixedUP_ATTRIB_SIZE);

    userData.gridcell             = new Float32Array((volNx+1)*(volNy+1)*(volNz+1)*GRIDCELL_ATTRIB_SIZE);
    userData.gridpoint            = new Int32Array(volNx * volNy * volNz * GRIDPOINT_ATTRIB_SIZE);
    InitGridCellState();

    userData.gridGrad             = new Float32Array((volNx+1)*(volNy+1)*(volNz+1)*GRIDCELL_GRAD_ATTRIB_SIZE);
    InitGridGradState();

    userData.cubeIndex            = new Int32Array(volNx * volNy * volNz);
    InitGridCubeIndex();

    userData.tri                  = new Float32Array(maxTri * 9);
    Memset(userData.tri, maxTri * 9);

    userData.norm                 = new Float32Array(maxTri * 9);
    Memset(userData.norm, maxTri * 9);

// 2014-05-04: neighbor map added    
    userData.neighborMap          = new Int32Array(kParticleCount * kMaxNeighbourCount);
    var temp = kParticleCount * kMaxNeighbourCount;
    for (var i = 0; i < temp; i++)
        userData.neighborMap[i]   = -1;

    userData.density              = new Float32Array(kParticleCount * DENSITY_ATTRIB_SIZE);
    userData.nearDensity          = new Float32Array(kParticleCount * DENSITY_ATTRIB_SIZE);

    userData.pressure             = new Float32Array(kParticleCount * PRESSURE_ATTRIB_SIZE);
    userData.nearPressure         = new Float32Array(kParticleCount * PRESSURE_ATTRIB_SIZE);

    userData.densityDEBUG         = new Float32Array(kParticleCount * DENSITY_ATTRIB_SIZE);
    userData.pressureDEBUG        = new Float32Array(kParticleCount * PRESSURE_ATTRIB_SIZE);
    
//////////////////////////////////////

    // InitParticleState();

    userData.ctx = InitJS("canvas2D");
    userData.gl  = InitGL("canvas3D");
    userData.cl  = InitCL();

    SetSimMode(CL_SIM_MODE);
    SetDrawMode(GL_DRAW_MODE);

    // document.addEventListener('keydown', function(event) {
    // if (event.keyCode == 80) {
    //     alert('screenshot saved');
        
    //     var imgData;
    //     var canvasoutput = document.getElementById("output");
    //     imgData = canvasoutput.toDataURL();
    //     window.open(imgData, "toDataURL() image", "WINW = 800, WINH = 800");

    // }}, true);
    
    setInterval( MainLoop, 0 );
    setInterval( function() { userData.fpsSampler.display(); }, DISPLAYPERIOD);
    setInterval( function() { userData.simSampler.display(); }, DISPLAYPERIOD);
    setInterval( function() { userData.drawSampler.display(); }, DISPLAYPERIOD);
    setInterval( ShowFLOPS, 2*DISPLAYPERIOD);
}

function ShowFLOPS() {
    var flops = 0;
    if(userData.simSampler.ms > 0)
        flops = (INNER_FLOPS * kParticleCount * kParticleCount * 1000) / (userData.simSampler.ms);

    if(flops > 1000 * 1000 * 1000) {
        flops = Math.round(flops / (1000 * 1000 * 1000));
        
        setconsole.GFLOPS = flops;
        setconsole.MFLOPS = 0;
    }
    else {
        flops = Math.round(flops / (1000 * 1000));
        
        setconsole.MFLOPS = flops;
        setconsole.GFLOPS = 0;
    }
}

function InitParticleState() {
    
    InitBreakDam();

    setconsole.Particles = kParticleCount;
}

function arrayIndexFromCoordinate(i, xSize, j, ySize, k)
{
    return i + j * xSize + k * xSize * ySize;
}

function InitGridCellState(){
    
    var i, j, k;
    for (i = 0; i < volNx + 1; i++)
    {
        for (j = 0; j < volNy + 1; j++)
        {
            for (k = 0; k < volNz + 1; k++)
            {
                userData.gridcell[4*arrayIndexFromCoordinate(i, volNx+1, j, volNy+1, k)+0] = -kViewWidth/2  + volEdgeX * i;
                userData.gridcell[4*arrayIndexFromCoordinate(i, volNx+1, j, volNy+1, k)+1] = -kViewHeight/2 + volEdgeY * j;
                userData.gridcell[4*arrayIndexFromCoordinate(i, volNx+1, j, volNy+1, k)+2] = -kViewDepth/2  + volEdgeX * k;
            }
        }
    }

    var count = 0;
    
    for (i = 0; i < volNx; i++)
    {
        for (j = 0; j < volNy; j++)
        {
            for (k = 0; k < volNz; k++)    
            {
                /*
                       7--------6     *---4----*
                      /|       /|    /|       /|
                     / |      / |   7 |      5 |
                    /  |     /  |  /  8     /  9
                   3--------2   | *----6---*   |
                   |   |    |   | |   |    |   |
                   |   4----|---5 |   *---0|---*
                   |  /     |  /  11 /     10 /
                   | /      | /   | 3      | 1
                   |/       |/    |/       |/
                   0--------1     *---2----*
                */
                userData.gridpoint[8*count+0] = arrayIndexFromCoordinate(i,   volNx+1, j,   volNy+1, k);
                userData.gridpoint[8*count+1] = arrayIndexFromCoordinate(i+1, volNx+1, j,   volNy+1, k);
                userData.gridpoint[8*count+2] = arrayIndexFromCoordinate(i+1, volNx+1, j+1, volNy+1, k);
                userData.gridpoint[8*count+3] = arrayIndexFromCoordinate(i,   volNx+1, j+1, volNy+1, k);
                userData.gridpoint[8*count+4] = arrayIndexFromCoordinate(i,   volNx+1, j,   volNy+1, k+1);
                userData.gridpoint[8*count+5] = arrayIndexFromCoordinate(i+1, volNx+1, j,   volNy+1, k+1);
                userData.gridpoint[8*count+6] = arrayIndexFromCoordinate(i+1, volNx+1, j+1, volNy+1, k+1);
                userData.gridpoint[8*count+7] = arrayIndexFromCoordinate(i,   volNx+1, j+1, volNy+1, k+1);

                count++;
            }
        }
    }
}

function InitGridGradState() {
    var i, j, k;

    for (k = 0; k < volNz+1; k++)
    {
        for (j = 0; j < volNy+1; j++)
        {
            for (i = 0; i < volNx+1; i++)
            {
                if ((i == 0) || (i == volNx) || (j == 0) || (j == volNy) || (k == 0) || (k == volNz))
                    userData.gridGrad[4*arrayIndexFromCoordinate(i, volNx+1, j, volNy+1, k)+3] = -1.0;
            }
        }
    }
}

function InitGridCubeIndex() {
    var i;
    for (i = 0; i < volNx * volNy * volNz; i++)
    {
        userData.cubeIndex[i] = 0;
    }
}

function Memset(data, count)
{
    var i;
    for (i = 0; i < count; i++)
    {
        data[i] = 0.0;
    }
}

function MainLoop() {

    // if (frameCounter > 1)
        // userData.isSimRunning = false;
    
    userData.drawSampler.endFrame();   
    userData.fpsSampler.markFrame();   

    userData.simSampler.startFrame();
    
    switch (userData.initMode) {
        case "Break Dam":
            console.log("initMode set to " + userData.initMode);
            InitBreakDam();
            reset();
            break;
        case "Two Cube":
            console.log("initMode set to " + userData.initMode);
            InitTwoCubes();
            reset();
            break;
        case "Drop Cube":
            console.log("initMode set to " + userData.initMode);
            InitMidAirDrop();
            reset();
            break;
        case "Drop Ball":
            console.log("initMode set to " + userData.initMode);
            InitBallDrop();
            reset();
            break;
        default:
            console.log("initMode set to " + userData.initMode);
        }

    if(userData.isSimRunning) {
        if(userData.simMode === JS_SIM_MODE) {
            SimulateJS();
        }
        else {
            SimulateCL(userData.cl);

            if (userData.writeFrame)
            {
                if (frameCounter < 300)
                {
                    WriteFrame();
                    console.log("frame " + frameCounter + "stored");
                    frameCounter++;
                }
            }
        }
    }

    // Marching Cubes computation
    March();

    userData.simSampler.endFrame();
    userData.drawSampler.startFrame();
    
    Draw();
}

function WriteFrame() {
    
    var node = document.getElementById("output");
    var posString = new String("");

    var i;
    for (i = 0; i < kParticleCount; i++)
    {
        var newPos = new String(userData.sortedPosition[4*i+0] + " "
                              + userData.sortedPosition[4*i+1] + " " 
                              + userData.sortedPosition[4*i+2] + "\n");
        
        // var newPos = new String("frameCounter = " + frameCounter + "\n");

        posString += newPos;
    }
    
    // node.innerHTML = posString;

    var socket = io.connect("/");

    // var data = document.getElementById("output").innerHTML;
    // socket.send(node.innerHTML);
    socket.send(posString);

}

function Draw() {
    if(userData.drawMode === JS_DRAW_MODE)
        DrawJS(userData.ctx);
    else
    {
        DrawGL(userData.gl);
    }
}

function SetSimMode(simMode) {
    userData.simMode = simMode;
}

function SetDrawMode(drawMode) {
    var canvas2D = document.getElementById("canvas2D");
    var canvas3D = document.getElementById("canvas3D");
    
    if(drawMode === GL_DRAW_MODE) {
        canvas2D.style.visibility = "hidden";
        canvas3D.style.visibility = "visible";
    }
    else {
        canvas2D.style.visibility = "visible";
        canvas3D.style.visibility = "hidden";
    }

    userData.drawMode = drawMode;
}