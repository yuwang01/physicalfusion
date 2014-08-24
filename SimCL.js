// local OpenCL info
var context;                                // OpenCL context
var queue;                                  // OpenCL command queue

var program_hashParticles;
var program_sort;
var program_sortPostPass;
var program_indexx;
var program_indexPostPass;
var program_findNeighbors;
var program_applyBodyForce;
var program_advance;
var program_pressure;
var program_calcRelaxPos;
var program_moveToRelaxPos;
var program_resolveCollisions;

var kernel_hashParticles;
var kernel_sort;
var kernel_sortPostPass;
var kernel_indexx;
var kernel_indexPostPass;
var kernel_findNeighbors;
var kernel_applyBodyForce;
var kernel_advance;
var kernel_pressure;
var kernel_calcRelaxPos;
var kernel_moveToRelaxPos;
var kernel_resolveCollisions;

var sortOrder = null;
var numStages = null;

// SPH buffers
var SortedPositionBuffer;
var prevPositionBuffer;
var PositionBuffer;
var RelaxedPosBuffer;
var SortedPrevPosBuffer;

var VelosityBuffer;
var SortedVelosityBuffer;
var particleIndex;

var gridCellIndexBuffer;

var neighborMapBuffer;

var densityBuffer;
var nearDensityBuffer;

var pressureBuffer;
var nearPressureBuffer;

var bufferSize = null;
var SPHPosbufferSize = null;

var globalWorkSize = new Int32Array(1);
var globalWorkSize_sort = new Int32Array(1);
var globalWorkSize_index = new Int32Array(1);

var localWorkSize = new Int32Array(1);
var workGroupSize = null;
var bodyCountPerGroup;

function getKernel(id) {
  var kernelScript = document.getElementById(id);
  if (kernelScript === null || kernelScript.type !== "x-kernel")
    return null;

  return kernelScript.firstChild.textContent;
}

