import { system, world, Block, Dimension, BlockEventOptions, BlockPermutation } from "@minecraft/server";
import LeafFinder from "./LeafFinder";
import LogFinder from "./LogFinder";
import { log_types, leaf_types, leaf_loop_limit, leaf_loop_max_tick_delay, leaf_loop_min_tick_delay } from "./global_values";
import { Vector3 } from "./VectorSet";
import VectorSet from "./VectorSet";

const log_options: BlockEventOptions = {
  blockTypes: Array.from(log_types).concat(Array.from(leaf_types))
};

const leafLocs: VectorSet = new VectorSet();

world.beforeEvents.playerBreakBlock.subscribe((event: { block: Block }) => {
  const block: Block = event.block; // Block that's broken
  console.log("player break block");
  findLeavesFromBlock(block);
}, log_options);

function findLeavesFromBlock(block: Block): void {
  const finder: LeafFinder = new LeafFinder();
  leafLocs.mergeWith(finder.findConnectedLeaves(block, 0));
  runLeafLoop();
}

function runLeafLoop(): void {
  const leafCount: number = leafLocs.getSize();
  if (0 < leafCount) {
    const delay = leaf_loop_min_tick_delay + Math.floor(Math.random() *
      (leaf_loop_max_tick_delay - leaf_loop_min_tick_delay));
    system.runTimeout(leafLoop, delay);
  }
}

function leafLoop(): void {
  const logFinder: LogFinder = new LogFinder();
  let loopCount = 0;
  while (0 < leafLocs.getSize()) {
    logFinder.reset();
    const blockLoc: Vector3 = leafLocs.removeOne();
    // TODO: Make work for all dimensions
    // Could possibly have a leafLoop/leafLocs for each dimension
    // Trees can be in other dimensions because a player plants a 
    // tree in that dimension.
    const dimension: Dimension = world.getDimension("overworld");
    const block: Block = dimension.getBlock(blockLoc);
    try {
      if (logFinder.isConnectedToLog(block, 0)) continue;
      decayLeaf(block);
    } catch (_error) {
      leafLocs.add(block.location);
      break;
    }
    if (leaf_loop_limit <= ++loopCount) break;
  }
  runLeafLoop();
}

function decayLeaf(block: Block): void {
  const permutation: BlockPermutation = block.permutation;
  if (!permutation.getState("persistent_bit")) {
    block.dimension.runCommandAsync(`setblock ${block.x} ${block.y} ${block.z} air destroy`);
    findLeavesFromBlock(block); // need to track blocks we are breaking
  }
}
