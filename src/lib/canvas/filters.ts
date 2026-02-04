/**
 * filters.ts
 * 
 * Comprehensive filter system giống Lightroom
 * - Light: Exposure, Brightness, Contrast, Highlights, Shadows, Whites, Blacks
 * - Color: Temperature, Tint, Vibrance, Saturation, Hue
 * - HSL: Per-channel Hue, Saturation, Luminance adjustments
 * - Effects: Clarity, Sharpness, Blur, Vignette, Grain, Fade
 */

import { FabricImage, filters } from 'fabric';

// Type alias cho filter
type BaseFilter = InstanceType<typeof filters.BaseFilter>;

/**
 * Interface cho filter state - đầy đủ như Lightroom
 */
export interface FilterState {
  // === LIGHT ===
  exposure: number;      // -100 to 100 (phơi sáng)
  brightness: number;    // -100 to 100
  contrast: number;      // -100 to 100
  highlights: number;    // -100 to 100 (vùng sáng)
  shadows: number;       // -100 to 100 (vùng tối)
  whites: number;        // -100 to 100 (điểm trắng)
  blacks: number;        // -100 to 100 (điểm đen)
  
  // === COLOR ===
  temperature: number;   // -100 (cool/blue) to 100 (warm/orange)
  tint: number;          // -100 (green) to 100 (magenta)
  vibrance: number;      // -100 to 100 (smart saturation)
  saturation: number;    // -100 to 100
  hue: number;           // -180 to 180 (degrees)
  
  // === HSL (Per-channel adjustments) ===
  // Hue shift per color (-100 to 100)
  hueRed: number;
  hueOrange: number;
  hueYellow: number;
  hueGreen: number;
  hueCyan: number;
  hueBlue: number;
  huePurple: number;
  hueMagenta: number;
  
  // Saturation per color (-100 to 100)
  satRed: number;
  satOrange: number;
  satYellow: number;
  satGreen: number;
  satCyan: number;
  satBlue: number;
  satPurple: number;
  satMagenta: number;
  
  // === EFFECTS ===
  clarity: number;       // -100 to 100 (local contrast)
  sharpness: number;     // 0 to 100
  blur: number;          // 0 to 100
  vignette: number;      // -100 to 100 (negative = darken edges)
  noise: number;         // 0 to 100 (digital noise - monochrome)
  grain: number;         // 0 to 100 (film grain - subtle, artistic)
  fade: number;          // 0 to 100 (lift blacks)
}

/**
 * Default filter state - tất cả về 0
 */