function InitCL() {
    var cl = null;

    // Just disable CL-GL interop when CPU is being used
    if (!userData.gpu) {
        userData.isGLCLshared = false;
    } else {
        userData.isGLCLshared = true;
    }

    try {
        if (typeof(webcl) === "undefined") 
        {
            console.error("WebCL is yet to be defined");
            return null;
        }

        cl = webcl;        
        if (cl === null) 
        {
            console.error("No webcl object available");
            return null;
        }
        
        var platforms = cl.getPlatforms();
        if (platforms.length === 0) 
        {
            console.error("No platforms available");
            return null;
        }
        
        var platform = platforms[0];
        
        try {
        var devices = platform.getDevices(userData.gpu ? cl.DEVICE_TYPE_GPU : cl.DEVICE_TYPE_CPU);
        if (devices.length === 0) 
        {
            console.error("No devices available");
            return null;
        }
        
        var device = devices[1]; // NVIDIA Geforce 650M

        } catch (e) {
            console.log("Failed to get device: " + e.message);
        } 

        if(userData.isGLCLshared)
        {
            userData.isGLCLshared = cl.enableExtension("KHR_gl_sharing");
        }

        try {
            if(userData.isGLCLshared)
                context = cl.createContext(userData.gl, devices);
            else
                context = cl.createContext(devices);
        
            if(context === null) 
            {
                console.error("createContext fails");

                return null;
            }
        } catch (e) {
            console.log("context creation failed: " + e.message);
            return null;
        }
        
        //////////////////////////////////////
        // SPH kernel: __kernel_hashParticles

        try {
            var kernelSource_applyBodyForce = getKernel("sph_kernel_applyBodyForce");
        
            if (kernelSource_applyBodyForce === null)
            {
                console.log("No kernel named: " + "sph_kernel_applyBodyForce");
                return null;
            }

            var kernelSource_advance = getKernel("sph_kernel_advance");
        
            if (kernelSource_advance === null)
            {
                console.log("No kernel named: " + "sph_kernel_advance");
                return null;
            }

            var kernelSource_hashParticles = getKernel("sph_kernel_hashparticles");

            if (kernelSource_hashParticles === null)
            {
                console.log("No kernel named: " + "sph_kernel_hashparticles");
                return null;
            }

            var kernelSource_sort = getKernel("sph_kernel_sort");

            if (kernelSource_sort === null)
            {
                console.log("No kernel named: " + "sph_kernel_sort");
                return null;
            }

            sortOrder = 1;
            var temp;
            for (temp = kParticleCount; temp > 1; temp >>= 1)
                ++numStages;

            var kernelSource_sortPostPass = getKernel("sph_kernel_sortPostPass");

            if (kernelSource_sortPostPass === null)
            {
                console.log("No kernel named: " + "sph_kernel_sortPostPass");
                return null;
            }

            var kernelSource_indexx = getKernel("sph_kernel_indexx");
            if (kernelSource_indexx === null)
            {
                console.log("No kernel named: " + "sph_kernel_indexx");
                return  null;
            }

            var kernelSource_indexPostPass = getKernel("sph_kernel_indexPostPass");
            if (kernelSource_indexPostPass === null)
            {
                console.log("No kernel named: " + "sph_kernel_indexPostPass");
                return null;
            }

            var kernelSource_findNeighbors = getKernel("sph_kernel_findNeighbors");
            if (kernelSource_findNeighbors === null)
            {
                console.log("No kernel named: " + "sph_kernel_findNeighbors");
                return null;
            }

            var kernelSource_pressure = getKernel("sph_kernel_pressure");
            if (kernelSource_pressure === null)
            {
                console.log("No kernel named: " + "sph_kernel_pressure");
                return null;
            }

            var kernelSource_calcRelaxPos = getKernel("sph_kernel_calcRelaxPos");
            if (kernelSource_calcRelaxPos === null)
            {
                console.log("No kernel named: " + "sph_kernel_calcRelaxPos");
                return null;
            }

            var kernelSource_moveToRelaxPos = getKernel("sph_kernel_moveToRelaxPos");
            if (kernelSource_moveToRelaxPos === null)
            {
                console.log("No kernel named: " + "sph_kernel_moveToRelaxPos");
                return null;
            }

            var kernelSource_resolveCollisions = getKernel("sph_kernel_resolveCollisions");
            if (kernelSource_resolveCollisions === null)
            {
                console.log("No kernel named: " + "sph_kernel_resolveCollisions");
                return null;
            }

            queue = context.createCommandQueue(device, cl.QUEUE_PROFILING_ENABLE);

            program_applyBodyForce = context.createProgram(kernelSource_applyBodyForce);
            program_advance = context.createProgram(kernelSource_advance);
            program_hashParticles = context.createProgram(kernelSource_hashParticles);
            program_sort = context.createProgram(kernelSource_sort);
            program_sortPostPass = context.createProgram(kernelSource_sortPostPass);
            program_indexx = context.createProgram(kernelSource_indexx);
            program_indexPostPass = context.createProgram(kernelSource_indexPostPass);
            program_findNeighbors = context.createProgram(kernelSource_findNeighbors);
            program_pressure = context.createProgram(kernelSource_pressure);
            program_calcRelaxPos = context.createProgram(kernelSource_calcRelaxPos);
            program_moveToRelaxPos = context.createProgram(kernelSource_moveToRelaxPos);
            program_resolveCollisions = context.createProgram(kernelSource_resolveCollisions);

            program_applyBodyForce.build([device]);
            program_advance.build([device]);
            program_hashParticles.build([device]);
            program_sort.build([device]);
            program_sortPostPass.build([device]);
            program_indexx.build([device]);
            program_indexPostPass.build([device]);
            program_findNeighbors.build([device]);
            program_pressure.build([device]);
            program_calcRelaxPos.build([device]);
            program_moveToRelaxPos.build([device]);
            program_resolveCollisions.build([device]);

            kernel_applyBodyForce = program_applyBodyForce.createKernel("sph_kernel_applyBodyForce");
            kernel_advance = program_advance.createKernel("sph_kernel_advance");
            kernel_hashParticles = program_hashParticles.createKernel("sph_kernel_hashparticles");
            kernel_sort = program_sort.createKernel("sph_kernel_sort");
            kernel_sortPostPass = program_sortPostPass.createKernel("sph_kernel_sortPostPass");
            kernel_indexx = program_indexx.createKernel("sph_kernel_indexx");
            kernel_indexPostPass = program_indexPostPass.createKernel("sph_kernel_indexPostPass");
            kernel_findNeighbors = program_findNeighbors.createKernel("sph_kernel_findNeighbors");
            kernel_pressure = program_pressure.createKernel("sph_kernel_pressure");
            kernel_calcRelaxPos = program_calcRelaxPos.createKernel("sph_kernel_calcRelaxPos");
            kernel_moveToRelaxPos = program_moveToRelaxPos.createKernel("sph_kernel_moveToRelaxPos");
            kernel_resolveCollisions = program_resolveCollisions.createKernel("sph_kernel_resolveCollisions");

        } catch (e) {
            console.log("Failed to get kernel: " + e.message);
            return null;
        }
        
        //////////////////////////////////////
        // SPH buffer size of position buffer and particle index buffer
        SPHPosbufferSize = kParticleCount * POSITION_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT;
        SPHIdxbufferSize = kParticleCount * PARTICLEIndex_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT;
        SPHGIdxbufferSize = voxel * GRIDCELLIndex_ATTRIB_SIZE * Int32Array.BYTES_PER_ELEMENT;
        SPHNeighborbufferSize = kParticleCount * NEIGHBOR_MAP_ATTRIB_SIZE * Int32Array.BYTES_PER_ELEMENT;
        SPHDensitybufferSize = kParticleCount * DENSITY_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT;
        SPHPressurebufferSize = kParticleCount * PRESSURE_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT;
        SPHAccelerationbufferSize = kParticleCount * ACCELERATION_ATTRIB_SIZE * Float32Array.BYTES_PER_ELEMENT;

        if (userData.isGLCLshared) 
        {
            //////////////////////////////////////
            // SPH Create GL buffers from GL VBOs
            // (Initial load of position is via gl.bufferData)

            PositionBuffer = context.createFromGLBuffer(cl.MEM_READ_WRITE, userData.positionVBO);
            if (PositionBuffer === null) 
            {
                console.log("Failed to allocated device memory");
                return null;
            }
        }

        try {
            VelosityBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHPosbufferSize, userData.velocity);
            if (VelosityBuffer === null) {
                console.log("Failed to allocate device memory: VelosityBuffer");
                return null;
            }

            SortedVelosityBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHPosbufferSize, userData.sortedVelocity);
            if (SortedVelosityBuffer === null) {
                console.log("Failed to allocate device memory: SortedVelosityBuffer");
                return null;
            }

            gridCellIndexBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHGIdxbufferSize, userData.gridCellIndex);
            if (gridCellIndexBuffer === null) {
                console.log("Failed to allocate device memroy: gridCellIndexBuffer");
                return null;
            }

            gridCellIndexFixedUpBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHGIdxbufferSize, userData.gridCellIndexFixedUp);
            if (gridCellIndexFixedUpBuffer === null) {
                console.log("Failed to allocate device memory: gridCellIndexFixedUpBuffer");
                return null;
            }

            particleIndex = context.createBuffer(cl.MEM_READ_WRITE, SPHIdxbufferSize, userData.particleIndex);
            if (particleIndex === null) {
                console.log("Failed to allocate device memory: particleIndex");
                return null;
            }

            prevPositionBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHPosbufferSize, userData.prevPosition);
            if (prevPositionBuffer === null) {
                console.log("Failed to allocate device memory: prevPosition");
                return null;
            }

            SortedPositionBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHPosbufferSize, userData.sortedPosition);
            if (SortedPositionBuffer === null) {
                console.log("Failed to allocate device memory: sortedPosition");
                return null;
            }

            RelaxedPosBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHPosbufferSize, userData.relaxedPos);
            if (RelaxedPosBuffer === null) {
                console.log("Failed to allocate device memory: RelaxedPosBuffer");
                return null;
            }

            SortedPrevPosBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHPosbufferSize, userData.sortedPrevPos);
            if (SortedPrevPosBuffer === null) {
                console.log("Failed to allocate device memory: SortedPrevPosBuffer");
                return null;
            }

            neighborMapBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHNeighborbufferSize, userData.neighborMap);
            if (neighborMapBuffer === null) {
                console.log("Failed to allocate device memory: neighborMapBuffer");
                return null;
            }

            densityBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHDensitybufferSize, userData.density);
            if (densityBuffer === null) {
                console.log("Failed to allocate device memory: densityBuffer");
                return null;
            }

            nearDensityBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHDensitybufferSize, userData.nearDensity);
            if (nearDensityBuffer === null) {
                console.log("Failed to allocate device memory: nearDensityBuffer");
                return null;
            }

            pressureBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHPressurebufferSize, userData.pressure);
            if (pressureBuffer === null) {
                console.log("Failed to allocate device memory: pressureBuffer");
                return null;
            }

            nearPressureBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHPressurebufferSize, userData.nearPressure);
            if (nearPressureBuffer === null) {
                console.log("Failed to allocate device memory: nearPressureBuffer");
                return null;
            }
            
        } catch (e) {
            console.log(e.message);
            return null;
        }

        //////////////////////////////////////
        // SPH Initial load of position and particleIdx data
        if (userData.isGLCLshared) 
        {            
            queue.enqueueAcquireGLObjects([PositionBuffer]);        
        }
        //////////////////////////////////////

        try 
        {
            queue.enqueueWriteBuffer(PositionBuffer, true, 0, SPHPosbufferSize, userData.position);
        
        } catch (e)
        {
            console.error("SPH demo failed, Message: " + e.message);
            return null;
        }

        if (userData.isGLCLshared) 
        {
            queue.enqueueReleaseGLObjects([PositionBuffer]);
        }

        queue.finish();

        if (userData.gpu) 
        {
            globalWorkSize[0] = kParticleCount;
            globalWorkSize_sort[0] = globalWorkSize[0] / 2;
            globalWorkSize_index[0] = voxel;
        }
        
        localWorkSize[0] = userData.gpu ? Math.min(workGroupSize, kParticleCount) : 1;
        bodyCountPerGroup = kParticleCount / globalWorkSize[0];

        var nWorkGroups = Math.floor(kParticleCount/workGroupSize);
        if(kParticleCount % workGroupSize != 0)
            nWorkGroups += 1;
        
        voxelInfo();

        console.log("workGroupSize:       " + workGroupSize);
        console.log("nWorkGroups:         " + nWorkGroups);
        console.log("localWorkSize[0]:    " + localWorkSize[0]);
        console.log("globalWorkSize[0]:   " + globalWorkSize[0]);
        console.log("globalWorkSize_sort[0]: " + globalWorkSize_sort[0]);
        console.log("globalWorkSize_index[0]:" + globalWorkSize_index[0]);
        console.log("bodyCountPerGroup: " + bodyCountPerGroup);
        console.log("kernel_applyBodyForce:" + kernel_applyBodyForce.getInfo(cl.KERNEL_FUNCTION_NAME));
        console.log("kernel_advance: " + kernel_advance.getInfo(cl.KERNEL_FUNCTION_NAME));
        console.log("kernel_hashParticles: " + kernel_hashParticles.getInfo(cl.KERNEL_FUNCTION_NAME));
        console.log("kernel_sort: " + kernel_sort.getInfo(cl.KERNEL_FUNCTION_NAME));
        console.log("kernel_sortPostPass: " + kernel_sortPostPass.getInfo(cl.KERNEL_FUNCTION_NAME));
        console.log("kernel_indexx: " + kernel_indexx.getInfo(cl.KERNEL_FUNCTION_NAME));
        console.log("kernel_indexPostPass: " + kernel_indexPostPass.getInfo(cl.KERNEL_FUNCTION_NAME));
        console.log("kernel_findNeighbors: " + kernel_findNeighbors.getInfo(cl.KERNEL_FUNCTION_NAME));
        console.log("kernel_pressure: " + kernel_pressure.getInfo(cl.KERNEL_FUNCTION_NAME));
        console.log("kernel_calcRelaxPos: " + kernel_calcRelaxPos.getInfo(cl.KERNEL_FUNCTION_NAME));
        console.log("kernel_moveToRelaxPos: " + kernel_moveToRelaxPos.getInfo(cl.KERNEL_FUNCTION_NAME));
        console.log("kernel_resolveCollisions: " + kernel_resolveCollisions.getInfo(cl.KERNEL_FUNCTION_NAME));

    } catch (e)
    {
        console.error("SPH demo failed, Message: " + e.message);
    }
    return cl;
}

