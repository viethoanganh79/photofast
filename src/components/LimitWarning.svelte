<script lang="ts">
	import type { ImageLimitsCheck } from '$lib/utils/fabricLimits';
	
	export let limitsCheck: ImageLimitsCheck | null = null;
	export let onAutoScale: () => void = () => {};
	export let onDismiss: () => void = () => {};
	
	$: isVisible = limitsCheck !== null && limitsCheck.needsScaling;
	
	function handleAutoScale() {
		onAutoScale();
		onDismiss();
	}
</script>

{#if isVisible && limitsCheck}
	<div class="limit-warning-overlay" on:click|self={onDismiss}>
		<div class="limit-warning-card" on:click|stopPropagation>
			<div class="warning-header">
				<span class="warning-icon">⚠️</span>
				<h3 class="warning-title">Hình ảnh quá lớn</h3>
			</div>
			
			<div class="warning-content">
				<p class="warning-text">
					Hình ảnh của bạn có kích thước <strong>{limitsCheck.width} × {limitsCheck.height}px</strong> 
					({(limitsCheck.totalPixels / 1_000_000).toFixed(2)}M pixels).
				</p>
				
				<div class="limits-details">
					{#if limitsCheck.exceedsWebGLTexture}
						<div class="limit-item">
							<span class="limit-label">WebGL Texture Limit:</span>
							<span class="limit-value exceeds">
								{limitsCheck.width} × {limitsCheck.height}px 
								> {limitsCheck.webglMaxTextureSize}px
							</span>
						</div>
					{/if}
					
					{#if limitsCheck.exceedsFabricCache}
						<div class="limit-item">
							<span class="limit-label">Fabric.js Cache Limit:</span>
							<span class="limit-value exceeds">
								Vượt quá {limitsCheck.fabricMaxCacheSide}px 
								hoặc {(limitsCheck.fabricPerfLimitTotal / 1_000_000).toFixed(2)}M pixels
							</span>
						</div>
					{/if}
				</div>
				
				<div class="recommendation">
					<p class="recommendation-text">
						Đề xuất: Scale xuống <strong>{Math.floor(limitsCheck.width * limitsCheck.recommendedScale)} × {Math.floor(limitsCheck.height * limitsCheck.recommendedScale)}px</strong>
					</p>
				</div>
			</div>
			
			<div class="warning-actions">
				<button class="btn btn-primary" on:click={handleAutoScale}>
					Scale tự động
				</button>
				<button class="btn btn-secondary" on:click={onDismiss}>
					Giữ nguyên (có thể lỗi)
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.limit-warning-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		backdrop-filter: blur(4px);
		animation: fadeIn 0.2s ease;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	.limit-warning-card {
		background: var(--color-surface-50);
		border-radius: var(--radius-cartoon);
		padding: 24px;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease;
	}
	
	:global(.dark) .limit-warning-card {
		background: var(--color-surface-800);
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.warning-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}
	
	.warning-icon {
		font-size: 32px;
	}
	
	.warning-title {
		font-size: 20px;
		font-weight: 600;
		color: var(--color-surface-800);
		margin: 0;
	}
	
	:global(.dark) .warning-title {
		color: var(--color-surface-100);
	}
	
	.warning-content {
		margin-bottom: 20px;
	}
	
	.warning-text {
		color: var(--color-surface-700);
		margin-bottom: 16px;
		line-height: 1.6;
	}
	
	:global(.dark) .warning-text {
		color: var(--color-surface-300);
	}
	
	.limits-details {
		background: var(--color-surface-100);
		border-radius: 8px;
		padding: 12px;
		margin-bottom: 16px;
	}
	
	:global(.dark) .limits-details {
		background: var(--color-surface-700);
	}
	
	.limit-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		font-size: 14px;
	}
	
	.limit-item:last-child {
		margin-bottom: 0;
	}
	
	.limit-label {
		color: var(--color-surface-600);
		font-weight: 500;
	}
	
	:global(.dark) .limit-label {
		color: var(--color-surface-400);
	}
	
	.limit-value {
		color: var(--color-surface-700);
		font-weight: 600;
	}
	
	.limit-value.exceeds {
		color: var(--color-error-600);
	}
	
	:global(.dark) .limit-value.exceeds {
		color: var(--color-error-400);
	}
	
	.recommendation {
		background: var(--color-accent-50);
		border: 2px solid var(--color-accent-200);
		border-radius: 8px;
		padding: 12px;
	}
	
	:global(.dark) .recommendation {
		background: rgba(249, 115, 22, 0.1);
		border-color: var(--color-accent-600);
	}
	
	.recommendation-text {
		color: var(--color-accent-800);
		margin: 0;
		font-size: 14px;
		line-height: 1.5;
	}
	
	:global(.dark) .recommendation-text {
		color: var(--color-accent-300);
	}
	
	.warning-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}
	
	.btn {
		padding: 10px 20px;
		border-radius: var(--radius-cartoon);
		font-weight: 600;
		cursor: pointer;
		transition: all 150ms ease;
		border: none;
		font-size: 14px;
	}
	
	.btn-primary {
		background: var(--color-accent-500);
		color: white;
	}
	
	.btn-primary:hover {
		background: var(--color-accent-600);
		transform: scale(1.05);
	}
	
	.btn-secondary {
		background: var(--color-surface-200);
		color: var(--color-surface-700);
	}
	
	.btn-secondary:hover {
		background: var(--color-surface-300);
		transform: scale(1.05);
	}
	
	:global(.dark) .btn-secondary {
		background: var(--color-surface-700);
		color: var(--color-surface-200);
	}
	
	:global(.dark) .btn-secondary:hover {
		background: var(--color-surface-600);
	}
</style>

