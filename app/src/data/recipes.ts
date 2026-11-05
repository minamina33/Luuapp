/**
 * 工作レシピ：material を need 個あつめると result がつくれる
 * つくると need-1 個を使い、1個は手もとに残る（図鑑・飾りつけ用）
 * 数は仮。config と同じく、ここを書き換えれば調整できる
 */
export interface Recipe {
  id: string;
  material: string;
  need: number;
  result: string;
}
export const RECIPES: Recipe[] = [
  // 花の森
  { id: 'r_petal', material: 'col_petal', need: 5, result: 'cr_sakura_garland' },
  { id: 'r_acorn', material: 'col_acorn', need: 5, result: 'cr_acorn_lamp' },
  { id: 'r_berry', material: 'col_berry', need: 4, result: 'cr_berry_tart' },
  { id: 'r_blocks', material: 'toy_blocks', need: 3, result: 'cr_block_castle' },
  { id: 'r_sunflower', material: 'floor_sunflower', need: 3, result: 'cr_sun_rug' },
  { id: 'r_clover', material: 'col_clover', need: 3, result: 'cr_clover_charm' },
  // 月あかりの湖
  { id: 'r_shell', material: 'col_shell', need: 5, result: 'cr_shell_mobile' },
  { id: 'r_pebble', material: 'col_pebble', need: 5, result: 'cr_pebble_jar' },
  { id: 'r_chime', material: 'toy_chime', need: 3, result: 'cr_herb_tea' },
  { id: 'r_drop', material: 'col_drop', need: 3, result: 'cr_moon_bed' },
  // 星空の丘
  { id: 'r_stardust', material: 'col_stardust', need: 5, result: 'cr_stardust_jar' },
  { id: 'r_kite', material: 'toy_kite', need: 3, result: 'cr_kite_garland' },
  { id: 'r_scope', material: 'col_scope', need: 3, result: 'cr_telescope' },
  { id: 'r_cushion', material: 'floor_starcushion', need: 3, result: 'cr_star_sofa' },
];
/** まだつくっていないレシピ（素材ごと） */
export const recipeFor = (material: string, inv: Record<string, number>) =>
  ACTIVE_RECIPES.find((r) => r.material === material && !(inv[r.result] > 0));

/** 絵の準備中のものを作る・使うレシピはお休み */
import { RESTING } from './items';
export const ACTIVE_RECIPES = RECIPES.filter((r) => !RESTING.includes(r.result) && !RESTING.includes(r.material));
