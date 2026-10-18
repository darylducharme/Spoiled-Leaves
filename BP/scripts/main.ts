import {
  system,
  world,
  Block,
  Dimension,
  PlayerBreakBlockAfterEvent,
  BlockExplodeAfterEvent
} from "@minecraft/server";
import LeafFinder from "./LeafFinder";
import LogFinder from "./LogFinder";
import {
  decay_radius,
  discoverDynamicTreeBlocks,
  isBreakableLeaf,
  isPermutationLeaf,
  isPermutationLog,
  leaf_loop_limit,
  leaf_loop_max_tick_delay,
  leaf_loop_min_tick_delay
} from "./global_values";
import VectorSet, { Vector3 } from "./VectorSet";

const leafLocs: Map<string, VectorSet> = new Map<string, VectorSet>();
const activeDimensionTimers: Set<string> = new Set<string>();
const leafFinder = new LeafFinder();
const logFinder = new LogFinder();

/**
 * Each dimension has its own pending leaf set.
 */
function getDimensionLocs(dimension: Dimension): VectorSet {
  let set = leafLocs.get(dimension.id);
  if (!set) {
    set = new VectorSet();
    leafLocs.set(dimension.id, set);
  }
  return set;
}

/**
 * Enqueues connected breakable leaves within `radius` of `origin`
 * and ensures the dimension's decay loop is scheduled.
 */
function enqueueLeavesAround(dimension: Dimension, origin: Vector3, radius: number): void {
  const dimensionLocs = getDimensionLocs(dimension);
  const found = leafFinder.findConnectedLeaves(dimension, origin, radius);
  dimensionLocs.mergeWith(found);
  scheduleLeafLoop(dimension);
}

/**
 * Schedules a single leaf decay timer per dimension if leaves are waiting
 * and a timer is not already pending (prevents timer explosion).
 */
function scheduleLeafLoop(dimension: Dimension): void {
  const dimensionLocs = getDimensionLocs(dimension);
  if (dimensionLocs.getSize() === 0 || activeDimensionTimers.has(dimension.id)) {
    return;
  }

  activeDimensionTimers.add(dimension.id);
  const delay =
    leaf_loop_min_tick_delay +
    Math.floor(Math.random() * (leaf_loop_max_tick_delay - leaf_loop_min_tick_delay + 1));

  system.runTimeout(() => {
    activeDimensionTimers.delete(dimension.id);
    leafLoop(dimension);
  }, delay);
}

/**
 * Processes up to `leaf_loop_limit` queued leaf coordinates per batch.
 */
function leafLoop(dimension: Dimension): void {
  let decayedCount = 0;
  let checkedCount = 0;
  const maxChecksPerTick = leaf_loop_limit * 3;
  const dimensionLocs = getDimensionLocs(dimension);

  while (dimensionLocs.getSize() > 0 && decayedCount < leaf_loop_limit && checkedCount < maxChecksPerTick) {
    checkedCount++;
    const blockLoc: Vector3 = dimensionLocs.removeOne();

    let block: Block | undefined;
    try {
      block = dimension.getBlock(blockLoc);
    } catch {
      // Chunk may have unloaded; re-queue for later and stop this batch
      dimensionLocs.add(blockLoc);
      break;
    }

    // Fast O(1) guard: skip air, unloaded blocks, or player-placed persistent leaves
    if (!block || !isBreakableLeaf(block)) {
      continue;
    }

    try {
      if (logFinder.isConnectedToLog(block)) {
        continue;
      }
      if (decayLeaf(block)) {
        decayedCount++;
      }
    } catch {
      dimensionLocs.add(blockLoc);
      break;
    }
  }

  scheduleLeafLoop(dimension);
}

/**
 * Breaks a single non-persistent leaf block using `setblock ... air destroy`
 * so vanilla loot tables (saplings, sticks, apples), particles, and sounds trigger.
 * Then enqueues only its 6 face-adjacent breakable leaf neighbors (radius = 1).
 */
function decayLeaf(block: Block): boolean {
  if (!isBreakableLeaf(block)) return false;
  const { dimension, location } = block;
  dimension.runCommand(`setblock ${location.x} ${location.y} ${location.z} air destroy`);
  // Only immediate 6 neighbors (radius = 1) could have lost a path directly through this leaf
  enqueueLeavesAround(dimension, location, 1);
  return true;
}

// 1. Discover any new vanilla update or custom add-on wood/leaf blocks once world loads
world.afterEvents.worldLoad.subscribe(() => {
  discoverDynamicTreeBlocks();
});

// 2. When a player breaks a log or leaf (afterEvents ensures the broken block is already air!)
world.afterEvents.playerBreakBlock.subscribe((event: PlayerBreakBlockAfterEvent) => {
  discoverDynamicTreeBlocks();
  const brokenPerm = event.brokenBlockPermutation;
  if (isPermutationLog(brokenPerm)) {
    enqueueLeavesAround(event.dimension, event.block.location, decay_radius);
  } else if (isPermutationLeaf(brokenPerm)) {
    enqueueLeavesAround(event.dimension, event.block.location, 1);
  }
});

// 3. Also trigger fast leaf decay when explosions (Creepers, TNT, Ghasts) destroy tree trunks
world.afterEvents.blockExplode.subscribe((event: BlockExplodeAfterEvent) => {
  discoverDynamicTreeBlocks();
  const explodedPerm = event.explodedBlockPermutation;
  if (isPermutationLog(explodedPerm)) {
    enqueueLeavesAround(event.dimension, event.block.location, decay_radius);
  }
});
