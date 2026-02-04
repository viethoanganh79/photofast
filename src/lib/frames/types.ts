/**
 * Photo Frames - Type Definitions
 * Định nghĩa các interface cho tính năng khung ảnh
 */

// Loại khung
export type FrameCategory = 'basic' | 'decorative';

// ID các khung cơ bản
export type BasicFrameId = 'solid' | 'double' | 'rounded' | 'shadow' | 'gradient' | 'dashed';

// ID các khung trang trí
export type DecorativeFrameId = 'polaroid' | 'vintage' | 'filmstrip' | 'tape' | 'stamp' | 'torn';

// Union type cho tất cả frame IDs
export type FrameId = BasicFrameId | DecorativeFrameId | 'none';

/**
 * Cấu hình cho một loại khung
 */
export interface FrameConfig {
  id: FrameId;
  name: string;
  icon: string;
  category: FrameCategory;
  description: string;
  defaultOptions: FrameOptions;
  customizable: CustomizableOptions;
}

/**
 * Options để render khung
 */
export interface FrameOptions {
  // Basic options - áp dụng cho hầu hết các khung
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  
  // Double frame specific
  innerWidth?: number;
  gap?: number;
  innerColor?: string;
  
  // Shadow specific
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  
  // Gradient specific
  gradientColor2?: string;
  gradientDirection?: 'horizontal' | 'vertical' | 'diagonal';
  
  // Dashed specific
  dashArray?: number[];
  dashOffset?: number;
}

/**
 * Định nghĩa những gì có thể tùy chỉnh cho mỗi loại khung
 */
export interface CustomizableOptions {
  color: boolean;
  width: boolean;
  radius: boolean;
  shadow: boolean;
  gradient: boolean;
  innerColor: boolean;
  gap: boolean;
}

/**
 * State của khung đang được áp dụng
 */
export interface AppliedFrame {
  config: FrameConfig;
  options: FrameOptions;
  // Lưu reference để có thể xóa sau này
  objectIds: string[];
}

/**
 * Default options cho frame mới
 */
export const DEFAULT_FRAME_OPTIONS: FrameOptions = {
  borderWidth: 20,
  borderColor: '#ffffff',
  borderRadius: 0,
  innerWidth: 10,
  gap: 8,
  innerColor: '#e5e5e5',
  shadowBlur: 15,
  shadowColor: 'rgba(0, 0, 0, 0.2)',
  shadowOffsetX: 0,
  shadowOffsetY: 5,
  gradientColor2: '#a855f7',
  gradientDirection: 'diagonal',
  dashArray: [15, 10],
  dashOffset: 0,
};

/**
 * Default customizable options (tất cả disabled)
 */
export const DEFAULT_CUSTOMIZABLE: CustomizableOptions = {
  color: false,
  width: false,
  radius: false,
  shadow: false,
  gradient: false,
  innerColor: false,
  gap: false,
};

