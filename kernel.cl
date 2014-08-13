__kernel void sph_kernel_hashParticles(
        int kParticleCount,
        int nx,
        int ny,
        int nz,
        float h,
        __global float4* pos,
        __global uint2* partIdx,
        __global float* nxtpos)
    {
        unsigned int gid = get_global_id(0);

        float3 tempPos;
        // pos(x, y, z) in [-1, 1] mapped to [0, nx]
        // newPos = (val - src0) / (src1 - src0) * (dst1 - dst0) + dst0
        float _2h = 2 * h;
        float rangeRatioX = (nx * _2h - 0) / (1 - (-1));
        float rangeRatioY = (ny * _2h - 0) / (1 - (-1));
        float rangeRatioZ = (nz * _2h - 0) / (1 - (-1));
        // tempPos.x = (pos[4*gid+0] - (-1)) * rangeRatioX;
        // tempPos.y = (pos[4*gid+1] - (-1)) * rangeRatioY;
        // tempPos.z = (pos[4*gid+2] - (-1)) * rangeRatioZ;
        tempPos.x = (pos[gid].x - (-1)) * rangeRatioX;
        tempPos.y = (pos[gid].y - (-1)) * rangeRatioY;
        tempPos.z = (pos[gid].z - (-1)) * rangeRatioZ;

        // myPos(x, y, z) in [0, nx*2*h] mapped to 3d voxel coords [v3d.x, v3d.y, v3d.z]
        // each between the range [0, n] (assuming cubic space)
        float3 voxel3d;
        voxel3d.x = tempPos.x / _2h;
        voxel3d.y = tempPos.y / _2h;
        voxel3d.z = tempPos.z / _2h;        

        float voxelID = voxel3d.x + voxel3d.y * nx + voxel3d.z * nx * ny;

        // pos[4*gid+3] = voxelID;
        pos[gid].w = voxelID;
        
        partIdx[gid].x = floor(voxelID);
        partIdx[gid].y = gid;

        // nxtpos[4*gid+0] = pos[4*gid+0];
        // nxtpos[4*gid+1] = pos[4*gid+1];
        // nxtpos[4*gid+2] = pos[4*gid+2];
        // nxtpos[4*gid+3] = pos[4*gid+3];
        nxtpos[4*gid+0] = pos[gid].x;
        nxtpos[4*gid+1] = pos[gid].y;
        nxtpos[4*gid+2] = pos[gid].z;
        nxtpos[4*gid+3] = pos[gid].w;

    }

__kernel void sph_kernel_sort (
        __global uint2* partIdx,
        int stage,
        int passOfStage,
        int direction) 
    {
        uint sortIncreasing = direction;
        uint threadId = get_global_id(0);
    
        uint pairDistance = 1 << (stage - passOfStage);
        uint blockWidth   = 2 * pairDistance;

        uint leftId = (threadId % pairDistance) 
                   + (threadId / pairDistance) * blockWidth;

        uint rightId = leftId + pairDistance;
    
        uint2 leftElement = partIdx[leftId];
        uint2 rightElement = partIdx[rightId];
    
        uint sameDirectionBlockWidth = 1 << stage;
    
        if((threadId/sameDirectionBlockWidth) % 2 == 1)
            sortIncreasing = 1 - sortIncreasing;

        uint2 greater;
        uint2 lesser;
        if(leftElement.x > rightElement.x)
        {
            greater = leftElement;
            lesser  = rightElement;
        }
        else
        {
            greater = rightElement;
            lesser  = leftElement;
        }
    
        if(sortIncreasing)
        {
            partIdx[leftId]  = lesser;
            partIdx[rightId] = greater;
        }
        else
        {
            partIdx[leftId]  = greater;
            partIdx[rightId] = lesser;
        }
    }    

__kernel void sph_kernel_sortPostPass (
        __global float4* pos,
        __global float4* vel,
        __global uint2* partIdx,
        __global float4* sortedPos,
        __global float4* sortedVel)
    {
        unsigned int gid = get_global_id(0);

        int particleID = partIdx[gid].y;

        float4 tempPos = pos[particleID];
        
        sortedPos[gid].x = tempPos.x;
        sortedPos[gid].y = tempPos.y;
        sortedPos[gid].z = tempPos.z;
        sortedPos[gid].w = tempPos.w;

        float4 tempVel = vel[particleID];

        sortedVel[gid].x = tempVel.x;
        sortedVel[gid].y = tempVel.y;
        sortedVel[gid].z = tempVel.z;
        sortedVel[gid].w = tempVel.w;
    }    

