import { Block } from "@minecraft/server";
import { log_types, leaf_types, decay_radius } from "./global_values";
import VectorSet from "./VectorSet";

export default class LogFinder {
  private visitedBlocks: VectorSet;

  constructor() {
    this.visitedBlocks = new VectorSet();
  }

  reset(): void {
    this.visitedBlocks.clear();
  }

  isConnectedToLog(block: Block, depth: number): boolean {
    if (block == null || this.visitedBlocks.has(block.location)) return false;
    this.visitedBlocks.add(block.location);
    const blockId = block.typeId;
    if (log_types.has(blockId)) return true;
    if (depth == 0 || leaf_types.has(blockId)) {
      if (depth <= decay_radius) {
        const newDepth = depth + 1;
        return this.isConnectedToLog(block.north(), newDepth) ||
          this.isConnectedToLog(block.east(), newDepth) ||
          this.isConnectedToLog(block.west(), newDepth) ||
          this.isConnectedToLog(block.south(), newDepth) ||
          this.isConnectedToLog(block.above(), newDepth) ||
          this.isConnectedToLog(block.below(), newDepth);
      }
    }
    return false;
  }
}