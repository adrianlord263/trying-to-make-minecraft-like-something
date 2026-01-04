import * as CANNON from 'cannon-es';

export class Physics {
    public world: CANNON.World;
    private groundMaterial: CANNON.Material;
    private playerMaterial: CANNON.Material;

    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -25, 0); // Slightly stronger gravity for snappy feel
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.allowSleep = true;

        // Materials
        this.groundMaterial = new CANNON.Material('ground');
        this.playerMaterial = new CANNON.Material('player');

        // Contact material between player and ground
        const playerGroundContact = new CANNON.ContactMaterial(
            this.playerMaterial,
            this.groundMaterial,
            {
                friction: 0.0,
                restitution: 0.0,
            }
        );
        this.world.addContactMaterial(playerGroundContact);
    }

    public getGroundMaterial(): CANNON.Material {
        return this.groundMaterial;
    }

    public getPlayerMaterial(): CANNON.Material {
        return this.playerMaterial;
    }

    public update(delta: number): void {
        // Fixed timestep for physics
        this.world.step(1 / 60, delta, 3);
    }

    public addBody(body: CANNON.Body): void {
        this.world.addBody(body);
    }

    public removeBody(body: CANNON.Body): void {
        this.world.removeBody(body);
    }
}