__kernel void sph_kernel_indexx(
        int kParticleCount,
        __global float4* sortedPos,
        __global int* gridCellIdx) 
    {
        unsigned int gid = get_global_id(0);
        gridCellIdx[gid] = -1;

        // binary search into sortedPos and find first particle
        // in voxel gid

        int low = 0;
        int hi = kParticleCount - 1;
        int mid = 0;

        while (low <= hi) {
            mid = (hi + low) / 2;
            if (floor(sortedPos[mid].w) == gid) {
                int front = mid - 1;
                
                while((front >= 0) && (sortedPos[front].w == gid))
                {
                    front--;
                }

                if (mid > front - 1)
                {
                    gridCellIdx[gid] = front + 1;
                }

                break;

            } else if ( sortedPos[mid].w < gid) {
                low = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
    }

__kernel void sph_kernel_indexPostPass(
        int voxel,
        __global int* gridCellIdx,
        __global int* gridCellIdxFixedUp)
    {
        unsigned int gid = get_global_id(0);
        
        if (gridCellIdx[gid] != -1)
        {
            gridCellIdxFixedUp[gid] = gridCellIdx[gid];
        } else {
            int preCell = gid;
        
            while (preCell >= 0) 
            {
                int pid = gridCellIdx[preCell];
                if (pid != -1)
                {
                    gridCellIdxFixedUp[gid] = pid;
                    break;
                }
                else {
                    preCell--;
                }
            }
        }
    }


// // random bits from 2 rounds of TEA with key=0
// uvec2 TEA2(uvec2 v) {
//     v.x += (v.y<<4u)^(v.y+0x9E3779B9u)^(v.y>>5u);
//     v.y += (v.x<<4u)^(v.x+0x9E3779B9u)^(v.x>>5u);
//     v.x += (v.y<<4u)^(v.y+0x3C6EF372u)^(v.y>>5u);
//     v.y += (v.x<<4u)^(v.x+0x3C6EF372u)^(v.x>>5u);
//     return v;
// }
    
    // random bits from 2 rounds of TEA with key=0
    uint2 TEA2(uint2 v) {
        v.x += (v.y<<4u)^(v.y+0x9E3779B9u)^(v.y>>5u);
        v.y += (v.x<<4u)^(v.x+0x9E3779B9u)^(v.x>>5u);
        v.x += (v.y<<4u)^(v.y+0x3C6EF372u)^(v.y>>5u);
        v.y += (v.x<<4u)^(v.x+0x3C6EF372u)^(v.x>>5u);
        return v;
    }    

    /// random bits from 8 rounds of TEA with key=0
    uint2 TEA8(uint2 v) {
        v.x += (v.y<<4u)^(v.y+0x9E3779B9u)^(v.y>>5u); // 5u is a literal decimal unsigned integer
        v.y += (v.x<<4u)^(v.x+0x9E3779B9u)^(v.x>>5u);
        v.x += (v.y<<4u)^(v.y+0x3C6EF372u)^(v.y>>5u);
        v.y += (v.x<<4u)^(v.x+0x3C6EF372u)^(v.x>>5u);
        v.x += (v.y<<4u)^(v.y+0xDAA66D2Bu)^(v.y>>5u);
        v.y += (v.x<<4u)^(v.x+0xDAA66D2Bu)^(v.x>>5u);
        v.x += (v.y<<4u)^(v.y+0x78DDE6E4u)^(v.y>>5u);
        v.y += (v.x<<4u)^(v.x+0x78DDE6E4u)^(v.x>>5u);
        v.x += (v.y<<4u)^(v.y+0x1715609Du)^(v.y>>5u);
        v.y += (v.x<<4u)^(v.x+0x1715609Du)^(v.x>>5u);
        v.x += (v.y<<4u)^(v.y+0xB54CDA56u)^(v.y>>5u);
        v.y += (v.x<<4u)^(v.x+0xB54CDA56u)^(v.x>>5u);
        v.x += (v.y<<4u)^(v.y+0x5384540Fu)^(v.y>>5u);
        v.y += (v.x<<4u)^(v.x+0x5384540Fu)^(v.x>>5u);
        v.x += (v.y<<4u)^(v.y+0xF1BBCDC8u)^(v.y>>5u);
        v.y += (v.x<<4u)^(v.x+0xF1BBCDC8u)^(v.x>>5u);
        
        return v;
    }
    
    // convert random uvec2 to [0,1)x[0,1)
    float2 rand(uint2 v) {
        float2 result;
        result.x = float(v.x & 0xFFFFu)/float(0x10000);
        result.y = float(v.y & 0xFFFFu)/float(0x10000);
        return result;
    }

    // convert value in [src0, src1) to [dst0, dst1)
    float rangeMap(float val, float src0, float src1, float dst0, float dst1)
    {
        return (val - src0) * (dst1 - dst0) / (src1 - src0) + dst0;
    }
    
    // // check if vID has already been searched
    // // searched() returns:
    // //   -1:     if vID is not in the first i entries of array voxel
    // //   non -1: if vID is in the first i entries of array voxel
    // int searched(int vid, int* voxels, int idx) {
    //     int i;
    //     for (i = 0; i < idx; i++)
    //     {
    //         if (vid == voxels[i])
    //             return i;
    //     }

    //     return -1;
    // }

    __kernel void sph_kernel_findNeighbors(
        int kParticleCount,
        int nx,
        int ny,
        int nz,
        float h,
        __global float4* sortedPos,
        __global int* gridCellIdxFixedUp,
        __global int* neighborMap)
    {
        unsigned int gid = get_global_id(0);
        
        float3 myPos = sortedPos[gid].xyz;

        float _2h = 2 * h;
        float rangeRatioX = (nx * _2h - 0) / (1 - (-1));
        float rangeRatioY = (ny * _2h - 0) / (1 - (-1));
        float rangeRatioZ = (nz * _2h - 0) / (1 - (-1));
        
        float4 tempPos;
        tempPos.x = (myPos.x - (-1)) * rangeRatioX + 0;
        tempPos.y = (myPos.y - (-1)) * rangeRatioY + 0;
        tempPos.z = (myPos.z - (-1)) * rangeRatioZ + 0;

        // myPos(x, y, z) in [0, nx*2*h] mapped to 3d voxel coords [v3d.x, v3d.y, v3d.z]
        // each between the range [0, n] (assuming cubic space)
        float3 voxel3d;
        voxel3d.x = tempPos.x / _2h;
        voxel3d.y = tempPos.y / _2h;
        voxel3d.z = tempPos.z / _2h;

        float3 corner;
        // corner.x = round(voxel3d.x - .5);
        // corner.y = round(voxel3d.y - .5);
        // corner.z = round(voxel3d.z - .5);
        
        corner.x = floor(voxel3d.x + .5);
        corner.y = floor(voxel3d.y + .5);
        corner.z = floor(voxel3d.z + .5);

        // int voxelID = floor(voxel3d.x) + floor(voxel3d.y) * nx + floor(voxel3d.z) * nx * ny;

        // compute voxel IDs based on the position of the particles 
        int voxel[8];
        voxel[0] = corner.x + corner.y * nx + corner.z * nx * ny ;
        voxel[1] = ((corner.x < 1) ? 0 : (corner.x-1)) + corner.y * nx + corner.z * nx * ny;
        voxel[2] = corner.x + ((corner.y < 1) ? 0 : (corner.y - 1)) * nx + corner.z * nx * ny;
        voxel[3] = ((corner.x < 1) ? 0 : (corner.x-1)) + ((corner.y < 1) ? 0 : (corner.y - 1)) * nx + corner.z * nx * ny;
        voxel[4] = corner.x + corner.y * nx + ((corner.z < 1) ? 0 : (corner.z - 1)) * nx * ny;
        voxel[5] = ((corner.x < 1) ? 0 : (corner.x-1)) + corner.y * nx + ((corner.z < 1) ? 0 : (corner.z - 1)) * nx * ny;
        voxel[6] = corner.x + ((corner.y < 1) ? 0 : (corner.y - 1)) * nx + ((corner.z < 1) ? 0 : (corner.z - 1)) * nx * ny;
        voxel[7] = ((corner.x < 1) ? 0 : (corner.x-1)) + ((corner.y < 1) ? 0 : (corner.y - 1)) * nx + ((corner.z < 1) ? 0 : (corner.z - 1)) * nx * ny;

        // for debugging use ---------------
        // neighborMap[2*gid].s0 = voxel[0];
        // neighborMap[2*gid].s1 = voxel[1];
        // neighborMap[2*gid].s2 = voxel[2];
        // neighborMap[2*gid].s3 = voxel[3];
        // neighborMap[2*gid].s4 = voxel[4];
        // neighborMap[2*gid].s5 = voxel[5];
        // neighborMap[2*gid].s6 = voxel[6];
        // neighborMap[2*gid].s7 = voxel[7];

        // use hard-coded random_number array for now
        // will be replaced when I find a proper random number generator
        // that writes to random_voxel[] a sequence of randomized [0, 7]
        // int random_voxel[8] = {0, 1, 2, 3, 4, 5, 6, 7}; // will be replaced by random numbers generated between [0, 7] *************
        
        // use work item ID, gid, so seed uvec2 v = (gid, gid+1) etc.
        uint2 rvoxel01 = uint2(gid, gid+1);
        uint2 rvoxel02 = uint2(gid+2, gid+3);
        uint2 rvoxel03 = uint2(gid+4, gid+5);
        uint2 rvoxel04 = uint2(gid+6, gid+7);
        
        rvoxel01 = TEA8(rvoxel01);
        rvoxel02 = TEA8(rvoxel02);
        rvoxel03 = TEA8(rvoxel03);
        rvoxel04 = TEA8(rvoxel04);

        // rvoxel01 = TEA2(rvoxel01);
        // rvoxel02 = TEA2(rvoxel02);
        // rvoxel03 = TEA2(rvoxel03);
        // rvoxel04 = TEA2(rvoxel04);

        // // MARC
        // uint2 X[4];
        // uint2 randState = TEA8((uint2)((int)myPos.x, (int)myPos.y));
        // X[0] = randState % 7;

        // randState = 69069 * randState;
        // X[1] = randState % 7;

        // ...

        // // END MARC

        // uint2 X[4];
        // uint2 randState = TEA8((uint2)((int)myPos.x, (int)myPos.y));
        // X[0] = randState % 7;

        // randState = 48271 * randState;
        // X[1] = randState % 7;

        // randState = 48271 * randState;
        // X[2] = randState % 7;
        
        // randState = 48271 * randState;
        // X[3] = randState % 7;

        // // use TEA on myPos.xy to produce a first seed for LCG sequence
        // uint2 X[4];
        // X[0].x = TEA8((uint2)((int)myPos.x, (int)myPos.y)).x % 7;
        // X[0].y = TEA8((uint2)((int)myPos.x, (int)myPos.y)).y % 7;
        // X[1].x = (3 * X[0].x + 9) % 7;
        // X[1].y = (3 * X[0].y + 10) % 7;
        // X[2].x = (3 * X[1].x + 11) % 7;
        // X[2].y = (3 * X[1].y + 12) % 7;
        // X[3].x = (3 * X[2].x + 13) % 7;
        // X[3].y = (3 * X[2].y + 14) % 7;
        
        // uint2 rvoxel01 = TEA8(X[0]);
        // uint2 rvoxel02 = TEA8(X[1]);
        // uint2 rvoxel03 = TEA8(X[2]);
        // uint2 rvoxel04 = TEA8(X[3]);

        float2 rvoxel01F = rand(rvoxel01);
        float2 rvoxel02F = rand(rvoxel02);
        float2 rvoxel03F = rand(rvoxel03);
        float2 rvoxel04F = rand(rvoxel04);

        // rangeMap(float val, float src0, float src1, float dst0, float dst1);
        rvoxel01F.x = rangeMap(rvoxel01F.x, 0.0, 1.0, 0.0, 8.0);
        rvoxel01F.y = rangeMap(rvoxel01F.y, 0.0, 1.0, 0.0, 8.0);
        rvoxel02F.x = rangeMap(rvoxel02F.x, 0.0, 1.0, 0.0, 8.0);
        rvoxel02F.y = rangeMap(rvoxel02F.y, 0.0, 1.0, 0.0, 8.0);
        rvoxel03F.x = rangeMap(rvoxel03F.x, 0.0, 1.0, 0.0, 8.0);
        rvoxel03F.y = rangeMap(rvoxel03F.y, 0.0, 1.0, 0.0, 8.0);
        rvoxel04F.x = rangeMap(rvoxel04F.x, 0.0, 1.0, 0.0, 8.0);
        rvoxel04F.y = rangeMap(rvoxel04F.y, 0.0, 1.0, 0.0, 8.0);
        
        int random_voxel[8] = {
            (int)rvoxel01F.x, (int)rvoxel01F.y,
            (int)rvoxel02F.x, (int)rvoxel02F.y,
            (int)rvoxel03F.x, (int)rvoxel03F.y,
            (int)rvoxel04F.x, (int)rvoxel04F.y};
        
        // // debugging use 
        // neighborMap[32*gid+0] = random_voxel[0];
        // neighborMap[32*gid+1] = random_voxel[1];
        // neighborMap[32*gid+2] = random_voxel[2];
        // neighborMap[32*gid+3] = random_voxel[3];
        // neighborMap[32*gid+4] = random_voxel[4];
        // neighborMap[32*gid+5] = random_voxel[5];
        // neighborMap[32*gid+6] = random_voxel[6];
        // neighborMap[32*gid+7] = random_voxel[7];

        int count = 0;
        int i;
        int j;

        int neighbors[32];

        // find 32 neighboring particles
        // not handling "not enough neighboring particle" situation
        // for now, assume we can find 32 neighbors for sure
        for (i = 0; i < 8; i++)
        {
                if (count >= 32)
                    break;
                // locate the voxel currently being investigated
                int vID = voxel[random_voxel[i]];

                // // check if vID has already been searched
                // // searched() returns:
                // //   -1:     if vID is not in the first i entries of array voxel
                // //   non -1: if vID is in the first i entries of array voxel
                // if (searched(random_voxel[i], random_voxel, i) != -1)
                // {
                //     continue;
                // }

                // locate the first particle in the voxel
                // pid = gridCellIdxFixedUp[voxelID]
                int pid = gridCellIdxFixedUp[vID];
                
                // in voxel vID get a random number based on the number of particles in that voxel
                // first, get the number of particles in voxel[voxelID], pCount
                int npid = (vID + 1< nx * ny * nz) ? gridCellIdxFixedUp[vID+1] : kParticleCount;
                int pCount = npid - pid;
                
                // if the voxel is empty, skip this iteration
                if (pCount == 0)
                {
                    continue;
                }
                
                // // second, generate random number in [0, pCount], randPart
                // // uint2 rvoxel01 = uint2(gid, gid+1);
                // // rvoxel01 = TEA8(rvoxel01);
                // // float2 rvoxel01F = rand(rvoxel01);
                // // rvoxel01F.x = rangeMap(rvoxel01F.x, 0.0, 1.0, 0.0, 8.0);
                // // rvoxel01F.y = rangeMap(rvoxel01F.y, 0.0, 1.0, 0.0, 8.0);
                uint2 rparticle = uint2(pCount, pCount+1);
                rparticle = TEA8(rparticle);
                float2 rparticleF = rand(rparticle);
                rparticleF.x = rangeMap(rparticleF.x, 0.0, 1.0, 0.0, (float)pCount);
                // // // rparticleF.y = rangeMap(rparticleF.y, 0.0, 1.0, 0.0, (float)pCount);

                int randPart = (int)rparticleF.x; // 0 will be replaced by a random number between [0, pCount] *************
                
                // // locate the particle using randPart
                // int pIdx0 = pid + randPart0;
                // int pIdx1 = pid + randPart1;
                // float3 randPartPos0 = sortedPos[pIdx0].xyz;
                // float3 randPartPos1 = sortedPos[pIdx1].xyz;

                // float dist0 = distance(myPos.xyz, randPartPos0);
                // float dist1 = distance(myPos.xyz, randPartPos1);

                // float radius = 10*h;
                // if ( dist0 <= radius) // h is the effective radius being used now.
                // {
                //     // put particle randPartPos in neighborMap
                //     neighbors[count++] = pIdx0;
                // }

                // if (dist1 <= radius)
                // {
                //     neighbors[count++] = pIdx1;
                // }

                float radius = 3 * h;
                for (j = pid + randPart; j < pid+pCount; j++)
                // for (j = pid; j < pid+pCount; j++)
                {
                    if (count == 32)
                        break;
                    else {
                        float3 particleJ = sortedPos[j].xyz;
                        float dist = distance(myPos.xyz, particleJ);

                        if (dist < radius)
                        {
                            neighbors[count] = j;
                            count++;
                        }
                    }
                }
        }
        
        // set all entries to be the particle itself
        for (i = 0; i < 32; i++)
        {
            neighborMap[32*gid+i] = gid;
        }

        int countTemp = 0;
        for (i = 0; i < 32; i++)
        {
            for (j = 0; j < 32; j++)
            {
                if (neighborMap[32*gid+j] == neighbors[i])
                    break;
            }

            if (j == 32)
            {
                neighborMap[32*gid+countTemp] = neighbors[i];
                countTemp++;
            }
        }
    }

    //// AMD formation
    float wDefault(float weightDefault, float maxSearchRadius, float3 dist) 
    {
        float result = 0.0;
        float ratio = length(dist);
        
        float ratioSquared = ratio * ratio;
        float maxSearchRadiusSquared = maxSearchRadius * maxSearchRadius;
        float ratioDif = maxSearchRadiusSquared - ratioSquared;
        result = weightDefault * ratioDif * ratioDif * ratioDif;
        
        return result;
    }

    //// Muller formation
    float wPoly6(float weightDefaultMuller, float maxSearchRadius, float3 dist)
    {
        float result;

        float r = length(dist);
        float hsquared = maxSearchRadius * maxSearchRadius;
        float rsquared = r * r;
        float diff = hsquared - rsquared;

        // weightDefaultMuller = 315/(64*PI*pow(h, 6))
        result = weightDefaultMuller * diff  * diff * diff;

        return result;
    }

    __kernel void sph_kernel_computeDensityPressure(
        float mass,
        float radius,
        float weightDefaultConstant,
        float K_constant,
        float restDensity,
        __global float4* sortedPos,
        __global int* neighborMap,
        __global float* density,
        __global float* pressure)
    {
        unsigned int gid = get_global_id(0);

        float3 myPos = sortedPos[gid].xyz;
        
        float dens = 0.0;
        int i;
        // Equation (2)
        for (i = 0; i < 32; i++) {
            int neighborIdx = neighborMap[32*gid+i];
            float3 neighborPos = sortedPos[neighborIdx].xyz;
            // //// AMD formulation
            // dens += mass * wDefault(weightDefaultConstant, radius, (float3)(myPos - neighborPos));
            // Muller formulation
            dens += mass * wPoly6(weightDefaultConstant, radius, (float3)(myPos - neighborPos));
        }
        density[gid] = dens;
        // p = k*(density - restDensity)
        pressure[gid] = K_constant * (density[gid] - restDensity);
    }

    
    //// AMD presentation formulation
    float3 wPressure(float weightPressure, float maxSearchRadius, float3 dist)
    {
        float3 result = (float3)0.0;
        float ratio = length(dist);
        float diff = maxSearchRadius - ratio;
        result = weightPressure * normalize(dist) * diff * diff ;
        
        return result;
    }

    //// Muller formulation
    // using the gradient of spiky kernel in equation (21)
    float3 wSpiky(float weightSpiky, float radius, float3 dist)
    {
        float3 result;
        float r = length(dist);
        float diff = radius - r;

        result = weightSpiky * normalize(dist) * diff * diff;

        return result;
    }

    float wViscosity(float weightViscosity, float maxSearchRadius, float3 dist)
    {   
        float result = 0.0;

        float ratio = length(dist);
        float diff = maxSearchRadius - ratio;
        result = weightViscosity * diff;

        return result;
    }

    // Laplacian (second order derivative of the viscous kernel: equation (22)
    // the paper gaves the Laplacian of this kernel in the paper
    float wViscosityLaplacian(float weightViscosityLaplacian, float radius, float3 dist)
    {
        float result;
        float r = length(dist);
        float diff = radius - r;

        result = weightViscosityLaplacian * diff;

        return result;
    }

    // Muller's formulation
    // compute the gradient of default kernel wPoly6()
    float3 wColorGradient(float weightColorGradient, float radius, float3 dist)
    {
        float3 result;

        float r = length(dist);
        float hsquared = radius * radius;
        float rsquared = r * r;
        float coeff = weightColorGradient;
        float diff = hsquared - rsquared;

        result = dist * (float3)(coeff * diff * diff);
        return result;
    }

    // Muller's formulation
    // compute the second order derivative of default kernel wPoly6()
    float wColorLaplacian(float weightColorLaplacian, float radius, float3 dist)
    {
        float result;

        float r = length(dist);
        float rsquared = r * r;
        float hsquared = radius * radius;
        float coeff = weightColorLaplacian;
        float diff = hsquared - rsquared;

        result = coeff * diff * (3.0 * hsquared - 7.0 * rsquared);
        return result;
    }

    __kernel void sph_kernel_computeAcceleration(
        float mass,
        float radius,
        float viscosity,
        float restDensity,
        float SURFACE_TENSION,
        float TENSION_THRESHOLD,
        float weightPressureConstant,
        float weightViscosityConstant,
        float weightColorGradient,
        float weightColorLaplacian,
        __global float4* sortedPos,
        __global float4* sortedVel,
        __global int* neighborMap,
        __global float* density,
        __global float* pressure,
        __global float4* acceleration)
    {
        unsigned int gid = get_global_id(0);

        float3 myPos = sortedPos[gid].xyz;
        float3 myVel = sortedVel[gid].xyz;

        int i;
        float3 pressureGrad;
        for (i = 0; i < 32; i++) {
            int neighborIdx = neighborMap[32*gid+i];
            float3 neighborPos = sortedPos[neighborIdx].xyz;

            // //// AMD formation
            // // compute P_i/rho_i^2 + P_j/rho_j^2)
            // float pOverRhoSquared = pressure[gid]/(density[gid]*density[gid]) + pressure[neighborIdx]/(density[neighborIdx]*density[neighborIdx]);
            // pressureGrad += (float3)(mass * pOverRhoSquared) * wPressure(weightPressureConstant, radius, (float3)(myPos - neighborPos));

            //// Muller formation
            // pressureGrad += (float3)(mass * (pressure[gid] + pressure[neighborIdx])/(2.0*density[neighborIdx])) * wSpiky(weightPressureConstant, radius, (float3)(myPos - neighborPos))/ (float3)restDensity;

            pressureGrad += (float3)(mass * (pressure[gid] + pressure[neighborIdx])/(2.0 * density[neighborIdx])) * wSpiky(weightPressureConstant, radius, (float3)(myPos - neighborPos))/ (float3)restDensity;

            pressureGrad *= (float3)(-1); // -1 is from the '-' sign in front of equantion (10) in Muller paper
        }

        // wait for pressure gradient to be updated
        barrier(CLK_GLOBAL_MEM_FENCE);

        float3 viscousTerm;
        for (i = 0; i < 32; i++) {
            int neighborIdx = neighborMap[32*gid+i];
            float3 neighborPos = sortedPos[neighborIdx].xyz;
            float3 neighborVel = sortedVel[neighborIdx].xyz;

            //// AMD presentation formulation
            // float wviscosity = wViscosity(weightViscosityConstant, radius, (float3)(myPos - neighborPos));
            // viscousTerm += (float3)(mass * wviscosity / density[neighborIdx]) * (float3)(neighborVel - myVel) / (float3)restDensity;
            
            float wviscosityLap = wViscosityLaplacian(weightViscosityConstant, radius, (float3)(myPos - neighborPos));
            viscousTerm += (float3)(viscosity * mass * wviscosityLap / density[neighborIdx]) * (float3)(neighborVel - myVel) / (float3)restDensity;
        }

        // wait for viscous term to be updated
        barrier(CLK_GLOBAL_MEM_FENCE);

        if (density[gid] != (float)0.0)
        {
            pressureGrad /= (float3)density[gid];

            viscousTerm /= (float3)density[gid];
        }
        else
        {
            pressureGrad.x = 0.0;
            pressureGrad.y = 0.0;
            pressureGrad.z = 0.0;

            viscousTerm.x = 0.0;
            viscousTerm.y = 0.0;
            viscousTerm.z = 0.0;
        }

        float Kappa;
        float3 normal;

        for (i = 0; i < 32; i++) {
            int neighborIdx = neighborMap[32*gid+i];
            float3 neighborPos = sortedPos[neighborIdx].xyz;
            
            normal += (float3)(mass / density[neighborIdx]) * wColorGradient(weightColorGradient, radius, (float3)(myPos - neighborPos)) / (float3)restDensity;

            Kappa += (mass / density[neighborIdx]) * wColorLaplacian(weightColorLaplacian, radius, (float3)(myPos - neighborPos)) / restDensity;
        }

        float3 tension;

        float lenNormal = length(normal);
        if (lenNormal > TENSION_THRESHOLD)
        {
            normal = normal / (float3)lenNormal;
            tension = normal * (float3)(-1.0 * Kappa);
        } else 
        {
            float3 v = (float3)(0.0, 0.0, 0.0);
            tension = (float3)v;
        }

        float3 g;
        g.x = 0.0;
        // g.y = -9820.0; // seemed to work with this 1000X value, are the units right???
        g.y = -9.82;
        g.z = 0.0;

        // equation 1: compute acceleration
        // acceleration[gid].xyz = (float3)g + (float3)pressureGrad + (float3)viscousTerm; // no surface tension
        // acceleration[gid].xyz = (float3)viscousTerm + (float3)pressureGrad; // no gravity; no surface tension
        acceleration[gid].xyz = (float3)g + (float3)tension  * (float3)SURFACE_TENSION + (float3)viscousTerm + (float3)pressureGrad;
        // acceleration[gid].xyz = (float3)tension  * (float3)SURFACE_TENSION + (float3)viscousTerm + (float3)pressureGrad;
    }

    __kernel void sph_kernel_integrate(
        float dt,
        __global float4* acceleration,
        __global float4* sortedPos,
        __global float4* sortedVel,
        __global float4* oldPos,
        __global float4* oldVel) 
    {
        unsigned int gid = get_global_id(0);

        // Euler integration
        // will change after adding boundary condition controls
        sortedVel[gid].xyz += acceleration[gid].xyz * (float3)dt;
        sortedPos[gid].xyz += sortedVel[gid].xyz * (float3)dt;
        
        /*
        if (pos[gid].x > 1.0)
            pos[gid].x = 1.0;
        else if (pos[gid].x < -1.0)
            pos[gid].x = -1.0;

        if (pos[gid].y > 1.0)
            pos[gid].y = 1.0;
        else if (pos[gid].y < -1.0)
            pos[gid].y = -1.0;        
        
        if (pos[gid].z > 1.0)
            pos[gid].z = 1.0;
        else if (pos[gid].z < -1.0)
            pos[gid].z = -1.0;
        */

        if (sortedPos[gid].x > 1.0)
        {
            sortedPos[gid].x = 1.0;
            sortedVel[gid].x *= -1.0;
            // sortedVel[gid].y *= .5;
            // sortedVel[gid].z *= .5;
        } 

        if (sortedPos[gid].x < -1.0)
        {
            sortedPos[gid].x = -1.0;
            sortedVel[gid].x *= -1.0;
            // sortedVel[gid].y *= .5;
            // sortedVel[gid].z *= .5;
        }

        if (sortedPos[gid].y > 1.0)
        {
            sortedPos[gid].y = 1.0;
            sortedVel[gid].y *= -1.0;
        } 

        if (sortedPos[gid].y < -1.0)
        {
            sortedPos[gid].y = -1.0;
            sortedVel[gid].y *= -1.0;
            // sortedVel[gid].x *= .5;
            // sortedVel[gid].z *= .5;
        }

        if (sortedPos[gid].z > 1.0)
        {
            sortedPos[gid].z = 1.0;
            sortedVel[gid].z *= -1.0;
            // sortedVel[gid].x *= .5;
            // sortedVel[gid].y *= .5;
        }

        if (sortedPos[gid].z < -1.0)
        {
            sortedPos[gid].z = -1.0;
            sortedVel[gid].z *= -1.0;
            // sortedVel[gid].x *= .5;
            // sortedVel[gid].y *= .5;
        }
        
        // Needs fixing: properly handle boundary condition here

        oldPos[gid].xyzw = sortedPos[gid].xyzw;
        oldVel[gid].xyzw = sortedVel[gid].xyzw;

    }
                