function SimulateCL(cl) {
    if (cl === null) {
        return;
    }

    try {
        if (userData.isGLCLshared) {
            try {
                queue.enqueueAcquireGLObjects([PositionBuffer]);
            } catch (e) {
                console.error("SPH demo failed, Message: " + e.message);
            }
        }
        
        try{
            
            kernel_applyBodyForce.setArg(0, new Int32Array([kParticleCount]));
            kernel_applyBodyForce.setArg(1, VelosityBuffer);
            kernel_applyBodyForce.setArg(2, new Float32Array([kDt]));
            
            // queue.enqueueNDRangeKernel(kernel_applyBodyForce, globalWorkSize.length, [], globalWorkSize, []);
            // queue.flush();
            
        } catch (e) {
            console.log("SPH kernel failed, Message: " + e.message);
            return  null;
        }
        
        try {
            kernel_advance.setArg(0, new Int32Array([kParticleCount]));
            kernel_advance.setArg(1, new Float32Array([kDt]));
            kernel_advance.setArg(2, PositionBuffer)
            kernel_advance.setArg(3, prevPositionBuffer);
            kernel_advance.setArg(4, VelosityBuffer);

            queue.enqueueNDRangeKernel(kernel_advance, globalWorkSize.length, [], globalWorkSize, []);
            queue.flush();
            
        } catch (e) {
            console.log("SPH kernel failed, Message: " + e.message);
            return null;
        }
        
        try {
            
            kernel_hashParticles.setArg(0, new Float32Array([kViewWidth]));
            kernel_hashParticles.setArg(1, new Float32Array([kViewHeight]));
            kernel_hashParticles.setArg(2, new Float32Array([kViewDepth]));
            kernel_hashParticles.setArg(3, new Int32Array([Nx]));
            kernel_hashParticles.setArg(4, new Int32Array([Ny]));
            kernel_hashParticles.setArg(5, new Int32Array([Nz]));
            kernel_hashParticles.setArg(6, new Float32Array([kCellSize]));
            kernel_hashParticles.setArg(7, PositionBuffer);
            kernel_hashParticles.setArg(8, particleIndex);
            kernel_hashParticles.setArg(9, VelosityBuffer);

            queue.enqueueNDRangeKernel(kernel_hashParticles, globalWorkSize.length, [], globalWorkSize, []);
            queue.flush();

        } catch (e) {
            console.log("SPH kernel failed, Message: " + e.message);
            return null;
        }

        try {
            kernel_sort.setArg(0, particleIndex);
            kernel_sort.setArg(3, new Int32Array([sortOrder]));
        } catch (e) {
            console.log("SPH kernel_sort failed, Message: " + e.message);
        }

        var stage;
        var passOfStage;

        try {
            for (stage = 0; stage < numStages; stage++) {
                kernel_sort.setArg(1, new Int32Array([stage]));

                for (passOfStage = 0; passOfStage < stage + 1; passOfStage++) {
                    kernel_sort.setArg(2, new Int32Array([passOfStage]));

                    queue.enqueueNDRangeKernel(kernel_sort, globalWorkSize_sort.length, [], globalWorkSize_sort, []);
                    queue.flush();
                }
            }        
        } catch (e) {
            console.log("SPH demo failed, Message: " + e.message);
        }

        try {
            kernel_sortPostPass.setArg(0, PositionBuffer);
            kernel_sortPostPass.setArg(1, VelosityBuffer);
            kernel_sortPostPass.setArg(2, particleIndex);
            kernel_sortPostPass.setArg(3, SortedPositionBuffer);
            kernel_sortPostPass.setArg(4, SortedVelosityBuffer);
            kernel_sortPostPass.setArg(5, prevPositionBuffer);
            kernel_sortPostPass.setArg(6, SortedPrevPosBuffer);
            
            queue.enqueueNDRangeKernel(kernel_sortPostPass, globalWorkSize.length, [], globalWorkSize, []);
            queue.flush();
        } catch (e) {
            console.log("SPH kernel_sortPostPass failed, Message: " + e.message);
        }

        try {
            kernel_indexx.setArg(0, new Int32Array([kParticleCount]));
            kernel_indexx.setArg(1, PositionBuffer);
            kernel_indexx.setArg(2, gridCellIndexBuffer);

            queue.enqueueNDRangeKernel(kernel_indexx, globalWorkSize_index.length, [], globalWorkSize_index, []);
            queue.flush();

        } catch (e) {
            console.log("SPH kernel_indexx failed, Message: " + e.message);
        }

        try {
            kernel_indexPostPass.setArg(0, new Int32Array([kGridCellCount]));
            kernel_indexPostPass.setArg(1, gridCellIndexBuffer);
            kernel_indexPostPass.setArg(2, gridCellIndexFixedUpBuffer);

            queue.enqueueNDRangeKernel(kernel_indexPostPass, globalWorkSize_index.length, [], globalWorkSize_index, []);
            queue.flush();
        } catch (e) {
            console.log("SPH kernel_indexPostPass failed, Message: " + e.message);
        }

        try {
            kernel_findNeighbors.setArg(0, new Int32Array([kParticleCount]));
            kernel_findNeighbors.setArg(1, new Float32Array([kViewWidth]));
            kernel_findNeighbors.setArg(2, new Float32Array([kViewHeight]));
            kernel_findNeighbors.setArg(3, new Float32Array([kViewDepth]));
            kernel_findNeighbors.setArg(4, new Int32Array([Nx]));
            kernel_findNeighbors.setArg(5, new Int32Array([Ny]));
            kernel_findNeighbors.setArg(6, new Int32Array([Nz]));
            kernel_findNeighbors.setArg(7, new Float32Array([kCellSize]));
            kernel_findNeighbors.setArg(8, PositionBuffer);
            kernel_findNeighbors.setArg(9, gridCellIndexFixedUpBuffer);
            kernel_findNeighbors.setArg(10, neighborMapBuffer);
            kernel_findNeighbors.setArg(11, new Int32Array([kMaxNeighbourCount]));
            kernel_findNeighbors.setArg(12, new Float32Array([kEpsilon]));
            
            queue.enqueueNDRangeKernel(kernel_findNeighbors, globalWorkSize.length, [], globalWorkSize, []);
            queue.flush();
        } catch (e) {
            console.log("SPH kernel_findNeighbors failed, Message: " + e.message);
            return null;
        }

        try {
            kernel_pressure.setArg(0, new Float32Array([mass]));
            kernel_pressure.setArg(1, new Float32Array([kCellSize]));
            kernel_pressure.setArg(2, new Float32Array([kNorm]));
            kernel_pressure.setArg(3, new Float32Array([kNearNorm]));
            kernel_pressure.setArg(4, new Int32Array([kMaxNeighbourCount]));
            kernel_pressure.setArg(5, new Float32Array([kStiffness]));
            kernel_pressure.setArg(6, new Float32Array([kNearStiffness]));
            kernel_pressure.setArg(7, new Float32Array([kRestDensity]));
            kernel_pressure.setArg(8, PositionBuffer);
            kernel_pressure.setArg(9, neighborMapBuffer);
            kernel_pressure.setArg(10, densityBuffer);
            kernel_pressure.setArg(11, nearDensityBuffer);
            kernel_pressure.setArg(12, pressureBuffer);
            kernel_pressure.setArg(13, nearPressureBuffer); 

            queue.enqueueNDRangeKernel(kernel_pressure, globalWorkSize.length, [], globalWorkSize, []);
            queue.flush();

        } catch (e) {
            console.log("SPH kernel_pressure failed, Message: " + e.message);
            return null;
        }

        try {
            kernel_calcRelaxPos.setArg(0, new Float32Array([mass]));
            kernel_calcRelaxPos.setArg(1, new Float32Array([kCellSize]));
            kernel_calcRelaxPos.setArg(2, new Float32Array([kDt]));
            kernel_calcRelaxPos.setArg(3, new Float32Array([kDt2]));
            kernel_calcRelaxPos.setArg(4, new Float32Array([kNearNorm]));
            kernel_calcRelaxPos.setArg(5, new Float32Array([kNorm]));
            kernel_calcRelaxPos.setArg(6, new Float32Array([kSurfaceTension]));
            kernel_calcRelaxPos.setArg(7, new Float32Array([kLinearViscocity]));
            kernel_calcRelaxPos.setArg(8, new Float32Array([kQuadraticViscocity]));
            kernel_calcRelaxPos.setArg(9, new Int32Array([kMaxNeighbourCount]));
            kernel_calcRelaxPos.setArg(10, PositionBuffer);
            kernel_calcRelaxPos.setArg(11, VelosityBuffer);
            kernel_calcRelaxPos.setArg(12, neighborMapBuffer);
            kernel_calcRelaxPos.setArg(13, densityBuffer);
            kernel_calcRelaxPos.setArg(14, nearDensityBuffer);
            kernel_calcRelaxPos.setArg(15, pressureBuffer);
            kernel_calcRelaxPos.setArg(16, nearPressureBuffer);
            kernel_calcRelaxPos.setArg(17, RelaxedPosBuffer);

            queue.enqueueNDRangeKernel(kernel_calcRelaxPos, globalWorkSize.length, [], globalWorkSize, []);
            queue.flush();

        } catch (e) {
            console.log("SPH kernel_calcRelaxPos failed, Message: " + e.message);
            return null;
        }

        try {
            kernel_moveToRelaxPos.setArg(0, new Float32Array([kDt]));
            kernel_moveToRelaxPos.setArg(1, PositionBuffer);
            kernel_moveToRelaxPos.setArg(2, SortedPrevPosBuffer);
            kernel_moveToRelaxPos.setArg(3, VelosityBuffer);
            kernel_moveToRelaxPos.setArg(4, RelaxedPosBuffer);

            queue.enqueueNDRangeKernel(kernel_moveToRelaxPos, globalWorkSize.length, [], globalWorkSize, []);
            queue.flush();

        } catch (e) {
            console.log("SPH kernel_moveToRelaxPos failed, Message: " + e.message);
            return null;
        }

        try {
            kernel_resolveCollisions.setArg(0, new Float32Array([kDt]));
            kernel_resolveCollisions.setArg(1, new Float32Array([kParticleRadius]));
            kernel_resolveCollisions.setArg(2, new Float32Array([kViewWidth]));
            kernel_resolveCollisions.setArg(3, new Float32Array([kViewHeight]));
            kernel_resolveCollisions.setArg(4, new Float32Array([kViewDepth]));
            kernel_resolveCollisions.setArg(5, PositionBuffer);
            kernel_resolveCollisions.setArg(6, VelosityBuffer);

            queue.enqueueNDRangeKernel(kernel_resolveCollisions, globalWorkSize.length, [], globalWorkSize, []);
            queue.flush();
            
        } catch (e) {
            console.log("SPH kernel_resolveCollisions failed, Message: " + e.message);
            return null;
        }

        try{
            queue.finish();
        } catch (e) {
            console.error("SPH Failed, Message: "+ e.message);
        }

        try {
            if (userData.isGLCLshared) {
                queue.enqueueReleaseGLObjects([PositionBuffer]);
            }
        } catch (e) {
            console.log("SPH demo failed, Message: " + e.message);
        }

        try {
            if (!userData.isGLCLshared || userData.drawMode === JS_DRAW_MODE) {
                queue.enqueueReadBuffer(PositionBuffer, true, 0, SPHPosbufferSize, userData.position);
            }
        } catch (e) {
            console.log("SPH demo failed, Message: " + e.message);
        }

        // queue.enqueueReadBuffer(neighborMapBuffer, true, 0, SPHNeighborbufferSize, userData.neighborMap);
        // queue.enqueueReadBuffer(SortedPositionBuffer, true, 0, SPHPosbufferSize, userData.sortedPosition);
        // queue.enqueueReadBuffer(particleIndex, true, 0, SPHIdxbufferSize, userData.particleIndex);

    } catch (e) {
        console.log("SPH demo failed, Message: " + e.message);
    }
}

