import type { ColorId, ItemDef } from '../types';
import { COLORS } from './colors';

/**
 * アイテム定義
 * icon は仮アイコン（絵文字）。家具・おもちゃ・収集品の原画はまだ無いため。
 * 衣装は企画書の着せ替え原画（sprite）を使用。
 */
export const ITEMS: ItemDef[] = [
  // ---------- 家具：初期 ----------
  { id: 'bed_default', title: 'もこもこベッド', category: 'furniture', rarity: 'common', icon: '🛏️', slot: 'bed', giftOnly: true, desc: 'はじめからあるベッド' },
  { id: 'rug_default', title: 'まるいラグ', category: 'furniture', rarity: 'common', icon: '⚪', slot: 'rug', giftOnly: true, desc: 'はじめからあるラグ' },
  { id: 'cur_default', title: 'しろいカーテン', category: 'furniture', rarity: 'common', icon: '🤍', slot: 'curtain', giftOnly: true, desc: 'はじめからあるカーテン' },
  // ---------- 家具：ショップ ----------
  { id: 'cur_sakura', title: 'さくら色のカーテン', category: 'furniture', rarity: 'common', icon: '🩷', slot: 'curtain', tint: '#f3b4c4', shopPrice: 200 },
  { id: 'cur_mint', title: 'ミントのカーテン', category: 'furniture', rarity: 'common', icon: '💚', slot: 'curtain', tint: '#acd8bf', shopPrice: 200 },
  { id: 'pl_bunny', title: 'うさぎのぬいぐるみ', category: 'furniture', rarity: 'common', icon: '🐇', slot: 'plush', shopPrice: 180 },
  { id: 'pl_cat', title: 'ねこのクッション', category: 'furniture', rarity: 'common', icon: '🐱', slot: 'plush', shopPrice: 220 },
  { id: 'wall_heart', title: 'ハートのかざり', category: 'furniture', rarity: 'common', icon: '💗', slot: 'wall', shopPrice: 120 },
  { id: 'wall_flowerwreath', title: 'お花のリース', category: 'furniture', rarity: 'common', icon: '💐', slot: 'wall', shopPrice: 180 },
  { id: 'bed_sakura', title: 'さくら色のふとん', category: 'furniture', rarity: 'common', icon: '🌸', slot: 'bed', tint: '#f3b3c3', shopPrice: 200 },
  { id: 'bed_mint', title: 'ミントのふとん', category: 'furniture', rarity: 'common', icon: '🌿', slot: 'bed', tint: '#a9d8c0', shopPrice: 220 },
  { id: 'rug_cocoa', title: 'ココアのラグ', category: 'furniture', rarity: 'common', icon: '🟤', slot: 'rug', tint: '#c49a7c', shopPrice: 150 },
  { id: 'rug_sky', title: 'そら色のラグ', category: 'furniture', rarity: 'common', icon: '🩵', slot: 'rug', tint: '#a9c9ea', shopPrice: 180 },
  { id: 'wall_clock', title: 'まるい壁時計', category: 'furniture', rarity: 'common', icon: '🕰️', slot: 'wall', shopPrice: 150 },
  { id: 'floor_books', title: '本のやま', category: 'furniture', rarity: 'common', icon: '📚', slot: 'top', shopPrice: 150 },
  { id: 'floor_plant', title: 'ちいさな観葉植物', category: 'furniture', rarity: 'common', icon: '🪴', slot: 'top', shopPrice: 200, desc: 'Stage3の記念でももらえる' },
  { id: 'chest_wood', title: '木のタンス', category: 'furniture', rarity: 'common', icon: '🗄️', slot: 'chest', chestColors: ['#e8c69a', '#d2a878', '#a9774c'], shopPrice: 80, desc: '上に植物や小物を飾れる' },
  { id: 'chest_white', title: 'しろいタンス', category: 'furniture', rarity: 'common', icon: '🗄️', slot: 'chest', chestColors: ['#f7efe6', '#e3d5c6', '#c9a27a'], shopPrice: 150, desc: '上に植物や小物を飾れる' },
  { id: 'chest_mint', title: 'ミントのタンス', category: 'furniture', rarity: 'rare', icon: '🗄️', slot: 'chest', chestColors: ['#cfe7d8', '#b2d3bf', '#8f6a4c'], area: 'flowerForest', desc: '上に植物や小物を飾れる' },
  { id: 'sill_cactus', title: 'ちいさなサボテン', category: 'furniture', rarity: 'common', icon: '🌵', slot: 'top', shopPrice: 120 },
  { id: 'sill_tulip', title: 'チューリップの鉢', category: 'furniture', rarity: 'common', icon: '🌷', slot: 'top', shopPrice: 160 },
  { id: 'wall_cloud', title: 'くものかべかざり', category: 'furniture', rarity: 'common', icon: '☁️', slot: 'wall', shopPrice: 300, premium: true },
  // ---------- 家具：ゆか（ベッドのよこ・てまえのすみ） ----------
  { id: 'fl_nightstand', title: 'ランプつきナイトテーブル', category: 'furniture', rarity: 'common', icon: '🛋️', slot: 'floor', img: 'it_lamp', shopPrice: 220 },
  { id: 'fl_basket', title: 'ブランケットかご', category: 'furniture', rarity: 'common', icon: '🧺', slot: 'floor', img: 'it_basket', shopPrice: 180 },
  { id: 'fl_pouf', title: 'もこもこスツール', category: 'furniture', rarity: 'common', icon: '🪑', slot: 'floor', img: 'it_pouf', shopPrice: 200 },
  { id: 'fl_table', title: 'まるいローテーブル', category: 'furniture', rarity: 'common', icon: '🪵', slot: 'floor', img: 'it_table', shopPrice: 240 },
  { id: 'fl_beanbag', title: 'ふわふわビーズクッション', category: 'furniture', rarity: 'rare', icon: '🛋️', slot: 'floor', img: 'it_beanbag', area: 'moonLake' },
  { id: 'fl_shelf', title: 'つたの本だな', category: 'furniture', rarity: 'rare', icon: '📚', slot: 'floor', img: 'it_shelf', area: 'flowerForest' },
  { id: 'fl_trunk', title: '旅のトランク', category: 'furniture', rarity: 'rare', icon: '🧳', slot: 'floor', img: 'it_trunk', area: 'starHill' },
  { id: 'fl_sidetable', title: 'お花のサイドテーブル', category: 'furniture', rarity: 'common', icon: '🌼', slot: 'floor', img: 'it2_sidetable', shopPrice: 200 },
  { id: 'fl_lampstand', title: 'ちいさなランプ台', category: 'furniture', rarity: 'common', icon: '💡', slot: 'floor', img: 'it2_lampstand', shopPrice: 200 },
  { id: 'fl_coatrack', title: 'うさみみコートラック', category: 'furniture', rarity: 'common', icon: '🧥', slot: 'floor', img: 'it2_coatrack', shopPrice: 220 },
  { id: 'fl_toybox', title: 'おもちゃ箱', category: 'furniture', rarity: 'common', icon: '🧸', slot: 'floor', img: 'it2_toybox', shopPrice: 260 },
  { id: 'fl_desk', title: 'ちいさなデスク', category: 'furniture', rarity: 'common', icon: '✏️', slot: 'floor', img: 'it2_desk', shopPrice: 320 },
  { id: 'fl_archshelf', title: 'アーチの本だな', category: 'furniture', rarity: 'superRare', icon: '📚', slot: 'floor', img: 'it2_archshelf', area: 'flowerForest' },
  { id: 'fl_plushbox', title: 'ぬいぐるみ収納', category: 'furniture', rarity: 'rare', icon: '🧸', slot: 'floor', img: 'it2_plushbox', area: 'moonLake' },
  { id: 'fl_hammock', title: 'ハンモック', category: 'furniture', rarity: 'superRare', icon: '🛏️', slot: 'floor', img: 'it2_hammock', area: 'moonLake' },
  { id: 'fl_treasure', title: '星の宝箱', category: 'furniture', rarity: 'superRare', icon: '🧰', slot: 'floor', img: 'it2_treasure', area: 'starHill' },
  { id: 'fl_tent', title: 'ちいさなテント', category: 'furniture', rarity: 'superRare', icon: '⛺', slot: 'floor', img: 'it2_tent', area: 'flowerForest' },
  // ---------- 家具：壁 ----------
  { id: 'wl_wreath_flower', title: '花のリース', category: 'furniture', rarity: 'common', icon: '💐', slot: 'wall', img: 'it2_wreath_flower', shopPrice: 180 },
  { id: 'wl_dryflower', title: 'ドライフラワー', category: 'furniture', rarity: 'common', icon: '🥀', slot: 'wall', img: 'it2_dryflower', shopPrice: 160 },
  { id: 'wl_garland_cloth', title: '布のガーランド', category: 'furniture', rarity: 'common', icon: '🚩', slot: 'wall', img: 'it2_garland_cloth', shopPrice: 120 },
  { id: 'wl_clock_bunny', title: 'うさぎの時計', category: 'furniture', rarity: 'common', icon: '🕰️', slot: 'wall', img: 'it2_clock_bunny', shopPrice: 200 },
  { id: 'wl_clock_cloud', title: 'くもの時計', category: 'furniture', rarity: 'common', icon: '🕰️', slot: 'wall', img: 'it2_clock_cloud', shopPrice: 220 },
  { id: 'wl_shelf', title: 'かべの飾りだな', category: 'furniture', rarity: 'common', icon: '🪴', slot: 'wall', img: 'it2_wallshelf', shopPrice: 260 },
  { id: 'wl_wreath_star', title: '星のリース', category: 'furniture', rarity: 'rare', icon: '⭐', slot: 'wall', img: 'it2_wreath_star', area: 'starHill' },
  { id: 'wl_mobile', title: '月のモビール', category: 'furniture', rarity: 'rare', icon: '🌙', slot: 'wall', img: 'it2_mobile', area: 'moonLake' },
  { id: 'wl_poster_forest', title: '花の森のポスター', category: 'furniture', rarity: 'common', icon: '🖼️', slot: 'wall', img: 'it2_poster_forest', area: 'flowerForest' },
  { id: 'wl_poster_lake', title: '月あかりの湖のポスター', category: 'furniture', rarity: 'common', icon: '🖼️', slot: 'wall', img: 'it2_poster_lake', area: 'moonLake' },
  { id: 'wl_garland_star', title: '星のガーランド', category: 'furniture', rarity: 'common', icon: '⭐', slot: 'wall', img: 'it2_garland_star', area: 'starHill' },
  { id: 'wl_clock_moon', title: '月の時計', category: 'furniture', rarity: 'rare', icon: '🌙', slot: 'wall', img: 'it2_clock_moon', area: 'moonLake' },
  { id: 'wl_garland_flower', title: '花のガーランド', category: 'furniture', rarity: 'rare', icon: '🌸', slot: 'wall', img: 'it2_garland_flower', giftOnly: true, desc: '春の季節プレゼント' },
  // ---------- 家具：タンスの上 ----------
  { id: 'tp_vase_wild', title: '野の花びん', category: 'furniture', rarity: 'common', icon: '🌼', slot: 'top', img: 'it2_vase_wild', shopPrice: 150 },
  { id: 'tp_vase_lav', title: 'ラベンダーのピッチャー', category: 'furniture', rarity: 'common', icon: '💜', slot: 'top', img: 'it2_vase_lav', shopPrice: 180 },
  { id: 'tp_cup_flower', title: 'はなのティーカップ', category: 'furniture', rarity: 'common', icon: '☕', slot: 'top', img: 'it2_cup_flower', shopPrice: 100 },
  { id: 'tp_cup_clover', title: 'クローバーのティーカップ', category: 'furniture', rarity: 'common', icon: '☕', slot: 'top', img: 'it2_cup_clover', shopPrice: 100 },
  { id: 'tp_candle_flower', title: '花のキャンドルランプ', category: 'furniture', rarity: 'common', icon: '🕯️', slot: 'top', img: 'it2_candle_flower', shopPrice: 160 },
  { id: 'tp_candle_cloud', title: 'くものランプ', category: 'furniture', rarity: 'common', icon: '☁️', slot: 'top', img: 'it2_candle_cloud', shopPrice: 200 },
  { id: 'tp_book_flower', title: '花ずかん', category: 'furniture', rarity: 'common', icon: '📗', slot: 'top', img: 'it2_book_flower', shopPrice: 120 },
  { id: 'tp_vase_suzu', title: 'すずらんの花びん', category: 'furniture', rarity: 'rare', icon: '🌷', slot: 'top', img: 'it2_vase_suzu', area: 'flowerForest' },
  { id: 'tp_jar_flower', title: '花のびんづめ', category: 'furniture', rarity: 'common', icon: '🫙', slot: 'top', img: 'it2_jar_flower', area: 'flowerForest' },
  { id: 'tp_jar_clover', title: '四つ葉のびんづめ', category: 'furniture', rarity: 'rare', icon: '🫙', slot: 'top', img: 'it2_jar_clover', area: 'flowerForest' },
  { id: 'tp_gem_flower', title: '花の宝石びん', category: 'furniture', rarity: 'superRare', icon: '💎', slot: 'top', img: 'it2_gem_flower', area: 'flowerForest' },
  { id: 'tp_vase_moon', title: '月の花びん', category: 'furniture', rarity: 'rare', icon: '🌙', slot: 'top', img: 'it2_vase_moon', area: 'moonLake' },
  { id: 'tp_cup_moon', title: 'つきのティーカップ', category: 'furniture', rarity: 'common', icon: '☕', slot: 'top', img: 'it2_cup_moon', area: 'moonLake' },
  { id: 'tp_candle_moon', title: '月のキャンドルランプ', category: 'furniture', rarity: 'rare', icon: '🌙', slot: 'top', img: 'it2_candle_moon', area: 'moonLake' },
  { id: 'tp_music_moon', title: '月のオルゴール', category: 'furniture', rarity: 'superRare', icon: '🎶', slot: 'top', img: 'it2_music_moon', area: 'moonLake' },
  { id: 'tp_gem_moon', title: '月の宝石びん', category: 'furniture', rarity: 'superRare', icon: '💎', slot: 'top', img: 'it2_gem_moon', area: 'moonLake' },
  { id: 'tp_jar_star', title: '星のびんづめ', category: 'furniture', rarity: 'common', icon: '🫙', slot: 'top', img: 'it2_jar_star', area: 'starHill' },
  { id: 'tp_cup_star', title: 'ほしのティーカップ', category: 'furniture', rarity: 'common', icon: '☕', slot: 'top', img: 'it2_cup_star', area: 'starHill' },
  { id: 'tp_book_star', title: '星のずかん', category: 'furniture', rarity: 'common', icon: '📘', slot: 'top', img: 'it2_book_star', area: 'starHill' },
  { id: 'tp_candle_star', title: 'ほしのキャンドルランプ', category: 'furniture', rarity: 'rare', icon: '⭐', slot: 'top', img: 'it2_candle_star', area: 'starHill' },
  { id: 'tp_music_star', title: '星の丘のオルゴール', category: 'furniture', rarity: 'superRare', icon: '🎶', slot: 'top', img: 'it2_music_star', area: 'starHill' },
  { id: 'tp_gem_star', title: '星の宝石びん', category: 'furniture', rarity: 'superRare', icon: '💎', slot: 'top', img: 'it2_gem_star', area: 'starHill' },
  { id: 'tp_jar_lake', title: '湖のかけらびん', category: 'furniture', rarity: 'rare', icon: '🫙', slot: 'top', img: 'it2_jar_lake', giftOnly: true, desc: '夏の季節プレゼント' },
  { id: 'tp_music_luu', title: 'るうのオルゴール', category: 'furniture', rarity: 'superRare', icon: '🎶', slot: 'top', img: 'it2_music_luu', giftOnly: true, desc: '親密度Lv4の記念' },
  { id: 'tp_book_memory', title: 'おもいでのほん', category: 'furniture', rarity: 'rare', icon: '📙', slot: 'top', img: 'it2_book_memory', giftOnly: true, desc: '親密度Lv3の記念' },
  // ---------- 家具：ベッドの上・ラグ ----------
  { id: 'pl_luu', title: 'るうのぬいぐるみ', category: 'furniture', rarity: 'superRare', icon: '🐰', slot: 'plush', img: 'it2_plush_luu', giftOnly: true, desc: '親密度Lv5の記念' },
  { id: 'pl_cush_snow', title: 'ゆきのクッション', category: 'furniture', rarity: 'common', icon: '❄️', slot: 'plush', img: 'it2_cush_snow', season: 'winter' },
  { id: 'rug_pink', title: 'ピンクのまるラグ', category: 'furniture', rarity: 'common', icon: '🩷', slot: 'rug', img: 'it2_rug_pink', shopPrice: 200 },
  { id: 'rug_playmat', title: 'うさぎのプレイマット', category: 'furniture', rarity: 'common', icon: '🐰', slot: 'rug', img: 'it2_playmat', shopPrice: 240 },
  { id: 'rug_starry', title: '星空のまるラグ', category: 'furniture', rarity: 'rare', icon: '🌙', slot: 'rug', img: 'it2_rug_star', area: 'starHill' },
  { id: 'rug_snow', title: 'ゆきのまるラグ', category: 'furniture', rarity: 'rare', icon: '❄️', slot: 'rug', img: 'it2_rug_snow', season: 'winter' },
  // ---------- 家具：冒険 ----------
  { id: 'cur_lemon', title: 'レモン色のカーテン', category: 'furniture', rarity: 'rare', icon: '💛', slot: 'curtain', tint: '#f3dc86', area: 'flowerForest' },
  { id: 'wall_rainbow', title: 'にじのかべかざり', category: 'furniture', rarity: 'superRare', icon: '🌈', slot: 'wall', area: 'flowerForest' },
  { id: 'pl_whale', title: 'くじらのぬいぐるみ', category: 'furniture', rarity: 'common', icon: '🐳', slot: 'plush', area: 'moonLake' },
  { id: 'cur_lavender', title: 'ラベンダーのカーテン', category: 'furniture', rarity: 'rare', icon: '💜', slot: 'curtain', tint: '#c6bdec', area: 'moonLake' },
  { id: 'wall_poster', title: 'ほしぞらのポスター', category: 'furniture', rarity: 'common', icon: '🌃', slot: 'wall', area: 'starHill' },
  { id: 'cur_night', title: 'よぞら色のカーテン', category: 'furniture', rarity: 'superRare', icon: '💙', slot: 'curtain', tint: '#9fb1e2', area: 'starHill' },
  { id: 'floor_sunflower', title: 'ひまわりの鉢', category: 'furniture', rarity: 'common', icon: '🌻', slot: 'top', area: 'flowerForest' },
  { id: 'floor_mushroom', title: 'きのこの置きもの', category: 'furniture', rarity: 'rare', icon: '🍄', slot: 'top', area: 'flowerForest' },
  { id: 'rug_flower', title: 'はなばたけラグ', category: 'furniture', rarity: 'superRare', icon: '💐', slot: 'rug', tint: '#f1c6d8', area: 'flowerForest' },
  { id: 'bed_lavender', title: 'ラベンダーのふとん', category: 'furniture', rarity: 'rare', icon: '💜', slot: 'bed', tint: '#c7bdea', area: 'moonLake' },
  { id: 'wall_moon', title: '月のガーランド', category: 'furniture', rarity: 'rare', icon: '🌙', slot: 'wall', area: 'moonLake' },
  { id: 'floor_lotus', title: 'はすの花かざり', category: 'furniture', rarity: 'superRare', icon: '🪷', slot: 'top', area: 'moonLake' },
  { id: 'floor_starcushion', title: '星のクッション', category: 'furniture', rarity: 'rare', icon: '🌟', slot: 'plush', area: 'starHill' },
  { id: 'wall_mobile', title: '星のモビール', category: 'furniture', rarity: 'superRare', icon: '✨', slot: 'wall', area: 'starHill' },
  // ---------- 家具：記念品 ----------
  { id: 'wall_photo', title: 'ふたりの写真', category: 'furniture', rarity: 'rare', icon: '🖼️', slot: 'wall', giftOnly: true, desc: '親密度Lv4の記念' },
  { id: 'wall_wreath', title: 'どんぐりのリース', category: 'furniture', rarity: 'common', icon: '🍂', slot: 'wall', giftOnly: true, desc: '秋の季節プレゼント' },

  // ---------- 衣装（原画あり） ----------
  { id: 'out_hoodie', title: 'カジュアルパーカー', category: 'outfit', rarity: 'common', icon: '🧥', sprite: 'o_hoodie', shopPrice: 350 },
  { id: 'out_beret', title: 'おでかけベレー', category: 'outfit', rarity: 'common', icon: '🎨', sprite: 'o_beret', shopPrice: 300 },
  { id: 'out_ribbon', title: 'リボンとベレー', category: 'outfit', rarity: 'common', icon: '🎀', sprite: 'c_beret', shopPrice: 450 },
  { id: 'out_sakura', title: 'さくらずきん', category: 'outfit', rarity: 'rare', icon: '🌷', sprite: 'c_pinkhood', shopPrice: 0, premium: true },
  { id: 'out_raincoat', title: 'レインコート', category: 'outfit', rarity: 'rare', icon: '☔', sprite: 'o_raincoat', area: 'moonLake' },
  { id: 'out_bear', title: 'くまフード', category: 'outfit', rarity: 'superRare', icon: '🐻', sprite: 'o_bear', area: 'starHill' },
  { id: 'out_dino', title: 'きょうりゅうフード', category: 'outfit', rarity: 'secret', icon: '🦕', sprite: 'c_dino', area: 'starHill' },
  // 衣装（2回目の原画）：おみせ
  { id: 'out_scarf', title: 'リボンスカーフ', category: 'outfit', rarity: 'common', icon: '🎀', sprite: 'w_scarf', shopPrice: 250 },
  { id: 'out_flowercrown', title: '花かんむり', category: 'outfit', rarity: 'common', icon: '🌼', sprite: 'w_flowercrown', shopPrice: 300 },
  { id: 'out_pajama', title: '星のパジャマ', category: 'outfit', rarity: 'common', icon: '🌙', sprite: 'w_pajama', shopPrice: 380 },
  { id: 'out_cardigan', title: 'ベレーとカーディガン', category: 'outfit', rarity: 'common', icon: '🧶', sprite: 'w_cardigan', shopPrice: 380 },
  { id: 'out_knit', title: 'もこもこニット', category: 'outfit', rarity: 'common', icon: '🧣', sprite: 'w_knit', shopPrice: 400 },
  { id: 'out_gardener', title: 'ガーデナー', category: 'outfit', rarity: 'common', icon: '🌱', sprite: 'w_gardener', shopPrice: 420 },
  { id: 'out_picnic', title: 'ピクニックワンピース', category: 'outfit', rarity: 'common', icon: '🧺', sprite: 'w_picnic', shopPrice: 450 },
  { id: 'out_cafe', title: 'カフェ店員さん', category: 'outfit', rarity: 'common', icon: '☕', sprite: 'w_cafe', shopPrice: 450 },
  // 衣装（2回目の原画）：夜の冒険
  { id: 'out_painter', title: '画家さん', category: 'outfit', rarity: 'rare', icon: '🎨', sprite: 'w_painter', area: 'flowerForest' },
  { id: 'out_strawberry', title: 'いちごずきん', category: 'outfit', rarity: 'rare', icon: '🍓', sprite: 'w_strawberry', area: 'flowerForest' },
  { id: 'out_mushroom', title: 'きのこずきん', category: 'outfit', rarity: 'superRare', icon: '🍄', sprite: 'w_mushroom', area: 'flowerForest' },
  { id: 'out_sailor', title: 'セーラー', category: 'outfit', rarity: 'rare', icon: '⚓', sprite: 'w_sailor', area: 'moonLake' },
  { id: 'out_explorer', title: '探検家', category: 'outfit', rarity: 'rare', icon: '🧭', sprite: 'w_explorer', area: 'starHill' },
  { id: 'out_starnight', title: '星空のおやすみケープ', category: 'outfit', rarity: 'superRare', icon: '⭐', sprite: 'w_starnight', area: 'starHill' },
  // 衣装（2回目の原画）：るうプラスの特典
  { id: 'out_lolita', title: 'フリルのドレス', category: 'outfit', rarity: 'superRare', icon: '👗', sprite: 'w_lolita', shopPrice: 0, premium: true },
  { id: 'out_detective', title: '探偵さん', category: 'outfit', rarity: 'superRare', icon: '🔍', sprite: 'w_detective', shopPrice: 0, premium: true },
  { id: 'out_spa', title: 'ふわふわバスローブ', category: 'outfit', rarity: 'rare', icon: '🛁', sprite: 'w_spa', shopPrice: 0, premium: true },
  // アクセ（いつものるうにつける小物。衣装とは同時につけられない）
  { id: 'acc_bow_pink', title: 'ピンクのリボン', category: 'outfit', rarity: 'common', icon: '🎀', sprite: 'a_bow_pink', img: 'acc2_bow_pink', shopPrice: 150, desc: 'アクセ' },
  { id: 'acc_pin_flower', title: 'お花のヘアピン', category: 'outfit', rarity: 'common', icon: '🌸', sprite: 'a_pin_flower', img: 'acc2_pin_flower', shopPrice: 120, desc: 'アクセ' },
  { id: 'acc_pin_bunny', title: 'うさぎのヘアピン', category: 'outfit', rarity: 'common', icon: '🐰', sprite: 'a_pin_bunny', img: 'acc2_pin_bunny', shopPrice: 120, desc: 'アクセ' },
  { id: 'acc_collar', title: 'レースのつけえり', category: 'outfit', rarity: 'common', icon: '🤍', sprite: 'a_collar', img: 'acc2_collar', shopPrice: 200, desc: 'アクセ' },
  { id: 'acc_scarf_pink', title: 'ピンクのマフラー', category: 'outfit', rarity: 'common', icon: '🧣', sprite: 'a_scarf_pink', img: 'acc2_scarf_pink', shopPrice: 220, desc: 'アクセ' },
  { id: 'acc_scarf_cream', title: 'あみあみマフラー', category: 'outfit', rarity: 'common', icon: '🧣', sprite: 'a_scarf_cream', img: 'acc2_scarf_cream', shopPrice: 220, desc: 'アクセ' },
  { id: 'acc_scarf_check', title: 'チェックのマフラー', category: 'outfit', rarity: 'common', icon: '🧣', sprite: 'a_scarf_check', img: 'acc2_scarf_check', shopPrice: 240, desc: 'アクセ' },
  { id: 'acc_beret', title: 'ベレー帽', category: 'outfit', rarity: 'common', icon: '🎨', sprite: 'a_beret', img: 'acc2_beret', shopPrice: 240, desc: 'アクセ' },
  { id: 'acc_knit_hat', title: 'ニット帽', category: 'outfit', rarity: 'common', icon: '🧶', sprite: 'a_knit_hat', img: 'acc2_knit_hat', shopPrice: 260, desc: 'アクセ' },
  { id: 'acc_bag', title: 'うさぎのショルダーバッグ', category: 'outfit', rarity: 'common', icon: '👜', sprite: 'a_bag', img: 'acc2_bag', shopPrice: 260, desc: 'アクセ' },
  { id: 'acc_pin_strawberry', title: 'いちごのヘアピン', category: 'outfit', rarity: 'common', icon: '🍓', sprite: 'a_pin_strawberry', img: 'acc2_pin_strawberry', area: 'flowerForest', desc: 'アクセ' },
  { id: 'acc_pin_moon', title: '月のヘアピン', category: 'outfit', rarity: 'common', icon: '🌙', sprite: 'a_pin_moon', img: 'acc2_pin_moon', area: 'moonLake', desc: 'アクセ' },
  { id: 'acc_scarf_star', title: '星のマフラー', category: 'outfit', rarity: 'rare', icon: '⭐', sprite: 'a_scarf_star', img: 'acc2_scarf_star', area: 'moonLake', desc: 'アクセ' },
  { id: 'acc_pin_star', title: '星のヘアピン', category: 'outfit', rarity: 'common', icon: '⭐', sprite: 'a_pin_star', img: 'acc2_pin_star', area: 'starHill', desc: 'アクセ' },
  { id: 'acc_bow_star', title: '星のリボン', category: 'outfit', rarity: 'rare', icon: '🎀', sprite: 'a_bow_star', img: 'acc2_bow_star', area: 'starHill', desc: 'アクセ' },
  { id: 'acc_earmuffs', title: 'うさぎのイヤーマフ', category: 'outfit', rarity: 'common', icon: '🎧', sprite: 'a_earmuffs', img: 'acc2_earmuffs', season: 'winter', desc: 'アクセ' },
  { id: 'acc_eyemask', title: 'おやすみアイマスク', category: 'outfit', rarity: 'rare', icon: '😴', sprite: 'a_eyemask', img: 'acc2_eyemask', shopPrice: 0, premium: true, desc: 'アクセ' },
  { id: 'out_muffler', title: '記念のマフラー', category: 'outfit', rarity: 'rare', icon: '🧣', sprite: 'o_muffler', giftOnly: true, desc: 'Stage4（おとな）の記念' },

  // ---------- おもちゃ ----------
  { id: 'toy_ball', title: 'ふわふわボール', category: 'toy', rarity: 'common', icon: '🔵', img: 'it2_ball', playPersonality: 'energetic', shopPrice: 120, desc: 'すこし大きくなった記念でももらえる' },
  { id: 'toy_plush', title: 'リボンのうさぎ', category: 'toy', rarity: 'common', icon: '🧸', img: 'it2_bowbunny', playPersonality: 'affectionate', shopPrice: 200 },
  { id: 'toy_blocks', title: 'つみき', category: 'toy', rarity: 'common', icon: '🧩', img: 'it2_blocks', playPersonality: 'adventurous', shopPrice: 180 },
  { id: 'toy_yarn', title: '毛糸玉', category: 'toy', rarity: 'common', icon: '🧶', img: 'it2_yarn', playPersonality: 'energetic', shopPrice: 150 },
  { id: 'toy_carrot', title: 'にんじんのおもちゃ', category: 'toy', rarity: 'common', icon: '🥕', img: 'it2_carrot', playPersonality: 'affectionate', shopPrice: 140 },
  { id: 'toy_bubbles', title: 'しゃぼん玉', category: 'toy', rarity: 'common', icon: '🫧', img: 'it2_bubbles', playPersonality: 'calm', shopPrice: 160 },
  { id: 'toy_ehon', title: 'えほん', category: 'toy', rarity: 'common', icon: '📖', img: 'it2_ehon', playPersonality: 'calm', shopPrice: 220 },
  { id: 'toy_horse', title: 'ゆらゆら木馬', category: 'toy', rarity: 'rare', icon: '🐴', img: 'it2_horse', slot: 'floor', playPersonality: 'energetic', giftOnly: true, desc: 'もっと大きくなった記念。床にも置けるよ' },
  { id: 'toy_piano', title: 'ミニピアノ', category: 'toy', rarity: 'superRare', icon: '🎹', img: 'it2_piano', slot: 'floor', playPersonality: 'calm', giftOnly: true, desc: 'おとなになった記念。床にも置けるよ' },
  { id: 'toy_chime', title: 'ちいさな風鈴', category: 'toy', rarity: 'common', icon: '🎐', playPersonality: 'calm', area: 'moonLake' },
  { id: 'toy_kite', title: 'ほしのたこ', category: 'toy', rarity: 'common', icon: '🪁', playPersonality: 'energetic', area: 'starHill' },

  // ---------- 収集品 ----------
  { id: 'col_petal', title: 'さくらの花びら', category: 'collectible', rarity: 'common', icon: '🌸', area: 'flowerForest' },
  { id: 'col_acorn', title: 'つやつやどんぐり', category: 'collectible', rarity: 'common', icon: '🌰', area: 'flowerForest' },
  { id: 'col_berry', title: '森のいちご', category: 'collectible', rarity: 'common', icon: '🍓', area: 'flowerForest' },
  { id: 'col_clover', title: 'よつばのクローバー', category: 'collectible', rarity: 'rare', icon: '🍀', area: 'flowerForest' },
  { id: 'col_butterfly', title: 'ちょうちょの絵はがき', category: 'collectible', rarity: 'superRare', icon: '🦋', area: 'flowerForest' },
  { id: 'col_rainbowseed', title: 'にじいろの種', category: 'collectible', rarity: 'secret', icon: '🌈', area: 'flowerForest' },
  { id: 'col_shell', title: 'さくら貝', category: 'collectible', rarity: 'common', icon: '🐚', area: 'moonLake' },
  { id: 'col_pebble', title: 'まるい小石', category: 'collectible', rarity: 'common', icon: '🪨', area: 'moonLake' },
  { id: 'col_drop', title: '月のしずく', category: 'collectible', rarity: 'rare', icon: '💧', area: 'moonLake' },
  { id: 'col_moonpiece', title: '月のかけら', category: 'collectible', rarity: 'superRare', icon: '🌛', area: 'moonLake' },
  { id: 'col_lullaby', title: 'みずうみの子守うた', category: 'collectible', rarity: 'secret', icon: '🎼', area: 'moonLake' },
  { id: 'col_stardust', title: 'ほしくず', category: 'collectible', rarity: 'common', icon: '⭐', area: 'starHill' },
  { id: 'col_scope', title: 'ちいさな望遠鏡', category: 'collectible', rarity: 'rare', icon: '🔭', area: 'starHill' },
  { id: 'col_crystal', title: '星の結晶', category: 'collectible', rarity: 'superRare', icon: '💎', area: 'starHill' },
  { id: 'col_comet', title: 'ながれ星のしっぽ', category: 'collectible', rarity: 'secret', icon: '☄️', area: 'starHill' },
  // 記念品
  { id: 'col_hello', title: 'はじめましてのお花', category: 'collectible', rarity: 'rare', icon: '🌼', giftOnly: true, desc: 'であった日に、るうが持ってきてくれた' },
  { id: 'col_letter', title: 'るうからのお手紙', category: 'collectible', rarity: 'common', icon: '💌', giftOnly: true, desc: '親密度Lv2の記念' },
  { id: 'col_bouquet', title: 'ちいさな花束', category: 'collectible', rarity: 'rare', icon: '💐', giftOnly: true, desc: '親密度Lv3の記念' },
  { id: 'col_ribbon', title: 'たいせつのリボン', category: 'collectible', rarity: 'superRare', icon: '🎗️', giftOnly: true, desc: '親密度Lv5の記念' },
];

