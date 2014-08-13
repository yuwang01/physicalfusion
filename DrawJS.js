// this function takes the position of every particle
// in prevPosition and calculate ALL particle IDs that's
// within the pre-set radius
function particleNeighbors (radius) {

    console.log("In DrawJS: Voxel info");
    voxelInfo();
    for (var i = 0; i < kParticleCount; i++) {
        
        var xi = userData.sortedPosition[i*4+0];
        var yi = userData.sortedPosition[i*4+1];
        var zi = userData.sortedPosition[i*4+2];
        // var xi = userData.position[i*4+0];
        // var yi = userData.position[i*4+1];
        // var zi = userData.position[i*4+2];

        var neighborString = new String("particle " + i + " neighbors: ");

        for (var j = 0; j < kParticleCount; j++) {
            var xj = userData.sortedPosition[j*4+0];
            var yj = userData.sortedPosition[j*4+1];
            var zj = userData.sortedPosition[j*4+2];
            // var xj = userData.position[j*4+0];
            // var yj = userData.position[j*4+1];
            // var zj = userData.position[j*4+2];

            var dx = xi - xj;
            var dy = yi - yj;
            var dz = zi - zj;

            var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance <= radius)
            {   
                var newNeighbor = new String(" " + j);
                neighborString += newNeighbor;
            }
        }

        console.error(neighborString);
    }
}

function length(x, y, z) {
    var result = x * x + y * y + z * z;
    return Math.sqrt(result);
}

function wDefault(weightDefault, maxSearchRadius, distX, distY, distZ) {
    var result;
    var ratio = length(distX, distY, distZ);
    var ratioSquared = ratio * ratio;
    var maxSearchRadiusSquared = maxSearchRadius * maxSearchRadius;
    var ratioDif = maxSearchRadiusSquared - ratioSquared;
    result = weightDefault * ratioDif * ratioDif * ratioDif;
    // console.log("wDefault result: " + result);
    return result;
}

function wPressure(weightPressure, maxSearchRadius, distX, distY, distZ) {
    var result = new Float32Array(3);
    var ratio = length(distX, distY, distZ);
    var diff = maxSearchRadius - ratio;
    var lenDist = length(distX, distY, distZ);
    if ( lenDist != 0.0)
    {
        result[0] = weightPressure * distX * diff * diff / lenDist;
        result[1] = weightPressure * distY * diff * diff / lenDist;
        result[2] = weightPressure * distZ * diff * diff / lenDist;
    }

    // console.log("wPressure result: (" + result[0] + ", " + result[1] + ", " + result[2] + ")");
    return result;
}

function wViscosity(weightViscosity, maxSearchRadius, distX, distY, distZ) {
    var result = new Float32Array(1);
    var ratio = length(distX, distY, distZ);
    var diff = maxSearchRadius - ratio;
    result = weightViscosity * diff;

    // console.log("wViscosity result: " + result);
    return result;
}

function computeDensityPressureALL(mass, pressureK, restDensity, radius) {
        
        var partcleCount;

    for (particleCount = 0; particleCount < kParticleCount; particleCount++)
    {
        var neighborList = new Int32Array(kParticleCount * 32);
        
        var i;
        for (i = 0; i < 32; i++)
        {    
            neighborList[i] = userData.neighborMap[32*particleCount + i];
        }

        var posX = userData.prevPosition[4*particleCount + 0];
        var posY = userData.prevPosition[4*particleCount + 1];
        var posZ = userData.prevPosition[4*particleCount + 2];

        var neighborIdx;
        var dens = 0.0;
        var neighborPosX, neighborPosY, neighborPosZ; 
        var density = 0.0;
        var pressure = 0.0;

        for (i = 0; i < 32; i++)
        {
            neighborIdx = userData.neighborMap[32*particleCount+i];
            neighborPosX = userData.prevPosition[4*neighborIdx+0];
            neighborPosY = userData.prevPosition[4*neighborIdx+1];
            neighborPosZ = userData.prevPosition[4*neighborIdx+2];

            dens += mass * wDefault(weightDefaultConstant, radius, posX-neighborPosX, posY-neighborPosY, posZ-neighborPosZ);
        }

        userData.densityDEBUG[particleCount] = dens;
        
        userData.pressureDEBUG[particleCount] = pressureK * (dens - restDensity);
    }
}

