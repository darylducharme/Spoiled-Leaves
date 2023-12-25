/**
* The type IDs for tree blocks
* 
* TODO: add nether trees and the  _wood variants
*/
export const log_types: Set<string> = new Set([
  "minecraft:oak_log",
  "minecraft:spruce_log",
  "minecraft:birch_log",
  "minecraft:jungle_log",
  "minecraft:acacia_log",
  "minecraft:dark_oak_log",
  "minecraft:mangrove_log",
  "minecraft:cherry_log"
]);

/**
 * The type IDs for leaf blocks
 */
export const leaf_types: Set<string> = new Set([
  "minecraft:leaves",
  "minecraft:leaves2",
  "minecraft:mangrove_leaves",
  "minecraft:cherry_leaves",
  "minecraft:azalea_leaves",
  "minecraft:azalea_leaves_flowered"
]);

// the radius around a log that leaves may now decay
export const decay_radius: number = 4;