// ---------- 工作でつくれるもの（「つくる」でのみ入手） ----------
ITEMS.push(
  { id: 'cr_sakura_garland', title: 'さくらのガーランド', category: 'furniture', rarity: 'rare', icon: '💮', slot: 'wall', giftOnly: true },
  { id: 'cr_acorn_lamp', title: 'どんぐりランプ', category: 'furniture', rarity: 'rare', icon: '🏮', slot: 'top', giftOnly: true },
  { id: 'cr_berry_tart', title: 'いちごのタルト', category: 'collectible', rarity: 'rare', icon: '🥧', giftOnly: true, food: { pose: 'eat_base', line: 'もぐもぐ…あまずっぱ〜い！', motion: 'eat' }, desc: 'ごはんメニューに追加される' },
  { id: 'cr_clover_charm', title: 'しあわせのお守り', category: 'furniture', rarity: 'superRare', icon: '🧿', slot: 'top', giftOnly: true },
  { id: 'cr_block_castle', title: 'つみきのお城', category: 'furniture', rarity: 'rare', icon: '🏰', slot: 'top', giftOnly: true },
  { id: 'cr_sun_rug', title: 'ひまわりのラグ', category: 'furniture', rarity: 'rare', icon: '🌻', slot: 'rug', tint: '#f5d77c', giftOnly: true },
  { id: 'cr_shell_mobile', title: 'さくら貝のモビール', category: 'furniture', rarity: 'rare', icon: '🐚', slot: 'wall', giftOnly: true },
  { id: 'cr_pebble_jar', title: '小石のガラスびん', category: 'furniture', rarity: 'rare', icon: '🫙', slot: 'top', giftOnly: true },
  { id: 'cr_moon_bed', title: 'つきあかりのふとん', category: 'furniture', rarity: 'superRare', icon: '🌙', slot: 'bed', tint: '#b9c3ea', giftOnly: true },
  { id: 'cr_herb_tea', title: 'ハーブティー', category: 'collectible', rarity: 'rare', icon: '🍵', giftOnly: true, food: { pose: 'eat_base', line: 'ずずっ…ふぅ、ほっとするね', motion: 'drink', cup: 'tea' }, desc: 'ごはんメニューに追加される' },
  { id: 'cr_stardust_jar', title: 'ほしくずのびん', category: 'furniture', rarity: 'rare', icon: '🌌', slot: 'top', giftOnly: true },
  { id: 'cr_kite_garland', title: 'たこのかべかざり', category: 'furniture', rarity: 'rare', icon: '🎏', slot: 'wall', giftOnly: true },
  { id: 'cr_telescope', title: '天体望遠鏡', category: 'furniture', rarity: 'superRare', icon: '🔭', slot: 'top', giftOnly: true },
  { id: 'cr_star_sofa', title: 'ほしのだきまくら', category: 'furniture', rarity: 'superRare', icon: '🌠', slot: 'plush', giftOnly: true }
);

