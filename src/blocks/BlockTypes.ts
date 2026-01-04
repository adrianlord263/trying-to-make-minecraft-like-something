// Block types enum
export enum BlockType {
    AIR = 0,
    GRASS = 1,
    DIRT = 2,
    STONE = 3,
    WOOD = 4,
    LEAVES = 5,
    SAND = 6,
    WATER = 7,
    BRICK = 8,
    GLASS = 9,
    BEDROCK = 10,
    COAL_ORE = 11,
    IRON_ORE = 12,
}

// Block colors (used for vertex colors when textures aren't loaded)
export const BLOCK_COLORS: Record<BlockType, number> = {
    [BlockType.AIR]: 0x000000,
    [BlockType.GRASS]: 0x4CAF50,
    [BlockType.DIRT]: 0x8B4513,
    [BlockType.STONE]: 0x808080,
    [BlockType.WOOD]: 0x8B4513,
    [BlockType.LEAVES]: 0x228B22,
    [BlockType.SAND]: 0xF4E4BC,
    [BlockType.WATER]: 0x4169E1,
    [BlockType.BRICK]: 0xB22222,
    [BlockType.GLASS]: 0xADD8E6,
    [BlockType.BEDROCK]: 0x1a1a1a,
    [BlockType.COAL_ORE]: 0x333333,
    [BlockType.IRON_ORE]: 0xD2B48C,
};

// Block properties
export interface BlockProperties {
    solid: boolean;
    transparent: boolean;
    color: number;
}

export const BLOCK_PROPERTIES: Record<BlockType, BlockProperties> = {
    [BlockType.AIR]: { solid: false, transparent: true, color: 0x000000 },
    [BlockType.GRASS]: { solid: true, transparent: false, color: 0x4CAF50 },
    [BlockType.DIRT]: { solid: true, transparent: false, color: 0x8B4513 },
    [BlockType.STONE]: { solid: true, transparent: false, color: 0x808080 },
    [BlockType.WOOD]: { solid: true, transparent: false, color: 0x8B4513 },
    [BlockType.LEAVES]: { solid: true, transparent: true, color: 0x228B22 },
    [BlockType.SAND]: { solid: true, transparent: false, color: 0xF4E4BC },
    [BlockType.WATER]: { solid: false, transparent: true, color: 0x4169E1 },
    [BlockType.BRICK]: { solid: true, transparent: false, color: 0xB22222 },
    [BlockType.GLASS]: { solid: true, transparent: true, color: 0xADD8E6 },
    [BlockType.BEDROCK]: { solid: true, transparent: false, color: 0x1a1a1a },
    [BlockType.COAL_ORE]: { solid: true, transparent: false, color: 0x333333 },
    [BlockType.IRON_ORE]: { solid: true, transparent: false, color: 0xD2B48C },
};
