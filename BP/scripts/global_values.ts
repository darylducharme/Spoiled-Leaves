import { Block, BlockPermutation, BlockTypes } from "@minecraft/server";

/**
 * Known vanilla log, wood, stem, and hyphae block IDs (including all stripped variants
 * and newer updates such as Pale Oak and Poplar).
 * Note: Per Minecraft Wiki, Bamboo does not prevent nearby leaf decay.
 */
export const log_types: Set<string> = new Set([
  // Standard Logs & Stems
  "minecraft:oak_log",
  "minecraft:spruce_log",
  "minecraft:birch_log",
  "minecraft:jungle_log",
  "minecraft:acacia_log",
  "minecraft:dark_oak_log",
  "minecraft:mangrove_log",
  "minecraft:cherry_log",
  "minecraft:pale_oak_log",
  "minecraft:poplar_log",
  "minecraft:crimson_stem",
  "minecraft:warped_stem",
  // Stripped Logs & Stems (previously missing in v0.9.7!)
  "minecraft:stripped_oak_log",
  "minecraft:stripped_spruce_log",
  "minecraft:stripped_birch_log",
  "minecraft:stripped_jungle_log",
  "minecraft:stripped_acacia_log",
  "minecraft:stripped_dark_oak_log",
  "minecraft:stripped_mangrove_log",
  "minecraft:stripped_cherry_log",
  "minecraft:stripped_pale_oak_log",
  "minecraft:stripped_poplar_log",
  "minecraft:stripped_crimson_stem",
  "minecraft:stripped_warped_stem",
  // All-Bark Woods & Hyphae
  "minecraft:wood",
  "minecraft:oak_wood",
  "minecraft:spruce_wood",
  "minecraft:birch_wood",
  "minecraft:jungle_wood",
  "minecraft:acacia_wood",
  "minecraft:dark_oak_wood",
  "minecraft:mangrove_wood",
  "minecraft:cherry_wood",
  "minecraft:pale_oak_wood",
  "minecraft:poplar_wood",
  "minecraft:crimson_hyphae",
  "minecraft:warped_hyphae",
  // Stripped All-Bark Woods & Hyphae
  "minecraft:stripped_oak_wood",
  "minecraft:stripped_spruce_wood",
  "minecraft:stripped_birch_wood",
  "minecraft:stripped_jungle_wood",
  "minecraft:stripped_acacia_wood",
  "minecraft:stripped_dark_oak_wood",
  "minecraft:stripped_mangrove_wood",
  "minecraft:stripped_cherry_wood",
  "minecraft:stripped_pale_oak_wood",
  "minecraft:stripped_poplar_wood",
  "minecraft:stripped_crimson_hyphae",
  "minecraft:stripped_warped_hyphae"
]);

/**
 * Known vanilla leaf block IDs (including Pale Oak, Poplar variants, and Azalea).
 */
export const leaf_types: Set<string> = new Set([
  "minecraft:leaves",
  "minecraft:leaves2",
  "minecraft:oak_leaves",
  "minecraft:spruce_leaves",
  "minecraft:birch_leaves",
  "minecraft:jungle_leaves",
  "minecraft:acacia_leaves",
  "minecraft:dark_oak_leaves",
  "minecraft:mangrove_leaves",
  "minecraft:cherry_leaves",
  "minecraft:pale_oak_leaves",
  "minecraft:poplar_leaves",
  "minecraft:yellow_poplar_leaves",
  "minecraft:orange_poplar_leaves",
  "minecraft:red_poplar_leaves",
  "minecraft:azalea_leaves",
  "minecraft:azalea_leaves_flowered"
]);

/**
 * Regex patterns for future vanilla updates and custom add-on tree blocks.
 * Excludes bamboo (which does not support leaves) and crafted wood derivatives.
 */
const LOG_ID_PATTERN = /(?:^|:)(?:stripped_)?[a-z0-9_]+_(?:log|wood|stem|hyphae)$/;
const CRAFTED_WOOD_EXCLUSION = /_(?:planks|slab|double_slab|stairs|fence|fence_gate|door|trapdoor|sign|hanging_sign|button|pressure_plate|shelf)$/;
const LEAF_ID_PATTERN = /(?:^|:)[a-z0-9_]*leaves[a-z0-9_]*$/;

let dynamicDiscoveryComplete = false;

/**
 * Scans all registered BlockTypes in the world (once after worldLoad) to
 * automatically register future Minecraft updates' wood/leaf types and
 * third-party add-on trees into the O(1) lookup sets.
 */
