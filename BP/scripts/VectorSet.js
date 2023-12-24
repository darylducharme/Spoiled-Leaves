/**
* A set like structure for Vector objects, since JS uses === equality
*/
export default class VectorSet {

  constructor() {
    /** @type {Map<Number, YZSet>} */
    this.xMap = new Map();
  }

  /**
  * @param vector {{x:number, y:number, z:number}}
  */
  add(vector) {
    if (!this.xMap.has(vector.x)) {
      this.xMap.set(vector.x, new YZSet());
    }
    /* @type {YZSet} */
    const yMap = this.xMap.get(vector.x);
    yMap.add(vector);
  }

  /**
  * @param vector {{x:number, y:number, z:number}}
  **/
  has(vector) {
    if (this.xMap.has(vector.x)) {
      /* @type {YZSet} */
      const yMap = this.xMap.get(vector.x);
      return yMap.has(vector);
    }
  }

  clear() {
    this.xMap.clear();
  }

  /**
  * @param vectorSet {VectorSet}
  */
  mergeWith(vectorSet) {
    vectorSet.xMap.forEach((yzSet, x) => {
      if (this.xMap.has(x)) {
        this.xMap.get(x).mergeWith(yzSet);
      } else {
        this.xMap.set(x, yzSet);
      }
    });
  }

  getSize() {
    let value = 0;
    this.xMap.forEach((yzSet) => {
      value += yzSet.getSize();
    });
    return value;
  }

  /**
  * @param vector {{x:number, y:number, z:number}}
  */
  delete(vector) {
    if (this.xMap.has(vector.x)) {
      const yzMap = this.xMap.get(vector.x);
      yzMap.delete(vector);
      if (yzMap.getSize() == 0) {
        this.xMap.delete(vector.x);
      }
    }
  }

  /**
  * @returns {{x: number, y: number, z: number}}
  */
  removeOne() {
    if (0 < this.xMap.size) {
      const xMapKeys = [...this.xMap.keys()];
      const xVal = xMapKeys[Math.floor(Math.random() * xMapKeys.length)];
      const yzSet = this.xMap.get(xVal);
      const yzVal = yzSet.removeOne();
      const result = { x: xVal, y: yzVal.y, z: yzVal.z };
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
  constructor() {
    /** @type {Map<Number, Set<Number>>} */
    this.yMap = new Map();
  }

  /**
  * @param vector {{y:number, z:number}}
  */
  add(vector) {
    if (!this.yMap.has(vector.y)) {
      this.yMap.set(vector.y, new Set());
    }
    const zSet = this.yMap.get(vector.y);
    zSet.add(vector.z);
  }

  /**
  * @param vector {{y:number, z:number}}
  **/
  has(vector) {
    if (this.yMap.has(vector.y)) {
      const zSet = this.yMap.get(vector.y);
      return zSet.has(vector.z);
    }
    return false;
  }

  /**
  * @param yzSet {YZSet}
  */
  mergeWith(yzSet) {
    yzSet.yMap.forEach((zSet, y) => {
      if (this.yMap.has(y)) {
        this.yMap.set(y, new Set([...this.yMap.get(y), ...zSet]));
      } else {
        this.yMap.set(y, zSet);
      }
    });
  }

  getSize() {
    let value = 0;
    this.yMap.forEach((zSet) => {
      value += zSet.size;
    });
    return value;
  }

  /**
  * @param vector {{y:number, z:number}}
  */
  delete(vector) {
    if (this.yMap.has(vector.y)) {
      const zSet = this.yMap.get(vector.y);
      zSet.delete(vector.z);
      if (zSet.size == 0) {
        this.yMap.delete(vector.y);
      }
    }
  }

  /**
  * @returns {{y: number, z: number}}
  */
  removeOne() {
    if (0 < this.yMap.size) {
      const yMapKeys = [...this.yMap.keys()];
      /** @type {number} */
      const yVal = yMapKeys[Math.floor(Math.random() * yMapKeys.length)];
      const zSet = this.yMap.get(yVal);
      /** @type {number} */
      const zVal = [...zSet][Math.floor(Math.random() * zSet.size)];//zSet.values().next().value;
      const result = { y: yVal, z: zVal };
      this.delete(result);
      return result;
    }
    throw new Error("No YZfet entries to remove");
  }
}
