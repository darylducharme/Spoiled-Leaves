import { assertEquals } from "@std/assert";
import VectorSet, { CARDINAL_OFFSETS, Vector3Utils } from "./BP/scripts/VectorSet.ts";

Deno.test("Vector3Utils - key serialization, addition, equality, and Manhattan distance", () => {
  const a = { x: 10, y: 64, z: -5 };
  const b = { x: 12, y: 63, z: -2 };

  assertEquals(Vector3Utils.toKey(a), "10,64,-5");
  assertEquals(Vector3Utils.equals(a, { x: 10, y: 64, z: -5 }), true);
  assertEquals(Vector3Utils.equals(a, b), false);
  assertEquals(Vector3Utils.add(a, { x: -2, y: 1, z: 5 }), { x: 8, y: 65, z: 0 });
  assertEquals(Vector3Utils.manhattanDistance(a, b), 2 + 1 + 3);
  assertEquals(CARDINAL_OFFSETS.length, 6);
});

Deno.test("VectorSet - O(1) deduplication, merge, delete, and Swap-and-Pop removeOne", () => {
  const setA = new VectorSet();
  setA.add({ x: 1, y: 2, z: 3 });
  setA.add({ x: 1, y: 2, z: 3 }); // Duplicate
  setA.add({ x: 4, y: 5, z: 6 });

  assertEquals(setA.getSize(), 2);
  assertEquals(setA.has({ x: 1, y: 2, z: 3 }), true);
  assertEquals(setA.has({ x: 9, y: 9, z: 9 }), false);

  const setB = new VectorSet();
  setB.add({ x: 4, y: 5, z: 6 }); // Overlap with setA
  setB.add({ x: 7, y: 8, z: 9 });

  setA.mergeWith(setB);
  assertEquals(setA.getSize(), 3);

  setA.delete({ x: 4, y: 5, z: 6 });
  assertEquals(setA.getSize(), 2);
  assertEquals(setA.has({ x: 4, y: 5, z: 6 }), false);

  const firstPopped = setA.removeOne();
  assertEquals(setA.has(firstPopped), false);
  assertEquals(setA.getSize(), 1);

  const secondPopped = setA.removeOne();
  assertEquals(setA.has(secondPopped), false);
  assertEquals(setA.getSize(), 0);
});
