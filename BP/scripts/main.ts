import { system, world, Block, Dimension, BlockEventOptions } from "@minecraft/server";
import LeafFinder from "./LeafFinder";
import LogFinder from "./LogFinder";
import { connectedBlockTypes, isBreakableLeaf, leaf_loop_limit, leaf_loop_max_tick_delay, leaf_loop_min_tick_delay } from "./global_values";
import { Vector3 } from "./VectorSet";
import VectorSet from "./VectorSet";

const log_options: BlockEventOptions = {
  blockTypes: connectedBlockTypes
};

const leafLocs: Map<string, VectorSet> = new Map<string, VectorSet>();

/**
 * Each dimension has its own leaf loop. This gets the leaf block locations
 * for a specific dimension
 */
function getDimensionLocs(dimension: Dimension): VectorSet {
  if (!leafLocs.has(dimension.id)) {
    leafLocs.set(dimension.id, new VectorSet());
  }
  const value = leafLocs.get(dimension.id);
  if (!value) throw new Error(`[Unexpected Error]Somehow leaf locations are undefined for ${dimension.id}`);
  return value;
}

/**
 * Given a block, find leaf block locations for blocks that are connected
 * to it within the leaf decay radius from it.
 * 
 * Saves the block locations to the dimension's leaf loop and starts the
 * leaf loop if leaf blocks are found and it isn't already running.
 */
function findLeavesFromBlock(block: Block): void {
  const finder: LeafFinder = new LeafFinder();
  const dimension = block.dimension;
  const dimensionLocs = getDimensionLocs(dimension);
  dimensionLocs.mergeWith(finder.findConnectedLeaves(block, 0));
  runLeafLoop(dimension);
}

/**
 * Starts the leaf loop for a dimension if that dimension has leaf block
 * locations to process.
 */
function runLeafLoop(dimension: Dimension): void {
  const dimensionLocs = getDimensionLocs(dimension);
  const leafCount: number = dimensionLocs.getSize();
  if (0 < leafCount) {
    const delay = leaf_loop_min_tick_delay + Math.floor(Math.random() *
      (leaf_loop_max_tick_delay - leaf_loop_min_tick_delay));
    system.runTimeout(() => leafLoop(dimension), delay);
  }
}

/**
 * A single call of the leaf loop for a dimension.
 * 
 * Will process leaf block locations for a dimension until either the
 * loop limit is reached, and error occurs (expected and handled), or
 * there are no more block locations to process for the dimension.
 * 
 * Will attempt to trigger the leaf loop to start again.
 */
function leafLoop(dimension: Dimension): void {
  const logFinder: LogFinder = new LogFinder();
  let loopCount = 0;
  const dimensionLocs = getDimensionLocs(dimension);
  while (0 < dimensionLocs.getSize()) {
    logFinder.reset();
    const blockLoc: Vector3 = dimensionLocs.removeOne();
    const block: Block | undefined = dimension.getBlock(blockLoc);
    if (!block) continue;
    try {
      if (logFinder.isConnectedToLog(block, 0)) continue;
      decayLeaf(block);
    } catch (_error) {
      dimensionLocs.add(block.location);
      break;
    }
    if (leaf_loop_limit <= ++loopCount) break;
  }
  runLeafLoop(dimension);
}

/**
 * Makes an attempt to break a leaf block
 * 
 * Only takes action if it is valid to break
 * If it breaks the block, makes sure to  track that as we may need to 
 * add new blocks to be cleared.
 */
function decayLeaf(block: Block): void {
  if (isBreakableLeaf(block)) {
    block.dimension.runCommandAsync(`setblock ${block.x} ${block.y} ${block.z} air destroy`);
    findLeavesFromBlock(block); // need to track blocks we are breaking
  }
}

/**
 * Handler for when a player breaks a block.
 */
world.beforeEvents.playerBreakBlock.subscribe((event: { block: Block }) => {
  const block: Block = event.block; // Block that's broken
  findLeavesFromBlock(block);
}, log_options);

