/**
 * Photo Frames Module
 * Export tất cả các types, configs và functions cho tính năng khung ảnh
 */

// Types
export type {
  FrameCategory,
  BasicFrameId,
  DecorativeFrameId,
  FrameId,
  FrameConfig,
  FrameOptions,
  CustomizableOptions,
  AppliedFrame,
} from './types';

export {
  DEFAULT_FRAME_OPTIONS,
  DEFAULT_CUSTOMIZABLE,
} from './types';

// Basic Frames
export {
  solidFrame,
  doubleFrame,
  roundedFrame,
  shadowFrame,
  gradientFrame,
  dashedFrame,
  basicFrames,
  getBasicFrameById,
} from './basicFrames';

// Decorative Frames
export {
  polaroidFrame,
  vintageFrame,
  filmstripFrame,
  tapeFrame,
  stampFrame,
  tornFrame,
  decorativeFrames,
  getDecorativeFrameById,
} from './decorativeFrames';

// Frame Renderer
export {
  renderFrame,
  updateFrameOptions,
  removeAllFrameObjects,
  getAllFrameConfigs,
  getFrameConfigById,
} from './frameRenderer';