export const defaultFilterState: FilterState = {
  // Light
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  
  // Color
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  hue: 0,
  
  // HSL - Hue per channel
  hueRed: 0,
  hueOrange: 0,
  hueYellow: 0,
  hueGreen: 0,
  hueCyan: 0,
  hueBlue: 0,
  huePurple: 0,
  hueMagenta: 0,
  
  // HSL - Saturation per channel
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
 * Filter groups configuration cho UI
 */
export const filterGroups = [
  {
    id: 'light',
    name: 'Light',
    icon: '🔆',
    filters: [
      { key: 'exposure', label: 'Exposure', min: -100, max: 100, icon: '💡' },
      { key: 'brightness', label: 'Brightness', min: -100, max: 100, icon: '☀️' },
      { key: 'contrast', label: 'Contrast', min: -100, max: 100, icon: '🌗' },
      { key: 'highlights', label: 'Highlights', min: -100, max: 100, icon: '🔅' },
      { key: 'shadows', label: 'Shadows', min: -100, max: 100, icon: '🌑' },
      { key: 'whites', label: 'Whites', min: -100, max: 100, icon: '⬜' },
      { key: 'blacks', label: 'Blacks', min: -100, max: 100, icon: '⬛' },
    ],
  },
  {
    id: 'color',
    name: 'Color',
    icon: '🎨',
    filters: [
      { key: 'temperature', label: 'Temperature', min: -100, max: 100, icon: '🌡️' },
      { key: 'tint', label: 'Tint', min: -100, max: 100, icon: '💜' },
      { key: 'vibrance', label: 'Vibrance', min: -100, max: 100, icon: '✨' },
      { key: 'saturation', label: 'Saturation', min: -100, max: 100, icon: '🎨' },
      { key: 'hue', label: 'Hue', min: -180, max: 180, unit: '°', icon: '🌈' },
    ],
  },
  {
    id: 'hslHue',
    name: 'HSL - Hue',
    icon: '🌈',
    filters: [
      { key: 'hueRed', label: 'Red', min: -100, max: 100, icon: '🔴' },
      { key: 'hueOrange', label: 'Orange', min: -100, max: 100, icon: '🟠' },
      { key: 'hueYellow', label: 'Yellow', min: -100, max: 100, icon: '🟡' },
      { key: 'hueGreen', label: 'Green', min: -100, max: 100, icon: '🟢' },
      { key: 'hueCyan', label: 'Cyan', min: -100, max: 100, icon: '🩵' },
      { key: 'hueBlue', label: 'Blue', min: -100, max: 100, icon: '🔵' },
      { key: 'huePurple', label: 'Purple', min: -100, max: 100, icon: '🟣' },
      { key: 'hueMagenta', label: 'Magenta', min: -100, max: 100, icon: '🩷' },
    ],
  },
  {
    id: 'hslSat',
    name: 'HSL - Saturation',
    icon: '💧',
    filters: [
      { key: 'satRed', label: 'Red', min: -100, max: 100, icon: '🔴' },
      { key: 'satOrange', label: 'Orange', min: -100, max: 100, icon: '🟠' },
      { key: 'satYellow', label: 'Yellow', min: -100, max: 100, icon: '🟡' },
      { key: 'satGreen', label: 'Green', min: -100, max: 100, icon: '🟢' },
      { key: 'satCyan', label: 'Cyan', min: -100, max: 100, icon: '🩵' },
      { key: 'satBlue', label: 'Blue', min: -100, max: 100, icon: '🔵' },
      { key: 'satPurple', label: 'Purple', min: -100, max: 100, icon: '🟣' },
      { key: 'satMagenta', label: 'Magenta', min: -100, max: 100, icon: '🩷' },
    ],
  },
  {
    id: 'effects',
    name: 'Effects',
    icon: '✨',
    filters: [
      { key: 'clarity', label: 'Clarity', min: -100, max: 100, icon: '🔍' },
      { key: 'sharpness', label: 'Sharpness', min: 0, max: 100, icon: '📐' },
      { key: 'blur', label: 'Blur', min: 0, max: 100, icon: '💨' },
      { key: 'vignette', label: 'Vignette', min: -100, max: 100, icon: '⭕' },
      { key: 'noise', label: 'Noise', min: 0, max: 100, icon: '📡' },
      { key: 'grain', label: 'Grain', min: 0, max: 100, icon: '🎞️' },
      { key: 'fade', label: 'Fade', min: 0, max: 100, icon: '🌫️' },
    ],
  },
] as const;

// ============================================
// FILTER CREATION FUNCTIONS
// ============================================

/**
 * Exposure - sử dụng Gamma filter
 * Exposure tăng/giảm tổng thể ánh sáng
 */
function createExposureFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  
  // Convert -100..100 to gamma values
  // Positive = brighter (gamma < 1), Negative = darker (gamma > 1)
  const gamma = value > 0 
    ? 1 - (value / 100) * 0.5  // 1 -> 0.5
    : 1 + (Math.abs(value) / 100) * 1; // 1 -> 2
  
  return new filters.Gamma({
    gamma: [gamma, gamma, gamma],
  });
}

/**
 * Brightness filter
 */
function createBrightnessFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  return new filters.Brightness({
    brightness: value / 100,
  });
}

/**
 * Contrast filter
 */
function createContrastFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  return new filters.Contrast({
    contrast: value / 100,
  });
}

/**
 * Highlights - điều chỉnh vùng sáng
 * Sử dụng ColorMatrix để target high luminance areas
 */
function createHighlightsFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  
  const factor = value / 200; // -0.5 to 0.5
  
  // Simplified highlights adjustment using gamma on bright areas
  return new filters.Gamma({
    gamma: [1 - factor * 0.3, 1 - factor * 0.3, 1 - factor * 0.3],
  });
}

/**
 * Shadows - điều chỉnh vùng tối
 * Sử dụng Gamma để lift shadows
 */
function createShadowsFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  
  const factor = value / 100;
  const gamma = factor > 0 
    ? 1 + factor * 0.5  // Lift shadows (gamma > 1)
    : 1 - Math.abs(factor) * 0.3; // Crush shadows
  
  return new filters.Gamma({
    gamma: [gamma, gamma, gamma],
  });
}

/**
 * Whites - điểm trắng
 */
function createWhitesFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  
  // Adjust brightness for whites
  return new filters.Brightness({
    brightness: value / 300,
  });
}

/**
 * Blacks - điểm đen (fade effect khi tăng)
 */
function createBlacksFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  
  // Negative = crush blacks, Positive = lift blacks (fade)
  const factor = value / 100;
  const gamma = factor > 0 
    ? 1 - factor * 0.3  // Lift blacks
    : 1 + Math.abs(factor) * 0.5; // Crush blacks
  
  return new filters.Gamma({
    gamma: [gamma, gamma, gamma],
  });
}

/**
 * Temperature - warm (orange) / cool (blue)
 * Sử dụng ColorMatrix
 */
function createTemperatureFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  
  const factor = value / 100;
  
  // Warm = more red/yellow, less blue
  // Cool = more blue, less red/yellow
  const matrix = [
    1 + factor * 0.1, 0, 0, 0, factor * 0.05,
    0, 1, 0, 0, factor * 0.02,
    0, 0, 1 - factor * 0.1, 0, -factor * 0.05,
    0, 0, 0, 1, 0,
  ];
  
  return new filters.ColorMatrix({ matrix });
}

/**
 * Tint - green / magenta
 * Sử dụng ColorMatrix
 */
function createTintFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  
  const factor = value / 100;
  
  // Positive = magenta, Negative = green
  const matrix = [
    1 + factor * 0.05, 0, 0, 0, 0,
    0, 1 - Math.abs(factor) * 0.05, 0, 0, 0,
    0, 0, 1 + factor * 0.05, 0, 0,
    0, 0, 0, 1, 0,
  ];
  
  return new filters.ColorMatrix({ matrix });
}

/**
 * Vibrance - smart saturation (protects skin tones)
 */
function createVibranceFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  return new filters.Vibrance({
    vibrance: value / 100,
  });
}

/**
 * Saturation filter
 */
function createSaturationFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  return new filters.Saturation({
    saturation: value / 100,
  });
}

/**
 * Hue Rotation filter
 */
function createHueRotationFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  return new filters.HueRotation({
    rotation: value * (Math.PI / 180), // Convert degrees to radians
  });
}

/**
 * Clarity - local contrast (simplified using unsharp mask concept)
 */
function createClarityFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  
  // Positive = more clarity (increase midtone contrast)
  // Negative = soften
  const factor = value / 100;
  
  return new filters.Contrast({
    contrast: factor * 0.3,
  });
}

/**
 * Sharpness - using Convolve filter
 */
function createSharpnessFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  
  const amount = value / 100;
  
  // Sharpen kernel
  const matrix = [
    0, -amount * 0.5, 0,
    -amount * 0.5, 1 + amount * 2, -amount * 0.5,
    0, -amount * 0.5, 0,
  ];
  
  return new filters.Convolute({
    matrix,
  });
}

/**
 * Blur filter
 */
function createBlurFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  return new filters.Blur({
    blur: value / 200, // 0 to 0.5
  });
}

/**
 * Vignette - darken/lighten edges
 * Note: True vignette needs custom implementation
 * This is a simplified version using brightness
 */
function createVignetteFilter(value: number): BaseFilter | null {
  // Vignette requires canvas-level implementation
  // Returning null for now - will implement via overlay
  return null;
}

/**
 * Noise - digital noise (monochrome, harsh)
 * Stronger effect than grain
 */
function createNoiseFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  return new filters.Noise({
    noise: value * 5, // 0 to 500 (stronger effect)
  });
}

/**
 * Grain - film grain (subtle, artistic)
 * Softer effect than noise
 */
function createGrainFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  return new filters.Noise({
    noise: value * 1.5, // 0 to 150 (softer effect)
  });
}

/**
 * Fade - lift blacks for faded look
 */