// ---------- 色シリーズ（その色の子の冒険でだけ見つかる） ----------
const SERIES: Record<ColorId, { tint: string; col: [string, string] }> = {
  milk: { tint: '#e6d2bf', col: ['ミルクキャンディ', '🥛'] },
  caramel: { tint: '#efc58c', col: ['キャラメルのあめ', '🍬'] },
  lavender: { tint: '#cbbdf0', col: ['ラベンダーのしおり', '🪻'] },
  mint: { tint: '#b2dfc6', col: ['ミントの葉っぱ', '🌿'] },
  cocoa: { tint: '#b98f72', col: ['ココアクッキー', '🍪'] },
  gray: { tint: '#cac6c2', col: ['グレーのはね', '🪶'] },
  sakura: { tint: '#f4b8ca', col: ['さくらのかみかざり', '🌸'] },
  sora: { tint: '#b0d0f3', col: ['そらいろのビー玉', '🫧'] },
  yuki: { tint: '#e2eaf7', col: ['ゆきの結晶', '❄️'] },
};
COLORS.forEach(({ id, name }) => {
  const { tint, col } = SERIES[id];
  ITEMS.push(
    { id: `se_${id}_col`, title: col[0], category: 'collectible', rarity: 'common', icon: col[1], series: id },
    { id: `se_${id}_cur`, title: `${name}のカーテン`, category: 'furniture', rarity: 'rare', icon: '🪟', slot: 'curtain', tint, series: id },
    { id: `se_${id}_rug`, title: `${name}のラグ`, category: 'furniture', rarity: 'rare', icon: '⭕', slot: 'rug', tint, series: id },
    { id: `se_${id}_bed`, title: `${name}のふとん`, category: 'furniture', rarity: 'superRare', icon: '🛏️', slot: 'bed', tint, series: id }
  );
});

