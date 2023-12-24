import { system, world, Block } from "@minecraft/server";
import LeafFinder from "./LeafFinder";
import LogFinder from "./LogFinder";
import { log_types, leaf_types } from "./global_values";
import VectorSet from "./VectorSet";

const log_options = {
  blockTypes: Array.from(log_types).concat(Array.from(leaf_types))
};

const leafLocs = new VectorSet();

world.beforeEvents.playerBreakBlock.subscribe((event) => {
  const block = event.block; // Block that's broken
  findLeavesFromBlock(block);
}, log_options);

/**
 * @param block {Block}
 */
function findLeavesFromBlock(block) {
  const finder = new LeafFinder();
  leafLocs.mergeWith(finder.findConnectedLeaves(block, 0));
  runLeafLoop();
}

function runLeafLoop() {
  const leafCount = leafLocs.getSize();
  if (0 < leafCount) {
    // TODO: use runTimeout with a random number been min/max number of ticks
    // set min/max ticks for loop delay in global_values
    system.run(leafLoop);
  }
}

// TODO: pull out global variables
const loopLimit = 16;

function leafLoop() {
  const logFinder = new LogFinder();
  let loopCount = 0;
  while (0 < leafLocs.getSize()) {
    logFinder.reset();
    const blockLoc = leafLocs.removeOne();
    // TODO: Make work for all dimensions
    // Could possibly have a leafLoop/leafLocs for each dimension
    // Trees can be in other dimensions because a player plants a 
    // tree in that dimension.
    const dimension = world.getDimension("overworld");
    const block = dimension.getBlock(blockLoc);
    try {
      if (logFinder.isConnectedToLog(block, 0)) continue;
      decayLeaf(block);
    } catch (error) {
      leafLocs.add(block.location);
      break;
    }
    if (loopLimit <= ++loopCount) break;
  }
  runLeafLoop();
}

/**
 *  @param block {Block}
 */
function decayLeaf(block) {
  const permutation = block.permutation;
  if (!permutation.getState("persistent_bit")) {
    block.dimension.runCommandAsync(`setblock ${block.x} ${block.y} ${block.z} air destroy`);
    findLeavesFromBlock(block); // need to track blocks we are breaking
  }
}
