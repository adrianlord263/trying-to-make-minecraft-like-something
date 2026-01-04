import { BlockType } from '../blocks/BlockTypes';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

export class Chunk {
    public readonly x: number;
    public readonly z: number;
    public blocks: Uint8Array;
    public isDirty: boolean = true;

    constructor(x: number, z: number, blocks?: Uint8Array) {
        this.x = x;
        this.z = z;
        this.blocks = blocks || new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    }

    private getIndex(x: number, y: number, z: number): number {
        return x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
    }

    public getBlock(x: number, y: number, z: number): BlockType {
        if (x < 0 || x >= CHUNK_SIZE ||
            y < 0 || y >= CHUNK_HEIGHT ||
            z < 0 || z >= CHUNK_SIZE) {
            return BlockType.AIR;
        }
        return this.blocks[this.getIndex(x, y, z)] as BlockType;
    }

    public setBlock(x: number, y: number, z: number, type: BlockType): void {
        if (x < 0 || x >= CHUNK_SIZE ||
            y < 0 || y >= CHUNK_HEIGHT ||
            z < 0 || z >= CHUNK_SIZE) {
            return;
        }
        this.blocks[this.getIndex(x, y, z)] = type;
        this.isDirty = true;
    }

    public static getChunkCoords(worldX: number, worldZ: number): { x: number; z: number } {
        return {
            x: Math.floor(worldX / CHUNK_SIZE),
            z: Math.floor(worldZ / CHUNK_SIZE),
        };
    }

    public static getLocalCoords(worldX: number, worldY: number, worldZ: number): { x: number; y: number; z: number } {
        return {
            x: ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
            y: worldY,
            z: ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
        };
    }
}
