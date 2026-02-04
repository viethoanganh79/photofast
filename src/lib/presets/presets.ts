/**
 * presets.ts
 * 
 * Preset definitions với đầy đủ filter parameters
 * Mỗi preset có thể điều chỉnh tất cả các thông số như Lightroom
 */

import type { FilterState } from '../canvas/filters';

export interface Preset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  filters: FilterState;
}

/**
 * Default values cho filters (tất cả = 0)
 */
const defaultFilters: FilterState = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  hue: 0,
  // HSL Hue per channel
  hueRed: 0,
  hueOrange: 0,
  hueYellow: 0,
  hueGreen: 0,
  hueCyan: 0,
  hueBlue: 0,
  huePurple: 0,
  hueMagenta: 0,
  // HSL Saturation per channel
  satRed: 0,
  satOrange: 0,
  satYellow: 0,
  satGreen: 0,
  satCyan: 0,
  satBlue: 0,
  satPurple: 0,
  satMagenta: 0,
  // Effects
  clarity: 0,
  sharpness: 0,
  blur: 0,
  vignette: 0,
  noise: 0,
  grain: 0,
  fade: 0,
};

/**
 * Danh sách preset mặc định
 */
export const presets: Preset[] = [
  {
    id: 'original',
    name: 'Original',
    emoji: '📷',
    description: 'Ảnh gốc, không chỉnh sửa',
    filters: { ...defaultFilters },
  },
  {
    id: 'vivid',
    name: 'Vivid',
    emoji: '🌈',
    description: 'Màu sắc sống động, tươi sáng',
    filters: {
      ...defaultFilters,
      exposure: 5,
      contrast: 15,
      vibrance: 35,
      saturation: 20,
      clarity: 10,
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    emoji: '🌅',
    description: 'Tông màu ấm áp, hoàng hôn',
    filters: {
      ...defaultFilters,
      exposure: 5,
      temperature: 40,
      tint: 10,
      vibrance: 15,
      saturation: 10,
      highlights: -10,
      shadows: 15,
    },
  },
  {
    id: 'cool',
    name: 'Cool',
    emoji: '❄️',
    description: 'Tông màu lạnh, trong trẻo',
    filters: {
      ...defaultFilters,
      temperature: -35,
      tint: -5,
      contrast: 10,
      vibrance: 10,
      highlights: 5,
      clarity: 5,
    },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    emoji: '📻',
    description: 'Phong cách cổ điển, hoài niệm',
    filters: {
      ...defaultFilters,
      exposure: 5,
      contrast: -10,
      saturation: -25,
      temperature: 15,
      fade: 30,
      grain: 20,
      vignette: -25,
    },
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    emoji: '🎭',
    description: 'Tương phản cao, ấn tượng mạnh',
    filters: {
      ...defaultFilters,
      exposure: -5,
      contrast: 45,
      highlights: -20,
      shadows: 25,
      clarity: 30,
      vibrance: 15,
      vignette: -30,
    },
  },
  {
    id: 'soft',
    name: 'Soft',
    emoji: '🌸',
    description: 'Mềm mại, nhẹ nhàng, dreamy',
    filters: {
      ...defaultFilters,
      exposure: 10,
      contrast: -20,
      highlights: -15,
      shadows: 20,
      saturation: -15,
      clarity: -20,
      fade: 15,
    },
  },
  {
    id: 'bw',
    name: 'B&W',
    emoji: '🖤',
    description: 'Đen trắng cổ điển',
    filters: {
      ...defaultFilters,
      saturation: -100,
      contrast: 25,
      clarity: 15,
      grain: 10,
    },
  },
  {
    id: 'cinematic',
    name: 'Cinema',
    emoji: '🎬',
    description: 'Phong cách điện ảnh',
    filters: {
      ...defaultFilters,
      contrast: 20,
      temperature: -10,
      tint: 5,
      highlights: -15,
      shadows: 10,
      saturation: -10,
      fade: 10,
      vignette: -35,
    },
  },
  {
    id: 'portrait',
    name: 'Portrait',
    emoji: '👤',
    description: 'Tối ưu cho ảnh chân dung',
    filters: {
      ...defaultFilters,
      exposure: 5,
      contrast: 5,
      highlights: -10,
      shadows: 15,
      temperature: 10,
      vibrance: 10,
      clarity: -10,
      sharpness: 20,
    },
  },
  {
    id: 'landscape',
    name: 'Landscape',
    emoji: '🏔️',
    description: 'Tối ưu cho ảnh phong cảnh',
    filters: {
      ...defaultFilters,
      exposure: 5,
      contrast: 15,
      highlights: -20,
      shadows: 30,
      vibrance: 25,
      clarity: 25,
      sharpness: 15,
    },
  },
  {
    id: 'moody',
    name: 'Moody',
    emoji: '🌙',
    description: 'Tối, bí ẩn, sâu lắng',
    filters: {
      ...defaultFilters,
      exposure: -15,
      contrast: 20,
      highlights: -30,
      shadows: -10,
      temperature: -15,
      saturation: -20,
      clarity: 15,
      vignette: -40,
    },
  },
];

/**
 * Tìm preset theo ID
 */
export function getPresetById(id: string): Preset | undefined {
  return presets.find(p => p.id === id);
}
