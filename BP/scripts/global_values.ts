import { Block } from "@minecraft/server";

/**
* The type IDs for tree blocks
*/
const log_types: Set<string> = new Set([
  "minecraft:oak_log",
  "minecraft:spruce_log",
  "minecraft:birch_log",
  "minecraft:jungle_log",
  "minecraft:acacia_log",
  "minecraft:dark_oak_log",
  "minecraft:mangrove_log",
  "minecraft:cherry_log",
  "minecraft:crimson_stem",
  "minecraft:warped_stem",
  "minecraft:wood",
  "minecraft:mangrove_wood",
  "minecraft:cherry_wood",
  "minecraft:crimson_hyphae",
  "minecraft:warped_hyphae"
]);

/**
 * The type IDs for leaf blocks
 */
const leaf_types: Set<string> = new Set([
  "minecraft:leaves",
  "minecraft:leaves2",
  "minecraft:mangrove_leaves",
  "minecraft:cherry_leaves",
  "minecraft:azalea_leaves",
  "minecraft:azalea_leaves_flowered"
]);

export const connectedBlockTypes = Array.from(log_types).concat(Array.from(leaf_types));

/**
 * The radius around a log that leaves may now decay
 */
export const decay_radius = 4;

/**
 *  The maximum number of locations the leaf loop acts upon.
 */
export const leaf_loop_limit = 12;

/** 
 * The minimum delay, in ticks, before a leaf loop gets called
 */
export const leaf_loop_min_tick_delay = 8;
/**
 * The maximum delay, in ticks, before a leaf loop gets called
 */
export const leaf_loop_max_tick_delay = 15;

export function isBreakableLeaf(block: Block): boolean {
  return isPermutationInBlockIds(block, leaf_types, { "persistent_bit": 0 });
}

export function isLeaf(block: Block): boolean {
  return isPermutationInBlockIds(block, leaf_types);
}

export function isLog(block: Block): boolean {
  return isPermutationInBlockIds(block, log_types);
}

function isPermutationInBlockIds(block: Block, blockIds: Set<string>, states: Record<string, boolean | number | string> = null): boolean {
  const permutation = block.permutation;
  for (const blockId of blockIds) {
    if (permutation.matches(blockId, states)) {
      return true;
    }
  }
  return false;
}