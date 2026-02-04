/**
 * Basic Frames - Cấu hình cho các khung cơ bản
 * 6 loại khung: solid, double, rounded, shadow, gradient, dashed
 */

import type { FrameConfig, FrameOptions, CustomizableOptions } from './types';
import { DEFAULT_FRAME_OPTIONS, DEFAULT_CUSTOMIZABLE } from './types';

/**
 * Solid Frame - Viền đơn sắc
 */
export const solidFrame: FrameConfig = {
  id: 'solid',
  name: 'Viền đơn',
  icon: '▪️',
  category: 'basic',
  description: 'Khung viền đơn giản với một màu',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 20,
    borderColor: '#ffffff',
    borderRadius: 0,
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    color: true,
    width: true,
    radius: true,
  },
};

/**
 * Double Frame - Viền kép
 */
export const doubleFrame: FrameConfig = {
  id: 'double',
  name: 'Viền kép',
  icon: '▫️',
  category: 'basic',
  description: 'Hai đường viền song song với khoảng cách',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 16,
    borderColor: '#22c55e',
    borderRadius: 0,
    innerWidth: 8,
    gap: 6,
    innerColor: '#bbf7d0',
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    color: true,
    width: true,
    radius: true,
    innerColor: true,
    gap: true,
  },
};

/**
 * Rounded Frame - Viền bo góc
 */
export const roundedFrame: FrameConfig = {
  id: 'rounded',
  name: 'Bo góc',
  icon: '⬜',
  category: 'basic',
  description: 'Khung với các góc bo tròn mềm mại',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 20,
    borderColor: '#f97316',
    borderRadius: 24,
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    color: true,
    width: true,
    radius: true,
  },
};

/**
 * Shadow Frame - Viền có bóng đổ
 */
export const shadowFrame: FrameConfig = {
  id: 'shadow',
  name: 'Bóng đổ',
  icon: '🔲',
  category: 'basic',
  description: 'Khung với hiệu ứng bóng đổ đẹp mắt',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 16,
    borderColor: '#ffffff',
    borderRadius: 8,
    shadowBlur: 20,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffsetX: 0,
    shadowOffsetY: 8,
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    color: true,
    width: true,
    radius: true,
    shadow: true,
  },
};

/**
 * Gradient Frame - Viền gradient
 */
export const gradientFrame: FrameConfig = {
  id: 'gradient',
  name: 'Gradient',
  icon: '🌈',
  category: 'basic',
  description: 'Khung với màu chuyển gradient đẹp mắt',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 20,
    borderColor: '#22c55e',
    borderRadius: 0,
    gradientColor2: '#a855f7',
    gradientDirection: 'diagonal',
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    color: true,
    width: true,
    radius: true,
    gradient: true,
  },
};

/**
 * Dashed Frame - Viền nét đứt
 */
export const dashedFrame: FrameConfig = {
  id: 'dashed',
  name: 'Nét đứt',
  icon: '▫️',
  category: 'basic',
  description: 'Khung viền kiểu đường đứt đoạn',
  defaultOptions: {
    ...DEFAULT_FRAME_OPTIONS,
    borderWidth: 4,
    borderColor: '#64748b',
    borderRadius: 0,
    dashArray: [15, 10],
  },
  customizable: {
    ...DEFAULT_CUSTOMIZABLE,
    color: true,
    width: true,
    radius: true,
  },
};

/**
 * Danh sách tất cả basic frames
 */
export const basicFrames: FrameConfig[] = [
  solidFrame,
  doubleFrame,
  roundedFrame,
  shadowFrame,
  gradientFrame,
  dashedFrame,
];

/**
 * Lấy config của một basic frame theo ID
 */
export function getBasicFrameById(id: string): FrameConfig | undefined {
  return basicFrames.find(frame => frame.id === id);
}

