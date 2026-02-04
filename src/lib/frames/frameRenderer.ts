/**
 * Frame Renderer - Logic render khung ảnh với fabric.js
 * Hỗ trợ cả basic frames và decorative frames
 */

import { Rect, Circle, Line, Group, Gradient, Shadow, type Canvas, type FabricImage, FabricObject } from 'fabric';
import type { FrameConfig, FrameOptions, FrameId, AppliedFrame } from './types';
import { basicFrames } from './basicFrames';
import { decorativeFrames } from './decorativeFrames';

// Prefix cho ID của frame objects để dễ quản lý
const FRAME_OBJECT_PREFIX = 'photofast-frame-';

/**
 * Lấy bounds của image trên canvas
 * Tính toán đúng cho image có originX/originY = 'center'
 */
function getImageBounds(image: FabricImage) {
  // Get actual displayed dimensions (scaled)
  const imgWidth = (image.width || 1) * (image.scaleX || 1);
  const imgHeight = (image.height || 1) * (image.scaleY || 1);
  
  // Get center position
  const centerX = image.left || 0;
  const centerY = image.top || 0;
  
  // Calculate bounds from center
  const left = centerX - imgWidth / 2;
  const top = centerY - imgHeight / 2;
  
  return {
    left,
    top,
    width: imgWidth,
    height: imgHeight,
    right: left + imgWidth,
    bottom: top + imgHeight,
    centerX,
    centerY,
  };
}

/**
 * Tạo unique ID cho frame object
 */
