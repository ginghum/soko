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

# 全32種の武器専用画像

組み込み image_gen で2枚を生成し、`docs/assets/weapons-a.webp`・`docs/assets/weapons-b.webp`へ保存。768×768、4列×4行の透過WebP。`src/challenge.js` の武器定義順（WEAPONS）と同じ順に対応させ、店・装備・戦利品・画面下の装備アイコンと手持ちの描画に利用する。ランダム戦利品は元の武器の意匠を引き継ぐ。

共通プロンプト：Production RPG item icon atlas, one square transparent image, exact four columns by four rows, sixteen distinct weapons, one equipment item per cell. Crisp detailed 32-bit dark fantasy pixel art, handcrafted metal/wood/leather/gems, diagonal lower-left grip to upper-right blade, generous transparent padding, silhouettes readable at64px, no text/grid/borders/scenery/hands or effects crossing cells. True transparency.

| アトラス | 行 | 左→右の武器と意匠 |
|---|---:|---|
| weapons-a | 1 | 旅人の剣（鉄・革）／影縫い（黒鋼・三日月）／灯守りの槍（琥珀の灯）／鋼の長剣（青い柄） |
| weapons-a | 2 | 狩人の弓（木と緑弦）／氷晶の杖（青水晶）／裂風の戦斧（銀と緑の双月刃）／震地の戦槌（石と真鍮） |
| weapons-a | 3 | 貫鉄の弩（鉄製機構と胡桃材）／毒牙（緑の牙）／古灯の剣（青銅と琥珀の溝）／水路の曲刀（腐食金属と翡翠） |
| weapons-a | 4 | 葦鳴り（竹と葦）／胞子（捻れ木と青緑キノコ）／鎖刃（銅鎖と黒鉄）／黎明（黄金の太陽鍔） |
| weapons-b | 1 | 淵蛇の双牙（緑の対短剣）／絶氷（氷冠の槍）／不死灰（鳳凰の羽と火球）／淵蛇の継承（象牙と鱗） |
| weapons-b | 2 | 氷王の継承（幾何学の氷槍）／不死灰の継承（黒木と火晶）／灯守りの継承（灯籠鍔）／鏡刃・残月（鏡の月刃） |
| weapons-b | 3 | 星綴り（天球儀と星）／虚灯（角と紫の空洞）／銀風（銀細工の護拳）／梟羽（羽根の長弓） |
| weapons-b | 4 | 嵐呼び（雷叉と青晶）／紅晶（紅玉と黒鉄）／暁鐘（鐘型の槌と舌）／月霜（月形の大剣と霜） |

生成後は `python scripts/prepare-character-atlases.py --weapons input-a.png input-b.png` で各セルの透過余白とサイズをそろえる。
