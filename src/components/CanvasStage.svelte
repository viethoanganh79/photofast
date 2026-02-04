<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { Canvas, FabricImage, Rect, Line } from 'fabric';
	import { checkImageLimits, scaleImageToLimits, type ImageLimitsCheck } from '$lib/utils/fabricLimits';
	import { renderFrameOnCanvas2D } from '$lib/frames/canvas2dRenderer';
	import type { FrameId, FrameOptions } from '$lib/frames/types';
	
	// Props
	export let image: FabricImage | null = null;
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		ready: Canvas;
		imageLoaded: FabricImage;
		cropModeChange: boolean;
		limitsExceeded: ImageLimitsCheck;
		exportProgress: {
			step: string;
			status: 'pending' | 'in-progress' | 'success' | 'error';
			message?: string;
			preview?: string;
		};
	}>();
	
	// Canvas references
	let canvasElement: HTMLCanvasElement;
	let containerElement: HTMLDivElement;
	let canvas: Canvas | null = null;
	
	// Image management: separate optimized and display images
	// Optimized workflow: Image is optimized at max device/library capability, not kept at full original size
	let originalImage: FabricImage | null = null;  // Image đã được optimize ở mức tối đa của thiết bị/thư viện, dùng để apply filters và export
	let displayImage: FabricImage | null = null;    // Image scaled để hiển thị trên canvas (có thể scale thêm từ optimized image)
	let originalImageUrl: string | null = null;     // URL của image gốc (trước khi optimize)
	let originalImageDataUrl: string | null = null; // Hard copy: DataURL của image gốc BAN ĐẦU (không bao giờ thay đổi sau khi crop)
	let firstOriginalImageDataUrl: string | null = null; // Lưu ảnh gốc BAN ĐẦU để luôn load lại khi mở crop modal
	
	// Crop state
	let isCropMode = false;
	let cropRect: Rect | null = null;
	let cropAspectRatio: number | null = null;
	let gridLines: Line[] = [];
	
	
	// Vignette state
	let vignetteValue = 0;
	
	// Debug rectangles for visualizing layers
	let debugCanvasBounds: Rect | null = null;
	let debugAvailableSpace: Rect | null = null;
	let debugImageBounds: Rect | null = null;
	
	// Reactive: resize canvas when container size changes
	let containerWidth = 0;
	let containerHeight = 0;
	let imageAspectRatio: number | null = null; // Store image aspect ratio for responsive sizing
	
	// Initialize fabric.Canvas on mount
	onMount(() => {
		initCanvas();
		setupResizeObserver();
		
		return () => {
			cleanup();
		};
	});
	
	function initCanvas() {
		if (!canvasElement) return;
		
		// Check if dark mode
		const isDark = document.documentElement.classList.contains('dark');
		
		canvas = new Canvas(canvasElement, {
			backgroundColor: isDark ? '#1e293b' : '#f8fafc',
			preserveObjectStacking: true,
			selection: true,
			renderOnAddRemove: true,
		});
		
		// Add afterRender hook for vignette
		canvas.on('after:render', () => {
			if (vignetteValue !== 0 && displayImage) {
				drawVignette();
			}
		});
		
		// Initial resize
		resizeCanvas();
		
		// Dispatch ready event
		dispatch('ready', canvas);
	}
	
	function setupResizeObserver() {
		if (!containerElement) return;
		
		// Observe parent container (canvas-card) for layout changes
		const parent = containerElement.parentElement;
		if (!parent) return;
		
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerWidth = entry.contentRect.width;
				containerHeight = entry.contentRect.height;
				
				// If image exists, update container to match aspect ratio
				if (imageAspectRatio) {
					updateContainerAspectRatio();
				} else {
					// No image: use full available space
					resizeCanvas();
				}
			}
		});
		
		// Observe parent for layout changes
		resizeObserver.observe(parent);
		// Also observe container itself for direct size changes
		resizeObserver.observe(containerElement);
	}
	
	// Clear image aspect ratio when image is removed
	$: if (!image && containerElement) {
		imageAspectRatio = null;
		// Reset to full width/height when no image
		containerElement.style.width = '100%';
		containerElement.style.height = '100%';
	}
	
	function resizeCanvas() {
		if (!canvas || !containerElement) return;
		
		const width = containerElement.clientWidth;
		const height = containerElement.clientHeight;
		
		// Only resize if dimensions are valid
		if (width > 0 && height > 0) {
			canvas.setDimensions({ width, height });
			
			// Re-center image if exists
			if (displayImage) {
				fitImageToCanvas(displayImage);
			}
			
			canvas.requestRenderAll();
		}
	}
	
	// Load image from File
	export function loadImageFromFile(file: File): Promise<FabricImage> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			
			reader.onload = (e) => {
				const dataUrl = e.target?.result as string;
				loadImageFromUrl(dataUrl).then(resolve).catch(reject);
			};
			
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsDataURL(file);
		});
	}
	
	// Load image from URL (fabric v6 uses async/await)
	// Optimized workflow: Optimize image at max device/library capability, then create display version
	// Default: autoScale = true (tự động scale nếu vượt quá limits)
	export async function loadImageFromUrl(url: string, autoScale: boolean = true): Promise<FabricImage> {
		if (!canvas) {
			throw new Error('Canvas not initialized');
		}
		
		try {
			// Check if URL is a data URL (from FileReader) - no need for crossOrigin
			// For external URLs, use crossOrigin: 'anonymous' to avoid CORS issues
			const isDataUrl = url.startsWith('data:');
			
			// Step 1: Load temporary image to check limits
			const tempImg = isDataUrl 
				? await FabricImage.fromURL(url)
				: await FabricImage.fromURL(url, { crossOrigin: 'anonymous' as const });
			
			if (!tempImg) {
				throw new Error('Failed to load image');
			}
			
			// Step 2: Check limits and optimize image at max device/library capability
			const limitsCheck = checkImageLimits(tempImg);
			
			// Step 3: Optimize image (scale to max limits if needed)
			// This optimized image will be our "originalImage" (optimized at max capability)
			let optimizedImg: FabricImage;
			
			if (limitsCheck.needsScaling) {
				// Optimize: Scale to max device/library limits
				try {
					// Use scaleImageToLimits to optimize the image URL first
					const optimizedUrl = await scaleImageToLimits(url, limitsCheck);
					
					// Load optimized image
					optimizedImg = isDataUrl || optimizedUrl.startsWith('data:')
						? await FabricImage.fromURL(optimizedUrl)
						: await FabricImage.fromURL(optimizedUrl, { crossOrigin: 'anonymous' as const });
					
					if (!optimizedImg) {
						throw new Error('Failed to load optimized image');
					}
				} catch (optimizeError) {
					console.warn('Failed to optimize image, using original:', optimizeError);
					optimizedImg = tempImg; // Fallback to original
				}
			} else {
				// No optimization needed, use original
				optimizedImg = tempImg;
			}
			
			// Step 4: Store optimized image as "originalImage" (optimized at max capability)
			originalImage = optimizedImg;
			originalImageUrl = url; // Keep original URL for reference
			
			// Create hard copy: Export original image to dataURL for crop mode reload
			// This ensures we always have the exact same image data when entering crop mode
			try {
				const imgElement = optimizedImg.getElement();
				if (imgElement instanceof HTMLImageElement && imgElement.naturalWidth && imgElement.naturalHeight) {
					const tempCanvas = document.createElement('canvas');
					tempCanvas.width = imgElement.naturalWidth;
					tempCanvas.height = imgElement.naturalHeight;
					const ctx = tempCanvas.getContext('2d');
					
					if (ctx) {
						// Draw image at full resolution to create hard copy
						ctx.drawImage(imgElement, 0, 0, tempCanvas.width, tempCanvas.height);
						const hardCopyDataUrl = tempCanvas.toDataURL('image/png');
						originalImageDataUrl = hardCopyDataUrl;
						
						// Lưu ảnh gốc BAN ĐẦU (chỉ set lần đầu tiên, không bao giờ thay đổi)
						if (!firstOriginalImageDataUrl) {
							firstOriginalImageDataUrl = hardCopyDataUrl;
						}
					}
				}
			} catch (error) {
				console.warn('Failed to create hard copy for crop mode:', error);
				// Fallback to URL if hard copy fails
				originalImageDataUrl = url;
				if (!firstOriginalImageDataUrl) {
					firstOriginalImageDataUrl = url;
				}
			}
			
			// Step 5: Create display image from optimized image (scale down further for preview if needed)
			// Check if optimized image still needs scaling for display (usually not, but check anyway)
			const displayLimitsCheck = checkImageLimits(optimizedImg);
			let displayImg: FabricImage;
			
			// For display, we might want to scale down even more for better performance
			// But typically, if optimized image is already at limits, display can use it directly
			// Only scale down if canvas is much smaller than optimized image
			const maxDisplaySize = Math.max(canvas.width || 1920, canvas.height || 1080) * 2; // 2x for retina
			const needsDisplayScaling = optimizedImg.width! > maxDisplaySize || optimizedImg.height! > maxDisplaySize;
			
			if (needsDisplayScaling && autoScale) {
				// Scale down for display (better performance)
				const displayScale = Math.min(
					maxDisplaySize / optimizedImg.width!,
					maxDisplaySize / optimizedImg.height!,
					1
				);
				try {
					displayImg = await createScaledImage(optimizedImg, displayScale);
				} catch (scaleError) {
					console.warn('Failed to create display scaled image, using optimized:', scaleError);
					displayImg = optimizedImg; // Fallback to optimized
				}
			} else {
				// Use optimized image directly for display
				displayImg = optimizedImg;
			}
			
			// Clear previous content
			canvas.clear();
			const isDark = document.documentElement.classList.contains('dark');
			canvas.backgroundColor = isDark ? '#1e293b' : '#f8fafc';
			
			// Store display image reference (for backward compatibility)
			displayImage = displayImg;
			image = displayImg; // Keep for backward compatibility
			
			// Calculate and store image aspect ratio for responsive container sizing
			const imgWidth = displayImg.width || 1;
			const imgHeight = displayImg.height || 1;
			imageAspectRatio = imgWidth / imgHeight;
			
			// Fit and add display image to canvas
			fitImageToCanvas(displayImg);
			canvas.add(displayImg);
			canvas.centerObject(displayImg);
			canvas.requestRenderAll();
			
			// Trigger container resize to match image aspect ratio
			updateContainerAspectRatio();
			
			// Dispatch events
			dispatch('imageLoaded', displayImg);
			
			// Dispatch limits exceeded event if needed
			if (limitsCheck.needsScaling) {
				dispatch('limitsExceeded', limitsCheck);
			}
			
			return displayImg;
		} catch (error) {
			// Log error for debugging
			console.error('Error loading image:', error);
			throw new Error('Failed to load image');
		}
	}
	
	// Calculate required padding for frame
	let framePadding = 0;
	
	export function setFramePadding(padding: number): void {
		framePadding = padding;
		if (displayImage) {
			fitImageToCanvas(displayImage);
		}
	}
	
	// Export functions to get images
	export function getOriginalImage(): FabricImage | null {
		return originalImage;
	}
	
	export function getDisplayImage(): FabricImage | null {
		return displayImage;
	}
	
	// Get original image data URL for crop modal
	// Luôn trả về ảnh gốc BAN ĐẦU, không phải ảnh đã crop
	export function getOriginalImageDataUrl(): string | null {
		// Ưu tiên dùng firstOriginalImageDataUrl (ảnh gốc ban đầu)
		// Nếu không có thì dùng originalImageDataUrl
		return firstOriginalImageDataUrl || originalImageDataUrl;
	}
	
	// Helper: Create scaled image from original
	async function createScaledImage(
		image: FabricImage,
		scale: number
	): Promise<FabricImage> {
		// Get image element
		const imgElement = image.getElement();
		if (!imgElement) {
			throw new Error('Image element not available');
		}
		
		// Create canvas to scale
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		
		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}
		
		const newWidth = Math.floor(image.width! * scale);
		const newHeight = Math.floor(image.height! * scale);
		
		canvas.width = newWidth;
		canvas.height = newHeight;
		
		// Draw scaled image
		ctx.drawImage(imgElement, 0, 0, newWidth, newHeight);
		
		// Convert to data URL and load as new FabricImage
		const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
		const isDataUrl = dataUrl.startsWith('data:');
		const scaledImg = isDataUrl 
			? await FabricImage.fromURL(dataUrl)
			: await FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' as const });
		
		return scaledImg;
	}
	
	// Fit image to canvas - fill the available space with frame consideration
	// Only applies to displayImage (scaled version for preview)
	function fitImageToCanvas(img: FabricImage) {
		if (!canvas) return;
		
		// Padding breakdown:
		// - basePadding: Minimum space around image (8px from card padding is already in canvas size)
		// - framePadding: Space needed for frame (border width + gap + shadow)
		// - filterPadding: Extra space for filter effects (blur, etc.) that may expand image visually
		const basePadding = 8; // Reduced from 16 since card padding (8px) is already excluded from canvas
		const filterPadding = 20; // Extra padding for filter effects
		const totalPadding = basePadding + framePadding + filterPadding;
		
		const canvasWidth = canvas.getWidth();
		const canvasHeight = canvas.getHeight();
		
		// Calculate available space with detailed breakdown
		// We subtract padding from both left/right and top/bottom
		const paddingUsed = totalPadding * 2;
		const availableWidth = Math.max(0, canvasWidth - paddingUsed);
		const availableHeight = Math.max(0, canvasHeight - paddingUsed);
		
		// Use original dimensions (not scaled) for calculation
		// This ensures consistent scaling regardless of current scale
		const imgWidth = img.width || 1;
		const imgHeight = img.height || 1;
		
		const scaleX = availableWidth / imgWidth;
		const scaleY = availableHeight / imgHeight;
		// Fit mode: scale to fit within bounds (no cropping)
		const scale = Math.min(scaleX, scaleY);
		
		// Only update if scale actually changed (to avoid unnecessary refits)
		const currentScale = img.scaleX || 1;
		if (Math.abs(currentScale - scale) > 0.001) {
			img.scale(scale);
		}
		
		const newLeft = canvasWidth / 2;
		const newTop = canvasHeight / 2;
		
		img.set({
			selectable: false,
			evented: false,
			originX: 'center',
			originY: 'center',
			left: newLeft,
			top: newTop,
		});
		
		// Update coordinates to ensure bounding box is correct
		img.setCoords();
		
		// Get final bounding box
		const bbox = img.getBoundingRect();
		
		// Draw debug rectangles to visualize layers
		// drawDebugBounds(canvasWidth, canvasHeight, totalPadding, availableWidth, availableHeight, bbox);
		
		// Re-render to update frame position if exists
		canvas.requestRenderAll();
	}
	
	// Update container aspect ratio based on image
	function updateContainerAspectRatio() {
		if (!containerElement || !imageAspectRatio) return;
		
		// Get available space from parent (canvas-card)
		const parent = containerElement.parentElement;
		if (!parent) return;
		
		const parentWidth = parent.clientWidth - 16; // Account for card padding (8px * 2)
		const parentHeight = parent.clientHeight - 16;
		
		// Calculate optimal size maintaining aspect ratio
		let containerW = parentWidth;
		let containerH = containerW / imageAspectRatio;
		
		// If height exceeds parent, scale down
		if (containerH > parentHeight) {
			containerH = parentHeight;
			containerW = containerH * imageAspectRatio;
		}
		
		// Ensure minimum size
		const minSize = 300;
		if (containerW < minSize) {
			containerW = minSize;
			containerH = containerW / imageAspectRatio;
		}
		if (containerH < minSize) {
			containerH = minSize;
			containerW = containerH * imageAspectRatio;
		}
		
		// Apply calculated dimensions
		containerElement.style.width = `${containerW}px`;
		containerElement.style.height = `${containerH}px`;
		containerElement.style.maxWidth = '100%';
		containerElement.style.maxHeight = '100%';
		
		// Trigger canvas resize
		resizeCanvas();
	}
	
	// Draw debug rectangles to visualize different layers
	function drawDebugBounds(
		canvasWidth: number,
		canvasHeight: number,
		totalPadding: number,
		availableWidth: number,
		availableHeight: number,
		imageBbox: { left: number; top: number; width: number; height: number }
	): void {
		if (!canvas) return;
		
		// Color definitions
		const COLORS = {
			canvas: '#0066FF',      // Blue - Canvas bounds
			available: '#FFD700',   // Gold - Available space
			image: '#FF0000',       // Red - Image bounds
			container: '#00FF00',   // Green - Container bounds (logged only)
		};
		
		// Remove old debug rectangles
		if (debugCanvasBounds) canvas.remove(debugCanvasBounds);
		if (debugAvailableSpace) canvas.remove(debugAvailableSpace);
		if (debugImageBounds) canvas.remove(debugImageBounds);
		
		// 1. Canvas bounds (Blue) - Full canvas area
		debugCanvasBounds = new Rect({
			left: 0,
			top: 0,
			width: canvasWidth,
			height: canvasHeight,
			fill: 'transparent',
			stroke: COLORS.canvas,
			strokeWidth: 2,
			strokeDashArray: [5, 5],
			selectable: false,
			evented: false,
		});
		canvas.add(debugCanvasBounds);
		canvas.sendObjectToBack(debugCanvasBounds);
		
		// 2. Available space bounds (Gold/Yellow) - Area after padding
		const availableLeft = totalPadding;
		const availableTop = totalPadding;
		debugAvailableSpace = new Rect({
			left: availableLeft,
			top: availableTop,
			width: availableWidth,
			height: availableHeight,
			fill: 'transparent',
			stroke: COLORS.available,
			strokeWidth: 2,
			strokeDashArray: [3, 3],
			selectable: false,
			evented: false,
		});
		canvas.add(debugAvailableSpace);
		canvas.sendObjectToBack(debugAvailableSpace);
		
		// 3. Image bounds (Red) - Actual image bounding box
		debugImageBounds = new Rect({
			left: imageBbox.left,
			top: imageBbox.top,
			width: imageBbox.width,
			height: imageBbox.height,
			fill: 'transparent',
			stroke: COLORS.image,
			strokeWidth: 3,
			strokeDashArray: [10, 5],
			selectable: false,
			evented: false,
		});
		canvas.add(debugImageBounds);
		canvas.sendObjectToBack(debugImageBounds);
	}
	
	// Export canvas as image
	// If originalImage exists and has filters, export from original (high-res)
	// Otherwise, export from displayImage (current behavior)
	// dpi: Target DPI for export (default: 96 DPI for screen, 300 DPI for print)
	export async function exportImage(
		format: 'png' | 'jpeg' = 'png', 
		quality = 1,
		frameId?: string,
		frameOptions?: any,
		dpi: number = 96
	): Promise<string> {
		// Priority: Export from originalImage if available
		if (originalImage) {
			// Ensure filters are applied
			if (originalImage.filters && originalImage.filters.length > 0) {
				originalImage.applyFilters();
			}
			
			// If frame is present, render on off-screen canvas
			if (frameId && frameId !== 'none' && frameOptions) {
				return exportImageWithFrame(format, quality, frameId, frameOptions, dpi);
			}
			
			// Export with original dimensions (high resolution) without frame
			// Create temporary canvas to render image with filters
			return exportImageToCanvas(originalImage, format, quality, dpi);
		}
		
		// Fallback: Export from displayImage (current behavior)
		if (!canvas || !displayImage) return '';
		
		// Get scaled image dimensions as displayed
		const imgWidth = (displayImage.width || 1) * (displayImage.scaleX || 1);
		const imgHeight = (displayImage.height || 1) * (displayImage.scaleY || 1);
		const imgLeft = (displayImage.left || 0) - imgWidth / 2;
		const imgTop = (displayImage.top || 0) - imgHeight / 2;
		
		// Start with image bounds
		let minLeft = imgLeft;
		let minTop = imgTop;
		let maxRight = imgLeft + imgWidth;
		let maxBottom = imgTop + imgHeight;
		
		// Check for frame objects and expand bounds
		const objects = canvas.getObjects();
		objects.forEach(obj => {
			// Check if it's a frame object (has frameObjectId property)
			if ((obj as any).frameObjectId) {
				const bounds = obj.getBoundingRect();
				minLeft = Math.min(minLeft, bounds.left);
				minTop = Math.min(minTop, bounds.top);
				maxRight = Math.max(maxRight, bounds.left + bounds.width);
				maxBottom = Math.max(maxBottom, bounds.top + bounds.height);
			}
		});
		
		// Calculate final export dimensions
		const exportWidth = maxRight - minLeft;
		const exportHeight = maxBottom - minTop;
		
		// Force a render to ensure vignette is applied
		canvas.requestRenderAll();
		
		// Create data URL - include frame area
		return canvas.toDataURL({
			format,
			quality,
			multiplier: 1,
			left: Math.max(0, minLeft),
			top: Math.max(0, minTop),
			width: exportWidth,
			height: exportHeight,
		});
	}
	
	// Helper: Export image to canvas (render với filters)
	// Render image với filters lên temp canvas, không mutate image gốc
	function exportImageToCanvas(
		image: FabricImage,
		format: 'png' | 'jpeg',
		quality: number,
		dpi: number = 96
	): string {
		// Validate image
		if (!image || !image.width || !image.height) {
			console.error('Invalid image for export: missing dimensions');
			return '';
		}
		
		// Get image element - may not be complete for originalImage (not on canvas)
		const imgElement = image.getElement();
		if (!imgElement) {
			console.error('Image element not available for export');
			return '';
		}
		
		// For images not on canvas (like originalImage), we can still use the element
		// even if complete is false, as long as it has naturalWidth/Height
		if (imgElement instanceof HTMLImageElement) {
			if (!imgElement.naturalWidth || !imgElement.naturalHeight) {
				console.error('Image element not loaded (no natural dimensions)');
				return '';
			}
		}
		
		// Save original image properties
		const originalLeft = image.left;
		const originalTop = image.top;
		const originalOriginX = image.originX;
		const originalOriginY = image.originY;
		const originalScaleX = image.scaleX || 1;
		const originalScaleY = image.scaleY || 1;
		const originalCanvas = image.canvas;
		
		// Calculate DPI scale ratio (default screen DPI is 96)
		const screenDpi = 96;
		const dpiRatio = dpi / screenDpi;
		
		// Create temporary fabric canvas to render image with filters
		// Scale canvas dimensions by DPI ratio for higher resolution export
		const tempCanvas = document.createElement('canvas');
		const imgWidth = Math.max(1, Math.round((image.width || 1) * dpiRatio));
		const imgHeight = Math.max(1, Math.round((image.height || 1) * dpiRatio));
		tempCanvas.width = imgWidth;
		tempCanvas.height = imgHeight;
		
		// Create temporary fabric canvas
		const tempFabricCanvas = new Canvas(tempCanvas, {
			width: tempCanvas.width,
			height: tempCanvas.height,
			backgroundColor: 'transparent',
		});
		
		// Temporarily move image to temp canvas for rendering
		// Set image position to center for export
		// Scale image by DPI ratio for higher resolution
		image.set({
			left: tempCanvas.width / 2,
			top: tempCanvas.height / 2,
			originX: 'center',
			originY: 'center',
			scaleX: dpiRatio,
			scaleY: dpiRatio,
		});
		
		// Add image to temp canvas FIRST (this will remove it from original canvas if it exists)
		// Filters need canvas to be applied correctly
		tempFabricCanvas.add(image);
		
		// NOW apply filters - image must be on canvas for filters to work
		if (image.filters && image.filters.length > 0) {
			image.applyFilters();
		}
		
		// Force render - important for images not previously on a canvas
		tempFabricCanvas.renderAll();
		
		// Double-check: ensure image is actually rendered
		// Sometimes fabric needs a second render for images not on canvas
		if (!originalCanvas) {
			// Image was not on canvas originally, may need extra render
			tempFabricCanvas.renderAll();
		}
		
		// Export from temp canvas
		const dataUrl = tempCanvas.toDataURL(
			format === 'jpeg' ? 'image/jpeg' : 'image/png',
			format === 'jpeg' ? quality : 1
		);
		
		// Validate exported dataURL
		if (!dataUrl || dataUrl.length < 100 || dataUrl === 'data:,') {
			console.error('Failed to export image: invalid dataURL');
			tempFabricCanvas.remove(image);
			tempFabricCanvas.dispose();
			// Restore properties even on error
			image.set({
				left: originalLeft,
				top: originalTop,
				originX: originalOriginX,
				originY: originalOriginY,
				scaleX: originalScaleX,
				scaleY: originalScaleY,
			});
			if (originalCanvas) {
				originalCanvas.add(image);
			}
			return '';
		}
		
		// Cleanup: remove image from temp canvas
		tempFabricCanvas.remove(image);
		tempFabricCanvas.dispose();
		
		// Restore original properties
		image.set({
			left: originalLeft,
			top: originalTop,
			originX: originalOriginX,
			originY: originalOriginY,
			scaleX: originalScaleX,
			scaleY: originalScaleY,
		});
		
		// Restore to original canvas if it existed
		if (originalCanvas) {
			originalCanvas.add(image);
			originalCanvas.requestRenderAll();
		}
		
		return dataUrl;
	}
	
	// Export image with frame on off-screen canvas (high-res)
	// NEW APPROACH: 
	// 1. Render image với filters trên temp fabric canvas → lấy dataURL
	// 2. Tạo canvas 2D mới (finalCanvas) riêng biệt
	// 3. Load image từ dataURL và vẽ lên finalCanvas
	// 4. Vẽ frame overlay lên finalCanvas
	// 5. Export từ finalCanvas
	// Lợi ích: Tránh conflict giữa fabric rendering và manual 2D drawing, đảm bảo image không bị mất
	async function exportImageWithFrame(
		format: 'png' | 'jpeg',
		quality: number,
		frameId: string,
		frameOptions: FrameOptions,
		dpi: number = 96
	): Promise<string> {
		if (!originalImage) {
			console.error('Cannot export with frame: originalImage not available');
			dispatch('exportProgress', {
				step: 'Validation',
				status: 'error',
				message: 'originalImage not available'
			});
			return '';
		}

		// Calculate DPI scale ratio (default screen DPI is 96)
		const screenDpi = 96;
		const dpiRatio = dpi / screenDpi;
		
		// Get dimensions and scale by DPI ratio
		const baseWidth = Math.max(1, Math.round(originalImage.width || 1));
		const baseHeight = Math.max(1, Math.round(originalImage.height || 1));
		const width = Math.max(1, Math.round(baseWidth * dpiRatio));
		const height = Math.max(1, Math.round(baseHeight * dpiRatio));

		dispatch('exportProgress', {
			step: 'Setup',
			status: 'in-progress',
			message: `Creating temp canvas (${width} × ${height}px @ ${dpi} DPI)`
		});

		// Save original image properties
		const originalLeft = originalImage.left;
		const originalTop = originalImage.top;
		const originalOriginX = originalImage.originX;
		const originalOriginY = originalImage.originY;
		const originalScaleX = originalImage.scaleX || 1;
		const originalScaleY = originalImage.scaleY || 1;
		const originalCanvas = originalImage.canvas;

		// Create temp fabric canvas với kích thước originalImage (scaled by DPI)
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = width;
		tempCanvas.height = height;

		const tempFabricCanvas = new Canvas(tempCanvas, {
			width: tempCanvas.width,
			height: tempCanvas.height,
			backgroundColor: 'transparent',
		});

		dispatch('exportProgress', {
			step: 'Setup',
			status: 'success',
			message: `Temp canvas created: ${width} × ${height}px`
		});

		try {
			// Step 1: Add originalImage vào temp canvas
			dispatch('exportProgress', {
				step: 'Add Image to Canvas',
				status: 'in-progress',
				message: 'Moving image to temp canvas...'
			});

			// Scale image by DPI ratio for higher resolution export
			originalImage.set({
				left: tempCanvas.width / 2,
				top: tempCanvas.height / 2,
				originX: 'center',
				originY: 'center',
				scaleX: dpiRatio,
				scaleY: dpiRatio,
			});

			tempFabricCanvas.add(originalImage);

			dispatch('exportProgress', {
				step: 'Add Image to Canvas',
				status: 'success',
				message: 'Image added to temp canvas'
			});

			// Step 2: Apply filters (image phải có canvas để filters hoạt động)
			dispatch('exportProgress', {
				step: 'Apply Filters',
				status: 'in-progress',
				message: originalImage.filters && originalImage.filters.length > 0 
					? `Applying ${originalImage.filters.length} filter(s)...`
					: 'No filters to apply'
			});

			if (originalImage.filters && originalImage.filters.length > 0) {
				originalImage.applyFilters();
			}

			dispatch('exportProgress', {
				step: 'Apply Filters',
				status: 'success',
				message: 'Filters applied'
			});

			// Step 3: Render image
			dispatch('exportProgress', {
				step: 'Render Image',
				status: 'in-progress',
				message: 'Rendering image with filters...'
			});

			tempFabricCanvas.renderAll();

			// Get image dataURL after fabric render
			const imageDataUrl = tempCanvas.toDataURL('image/png', 1);
			const imagePreview = tempCanvas.toDataURL('image/png', 0.5);

			// Validate image dataURL
			if (!imageDataUrl || imageDataUrl.length < 100 || imageDataUrl === 'data:,') {
				throw new Error('Failed to render image: invalid dataURL');
			}

			dispatch('exportProgress', {
				step: 'Render Image',
				status: 'success',
				message: 'Image rendered',
				preview: imagePreview
			});

			// Step 4: Render frame on separate canvas 2D
			// Create new canvas 2D to avoid conflict with fabric canvas
			dispatch('exportProgress', {
				step: 'Render Frame',
				status: 'in-progress',
				message: `Rendering frame: ${frameId}...`
			});

			// Create final export canvas (2D only, no fabric)
			const finalCanvas = document.createElement('canvas');
			finalCanvas.width = width;
			finalCanvas.height = height;
			const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: false });
			if (!finalCtx) {
				throw new Error('Failed to get 2D context for final canvas');
			}

			// Load image from dataURL and draw it
			const img = new Image();
			await new Promise<void>((resolve, reject) => {
				// Set timeout to prevent hanging
				const timeout = setTimeout(() => {
					reject(new Error('Image load timeout'));
				}, 10000);

				img.onload = () => {
					clearTimeout(timeout);
					try {
						// Clear canvas first (ensure clean state)
						finalCtx.clearRect(0, 0, width, height);
						
						// Draw image first (fill entire canvas)
						finalCtx.drawImage(img, 0, 0, width, height);
						
						// Then draw frame overlay on top
						renderFrameOnCanvas2D(
							finalCtx,
							width,
							height,
							frameId as FrameId,
							frameOptions
						);
						
						resolve();
					} catch (err) {
						clearTimeout(timeout);
						reject(err instanceof Error ? err : new Error('Failed to render frame'));
					}
				};
				
				img.onerror = () => {
					clearTimeout(timeout);
					reject(new Error('Failed to load image for frame rendering'));
				};
				
				// Set src after handlers are set
				img.src = imageDataUrl;
			});

			// Validate frame preview
			const framePreview = finalCanvas.toDataURL('image/png', 0.5);
			if (!framePreview || framePreview.length < 100) {
				throw new Error('Failed to render frame: invalid preview');
			}

			dispatch('exportProgress', {
				step: 'Render Frame',
				status: 'success',
				message: 'Frame rendered',
				preview: framePreview
			});

			// Step 5: Export toàn bộ canvas
			dispatch('exportProgress', {
				step: 'Export',
				status: 'in-progress',
				message: `Exporting as ${format.toUpperCase()}...`
			});

			// Export from final canvas (with image + frame)
			const dataUrl = finalCanvas.toDataURL(
				format === 'jpeg' ? 'image/jpeg' : 'image/png',
				format === 'jpeg' ? quality : 1
			);

			// Validate output
			if (!dataUrl || dataUrl.length < 100 || dataUrl === 'data:,') {
				throw new Error('Invalid export dataURL');
			}

			dispatch('exportProgress', {
				step: 'Export',
				status: 'success',
				message: `Export complete (${(dataUrl.length / 1024).toFixed(1)}KB)`,
				preview: dataUrl
			});

			return dataUrl;
		} catch (error) {
			console.error('Failed to export image with frame:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			dispatch('exportProgress', {
				step: 'Error',
				status: 'error',
				message: errorMessage
			});
			return '';
		} finally {
			// Cleanup: remove image from temp canvas
			dispatch('exportProgress', {
				step: 'Cleanup',
				status: 'in-progress',
				message: 'Cleaning up...'
			});

			tempFabricCanvas.remove(originalImage);
			tempFabricCanvas.dispose();

			// Restore original properties
			originalImage.set({
				left: originalLeft,
				top: originalTop,
				originX: originalOriginX,
				originY: originalOriginY,
				scaleX: originalScaleX,
				scaleY: originalScaleY,
			});

			// Restore to original canvas if it existed
			if (originalCanvas) {
				originalCanvas.add(originalImage);
				originalCanvas.requestRenderAll();
			}

			dispatch('exportProgress', {
				step: 'Cleanup',
				status: 'success',
				message: 'Cleanup complete'
			});
		}
	}
	
	// Get canvas instance
	export function getCanvas(): Canvas | null {
		return canvas;
	}
	
	// Get current image
	export function getImage(): FabricImage | null {
		return image;
	}
	
	// Update canvas background for theme change
	export function updateTheme(isDark: boolean): void {
		if (!canvas) return;
		canvas.backgroundColor = isDark ? '#1e293b' : '#f8fafc';
		canvas.requestRenderAll();
	}
	
	// ========================================
	// VIGNETTE FUNCTIONS
	// ========================================
	
	// Set vignette intensity (-100 to 100)
	export function setVignette(value: number): void {
		vignetteValue = value;
		if (canvas) {
			canvas.requestRenderAll();
		}
	}
	
	
	// Draw vignette overlay on canvas
	function drawVignette(): void {
		if (!canvas || !displayImage) return;
		
		// Get the lower canvas context (main canvas)
		const ctx = canvas.getContext();
		if (!ctx) return;
		
		// Get image bounds (from displayImage)
		const imgWidth = (displayImage.width || 1) * (displayImage.scaleX || 1);
		const imgHeight = (displayImage.height || 1) * (displayImage.scaleY || 1);
		const imgLeft = (displayImage.left || 0) - imgWidth / 2;
		const imgTop = (displayImage.top || 0) - imgHeight / 2;
		const centerX = imgLeft + imgWidth / 2;
		const centerY = imgTop + imgHeight / 2;
		
		// Calculate radius (larger of width/height)
		const radius = Math.sqrt(imgWidth * imgWidth + imgHeight * imgHeight) / 2;
		
		// Intensity: negative = darken edges, positive = lighten edges
		const intensity = Math.abs(vignetteValue) / 100;
		const isDarken = vignetteValue < 0;
		
		// Create radial gradient
		const gradient = ctx.createRadialGradient(
			centerX, centerY, radius * 0.3,  // Inner circle (clear)
			centerX, centerY, radius * 1.1   // Outer circle (effect)
		);
		
		if (isDarken) {
			// Darken edges
			gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
			gradient.addColorStop(0.5, `rgba(0, 0, 0, ${intensity * 0.2})`);
			gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.7})`);
		} else {
			// Lighten edges (rare, but supported)
			gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
			gradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.1})`);
			gradient.addColorStop(1, `rgba(255, 255, 255, ${intensity * 0.4})`);
		}
		
		// Save context state
		ctx.save();
		
		// Clip to image bounds
		ctx.beginPath();
		ctx.rect(imgLeft, imgTop, imgWidth, imgHeight);
		ctx.clip();
		
		// Draw gradient overlay
		ctx.fillStyle = gradient;
		ctx.fillRect(imgLeft, imgTop, imgWidth, imgHeight);
		
		// Restore context state
		ctx.restore();
	}
	
	// ========================================
	// CROP FUNCTIONS
	// ========================================
	
	// Enter crop mode - Reload image from hard copy (original data)
	export async function enterCropMode(aspectRatio: number | null = null): Promise<void> {
		if (!canvas) return;
		
		// Reload image from hard copy (dataURL) when entering crop mode
		// This ensures we always get the exact same image data as the original
		if (originalImageDataUrl) {
			// Load from hard copy dataURL without optimization (skip optimization to keep original quality)
			await loadImageFromUrl(originalImageDataUrl, false); // false = skip auto-scale
		} else if (originalImageUrl) {
			// Fallback to originalImageUrl if hard copy not available
			await loadImageFromUrl(originalImageUrl, false);
		} else {
			console.warn('No original image data available to reload');
			// Continue with current image if no original data available
		}
		
		// Wait for displayImage to be ready
		if (!displayImage) {
			console.warn('Display image not available after reload');
			return;
		}
		
		isCropMode = true;
		cropAspectRatio = aspectRatio;
		
		// Enable selection for crop interaction
		canvas.selection = true;
		
		// Get image bounds (from displayImage - now showing original image)
		const imgWidth = (displayImage.width || 1) * (displayImage.scaleX || 1);
		const imgHeight = (displayImage.height || 1) * (displayImage.scaleY || 1);
		const imgLeft = (displayImage.left || 0) - imgWidth / 2;
		const imgTop = (displayImage.top || 0) - imgHeight / 2;
		
		// Calculate initial crop rect size (80% of image)
		let cropWidth = imgWidth * 0.8;
		let cropHeight = imgHeight * 0.8;
		
		// Apply aspect ratio if specified
		if (aspectRatio) {
			if (cropWidth / cropHeight > aspectRatio) {
				cropWidth = cropHeight * aspectRatio;
			} else {
				cropHeight = cropWidth / aspectRatio;
			}
		}
		
		// Create crop rectangle - simplified for interaction
		cropRect = new Rect({
			left: imgLeft + (imgWidth - cropWidth) / 2,
			top: imgTop + (imgHeight - cropHeight) / 2,
			width: cropWidth,
			height: cropHeight,
			fill: 'rgba(34, 197, 94, 0.15)',
			stroke: '#22c55e',
			strokeWidth: 2,
			strokeUniform: true,
			// Corner controls - make them visible and large
			cornerColor: '#22c55e',
			cornerStrokeColor: '#fff',
			cornerStyle: 'circle',
			cornerSize: 16,
			transparentCorners: false,
			padding: 0,
			// Border
			borderColor: '#22c55e',
			borderDashArray: [6, 3],
			// Interaction - essential settings
			selectable: true,
			evented: true,
			hasControls: true,
			hasBorders: true,
			lockRotation: true,
			centeredRotation: false,
		});
		
		// Hide rotation control
		cropRect.setControlsVisibility({
			mtr: false,
			ml: true,
			mr: true,
			mt: true,
			mb: true,
			tl: true,
			tr: true,
			bl: true,
			br: true,
		});
		
		// Add to canvas first
		canvas.add(cropRect);
		
		// Create grid lines (rule of thirds)
		createGridLines();
		
		// Set as active and bring to front
		canvas.setActiveObject(cropRect);
		canvas.bringObjectToFront(cropRect);
		
		// Add constraint events after object is on canvas
		cropRect.on('moving', () => {
			constrainCropRect();
			updateGridLines();
		});
		
		cropRect.on('scaling', () => {
			constrainCropRect();
			updateGridLines();
			if (cropAspectRatio) {
				maintainAspectRatio();
			}
		});
		
		cropRect.on('modified', () => {
			updateGridLines();
		});
		
		canvas.requestRenderAll();
		
		dispatch('cropModeChange', true);
	}
	
	// Create grid lines for rule of thirds
	function createGridLines(): void {
		if (!canvas || !cropRect) return;
		
		// Remove existing grid lines
		removeGridLines();
		
		const lineStyle = {
			stroke: 'rgba(255, 255, 255, 0.7)',
			strokeWidth: 1,
			selectable: false,
			evented: false,
			excludeFromExport: true,
		};
		
		// Create 4 lines (2 horizontal, 2 vertical)
		for (let i = 0; i < 4; i++) {
			const line = new Line([0, 0, 0, 0], lineStyle);
			gridLines.push(line);
			canvas.add(line);
		}
		
		updateGridLines();
	}
	
	// Update grid lines position based on crop rect
	function updateGridLines(): void {
		if (!cropRect || gridLines.length !== 4) return;
		
		const left = cropRect.left || 0;
		const top = cropRect.top || 0;
		const width = (cropRect.width || 0) * (cropRect.scaleX || 1);
		const height = (cropRect.height || 0) * (cropRect.scaleY || 1);
		
		const thirdW = width / 3;
		const thirdH = height / 3;
		
		// Vertical line 1 (1/3 from left)
		gridLines[0].set({
			x1: left + thirdW,
			y1: top,
			x2: left + thirdW,
			y2: top + height,
		});
		
		// Vertical line 2 (2/3 from left)
		gridLines[1].set({
			x1: left + thirdW * 2,
			y1: top,
			x2: left + thirdW * 2,
			y2: top + height,
		});
		
		// Horizontal line 1 (1/3 from top)
		gridLines[2].set({
			x1: left,
			y1: top + thirdH,
			x2: left + width,
			y2: top + thirdH,
		});
		
		// Horizontal line 2 (2/3 from top)
		gridLines[3].set({
			x1: left,
			y1: top + thirdH * 2,
			x2: left + width,
			y2: top + thirdH * 2,
		});
		
		// Bring crop rect to front (above grid lines)
		if (canvas && cropRect) {
			canvas.bringObjectToFront(cropRect);
		}
	}
	
	// Remove grid lines
	function removeGridLines(): void {
		if (!canvas) return;
		
		gridLines.forEach(line => {
			canvas!.remove(line);
		});
		gridLines = [];
	}
	
	// Constrain crop rect within image bounds
	function constrainCropRect(): void {
		if (!cropRect || !image || !canvas) return;
		
		const imgWidth = (image.width || 1) * (image.scaleX || 1);
		const imgHeight = (image.height || 1) * (image.scaleY || 1);
		const imgLeft = (image.left || 0) - imgWidth / 2;
		const imgTop = (image.top || 0) - imgHeight / 2;
		
		const cropWidth = (cropRect.width || 0) * (cropRect.scaleX || 1);
		const cropHeight = (cropRect.height || 0) * (cropRect.scaleY || 1);
		
		let left = cropRect.left || 0;
		let top = cropRect.top || 0;
		
		// Constrain position
		left = Math.max(imgLeft, Math.min(left, imgLeft + imgWidth - cropWidth));
		top = Math.max(imgTop, Math.min(top, imgTop + imgHeight - cropHeight));
		
		cropRect.set({ left, top });
		canvas.requestRenderAll();
	}
	
	// Maintain aspect ratio during scaling
	function maintainAspectRatio(): void {
		if (!cropRect || !cropAspectRatio) return;
		
		const width = (cropRect.width || 1) * (cropRect.scaleX || 1);
		const height = width / cropAspectRatio;
		
		cropRect.set({
			scaleY: height / (cropRect.height || 1)
		});
	}
	
	// Update aspect ratio
	export function updateCropAspectRatio(aspectRatio: number | null): void {
		if (!isCropMode || !cropRect || !image || !canvas) return;
		
		cropAspectRatio = aspectRatio;
		
		if (aspectRatio) {
			const width = (cropRect.width || 1) * (cropRect.scaleX || 1);
			const height = width / aspectRatio;
			
			cropRect.set({
				scaleY: height / (cropRect.height || 1)
			});
			
			constrainCropRect();
		}
		
		canvas.requestRenderAll();
	}
	
	// Apply crop
	export async function applyCrop(): Promise<void> {
		if (!canvas || !image || !cropRect) return;
		
		// Get crop bounds relative to original image
		const imgScale = image.scaleX || 1;
		const imgLeft = (image.left || 0) - ((image.width || 0) * imgScale) / 2;
		const imgTop = (image.top || 0) - ((image.height || 0) * imgScale) / 2;
		
		const cropLeft = (cropRect.left || 0) - imgLeft;
		const cropTop = (cropRect.top || 0) - imgTop;
		const cropWidth = (cropRect.width || 0) * (cropRect.scaleX || 1);
		const cropHeight = (cropRect.height || 0) * (cropRect.scaleY || 1);
		
		// Convert to original image coordinates
		const originalCropLeft = cropLeft / imgScale;
		const originalCropTop = cropTop / imgScale;
		const originalCropWidth = cropWidth / imgScale;
		const originalCropHeight = cropHeight / imgScale;
		
		// Create temporary canvas to crop
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = originalCropWidth;
		tempCanvas.height = originalCropHeight;
		const ctx = tempCanvas.getContext('2d');
		
		if (!ctx) return;
		
		// Get the original image element
		const imgElement = image.getElement() as HTMLImageElement;
		
		// Draw cropped region
		ctx.drawImage(
			imgElement,
			originalCropLeft, originalCropTop, originalCropWidth, originalCropHeight,
			0, 0, originalCropWidth, originalCropHeight
		);
		
		// Load cropped image back
		const croppedDataUrl = tempCanvas.toDataURL('image/png');
		
		// Exit crop mode first
		exitCropMode();
		
		// Load the cropped image
		await loadImageFromUrl(croppedDataUrl);
	}
	
	// Exit crop mode without applying
	export function exitCropMode(): void {
		if (!canvas) return;
		
		// Remove grid lines first
		removeGridLines();
		
		if (cropRect) {
			canvas.remove(cropRect);
			cropRect = null;
		}
		
		isCropMode = false;
		cropAspectRatio = null;
		
		// Disable selection when exiting crop mode
		canvas.selection = false;
		canvas.discardActiveObject();
		canvas.requestRenderAll();
		
		dispatch('cropModeChange', false);
	}
	
	// Check if in crop mode
	export function isInCropMode(): boolean {
		return isCropMode;
	}
	
	// Cleanup
	function cleanup() {
		if (canvas) {
			canvas.dispose();
			canvas = null;
		}
	}
	
	onDestroy(cleanup);
