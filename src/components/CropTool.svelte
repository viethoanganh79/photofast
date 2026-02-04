<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	// Props
	export let isActive: boolean = false;
	
	const dispatch = createEventDispatcher<{
		start: { aspectRatio: number | null };
	}>();
	
	function handleStartCrop() {
		dispatch('start', { aspectRatio: null });
	}
</script>

<div class="crop-tool">
	<!-- Start crop button -->
	<button class="btn-accent crop-start-btn" on:click={handleStartCrop}>
		<span>✂️</span>
		<span>Crop ảnh</span>
	</button>
</div>

<style>
	.crop-tool {
		width: 100%;
	}
	
	.crop-start-btn {
		width: 100%;
	}
</style>

