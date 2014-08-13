// var cubeVertices = [
//     -1*kViewWidth/2, -1*kViewHeight/2, -1*kViewDepth/2,
//     -1*kViewWidth/2,    kViewHeight/2, -1*kViewDepth/2,
//        kViewWidth/2,    kViewHeight/2, -1*kViewDepth/2,
//        kViewWidth/2, -1*kViewHeight/2, -1*kViewDepth/2,         
//     -1*kViewWidth/2, -1*kViewHeight/2,    kViewDepth/2,
//     -1*kViewWidth/2,    kViewHeight/2,    kViewDepth/2,
//        kViewWidth/2,    kViewHeight/2,    kViewDepth/2,
//        kViewWidth/2, -1*kViewHeight/2,    kViewDepth/2               
// ];

// var cubeIndices = [
//      0, 1,              // backface
//      1, 2,
//      2, 3,
//      3, 0,
//      4, 5,              // frontface
//      5, 6,
//      6, 7,
//      7, 4,
//      0, 4,              // back to front
//      1, 5,
//      2, 6,
//      3, 7,
// ];

var cubeFacesVertices = [
    // Front face
    -1*kViewWidth/2, -1*kViewHeight/2, kViewDepth/2,
       kViewWidth/2, -1*kViewHeight/2, kViewDepth/2,
       kViewWidth/2,    kViewHeight/2, kViewDepth/2,
    -1*kViewWidth/2,    kViewHeight/2, kViewDepth/2,

    // Back face
    -1*kViewWidth/2, -1*kViewHeight/2, -1*kViewDepth/2,
    -1*kViewWidth/2,    kViewHeight/2, -1*kViewDepth/2,
       kViewWidth/2,    kViewHeight/2, -1*kViewDepth/2,
       kViewWidth/2, -1*kViewHeight/2, -1*kViewDepth/2,

    // Top face
    -1*kViewWidth/2,    kViewHeight/2, -1*kViewDepth/2,
    -1*kViewWidth/2,    kViewHeight/2,    kViewDepth/2,
       kViewWidth/2,    kViewHeight/2,    kViewDepth/2,
       kViewWidth/2,    kViewHeight/2, -1*kViewDepth/2,

    // Bottom face
    -1*kViewWidth/2, -1*kViewHeight/2, -1*kViewDepth/2,
       kViewWidth/2, -1*kViewHeight/2, -1*kViewDepth/2,
       kViewWidth/2, -1*kViewHeight/2,    kViewDepth/2,
    -1*kViewWidth/2, -1*kViewHeight/2,    kViewDepth/2,

    // Right face
       kViewWidth/2, -1*kViewHeight/2, -1*kViewDepth/2,
       kViewWidth/2,    kViewHeight/2, -1*kViewDepth/2,
       kViewWidth/2,    kViewHeight/2,    kViewDepth/2,
       kViewWidth/2, -1*kViewHeight/2,    kViewDepth/2,

    // Left face
    -1*kViewWidth/2, -1*kViewHeight/2, -1*kViewDepth/2,
    -1*kViewWidth/2, -1*kViewHeight/2,    kViewDepth/2,
    -1*kViewWidth/2,    kViewHeight/2,    kViewDepth/2,
    -1*kViewWidth/2,    kViewHeight/2, -1*kViewDepth/2
];

var cubeFacesIndices = [
     // Front face
     0, 1, 2, 0, 2, 3,
     // Back face
     4, 5, 6, 4, 6, 7,
     // Top face
     8, 9, 10, 8, 10, 11,
     // Bottom face
     12, 13, 14, 12, 14, 15,
     // Right face
     16, 17, 18, 16, 18, 19,
     // Left face
     20, 21, 22, 20, 22, 23
];

var vertexNormals = [
    // Front
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
    
    // Back
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
     0.0,  0.0, -1.0,
    
    // Top
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
     0.0,  1.0,  0.0,
    
    // Bottom
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
     0.0, -1.0,  0.0,
    
    // Right
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
     1.0,  0.0,  0.0,
    
    // Left
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
];

var planeVertices = [

    -10*kViewWidth/2, -1*kViewHeight/2, -10*kViewDepth/2,
     10*kViewWidth/2, -1*kViewHeight/2, -10*kViewDepth/2,
     10*kViewWidth/2, -1*kViewHeight/2,  10*kViewDepth/2,
    -10*kViewWidth/2, -1*kViewHeight/2,  10*kViewDepth/2

];

