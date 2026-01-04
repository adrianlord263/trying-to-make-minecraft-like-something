import { createNoise2D } from 'simplex-noise';

// Initialize noise function
const noise2D = createNoise2D();

// Chunk dimensions
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

export interface ChunkData {
    x: number;
    z: number;
    blocks: Uint8Array;
}

// Generate terrain for a chunk
export function generateChunkData(chunkX: number, chunkZ: number): ChunkData {
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);

    const worldOffsetX = chunkX * CHUNK_SIZE;
    const worldOffsetZ = chunkZ * CHUNK_SIZE;

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = worldOffsetX + x;
            const worldZ = worldOffsetZ + z;

            // Multi-octave noise for terrain
            let height = 0;
            height += noise2D(worldX * 0.01, worldZ * 0.01) * 20;
            height += noise2D(worldX * 0.02, worldZ * 0.02) * 10;
            height += noise2D(worldX * 0.05, worldZ * 0.05) * 5;

            const terrainHeight = Math.floor(height + 32);

            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                const index = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;

                if (y === 0) {
                    // Bedrock
                    blocks[index] = 10;
                } else if (y < terrainHeight - 4) {
                    // Stone
                    blocks[index] = 3;

                    // Add ores
                    const oreNoise = noise2D(worldX * 0.1 + y * 0.1, worldZ * 0.1);
                    if (oreNoise > 0.7 && y < 40) {
                        blocks[index] = 11; // Coal
                    } else if (oreNoise > 0.8 && y < 30) {
                        blocks[index] = 12; // Iron
                    }
                } else if (y < terrainHeight - 1) {
                    // Dirt
                    blocks[index] = 2;
                } else if (y < terrainHeight) {
                    // Surface block
                    if (terrainHeight < 25) {
                        blocks[index] = 6; // Sand near water level
                    } else {
                        blocks[index] = 1; // Grass
                    }
                } else if (y < 24) {
                    // Water
                    blocks[index] = 7;
                } else {
                    // Air
                    blocks[index] = 0;
                }
            }

            // Add trees
            if (terrainHeight > 28 && Math.random() < 0.005) {
                const treeHeight = 4 + Math.floor(Math.random() * 3);

                for (let ty = 0; ty < treeHeight; ty++) {
                    const y = terrainHeight + ty;
                    if (y < CHUNK_HEIGHT) {
                        const index = x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
                        blocks[index] = 4; // Wood
                    }
                }

                // Leaves
                const leafY = terrainHeight + treeHeight;
                for (let lx = -2; lx <= 2; lx++) {
                    for (let lz = -2; lz <= 2; lz++) {
                        for (let ly = -1; ly <= 2; ly++) {
                            const nx = x + lx;
                            const nz = z + lz;
                            const ny = leafY + ly;

                            if (nx >= 0 && nx < CHUNK_SIZE &&
                                nz >= 0 && nz < CHUNK_SIZE &&
                                ny >= 0 && ny < CHUNK_HEIGHT) {

                                const dist = Math.abs(lx) + Math.abs(lz) + Math.abs(ly);
                                if (dist <= 3 && !(lx === 0 && lz === 0 && ly < 0)) {
                                    const index = nx + nz * CHUNK_SIZE + ny * CHUNK_SIZE * CHUNK_SIZE;
                                    if (blocks[index] === 0) {
                                        blocks[index] = 5; // Leaves
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return { x: chunkX, z: chunkZ, blocks };
}

// Web Worker message handler
self.onmessage = (e: MessageEvent<{ chunkX: number; chunkZ: number }>) => {
    const { chunkX, chunkZ } = e.data;
    const data = generateChunkData(chunkX, chunkZ);

    // Transfer the ArrayBuffer for performance
    self.postMessage(data, [data.blocks.buffer]);
};
