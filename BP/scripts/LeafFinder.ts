import { Block } from "@minecraft/server";
import { decay_radius, leaf_types } from "./global_values";
import VectorSet from "./VectorSet";

export default class LeafFinder {
  private visitedBlocks: VectorSet;

  constructor() {
    this.visitedBlocks = new VectorSet();
  }

  /**
  * @param block {Block}
  * @param depth {number}
  * 
  * @return {VectorSet}
  */
  findConnectedLeaves(block: Block, depth: number) {
    let leafLocs = new VectorSet();
    if (block == undefined || this.visitedBlocks.has(block.location)) return leafLocs;
    this.visitedBlocks.add(block.location);
    const blockId = block.typeId;
    if (depth == 0 || leaf_types.has(blockId)) {
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
