import * as THREE from 'three';
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk';
import { ChunkMesher } from './ChunkMesher';
import { Physics } from '../physics/Physics';
import { BlockType, BLOCK_PROPERTIES } from '../blocks/BlockTypes';
import * as CANNON from 'cannon-es';

// Import worker
import TerrainWorker from '../workers/terrain.worker.ts?worker';

interface ChunkEntry {
    chunk: Chunk;
    mesh: THREE.Mesh | null;
    body: CANNON.Body | null;
}

export class World {
    private scene: THREE.Scene;
    private physics: Physics;
    private chunks: Map<string, ChunkEntry> = new Map();
    private worker: Worker;
    private pendingChunks: Set<string> = new Set();

    private readonly RENDER_DISTANCE = 6;
    private readonly UNLOAD_DISTANCE = 8;

    private lastPlayerChunkX: number = Infinity;
    private lastPlayerChunkZ: number = Infinity;

    constructor(scene: THREE.Scene, physics: Physics) {
        this.scene = scene;
        this.physics = physics;

        // Create terrain worker
        this.worker = new TerrainWorker();
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
    }

    private getChunkKey(x: number, z: number): string {
        return `${x},${z}`;
    }

    private handleWorkerMessage(e: MessageEvent): void {
        const { x, z, blocks } = e.data;
        const key = this.getChunkKey(x, z);

        this.pendingChunks.delete(key);

        // Create chunk from worker data
        const chunk = new Chunk(x, z, new Uint8Array(blocks));

        // Generate mesh
        const mesh = ChunkMesher.generateMesh(chunk, (wx, wy, wz) => {
            return this.getBlock(wx, wy, wz);
        });

        const entry: ChunkEntry = {
            chunk,
            mesh,
            body: null,
        };

        if (mesh) {
            this.scene.add(mesh);
        }

        this.chunks.set(key, entry);

        // Rebuild neighbor chunks that may have been affected
        this.rebuildNeighborChunks(x, z);
    }

    private rebuildNeighborChunks(x: number, z: number): void {
        const neighbors = [
            [x - 1, z], [x + 1, z],
            [x, z - 1], [x, z + 1],
        ];

        for (const [nx, nz] of neighbors) {
            const key = this.getChunkKey(nx, nz);
            const entry = this.chunks.get(key);

            if (entry && !entry.chunk.isDirty) {
                entry.chunk.isDirty = true;
            }
        }
    }

    private requestChunk(x: number, z: number): void {
        const key = this.getChunkKey(x, z);

        if (this.chunks.has(key) || this.pendingChunks.has(key)) {
            return;
        }

        this.pendingChunks.add(key);
        this.worker.postMessage({ chunkX: x, chunkZ: z });
    }

    public update(playerPosition: THREE.Vector3): void {
        const playerChunkX = Math.floor(playerPosition.x / CHUNK_SIZE);
        const playerChunkZ = Math.floor(playerPosition.z / CHUNK_SIZE);

        // Only update if player moved to different chunk
        if (playerChunkX !== this.lastPlayerChunkX || playerChunkZ !== this.lastPlayerChunkZ) {
            this.lastPlayerChunkX = playerChunkX;
            this.lastPlayerChunkZ = playerChunkZ;

            // Request chunks in render distance
            for (let dx = -this.RENDER_DISTANCE; dx <= this.RENDER_DISTANCE; dx++) {
                for (let dz = -this.RENDER_DISTANCE; dz <= this.RENDER_DISTANCE; dz++) {
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist <= this.RENDER_DISTANCE) {
                        this.requestChunk(playerChunkX + dx, playerChunkZ + dz);
                    }
                }
            }

            // Unload distant chunks
            for (const [key, entry] of this.chunks) {
                const [cx, cz] = key.split(',').map(Number);
                const dx = cx - playerChunkX;
                const dz = cz - playerChunkZ;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist > this.UNLOAD_DISTANCE) {
                    if (entry.mesh) {
                        this.scene.remove(entry.mesh);
                        entry.mesh.geometry.dispose();
                        (entry.mesh.material as THREE.Material).dispose();
                    }
                    if (entry.body) {
                        this.physics.removeBody(entry.body);
                    }
                    this.chunks.delete(key);
                }
            }
        }

        // Rebuild dirty chunks
        for (const [key, entry] of this.chunks) {
            if (entry.chunk.isDirty) {
                entry.chunk.isDirty = false;

                // Remove old mesh
                if (entry.mesh) {
                    this.scene.remove(entry.mesh);
                    entry.mesh.geometry.dispose();
                    (entry.mesh.material as THREE.Material).dispose();
                }

                // Generate new mesh
                const mesh = ChunkMesher.generateMesh(entry.chunk, (wx, wy, wz) => {
                    return this.getBlock(wx, wy, wz);
                });

                entry.mesh = mesh;
                if (mesh) {
                    this.scene.add(mesh);
                }
            }
        }
    }

    public getBlock(worldX: number, worldY: number, worldZ: number): BlockType {
        if (worldY < 0 || worldY >= CHUNK_HEIGHT) {
            return BlockType.AIR;
        }

        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
        const key = this.getChunkKey(chunkX, chunkZ);

        const entry = this.chunks.get(key);
        if (!entry) {
            return BlockType.AIR;
        }

        const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const localZ = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

        return entry.chunk.getBlock(localX, worldY, localZ);
    }

    public setBlock(worldX: number, worldY: number, worldZ: number, type: BlockType): void {
        if (worldY < 0 || worldY >= CHUNK_HEIGHT) {
            return;
        }

        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
        const key = this.getChunkKey(chunkX, chunkZ);

        const entry = this.chunks.get(key);
        if (!entry) {
            return;
        }

        const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const localZ = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

        entry.chunk.setBlock(localX, worldY, localZ, type);

        // Mark neighbor chunks as dirty if block is on edge
        if (localX === 0) this.markChunkDirty(chunkX - 1, chunkZ);
        if (localX === CHUNK_SIZE - 1) this.markChunkDirty(chunkX + 1, chunkZ);
        if (localZ === 0) this.markChunkDirty(chunkX, chunkZ - 1);
        if (localZ === CHUNK_SIZE - 1) this.markChunkDirty(chunkX, chunkZ + 1);
    }

    private markChunkDirty(x: number, z: number): void {
        const key = this.getChunkKey(x, z);
        const entry = this.chunks.get(key);
        if (entry) {
            entry.chunk.isDirty = true;
        }
    }

    public getChunkMeshes(): THREE.Mesh[] {
        const meshes: THREE.Mesh[] = [];
        for (const entry of this.chunks.values()) {
            if (entry.mesh) {
                meshes.push(entry.mesh);
            }
        }
        return meshes;
    }

    public getChunkCount(): number {
        return this.chunks.size;
    }
}