function computeDensityPressure(mass, pressureK, restDensity, pidx, radius) {
        
        console.log("Javascript: computeDensityPressure()");
        console.log("Javascript: particle " + pidx + " neighbor list: ");
        var neighborList = new Int32Array(kParticleCount * 32);
        var neighborString = "Javascript: ";

        var i;
        for (i = 0; i < 32; i++)
        {    
            neighborList[i] = userData.neighborMap[32*pidx + i];
            var newNeighbor = new String(" " + neighborList[i]);
            neighborString += newNeighbor;
        }

        console.log(neighborString);

        var posX = userData.prevPosition[4*pidx + 0];
        var posY = userData.prevPosition[4*pidx + 1];
        var posZ = userData.prevPosition[4*pidx + 2];

        var neighborIdx;
        var dens = 0.0;
        var neighborPosX, neighborPosY, neighborPosZ; 
        var density = 0.0;
        var pressure = 0.0;

        console.log("Javascript: particle " + pidx + " density: ");
        var densityString = "Javascript: ";

        for (i = 0; i < 32; i++)
        {
            neighborIdx = userData.neighborMap[32*pidx+i];
            neighborPosX = userData.prevPosition[4*neighborIdx+0];
            neighborPosY = userData.prevPosition[4*neighborIdx+1];
            neighborPosZ = userData.prevPosition[4*neighborIdx+2];

            dens += mass * wDefault(weightDefaultConstant, radius, posX-neighborPosX, posY-neighborPosY, posZ-neighborPosZ);
        }

        density = dens;
        var newDensity = new String(" " + density);
        densityString += newDensity;

        console.log(densityString);

        console.log("Javascript: particle " + pidx + " pressure: ");
        pressure = pressureK * (density - restDensity);
        var pressureString = "Javascript: ";
        var newPressure = new String(" " + pressure);
        pressureString += newPressure;

        console.log(pressureString);
}

