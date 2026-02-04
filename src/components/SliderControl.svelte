<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	// Props
	export let label: string;
	export let icon: string;
	export let value: number = 0;
	export let min: number = -100;
	export let max: number = 100;
	export let step: number = 1;
	export let unit: string = '';
	export let color: 'primary' | 'secondary' | 'accent' | 'pink' = 'primary';
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		change: number;
	}>();
	
	// Color mappings - using fixed colors that work in both light and dark mode
	const colorClasses = {
		primary: {
			bg: '#dcfce7',        // Light green background
			text: '#166534',      // Dark green text
			track: '#bbf7d0',
			thumb: '#22c55e',
			thumbHover: '#16a34a',
		},
		secondary: {
			bg: '#f3e8ff',        // Light purple background
			text: '#7e22ce',      // Dark purple text
			track: '#e9d5ff',
			thumb: '#a855f7',
			thumbHover: '#9333ea',
		},
		accent: {
			bg: '#ffedd5',        // Light orange background
			text: '#c2410c',      // Dark orange text
			track: '#fed7aa',
			thumb: '#f97316',
			thumbHover: '#ea580c',
		},
		pink: {
			bg: '#fce7f3',        // Light pink background
			text: '#be185d',      // Dark pink text
			track: '#fbcfe8',
			thumb: '#ec4899',
			thumbHover: '#db2777',
		},
	};
	
	$: colors = colorClasses[color];
	$: percentage = ((value - min) / (max - min)) * 100;
	$: displayValue = value > 0 ? `+${value}` : `${value}`;
	
	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const newValue = parseFloat(target.value);
		dispatch('change', newValue);
	}
	
	function handleDoubleClick() {
		dispatch('change', 0);
	}
</script>

<div class="slider-control">
	<div class="slider-label">
		<span class="slider-icon">{icon}</span>
		<span class="slider-text">{label}</span>
		<span 
			class="slider-value"
			style="background: {colors.bg}; color: {colors.text};"
		>
			{displayValue}{unit}
		</span>
	</div>
	
	<div class="slider-track-container">
		<input
			type="range"
			{min}
			{max}
			{step}
			{value}
			on:input={handleInput}
			on:dblclick={handleDoubleClick}
			class="slider-input"
			aria-label={label}
			style="
				--track-color: {colors.track};
				--thumb-color: {colors.thumb};
				--thumb-hover: {colors.thumbHover};
				--fill-percent: {percentage}%;
			"
		/>
		
		<!-- Center marker -->
		{#if min < 0 && max > 0}
			<div class="center-marker"></div>
		{/if}
	</div>
</div>

<style>
	.slider-control {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.slider-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-surface-700);
	}
	
	:global(.dark) .slider-label {
		color: var(--color-surface-200);
	}
	
	.slider-icon {
		font-size: 1rem;
	}
	
	.slider-text {
		flex: 1;
	}
	
	.slider-value {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
		min-width: 3rem;
		text-align: center;
	}
	
	.slider-track-container {
		position: relative;
		height: 1.5rem;
		display: flex;
		align-items: center;
	}
	
	.slider-input {
		width: 100%;
		height: 0.75rem;
		appearance: none;
		background: transparent;
		cursor: pointer;
		border-radius: 9999px;
	}
	
	/* Track styles */
	.slider-input::-webkit-slider-runnable-track {
		width: 100%;
		height: 0.75rem;
		border-radius: 9999px;
		background: linear-gradient(
			to right,
			var(--thumb-color) 0%,
			var(--thumb-color) var(--fill-percent),
			var(--track-color) var(--fill-percent),
			var(--track-color) 100%
		);
		transition: background 150ms ease;
	}
	
	.slider-input::-moz-range-track {
		width: 100%;
		height: 0.75rem;
		border-radius: 9999px;
		background: var(--track-color);
	}
	
	.slider-input::-moz-range-progress {
		height: 0.75rem;
		border-radius: 9999px;
		background: var(--thumb-color);
	}
	
	/* Thumb styles */
	.slider-input::-webkit-slider-thumb {
		appearance: none;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		background: var(--thumb-color);
		border: 3px solid white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		cursor: grab;
		transition: all 150ms ease;
		margin-top: -0.375rem;
	}
	
	.slider-input::-webkit-slider-thumb:hover {
		background: var(--thumb-hover);
		transform: scale(1.1);
	}
	
	.slider-input::-webkit-slider-thumb:active {
		cursor: grabbing;
		transform: scale(0.95);
	}
	
	.slider-input::-moz-range-thumb {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		background: var(--thumb-color);
		border: 3px solid white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		cursor: grab;
		transition: all 150ms ease;
	}
	
	.slider-input::-moz-range-thumb:hover {
		background: var(--thumb-hover);
		transform: scale(1.1);
	}
	
	/* Center marker for bipolar sliders */
	.center-marker {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 2px;
		height: 1rem;
		background: var(--color-surface-300);
		border-radius: 1px;
		pointer-events: none;
	}
	
	/* Focus styles */
	.slider-input:focus {
		outline: none;
	}
	
	.slider-input:focus::-webkit-slider-thumb {
		box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2), 0 2px 8px rgba(0, 0, 0, 0.15);
	}
</style>

