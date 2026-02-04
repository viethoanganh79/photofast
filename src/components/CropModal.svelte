<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { Canvas, FabricImage, Rect, Line } from 'fabric';
	
	// Props
	export let isOpen: boolean = false;
	export let imageDataUrl: string | null = null; // Hard copy dataURL của image gốc
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		close: void;
		apply: { dataUrl: string };
	}>();
	
	// Canvas references
	let canvasElement: HTMLCanvasElement;
	let containerElement: HTMLDivElement;
	let canvas: Canvas | null = null;
	
	// Image state
	let image: FabricImage | null = null;
	let isLoading = false; // Flag to prevent multiple simultaneous loads
	let currentLoadedDataUrl: string | null = null; // Track which image is currently loaded
	
	// Crop state
	let cropRect: Rect | null = null;
	let cropAspectRatio: number | null = null;
	let gridLines: Line[] = [];
	
	// Reactive: resize canvas when container size changes
	let containerWidth = 0;
	let containerHeight = 0;
	
	// Initialize fabric.Canvas on mount
	onMount(() => {
		initCanvas();
		setupResizeObserver();
		
		// If modal is already open when component mounts, load image
		if (isOpen && imageDataUrl && canvas) {
			loadImage(imageDataUrl);
		}
		
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
		
		// Initial resize
		resizeCanvas();
	}
	
	function setupResizeObserver() {
		if (!containerElement) return;
		
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerWidth = entry.contentRect.width;
				containerHeight = entry.contentRect.height;
				resizeCanvas();
			}
		});
		
		resizeObserver.observe(containerElement);
	}
	
	function resizeCanvas() {
		if (!canvas || !containerElement) return;
		
		const width = containerElement.clientWidth;
		const height = containerElement.clientHeight;
		
		if (width > 0 && height > 0) {
			canvas.setDimensions({ width, height });
			
			if (image) {
				fitImageToCanvas(image);
			}
			
			canvas.requestRenderAll();
		}
	}
	
	// Load image from dataURL
	async function loadImage(dataUrl: string): Promise<void> {
		if (!canvas || !canvasElement) {
			console.warn('Canvas not ready for loading image');
			return;
		}
		
		if (!dataUrl) {
			console.warn('No image data URL provided');
			return;
		}
		
		// Prevent loading if already loading or if same image is already loaded
		if (isLoading) {
			return;
		}
		
		if (currentLoadedDataUrl === dataUrl && image) {
			return;
		}
		
		isLoading = true;
		currentLoadedDataUrl = dataUrl;
		
		try {
			const fabricImage = await FabricImage.fromURL(dataUrl);
			
			if (!fabricImage) {
				console.error('Failed to create fabric image from dataURL');
				return;
			}
			
			// Clear previous content
			canvas.clear();
			const isDark = document.documentElement.classList.contains('dark');
			canvas.backgroundColor = isDark ? '#1e293b' : '#f8fafc';
			
			image = fabricImage;
			
			// Ensure image is not selectable/evented so it doesn't interfere with crop rect
			fabricImage.set({
				selectable: false,
				evented: false,
			});
			
			// Fit and add image to canvas
			fitImageToCanvas(fabricImage);
			canvas.add(fabricImage);
			canvas.sendObjectToBack(fabricImage); // Send image to back so crop rect is on top
			canvas.requestRenderAll();
			
			// Initialize crop after image is loaded
			initCrop();
		} catch (error) {
			console.error('Error loading image in crop modal:', error);
			// Reset on error so we can retry
			currentLoadedDataUrl = null;
		} finally {
			isLoading = false;
		}
	}
	
	// Fit image to canvas
	function fitImageToCanvas(img: FabricImage) {
		if (!canvas) return;
		
		const basePadding = 8;
		const filterPadding = 20;
		const totalPadding = basePadding + filterPadding;
		
		const canvasWidth = canvas.getWidth();
		const canvasHeight = canvas.getHeight();
		
		const paddingUsed = totalPadding * 2;
		const availableWidth = Math.max(0, canvasWidth - paddingUsed);
		const availableHeight = Math.max(0, canvasHeight - paddingUsed);
		
		const imgWidth = img.width || 1;
		const imgHeight = img.height || 1;
		
		const scaleX = availableWidth / imgWidth;
		const scaleY = availableHeight / imgHeight;
		const scale = Math.min(scaleX, scaleY);
		
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
		
		img.setCoords();
		canvas.requestRenderAll();
	}
	
	// Initialize crop when modal opens
	$: if (isOpen && imageDataUrl && !isLoading) {
		// Only load if imageDataUrl is different from currently loaded image
		if (currentLoadedDataUrl !== imageDataUrl) {
			// Wait for canvas to be ready before loading image
			if (canvas && canvasElement) {
				loadImage(imageDataUrl);
			} else {
				// If canvas not ready yet, wait a bit
				setTimeout(() => {
					if (canvas && imageDataUrl && currentLoadedDataUrl !== imageDataUrl) {
						loadImage(imageDataUrl);
					}
				}, 100);
			}
		}
	}
	
	// Initialize crop rectangle
	function initCrop(aspectRatio: number | null = null): void {
		if (!canvas || !image) return;
		
		cropAspectRatio = aspectRatio;
		
		// Enable selection for crop interaction
		canvas.selection = true;
		
		// Get image bounds
		const imgWidth = (image.width || 1) * (image.scaleX || 1);
		const imgHeight = (image.height || 1) * (image.scaleY || 1);
		const imgLeft = (image.left || 0) - imgWidth / 2;
		const imgTop = (image.top || 0) - imgHeight / 2;
		
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
		
		// Create crop rectangle
		cropRect = new Rect({
			left: imgLeft + (imgWidth - cropWidth) / 2,
			top: imgTop + (imgHeight - cropHeight) / 2,
			width: cropWidth,
			height: cropHeight,
			fill: 'rgba(34, 197, 94, 0.15)',
			stroke: '#22c55e',
			strokeWidth: 2,
			strokeUniform: true,
			cornerColor: '#22c55e',
			cornerStrokeColor: '#fff',
			cornerStyle: 'circle',
			cornerSize: 16,
			transparentCorners: false,
			padding: 0,
			borderColor: '#22c55e',
			borderDashArray: [6, 3],
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
		
		// Add to canvas
		canvas.add(cropRect);
		
		// Create grid lines
		createGridLines();
		
		// Set as active and bring to front
		canvas.setActiveObject(cropRect);
		canvas.bringObjectToFront(cropRect);
		
		// Force update to ensure crop rect is interactive
		cropRect.setCoords();
		canvas.requestRenderAll();
		
		// Ensure canvas allows interaction
		canvas.selection = true;
		canvas.defaultCursor = 'default';
		
		// Add constraint events
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
	}
	
	// Create grid lines for rule of thirds
	function createGridLines(): void {
		if (!canvas || !cropRect) return;
		
		removeGridLines();
		
		const lineStyle = {
			stroke: 'rgba(255, 255, 255, 0.7)',
			strokeWidth: 1,
			selectable: false,
			evented: false,
			excludeFromExport: true,
		};
		
		for (let i = 0; i < 4; i++) {
			const line = new Line([0, 0, 0, 0], lineStyle);
			gridLines.push(line);
			canvas.add(line);
		}
		
		updateGridLines();
	}
	
	// Update grid lines position
	function updateGridLines(): void {
		if (!cropRect || gridLines.length !== 4) return;
		
		const left = cropRect.left || 0;
		const top = cropRect.top || 0;
		const width = (cropRect.width || 0) * (cropRect.scaleX || 1);
		const height = (cropRect.height || 0) * (cropRect.scaleY || 1);
		
		const thirdW = width / 3;
		const thirdH = height / 3;
		
		// Vertical line 1
		gridLines[0].set({
			x1: left + thirdW,
			y1: top,
			x2: left + thirdW,
			y2: top + height,
		});
		
		// Vertical line 2
		gridLines[1].set({
			x1: left + thirdW * 2,
			y1: top,
			x2: left + thirdW * 2,
			y2: top + height,
		});
		
		// Horizontal line 1
		gridLines[2].set({
			x1: left,
			y1: top + thirdH,
			x2: left + width,
			y2: top + thirdH,
		});
		
		// Horizontal line 2
		gridLines[3].set({
			x1: left,
			y1: top + thirdH * 2,
			x2: left + width,
			y2: top + thirdH * 2,
		});
		
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
	export function updateAspectRatio(aspectRatio: number | null): void {
		if (!cropRect || !image || !canvas) return;
		
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
	async function applyCrop(): Promise<void> {
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
		
		// Get cropped image dataURL
		const croppedDataUrl = tempCanvas.toDataURL('image/png');
		
		// Dispatch apply event with cropped dataURL
		dispatch('apply', { dataUrl: croppedDataUrl });
	}
	
	// Close modal
	function closeModal(): void {
		// Cleanup crop state
		if (canvas) {
			removeGridLines();
			if (cropRect) {
				canvas.remove(cropRect);
				cropRect = null;
			}
			canvas.selection = false;
			canvas.discardActiveObject();
		}
		
		// Reset loading state when modal closes
		isLoading = false;
		currentLoadedDataUrl = null;
		image = null;
		
		dispatch('close');
	}
	
	// Handle escape key
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			closeModal();
		}
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

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="modal-overlay" on:click={closeModal} role="dialog" aria-modal="true">
		<div class="modal-content" on:click|stopPropagation role="document">
			<!-- Header -->
			<div class="modal-header">
				<h3 class="modal-title">
					<span>✂️</span>
					<span>Crop ảnh</span>
				</h3>
				<button class="modal-close" on:click={closeModal} aria-label="Đóng">
					✕
				</button>
			</div>
			
			<!-- Canvas Area -->
			<div class="modal-body">
				<div 
					bind:this={containerElement}
					class="crop-canvas-container"
				>
					<canvas 
						bind:this={canvasElement}
						class="crop-canvas"
					></canvas>
				</div>
			</div>
			
			<!-- Footer Actions -->
			<div class="modal-footer">
				<button class="btn-ghost" on:click={closeModal}>
					<span>❌</span>
					<span>Hủy</span>
				</button>
				<button class="btn-primary" on:click={applyCrop}>
					<span>✅</span>
					<span>Áp dụng</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: var(--color-overlay);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.2s ease-out;
	}
	
	.modal-content {
		background: var(--color-card);
		border-radius: var(--radius-cartoon-lg);
		box-shadow: var(--shadow-soft-xl);
		width: 100%;
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: scaleIn 0.2s ease-out;
		border: 1px solid var(--color-border);
	}
	
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--color-border);
	}
	
	.modal-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
		color: var(--color-text);
	}
	
	.modal-close {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-cartoon);
		border: none;
		background: var(--color-surface-100);
		color: var(--color-text);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		transition: all 150ms ease;
	}
	
	:global(.dark) .modal-close {
		background: var(--color-surface-200);
		color: var(--color-text);
	}
	
	.modal-close:hover {
		background: var(--color-surface-200);
		transform: scale(1.05);
	}
	
	:global(.dark) .modal-close:hover {
		background: var(--color-surface-300);
		color: var(--color-text);
	}
	
	.modal-body {
		flex: 1;
		overflow: hidden;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 400px;
	}
	
	.crop-canvas-container {
		width: 100%;
		height: 100%;
		min-height: 400px;
		border-radius: var(--radius-cartoon);
		overflow: hidden;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		position: relative;
	}
	
	:global(.dark) .crop-canvas-container {
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
	}
	
	.crop-canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	
	.modal-footer {
		display: flex;
		gap: 0.75rem;
		padding: 1.25rem 1.5rem;
		border-top: 1px solid var(--color-border);
		background: var(--color-card);
	}
	
	.modal-footer button {
		flex: 1;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	@keyframes scaleIn {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>

