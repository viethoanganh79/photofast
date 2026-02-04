/**
 * fabricCanvas.ts
 * 
 * Quản lý fabric.Canvas instance
 * - Init canvas trong onMount
 * - Cleanup khi component unmount
 * - Không re-init khi state thay đổi
 * 
 * NOTE: Trong fabric v6, sử dụng trực tiếp trong component
 * File này giữ lại để tương thích với code cũ
 */

import { Canvas } from 'fabric';

// Canvas instance singleton
let canvasInstance: Canvas | null = null;

/**
 * Khởi tạo fabric.Canvas
 * @param canvasElement - HTML canvas element
 * @param options - Fabric canvas options
 */
export function initCanvas(
  canvasElement: HTMLCanvasElement,
  options: Partial<ConstructorParameters<typeof Canvas>[1]> = {}
): Canvas {
  // Cleanup nếu đã có instance
  if (canvasInstance) {
    canvasInstance.dispose();
  }

  const defaultOptions = {
    backgroundColor: '#f5f5f5',
    preserveObjectStacking: true,
    selection: false,
    ...options,
  };

  canvasInstance = new Canvas(canvasElement, defaultOptions);
  
  return canvasInstance;
}

/**
 * Lấy canvas instance hiện tại
 */
export function getCanvas(): Canvas | null {
  return canvasInstance;
}

/**
 * Cleanup canvas khi unmount
 */
export function disposeCanvas(): void {
  if (canvasInstance) {
    canvasInstance.dispose();
    canvasInstance = null;
  }
}

/**
 * Resize canvas theo container
 */
export function resizeCanvas(width: number, height: number): void {
  if (canvasInstance) {
    canvasInstance.setDimensions({ width, height });
    canvasInstance.requestRenderAll();
  }
}

export { canvasInstance };
