/**
 * imageLoader.ts
 * 
 * Load và quản lý ảnh trên canvas
 * - Load ảnh từ File hoặc URL
 * - Giữ ảnh gốc không bị mutate
 * - Fit ảnh vào canvas
 * 
 * NOTE: Trong fabric v6, FabricImage.fromURL là async
 */

import { Canvas, FabricImage } from 'fabric';

// Lưu trữ ảnh gốc (không bị mutate)
let originalImage: FabricImage | null = null;

/**
 * Load ảnh từ File object
 */
export function loadImageFromFile(file: File, canvas: Canvas): Promise<FabricImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      loadImageFromUrl(dataUrl, canvas)
        .then(resolve)
        .catch(reject);
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Load ảnh từ URL (fabric v6 async API)
 */
export async function loadImageFromUrl(url: string, canvas: Canvas): Promise<FabricImage> {
  try {
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    
    if (!img) {
      throw new Error('Failed to load image');
    }

    // Clear canvas
    canvas.clear();
    
    // Lưu ảnh gốc
    originalImage = img;
    
    // Fit ảnh vào canvas
    fitImageToCanvas(img, canvas);
    
    // Thêm ảnh vào canvas
    canvas.add(img);
    canvas.centerObject(img);
    canvas.requestRenderAll();
    
    return img;
  } catch (error) {
    throw new Error('Failed to load image');
  }
}

/**
 * Fit ảnh vào canvas với padding
 */
function fitImageToCanvas(
  img: FabricImage, 
  canvas: Canvas, 
  padding: number = 40
): void {
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  const imgWidth = img.width || 1;
  const imgHeight = img.height || 1;
  
  const availableWidth = canvasWidth - padding * 2;
  const availableHeight = canvasHeight - padding * 2;
  
  const scaleX = availableWidth / imgWidth;
  const scaleY = availableHeight / imgHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Không phóng to quá 100%
  
  img.scale(scale);
  img.set({
    selectable: false,
    evented: false,
  });
}

/**
 * Lấy ảnh gốc
 */
export function getOriginalImage(): FabricImage | null {
  return originalImage;
}

/**
 * Clear ảnh hiện tại
 */
export function clearImage(canvas: Canvas): void {
  if (canvas) {
    canvas.clear();
  }
  originalImage = null;
}

export { originalImage };
