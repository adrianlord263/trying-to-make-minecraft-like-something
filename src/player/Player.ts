import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Physics } from '../physics/Physics';
import { World } from '../world/World';
import { BlockType, BLOCK_PROPERTIES } from '../blocks/BlockTypes';

export class Player {
    private camera: THREE.PerspectiveCamera;
    private world: World;

    public body: CANNON.Body;

    // Movement
    private moveForward: boolean = false;
    private moveBackward: boolean = false;
    private moveLeft: boolean = false;
    private moveRight: boolean = false;
    private isSprinting: boolean = false;
    private isGrounded: boolean = false;

    // Mouse look
    private euler: THREE.Euler;

    // Block interaction
    private raycaster: THREE.Raycaster;
    private selectedBlock: BlockType = BlockType.GRASS;
    private canBreak: boolean = true;
    private canPlace: boolean = true;

    // Settings
    private readonly WALK_SPEED = 5;
    private readonly SPRINT_SPEED = 8;
    private readonly JUMP_VELOCITY = 10;
    private readonly MOUSE_SENSITIVITY = 0.002;
    private readonly GRAVITY = 25;
    private readonly PLAYER_HEIGHT = 1.8;
    private readonly PLAYER_WIDTH = 0.6;

    private enabled: boolean = false;
    private velocityY: number = 0;

    constructor(camera: THREE.PerspectiveCamera, physics: Physics, world: World) {
        this.camera = camera;
        this.world = world;

        // Setup mouse look
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

        // Create a simple physics body for position tracking (not using Cannon for actual collision)
        this.body = new CANNON.Body({
            mass: 80,
            material: physics.getPlayerMaterial(),
            fixedRotation: true,
        });
        this.body.position.set(0, 60, 0); // Start higher

        // Raycaster for block interaction
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 5;

        // Setup controls
        this.setupKeyboardControls();
        this.setupMouseControls();
    }

    private setupKeyboardControls(): void {
        window.addEventListener('keydown', (e) => {
            if (!this.enabled) return;

            switch (e.code) {
                case 'KeyW': this.moveForward = true; break;
                case 'KeyS': this.moveBackward = true; break;
                case 'KeyA': this.moveLeft = true; break;
                case 'KeyD': this.moveRight = true; break;
                case 'ShiftLeft': this.isSprinting = true; break;
                case 'Space':
                    if (this.isGrounded) {
                        this.velocityY = this.JUMP_VELOCITY;
                        this.isGrounded = false;
                    }
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': this.moveForward = false; break;
                case 'KeyS': this.moveBackward = false; break;
                case 'KeyA': this.moveLeft = false; break;
                case 'KeyD': this.moveRight = false; break;
                case 'ShiftLeft': this.isSprinting = false; break;
            }
        });
    }

    private setupMouseControls(): void {
        document.addEventListener('mousemove', (e) => {
            if (!this.enabled) return;

            const movementX = e.movementX || 0;
            const movementY = e.movementY || 0;

            this.euler.y -= movementX * this.MOUSE_SENSITIVITY;
            this.euler.x -= movementY * this.MOUSE_SENSITIVITY;

            // Clamp vertical look
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

            this.camera.quaternion.setFromEuler(this.euler);
        });

        document.addEventListener('mousedown', (e) => {
            if (!this.enabled) return;

            if (e.button === 0 && this.canBreak) {
                this.breakBlock();
                this.canBreak = false;
                setTimeout(() => this.canBreak = true, 200);
            } else if (e.button === 2 && this.canPlace) {
                this.placeBlock();
                this.canPlace = false;
                setTimeout(() => this.canPlace = true, 200);
            }
        });
    }

    private breakBlock(): void {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.world.getChunkMeshes(), false);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const point = hit.point.clone();
            const normal = hit.face!.normal.clone();

            // Move slightly into the block
            point.sub(normal.multiplyScalar(0.5));

            const blockPos = {
                x: Math.floor(point.x),
                y: Math.floor(point.y),
                z: Math.floor(point.z),
            };

