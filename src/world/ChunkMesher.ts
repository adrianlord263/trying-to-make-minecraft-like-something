import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_HEIGHT, Chunk } from './Chunk';
import { BlockType, BLOCK_PROPERTIES, BLOCK_COLORS } from '../blocks/BlockTypes';

// Face directions
const FACES = [
    { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], name: 'top' },    // Top
    { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], name: 'bottom' }, // Bottom
    { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], name: 'front' },   // Front
    { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], name: 'back' },   // Back
    { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], name: 'right' },   // Right
    { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], name: 'left' },   // Left
];

export class ChunkMesher {
    public static generateMesh(
        chunk: Chunk,
        getNeighborBlock: (x: number, y: number, z: number) => BlockType
    ): THREE.Mesh | null {
        const positions: number[] = [];
        const normals: number[] = [];
        const colors: number[] = [];
        const indices: number[] = [];

        let vertexIndex = 0;

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    const blockType = chunk.getBlock(x, y, z);

                    if (blockType === BlockType.AIR) continue;

                    const props = BLOCK_PROPERTIES[blockType];
                    if (!props.solid && blockType !== BlockType.WATER) continue;

                    const color = new THREE.Color(BLOCK_COLORS[blockType]);

                    // Check each face
                    for (const face of FACES) {
                        const [dx, dy, dz] = face.dir;
                        const worldX = chunk.x * CHUNK_SIZE + x + dx;
                        const worldY = y + dy;
                        const worldZ = chunk.z * CHUNK_SIZE + z + dz;

                        // Get neighbor block
                        let neighborType: BlockType;
                        if (x + dx >= 0 && x + dx < CHUNK_SIZE &&
                            z + dz >= 0 && z + dz < CHUNK_SIZE &&
                            y + dy >= 0 && y + dy < CHUNK_HEIGHT) {
                            neighborType = chunk.getBlock(x + dx, y + dy, z + dz);
                        } else {
                            neighborType = getNeighborBlock(worldX, worldY, worldZ);
                        }

                        const neighborProps = BLOCK_PROPERTIES[neighborType];

                        // Only render face if neighbor is transparent
                        if (!neighborProps.transparent && neighborProps.solid) continue;
                        if (blockType === neighborType && blockType === BlockType.WATER) continue;

                        // Add face vertices
                        const worldBaseX = chunk.x * CHUNK_SIZE + x;
                        const worldBaseZ = chunk.z * CHUNK_SIZE + z;

                        // Adjust color for different faces (simple lighting)
                        let faceColor = color.clone();
                        if (face.name === 'top') {
                            faceColor.multiplyScalar(1.0);
                        } else if (face.name === 'bottom') {
                            faceColor.multiplyScalar(0.5);
                        } else {
                            faceColor.multiplyScalar(0.7 + Math.abs(dx) * 0.1);
                        }

                        // Special grass handling - darker sides
                        if (blockType === BlockType.GRASS && face.name !== 'top') {
                            faceColor = new THREE.Color(BLOCK_COLORS[BlockType.DIRT]).multiplyScalar(0.7);
                        }

                        for (const corner of face.corners) {
                            positions.push(
                                worldBaseX + corner[0],
                                y + corner[1],
                                worldBaseZ + corner[2]
                            );
                            normals.push(dx, dy, dz);
                            colors.push(faceColor.r, faceColor.g, faceColor.b);
                        }

                        // Add indices for two triangles
                        indices.push(
                            vertexIndex, vertexIndex + 1, vertexIndex + 2,
                            vertexIndex, vertexIndex + 2, vertexIndex + 3
                        );
                        vertexIndex += 4;
                    }
                }
            }
        }

        if (positions.length === 0) return null;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);

        const material = new THREE.MeshLambertMaterial({
            vertexColors: true,
            side: THREE.FrontSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `chunk_${chunk.x}_${chunk.z}`;

        return mesh;
    }
}