</script>

<div 
	bind:this={containerElement}
	class="canvas-container"
>
	{#if !image}
		<div class="empty-state">
			<div class="empty-icon">🖼️</div>
			<p class="empty-title">Chưa có ảnh</p>
			<p class="empty-subtitle">Upload ảnh để bắt đầu chỉnh sửa</p>
		</div>
	{/if}
	
	<canvas 
		bind:this={canvasElement}
		class="fabric-canvas"
		class:hidden={!image}
	></canvas>
</div>

<style>
	.canvas-container {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 300px;
		border-radius: var(--radius-cartoon);
		overflow: hidden;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		box-sizing: border-box;
		/* Center container when sized to image aspect ratio */
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	:global(.dark) .canvas-container {
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
	}
	
	/* Ensure fabric.js canvas wrapper receives pointer events */
	.canvas-container :global(.canvas-container) {
		pointer-events: auto !important;
	}
	
	.canvas-container :global(.upper-canvas) {
		pointer-events: auto !important;
	}
	
	.fabric-canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	
	.fabric-canvas.hidden {
		opacity: 0;
		position: absolute;
		pointer-events: none;
	}
	
	.empty-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--color-surface-400);
	}
	
	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		animation: float 3s ease-in-out infinite;
	}
	
	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}
	
	.empty-subtitle {
		font-size: 0.875rem;
		opacity: 0.7;
	}
	
	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}
</style>