function computeAcceleration(mass, visc, pidx, radius) {
    console.log("Javascript: computeAcceleration()");
    // console.log("Javascript: particle " + pidx + " neighbor list: ");
    var neighborList = new Int32Array(kParticleCount * 32);
    var neighborString = "Javascript: ";

    var i;
    for (i = 0; i < 32; i++)
    {    
        neighborList[i] = userData.neighborMap[32*pidx + i];
        var newNeighbor = new String(" " + neighborList[i]);
        neighborString += newNeighbor;
    }

    console.log(neighborString);

    var posX = userData.prevPosition[4*pidx + 0];
    var posY = userData.prevPosition[4*pidx + 1];
    var posZ = userData.prevPosition[4*pidx + 2];    

    var velX = userData.sortedVelocity[4*pidx + 0];
    var velY = userData.sortedVelocity[4*pidx + 1];
    var velZ = userData.sortedVelocity[4*pidx + 2];
    
    var neighborIdx;
    var neighborPosX, neighborPosY, neighborPosZ; 
    var neighborVelX, neighborVelY, neighborVelZ; 
    var pressureGradX = 0.0;
    var pressureGradY = 0.0;
    var pressureGradZ = 0.0;

    for (i = 0; i < 32; i++) {
        neighborIdx = userData.neighborMap[32*pidx+i];
        neighborPosX = userData.prevPosition[4*neighborIdx+0];
        neighborPosY = userData.prevPosition[4*neighborIdx+1];
        neighborPosZ = userData.prevPosition[4*neighborIdx+2];

        // float pOverRhoSquared = pressure[gid]/(density[gid]*density[gid]) + pressure[neighborIdx]/(density[neighborIdx]*density[neighborIdx]);
        var pOverRhoSquared = userData.pressure[pidx]/(userData.density[pidx]*userData.density[pidx]) + 
                              userData.pressure[neighborIdx]/(userData.density[neighborIdx]*userData.density[neighborIdx]);

        var wpressure = wPressure(weightPressureConstant, radius, posX - neighborPosX, posY - neighborPosY, posZ - neighborPosZ);
        pressureGradX += mass * pOverRhoSquared * wpressure[0];
        pressureGradY += mass * pOverRhoSquared * wpressure[1];
        pressureGradZ += mass * pOverRhoSquared * wpressure[2];                    
    }

    var viscousTermX = 0.0;
    var viscousTermY = 0.0;
    var viscousTermZ = 0.0;

    for (i = 0; i < 32; i++) {
        neighborIdx = userData.neighborMap[32*pidx+i];
        neighborPosX = userData.prevPosition[4*neighborIdx+0];
        neighborPosY = userData.prevPosition[4*neighborIdx+1];
        neighborPosZ = userData.prevPosition[4*neighborIdx+2];

        neighborVelX = userData.sortedVelocity[4*neighborIdx+0];
        neighborVelY = userData.sortedVelocity[4*neighborIdx+1];
        neighborVelZ = userData.sortedVelocity[4*neighborIdx+2];

        var wviscosity = wViscosity(weightViscosityConstant, radius, posX-neighborPosX, posY-neighborPosY, posZ-neighborPosZ);

        // console.log("neighborVelX: " + neighborVelX);
        // console.log("velX: " + velX);
        // console.log("mass: " + mass);
        // console.log("wviscosity: " + wviscosity);
        // console.log("userData.density[neighborIdx]: " + userData.density[neighborIdx]);

        viscousTermX += (neighborVelX - velX) * mass * wviscosity / userData.density[neighborIdx];
        viscousTermY += (neighborVelY - velY) * mass * wviscosity / userData.density[neighborIdx];
        viscousTermZ += (neighborVelZ - velZ) * mass * wviscosity / userData.density[neighborIdx];
    }

    viscousTermX *= visc / userData.density[pidx];
    viscousTermY *= visc / userData.density[pidx];
    viscousTermZ *= visc / userData.density[pidx];

    var gX = 0.0;
    var gY = -9.82;
    var gZ = 0.0;

    var accelerationX = 0.0;
    var accelerationY = 0.0;
    var accelerationZ = 0.0;
    
    accelerationX = gX - pressureGradX + viscousTermX;
    accelerationY = gY - pressureGradY + viscousTermY;
    accelerationZ = gZ - pressureGradZ + viscousTermZ;
    
    // console.log("Javascript: particle "+ pidx + " g            = (" + gX + "," + gY + ", " + gZ + ")");
    // console.log("Javascript: particle "+ pidx + " pressureGrad = (" + pressureGradX + "," + pressureGradY + ", " + pressureGradZ + ")");
    // console.log("Javascript: particle "+ pidx + " viscousTerm  = (" + viscousTermX + ", " + viscousTermY + ", " + viscousTermZ + ")");
    // console.log("Javascript: particle "+ pidx + " acceleration = (" + accelerationX + "," + accelerationY + ", " + accelerationZ + ")");

    var updateVelX = 0.0;
    var updateVelY = 0.0;
    var updateVelZ = 0.0;

    var updatePosX = 0.0;
    var updatePosY = 0.0;
    var updatePosZ = 0.0;

    updateVelX = velX + accelerationX * dt;
    updateVelY = velY + accelerationY * dt;
    updateVelZ = velZ + accelerationZ * dt;

    updatePosX = posX + updateVelX * dt;
    updatePosY = posY + updateVelY * dt;
    updatePosZ = posZ + updateVelZ * dt;

    console.log("Javascript: particle " + pidx + " velocity = (" + updateVelX + ", " + updateVelY + ", " + updateVelZ + ")");
    console.log("Javascript: particle " + pidx + " position = (" + updatePosX + ", " + updatePosY + ", " + updatePosZ + ")");

}

function InitJS(canvasName) {
    var canvas = document.getElementById(canvasName);
    var ctx = canvas.getContext("2d");
    
    if(ctx === null) {
        console.error("Failed to create Canvas2D context");
        return null;
    }
    
    // needed
    canvas.width  = WINW;
    canvas.height = WINH;
    
    return ctx;
}
 
