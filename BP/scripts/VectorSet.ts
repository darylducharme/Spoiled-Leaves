interface Vector2 {
  y: number;
  z: number;
}

export interface Vector3 extends Vector2 {
  x: number;
}

export default class VectorSet {

  xMap: Map<number, YZSet>;

  constructor() {
    this.xMap = new Map<number, YZSet>();
    console.log("In VectorSet constructor");
  }

  add(vector: Vector3): void {
    if (!this.xMap.has(vector.x)) {
      this.xMap.set(vector.x, new YZSet());
    }
    const yMap: YZSet = this.xMap.get(vector.x);
    yMap.add(vector);
  }

  has(vector: Vector3): boolean {
    if (this.xMap.has(vector.x)) {
      const yMap: YZSet = this.xMap.get(vector.x);
      return yMap.has(vector);
    }
    return false;
  }

  clear(): void {
    this.xMap.clear();
  }

  mergeWith(vectorSet: VectorSet): void {
    vectorSet.xMap.forEach((yzSet: YZSet, x: number) => {
      if (this.xMap.has(x)) {
        this.xMap.get(x).mergeWith(yzSet);
      } else {
        this.xMap.set(x, yzSet);
      }
    });
  }

  getSize(): number {
    let value = 0;
    this.xMap.forEach((yzSet: YZSet) => {
      value += yzSet.getSize();
    });
    return value;
  }

  delete(vector: Vector3): void {
    if (this.xMap.has(vector.x)) {
      const yzMap: YZSet = this.xMap.get(vector.x);
      yzMap.delete(vector);
      if (yzMap.getSize() == 0) {
        this.xMap.delete(vector.x);
      }
    }
  }

  removeOne(): Vector3 {
    if (0 < this.xMap.size) {
      const xMapKeys: number[] = [...this.xMap.keys()];
      const xVal: number = xMapKeys[Math.floor(Math.random() * xMapKeys.length)];
      const yzSet: YZSet = this.xMap.get(xVal);
      const yzVal: { y: number, z: number } = yzSet.removeOne();
      const result: { x: number, y: number, z: number } = { x: xVal, y: yzVal.y, z: yzVal.z };
      this.delete(result);
      return result;
    }
    throw new Error("No VectorSet entries to remove");
  }
}

/**
 * Helper class for VectorSet.
 *
 * Simplifies the nesting of the Maps and Set
 */
class YZSet {
  yMap: Map<number, Set<number>>;

  constructor() {
    this.yMap = new Map<number, Set<number>>();
  }

  add(vector: Vector2): void {
    if (!this.yMap.has(vector.y)) {
      this.yMap.set(vector.y, new Set<number>());
    }
    const zSet: Set<number> = this.yMap.get(vector.y);
    zSet.add(vector.z);
  }

  has(vector: Vector2): boolean {
    if (this.yMap.has(vector.y)) {
      const zSet: Set<number> = this.yMap.get(vector.y);
      return zSet.has(vector.z);
    }
    return false;
  }

  mergeWith(yzSet: YZSet): void {
    yzSet.yMap.forEach((zSet: Set<number>, y: number) => {
      if (this.yMap.has(y)) {
        this.yMap.set(y, new Set<number>([...this.yMap.get(y), ...zSet]));
      } else {
        this.yMap.set(y, zSet);
      }
    });
  }

  getSize(): number {
    let value = 0;
    this.yMap.forEach((zSet: Set<number>) => {
      value += zSet.size;
    });
    return value;
  }

  delete(vector: Vector2): void {
    if (this.yMap.has(vector.y)) {
      const zSet: Set<number> = this.yMap.get(vector.y);
      zSet.delete(vector.z);
      if (zSet.size == 0) {
        this.yMap.delete(vector.y);
      }
    }
  }

  removeOne(): Vector2 {
    if (0 < this.yMap.size) {
      const yMapKeys: number[] = [...this.yMap.keys()];
      const yVal: number = yMapKeys[Math.floor(Math.random() * yMapKeys.length)];
      const zSet: Set<number> = this.yMap.get(yVal);
      const zVal: number = [...zSet][Math.floor(Math.random() * zSet.size)];
      const result: { y: number, z: number } = { y: yVal, z: zVal };
      this.delete(result);
      return result;
    }
    throw new Error("No YZfet entries to remove");
  }
}