var planeFacesIndices = [
    0, 1, 2, 0, 2, 3
];

var planeVertexNormals = [
    
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0
];

function printBuffer(buffers) {
    for (var i = 0; i < buffers.length; i=i+2) {
        var j = i+1;
        console.error("("+ i + ", " + j + ") = (" + buffers[i] + "," + buffers[j] + ")");
    }
}

function InitGL(canvasName) {
    var canvas = document.getElementById(canvasName);
    var gl = canvas.getContext("experimental-webgl");
    
    if(gl === null) {
        console.error("Failed to create WebGL context");
        return null;
    }
    
    // needed
    canvas.width  = WINW;
    canvas.height = WINH;
    
    //////////////////////////////////////
    // SPH particle-related buffer setup
    userData.particleProgram = gl.createProgram();
    gl.attachShader(userData.particleProgram, getShader( gl, "particle-vshader"));
    gl.attachShader(userData.particleProgram, getShader( gl, "particle-fshader"));

    gl.linkProgram(userData.particleProgram);
    gl.useProgram(userData.particleProgram);
    
    userData.PosLoc = gl.getAttribLocation(userData.particleProgram, "position");
    userData.mvpParticleLoc = gl.getUniformLocation(userData.particleProgram, "mvp");
    
    userData.positionVBO = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, userData.positionVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.position, gl.DYNAMIC_DRAW);

    //////////////////////////////////////

    // cube
    //
    userData.cubeProgram  = gl.createProgram();
    gl.attachShader(userData.cubeProgram, getShader( gl, "cube-vshader" ));
    gl.attachShader(userData.cubeProgram, getShader( gl, "cube-fshader" ));
    gl.linkProgram(userData.cubeProgram);
    gl.useProgram(userData.cubeProgram);
    
    userData.cubeLoc = gl.getAttribLocation(userData.cubeProgram, "cube");
    userData.mvpCubeLoc = gl.getUniformLocation(userData.cubeProgram, "mvp");
    userData.npCubeLoc = gl.getUniformLocation(userData.cubeProgram, "np");
    userData.normalLoc = gl.getAttribLocation(userData.cubeProgram, "vNormal");
    
    userData.cubeFacesVertices = new Float32Array(cubeFacesVertices);
    userData.cubeFacesIndices = new Uint16Array(cubeFacesIndices);
    userData.cubeFacesNormals = new Float32Array(vertexNormals);

    userData.cubeFacesVertexVBO = gl.createBuffer();
    userData.cubeFacesIndexVBO = gl.createBuffer();
    userData.cubeFacesNormalVBO = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, userData.cubeFacesVertexVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.cubeFacesVertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, userData.cubeFacesIndexVBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, userData.cubeFacesIndices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, userData.cubeFacesNormalVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.cubeFacesNormals, gl.STATIC_DRAW);
    
    // plane
    //
    userData.planeProgram = gl.createProgram();
    gl.attachShader(userData.planeProgram, getShader(gl, "plane-vshader"));
    gl.attachShader(userData.planeProgram, getShader(gl, "plane-fshader"));
    gl.linkProgram(userData.planeProgram);
    gl.useProgram(userData.planeProgram);

    userData.planeLoc = gl.getAttribLocation(userData.planeProgram, "plane");
    userData.mvpplaneLoc = gl.getUniformLocation(userData.planeProgram, "mvp");
    userData.npplaneLoc = gl.getUniformLocation(userData.planeProgram, "np");
    userData.normalPlaneLoc = gl.getAttribLocation(userData.planeProgram, "vNormal");

    userData.planeFacesVertices = new Float32Array(planeVertices);
    userData.planeFacesIndices = new Uint16Array(planeFacesIndices);
    userData.planeFacesNormals = new Float32Array(planeVertexNormals);

    userData.planeFacesVerticesVBO = gl.createBuffer();
    userData.planeFacesIndicesVBO = gl.createBuffer();
    userData.planeFacesNormalsVBO = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, userData.planeFacesVerticesVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.planeFacesVertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, userData.planeFacesIndicesVBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, userData.planeFacesIndices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, userData.planeFacesNormalsVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.planeFacesNormals, gl.STATIC_DRAW);

    // initialize matrices
    //
    userData.modelMatrix.makeIdentity();
    
    var aspect = WINW / WINH;
    userData.vpMatrix.perspective(60, aspect, 1, 1000);
    
    var cameraPosition = [0, 0, 1.6*kViewDepth];
    var cameraTarget = [0, 0, 0];
    var cameraUpVector = [0, 1, 0];      
    userData.vpMatrix.lookat(
            cameraPosition[0], cameraPosition[1], cameraPosition[2],
            cameraTarget[0],   cameraTarget[1],   cameraTarget[2], 
            cameraUpVector[0], cameraUpVector[1], cameraUpVector[2]);
    
    // gl.clear(gl.DEPTH_BUFFER_BIT);
    // gl.disable(gl.BLEND);
    // gl.enable(gl.DEPTH_TEST);
    // gl.depthFunc(gl.MORE);
    // gl.enable(gl.POINT_SMOOTH);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(.15, .15, .15, 1);
    // gl.clearColor(0.5, 0.08, 0.1, 1.0)
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    return gl;
}

