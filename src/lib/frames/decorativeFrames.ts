/**
 * Decorative Frames - Cấu hình cho các khung trang trí
 * 6 loại khung: polaroid, vintage, filmstrip, tape, stamp, torn
 */

import type { FrameConfig } from './types';
import { DEFAULT_FRAME_OPTIONS, DEFAULT_CUSTOMIZABLE } from './types';

/**
 * Polaroid Frame - Khung ảnh chụp lấy liền
 * Đặc điểm: Viền trắng, phần dưới dày hơn
 */
export const polaroidFrame: FrameConfig = {
  id: 'polaroid',
  name: 'Polaroid',
  icon: '📷',
  category: 'decorative',
  description: 'Khung ảnh kiểu chụp lấy liền cổ điển',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 20,
    borderColor: '#ffffff',
    borderRadius: 2,
    shadowBlur: 15,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffsetY: 5,
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    // Polaroid có style cố định
  },
};

/**
 * Vintage Frame - Khung gỗ cổ điển
 * Đặc điểm: Màu nâu gỗ, có texture
 */
export const vintageFrame: FrameConfig = {
  id: 'vintage',
  name: 'Vintage',
  icon: '🪵',
  category: 'decorative',
  description: 'Khung gỗ cổ điển với vẻ đẹp hoài cổ',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 30,
    borderColor: '#8B4513',
    borderRadius: 4,
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    color: true,
    width: true,
  },
};

/**
 * Film Strip Frame - Khung cuộn phim
 * Đặc điểm: Có lỗ đục 2 bên như cuộn phim
 */
export const filmstripFrame: FrameConfig = {
  id: 'filmstrip',
  name: 'Cuộn phim',
  icon: '🎞️',
  category: 'decorative',
  description: 'Khung kiểu cuộn phim với lỗ đục hai bên',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 40,
    borderColor: '#1a1a1a',
    borderRadius: 0,
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    // Film strip có style cố định
  },
};

/**
 * Tape Frame - Khung băng dính
 * Đặc điểm: 4 góc có miếng băng dính
 */
export const tapeFrame: FrameConfig = {
  id: 'tape',
  name: 'Băng dính',
  icon: '📎',
  category: 'decorative',
  description: 'Khung với băng dính 4 góc như dán vào album',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 0,
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    // Tape có style cố định
  },
};

/**
 * Stamp Frame - Khung tem thư
 * Đặc điểm: Viền răng cưa như tem bưu điện
 */
export const stampFrame: FrameConfig = {
  id: 'stamp',
  name: 'Tem thư',
  icon: '📮',
  category: 'decorative',
  description: 'Khung viền răng cưa như tem bưu điện',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 15,
    borderColor: '#ffffff',
    borderRadius: 0,
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    color: true,
  },
};

/**
 * Torn Paper Frame - Khung giấy xé
 * Đặc điểm: Viền như giấy bị xé rách tự nhiên
 */
export const tornFrame: FrameConfig = {
  id: 'torn',
  name: 'Giấy xé',
  icon: '📄',
  category: 'decorative',
  description: 'Khung với viền như giấy bị xé rách',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 25,
    borderColor: '#fefce8',
    borderRadius: 0,
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    color: true,
  },
};

/**
 * Danh sách tất cả decorative frames
 */
export const decorativeFrames: FrameConfig[] = [
  polaroidFrame,
  vintageFrame,
  filmstripFrame,
  tapeFrame,
  stampFrame,
  tornFrame,
];

/**
 * Lấy config của một decorative frame theo ID
 */
export function getDecorativeFrameById(id: string): FrameConfig | undefined {
  return decorativeFrames.find(frame => frame.id === id);
}