function generateFrameObjectId(): string {
  return `${FRAME_OBJECT_PREFIX}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Xóa tất cả frame objects khỏi canvas
 */
export function removeAllFrameObjects(canvas: Canvas): void {
  const objects = canvas.getObjects();
  const frameObjects = objects.filter(obj => 
    (obj as any).frameObjectId?.startsWith(FRAME_OBJECT_PREFIX)
  );
  
  frameObjects.forEach(obj => {
    canvas.remove(obj);
  });
  
  canvas.requestRenderAll();
}

/**
 * Lấy tất cả frame configs
 */
export function getAllFrameConfigs(): FrameConfig[] {
  return [...basicFrames, ...decorativeFrames];
}

/**
 * Lấy frame config theo ID
 */
export function getFrameConfigById(id: FrameId): FrameConfig | undefined {
  if (id === 'none') return undefined;
  return getAllFrameConfigs().find(frame => frame.id === id);
}

// ============================================
// BASIC FRAME RENDERERS
// ============================================

/**
 * Render Solid Frame - Viền đơn sắc
 */
function renderSolidFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  const objectId = generateFrameObjectId();
  
  const frame = new Rect({
    left: bounds.left - options.borderWidth,
    top: bounds.top - options.borderWidth,
    width: bounds.width + options.borderWidth * 2,
    height: bounds.height + options.borderWidth * 2,
    fill: options.borderColor,
    rx: options.borderRadius,
    ry: options.borderRadius,
    selectable: false,
    evented: false,
    excludeFromExport: false,
  });
  
  (frame as any).frameObjectId = objectId;
  
  canvas.add(frame);
  canvas.sendObjectToBack(frame);
  
  return [frame];
}

/**
 * Render Double Frame - Viền kép
 */
function renderDoubleFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  const objects: FabricObject[] = [];
  const outerWidth = options.borderWidth;
  const innerWidth = options.innerWidth || 8;
  const gap = options.gap || 6;
  const totalOffset = outerWidth + gap + innerWidth;
  
  // Outer frame
  const outerFrame = new Rect({
    left: bounds.left - totalOffset,
    top: bounds.top - totalOffset,
    width: bounds.width + totalOffset * 2,
    height: bounds.height + totalOffset * 2,
    fill: options.borderColor,
    rx: options.borderRadius,
    ry: options.borderRadius,
    selectable: false,
    evented: false,
  });
  (outerFrame as any).frameObjectId = generateFrameObjectId();
  objects.push(outerFrame);
  
  // Gap (transparent or background color)
  const gapFrame = new Rect({
    left: bounds.left - innerWidth - gap,
    top: bounds.top - innerWidth - gap,
    width: bounds.width + (innerWidth + gap) * 2,
    height: bounds.height + (innerWidth + gap) * 2,
    fill: '#f5f5f5', // Light gray for gap
    rx: options.borderRadius > 0 ? options.borderRadius - outerWidth : 0,
    ry: options.borderRadius > 0 ? options.borderRadius - outerWidth : 0,
    selectable: false,
    evented: false,
  });
  (gapFrame as any).frameObjectId = generateFrameObjectId();
  objects.push(gapFrame);
  
  // Inner frame
  const innerFrame = new Rect({
    left: bounds.left - innerWidth,
    top: bounds.top - innerWidth,
    width: bounds.width + innerWidth * 2,
    height: bounds.height + innerWidth * 2,
    fill: options.innerColor || '#e5e5e5',
    rx: options.borderRadius > 0 ? Math.max(0, options.borderRadius - outerWidth - gap) : 0,
    ry: options.borderRadius > 0 ? Math.max(0, options.borderRadius - outerWidth - gap) : 0,
    selectable: false,
    evented: false,
  });
  (innerFrame as any).frameObjectId = generateFrameObjectId();
  objects.push(innerFrame);
  
  // Add to canvas in reverse order (outer first)
  objects.forEach(obj => {
    canvas.add(obj);
    canvas.sendObjectToBack(obj);
  });
  
  return objects;
}

/**
 * Render Rounded Frame - Viền bo góc
 * (Sử dụng solid frame với borderRadius lớn)
 */
function renderRoundedFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  // Đảm bảo có borderRadius
  const roundedOptions = {
    ...options,
    borderRadius: options.borderRadius || 24,
  };
  
  return renderSolidFrame(canvas, bounds, roundedOptions);
}

/**
 * Render Shadow Frame - Viền có bóng đổ
 */
function renderShadowFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  const objectId = generateFrameObjectId();
  
  const shadow = new Shadow({
    color: options.shadowColor || 'rgba(0, 0, 0, 0.25)',
    blur: options.shadowBlur || 20,
    offsetX: options.shadowOffsetX || 0,
    offsetY: options.shadowOffsetY || 8,
  });
  
  const frame = new Rect({
    left: bounds.left - options.borderWidth,
    top: bounds.top - options.borderWidth,
    width: bounds.width + options.borderWidth * 2,
    height: bounds.height + options.borderWidth * 2,
    fill: options.borderColor,
    rx: options.borderRadius,
    ry: options.borderRadius,
    shadow: shadow,
    selectable: false,
    evented: false,
  });
  
  (frame as any).frameObjectId = objectId;
  
  canvas.add(frame);
  canvas.sendObjectToBack(frame);
  
  return [frame];
}

/**
 * Render Gradient Frame - Viền gradient
 */
function renderGradientFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  const objectId = generateFrameObjectId();
  const frameWidth = bounds.width + options.borderWidth * 2;
  const frameHeight = bounds.height + options.borderWidth * 2;
  
  // Tạo gradient dựa trên direction
  let coords: { x1: number; y1: number; x2: number; y2: number };
  
  switch (options.gradientDirection) {
    case 'horizontal':
      coords = { x1: 0, y1: 0, x2: frameWidth, y2: 0 };
      break;
    case 'vertical':
      coords = { x1: 0, y1: 0, x2: 0, y2: frameHeight };
      break;
    case 'diagonal':
    default:
      coords = { x1: 0, y1: 0, x2: frameWidth, y2: frameHeight };
      break;
  }
  
  const gradient = new Gradient({
    type: 'linear',
    coords: coords,
    colorStops: [
      { offset: 0, color: options.borderColor },
      { offset: 1, color: options.gradientColor2 || '#a855f7' },
    ],
  });
  
  const frame = new Rect({
    left: bounds.left - options.borderWidth,
    top: bounds.top - options.borderWidth,
    width: frameWidth,
    height: frameHeight,
    fill: gradient,
    rx: options.borderRadius,
    ry: options.borderRadius,
    selectable: false,
    evented: false,
  });
  
  (frame as any).frameObjectId = objectId;
  
  canvas.add(frame);
  canvas.sendObjectToBack(frame);
  
  return [frame];
}

/**
 * Render Dashed Frame - Viền nét đứt
 */
function renderDashedFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  const objects: FabricObject[] = [];
  const padding = 10; // Khoảng cách từ ảnh đến viền
  const strokeWidth = options.borderWidth || 4;
  const dashArray = options.dashArray || [15, 10];
  
  // Tạo 4 đường line cho 4 cạnh
  const lineProps = {
    stroke: options.borderColor,
    strokeWidth: strokeWidth,
    strokeDashArray: dashArray,
    selectable: false,
    evented: false,
  };
  
  // Top line
  const topLine = new Line([
    bounds.left - padding,
    bounds.top - padding,
    bounds.right + padding,
    bounds.top - padding,
  ], lineProps);
  (topLine as any).frameObjectId = generateFrameObjectId();
  objects.push(topLine);
  
  // Bottom line
  const bottomLine = new Line([
    bounds.left - padding,
    bounds.bottom + padding,
    bounds.right + padding,
    bounds.bottom + padding,
  ], lineProps);
  (bottomLine as any).frameObjectId = generateFrameObjectId();
  objects.push(bottomLine);
  
  // Left line
  const leftLine = new Line([
    bounds.left - padding,
    bounds.top - padding,
    bounds.left - padding,
    bounds.bottom + padding,
  ], lineProps);
  (leftLine as any).frameObjectId = generateFrameObjectId();
  objects.push(leftLine);
  
  // Right line
  const rightLine = new Line([
    bounds.right + padding,
    bounds.top - padding,
    bounds.right + padding,
    bounds.bottom + padding,
  ], lineProps);
  (rightLine as any).frameObjectId = generateFrameObjectId();
  objects.push(rightLine);
  
  // Add all lines to canvas
  objects.forEach(obj => {
    canvas.add(obj);
    canvas.sendObjectToBack(obj);
  });
  
  return objects;
}

// ============================================
// DECORATIVE FRAME RENDERERS
// ============================================

/**
 * Render Polaroid Frame
 * Đặc điểm: Viền trắng, phần dưới dày hơn để viết caption
 */
function renderPolaroidFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  const objects: FabricObject[] = [];
  
  const topPadding = 20;
  const sidePadding = 20;
  const bottomPadding = 60; // Phần dưới dày hơn cho caption
  
  // Main white background
  const background = new Rect({
    left: bounds.left - sidePadding,
    top: bounds.top - topPadding,
    width: bounds.width + sidePadding * 2,
    height: bounds.height + topPadding + bottomPadding,
    fill: '#ffffff',
    rx: 2,
    ry: 2,
    shadow: new Shadow({
      color: 'rgba(0, 0, 0, 0.15)',
      blur: 15,
      offsetX: 0,
      offsetY: 5,
    }),
    selectable: false,
    evented: false,
  });
  (background as any).frameObjectId = generateFrameObjectId();
  objects.push(background);
  
  canvas.add(background);
  canvas.sendObjectToBack(background);
  
  return objects;
}

/**
 * Render Vintage Frame
 * Đặc điểm: Khung gỗ với 2 lớp màu tạo chiều sâu
 */
function renderVintageFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  const objects: FabricObject[] = [];
  const outerWidth = options.borderWidth || 30;
  const innerWidth = outerWidth * 0.4;
  
  // Helper function to darken a color
  const darkenColor = (color: string, amount: number): string => {
    // Simple darken: if it's a hex color, convert to RGB and darken
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
      const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
      const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return color;
  };
  
  // Helper function to lighten a color
  const lightenColor = (color: string, amount: number): string => {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
      const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
      const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return color;
  };
  
  const baseColor = options.borderColor || '#8B4513';
  const outerColor = darkenColor(baseColor, 40); // Darker for outer frame
  const innerColor = lightenColor(baseColor, 20); // Lighter for inner frame
  
  // Outer frame (darker)
  const outerFrame = new Rect({
    left: bounds.left - outerWidth,
    top: bounds.top - outerWidth,
    width: bounds.width + outerWidth * 2,
    height: bounds.height + outerWidth * 2,
    fill: outerColor,
    rx: options.borderRadius || 4,
    ry: options.borderRadius || 4,
    selectable: false,
    evented: false,
  });
  (outerFrame as any).frameObjectId = generateFrameObjectId();
  objects.push(outerFrame);
  
  // Inner frame (lighter)
  const innerFrame = new Rect({
    left: bounds.left - innerWidth,
    top: bounds.top - innerWidth,
    width: bounds.width + innerWidth * 2,
    height: bounds.height + innerWidth * 2,
    fill: innerColor,
    rx: Math.max(0, (options.borderRadius || 4) - 2),
    ry: Math.max(0, (options.borderRadius || 4) - 2),
    selectable: false,
    evented: false,
  });
  (innerFrame as any).frameObjectId = generateFrameObjectId();
  objects.push(innerFrame);
  
  // Inner golden edge (optional, can be disabled if borderColor is changed significantly)
  const goldEdge = new Rect({
    left: bounds.left - 4,
    top: bounds.top - 4,
    width: bounds.width + 8,
    height: bounds.height + 8,
    fill: 'transparent',
    stroke: '#D4AF37',
    strokeWidth: 2,
    selectable: false,
    evented: false,
  });
  (goldEdge as any).frameObjectId = generateFrameObjectId();
  objects.push(goldEdge);
  
  // Add in reverse order
  [outerFrame, innerFrame, goldEdge].forEach(obj => {
    canvas.add(obj);
    canvas.sendObjectToBack(obj);
  });
  
  return objects;
}

/**
 * Render Film Strip Frame
 * Đặc điểm: Khung đen với lỗ đục 2 bên như cuộn phim
 */
function renderFilmstripFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  const objects: FabricObject[] = [];
  const stripWidth = 40;
  const holeSize = 12;
  const holeSpacing = 20;
  
  // Main black background
  const background = new Rect({
    left: bounds.left - stripWidth,
    top: bounds.top - 15,
    width: bounds.width + stripWidth * 2,
    height: bounds.height + 30,
    fill: '#1a1a1a',
    selectable: false,
    evented: false,
  });
  (background as any).frameObjectId = generateFrameObjectId();
  objects.push(background);
  canvas.add(background);
  canvas.sendObjectToBack(background);
  
  // Create holes on both sides
  const numHoles = Math.floor(bounds.height / holeSpacing);
  const startY = bounds.top + (bounds.height - (numHoles - 1) * holeSpacing) / 2;
  
  for (let i = 0; i < numHoles; i++) {
    const y = startY + i * holeSpacing;
    
    // Left hole
    const leftHole = new Rect({
      left: bounds.left - stripWidth + (stripWidth - holeSize) / 2,
      top: y - holeSize / 2,
      width: holeSize,
      height: holeSize * 0.7,
      fill: '#000000',
      rx: 2,
      ry: 2,
      selectable: false,
      evented: false,
    });
    (leftHole as any).frameObjectId = generateFrameObjectId();
    objects.push(leftHole);
    canvas.add(leftHole);
    
    // Right hole
    const rightHole = new Rect({
      left: bounds.right + (stripWidth - holeSize) / 2,
      top: y - holeSize / 2,
      width: holeSize,
      height: holeSize * 0.7,
      fill: '#000000',
      rx: 2,
      ry: 2,
      selectable: false,
      evented: false,
    });
    (rightHole as any).frameObjectId = generateFrameObjectId();
    objects.push(rightHole);
    canvas.add(rightHole);
  }
  
  return objects;
}

/**
 * Render Tape Frame
 * Đặc điểm: 4 góc có miếng băng dính
 */
function renderTapeFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  const objects: FabricObject[] = [];
  const tapeWidth = 60;
  const tapeHeight = 20;
  const tapeColor = 'rgba(255, 228, 181, 0.8)'; // Semi-transparent beige
  
  // Helper function to create tape piece
  const createTape = (x: number, y: number, angle: number) => {
    const tape = new Rect({
      left: x,
      top: y,
      width: tapeWidth,
      height: tapeHeight,
      fill: tapeColor,
      angle: angle,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });
    (tape as any).frameObjectId = generateFrameObjectId();
    return tape;
  };
  
  // Top-left tape
  const topLeft = createTape(bounds.left, bounds.top, -45);
  objects.push(topLeft);
  
  // Top-right tape
  const topRight = createTape(bounds.right, bounds.top, 45);
  objects.push(topRight);
  
  // Bottom-left tape
  const bottomLeft = createTape(bounds.left, bounds.bottom, 45);
  objects.push(bottomLeft);
  
  // Bottom-right tape
  const bottomRight = createTape(bounds.right, bounds.bottom, -45);
  objects.push(bottomRight);
  
  objects.forEach(obj => {
    canvas.add(obj);
  });
  
  return objects;
}

/**
 * Render Stamp Frame
 * Đặc điểm: Viền răng cưa như tem thư
 */
function renderStampFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  const objects: FabricObject[] = [];
  const padding = options.borderWidth || 15;
  const circleRadius = 6;
  const circleSpacing = circleRadius * 3;
  
  // White background
  const background = new Rect({
    left: bounds.left - padding,
    top: bounds.top - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
    fill: options.borderColor || '#ffffff',
    selectable: false,
    evented: false,
  });
  (background as any).frameObjectId = generateFrameObjectId();
  objects.push(background);
  canvas.add(background);
  canvas.sendObjectToBack(background);
  
  // Create perforations (circles that will appear as holes)
  const frameLeft = bounds.left - padding - circleRadius;
  const frameRight = bounds.right + padding + circleRadius;
  const frameTop = bounds.top - padding - circleRadius;
  const frameBottom = bounds.bottom + padding + circleRadius;
  
  // Top edge circles
  const numTopCircles = Math.floor((bounds.width + padding * 2) / circleSpacing);
  for (let i = 0; i <= numTopCircles; i++) {
    const circle = new Circle({
      left: bounds.left - padding + i * circleSpacing,
      top: frameTop,
      radius: circleRadius,
      fill: '#f0f9ff', // Light background to simulate perforation
      selectable: false,
      evented: false,
    });
    (circle as any).frameObjectId = generateFrameObjectId();
    objects.push(circle);
    canvas.add(circle);
  }
  
  // Bottom edge circles
  for (let i = 0; i <= numTopCircles; i++) {
    const circle = new Circle({
      left: bounds.left - padding + i * circleSpacing,
      top: frameBottom - circleRadius * 2,
      radius: circleRadius,
      fill: '#f0f9ff',
      selectable: false,
      evented: false,
    });
    (circle as any).frameObjectId = generateFrameObjectId();
    objects.push(circle);
    canvas.add(circle);
  }
  
  // Left edge circles
  const numSideCircles = Math.floor((bounds.height + padding * 2) / circleSpacing);
  for (let i = 0; i <= numSideCircles; i++) {
    const circle = new Circle({
      left: frameLeft,
      top: bounds.top - padding + i * circleSpacing,
      radius: circleRadius,
      fill: '#f0f9ff',
      selectable: false,
      evented: false,
    });
    (circle as any).frameObjectId = generateFrameObjectId();
    objects.push(circle);
    canvas.add(circle);
  }
  
  // Right edge circles
  for (let i = 0; i <= numSideCircles; i++) {
    const circle = new Circle({
      left: frameRight - circleRadius * 2,
      top: bounds.top - padding + i * circleSpacing,
      radius: circleRadius,
      fill: '#f0f9ff',
      selectable: false,
      evented: false,
    });
    (circle as any).frameObjectId = generateFrameObjectId();
    objects.push(circle);
    canvas.add(circle);
  }
  
  return objects;
}

/**
 * Render Torn Paper Frame
 * Đặc điểm: Viền không đều như giấy xé
 */
function renderTornFrame(
  canvas: Canvas,
  bounds: ReturnType<typeof getImageBounds>,
  options: FrameOptions
): FabricObject[] {
  const objects: FabricObject[] = [];
  const padding = options.borderWidth || 25;
  
  // Base paper background (slightly irregular)
  const background = new Rect({
    left: bounds.left - padding,
    top: bounds.top - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
    fill: options.borderColor || '#fefce8',
    shadow: new Shadow({
      color: 'rgba(0, 0, 0, 0.1)',
      blur: 8,
      offsetX: 2,
      offsetY: 2,
    }),
    selectable: false,
    evented: false,
  });
  (background as any).frameObjectId = generateFrameObjectId();
  objects.push(background);
  canvas.add(background);
  canvas.sendObjectToBack(background);
  
  // Add some irregular small shapes to simulate torn edges
  const tearCount = 20;
  const tearSize = 8;
  
  // Add tears around the edges
  for (let i = 0; i < tearCount; i++) {
    // Random position along the perimeter
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (side) {
      case 0: // Top
        x = bounds.left - padding + Math.random() * (bounds.width + padding * 2);
        y = bounds.top - padding - tearSize / 2;
        break;
      case 1: // Right
        x = bounds.right + padding - tearSize / 2;
        y = bounds.top - padding + Math.random() * (bounds.height + padding * 2);
        break;
      case 2: // Bottom
        x = bounds.left - padding + Math.random() * (bounds.width + padding * 2);
        y = bounds.bottom + padding - tearSize / 2;
        break;
      default: // Left
        x = bounds.left - padding - tearSize / 2;
        y = bounds.top - padding + Math.random() * (bounds.height + padding * 2);
    }
    
    const tear = new Circle({
      left: x,
      top: y,
      radius: tearSize / 2 + Math.random() * tearSize / 2,
      fill: options.borderColor || '#fefce8',
      selectable: false,
      evented: false,
    });
    (tear as any).frameObjectId = generateFrameObjectId();
    objects.push(tear);
    canvas.add(tear);
    canvas.sendObjectToBack(tear);
  }
  
  return objects;
}

// ============================================
// MAIN RENDER FUNCTION
// ============================================

/**
 * Render frame lên canvas
 * @param canvas - fabric.js Canvas instance
 * @param image - FabricImage object
 * @param frameId - ID của frame cần render
 * @param options - Tùy chọn cho frame
 * @returns AppliedFrame object hoặc null nếu không render được
 */
export function renderFrame(
  canvas: Canvas,
  image: FabricImage,
  frameId: FrameId,
  customOptions?: Partial<FrameOptions>
): AppliedFrame | null {
  // Xóa frame cũ trước
  removeAllFrameObjects(canvas);
  
  if (frameId === 'none') {
    canvas.requestRenderAll();
    return null;
  }
  
  const config = getFrameConfigById(frameId);
  if (!config) {
    console.warn(`Frame config not found for ID: ${frameId}`);
    return null;
  }
  
  // Merge default options với custom options
  const options: FrameOptions = {
    ...config.defaultOptions,
    ...customOptions,
  };
  
  const bounds = getImageBounds(image);
  let frameObjects: FabricObject[] = [];
  
  // Render dựa trên frame ID
  switch (frameId) {
    // Basic frames
    case 'solid':
      frameObjects = renderSolidFrame(canvas, bounds, options);
      break;
    case 'double':
      frameObjects = renderDoubleFrame(canvas, bounds, options);
      break;
    case 'rounded':
      frameObjects = renderRoundedFrame(canvas, bounds, options);
      break;
    case 'shadow':
      frameObjects = renderShadowFrame(canvas, bounds, options);
      break;
    case 'gradient':
      frameObjects = renderGradientFrame(canvas, bounds, options);
      break;
    case 'dashed':
      frameObjects = renderDashedFrame(canvas, bounds, options);
      break;
      
    // Decorative frames
    case 'polaroid':
      frameObjects = renderPolaroidFrame(canvas, bounds, options);
      break;
    case 'vintage':
      frameObjects = renderVintageFrame(canvas, bounds, options);
      break;
    case 'filmstrip':
      frameObjects = renderFilmstripFrame(canvas, bounds, options);
      break;
    case 'tape':
      frameObjects = renderTapeFrame(canvas, bounds, options);
      break;
    case 'stamp':
      frameObjects = renderStampFrame(canvas, bounds, options);
      break;
    case 'torn':
      frameObjects = renderTornFrame(canvas, bounds, options);
      break;
      
    default:
      console.warn(`Unknown frame ID: ${frameId}`);
      return null;
  }
  
  canvas.requestRenderAll();
  
  return {
    config,
    options,
    objectIds: frameObjects.map(obj => (obj as any).frameObjectId),
  };
}

/**
 * Cập nhật options cho frame hiện tại
 */
export function updateFrameOptions(
  canvas: Canvas,
  image: FabricImage,
  frameId: FrameId,
  newOptions: Partial<FrameOptions>
): AppliedFrame | null {
  return renderFrame(canvas, image, frameId, newOptions);
}

