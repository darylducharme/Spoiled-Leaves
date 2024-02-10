import { Block } from "@minecraft/server";
import { decay_radius, isLeaf } from "./global_values";
import VectorSet from "./VectorSet";

/**
 * Utility class to find a set of connected leaf block locations
 * with the global decay radius.
 */
export default class LeafFinder {
  private visitedBlocks: VectorSet;

  constructor() {
    this.visitedBlocks = new VectorSet();
  }

  findConnectedLeaves(block: Block, depth: number) {
    const leafLocs = new VectorSet();
    if (block == undefined || this.visitedBlocks.has(block.location)) return leafLocs;
    this.visitedBlocks.add(block.location);
    if (depth == 0 || isLeaf(block)) {
      if (depth != 0) leafLocs.add(block.location);
      if (depth < decay_radius) {
        const newDepth = depth + 1;
        leafLocs.mergeWith(this.findConnectedLeaves(block.north(), newDepth));
        leafLocs.mergeWith(this.findConnectedLeaves(block.east(), newDepth));
        leafLocs.mergeWith(this.findConnectedLeaves(block.west(), newDepth));
        leafLocs.mergeWith(this.findConnectedLeaves(block.south(), newDepth));
        leafLocs.mergeWith(this.findConnectedLeaves(block.above(), newDepth));
        leafLocs.mergeWith(this.findConnectedLeaves(block.below(), newDepth));
      }
    }

    return leafLocs;
  }
}
