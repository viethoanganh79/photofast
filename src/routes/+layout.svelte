<script lang="ts">
	import '../app.css';
	
	// SEO constants - Thay đổi URL khi deploy
	const siteName = 'PhotoFast';
	const siteTitle = 'PhotoFast - Chỉnh màu ảnh online miễn phí';
	const siteDescription = 'Công cụ chỉnh sửa ảnh online miễn phí, nhanh chóng. Điều chỉnh độ sáng, tương phản, màu sắc, crop ảnh và nhiều hơn nữa. Hoàn toàn miễn phí, không cần đăng ký!';
	const siteKeywords = 'chỉnh sửa ảnh, chỉnh màu ảnh, photo editor, image editor, edit photo online, crop ảnh, lightroom online, chỉnh ảnh miễn phí, photofast, chỉnh sửa ảnh online, phần mềm chỉnh ảnh, app chỉnh ảnh';
	const siteUrl = 'https://photofast.app'; // ⚠️ Thay đổi thành URL thật khi deploy
	const siteImage = '/og-image.svg'; // OG Image
	const siteAuthor = 'Tran Anh Hoang Viet';
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{siteTitle}</title>
	<meta name="title" content={siteTitle} />
	<meta name="description" content={siteDescription} />
	<meta name="keywords" content={siteKeywords} />
	<meta name="author" content={siteAuthor} />
	<meta name="creator" content={siteAuthor} />
	<meta name="publisher" content={siteName} />
	<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
	<meta name="googlebot" content="index, follow" />
	<meta name="language" content="Vietnamese" />
	<meta name="revisit-after" content="7 days" />
	<meta name="rating" content="general" />
	
	<!-- Favicon & Icons -->
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<link rel="icon" href="/favicon.svg" sizes="any" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
	<link rel="mask-icon" href="/favicon.svg" color="#22c55e" />
	
	<!-- PWA Manifest -->
	<link rel="manifest" href="/manifest.json" />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={siteUrl} />
	<meta property="og:title" content={siteTitle} />
	<meta property="og:description" content={siteDescription} />
	<meta property="og:image" content="{siteUrl}{siteImage}" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="PhotoFast - Chỉnh màu ảnh online" />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:locale" content="vi_VN" />
	<meta property="og:locale:alternate" content="en_US" />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@photofast" />
	<meta name="twitter:creator" content="@photofast" />
	<meta name="twitter:url" content={siteUrl} />
	<meta name="twitter:title" content={siteTitle} />
	<meta name="twitter:description" content={siteDescription} />
	<meta name="twitter:image" content="{siteUrl}{siteImage}" />
	<meta name="twitter:image:alt" content="PhotoFast - Chỉnh màu ảnh online" />
	
	<!-- Canonical URL -->
	<link rel="canonical" href={siteUrl} />
	
	<!-- Additional SEO & PWA -->
	<meta name="application-name" content={siteName} />
	<meta name="apple-mobile-web-app-title" content={siteName} />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="format-detection" content="telephone=no" />
	<meta name="msapplication-TileColor" content="#22c55e" />
	<meta name="msapplication-config" content="/browserconfig.xml" />
	
	<!-- Preconnect for performance -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	
	<!-- Structured Data (JSON-LD) - WebApplication -->
	{@html `
		<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			"name": "${siteName}",
			"alternateName": "PhotoFast Editor",
			"description": "${siteDescription}",
			"url": "${siteUrl}",
			"image": "${siteUrl}${siteImage}",
			"applicationCategory": "MultimediaApplication",
			"operatingSystem": "Web Browser",
			"browserRequirements": "Requires JavaScript. Requires HTML5.",
			"softwareVersion": "1.0.0",
			"author": {
				"@type": "Person",
				"name": "${siteAuthor}"
			},
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "VND",
				"availability": "https://schema.org/InStock"
			},
			"featureList": [
				"Chỉnh độ sáng (Brightness)",
				"Chỉnh tương phản (Contrast)",
				"Điều chỉnh màu sắc HSL",
				"Chỉnh nhiệt độ màu (Temperature)",
				"Crop ảnh với nhiều tỷ lệ (1:1, 4:3, 16:9...)",
				"Hiệu ứng Vignette",
				"Các preset có sẵn",
				"Export ảnh chất lượng cao",
				"Giao diện sáng/tối"
			],
			"screenshot": "${siteUrl}${siteImage}",
			"aggregateRating": {
				"@type": "AggregateRating",
				"ratingValue": "5",
				"ratingCount": "100",
				"bestRating": "5",
				"worstRating": "1"
			}
		}
		</script>
	`}
	
	<!-- Structured Data (JSON-LD) - Organization -->
	{@html `
		<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "Organization",
			"name": "${siteName}",
			"url": "${siteUrl}",
			"logo": "${siteUrl}/favicon.svg",
			"description": "${siteDescription}",
			"sameAs": []
		}
		</script>
	`}
	
	<!-- Structured Data (JSON-LD) - BreadcrumbList -->
	{@html `
		<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			"itemListElement": [
				{
					"@type": "ListItem",
					"position": 1,
					"name": "Trang chủ",
					"item": "${siteUrl}"
				}
			]
		}
		</script>
	`}
	
	<!-- Structured Data (JSON-LD) - FAQPage -->
	{@html `
		<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "FAQPage",
			"mainEntity": [
				{
					"@type": "Question",
					"name": "PhotoFast là gì?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "PhotoFast là công cụ chỉnh sửa ảnh online miễn phí, cho phép bạn điều chỉnh độ sáng, tương phản, màu sắc, crop ảnh và nhiều tính năng khác ngay trên trình duyệt."
					}
				},
				{
					"@type": "Question",
					"name": "PhotoFast có miễn phí không?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Có, PhotoFast hoàn toàn miễn phí và không yêu cầu đăng ký tài khoản. Bạn có thể sử dụng ngay trên trình duyệt."
					}
				},
				{
					"@type": "Question",
					"name": "Ảnh của tôi có được upload lên server không?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Không, tất cả quá trình chỉnh sửa đều diễn ra trên trình duyệt của bạn. Ảnh không được upload lên bất kỳ server nào, đảm bảo quyền riêng tư tuyệt đối."
					}
				}
			]
		}
		</script>
	`}
</svelte:head>

<slot />
