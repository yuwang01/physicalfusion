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
    
    // userData.PosLoc = gl.getAttribLocation(userData.particleProgram, "position");
    userData.positionVBO = gl.getAttribLocation(userData.particleProgram, "position");
    userData.mvpParticleLoc = gl.getUniformLocation(userData.particleProgram, "mvp");
    userData.densityLoc = gl.getAttribLocation(userData.particleProgram, "density");
    
    userData.positionVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, userData.positionVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.position, gl.DYNAMIC_DRAW);

    // mesh
    // 
    userData.triangleProgram = gl.createProgram();
    gl.attachShader(userData.triangleProgram, getShader(gl, "triangle-vshader"));
    gl.attachShader(userData.triangleProgram, getShader(gl, "triangle-fshader"));
    gl.linkProgram(userData.triangleProgram);
    gl.useProgram(userData.triangleProgram);

    userData.trianglesVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, userData.trianglesVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.tri, gl.STATIC_DRAW);

    userData.trianglesNormVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, userData.trianglesNormVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.norm, gl.STATIC_DRAW);
    
    userData.trianglesLoc = gl.getAttribLocation(userData.triangleProgram, "position");
    userData.trianglesNormLoc = gl.getAttribLocation(userData.triangleProgram, "normal");
    userData.vTriangleLoc = gl.getUniformLocation(userData.triangleProgram, "view");
    userData.pTriangleLoc = gl.getUniformLocation(userData.triangleProgram, "proj");

    // initialize matrices
    //
    userData.modelMatrix.makeIdentity();
    
    var aspect = WINW / WINH;
    userData.vpMatrix.perspective(48, aspect, 1, 1000);

    userData.pMatrix.perspective(48, aspect, 1, 1000);
    
    var cameraPosition = [0, 0, 1.6*kViewDepth];
    var cameraTarget = [0, 0, 0];
    var cameraUpVector = [0, 1, 0];
    
    userData.vpMatrix.lookat(
            cameraPosition[0], cameraPosition[1], cameraPosition[2],
            cameraTarget[0],   cameraTarget[1],   cameraTarget[2], 
            cameraUpVector[0], cameraUpVector[1], cameraUpVector[2]);
    
    userData.vMatrix.lookat(
            cameraPosition[0], cameraPosition[1], cameraPosition[2],
            cameraTarget[0],   cameraTarget[1],   cameraTarget[2], 
            cameraUpVector[0], cameraUpVector[1], cameraUpVector[2]);
    
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(.8, .8, .8, 1);
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    return gl;
}

function DrawGL(gl) {
    if(gl === null)
        return;
    
    if(userData.is3D) {
        if (userData.rotate) {
    ﻿     userData.modelMatrix.rotate(userData.theta, 0, 1, 0);
        }
    ﻿   
        userData.mvpMatrix.load(userData.vpMatrix);
        userData.mvpMatrix.multiply(userData.modelMatrix);
        userData.npMatrix.load(userData.mvpMatrix);
        
        // userData.npMatrix.invert();
    }
    else {
        userData.mvpMatrix.makeIdentity();
        userData.npMatrix.makeIdentity();
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
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

    //////////////////////////////////////
    // Marching cubes
    gl.useProgram(userData.triangleProgram);
    userData.vMatrix.setUniform(gl, userData.vTriangleLoc, false);
    userData.pMatrix.setUniform(gl, userData.pTriangleLoc, false);
    
    // gl.enableVertexAttribArray(userData.cubeLoc);
﻿  ﻿  
    gl.bindBuffer(gl.ARRAY_BUFFER, userData.trianglesVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.tri, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(userData.trianglesLoc);
    gl.vertexAttribPointer(userData.trianglesLoc, TRIANGLE_ATTRIB_SIZE, gl.FLOAT, false, TRIANGLE_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, userData.trianglesNormVBO);
    gl.bufferData(gl.ARRAY_BUFFER, userData.norm, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(userData.trianglesNormLoc);
    gl.vertexAttribPointer(userData.trianglesNormLoc, TRIANGLE_ATTRIB_SIZE, gl.FLOAT, true, TRIANGLE_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT, 0);
    
    gl.drawArrays(gl.TRIANGLES, 0, Ntri*9);
    
    gl.flush();
}