![Logo for Spoiled Leaves](/BP/pack_icon.png?raw=true)
# Spoiled Leaves
Fast leaf decay for Minecraft Bedrock edition

[![Spoiled Leaves demo video](http://img.youtube.com/vi/dpRgwTGUPd4/0.jpg)](http://www.youtube.com/watch?v=dpRgwTGUPd4)

https://youtu.be/dpRgwTGUPd4

Just install the add-on and add to a world. Uses only stable `@minecraft/server` (`2.10.0`) APIs—no experimental toggles required.

### Features & Architecture
- **True Bedrock Decay Mechanics (Iterative BFS):** Uses iterative Breadth-First Search (BFS) with outer-ring pruning (`Manhattan distance <= 4`) and $O(1)$ Swap-and-Pop spatial hashing (`VectorSet` + `Vector3Utils`) to mirror vanilla Bedrock leaf decay without recursion limits or DFS depth-shadowing.
- **Future-Proof & Custom Add-On Compatible:** Includes all vanilla logs, woods, stems, hyphae, stripped variants, and leaves through `1.26.70` (including Pale Oak and Poplar), plus runtime auto-discovery via `BlockTypes.getAll()` on `worldLoad` to automatically support future Minecraft updates and third-party custom tree add-ons.
- **Zero Tick Spikes:** Processes leaf decay in bounded batches per tick with a single guarded timer per dimension.

Read [the story of this add-on's creation](https://fabricatedtechnobabble.com/blog/2024/2/10/fast-leaf-decay-for-minecraft-bedrock-edition) on my blog.
