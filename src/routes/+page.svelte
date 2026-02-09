<script lang="ts">
	import { onMount } from 'svelte';
	import { Canvas, FabricImage } from 'fabric';
	import CanvasStage from '$lib/../components/CanvasStage.svelte';
	import Toolbar from '$lib/../components/Toolbar.svelte';
	import CropTool from '$lib/../components/CropTool.svelte';
	import AdjustmentPanel from '$lib/../components/AdjustmentPanel.svelte';
	import PresetPanel from '$lib/../components/PresetPanel.svelte';
	import FramePanel from '$lib/../components/FramePanel.svelte';
	import SavePresetModal from '$lib/../components/SavePresetModal.svelte';
	import ExportProgress from '$lib/../components/ExportProgress.svelte';
	import CropModal from '$lib/../components/CropModal.svelte';
	import { defaultFilterState, applyFilters, applyFiltersToBoth, type FilterState } from '$lib/canvas/filters';
	import { presets as defaultPresets, type Preset } from '$lib/presets/presets';
	import { loadCustomPresets, saveCustomPreset, deleteCustomPreset, updateCustomPreset, createPresetFromState, type CustomPreset } from '$lib/presets/customPresets';
	import { importLightroomPresetFile } from '$lib/presets/lightroomImport';
	import { debounce } from '$lib/utils/debounce';
	import { renderFrame, removeAllFrameObjects, type FrameId, type FrameOptions } from '$lib/frames';
	import type { ImageLimitsCheck } from '$lib/utils/fabricLimits';
	
	// Component references
	let canvasStage: CanvasStage;
	
	// State
	let canvas: Canvas | null = null;
	let currentImage: FabricImage | null = null;
	let hasImage = false;
	let isProcessing = false;
	let activePresetId = 'original';
	let showCropModal = false;
	let showDonatePopup = false;
	let activeDonateTab: 'paypal' | 'bank' = 'bank';
	
	// Dark mode state
	let isDarkMode = false;
	
	// Frame state
	let activeFrameId: FrameId = 'none';
	let currentFrameOptions: FrameOptions | null = null;
	
	// Limits warning state (không còn cần thiết vì tự động scale)
	let limitsCheck: ImageLimitsCheck | null = null;
	
	// Custom presets state
	let customPresets: CustomPreset[] = [];
	let showSavePresetModal = false;
	let editingPresetId: string | null = null;
	let editingPresetData: { name: string; emoji: string; description: string } | null = null;
	let importStatus: { type: 'success' | 'error' | 'info'; message: string } | null = null;
	
	// Export progress state
	let exportSteps: Array<{
		name: string;
		status: 'pending' | 'in-progress' | 'success' | 'error';
		message?: string;
		preview?: string;
	}> = [];
	let showExportProgress = false;
	
	// Initialize dark mode from localStorage and system preference
	onMount(() => {
		// Check localStorage first
		const savedTheme = localStorage.getItem('photofast-theme');
		if (savedTheme) {
			isDarkMode = savedTheme === 'dark';
		} else {
			// Check system preference
			isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		applyTheme(isDarkMode);
		
		// Load custom presets
		customPresets = loadCustomPresets();
	});
	
	// Toggle dark mode
	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		applyTheme(isDarkMode);
		localStorage.setItem('photofast-theme', isDarkMode ? 'dark' : 'light');
	}
	
	// Apply theme to document
	function applyTheme(dark: boolean) {
		if (dark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		
		// Update canvas background
		if (canvasStage) {
			canvasStage.updateTheme(dark);
		}
	}
	
	// Filter state
	let filterState: FilterState = { ...defaultFilterState };
	
	// Debounced filter application (16ms ~ 60fps) for display image
	const debouncedApplyFilters = debounce((img: FabricImage, state: FilterState) => {
		applyFilters(img, state);
	}, 16);
	
	// Debounced filter application for original image (longer debounce for performance)
	const debouncedApplyFiltersToOriginal = debounce((img: FabricImage, state: FilterState) => {
		applyFilters(img, state, { applyToOriginal: true });
	}, 300);
	
	// Canvas ready handler
	function handleCanvasReady(e: CustomEvent<Canvas>) {
		canvas = e.detail;
	}
	
	// Image loaded handler
	function handleImageLoaded(e: CustomEvent<FabricImage>) {
		currentImage = e.detail;
		hasImage = true;
		isProcessing = false;
		
		// Reset filters khi load ảnh mới
		filterState = { ...defaultFilterState };
		activePresetId = 'original';
		
		// Reset frame khi load ảnh mới
		activeFrameId = 'none';
		currentFrameOptions = null;
		
		// Reset frame padding
		if (canvasStage) {
			canvasStage.setFramePadding(0);
		}
	}
	
	// Handle limits exceeded event (không còn cần thiết vì tự động scale)
	// Giữ lại để không break code, nhưng không sử dụng nữa
	function handleLimitsExceeded(e: CustomEvent<ImageLimitsCheck>) {
		// Không làm gì - tự động scale đã được xử lý trong loadImageFromUrl
		limitsCheck = null;
	}
	
	// Upload handler
	async function handleUpload(e: CustomEvent<File>) {
		const file = e.detail;
		isProcessing = true;
		limitsCheck = null; // Reset limits check
		
		try {
			// Load image (tự động scale nếu cần)
			await canvasStage.loadImageFromFile(file);
		} catch (error) {
			console.error('Failed to load image:', error);
			isProcessing = false;
		}
	}
	
	// Reset handler
	function handleReset() {
		filterState = { ...defaultFilterState };
		activePresetId = 'original';
		
		// Apply reset filters on both display and original images
		if (currentImage && canvasStage?.getOriginalImage()) {
			applyFiltersToBoth(canvasStage.getOriginalImage()!, currentImage, filterState);
		} else if (currentImage) {
			// Fallback if no original image
			applyFilters(currentImage, filterState);
		}
		
		// Reset vignette overlay
		if (canvasStage) {
			canvasStage.setVignette(0);
		}
		
		// Reset frame
		if (canvas) {
			activeFrameId = 'none';
			currentFrameOptions = null;
			removeAllFrameObjects(canvas);
		}
	}
	
	// Export progress handler
	function handleExportProgress(e: CustomEvent<{
		step: string;
		status: 'pending' | 'in-progress' | 'success' | 'error';
		message?: string;
		preview?: string;
	}>) {
		const { step, status, message, preview } = e.detail;
		
		// Show progress modal
		if (!showExportProgress) {
			showExportProgress = true;
			exportSteps = [];
		}
		
		// Find existing step or create new
		const existingIndex = exportSteps.findIndex(s => s.name === step);
		if (existingIndex >= 0) {
			// Update existing step
			exportSteps[existingIndex] = { name: step, status, message, preview };
		} else {
			// Add new step
			exportSteps = [...exportSteps, { name: step, status, message, preview }];
		}
	}
	
	// Close export progress handler
	function handleCloseExportProgress() {
		showExportProgress = false;
		exportSteps = [];
	}
	
	// Export handler
	async function handleExport(e: CustomEvent<'png' | 'jpeg'>) {
		if (!canvasStage || !hasImage) return;
		
		const format = e.detail;
		
		// Reset progress
		showExportProgress = true;
		exportSteps = [];
		
		// Pass frame info if frame is active
		const dataUrl = await canvasStage.exportImage(
			format,
			0.95,
			activeFrameId !== 'none' ? activeFrameId : undefined,
			activeFrameId !== 'none' && currentFrameOptions ? currentFrameOptions : undefined
		);
		
		if (dataUrl) {
			// Tạo link download
			const link = document.createElement('a');
			link.href = dataUrl;
			link.download = `photofast-edited.${format}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}
	
	// Filter change handler
	function handleFilterChange(e: CustomEvent<FilterState>) {
		filterState = e.detail;
		activePresetId = ''; // Clear preset when manually adjusting
		
		// Apply filters on display image (preview, immediate)
		if (currentImage) {
			debouncedApplyFilters(currentImage, filterState);
		}
		
		// Apply filters on original image (background, debounced for performance)
		if (canvasStage?.getOriginalImage()) {
			debouncedApplyFiltersToOriginal(canvasStage.getOriginalImage()!, filterState);
		}
		
		// Update vignette overlay
		if (canvasStage) {
			canvasStage.setVignette(filterState.vignette);
		}
		
		// Note: Frame does NOT need to be re-rendered when filters change
		// Frame bounds are calculated from image bounds, which don't change with filters
	}
	
	// Preset select handler
	function handlePresetSelect(e: CustomEvent<Preset>) {
		const preset = e.detail;
		filterState = { ...preset.filters };
		activePresetId = preset.id;
		
		// Apply filters on both display and original images
		if (currentImage && canvasStage?.getOriginalImage()) {
			// Use applyFiltersToBoth for sync
			applyFiltersToBoth(canvasStage.getOriginalImage()!, currentImage, filterState);
		} else if (currentImage) {
			// Fallback if no original image
			applyFilters(currentImage, filterState);
		}
		
		// Update vignette overlay
		if (canvasStage) {
			canvasStage.setVignette(filterState.vignette);
		}
		
		// Note: Frame does NOT need to be re-rendered when filters change
		// Frame bounds are calculated from image bounds, which don't change with filters
	}
	
	// ========================================
	// CUSTOM PRESET HANDLERS
	// ========================================
	
	function handleSavePreset() {
		showSavePresetModal = true;
		editingPresetId = null;
		editingPresetData = null;
	}
	
	function handlePresetSaved(e: CustomEvent<{ name: string; emoji: string; description: string; filters: FilterState }>) {
		const { name, emoji, description, filters } = e.detail;
		
		try {
			if (editingPresetId) {
				// Update existing preset
				updateCustomPreset(editingPresetId, {
					name,
					emoji,
					description,
					filters,
				});
			} else {
				// Create new preset
				const newPreset = createPresetFromState(name, emoji, description, filters);
				saveCustomPreset(newPreset);
			}
			
			// Reload custom presets
			customPresets = loadCustomPresets();
			showSavePresetModal = false;
			editingPresetId = null;
			editingPresetData = null;
		} catch (error) {
			console.error('Failed to save preset:', error);
		}
	}
	
	function handlePresetSaveCancel() {
		showSavePresetModal = false;
		editingPresetId = null;
		editingPresetData = null;
	}
	
	function handlePresetEdit(e: CustomEvent<{ presetId: string }>) {
		const preset = customPresets.find(p => p.id === e.detail.presetId);
		if (preset) {
			editingPresetId = preset.id;
			editingPresetData = {
				name: preset.name,
				emoji: preset.emoji,
				description: preset.description,
			};
			showSavePresetModal = true;
		}
	}
	
	function handlePresetDelete(e: CustomEvent<{ presetId: string }>) {
		try {
			deleteCustomPreset(e.detail.presetId);
			customPresets = loadCustomPresets();
			
			// If deleted preset was active, reset to original
			if (activePresetId === e.detail.presetId) {
				activePresetId = 'original';
				filterState = { ...defaultFilterState };
				if (currentImage) {
					applyFilters(currentImage, filterState);
				}
			}
		} catch (error) {
			console.error('Failed to delete preset:', error);
		}
	}
	
	function handlePresetExport(e: CustomEvent<{ presetId: string }>) {
		const preset = customPresets.find(p => p.id === e.detail.presetId);
		if (!preset) return;
		
		try {
			const json = JSON.stringify({
				version: '1.0',
				preset: preset,
			}, null, 2);
			
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `preset-${preset.name.replace(/\s+/g, '-')}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to export preset:', error);
		}
	}

	async function handlePresetImport(e: CustomEvent<{ files: FileList }>) {
		const files = Array.from(e.detail.files || []);
		if (files.length === 0) return;

		importStatus = { type: 'info', message: `Äang import ${files.length} file...` };

		let success = 0;
		let failed = 0;
		const existingNames = new Set<string>([
			...defaultPresets.map(p => p.name),
			...customPresets.map(p => p.name),
		]);

		for (const file of files) {
			try {
				const preset = await importLightroomPresetFile(file, {
					defaultEmoji: '📥',
					existingNames,
				});
				saveCustomPreset(preset);
				success += 1;
			} catch (error) {
				failed += 1;
				console.warn('Import failed:', file.name, error);
			}
		}

		customPresets = loadCustomPresets();

		if (success > 0 && failed === 0) {
			importStatus = { type: 'success', message: `ÄÃ£ import ${success} preset.` };
		} else if (success > 0) {
			importStatus = { type: 'info', message: `Import ${success} preset, ${failed} lá»—i.` };
		} else {
			importStatus = { type: 'error', message: `Import tháº¥t báº¡i (${failed} file).` };
		}
	}
	
	// ========================================
	// CROP HANDLERS
	// ========================================
	
	function handleCropStart(e: CustomEvent<{ aspectRatio: number | null }>) {
		if (!canvasStage || !hasImage) return;
		showCropModal = true;
	}
	
	async function handleCropApply(e: CustomEvent<{ dataUrl: string }>) {
		if (!canvasStage) return;
		// Load cropped image
		await canvasStage.loadImageFromUrl(e.detail.dataUrl);
		showCropModal = false;
	}
	
	function handleCropCancel() {
		showCropModal = false;
	}
	
	// ========================================
	// FRAME HANDLERS
	// ========================================
	
	// Calculate required padding for frame
	function calculateFramePadding(options: FrameOptions | null): number {
		if (!options) return 0;
		
		// Base frame width
		let padding = options.borderWidth || 0;
		
		// For double frame: add inner width + gap
		if (options.innerWidth && options.gap) {
			padding += options.innerWidth + options.gap;
		}
		
		// Add shadow offset if exists
		if (options.shadowOffsetY) {
			padding += Math.abs(options.shadowOffsetY) || 0;
		}
		
		// Add shadow blur radius
		if (options.shadowBlur) {
			padding += options.shadowBlur / 2;
		}
		
		// Add some extra margin for decorative frames
		if (activeFrameId === 'polaroid' || activeFrameId === 'vintage' || activeFrameId === 'filmstrip') {
			padding += 10;
		}
		
		// Add safety margin to prevent clipping
		padding += 8;
		
		return padding;
	}
	
	function handleFrameSelect(e: CustomEvent<{ frameId: FrameId; options: FrameOptions }>) {
		if (!canvas || !currentImage) return;
		
		const { frameId, options } = e.detail;
		activeFrameId = frameId;
		currentFrameOptions = options;
		
		// Calculate and set frame padding
		const padding = calculateFramePadding(options);
		if (canvasStage) {
			canvasStage.setFramePadding(padding);
		}
		
		renderFrame(canvas, currentImage, frameId, options);
	}
	
	function handleFrameOptionsChange(e: CustomEvent<{ frameId: FrameId; options: FrameOptions }>) {
		if (!canvas || !currentImage) return;
		
		const { frameId, options } = e.detail;
		currentFrameOptions = options;
		
		// Recalculate padding when options change
		const padding = calculateFramePadding(options);
		if (canvasStage) {
			canvasStage.setFramePadding(padding);
		}
		
		renderFrame(canvas, currentImage, frameId, options);
	}
	
	function handleFrameRemove() {
		if (!canvas) return;
		
		activeFrameId = 'none';
		currentFrameOptions = null;
		
		// Reset frame padding
		if (canvasStage) {
			canvasStage.setFramePadding(0);
		}
		
		removeAllFrameObjects(canvas);
	}
</script>

<main class="min-h-screen p-4 md:p-8">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<header class="header-section">
			<div class="header-content">
				<h1 class="text-4xl md:text-5xl font-extrabold">
					<span class="text-gradient">🎨 PhotoFast</span>
				</h1>
				<p class="header-subtitle">
					Chỉnh màu ảnh siêu nhanh!
				</p>
			</div>
			
			<!-- Dark Mode Toggle -->
			<button 
				class="theme-toggle"
				on:click={toggleDarkMode}
				title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
			>
				<span class="theme-icon">
					{#if isDarkMode}
						☀️
					{:else}
						🌙
					{/if}
				</span>
			</button>
		</header>

		<!-- Main Content: Side by Side Layout -->
		<div class="main-layout">
			<!-- Canvas Area (Left) -->
			<div class="canvas-area">
				<div class="card-cartoon canvas-card">
					<CanvasStage 
						bind:this={canvasStage}
						on:ready={handleCanvasReady}
						on:imageLoaded={handleImageLoaded}
						on:limitsExceeded={handleLimitsExceeded}
						on:exportProgress={handleExportProgress}
					/>
				</div>
			</div>

			<!-- Sidebar Controls (Right) -->
			<aside class="sidebar">
				<!-- Upload Button -->
				<div class="card-cartoon">
					<Toolbar 
						{hasImage}
						{isProcessing}
						on:upload={handleUpload}
						on:reset={handleReset}
						on:export={handleExport}
					/>
				</div>

				<!-- Crop Tool -->
				{#if hasImage}
					<div class="card-cartoon">
						<CropTool 
							isActive={false}
							on:start={handleCropStart}
						/>
					</div>
				{/if}

				<!-- Adjustment Sliders -->
				<div class="card-cartoon controls-panel">
					<AdjustmentPanel 
						filters={filterState}
						on:change={handleFilterChange}
					/>
				</div>
				
				<!-- Frame Panel (Tạm thời ẩn) -->
				<!--
				<div class="card-cartoon controls-panel">
					<FramePanel 
						{hasImage}
						{activeFrameId}
						on:select={handleFrameSelect}
						on:optionsChange={handleFrameOptionsChange}
						on:remove={handleFrameRemove}
					/>
				</div>
				-->
			</aside>
		</div>

		<!-- Presets Bar (Bottom, Horizontal) -->
		<div class="card-cartoon preset-bar">
			<PresetPanel 
				{activePresetId}
				{customPresets}
				{importStatus}
				on:select={handlePresetSelect}
				on:savePreset={handleSavePreset}
				on:editPreset={handlePresetEdit}
				on:deletePreset={handlePresetDelete}
				on:exportPreset={handlePresetExport}
				on:importPreset={handlePresetImport}
			/>
		</div>

		<!-- Footer -->
		<footer class="footer-section">
			<button 
				class="donate-btn"
				on:click={() => showDonatePopup = true}
			>
				<span class="donate-icon">☕</span>
				<span class="donate-text">Ủng hộ tác giả</span>
				<span class="donate-heart">💕</span>
			</button>
			<p class="footer-credit">
				Made with 💜 using Svelte + fabric.js
			</p>
			<p class="footer-contact">
				<span class="contact-label">📧 Liên hệ:</span>
				<a 
					href="mailto:viethoanganh79@gmail.com" 
					class="contact-email"
					title="Gửi email cho tác giả"
				>
					viethoanganh79@gmail.com
				</a>
			</p>
		</footer>
	</div>
	</main>
	
	<!-- Save Preset Modal -->
	<SavePresetModal
		isOpen={showSavePresetModal}
		currentFilters={filterState}
		editingPreset={editingPresetData}
		on:save={handlePresetSaved}
		on:cancel={handlePresetSaveCancel}
	/>

<!-- Donate Popup Modal -->
{#if showDonatePopup}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
	<div 
		class="popup-overlay"
		on:click={() => {
			showDonatePopup = false;
			activeDonateTab = 'bank'; // Reset to default tab
		}}
		role="presentation"
	>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
		<div 
			class="popup-content"
			on:click|stopPropagation
			role="dialog"
			aria-modal="true"
			aria-labelledby="donate-title"
		>
			<!-- Close button -->
			<button 
				class="popup-close"
				on:click={() => {
					showDonatePopup = false;
					activeDonateTab = 'paypal'; // Reset to default tab
				}}
				aria-label="Đóng"
			>
				✕
			</button>
			
			<!-- Header -->
			<div class="popup-header">
				<span class="popup-emoji">☕💖</span>
				<h2 id="donate-title" class="popup-title">Ủng hộ tác giả</h2>
				<p class="popup-subtitle">Cảm ơn bạn đã sử dụng PhotoFast!</p>
			</div>
			
			<!-- Payment Methods Tabs -->
			<div class="payment-tabs">
				<!-- Tab Navigation -->
				<div class="tab-nav">
					<button 
						class="tab-button"
						class:active={activeDonateTab === 'bank'}
						on:click={() => activeDonateTab = 'bank'}
					>
						<span class="tab-icon">🏦</span>
						<span class="tab-label">Chuyển khoản</span>
					</button>
					<button 
						class="tab-button"
						class:active={activeDonateTab === 'paypal'}
						on:click={() => activeDonateTab = 'paypal'}
					>
						<span class="tab-icon">💳</span>
						<span class="tab-label">PayPal</span>
					</button>
				</div>

				<!-- Tab Content -->
				<div class="tab-content">
					{#if activeDonateTab === 'bank'}
						<!-- Bank Transfer Tab -->
						<div class="payment-section">
							<div class="payment-header">
								<span class="payment-icon">🏦</span>
								<h3 class="payment-title">Chuyển khoản ngân hàng</h3>
							</div>
							
							<!-- QR Code -->
							<div class="qr-section">
								<div class="qr-frame">
									<img src="/qr-bank.jpg" alt="QR Code chuyển khoản" class="qr-image" />
								</div>
							</div>
							
							<!-- Bank Info -->
							<div class="bank-info">
								<div class="bank-row">
									<span class="bank-label">🏦 Ngân hàng:</span>
									<span class="bank-value">Techcombank</span>
								</div>
								<div class="bank-row">
									<span class="bank-label">👤 Chủ TK:</span>
									<span class="bank-value">TRAN ANH HOANG VIET</span>
								</div>
								<div class="bank-row">
									<span class="bank-label">💳 Số TK:</span>
									<button 
										class="bank-value copyable" 
										on:click={() => navigator.clipboard.writeText('666688886124')}
										title="Click để copy"
									>
										666688886124
										<span class="copy-hint">📋</span>
									</button>
								</div>
								<div class="bank-row">
									<span class="bank-label">💬 Nội dung:</span>
									<span class="bank-value">Ung ho PhotoFast</span>
								</div>
							</div>
						</div>
					{:else}
						<!-- PayPal Tab -->
						<div class="payment-section">
							<div class="payment-header">
								<span class="payment-icon">💳</span>
								<h3 class="payment-title">PayPal</h3>
							</div>
							<div class="payment-content">
								<p class="payment-description">Ủng hộ qua PayPal (quốc tế)</p>
								<a 
									href="https://paypal.me/viethoanganh79" 
									target="_blank" 
									rel="noopener noreferrer"
									class="paypal-button"
								>
									<span class="paypal-icon">💳</span>
									<span>Donate với PayPal</span>
								</a>
							</div>
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Thank you message -->
			<p class="popup-thanks">
				Mỗi đóng góp đều giúp mình có thêm động lực phát triển! 🚀
			</p>
		</div>
	</div>
{/if}

<!-- Export Progress Modal -->
<ExportProgress 
	bind:isVisible={showExportProgress}
	bind:steps={exportSteps}
	on:close={handleCloseExportProgress}
/>

<!-- Crop Modal -->
{#if showCropModal && canvasStage}
	<CropModal 
		isOpen={showCropModal}
		imageDataUrl={canvasStage.getOriginalImageDataUrl()}
		on:close={handleCropCancel}
		on:apply={handleCropApply}
	/>
{/if}

<style>
	/* Header Section */
	.header-section {
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		margin-bottom: 1.5rem;
		padding: 0 1rem;
	}
	
	.header-content {
		text-align: center;
	}
	
	.header-subtitle {
		color: var(--color-text-muted);
		margin-top: 0.5rem;
		font-size: 1.125rem;
	}
	
	.theme-toggle {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
	}
	
	.main-layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}
	
	@media (min-width: 1024px) {
		.main-layout {
			grid-template-columns: 1fr 380px;
		}
	}
	
	@media (min-width: 1280px) {
		.main-layout {
			grid-template-columns: 1fr 420px;
		}
	}
	
	.canvas-area {
		min-height: 400px;
	}
	
	@media (min-width: 768px) {
		.canvas-area {
			min-height: 500px;
		}
	}
	
	@media (min-width: 1024px) {
		.canvas-area {
			min-height: 600px;
		}
	}
	
	.canvas-card {
		height: 100%;
		min-height: inherit;
		padding: 8px; /* Add padding to prevent frame clipping */
		overflow: hidden;
		position: relative;
	}
	
	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	/* Controls panel with scroll */
	.controls-panel {
		max-height: 500px;
		overflow-y: auto;
		overflow-x: hidden;
		/* Subtle scrollbar that blends with card */
		scrollbar-width: thin;
		scrollbar-color: transparent transparent;
	}
	
	.controls-panel:hover {
		scrollbar-color: rgba(168, 85, 247, 0.3) transparent;
	}
	
	/* Dark mode scrollbar */
	:global(.dark) .controls-panel:hover {
		scrollbar-color: rgba(139, 92, 246, 0.5) transparent;
	}
	
	@media (min-width: 1024px) {
		.controls-panel {
			max-height: calc(100vh - 400px);
			min-height: 300px;
		}
	}
	
	/* Webkit scrollbar - invisible by default, appears on hover */
	.controls-panel::-webkit-scrollbar {
		width: 6px;
	}
	
	.controls-panel::-webkit-scrollbar-track {
		background: transparent;
		margin: 8px 0;
	}
	
	.controls-panel::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 100px;
		transition: background 0.3s ease;
	}
	
	.controls-panel:hover::-webkit-scrollbar-thumb {
		background: rgba(168, 85, 247, 0.25);
	}
	
	/* Dark mode webkit scrollbar */
	:global(.dark) .controls-panel:hover::-webkit-scrollbar-thumb {
		background: rgba(139, 92, 246, 0.6);
	}
	
	:global(.dark) .controls-panel:hover::-webkit-scrollbar-thumb:hover {
		background: rgba(139, 92, 246, 0.8);
	}
	
	.controls-panel:hover::-webkit-scrollbar-thumb:hover {
		background: rgba(168, 85, 247, 0.5);
	}
	
	.controls-panel:hover::-webkit-scrollbar-thumb:active {
		background: rgba(168, 85, 247, 0.7);
	}
	
	/* Preset bar at bottom */
	.preset-bar {
		margin-top: 1.5rem;
	}
	
	/* Footer */
	.footer-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-top: 2rem;
		padding: 1.5rem;
	}
	
	.footer-credit {
		color: var(--color-surface-400);
		font-size: 0.875rem;
	}
	
	.footer-contact {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-surface-500);
		font-size: 0.875rem;
		margin: 0;
	}
	
	:global(.dark) .footer-contact {
		color: var(--color-surface-400);
	}
	
	.contact-label {
		font-size: 0.875rem;
	}
	
	.contact-email {
		color: var(--color-accent-600);
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;
		border-bottom: 1px solid transparent;
	}
	
	.contact-email:hover {
		color: var(--color-accent-700);
		border-bottom-color: var(--color-accent-600);
	}
	
	:global(.dark) .contact-email {
		color: var(--color-accent-400);
	}
	
	:global(.dark) .contact-email:hover {
		color: var(--color-accent-300);
		border-bottom-color: var(--color-accent-400);
	}
	
	/* Donate button - playful style */
	.donate-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
		color: #78350f;
		font-weight: 700;
		font-size: 1rem;
		border-radius: 100px;
		text-decoration: none;
		box-shadow: 
			0 4px 15px rgba(251, 191, 36, 0.4),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
	}
	
	.donate-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
		pointer-events: none;
	}
	
	.donate-btn:hover {
		transform: translateY(-3px) scale(1.02);
		box-shadow: 
			0 8px 25px rgba(251, 191, 36, 0.5),
			0 4px 8px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}
	
	.donate-btn:active {
		transform: translateY(-1px) scale(0.98);
	}
	
	.donate-icon {
		font-size: 1.25rem;
		animation: wiggle 2s ease-in-out infinite;
	}
	
	.donate-text {
		position: relative;
		z-index: 1;
	}
	
	.donate-heart {
		font-size: 0.875rem;
		animation: heartbeat 1.5s ease-in-out infinite;
	}
	
	@keyframes wiggle {
		0%, 100% { transform: rotate(-5deg); }
		50% { transform: rotate(5deg); }
	}
	
	@keyframes heartbeat {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.2); }
	}
	
	/* ========================================
	   DONATE POPUP MODAL
	   ======================================== */
	.popup-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.2s ease;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	.popup-content {
		background: linear-gradient(180deg, var(--color-card) 0%, var(--color-surface-50) 100%);
		border-radius: 24px;
		padding: 2rem;
		max-width: 380px;
		width: 100%;
		box-shadow: 
			0 25px 50px -12px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(251, 191, 36, 0.2);
		position: relative;
		animation: popIn 0.3s ease;
		border: 1px solid var(--color-border);
	}
	
	:global(.dark) .popup-content {
		background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
	}
	
	@keyframes popIn {
		from { 
			opacity: 0; 
			transform: scale(0.9) translateY(20px); 
		}
		to { 
			opacity: 1; 
			transform: scale(1) translateY(0); 
		}
	}
	
	.popup-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 2rem;
		height: 2rem;
		border: none;
		background: var(--color-surface-100);
		border-radius: 50%;
		cursor: pointer;
		font-size: 1rem;
		color: var(--color-surface-500);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}
	
	.popup-close:hover {
		background: var(--color-surface-200);
		color: var(--color-surface-700);
		transform: rotate(90deg);
	}
	
	.popup-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}
	
	.popup-emoji {
		font-size: 2.5rem;
		display: block;
		margin-bottom: 0.5rem;
	}
	
	.popup-title {
		font-size: 1.5rem;
		font-weight: 800;
		color: #78350f;
		margin: 0 0 0.25rem 0;
	}
	
	:global(.dark) .popup-title {
		color: #fbbf24;
	}
	
	.popup-subtitle {
		font-size: 0.9rem;
		color: var(--color-surface-500);
		margin: 0;
	}
	
	/* QR Code Section */
	.qr-section {
		display: flex;
		justify-content: center;
		margin-bottom: 1.5rem;
	}
	
	.qr-frame {
		background: white;
		padding: 1rem;
		border-radius: 16px;
		box-shadow: 
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 0 0 3px #fbbf24;
	}
	
	:global(.dark) .qr-frame {
		background: #f8fafc;
	}
	
	.qr-image {
		width: 180px;
		height: 180px;
		border-radius: 8px;
	}
	
	/* Bank Info */
	.bank-info {
		background: rgba(251, 191, 36, 0.1);
		border-radius: 16px;
		padding: 1rem;
		margin-bottom: 1rem;
	}
	
	.bank-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px dashed rgba(251, 191, 36, 0.3);
	}
	
	.bank-row:last-child {
		border-bottom: none;
	}
	
	.bank-label {
		font-size: 0.875rem;
		color: var(--color-surface-600);
	}
	
	.bank-value {
		font-weight: 700;
		color: #78350f;
		font-size: 0.9rem;
	}
	
	:global(.dark) .bank-value {
		color: #fbbf24;
	}
	
	.bank-value.copyable {
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: rgba(251, 191, 36, 0.2);
		border-radius: 8px;
		transition: all 0.2s ease;
	}
	
	.bank-value.copyable:hover {
		background: rgba(251, 191, 36, 0.4);
	}
	
	.copy-hint {
		font-size: 0.75rem;
		opacity: 0.7;
	}
	
	.popup-thanks {
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-surface-600);
		margin: 0;
		font-style: italic;
	}
	
	/* Payment Tabs */
	.payment-tabs {
		margin-bottom: 1rem;
	}
	
	.tab-nav {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		border-bottom: 2px solid var(--color-surface-200);
		padding-bottom: 0.5rem;
	}
	
	:global(.dark) .tab-nav {
		border-bottom-color: var(--color-surface-700);
	}
	
	.tab-button {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-surface-100);
		border: 2px solid transparent;
		border-radius: var(--radius-cartoon);
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--color-surface-600);
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
	}
	
	:global(.dark) .tab-button {
		background: var(--color-surface-700);
		color: var(--color-surface-400);
	}
	
	.tab-button:hover {
		background: var(--color-surface-200);
		transform: translateY(-2px);
	}
	
	:global(.dark) .tab-button:hover {
		background: var(--color-surface-600);
	}
	
	.tab-button.active {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		color: #78350f;
		border-color: #fbbf24;
		box-shadow: 0 4px 6px -1px rgba(251, 191, 36, 0.3);
	}
	
	:global(.dark) .tab-button.active {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: #fef3c7;
	}
	
	.tab-button:active {
		transform: translateY(0);
	}
	
	.tab-icon {
		font-size: 1.125rem;
	}
	
	.tab-label {
		font-size: 0.9375rem;
	}
	
	.tab-content {
		min-height: 200px;
	}
	
	.payment-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.payment-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	
	.payment-icon {
		font-size: 1.5rem;
	}
	
	.payment-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-surface-800);
		margin: 0;
	}
	
	:global(.dark) .payment-title {
		color: var(--color-surface-100);
	}
	
	.payment-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.payment-description {
		font-size: 0.875rem;
		color: var(--color-surface-600);
		margin: 0;
	}
	
	:global(.dark) .payment-description {
		color: var(--color-surface-400);
	}
	
	.paypal-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #0070ba 0%, #009cde 100%);
		color: white;
		border: none;
		border-radius: var(--radius-cartoon);
		font-weight: 600;
		font-size: 0.9375rem;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 6px -1px rgba(0, 112, 186, 0.3);
	}
	
	.paypal-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px -2px rgba(0, 112, 186, 0.4);
		background: linear-gradient(135deg, #009cde 0%, #0070ba 100%);
	}
	
	.paypal-button:active {
		transform: translateY(0);
	}
	
	.paypal-icon {
		font-size: 1.25rem;
	}
	
</style>
