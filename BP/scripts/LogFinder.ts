import { Block, Vector3 } from "@minecraft/server";
import { decay_radius, isLeaf, isLog } from "./global_values";
import { CARDINAL_OFFSETS, Vector3Utils } from "./VectorSet";

interface BfsNode {
  pos: Vector3;
  depth: number;
}

/**
 * Breadth-First Search (BFS) utility to determine if a leaf block is connected
 * to any log/wood/stem/hyphae block within Bedrock's natural Manhattan decay radius (4).
 *
 * Key optimizations over the legacy recursive DFS:
 * 1. Shortest-path guarantee: Checks distance 1 (<= 6 blocks), then 2, then 3, then 4.
 *    If a log is adjacent or 2 blocks away, BFS finds it immediately instead of plunging
 *    4 blocks deep along a single axis first.
 * 2. Fixes the DFS depth-shadowing bug where a winding path visited a neighbor at depth 4
 *    first and blocked a valid depth-2 path to a log.
 * 3. Outer-ring pruning: At depth === decay_radius (4), only checks if neighbors are logs
 *    without pushing depth-4 leaves into the queue (saving >50% of queue allocations).
 */
export default class LogFinder {
  private visitedKeys: Set<string> = new Set<string>();

  reset(): void {
    this.visitedKeys.clear();
  }

  isConnectedToLog(startBlock: Block): boolean {
    if (!startBlock || !startBlock.isValid) return false;
    if (isLog(startBlock)) return true;

    const dimension = startBlock.dimension;
    const origin = startBlock.location;
    this.visitedKeys.clear();
    this.visitedKeys.add(Vector3Utils.toKey(origin));

    const queue: BfsNode[] = [{ pos: origin, depth: 0 }];
    let head = 0;

    while (head < queue.length) {
      const { pos, depth } = queue[head++];
      const nextDepth = depth + 1;

      for (let i = 0; i < CARDINAL_OFFSETS.length; i++) {
        const offset = CARDINAL_OFFSETS[i];
        const neighborPos: Vector3 = {
          x: pos.x + offset.x,
          y: pos.y + offset.y,
          z: pos.z + offset.z
        };
        const key = Vector3Utils.toKey(neighborPos);
        if (this.visitedKeys.has(key)) continue;
        this.visitedKeys.add(key);

        const neighborBlock = dimension.getBlock(neighborPos);
        if (!neighborBlock || !neighborBlock.isValid) continue;

        if (isLog(neighborBlock)) {
          return true;
        }

        // Only expand further if we haven't reached the max Manhattan radius (4)
        // and the intermediate block is a leaf (only leaves conduct log support).
        if (nextDepth < decay_radius && isLeaf(neighborBlock)) {
          queue.push({ pos: neighborPos, depth: nextDepth });
        }
      }
    }

    return false;
  }
}