function createFadeFilter(value: number): BaseFilter | null {
  if (value === 0) return null;
  
  const factor = value / 100;
  
  // Lift black point
  const matrix = [
    1, 0, 0, 0, factor * 0.15,
    0, 1, 0, 0, factor * 0.15,
    0, 0, 1, 0, factor * 0.15,
    0, 0, 0, 1, 0,
  ];
  
  return new filters.ColorMatrix({ matrix });
}

/**
 * HSL Per-Channel Adjustments
 * Sử dụng ColorMatrix để điều chỉnh hue/saturation cho từng kênh màu
 * 
 * Color ranges (approximate hue degrees):
 * - Red: 0° (và 360°)
 * - Orange: 30°
 * - Yellow: 60°
 * - Green: 120°
 * - Cyan: 180°
 * - Blue: 240°
 * - Purple: 270°
 * - Magenta: 300°
 */

interface HSLChannelState {
  hueRed: number;
  hueOrange: number;
  hueYellow: number;
  hueGreen: number;
  hueCyan: number;
  hueBlue: number;
  huePurple: number;
  hueMagenta: number;
  satRed: number;
  satOrange: number;
  satYellow: number;
  satGreen: number;
  satCyan: number;
  satBlue: number;
  satPurple: number;
  satMagenta: number;
}

/**
 * Tạo HSL filter cho Red channel
 * Red affects: high R, low G, low B
 */
function createRedChannelFilter(hue: number, sat: number): BaseFilter | null {
  if (hue === 0 && sat === 0) return null;
  
  const hueFactor = hue / 100 * 0.2;
  const satFactor = sat / 100 * 0.3;
  
  // Adjust red channel - shift towards orange (positive) or magenta (negative)
  const matrix = [
    1 + satFactor, hueFactor * 0.5, -hueFactor * 0.3, 0, 0,
    -hueFactor * 0.2, 1, hueFactor * 0.2, 0, 0,
    hueFactor * 0.3, -hueFactor * 0.2, 1, 0, 0,
    0, 0, 0, 1, 0,
  ];
  
  return new filters.ColorMatrix({ matrix });
}

/**
 * Tạo HSL filter cho Orange channel
 */
function createOrangeChannelFilter(hue: number, sat: number): BaseFilter | null {
  if (hue === 0 && sat === 0) return null;
  
  const hueFactor = hue / 100 * 0.15;
  const satFactor = sat / 100 * 0.25;
  
  const matrix = [
    1 + satFactor * 0.7, hueFactor * 0.3, 0, 0, 0,
    -hueFactor * 0.2, 1 + satFactor * 0.3, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
  ];
  
  return new filters.ColorMatrix({ matrix });
}

/**
 * Tạo HSL filter cho Yellow channel
 */
function createYellowChannelFilter(hue: number, sat: number): BaseFilter | null {
  if (hue === 0 && sat === 0) return null;
  
  const hueFactor = hue / 100 * 0.15;
  const satFactor = sat / 100 * 0.25;
  
  const matrix = [
    1 + satFactor * 0.5, hueFactor * 0.2, 0, 0, 0,
    hueFactor * 0.1, 1 + satFactor * 0.5, 0, 0, 0,
    0, 0, 1 - satFactor * 0.2, 0, 0,
    0, 0, 0, 1, 0,
  ];
  
  return new filters.ColorMatrix({ matrix });
}

/**
 * Tạo HSL filter cho Green channel
 */
function createGreenChannelFilter(hue: number, sat: number): BaseFilter | null {
  if (hue === 0 && sat === 0) return null;
  
  const hueFactor = hue / 100 * 0.2;
  const satFactor = sat / 100 * 0.3;
  
  const matrix = [
    1, -hueFactor * 0.3, hueFactor * 0.2, 0, 0,
    hueFactor * 0.2, 1 + satFactor, -hueFactor * 0.2, 0, 0,
    -hueFactor * 0.1, hueFactor * 0.3, 1, 0, 0,
    0, 0, 0, 1, 0,
  ];
  
  return new filters.ColorMatrix({ matrix });
}

/**
 * Tạo HSL filter cho Cyan channel
 */