            this.world.setBlock(blockPos.x, blockPos.y, blockPos.z, BlockType.AIR);
        }
    }

    private placeBlock(): void {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.world.getChunkMeshes(), false);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const point = hit.point.clone();
            const normal = hit.face!.normal.clone();

            // Move to adjacent block position
            point.add(normal.multiplyScalar(0.5));

            const blockPos = {
                x: Math.floor(point.x),
                y: Math.floor(point.y),
                z: Math.floor(point.z),
            };

            // Don't place block where player is standing
            const playerBlockX = Math.floor(this.body.position.x);
            const playerBlockY = Math.floor(this.body.position.y);
            const playerBlockZ = Math.floor(this.body.position.z);

            if (blockPos.x === playerBlockX &&
                (blockPos.y === playerBlockY || blockPos.y === playerBlockY - 1) &&
                blockPos.z === playerBlockZ) {
                return;
            }

            this.world.setBlock(blockPos.x, blockPos.y, blockPos.z, this.selectedBlock);
        }
    }

    public setSelectedBlock(block: BlockType): void {
        this.selectedBlock = block;
    }

    // Check if a position collides with solid blocks
    private checkCollision(x: number, y: number, z: number): boolean {
        // Check player bounding box against world blocks
        const halfWidth = this.PLAYER_WIDTH / 2;

        // Check corners and center of player hitbox
        const checkPoints = [
            [x - halfWidth, y, z - halfWidth],
            [x + halfWidth, y, z - halfWidth],
            [x - halfWidth, y, z + halfWidth],
            [x + halfWidth, y, z + halfWidth],
            [x, y, z],
        ];

        for (const [px, py, pz] of checkPoints) {
            const blockType = this.world.getBlock(Math.floor(px), Math.floor(py), Math.floor(pz));
            if (BLOCK_PROPERTIES[blockType]?.solid) {
                return true;
            }
        }
        return false;
    }

    public update(delta: number): void {
        // Always sync camera with body position (even when not enabled)
        this.camera.position.set(
            this.body.position.x,
            this.body.position.y + 1.6, // Eye height
            this.body.position.z
        );

        if (!this.enabled) return;

        const pos = this.body.position;

        // Apply gravity
        this.velocityY -= this.GRAVITY * delta;

        // Get movement direction based on camera orientation
        const direction = new THREE.Vector3();
        const rotation = new THREE.Euler(0, this.euler.y, 0, 'YXZ');

        if (this.moveForward) direction.z -= 1;
        if (this.moveBackward) direction.z += 1;
        if (this.moveLeft) direction.x -= 1;
        if (this.moveRight) direction.x += 1;

        direction.applyEuler(rotation);
        if (direction.length() > 0) {
            direction.normalize();
        }

        // Apply speed
        const speed = this.isSprinting ? this.SPRINT_SPEED : this.WALK_SPEED;

        // Calculate new position
        let newX = pos.x + direction.x * speed * delta;
        let newY = pos.y + this.velocityY * delta;
        let newZ = pos.z + direction.z * speed * delta;

        // Check Y collision (ground/ceiling)
        const feetY = newY;
        const headY = newY + this.PLAYER_HEIGHT - 0.1;

        // Ground check
        if (this.checkCollision(pos.x, feetY, pos.z)) {
            // Find ground level
            let groundY = Math.floor(feetY) + 1;
            newY = groundY;
            this.velocityY = 0;
            this.isGrounded = true;
        } else {
            // Ceiling check
            if (this.velocityY > 0 && this.checkCollision(pos.x, headY, pos.z)) {
                this.velocityY = 0;
            }
            this.isGrounded = false;
        }

        // Check X collision
        if (this.checkCollision(newX, pos.y, pos.z) ||
            this.checkCollision(newX, pos.y + 1, pos.z)) {
            newX = pos.x;
        }

        // Check Z collision
        if (this.checkCollision(pos.x, pos.y, newZ) ||
            this.checkCollision(pos.x, pos.y + 1, newZ)) {
            newZ = pos.z;
        }

        // Update position
        this.body.position.x = newX;
        this.body.position.y = newY;
        this.body.position.z = newZ;

        // Prevent falling through the world
        if (this.body.position.y < -50) {
            this.body.position.set(0, 60, 0);
            this.velocityY = 0;
        }
    }

    public enable(): void {
        this.enabled = true;
    }

    public disable(): void {
        this.enabled = false;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
    }

    public getPosition(): THREE.Vector3 {
        return new THREE.Vector3(
            this.body.position.x,
            this.body.position.y,
            this.body.position.z
        );
    }
}