// ---------- 季節限定（その季節の冒険でだけ見つかる）。試作では秋のみ ----------
ITEMS.push(
  { id: 'aut_maple', title: 'もみじのしおり', category: 'collectible', rarity: 'common', icon: '🍁', season: 'autumn' },
  { id: 'aut_ginkgo', title: 'いちょうの葉っぱ', category: 'collectible', rarity: 'common', icon: '🍂', season: 'autumn' },
  { id: 'aut_imo', title: 'やきいも', category: 'collectible', rarity: 'common', icon: '🍠', season: 'autumn', food: { pose: 'eat_base', line: 'ほくほく…あったかい！', motion: 'eat' }, desc: 'ごはんメニューに追加される' },
  { id: 'aut_susuki', title: 'すすきのかびん', category: 'furniture', rarity: 'common', icon: '🌾', slot: 'top', season: 'autumn' },
  { id: 'aut_pumpkin', title: 'かぼちゃのランタン', category: 'furniture', rarity: 'rare', icon: '🎃', slot: 'top', season: 'autumn' },
  { id: 'aut_dango', title: 'お月見だんご', category: 'collectible', rarity: 'rare', icon: '🍡', season: 'autumn', food: { pose: 'eat_base', line: 'もちもち…お月さま見ながら食べたいな', motion: 'eat' }, desc: 'ごはんメニューに追加される' },
  { id: 'aut_curtain', title: 'もみじ色のカーテン', category: 'furniture', rarity: 'superRare', icon: '🍁', slot: 'curtain', tint: '#eea47e', season: 'autumn' },
  { id: 'aut_scroll', title: 'お月見のかけじく', category: 'furniture', rarity: 'superRare', icon: '🎑', slot: 'wall', season: 'autumn' },
  // 冬
  { id: 'win_snowflake', title: 'ゆきのかけら', category: 'collectible', rarity: 'common', icon: '❄️', season: 'winter' },
  { id: 'win_mikan', title: 'みかん', category: 'collectible', rarity: 'common', icon: '🍊', season: 'winter', food: { pose: 'eat_base', line: 'あまくて、すっぱい…しあわせ', motion: 'eat' }, desc: 'ごはんメニューに追加される' },
  { id: 'win_cocoa', title: 'ほっとココア', category: 'collectible', rarity: 'rare', icon: '☕', season: 'winter', food: { pose: 'eat_base', line: 'ふーふー…あまくてあったかい', motion: 'drink', cup: 'tea' }, desc: 'ごはんメニューに追加される' },
  { id: 'win_snowman', title: 'ちいさなゆきだるま', category: 'furniture', rarity: 'common', icon: '⛄', slot: 'top', season: 'winter' },
  { id: 'win_tree', title: 'ちいさなもみの木', category: 'furniture', rarity: 'rare', icon: '🎄', slot: 'top', season: 'winter' },
  { id: 'win_mitten', title: 'てぶくろのぬいぐるみ', category: 'furniture', rarity: 'rare', icon: '🧤', slot: 'plush', season: 'winter' },
  { id: 'win_curtain', title: 'ゆきいろのカーテン', category: 'furniture', rarity: 'superRare', icon: '🌨️', slot: 'curtain', tint: '#dfe8f5', season: 'winter' },
  { id: 'win_garland', title: 'きらきらのガーランド', category: 'furniture', rarity: 'superRare', icon: '✨', slot: 'wall', season: 'winter' }
);
// ---------- 描いてもらった絵の割り当て（名前も絵に合わせて調整） ----------
ITEMS.push(
  // ベッドの上
  { id: 'pl_bear', title: 'くまのぬいぐるみ', category: 'furniture', rarity: 'common', icon: '🧸', slot: 'plush', shopPrice: 200 },
  { id: 'pl_sheep', title: 'ひつじのぬいぐるみ', category: 'furniture', rarity: 'common', icon: '🐑', slot: 'plush', shopPrice: 220 },
  { id: 'pl_heart', title: 'ハートのクッション', category: 'furniture', rarity: 'common', icon: '💗', slot: 'plush', shopPrice: 150 },
  { id: 'pl_chick', title: 'ひよこのぬいぐるみ', category: 'furniture', rarity: 'common', icon: '🐥', slot: 'plush', area: 'flowerForest' },
  { id: 'pl_flower', title: 'お花のクッション', category: 'furniture', rarity: 'rare', icon: '🌼', slot: 'plush', area: 'flowerForest' },
  // 壁
  { id: 'wall_clover', title: 'クローバーのメモ', category: 'furniture', rarity: 'common', icon: '🍀', slot: 'wall', shopPrice: 100 },
  { id: 'wall_bow', title: 'リボンのかざり', category: 'furniture', rarity: 'common', icon: '🎀', slot: 'wall', shopPrice: 130 },
  // タンスの上
  { id: 'top_candle', title: 'アロマキャンドル', category: 'furniture', rarity: 'common', icon: '🕯️', slot: 'top', shopPrice: 150 },
  { id: 'top_diffuser', title: 'ルームフレグランス', category: 'furniture', rarity: 'common', icon: '🧴', slot: 'top', shopPrice: 180 },
  { id: 'top_hatbox', title: 'ぼうしの箱', category: 'furniture', rarity: 'common', icon: '📦', slot: 'top', shopPrice: 160 },
  { id: 'top_books2', title: '本だて', category: 'furniture', rarity: 'common', icon: '📚', slot: 'top', area: 'moonLake' },
  { id: 'top_perfume', title: 'こうすいびん', category: 'furniture', rarity: 'rare', icon: '🧪', slot: 'top', area: 'moonLake' },
  // 収集品
  { id: 'col_pinecone', title: 'まつぼっくり', category: 'collectible', rarity: 'common', icon: '🌲', area: 'flowerForest' },
  { id: 'col_key', title: 'ふしぎな鍵', category: 'collectible', rarity: 'rare', icon: '🗝️', area: 'starHill' },
  { id: 'col_diary', title: '冒険の日記帳', category: 'collectible', rarity: 'superRare', icon: '📔', area: 'moonLake' },
  { id: 'col_clover_white', title: 'しろつめのクローバー', category: 'collectible', rarity: 'common', icon: '☘️', img: 'it2_clover_white', area: 'flowerForest' },
  { id: 'col_clover_flower', title: '花のクローバー', category: 'collectible', rarity: 'rare', icon: '🍀', img: 'it2_clover_flower', area: 'flowerForest' },
  { id: 'col_acorn_leaf', title: 'はっぱつきどんぐり', category: 'collectible', rarity: 'common', icon: '🌰', img: 'it2_acorn_leaf', area: 'flowerForest' },
  { id: 'col_acorn_glow', title: 'きらめきどんぐり', category: 'collectible', rarity: 'superRare', icon: '🌰', img: 'it2_acorn_glow', area: 'flowerForest' },
  { id: 'col_mush_red', title: 'あかいきのこ', category: 'collectible', rarity: 'common', icon: '🍄', img: 'it2_mush_red', area: 'flowerForest' },
  { id: 'col_mush_yellow', title: 'きいろのきのこ', category: 'collectible', rarity: 'common', icon: '🍄', img: 'it2_mush_yellow', area: 'flowerForest' },
  { id: 'col_shell_spiral', title: 'まき貝', category: 'collectible', rarity: 'common', icon: '🐚', img: 'it2_shell_spiral', area: 'moonLake' },
  { id: 'col_shell_moon', title: '月光の貝', category: 'collectible', rarity: 'rare', icon: '🐚', img: 'it2_shell_moon', area: 'moonLake' },
  { id: 'col_shell_heart', title: 'ハートの貝', category: 'collectible', rarity: 'rare', icon: '🐚', img: 'it2_shell_heart', area: 'moonLake' },
  { id: 'col_drop_lake', title: '湖のしずく', category: 'collectible', rarity: 'common', icon: '💧', img: 'it2_drop_lake', area: 'moonLake' },
  { id: 'col_mush_glow', title: 'ひかるきのこ', category: 'collectible', rarity: 'rare', icon: '🍄', img: 'it2_mush_glow', area: 'moonLake' },
  { id: 'col_star_soft', title: 'あわいほしのかけら', category: 'collectible', rarity: 'common', icon: '⭐', img: 'it2_star_soft', area: 'starHill' },
  { id: 'col_drop_star', title: '星明かりのしずく', category: 'collectible', rarity: 'rare', icon: '💧', img: 'it2_drop_star', area: 'starHill' }
);
const ART: Record<string, string | [string, string]> = {
  bed_default: 'it_bed',
  rug_default: 'it_rug',
  chest_wood: 'it_dresser',
  chest_white: 'it_dresser',
  chest_mint: 'it_dresser',
  floor_books: 'it_books',
  floor_plant: 'it_plant',
  sill_cactus: ['it_succulent', 'ちいさな多肉植物'],
  sill_tulip: ['it_tulip', 'チューリップの花びん'],
  floor_sunflower: ['it_vase', 'かすみ草の花びん'],
  floor_mushroom: ['it_dome', 'ほしのガラスドーム'],
  floor_lotus: ['it_shellpearl', 'しんじゅの貝かざり'],
  cr_acorn_lamp: ['it_lantern', 'どんぐりランタン'],
  cr_stardust_jar: 'it_starjar',
  cr_block_castle: ['it_snowglobe', 'お城のスノードーム'],
  cr_clover_charm: ['it_pouch', 'しあわせのお守り袋'],
  wall_photo: 'it_polaroid',
  wall_poster: ['it_p_night', 'よぞらの絵'],
  wall_flowerwreath: ['it_p_flower', 'お花の額'],
  wall_moon: ['it_p_cloud', '月とくもの額'],
  wall_heart: ['it_bunting', 'フラッグガーランド'],
  wall_clock: ['it_p_sky', 'おそらの窓の絵'],
  wall_clover: 'it_p_clover',
  wall_bow: 'it_bow',
  pl_bunny: 'it_bunny',
  pl_cat: 'it_cat',
  pl_whale: ['it_penguin', 'ペンギンのぬいぐるみ'],
  pl_bear: 'it_bear',
  pl_sheep: 'it_sheep',
  pl_heart: 'it_c_heart',
  pl_chick: 'it_chick',
  pl_flower: 'it_c_flower',
  floor_starcushion: 'it_c_star',
  cr_star_sofa: ['it_c_moon', 'つきのだきまくら'],
  wall_cloud: ['it_c_cloud', 'くものクッション'],
  top_candle: 'it_candle',
  top_diffuser: 'it_diffuser',
  top_hatbox: 'it_hatbox',
  top_books2: 'it_books2',
  top_perfume: 'it_perfume',
  col_acorn: 'it_acorn',
  col_shell: 'it_shell',
  col_petal: ['it_flower', 'さくらのお花'],
  col_hello: 'it_flower',
  col_clover: 'it_clover',
  col_stardust: 'it_star',
  col_crystal: 'it_crystal',
  col_drop: 'it_gem',
  col_moonpiece: 'it_charm_moon',
  col_comet: 'it_charm_star',
  col_letter: 'it_letter',
  col_bouquet: 'it_tulip',
  col_ribbon: 'it_bow',
  col_pinecone: 'it_pinecone',
  col_key: 'it_key',
  col_diary: 'it_diary',
};
// 2回目にもらった素材（家具・小物・収集品）で描き直したもの
Object.assign(ART, {
  col_stardust: ['it2_star_glow', 'ひかるほしのかけら'],
  col_crystal: 'it2_star_crystal',
  col_shell: 'it2_shell_sakura',
  col_drop: 'it2_drop_moon',
  col_clover: 'it2_clover_green',
  col_acorn: 'it2_acorn',
  col_letter: 'it2_letter_luu',
  col_diary: ['it2_book_adv', 'ぼうけん手帳'],
  wall_poster: ['it2_poster_hill', '星空の丘のポスター'],
  wall_photo: ['it2_photo_luu', 'るうの写真'],
  rug_flower: 'it2_rug_flower',
});
ITEMS.forEach((it) => {
  const a = ART[it.id];
  if (!a) return;
  if (Array.isArray(a)) [it.img, it.title] = a;
  else it.img = a;
});
// 部屋に置くもの・おもちゃで絵がまだないものは「準備中」：新しくは手に入らない（絵が届いたら外す）
export const RESTING = ['wall_rainbow', 'wall_mobile', 'wall_wreath', 'toy_chime', 'toy_kite', 'cr_sakura_garland', 'cr_shell_mobile', 'cr_pebble_jar', 'cr_kite_garland', 'cr_telescope', 'aut_susuki', 'aut_pumpkin', 'aut_scroll', 'win_snowman', 'win_tree', 'win_mitten', 'win_garland'];
ITEMS.forEach((it) => void (RESTING.includes(it.id) && (it.resting = true)));
// くものクッションはベッドの上に置くものに変更
Object.assign(ITEMS.find((i) => i.id === 'wall_cloud')!, { slot: 'plush' });
// タンスの色違いは絵にフィルターをかけて表現
Object.assign(ITEMS.find((i) => i.id === 'chest_white')!, { chestFilter: 'brightness(1.13) saturate(0.25)' });
Object.assign(ITEMS.find((i) => i.id === 'chest_mint')!, { chestFilter: 'hue-rotate(75deg) saturate(0.75) brightness(1.06)' });