function DrawJS(ctx) {
    if(ctx === null)
        return;
        
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0, 0, WINW, WINH);
        
    // ctx.fillStyle = 'rgba(255,255,0,1)';

    // for (var i=0; i < voxel; i++) {
    //     // var gridCellIdx = userData.gridCellIndex[i];
    //     var gridCellIdxFixedUp = userData.gridCellIndexFixedUp[i];
    //     // console.error("gridCellIndex     [" + i + "]           -- " + gridCellIdx);
    //     console.error("gridCellIdxFixedUp[" + i + "]           -- " + gridCellIdxFixedUp);
    // }

    var radius = kH;
    // particleNeighbors(radius);
    // computeDensityPressureALL(particleMass, pressureK, restDensity, radius);

    // var DEBUG_Index = 1000;
    // computeDensityPressure(particleMass, pressureK, restDensity, DEBUG_Index, radius);
    // computeAcceleration(particleMass, viscosity, DEBUG_Index, radius);

    for (var i=0; i < kParticleCount; i++)  {
        
        // var x = userData.position[4*i+0];
        // var y = userData.position[4*i+1];
        // var z = userData.position[4*i+2];
        // var w = userData.position[4*i+3];

        // console.error("WebCL: particle " + i + " is in voxel " + w);

        // var vx = userData.velocity[4*i+0];
        // var vy = userData.velocity[4*i+1];
        // var vz = userData.velocity[4*i+2];
        // var vw = userData.velocity[4*i+3];

        var sx = userData.sortedPosition[4*i+0];
        var sy = userData.sortedPosition[4*i+1];
        var sz = userData.sortedPosition[4*i+2];
        var sw = userData.sortedPosition[4*i+3];        

        // var svx = userData.sortedVelocity[4*i+0];
        // var svy = userData.sortedVelocity[4*i+1];
        // var svz = userData.sortedVelocity[4*i+2];
        // var svw = userData.sortedVelocity[4*i+3];        
        
        var v0 = userData.neighborMap[kMaxNeighbourCount*i+0];
        var v1 = userData.neighborMap[kMaxNeighbourCount*i+1];
        var v2 = userData.neighborMap[kMaxNeighbourCount*i+2];
        var v3 = userData.neighborMap[kMaxNeighbourCount*i+3];
        var v4 = userData.neighborMap[kMaxNeighbourCount*i+4];
        var v5 = userData.neighborMap[kMaxNeighbourCount*i+5];
        var v6 = userData.neighborMap[kMaxNeighbourCount*i+6];
        var v7 = userData.neighborMap[kMaxNeighbourCount*i+7];

        var v8 = userData.neighborMap[kMaxNeighbourCount*i+8];
        var v9 = userData.neighborMap[kMaxNeighbourCount*i+9];
        var v10 = userData.neighborMap[kMaxNeighbourCount*i+10];
        var v11 = userData.neighborMap[kMaxNeighbourCount*i+11];
        var v12 = userData.neighborMap[kMaxNeighbourCount*i+12];
        var v13 = userData.neighborMap[kMaxNeighbourCount*i+13];
        var v14 = userData.neighborMap[kMaxNeighbourCount*i+14];
        var v15 = userData.neighborMap[kMaxNeighbourCount*i+15];

        var v16 = userData.neighborMap[kMaxNeighbourCount*i+16];
        var v17 = userData.neighborMap[kMaxNeighbourCount*i+17];
        var v18 = userData.neighborMap[kMaxNeighbourCount*i+18];
        var v19 = userData.neighborMap[kMaxNeighbourCount*i+19];
        var v20 = userData.neighborMap[kMaxNeighbourCount*i+20];
        var v21 = userData.neighborMap[kMaxNeighbourCount*i+21];
        var v22 = userData.neighborMap[kMaxNeighbourCount*i+22];
        var v23 = userData.neighborMap[kMaxNeighbourCount*i+23];

        var v24 = userData.neighborMap[kMaxNeighbourCount*i+24];
        var v25 = userData.neighborMap[kMaxNeighbourCount*i+25];
        var v26 = userData.neighborMap[kMaxNeighbourCount*i+26];
        var v27 = userData.neighborMap[kMaxNeighbourCount*i+27];
        var v28 = userData.neighborMap[kMaxNeighbourCount*i+28];
        var v29 = userData.neighborMap[kMaxNeighbourCount*i+29];
        var v30 = userData.neighborMap[kMaxNeighbourCount*i+30];
        var v31 = userData.neighborMap[kMaxNeighbourCount*i+31];
        
        // if (i == DEBUG_Index)
        // {
            // console.error("WebCL: particle "  + i   + " is in voxel "   + sw  + " --"+ " neighbors list: (" + 
            //             v0 + ", "  + v1  + ", " + v2  + ", " + v3  + ", " + v4  + ", " + v5  + ", " + v6  + ", " + v7  + ", " +
            //             v8 + ", "  + v9  + ", " + v10 + ", " + v11 + ", " + v12 + ", " + v13 + ", " + v14 + ", " + v15 + ", " +
            //             v16 + ", " + v17 + ", " + v18 + ", " + v19 + ", " + v20 + ", " + v21 + ", " + v22 + ", " + v23 + ", " +
            //             v24 + ", " + v25 + ", " + v26 + ", " + v27 + ", " + v28 + ", " + v29 + ", " + v30 + ", " + v31 + ")");
        // }

        // if (i == DEBUG_Index)
        // {
        //     console.error("WebCL: particle " + i + " sorted velocity     (" + svx  + ", " + svy   + ", " + svz   + ")");
        //     console.error("WebCL: particle " + i + " sorted position     (" + sx   + ", " +  sy   + ", " +  sz   + ")");
        //     // console.error("WebCL: particle " + i + " acceleration (" + accX + ", " + accX + ", " + accX + ")");
        // }
        // if (i == DEBUG_Index)
        // {
            // var pdensity = userData.density[i];
            // var ppressure = userData.pressure[i];
            // console.error("particle " + i + " has a local density: " + pdensity);
            // console.error("particle " + i + " has a local pressure: " + ppressure);
            
            // var paccX = userData.acceleration[4*i+0];
            // var paccY = userData.acceleration[4*i+1];
            // var paccZ = userData.acceleration[4*i+2];
            // var paccW = userData.acceleration[4*i+3];
            // console.error("particle " + i + " g: (" + paccX + ", " + paccY + ", " + paccZ + ")");
            // console.error("particle " + i + " pressureGrad: (" + paccX + ", " + paccY + ", " + paccZ + ")");
            // console.error("particle " + i + " viscousTermX: (" + paccX + ", " + paccY + ", " + paccZ + ")");
            // console.error("particle " + i + " acceleration: (" + paccX + ", " + paccY + ", " + paccZ + ", " + paccW + ")");

        // }

        // // use GL orientation
        // y = -y;

        // var px = (WINW + (x * WINW))/2;
        // var py = (WINH + (y * WINH))/2;
        // var pz = (WINH + (z * WINH))/2;
        // var pr = 4 * (pz/WINH);
        
        // if(pr < 0) pr = 1;
        // if(pr > 4) pr = 4;

        sy = -sy;
        
        var px = (WINW + (sx * WINW))/2;
        var py = (WINH + (sy * WINH))/2;
        var pz = (WINH + (sz * WINH))/2;
        var pr = 4 * (pz/WINH);
        
        if(pr < 0) pr = 1;
        if(pr > 4) pr = 4;
        
        // var voxelID = userData.particleIndex[2*i];
        // var globalID = userData.particleIndex[2*i+1];
        
        // if (i === 5) {
        // console.error("( x,  y,  z,  w)        -- " + "(" + x + "," + y + "," + z + "," + w + ")");
            // console.error("(voxelID, globalID)     -- " + "(" + voxelID + "," + globalID + ")");
        // console.error("(sx, sy, sz, sw)        -- " + "(" + sx  + "," + sy  + "," + sz  + "," + sw  + ")");
            // console.error("(svx, svy, svz, svw)    -- " + "(" + svx + "," + svy + "," + svz + "," + svw + ")");

        // }
        // console.error("(voxel, global) -- " + "(" + voxelID + "," + globalID + ")");
        // console.error("(voxel, global)           -- " + "(" + sw + ", " + i + ")");
        // ctx.fillStyle = 'rgba('+ voxelID + ',' + globalID + ', 1, 1)';
        // ctx.fillStyle = 'rgba('+ voxelID + ',' + globalID + ', 0, 1)';
        ctx.fillStyle = 'rgba('+ sw + ',' + i + ', 0, 1)';

        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill(); 

        // ctx.fillRect(px, py, 1, 1);
        ctx.fillRect( px, py, 1, 1);
    }
}