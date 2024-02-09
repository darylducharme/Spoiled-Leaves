import { system, world, Block, Dimension, BlockEventOptions, BlockPermutation } from "@minecraft/server";
import LeafFinder from "./LeafFinder";
import LogFinder from "./LogFinder";
import { connectedBlockTypes, isBreakableLeaf, isLeaf, leaf_loop_limit, leaf_loop_max_tick_delay, leaf_loop_min_tick_delay } from "./global_values";
import { Vector3 } from "./VectorSet";
import VectorSet from "./VectorSet";

const log_options: BlockEventOptions = {
  blockTypes: connectedBlockTypes
};

const leafLocs: Map<string, VectorSet> = new Map<string, VectorSet>();

function getDimensionLocs(dimension: Dimension): VectorSet {
  if (!leafLocs.has(dimension.id)) {
    leafLocs.set(dimension.id, new VectorSet());
  }
  const value = leafLocs.get(dimension.id);
  if (!value) throw new Error(`[Unexpected Error]Somehow leaf locations are undefined for ${dimension.id}`);
  return value;
}

function findLeavesFromBlock(block: Block): void {
  const finder: LeafFinder = new LeafFinder();
  const dimension = block.dimension;
  const dimensionLocs = getDimensionLocs(dimension);
  dimensionLocs.mergeWith(finder.findConnectedLeaves(block, 0));
  runLeafLoop(dimension);
}

function runLeafLoop(dimension: Dimension): void {
  const dimensionLocs = getDimensionLocs(dimension);
  const leafCount: number = dimensionLocs.getSize();
  if (0 < leafCount) {
    const delay = leaf_loop_min_tick_delay + Math.floor(Math.random() *
      (leaf_loop_max_tick_delay - leaf_loop_min_tick_delay));
    system.runTimeout(() => leafLoop(dimension), delay);
  }
}

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

function decayLeaf(block: Block): void {
  if (isBreakableLeaf(block)) {
    block.dimension.runCommandAsync(`setblock ${block.x} ${block.y} ${block.z} air destroy`);
    findLeavesFromBlock(block); // need to track blocks we are breaking
  }
}

world.beforeEvents.playerBreakBlock.subscribe((event: { block: Block }) => {
  const block: Block = event.block; // Block that's broken
  const tags: String[] = block.getTags();
  console.log("Block tags: " + tags.toString());
  findLeavesFromBlock(block);
}, log_options);