function createCyanChannelFilter(hue: number, sat: number): BaseFilter | null {
  if (hue === 0 && sat === 0) return null;
  
  const hueFactor = hue / 100 * 0.15;
  const satFactor = sat / 100 * 0.25;
  
  const matrix = [
    1 - satFactor * 0.2, 0, 0, 0, 0,
    hueFactor * 0.1, 1 + satFactor * 0.5, hueFactor * 0.2, 0, 0,
    -hueFactor * 0.1, hueFactor * 0.2, 1 + satFactor * 0.5, 0, 0,
    0, 0, 0, 1, 0,
  ];
  
  return new filters.ColorMatrix({ matrix });
}

/**
 * Tạo HSL filter cho Blue channel
 */
function createBlueChannelFilter(hue: number, sat: number): BaseFilter | null {
  if (hue === 0 && sat === 0) return null;
  
  const hueFactor = hue / 100 * 0.2;
  const satFactor = sat / 100 * 0.3;
  
  const matrix = [
    1, hueFactor * 0.2, -hueFactor * 0.3, 0, 0,
    -hueFactor * 0.2, 1, hueFactor * 0.2, 0, 0,
    hueFactor * 0.3, -hueFactor * 0.2, 1 + satFactor, 0, 0,
    0, 0, 0, 1, 0,
  ];
  
  return new filters.ColorMatrix({ matrix });
}

/**
 * Tạo HSL filter cho Purple channel
 */
function createPurpleChannelFilter(hue: number, sat: number): BaseFilter | null {
  if (hue === 0 && sat === 0) return null;
  
  const hueFactor = hue / 100 * 0.15;
  const satFactor = sat / 100 * 0.25;
  
  const matrix = [
    1 + satFactor * 0.3, 0, hueFactor * 0.2, 0, 0,
    0, 1 - satFactor * 0.1, 0, 0, 0,
    hueFactor * 0.2, 0, 1 + satFactor * 0.4, 0, 0,
    0, 0, 0, 1, 0,
  ];
  
  return new filters.ColorMatrix({ matrix });
}

/**
 * Tạo HSL filter cho Magenta channel
 */
function createMagentaChannelFilter(hue: number, sat: number): BaseFilter | null {
  if (hue === 0 && sat === 0) return null;
  
  const hueFactor = hue / 100 * 0.15;
  const satFactor = sat / 100 * 0.25;
  
  const matrix = [
    1 + satFactor * 0.4, hueFactor * 0.1, hueFactor * 0.2, 0, 0,
    0, 1 - satFactor * 0.2, 0, 0, 0,
    hueFactor * 0.1, 0, 1 + satFactor * 0.3, 0, 0,
    0, 0, 0, 1, 0,
  ];
  
  return new filters.ColorMatrix({ matrix });
}

/**
 * Build all HSL channel filters
 */
function buildHSLFilters(state: FilterState): BaseFilter[] {
  const hslFilters: BaseFilter[] = [];
  
  const red = createRedChannelFilter(state.hueRed, state.satRed);
  const orange = createOrangeChannelFilter(state.hueOrange, state.satOrange);
  const yellow = createYellowChannelFilter(state.hueYellow, state.satYellow);
  const green = createGreenChannelFilter(state.hueGreen, state.satGreen);
  const cyan = createCyanChannelFilter(state.hueCyan, state.satCyan);
  const blue = createBlueChannelFilter(state.hueBlue, state.satBlue);
  const purple = createPurpleChannelFilter(state.huePurple, state.satPurple);
  const magenta = createMagentaChannelFilter(state.hueMagenta, state.satMagenta);
  
  if (red) hslFilters.push(red);
  if (orange) hslFilters.push(orange);
  if (yellow) hslFilters.push(yellow);
  if (green) hslFilters.push(green);
  if (cyan) hslFilters.push(cyan);
  if (blue) hslFilters.push(blue);
  if (purple) hslFilters.push(purple);
  if (magenta) hslFilters.push(magenta);
  
  return hslFilters;
}

/**
 * Build filter array từ state
 * Thứ tự apply quan trọng để đảm bảo kết quả tốt nhất
 */
