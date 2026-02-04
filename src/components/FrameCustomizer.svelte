<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import SliderControl from './SliderControl.svelte';
	import type { FrameConfig, FrameOptions } from '$lib/frames';
	
	type GradientDir = 'horizontal' | 'vertical' | 'diagonal';
	
	// Props
	export let frameConfig: FrameConfig;
	export let options: FrameOptions;
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		change: FrameOptions;
	}>();
	
	// Gradient direction options
	const gradientDirections: Array<{ value: GradientDir; label: string; title: string }> = [
		{ value: 'horizontal', label: '↔️', title: 'Ngang' },
		{ value: 'vertical', label: '↕️', title: 'Dọc' },
		{ value: 'diagonal', label: '↗️', title: 'Chéo' },
	];
	
	// Reactive computed values to avoid || in template
	$: borderColorValue = options.borderColor || '#ffffff';
	$: innerColorValue = options.innerColor || '#e5e5e5';
	$: gradientColor2Value = options.gradientColor2 || '#a855f7';
	$: gapValue = options.gap || 6;
	$: shadowBlurValue = options.shadowBlur || 20;
	$: shadowOffsetYValue = options.shadowOffsetY || 8;
	
	// Handle option change
	function handleChange(key: string, value: unknown) {
		const newOptions = { ...options, [key]: value };
		dispatch('change', newOptions);
	}
	
	function handleSliderChange(key: string, e: CustomEvent<number>) {
		handleChange(key, e.detail);
	}
	
	function handleColorChange(key: string, e: Event) {
		const target = e.target as HTMLInputElement;
		handleChange(key, target.value);
	}
	
	function handleGradientDirection(direction: GradientDir) {
		handleChange('gradientDirection', direction);
	}
</script>

<div class="frame-customizer">
	<h4 class="customizer-title">
		<span>⚙️</span>
		<span>Tùy chỉnh</span>
	</h4>
	
	<div class="customizer-controls">
		<!-- Border Color -->
		{#if frameConfig.customizable.color}
			<div class="control-row">
				<label class="control-label">
					<span class="label-icon">🎨</span>
					<span>Màu viền</span>
				</label>
				<div class="color-picker-wrapper">
					<input 
						type="color" 
						class="color-input"
						value={borderColorValue}
						on:input={(e) => handleColorChange('borderColor', e)}
					/>
					<span class="color-value">{borderColorValue}</span>
				</div>
			</div>
		{/if}
		
		<!-- Border Width -->
		{#if frameConfig.customizable.width}
			<SliderControl
				label="Độ dày"
				icon="📏"
				color="primary"
				min={4}
				max={60}
				unit="px"
				value={options.borderWidth}
				on:change={(e) => handleSliderChange('borderWidth', e)}
			/>
		{/if}
		
		<!-- Border Radius -->
		{#if frameConfig.customizable.radius}
			<SliderControl
				label="Bo góc"
				icon="⬜"
				color="secondary"
				min={0}
				max={100}
				unit="px"
				value={options.borderRadius}
				on:change={(e) => handleSliderChange('borderRadius', e)}
			/>
		{/if}
		
		<!-- Gap (for double frame) -->
		{#if frameConfig.customizable.gap}
			<SliderControl
				label="Khoảng cách"
				icon="↔️"
				color="accent"
				min={2}
				max={20}
				unit="px"
				value={gapValue}
				on:change={(e) => handleSliderChange('gap', e)}
			/>
		{/if}
		
		<!-- Inner Color (for double frame) -->
		{#if frameConfig.customizable.innerColor}
			<div class="control-row">
				<label class="control-label">
					<span class="label-icon">🎨</span>
					<span>Màu trong</span>
				</label>
				<div class="color-picker-wrapper">
					<input 
						type="color" 
						class="color-input"
						value={innerColorValue}
						on:input={(e) => handleColorChange('innerColor', e)}
					/>
					<span class="color-value">{innerColorValue}</span>
				</div>
			</div>
		{/if}
		
		<!-- Gradient Color 2 -->
		{#if frameConfig.customizable.gradient}
			<div class="control-row">
				<label class="control-label">
					<span class="label-icon">🌈</span>
					<span>Màu 2</span>
				</label>
				<div class="color-picker-wrapper">
					<input 
						type="color" 
						class="color-input"
						value={gradientColor2Value}
						on:input={(e) => handleColorChange('gradientColor2', e)}
					/>
					<span class="color-value">{gradientColor2Value}</span>
				</div>
			</div>
			
			<!-- Gradient Direction -->
			<div class="control-row">
				<label class="control-label">
					<span class="label-icon">↗️</span>
					<span>Hướng</span>
				</label>
				<div class="direction-buttons">
					{#each gradientDirections as dir}
						<button
							class="direction-btn"
							class:active={options.gradientDirection === dir.value}
							on:click={() => handleGradientDirection(dir.value)}
							title={dir.title}
						>
							{dir.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Shadow Options -->
		{#if frameConfig.customizable.shadow}
			<SliderControl
				label="Độ mờ shadow"
				icon="💨"
				color="primary"
				min={0}
				max={50}
				unit="px"
				value={shadowBlurValue}
				on:change={(e) => handleSliderChange('shadowBlur', e)}
			/>
			
			<SliderControl
				label="Offset Y"
				icon="↕️"
				color="secondary"
				min={0}
				max={30}
				unit="px"
				value={shadowOffsetYValue}
				on:change={(e) => handleSliderChange('shadowOffsetY', e)}
			/>
		{/if}
	</div>
</div>

<style>
	.frame-customizer {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.customizer-title {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-surface-700);
		margin: 0;
	}
	
	:global(.dark) .customizer-title {
		color: var(--color-surface-200);
	}
	
	.customizer-controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.control-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}
	
	.control-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-surface-600);
		flex-shrink: 0;
	}
	
	:global(.dark) .control-label {
		color: var(--color-surface-300);
	}
	
	.label-icon {
		font-size: 0.875rem;
	}
	
	/* Color Picker */
	.color-picker-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.color-input {
		width: 36px;
		height: 36px;
		border: 2px solid var(--color-surface-200);
		border-radius: 10px;
		padding: 2px;
		cursor: pointer;
		background: var(--color-surface-50);
		transition: all 0.2s ease;
	}
	
	:global(.dark) .color-input {
		border-color: var(--color-surface-600);
		background: var(--color-surface-800);
	}
	
	.color-input:hover {
		transform: scale(1.05);
		border-color: var(--color-primary-400);
	}
	
	.color-input::-webkit-color-swatch-wrapper {
		padding: 0;
	}
	
	.color-input::-webkit-color-swatch {
		border: none;
		border-radius: 6px;
	}
	
	.color-value {
		font-size: 0.75rem;
		font-family: monospace;
		color: var(--color-surface-500);
		background: var(--color-surface-100);
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
	}
	
	:global(.dark) .color-value {
		background: var(--color-surface-700);
		color: var(--color-surface-300);
	}
	
	/* Direction Buttons */
	.direction-buttons {
		display: flex;
		gap: 0.375rem;
	}
	
	.direction-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface-100);
		border: 2px solid var(--color-surface-200);
		border-radius: 10px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	:global(.dark) .direction-btn {
		background: var(--color-surface-800);
		border-color: var(--color-surface-600);
	}
	
	.direction-btn:hover {
		transform: scale(1.05);
		border-color: var(--color-primary-400);
	}
	
	.direction-btn.active {
		background: var(--color-primary-100);
		border-color: var(--color-primary-500);
	}
	
	:global(.dark) .direction-btn.active {
		background: var(--color-primary-900);
		border-color: var(--color-primary-400);
	}
</style>

