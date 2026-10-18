/**
 * 3D Vector interface representing a block or world coordinate.
 * Structurally identical to @minecraft/server.Vector3.
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * The 6 cardinal face-neighbor unit vectors (Manhattan step = 1).
 * Compatible with @minecraft/math directional constants.
 */
export const CARDINAL_OFFSETS: readonly Readonly<Vector3>[] = [
  { x: 0, y: 0, z: -1 }, // North
  { x: 0, y: 0, z: 1 },  // South
  { x: 1, y: 0, z: 0 },  // East
  { x: -1, y: 0, z: 0 }, // West
  { x: 0, y: 1, z: 0 },  // Up
  { x: 0, y: -1, z: 0 }  // Down
];

/**
 * Lightweight, zero-allocation Vector3 utility functions aligned with
 * the official @minecraft/math (microsoft/minecraft-scripting-libraries) API.
 */
export class Vector3Utils {
  static toKey(v: Vector3): string {
    return `${v.x},${v.y},${v.z}`;
  }

  static add(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }

  static equals(a: Vector3, b: Vector3): boolean {
    return a.x === b.x && a.y === b.y && a.z === b.z;
  }

  static manhattanDistance(a: Vector3, b: Vector3): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
  }
}

/**
 * O(1) Spatial Hash Set of Vector3 block coordinates using Swap-and-Pop.
 *
 * Replaces the legacy 3-level nested Map<number, Map<number, Set<number>>>
 * so that .add(), .has(), .delete(), .getSize(), and randomized .removeOne()
 * all execute in O(1) time with zero intermediate array-spread allocations.
 */
export default class VectorSet {
  private items: Vector3[] = [];
  private indexMap: Map<string, number> = new Map<string, number>();

  add(vector: Vector3): boolean {
    const key = Vector3Utils.toKey(vector);
    if (this.indexMap.has(key)) {
      return false;
    }
    this.indexMap.set(key, this.items.length);
    this.items.push({ x: vector.x, y: vector.y, z: vector.z });
    return true;
  }

  has(vector: Vector3): boolean {
    return this.indexMap.has(Vector3Utils.toKey(vector));
  }

  hasKey(key: string): boolean {
    return this.indexMap.has(key);
  }

  clear(): void {
    this.items.length = 0;
    this.indexMap.clear();
  }

  mergeWith(other: VectorSet): void {
    for (let i = 0; i < other.items.length; i++) {
      this.add(other.items[i]);
    }
  }

  getSize(): number {
    return this.items.length;
  }

  delete(vector: Vector3): boolean {
    return this.deleteByKey(Vector3Utils.toKey(vector));
  }

  private deleteByKey(key: string): boolean {
    const idx = this.indexMap.get(key);
    if (idx === undefined) {
      return false;
    }
    const lastIdx = this.items.length - 1;
    if (idx !== lastIdx) {
      const lastItem = this.items[lastIdx];
      this.items[idx] = lastItem;
      this.indexMap.set(Vector3Utils.toKey(lastItem), idx);
    }
    this.items.pop();
    this.indexMap.delete(key);
    return true;
  }

  /**
   * Removes and returns a uniformly random Vector3 from the set in O(1) time
   * using Swap-and-Pop (preserving organic canopy decay order).
   */
  removeOne(): Vector3 {
    const count = this.items.length;
    if (count === 0) {
      throw new Error("No VectorSet entries to remove");
    }
    const randIdx = Math.floor(Math.random() * count);
    const chosen = this.items[randIdx];
    this.deleteByKey(Vector3Utils.toKey(chosen));
    return chosen;
  }

  values(): readonly Vector3[] {
    return this.items;
  }
}
