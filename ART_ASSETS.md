# 白髪ロングの女勇者

- 保存先：`docs/assets/heroine.webp`
- 形式：透過WebP、512×1024、4列×8行。上4行が移動、下4行が攻撃・回避・被弾。
- 生成方式：imagegenスキルの組み込み画像生成。生成後にゲーム用の寸法・WebPへ変換。元の茶髪の旅人は保持。
- 外見による能力差なし。

## 生成プロンプト

Asset type: production pixel art RPG character sprite atlas, transparent background. Create ONE precisely aligned sprite sheet with FOUR EQUAL COLUMNS and EIGHT EQUAL ROWS, 32 sprites total, portrait aspect ratio 1:2, ideally 1024x2048. Every invisible cell is exactly the same size, character standing feet at the same baseline, character entire body and sword entirely inside each cell, generous transparent padding between cells. Subject in EVERY cell: the SAME adult female heroic adventurer with very long white/silver hair reaching waist, small silver shoulder armor over a dark teal tunic, blue capelet, dark leggings and brown boots, steel sword. Readable face and silhouette. Elegant brave fantasy heroine, not sexualized. Match polished 32-bit era top-down dungeon RPG sprites, crisp nearest-neighbor pixel blocks, limited palette, 3/4 overhead view, no antialiased painting. Rows 1-4: walking cycle four frames each, directions in row order SOUTH facing viewer, WEST facing left, EAST facing right, NORTH back facing away. Columns idle/left-step/idle/right-step. Rows 5-8: same four directions in same order SOUTH/WEST/EAST/NORTH, columns sword windup / sword strike / dodge crouch / hurt recoil. Keep body sizes identical throughout all 32 cells, white hair consistent from all directions; back-facing sprite shows the long white hair. No labels, no text, no numbers, no frame borders, no grid lines, no scenery, no glow, no shadows outside sprite. True transparent background.

# 専用キャラクター画像の完成版

組み込み image_gen で4枚を生成。簡易矩形だった敵13種と、既存人物の流用だった薬師・調合師・行商人の計16キャラクターを専用化。旧画像は保持。

| ファイル（docs/assets/） | 上からの行順 |
|---|---|
| sewer-cast.webp | 汚泥スライム／排水路の大鼠／管棲みの毒蟲／歩く胞子茸 |
| depths-cast.webp | 錆鎧の水路兵／水蛇／毒淵の三頭蛇／凍鉱の氷王 |
| tower-cast.webp | 灰冠の不死鳥／鏡刃の番人／星文の司書／虚灯の王 |
| silver-cast.webp | 銀灯スライム／薬師／調合師／行商人 |

768×768透過WebP、4列×4行。各セル192×192、左右・上下に余白を設け、基準足元をセル内176pxに統一。敵の列は待機・予兆・攻撃・被弾。銀灯は待機・警戒・逃走・被弾、人物は待機・歩行・作業・休息。戦闘判定・強さ・報酬には変更なし。

`src/characters.js` が敵8〜20の専用画像、薬師の救助前後、調合師の救助前後、行商人、図鑑画像を担当。`scripts/prepare-character-atlases.py` は透過余白の正規化と縮小・WebP保存のみ。描画はゲームの既存の向きに合わせた斜め見下ろしのスプライト。

## 使用したプロンプトセット（制作仕様）

共通：Use case stylized-concept. Production pixel-art sprite atlas for a top-down dark fantasy RPG, exact four equal columns by four equal rows. One consistent distinct character per row. Four poses: idle, attack windup, strike, hurt. Detailed polished 32-bit style, crisp pixel clusters, three-quarter overhead view, warm earthy colors with distinct silhouettes. Entire characters within their own cells, generous transparent margins, feet baseline 85%. True transparent background. No labels, text, grid, border, scenery or floor shadows.

- Sewer: olive sewage slime with broken pipe shards and amber eyes; hunched dark brown rat with ragged ears and curling pink tail; segmented indigo venom centipede with copper legs and green fangs; walking rust-red spotted mushroom with cream stem legs and teal spores.
- Depths: corroded bronze-armored soldier with moss-green surcoat, dented shield and rusty sword; blue-green coiled water snake with pale belly and fin crest; swamp-green hydra with exactly three heads, long necks and purple venom teeth; ice golem monarch with jagged cyan crown, navy stone torso, cyan heart, crystal maul and icicle cape.
- Tower: charcoal and red-orange phoenix with gold beak and ash crown; faceless silver knight with reflective triangular shield, glasslike sword and navy cloak; elderly spectral librarian with crescent indigo hat, beard, gold stars, open book and brass astrolabe staff; skeletal king in purple-black torn robes, broken ivory antler crown, empty hood with violet light, hollow chest lantern and bone scepter.
- Silver/NPCs: silver-blue mercury slime with white highlight, navy eyes and gold lantern core (idle/alert/escape/hurt); chestnut-braided herbalist in cream scarf and burgundy dress with herb satchel; gray-haired alchemist with brass goggles, moss-green coat, dark apron, amber flask and medical bag; older moustached trader in ochre turban and teal patched coat with framed backpack, scrolls, copper pots and walking stick (NPC poses idle/walking/work/rest).
