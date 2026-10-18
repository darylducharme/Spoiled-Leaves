import { Dimension, Vector3 } from "@minecraft/server";
import { decay_radius, isBreakableLeaf, isLeaf } from "./global_values";
import VectorSet, { CARDINAL_OFFSETS, Vector3Utils } from "./VectorSet";

interface BfsNode {
  pos: Vector3;
  depth: number;
}

/**
 * Breadth-First Search (BFS) utility to find connected breakable leaf blocks
 * within a target Manhattan (taxicab) radius of a broken log or leaf.
 *
 * Why BFS instead of recursive DFS:
 * - Visits coordinates in strictly non-decreasing Manhattan distance (d = 1..maxRadius),
 *   preventing the DFS "depth-shadowing" bug where a long detour marks a nearby block
 *   visited at max depth and blocks shorter paths from expanding through it.
 */
export default class LeafFinder {
  findConnectedLeaves(
    dimension: Dimension,
    origin: Vector3,
    maxRadius: number = decay_radius
  ): VectorSet {
    const leafLocs = new VectorSet();
    const visited = new Set<string>([Vector3Utils.toKey(origin)]);
    const queue: BfsNode[] = [{ pos: origin, depth: 0 }];
    let head = 0;

    while (head < queue.length) {
      const { pos, depth } = queue[head++];
      if (depth >= maxRadius) continue;

      const nextDepth = depth + 1;
      for (let i = 0; i < CARDINAL_OFFSETS.length; i++) {
        const offset = CARDINAL_OFFSETS[i];
        const neighborPos: Vector3 = {
          x: pos.x + offset.x,
          y: pos.y + offset.y,
          z: pos.z + offset.z
        };
        const key = Vector3Utils.toKey(neighborPos);
        if (visited.has(key)) continue;
        visited.add(key);

        const neighborBlock = dimension.getBlock(neighborPos);
        if (!neighborBlock || !isLeaf(neighborBlock)) continue;

        // Only enqueue for decay if the leaf is non-persistent
        if (isBreakableLeaf(neighborBlock)) {
          leafLocs.add(neighborPos);
        }

        // Even player-placed leaves can conduct connectivity within the radius
        if (nextDepth < maxRadius) {
          queue.push({ pos: neighborPos, depth: nextDepth });
        }
      }
    }

    return leafLocs;
  }
}