export function buildFilterArray(state: FilterState): BaseFilter[] {
  const filterList: BaseFilter[] = [];
  
  // 1. EXPOSURE & BASIC TONE (đầu tiên)
  const exposure = createExposureFilter(state.exposure);
  const shadows = createShadowsFilter(state.shadows);
  const highlights = createHighlightsFilter(state.highlights);
  const whites = createWhitesFilter(state.whites);
  const blacks = createBlacksFilter(state.blacks);
  const brightness = createBrightnessFilter(state.brightness);
  const contrast = createContrastFilter(state.contrast);
  
  // 2. COLOR ADJUSTMENTS
  const temperature = createTemperatureFilter(state.temperature);
  const tint = createTintFilter(state.tint);
  const vibrance = createVibranceFilter(state.vibrance);
  const saturation = createSaturationFilter(state.saturation);
  const hue = createHueRotationFilter(state.hue);
  
  // 3. HSL PER-CHANNEL ADJUSTMENTS
  const hslFilters = buildHSLFilters(state);
  
  // 4. EFFECTS (cuối cùng)
  const clarity = createClarityFilter(state.clarity);
  const sharpness = createSharpnessFilter(state.sharpness);
  const blur = createBlurFilter(state.blur);
  const noise = createNoiseFilter(state.noise);
  const grain = createGrainFilter(state.grain);
  const fade = createFadeFilter(state.fade);
  
  // Add filters in order
  if (exposure) filterList.push(exposure);
  if (shadows) filterList.push(shadows);
  if (highlights) filterList.push(highlights);
  if (whites) filterList.push(whites);
  if (blacks) filterList.push(blacks);
  if (brightness) filterList.push(brightness);
  if (contrast) filterList.push(contrast);
  
  if (temperature) filterList.push(temperature);
  if (tint) filterList.push(tint);
  if (vibrance) filterList.push(vibrance);
  if (saturation) filterList.push(saturation);
  if (hue) filterList.push(hue);
  
  // Add HSL per-channel filters
  filterList.push(...hslFilters);
  
  if (clarity) filterList.push(clarity);
  if (fade) filterList.push(fade);
  if (sharpness) filterList.push(sharpness);
  if (blur) filterList.push(blur);
  if (noise) filterList.push(noise);
  if (grain) filterList.push(grain);
  
  return filterList;
}

/**
 * Apply filters lên ảnh
 * Preserve position and scale to prevent image from being cropped
 */
export function applyFilters(
	image: FabricImage, 
	state: FilterState,
	options?: {
		applyToOriginal?: boolean;  // Nếu true, không render canvas (cho originalImage)
		originalImage?: FabricImage; // Reference đến originalImage (nếu cần)
	}
): void {
  if (!image) return;
  
  // Preserve current position and scale before applying filters
  const currentLeft = image.left;
  const currentTop = image.top;
  const currentScaleX = image.scaleX || 1;
  const currentScaleY = image.scaleY || 1;
  const currentOriginX = image.originX;
  const currentOriginY = image.originY;
  const currentWidth = image.width;
  const currentHeight = image.height;
  
  const filterList = buildFilterArray(state);
  
  image.filters = filterList;
  image.applyFilters();
  
  // Restore position, scale, and dimensions after applying filters
  // Some filters might reset these values or change image dimensions
  // IMPORTANT: Restore in correct order to prevent coordinate issues
  image.set({
    width: currentWidth,
    height: currentHeight,
    scaleX: currentScaleX,
    scaleY: currentScaleY,
    originX: currentOriginX,
    originY: currentOriginY,
    left: currentLeft,
    top: currentTop,
  });
  
  // Update coordinates to ensure bounding box is correct
  // This must be called after setting all properties
  image.setCoords();
  
  // Only request render if this is display image (not original)
  // Original image is not on canvas, so no need to render
  if (!options?.applyToOriginal) {
    const canvas = image.canvas;
    if (canvas) {
      canvas.requestRenderAll();
    }
  }
}

/**
 * Apply filters to both original and display images
 * This ensures filters are synced between preview and export
 */
export function applyFiltersToBoth(
	originalImage: FabricImage,
	displayImage: FabricImage,
	state: FilterState
): void {
	// Apply on displayImage (preview, immediate)
	applyFilters(displayImage, state);
	
	// Apply on originalImage (background, for export)
	applyFilters(originalImage, state, { applyToOriginal: true });
}

/**
 * Reset filters về mặc định
 */
export function resetFilters(image: FabricImage): void {
  applyFilters(image, defaultFilterState);
}
