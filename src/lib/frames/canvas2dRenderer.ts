/**
 * Canvas2D Frame Renderer
 * Render frames trên HTML5 Canvas 2D context (cho export)
 */

import type { FrameId, FrameOptions } from './types';
import { getFrameConfigById } from './frameRenderer';

/**
 * Render frame trên HTML5 Canvas 2D context
 * Dùng cho export với kích thước gốc
 */
export function renderFrameOnCanvas2D(
	ctx: CanvasRenderingContext2D,
	imageWidth: number,
	imageHeight: number,
	frameId: FrameId,
	options: FrameOptions
): void {
	if (frameId === 'none') return;

	const config = getFrameConfigById(frameId);
	if (!config) {
		console.warn(`Frame config not found for ID: ${frameId}`);
		return;
	}

	// Merge options
	const frameOptions: FrameOptions = {
		...config.defaultOptions,
		...options,
	};

	// Calculate bounds (image is centered at canvas center)
	const centerX = imageWidth / 2;
	const centerY = imageHeight / 2;
	const left = 0;
	const top = 0;
	const width = imageWidth;
	const height = imageHeight;

	// Render based on frame type
	switch (frameId) {
		case 'solid':
			renderSolidFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		case 'double':
			renderDoubleFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		case 'rounded':
			renderRoundedFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		case 'shadow':
			renderShadowFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		case 'gradient':
			renderGradientFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		case 'dashed':
			renderDashedFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		case 'polaroid':
			renderPolaroidFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		case 'vintage':
			renderVintageFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		case 'filmstrip':
			renderFilmstripFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		case 'tape':
			renderTapeFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		case 'stamp':
			renderStampFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		case 'torn':
			renderTornFrame2D(ctx, left, top, width, height, frameOptions);
			break;
		default:
			console.warn(`Unknown frame ID: ${frameId}`);
	}
}

/**
 * Helper: Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
		: null;
}

/**
 * Helper: Darken color
 */
function darkenColor(hex: string, percent: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;

	const factor = 1 - percent / 100;
	return `rgb(${Math.floor(rgb.r * factor)}, ${Math.floor(rgb.g * factor)}, ${Math.floor(rgb.b * factor)})`;
}

/**
 * Helper: Lighten color
 */
function lightenColor(hex: string, percent: number): string {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;

	const factor = 1 + percent / 100;
	return `rgb(${Math.min(255, Math.floor(rgb.r * factor))}, ${Math.min(255, Math.floor(rgb.g * factor))}, ${Math.min(255, Math.floor(rgb.b * factor))})`;
}

// ============================================
// BASIC FRAME RENDERERS (Canvas2D)
// ============================================

function renderSolidFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const borderWidth = options.borderWidth || 10;
	const borderRadius = options.borderRadius || 0;

	ctx.save();
	ctx.fillStyle = options.borderColor || '#ffffff';

	// Helper function to draw rounded rectangle
	const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + r);
		ctx.lineTo(x + w, y + h - r);
		ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
		ctx.lineTo(x + r, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - r);
		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(x, y, x + r, y);
		ctx.closePath();
	};

	// Outer frame
	if (borderRadius > 0) {
		drawRoundedRect(left - borderWidth, top - borderWidth, width + borderWidth * 2, height + borderWidth * 2, borderRadius);
		ctx.fill();
	} else {
		ctx.fillRect(left - borderWidth, top - borderWidth, width + borderWidth * 2, height + borderWidth * 2);
	}

	// Cut out inner area (image area)
	ctx.globalCompositeOperation = 'destination-out';
	if (borderRadius > 0) {
		drawRoundedRect(left, top, width, height, borderRadius);
		ctx.fill();
	} else {
		ctx.fillRect(left, top, width, height);
	}

	ctx.restore();
}

function renderDoubleFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const outerWidth = options.borderWidth || 10;
	const innerWidth = options.innerWidth || 8;
	const gap = options.gap || 6;
	const totalOffset = outerWidth + gap + innerWidth;

	ctx.save();

	// Outer frame
	ctx.fillStyle = options.borderColor || '#ffffff';
	ctx.fillRect(left - outerWidth, top - outerWidth, width + outerWidth * 2, height + outerWidth * 2);

	// Gap area (cut out)
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillStyle = '#000000';
	ctx.fillRect(left - gap - innerWidth, top - gap - innerWidth, width + (gap + innerWidth) * 2, height + (gap + innerWidth) * 2);

	// Inner frame
	ctx.globalCompositeOperation = 'source-over';
	ctx.fillStyle = options.innerColor || options.borderColor || '#e5e5e5';
	ctx.fillRect(left - innerWidth, top - innerWidth, width + innerWidth * 2, height + innerWidth * 2);

	// Cut out image area
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillRect(left, top, width, height);

	ctx.restore();
}

function renderRoundedFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const borderWidth = options.borderWidth || 10;
	const borderRadius = options.borderRadius || 20;

	ctx.save();
	ctx.fillStyle = options.borderColor || '#ffffff';

	// Helper function to draw rounded rectangle
	const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + r);
		ctx.lineTo(x + w, y + h - r);
		ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
		ctx.lineTo(x + r, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - r);
		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(x, y, x + r, y);
		ctx.closePath();
	};

	// Outer rounded frame
	drawRoundedRect(left - borderWidth, top - borderWidth, width + borderWidth * 2, height + borderWidth * 2, borderRadius + borderWidth);
	ctx.fill();

	// Cut out inner area
	ctx.globalCompositeOperation = 'destination-out';
	drawRoundedRect(left, top, width, height, borderRadius);
	ctx.fill();

	ctx.restore();
}

function renderShadowFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const borderWidth = options.borderWidth || 10;
	const shadowBlur = options.shadowBlur || 20;
	const shadowOffsetY = options.shadowOffsetY || 8;
	const shadowColor = options.shadowColor || 'rgba(0, 0, 0, 0.3)';

	ctx.save();

	// Shadow
	ctx.shadowColor = shadowColor;
	ctx.shadowBlur = shadowBlur;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = shadowOffsetY;
	ctx.fillStyle = options.borderColor || '#ffffff';
	ctx.fillRect(left - borderWidth, top - borderWidth, width + borderWidth * 2, height + borderWidth * 2);

	// Reset shadow
	ctx.shadowColor = 'transparent';
	ctx.shadowBlur = 0;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;

	// Cut out image area
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillRect(left, top, width, height);

	ctx.restore();
}

function renderGradientFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const borderWidth = options.borderWidth || 10;
	const gradientColor1 = options.gradientColor1 || options.borderColor || '#ffffff';
	const gradientColor2 = options.gradientColor2 || '#a855f7';
	const gradientDirection = options.gradientDirection || 'horizontal';

	ctx.save();

	// Create gradient
	const gradient =
		gradientDirection === 'horizontal'
			? ctx.createLinearGradient(left - borderWidth, 0, left + width + borderWidth, 0)
			: ctx.createLinearGradient(0, top - borderWidth, 0, top + height + borderWidth);

	gradient.addColorStop(0, gradientColor1);
	gradient.addColorStop(1, gradientColor2);

	ctx.fillStyle = gradient;
	ctx.fillRect(left - borderWidth, top - borderWidth, width + borderWidth * 2, height + borderWidth * 2);

	// Cut out image area
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillRect(left, top, width, height);

	ctx.restore();
}

function renderDashedFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const borderWidth = options.borderWidth || 10;
	const dashLength = options.dashLength || 10;
	const dashGap = options.dashGap || 5;

	ctx.save();
	ctx.strokeStyle = options.borderColor || '#ffffff';
	ctx.lineWidth = borderWidth;
	ctx.setLineDash([dashLength, dashGap]);

	// Draw dashed border around image
	ctx.strokeRect(left - borderWidth / 2, top - borderWidth / 2, width + borderWidth, height + borderWidth);

	ctx.restore();
}

// ============================================
// DECORATIVE FRAME RENDERERS (Canvas2D)
// ============================================

function renderPolaroidFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const borderWidth = options.borderWidth || 30;
	const bottomArea = options.bottomArea || 60;

	ctx.save();

	// White frame
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(left - borderWidth, top - borderWidth, width + borderWidth * 2, height + borderWidth + bottomArea);

	// Cut out image area
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillRect(left, top, width, height);

	ctx.restore();
}

function renderVintageFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const outerWidth = options.borderWidth || 30;
	const innerWidth = outerWidth * 0.4;
	const baseColor = options.borderColor || '#8B4513';

	ctx.save();

	// Outer frame (darker)
	ctx.fillStyle = darkenColor(baseColor, 40);
	ctx.fillRect(left - outerWidth, top - outerWidth, width + outerWidth * 2, height + outerWidth * 2);

	// Inner frame (lighter)
	ctx.fillStyle = lightenColor(baseColor, 20);
	ctx.fillRect(left - innerWidth, top - innerWidth, width + innerWidth * 2, height + innerWidth * 2);

	// Golden edge
	ctx.strokeStyle = '#D4AF37';
	ctx.lineWidth = 2;
	ctx.strokeRect(left - 4, top - 4, width + 8, height + 8);

	// Cut out image area
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillRect(left, top, width, height);

	ctx.restore();
}

function renderFilmstripFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const borderWidth = options.borderWidth || 20;
	const holeSize = 8;
	const holeSpacing = 30;

	ctx.save();

	// Black frame
	ctx.fillStyle = '#000000';
	ctx.fillRect(left - borderWidth, top - borderWidth, width + borderWidth * 2, height + borderWidth * 2);

	// Holes on left and right
	ctx.globalCompositeOperation = 'destination-out';
	for (let y = top + holeSpacing; y < top + height - holeSpacing; y += holeSpacing) {
		ctx.beginPath();
		ctx.arc(left - borderWidth / 2, y, holeSize / 2, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(left + width + borderWidth / 2, y, holeSize / 2, 0, Math.PI * 2);
		ctx.fill();
	}

	// Cut out image area
	ctx.fillRect(left, top, width, height);

	ctx.restore();
}

function renderTapeFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const tapeWidth = options.borderWidth || 30;
	const tapeColor = options.borderColor || '#f0f0f0';

	ctx.save();

	// Tape strips at corners
	ctx.fillStyle = tapeColor;
	ctx.globalAlpha = 0.8;

	// Top-left
	ctx.beginPath();
	ctx.moveTo(left - tapeWidth, top - tapeWidth);
	ctx.lineTo(left + tapeWidth, top);
	ctx.lineTo(left, top + tapeWidth);
	ctx.lineTo(left - tapeWidth, top);
	ctx.fill();

	// Top-right
	ctx.beginPath();
	ctx.moveTo(left + width + tapeWidth, top - tapeWidth);
	ctx.lineTo(left + width, top);
	ctx.lineTo(left + width + tapeWidth, top);
	ctx.lineTo(left + width, top + tapeWidth);
	ctx.fill();

	// Bottom-left
	ctx.beginPath();
	ctx.moveTo(left - tapeWidth, top + height + tapeWidth);
	ctx.lineTo(left, top + height);
	ctx.lineTo(left + tapeWidth, top + height + tapeWidth);
	ctx.lineTo(left, top + height + tapeWidth);
	ctx.fill();

	// Bottom-right
	ctx.beginPath();
	ctx.moveTo(left + width + tapeWidth, top + height + tapeWidth);
	ctx.lineTo(left + width, top + height);
	ctx.lineTo(left + width + tapeWidth, top + height);
	ctx.lineTo(left + width, top + height + tapeWidth);
	ctx.fill();

	ctx.restore();
}

function renderStampFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const borderWidth = options.borderWidth || 20;
	const dashLength = 5;
	const dashGap = 2;

	ctx.save();
	ctx.strokeStyle = options.borderColor || '#ff0000';
	ctx.lineWidth = borderWidth;
	ctx.setLineDash([dashLength, dashGap]);

	// Dashed border
	ctx.strokeRect(left - borderWidth / 2, top - borderWidth / 2, width + borderWidth, height + borderWidth);

	ctx.restore();
}

function renderTornFrame2D(
	ctx: CanvasRenderingContext2D,
	left: number,
	top: number,
	width: number,
	height: number,
	options: FrameOptions
): void {
	const borderWidth = options.borderWidth || 20;
	const tearCount = options.tearCount || 8;

	ctx.save();
	ctx.fillStyle = options.borderColor || '#f5f5dc';
	ctx.strokeStyle = '#8b7355';
	ctx.lineWidth = 2;

	// Draw torn edges (simplified)
	const edgeOffset = borderWidth;
	for (let i = 0; i < tearCount; i++) {
		const t = i / tearCount;
		const offset = Math.sin(t * Math.PI * 4) * 3;
		// Draw torn edge segments (simplified representation)
	}

	ctx.restore();
}

