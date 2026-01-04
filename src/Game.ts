import * as THREE from 'three';
import { World } from './world/World';
import { Player } from './player/Player';
import { Physics } from './physics/Physics';
import { BlockType } from './blocks/BlockTypes';

export class Game {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private world: World;
    private player: Player;
    private physics: Physics;

    private clock: THREE.Clock;
    private frameCount: number = 0;
    private lastFpsUpdate: number = 0;

    private instructionsElement: HTMLElement;
    private isPlaying: boolean = false;

    constructor() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x87CEEB); // Sky blue

        const app = document.getElementById('app')!;
        app.appendChild(this.renderer.domElement);

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 50, 0);

        // Setup lighting
        this.setupLighting();

        // Initialize physics
        this.physics = new Physics();

        // Initialize world
        this.world = new World(this.scene, this.physics);

        // Initialize player
        this.player = new Player(this.camera, this.physics, this.world);

        // Clock for delta time
        this.clock = new THREE.Clock();

        // Setup pointer lock
        this.instructionsElement = document.getElementById('instructions')!;
        this.setupPointerLock();

        // Setup hotbar
        this.setupHotbar();
    }

    private setupLighting(): void {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(100, 200, 50);
        sunLight.castShadow = false; // Disable for performance
        this.scene.add(sunLight);

        // Hemisphere light for sky/ground color
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x556B2F, 0.4);
        this.scene.add(hemiLight);
    }

    private setupPointerLock(): void {
        const canvas = this.renderer.domElement;

        const requestLock = () => {
            if (!this.isPlaying) {
                canvas.requestPointerLock();
            }
        };

        // Click on canvas
        canvas.addEventListener('click', requestLock);

        // Click on instructions overlay (which blocks canvas)
        this.instructionsElement.addEventListener('click', requestLock);

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === canvas) {
                this.isPlaying = true;
                this.instructionsElement.classList.add('hidden');
                this.player.enable();
            } else {
                this.isPlaying = false;
                this.instructionsElement.classList.remove('hidden');
                this.player.disable();
            }
        });
    }

    private setupHotbar(): void {
        const slots = document.querySelectorAll('.hotbar-slot');

        // Click to select
        slots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                slots.forEach(s => s.classList.remove('active'));
                slot.classList.add('active');
                this.player.setSelectedBlock(index + 1 as BlockType);
            });
        });

        // Number keys to select
        window.addEventListener('keydown', (e) => {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) {
                slots.forEach(s => s.classList.remove('active'));
                slots[num - 1].classList.add('active');
                this.player.setSelectedBlock(num as BlockType);
            }
        });
    }

    public start(): void {
        this.clock.start();
        this.update();
    }

    private update = (): void => {
        requestAnimationFrame(this.update);

        const delta = Math.min(this.clock.getDelta(), 0.1); // Cap delta to prevent spiral of death

        // Update physics
        this.physics.update(delta);

        // Update player
        this.player.update(delta);

        // Update world (chunk loading based on player position)
        this.world.update(this.camera.position);

        // Render
        this.renderer.render(this.scene, this.camera);

        // Update FPS counter
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsUpdate >= 1000) {
            document.getElementById('fps')!.textContent = this.frameCount.toString();
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }

        // Update debug info
        const pos = this.camera.position;
        document.getElementById('position')!.textContent =
            `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
        document.getElementById('chunks')!.textContent = this.world.getChunkCount().toString();
    };

    public resize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
