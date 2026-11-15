import type { Role } from './types.ts';

// Иконки из игры для шапок страниц и вкладок ролей (имена файлов иконок WoW)
export const ROLE_ICON: Record<Role, string> = {
  dps: 'ability_dualwield',
  heal: 'spell_holy_flashheal',
  tank: 'inv_shield_06',
};

export const PAGE_ICON = {
  characters: 'inv_misc_grouplooking',
  items: 'inv_misc_bag_10_blue',
  planner: 'inv_chest_plate16',
  forever: 'inv_misc_head_dragon_black',
  about: 'inv_misc_book_11',
} as const;