export function discoverDynamicTreeBlocks(): void {
  if (dynamicDiscoveryComplete) return;
  try {
    const allTypes = BlockTypes.getAll();
    if (!allTypes || allTypes.length === 0) return;

    for (const blockType of allTypes) {
      const id = blockType.id;
      if (log_types.has(id) || leaf_types.has(id)) continue;

      if (isLikelyLeafIdOrPermutation(id)) {
        leaf_types.add(id);
      } else if (isLikelyLogIdOrPermutation(id)) {
        log_types.add(id);
      }
    }
    dynamicDiscoveryComplete = true;
  } catch {
    // Fallback gracefully if called before registry is ready
  }
}

function isLikelyLeafIdOrPermutation(typeId: string, perm?: BlockPermutation): boolean {
  if (typeId.includes("leaf_litter")) return false;
  if (LEAF_ID_PATTERN.test(typeId)) return true;
  try {
    const p = perm ?? BlockPermutation.resolve(typeId);
    if (p.hasTag("leaves") || p.hasTag("minecraft:leaves")) return true;
    const states = p.getAllStates();
    if ("persistent_bit" in states && "update_bit" in states) {
      return true;
    }
  } catch {
    // Ignore unresolvable block types
  }
  return false;
}

function isLikelyLogIdOrPermutation(typeId: string, perm?: BlockPermutation): boolean {
  if (typeId.includes("bamboo") || CRAFTED_WOOD_EXCLUSION.test(typeId)) return false;
  if (LOG_ID_PATTERN.test(typeId)) return true;
  try {
    const p = perm ?? BlockPermutation.resolve(typeId);
    if (p.hasTag("log") || p.hasTag("minecraft:log")) return true;
  } catch {
    // Ignore unresolvable block types
  }
  return false;
}

/**
 * Bedrock natural leaf decay distance: Manhattan (taxicab) distance <= 4 from a log.
 * Ref: https://minecraft.wiki/w/Leaves#Usage
 */
export const decay_radius = 4;

/**
 * Maximum number of leaf blocks decayed per tick batch per dimension.
 */
export const leaf_loop_limit = 15;

/**
 * Minimum and maximum delay (in game ticks) between decay batches.
 */
export const leaf_loop_min_tick_delay = 4;
export const leaf_loop_max_tick_delay = 10;

/**
 * O(1) check whether a BlockPermutation is a leaf.
 */
export function isPermutationLeaf(perm: BlockPermutation): boolean {
  const id = perm.type.id;
  if (leaf_types.has(id)) return true;
  if (isLikelyLeafIdOrPermutation(id, perm)) {
    leaf_types.add(id);
    return true;
  }
  return false;
}

/**
 * O(1) check whether a BlockPermutation is a log/wood/stem/hyphae.
 */
export function isPermutationLog(perm: BlockPermutation): boolean {
  const id = perm.type.id;
  if (log_types.has(id)) return true;
  if (isLikelyLogIdOrPermutation(id, perm)) {
    log_types.add(id);
    return true;
  }
  return false;
}

/**
 * O(1) check whether a live Block in the world is a leaf block.
 */
export function isLeaf(block: Block | undefined): boolean {
  if (!block || !block.isValid) return false;
  const id = block.typeId;
  if (leaf_types.has(id)) return true;
  return isPermutationLeaf(block.permutation);
}

/**
 * O(1) check whether a live Block in the world is a log/wood block.
 */
export function isLog(block: Block | undefined): boolean {
  if (!block || !block.isValid) return false;
  const id = block.typeId;
  if (log_types.has(id)) return true;
  return isPermutationLog(block.permutation);
}

/**
 * Tests whether a leaf block is eligible to decay naturally.
 * Player-placed leaves have `persistent_bit` set to `true` (or `1` in legacy states)
 * and never decay.
 */
export function isBreakableLeaf(block: Block | undefined): boolean {
  if (!isLeaf(block)) return false;
  const states = block!.permutation.getAllStates();
  const persistentBit = states["persistent_bit"];
  // If the block has a persistent_bit state, it must be false (or 0) to decay
  if (persistentBit !== undefined) {
    return persistentBit === false || persistentBit === 0;
  }
  // Custom add-on leaves using custom states or default non-persistent state
  const customPersistent = states["minecraft:persistent"];
  if (customPersistent !== undefined) {
    return customPersistent === false || customPersistent === 0;
  }
  return true;
}