export const SEASON_NAMES = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' } as const;

export const ITEM_MAP: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const item = (id: string) => ITEM_MAP[id];

export const INITIAL_INVENTORY: Record<string, number> = { bed_default: 1, rug_default: 1, cur_default: 1 };

/** 成長・親密度の記念プレゼント（全員に無料・1回のみ） */
/** 成長の記念：あたらしいあそび（おもちゃ）。ごはんは content.ts の FOODS の stage で増える */
export const STAGE_GIFTS: Record<number, string[]> = { 2: ['toy_ball'], 3: ['toy_horse'], 4: ['toy_piano', 'out_muffler'] };
export const BOND_GIFTS: Record<number, string[]> = { 2: ['col_letter'], 3: ['col_bouquet', 'tp_book_memory'], 4: ['wall_photo', 'tp_music_luu'], 5: ['col_ribbon', 'pl_luu'] };
/** 季節プレゼント（月 → アイテム）。今は秋のみ用意 */
export const SEASON_GIFTS: Array<{ months: number[]; season: string; itemId: string }> = [
  { months: [9, 10, 11], season: '秋', itemId: 'wl_dryflower' },
  { months: [12, 1, 2], season: '冬', itemId: 'rug_snow' },
  { months: [3, 4, 5], season: '春', itemId: 'wl_garland_flower' },
  { months: [6, 7, 8], season: '夏', itemId: 'tp_jar_lake' },
];

export const CATEGORY_NAMES: Record<string, string> = {
  furniture: '家具',
  outfit: '衣装',
  toy: 'おもちゃ',
  collectible: '収集品',
};
/** アイテムの置き場所の表示名（おみせ・図鑑用） */
export const KIND_NAMES: Record<string, string> = { bed: 'ベッド', plush: 'ベッドの上', rug: 'ラグ', curtain: 'カーテン', wall: '壁', chest: 'タンス', top: 'タンスの上', floor: 'ゆか' };
export const SLOT_NAMES: Record<string, string> = { bed: 'ベッド', plush: 'ベッドの上', rug: 'ラグ', curtain: 'カーテン', wall: '壁（上）', wall2: '壁（下）', chest: 'タンス', top: 'タンスの上', top2: 'タンスの上', floor: 'ゆか（ベッドのよこ）', floor2: 'ゆか（てまえ）' };
