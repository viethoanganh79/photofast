/**
 * Utility functions để kiểm tra các giới hạn của Fabric.js và WebGL
 * Giúp xác định xem image có vượt quá limits không và đề xuất giải pháp
 */

import type { FabricImage } from 'fabric';
import { config } from 'fabric';

/**
 * Interface cho kết quả kiểm tra limits
 */
export interface ImageLimitsCheck {
	width: number;
	height: number;
	totalPixels: number;

	// WebGL limits
	webglMaxTextureSize: number | null;
	exceedsWebGLTexture: boolean;

	// Fabric config limits
	fabricMaxCacheSide: number;
	fabricPerfLimitTotal: number;
	fabricTextureSize: number;
	exceedsFabricCache: boolean;

	// Recommendations
	recommendedMaxWidth: number;
	recommendedMaxHeight: number;
	needsScaling: boolean;
	recommendedScale: number;
}

// Cache cho WebGL max texture size (query một lần)
let cachedWebGLMaxTextureSize: number | null = null;
let webGLQueryAttempted = false;

/**
 * Query WebGL context để lấy max texture size
 * Cache kết quả để tránh query nhiều lần
 */
export function getWebGLMaxTextureSize(): number | null {
	// Return cached value nếu đã query
	if (webGLQueryAttempted) {
		return cachedWebGLMaxTextureSize;
	}

	webGLQueryAttempted = true;

	try {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

		if (!gl) {
			cachedWebGLMaxTextureSize = null;
			return null;
		}

		const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

		// Cleanup: lose context để giải phóng resources
		const loseContext = gl.getExtension('WEBGL_lose_context');
		if (loseContext) {
			loseContext.loseContext();
		}

		cachedWebGLMaxTextureSize = maxSize;
		return maxSize;
	} catch (error) {
		console.warn('Failed to query WebGL max texture size:', error);
		cachedWebGLMaxTextureSize = null;
		return null;
	}
}

/**
 * Lấy các config limits từ fabric.js
 */
export function getFabricConfigLimits() {
	return {
		maxCacheSide: config.maxCacheSideLimit,
		perfLimitTotal: config.perfLimitSizeTotal,
		textureSize: config.textureSize,
	};
}

/**
 * Tính toán kích thước tối đa được khuyến nghị
 * Lấy giá trị nhỏ nhất trong các limits
 */
export function getRecommendedMaxSize(): number {
	const webglMax = getWebGLMaxTextureSize();
	const fabricConfig = getFabricConfigLimits();

	// Tính max dimension từ perfLimitTotal (sqrt của total pixels)
	const maxFromPerfLimit = Math.floor(Math.sqrt(fabricConfig.perfLimitTotal));

	// Lấy giá trị nhỏ nhất (most restrictive)
	const limits = [
		webglMax || Infinity,
		fabricConfig.maxCacheSide,
		maxFromPerfLimit,
	];

	return Math.min(...limits.filter((v) => v !== Infinity));
}

/**
 * Kiểm tra xem image có vượt quá các limits không
 */
export function checkImageLimits(image: FabricImage): ImageLimitsCheck {
	const width = image.width || 0;
	const height = image.height || 0;
	const totalPixels = width * height;

	const webglMax = getWebGLMaxTextureSize();
	const fabricConfig = getFabricConfigLimits();

	// Check WebGL texture limit
	const exceedsWebGL = webglMax ? width > webglMax || height > webglMax : false;

	// Check Fabric cache limits
	const exceedsFabricCache =
		width > fabricConfig.maxCacheSide ||
		height > fabricConfig.maxCacheSide ||
		totalPixels > fabricConfig.perfLimitTotal;

	// Calculate recommended max size (take the most restrictive)
	const maxDimension = getRecommendedMaxSize();

	// Determine if scaling is needed
	const needsScaling = exceedsWebGL || exceedsFabricCache;

	// Calculate recommended scale factor
	let recommendedScale = 1;
	if (needsScaling) {
		// Scale để fit vào maxDimension
		const scaleX = maxDimension / width;
		const scaleY = maxDimension / height;
		recommendedScale = Math.min(scaleX, scaleY, 1); // Don't scale up
	}

	return {
		width,
		height,
		totalPixels,
		webglMaxTextureSize: webglMax,
		exceedsWebGLTexture: exceedsWebGL,
		fabricMaxCacheSide: fabricConfig.maxCacheSide,
		fabricPerfLimitTotal: fabricConfig.perfLimitTotal,
		fabricTextureSize: fabricConfig.textureSize,
		exceedsFabricCache,
		recommendedMaxWidth: maxDimension,
		recommendedMaxHeight: maxDimension,
		needsScaling,
		recommendedScale,
	};
}

/**
 * Scale image để fit vào limits
 * Sử dụng HTML5 Canvas để resize image trước khi load vào fabric.js
 */
export async function scaleImageToLimits(
	imageUrl: string,
	limits: ImageLimitsCheck
): Promise<string> {
	if (!limits.needsScaling) {
		return imageUrl;
	}

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');

				if (!ctx) {
					reject(new Error('Failed to get canvas context'));
					return;
				}

				// Calculate new dimensions
				const newWidth = Math.floor(img.width * limits.recommendedScale);
				const newHeight = Math.floor(img.height * limits.recommendedScale);

				canvas.width = newWidth;
				canvas.height = newHeight;

				// Draw scaled image
				ctx.drawImage(img, 0, 0, newWidth, newHeight);

				// Convert to data URL
				const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
				resolve(dataUrl);
			} catch (error) {
				reject(error);
			}
		};

		img.onerror = () => {
			reject(new Error('Failed to load image for scaling'));
		};

		img.src = imageUrl;
	});
}