function GetWorkGroupSize() {
    if(workGroupSize !== null)
        return workGroupSize;
    try {
        if (typeof(webcl) === "undefined") {
            console.error("WebCL is yet to be defined");
            return null;
        }
        cl = webcl;
        if (cl === null) {
            console.error("No webcl object available");
            return null;
        }

        var platforms = cl.getPlatforms();
        if (platforms.length === 0) {
            console.error("No platforms available");
            return null;
        }

        var platform = platforms[0];

        // console.log("**** Platform **** " + String(platform.getInfo(cl.PLATFORM_VENDOR)));

        var devices = platform.getDevices(userData.gpu ? cl.DEVICE_TYPE_GPU : cl.DEVICE_TYPE_CPU);
        if (devices.length === 0) {
            console.error("No devices available");
            return null;
        }
        var device = devices[1];

        workGroupSize = device.getInfo(cl.DEVICE_MAX_WORK_GROUP_SIZE);
        globalWorkSize[0] = device.getInfo(cl.DEVICE_MAX_COMPUTE_UNITS);
        // temp = device.getInfo(webcl.DEVICE_NAME);
    } catch (e) {
        console.error("kParticleCount Demo Failed, Message: "+ e.message);
        workGroupSize = null;
    }
    console.log("**** Work Group Size **** " + workGroupSize);
    console.log("**** MAX compute units **** " + globalWorkSize[0]);

    // console.log("**** Using device **** " + String(temp));

    return workGroupSize;
}

function reset() {
    
    //////////////////////////////////
    // set position and velocity to the initial values after the new initialization
    try {
        queue.enqueueWriteBuffer(PositionBuffer, true, 0, SPHPosbufferSize, userData.position);
    } catch (e)
    {
        console.error("SPH demo failed, Message: " + e.message);
        return null;
    }
    
    if (userData.isGLCLshared) 
    {
        queue.enqueueReleaseGLObjects([PositionBuffer]);
    }

    queue.finish();

    try {

        VelosityBuffer = context.createBuffer(cl.MEM_READ_WRITE, SPHPosbufferSize, userData.velocity);
        if (VelosityBuffer === null) {
            console.log("Failed to allocate device memory: VelosityBuffer");
            return null;
        }
    } catch (e) 
    {
        console.log(e.message);
        return null;
    }
    
}