function DrawGL(gl) {
    if(gl === null)
        return;
    
    if(userData.is3D) {
        if (userData.rotate) {
    	   userData.modelMatrix.rotate(userData.theta, 0, 1, 0);
        }
    	userData.mvpMatrix.load(userData.vpMatrix);
    	userData.mvpMatrix.multiply(userData.modelMatrix);
        userData.npMatrix.load(userData.mvpMatrix);
        userData.npMatrix.invert();
    }
    else {
    	userData.mvpMatrix.makeIdentity();
        userData.npMatrix.makeIdentity();
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // cube
    //
    if(userData.is3D) {

		gl.useProgram(userData.cubeProgram);
		userData.mvpMatrix.setUniform(gl,userData.mvpCubeLoc, false);
        userData.npMatrix.setUniform(gl, userData.npCubeLoc, false);

        gl.bindBuffer(gl.ARRAY_BUFFER, userData.cubeFacesNormalVBO);
		gl.bindBuffer(gl.ARRAY_BUFFER, userData.cubeFacesVertexVBO);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, userData.cubeFacesIndexVBO);
        
        gl.enableVertexAttribArray(userData.cubeLoc);
		gl.vertexAttribPointer(userData.cubeLoc, CUBE_ATTRIB_SIZE, gl.FLOAT, false, CUBE_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT, 0 );
		gl.drawElements(gl.TRIANGLES, userData.cubeFacesIndices.length, gl.UNSIGNED_SHORT, 0);

        //////////////////////////////////////
        // plane
        gl.useProgram(userData.planeProgram);
        userData.mvpMatrix.setUniform(gl, userData.mvpplaneLoc, false);
        userData.npMatrix.setUniform(gl, userData.npplaneLoc, false);

        gl.bindBuffer(gl.ARRAY_BUFFER, userData.planeFacesNormalsVBO);
        gl.bindBuffer(gl.ARRAY_BUFFER, userData.planeFacesVerticesVBO);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, userData.planeFacesIndicesVBO);
        
        gl.enableVertexAttribArray(userData.planeFacesVerticesVBO);
        gl.vertexAttribPointer(userData.planeFacesVerticesVBO, CUBE_ATTRIB_SIZE, gl.FLOAT, false, CUBE_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.drawElements(gl.TRIANGLES, userData.planeFacesIndices.length, gl.UNSIGNED_SHORT, 0);

    }

    //////////////////////////////////////
    // SPH particles
    gl.useProgram(userData.particleProgram);
    userData.mvpMatrix.setUniform(gl, userData.mvpParticleLoc, false);

    gl.bindBuffer(gl.ARRAY_BUFFER, userData.positionVBO);
    if(userData.simMode === JS_SIM_MODE || !userData.isGLCLshared) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, userData.position);
    }
    gl.enableVertexAttribArray(userData.positionVBO);
    gl.vertexAttribPointer(userData.positionVBO, POSITION_ATTRIB_SIZE, gl.FLOAT, false, POSITION_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.drawArrays(gl.POINTS, 0, kParticleCount);

    gl.flush ();
}
