# 白髪ロングの女勇者

- 保存先：`docs/assets/heroine.webp`
- 形式：透過WebP、512×1024、4列×8行。上4行が移動、下4行が攻撃・回避・被弾。
- 生成方式：imagegenスキルの組み込み画像生成。生成後にゲーム用の寸法・WebPへ変換。元の茶髪の旅人は保持。
- 外見による能力差なし。

## 生成プロンプト

Asset type: production pixel art RPG character sprite atlas, transparent background. Create ONE precisely aligned sprite sheet with FOUR EQUAL COLUMNS and EIGHT EQUAL ROWS, 32 sprites total, portrait aspect ratio 1:2, ideally 1024x2048. Every invisible cell is exactly the same size, character standing feet at the same baseline, character entire body and sword entirely inside each cell, generous transparent padding between cells. Subject in EVERY cell: the SAME adult female heroic adventurer with very long white/silver hair reaching waist, small silver shoulder armor over a dark teal tunic, blue capelet, dark leggings and brown boots, steel sword. Readable face and silhouette. Elegant brave fantasy heroine, not sexualized. Match polished 32-bit era top-down dungeon RPG sprites, crisp nearest-neighbor pixel blocks, limited palette, 3/4 overhead view, no antialiased painting. Rows 1-4: walking cycle four frames each, directions in row order SOUTH facing viewer, WEST facing left, EAST facing right, NORTH back facing away. Columns idle/left-step/idle/right-step. Rows 5-8: same four directions in same order SOUTH/WEST/EAST/NORTH, columns sword windup / sword strike / dodge crouch / hurt recoil. Keep body sizes identical throughout all 32 cells, white hair consistent from all directions; back-facing sprite shows the long white hair. No labels, no text, no numbers, no frame borders, no grid lines, no scenery, no glow, no shadows outside sprite. True transparent background.
