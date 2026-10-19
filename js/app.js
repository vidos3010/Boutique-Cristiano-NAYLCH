/**
 * ====================================================================
 * APLICACIÓN PRINCIPAL - INTERFAZ DE USUARIO, FILTROS Y EVENTOS
 * ====================================================================
 */

const App = {
    allProducts: [],
    filteredProducts: [],
    selectedCategory: 'all',
    selectedBrand: 'all',
    onlyDiscounts: false,
    onlyInStock: false,
    searchQuery: '',
    sortBy: 'featured', // 'featured', 'price-asc', 'price-desc', 'name'
    activeModalProduct: null,
    activeModalPhotoIndex: 0,
    featuredProducts: [],
    currentSlideIndex: 0,
    sliderInterval: null,

    async init() {
        try {
            const savedSheetId = localStorage.getItem('nayely_saved_sheet_id');
            if (savedSheetId) {
                CONFIG.googleSheetId = savedSheetId;
            }
        } catch (e) {}

        this.applyStoreBranding();
        this.setupEventListeners();
        this.renderCartCounter();
        await this.loadProducts();
    },

    /**
     * Aplica nombres y textos configurados en config.js
     */
    applyStoreBranding() {
        document.title = `${CONFIG.storeName} - Catálogo Online`;
        
        const titleEl = document.getElementById('store-name');
        if (titleEl) titleEl.textContent = CONFIG.storeName;

        const footerTitleEl = document.getElementById('footer-store-name');
        if (footerTitleEl) footerTitleEl.textContent = CONFIG.storeName;

        const sloganEl = document.getElementById('store-slogan');
        if (sloganEl) sloganEl.textContent = CONFIG.storeSlogan;

        const bannerShipping = document.getElementById('banner-shipping');
        if (bannerShipping && CONFIG.shippingNote) {
            bannerShipping.textContent = CONFIG.shippingNote;
        }

        // Si hay logo configurado (soporta URL normal o Google Drive)
        if (CONFIG.storeLogo) {
            const logoUrl = SheetsService.convertDriveUrl(CONFIG.storeLogo);
            
            // Actualizar favicon
            const favicon = document.getElementById('store-favicon');
            if (favicon) favicon.href = logoUrl;

            // Actualizar logo de cabecera
            const logoContainer = document.getElementById('store-logo-container');
            if (logoContainer) {
                logoContainer.innerHTML = `
                    <img 
                        src="${logoUrl}" 
                        alt="${CONFIG.storeName}" 
                        class="w-12 h-12 rounded-2xl object-cover shadow-md border border-slate-100 bg-white"
                        onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-md shadow-rose-200\\'><i data-lucide=\\'sparkles\\' class=\\'w-6 h-6\\'></i></div>'; if(window.lucide) lucide.createIcons();"
                    />
                `;
            }

            // Actualizar logo de pie de página
            const footerLogoContainer = document.getElementById('footer-logo-container');
            if (footerLogoContainer) {
                footerLogoContainer.innerHTML = `
                    <img 
                        src="${logoUrl}" 
                        alt="${CONFIG.storeName}" 
                        class="w-9 h-9 rounded-xl object-cover bg-white border border-slate-200 shadow-xs"
                        onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center text-white\\'><i data-lucide=\\'sparkles\\' class=\\'w-4 h-4\\'></i></div>'; if(window.lucide) lucide.createIcons();"
                    />
                `;
            }
        }

        // Enlace del botón flotante de WhatsApp
        const waFloating = document.getElementById('floating-whatsapp');
        if (waFloating) {
            const cleanNumber = CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
            const greeting = encodeURIComponent(CONFIG.whatsappGreeting || "¡Hola! Quisiera más información sobre los productos.");
            waFloating.href = `https://wa.me/${cleanNumber}?text=${greeting}`;
        }
    },

    /**
     * Carga productos desde Google Sheets o desde datos demo
     */
    async loadProducts() {
        const grid = document.getElementById('products-grid');
        const loadingIndicator = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const demoNotice = document.getElementById('demo-sheet-notice');

        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        if (grid) grid.innerHTML = '';
        if (emptyState) emptyState.classList.add('hidden');

        try {
            const result = await SheetsService.fetchFromGoogleSheets(
                CONFIG.googleSheetId,
                CONFIG.googleSheetTabName
            );

            this.allProducts = result.data || [];

            // Mostrar u ocultar el aviso de modo demostración
            if (demoNotice) {
                if (result.isDemo) {
                    demoNotice.classList.remove('hidden');
                    const demoReason = document.getElementById('demo-reason');
                    if (demoReason) {
                        demoReason.textContent = result.error 
                            ? `(Aviso: ${result.error} - Mostrando catálogo de muestra)`
                            : `(Configura tu ID de Google Sheets en js/config.js para ver tus propios productos)`;
                    }
                } else {
                    demoNotice.classList.add('hidden');
                }
            }

            this.buildCategoryFilters();
            this.buildBrandFilters();
            this.applyFilters();
            this.initFeaturedSlider();

        } catch (error) {
            console.error("Error al inicializar productos:", error);
            this.allProducts = CONFIG.demoProducts;
            this.buildCategoryFilters();
            this.applyFilters();
            this.initFeaturedSlider();
        } finally {
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            if (window.lucide) lucide.createIcons();
        }
    },

    /**
     * Inicializa el slider de productos destacados
     */
    initFeaturedSlider() {
        this.featuredProducts = this.allProducts.filter(p => p.destacado);
        // Si no hay productos marcados como destacado, usar los que tienen descuento o los primeros 4
        if (this.featuredProducts.length === 0) {
            this.featuredProducts = this.allProducts.filter(p => p.descuento > 0);
            if (this.featuredProducts.length === 0) {
                this.featuredProducts = this.allProducts.slice(0, 4);
            }
        }

        const sliderSection = document.getElementById('hero-slider-section');
        if (!sliderSection) return;

        if (this.featuredProducts.length === 0) {
            sliderSection.classList.add('hidden');
            return;
        }

        sliderSection.classList.remove('hidden');
        this.currentSlideIndex = 0;
        this.renderFeaturedSlide();
        this.startSliderAutoplay();
        this.setupSliderTouchEvents();
    },

    /**
     * Renderiza el slide activo en el slider de destacados
     */
    renderFeaturedSlide() {
        const container = document.getElementById('featured-slider-container');
        const dotsContainer = document.getElementById('featured-slider-dots');
        if (!container || this.featuredProducts.length === 0) return;

        const p = this.featuredProducts[this.currentSlideIndex];
        const mainPhoto = p.fotos && p.fotos.length > 0 ? p.fotos[0] : 'https://placehold.co/600x600?text=Sin+Foto';

        container.innerHTML = `
            <div class="w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl transition-all duration-500 modal-animate">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-center">
                    
                    <!-- Columna Izquierda: Información del Producto -->
                    <div class="md:col-span-7 flex flex-col justify-between space-y-4 text-left">
                        <div>
                            <!-- Badges -->
                            <div class="flex flex-wrap items-center gap-2 mb-2.5">
                                <span class="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                    <i data-lucide="sparkles" class="w-3.5 h-3.5 fill-current"></i> Destacado
                                </span>
                                ${p.descuento > 0 ? `
                                    <span class="discount-badge text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                        <i data-lucide="tag" class="w-3 h-3"></i> ${p.descuento}% OFF
                                    </span>
                                ` : ''}
                                <span class="text-xs text-rose-200 uppercase tracking-wider font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                                    ${p.categoria || 'Catálogo'}
                                </span>
                            </div>

                            <!-- Título -->
                            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading text-white leading-tight cursor-pointer hover:text-rose-200 transition-colors" onclick="App.openProductModal('${p.id}')">
                                ${p.nombre}
                            </h2>

                            <!-- Marca, Color y Talla -->
                            <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-pink-100/80 mt-2">
                                ${p.marca ? `<span class="font-bold text-white bg-white/10 px-2 py-0.5 rounded">${p.marca}</span>` : ''}
                                ${p.color ? `<span>• Color: <strong>${p.color}</strong></span>` : ''}
                                ${p.talla ? `<span>• Talla: <strong>${p.talla}</strong></span>` : ''}
                            </div>

                            <!-- Descripción -->
                            ${p.descripcion ? `
                                <p class="text-xs sm:text-sm text-pink-100/90 line-clamp-2 sm:line-clamp-3 mt-3 leading-relaxed">
                                    ${p.descripcion}
                                </p>
                            ` : ''}
                        </div>

                        <!-- Precios y Ahorro -->
                        <div class="flex items-baseline gap-3 pt-2">
                            <span class="text-3xl sm:text-4xl font-black text-white font-heading">
                                ${CartService.formatPrice(p.precioFinal)}
                            </span>
                            ${p.descuento > 0 ? `
                                <span class="text-base sm:text-lg text-pink-300 line-through">
                                    ${CartService.formatPrice(p.precio)}
                                </span>
                                <span class="text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                                    Ahorras ${CartService.formatPrice(p.ahorro)}
                                </span>
                            ` : ''}
                        </div>

                        <!-- Botones de Acción -->
                        <div class="flex flex-wrap items-center gap-3 pt-2">
                            <button 
                                onclick="App.quickBuyWhatsApp('${p.id}')"
                                class="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition hover:scale-105 active:scale-95">
                                <i data-lucide="message-circle" class="w-4 h-4"></i>
                                <span>Pedir por WhatsApp</span>
                            </button>

                            <button 
                                onclick="App.openProductModal('${p.id}')"
                                class="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-md flex items-center gap-2 transition hover:scale-105 active:scale-95">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                                <span>Ver Detalles</span>
                            </button>
                        </div>
                    </div>

                    <!-- Columna Derecha: Imagen del Producto -->
                    <div class="md:col-span-5 relative flex items-center justify-center">
                        <div class="relative w-full max-w-[280px] sm:max-w-[340px] aspect-square rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-950/40 group cursor-pointer" onclick="App.openProductModal('${p.id}')">
                            <img 
                                src="${mainPhoto}" 
                                alt="${p.nombre}" 
                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onerror="this.onerror=null; this.src='https://placehold.co/600x600/f3f4f6/94a3b8?text=Foto+no+disponible';"
                            />

                            ${p.fotos && p.fotos.length > 1 ? `
                                <div class="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 z-10">
                                    <i data-lucide="images" class="w-3 h-3"></i> ${p.fotos.length} fotos
                                </div>
                            ` : ''}

                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span class="bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <i data-lucide="search" class="w-3.5 h-3.5"></i> Ver Ficha Completa
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;

        // Renderizar Dots de Navegación
        if (dotsContainer) {
            dotsContainer.innerHTML = this.featuredProducts.map((_, idx) => `
                <button 
                    onclick="App.goToFeaturedSlide(${idx})" 
                    class="transition-all rounded-full ${idx === this.currentSlideIndex ? 'w-8 h-2.5 bg-rose-400' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'}"
                    title="Producto destacado ${idx + 1}">
                </button>
            `).join('');
        }

        if (window.lucide) lucide.createIcons();
    },

    nextFeaturedSlide() {
        if (this.featuredProducts.length === 0) return;
        this.currentSlideIndex = (this.currentSlideIndex + 1) % this.featuredProducts.length;
        this.renderFeaturedSlide();
    },

    prevFeaturedSlide() {
        if (this.featuredProducts.length === 0) return;
        this.currentSlideIndex = (this.currentSlideIndex - 1 + this.featuredProducts.length) % this.featuredProducts.length;
        this.renderFeaturedSlide();
    },

    goToFeaturedSlide(index) {
        if (index >= 0 && index < this.featuredProducts.length) {
            this.currentSlideIndex = index;
            this.renderFeaturedSlide();
        }
    },

    startSliderAutoplay() {
        if (this.sliderInterval) clearInterval(this.sliderInterval);
        this.sliderInterval = setInterval(() => {
            this.nextFeaturedSlide();
        }, 5000);

        const section = document.getElementById('hero-slider-section');
        if (section) {
            section.onmouseenter = () => clearInterval(this.sliderInterval);
            section.onmouseleave = () => this.startSliderAutoplay();
        }
    },

    setupSliderTouchEvents() {
        const container = document.getElementById('featured-slider-container');
        if (!container) return;

        let touchStartX = 0;
        let touchEndX = 0;

        container.ontouchstart = (e) => {
            touchStartX = e.changedTouches[0].screenX;
        };

        container.ontouchend = (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextFeaturedSlide();
                } else {
                    this.prevFeaturedSlide();
                }
            }
        };
    },

    /**
     * Genera los botones de categorías dinámicamente según los productos
     */
    buildCategoryFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;

        const categories = new Set();
        this.allProducts.forEach(p => {
            if (p.categoria) categories.add(p.categoria);
        });

        let html = `
            <button class="filter-chip active px-4 py-2 rounded-full text-xs md:text-sm font-semibold border border-slate-200 bg-slate-900 text-white transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap" data-category="all">
                <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
                Todos (${this.allProducts.length})
            </button>
        `;

        Array.from(categories).sort().forEach(cat => {
            const count = this.allProducts.filter(p => p.categoria === cat).length;
            html += `
                <button class="filter-chip px-4 py-2 rounded-full text-xs md:text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-all whitespace-nowrap" data-category="${cat}">
                    ${cat} <span class="text-xs text-slate-400">(${count})</span>
                </button>
            `;
        });

        container.innerHTML = html;

        // Eventos a los botones de categoría
        container.querySelectorAll('.filter-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.filter-chip').forEach(b => {
                    b.classList.remove('active', 'bg-slate-900', 'text-white');
                    b.classList.add('bg-white', 'text-slate-700');
                });
                btn.classList.add('active', 'bg-slate-900', 'text-white');
                btn.classList.remove('bg-white', 'text-slate-700');

                this.selectedCategory = btn.dataset.category;
                this.applyFilters();
            });
        });
    },

    /**
     * Construye el selector de marcas
     */
    buildBrandFilters() {
        const select = document.getElementById('brand-filter');
        if (!select) return;

        const brands = new Set();
        this.allProducts.forEach(p => {
            if (p.marca && p.marca.trim() !== '') brands.add(p.marca.trim());
        });

        let html = '<option value="all">Todas las marcas</option>';
        Array.from(brands).sort().forEach(b => {
            html += `<option value="${b}">${b}</option>`;
        });

        select.innerHTML = html;
    },

    /**
     * Aplica búsqueda, categorías, descuentos, stock y ordenamiento
     */
    applyFilters() {
        let list = [...this.allProducts];

        // 1. Filtro de Categoría
        if (this.selectedCategory !== 'all') {
            list = list.filter(p => p.categoria === this.selectedCategory);
        }

        // 2. Filtro de Marca
        if (this.selectedBrand !== 'all') {
            list = list.filter(p => p.marca && p.marca.toLowerCase() === this.selectedBrand.toLowerCase());
        }

        // 3. Filtro Solo Ofertas
        if (this.onlyDiscounts) {
            list = list.filter(p => p.descuento > 0);
        }

        // 4. Filtro Solo en Stock
        if (this.onlyInStock) {
            list = list.filter(p => p.stock > 0);
        }

        // 5. Búsqueda por texto (nombre, marca, color, descripción, código)
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            list = list.filter(p => {
                return (
                    (p.nombre && p.nombre.toLowerCase().includes(q)) ||
                    (p.marca && p.marca.toLowerCase().includes(q)) ||
                    (p.color && p.color.toLowerCase().includes(q)) ||
                    (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
                    (p.id && p.id.toLowerCase().includes(q)) ||
                    (p.categoria && p.categoria.toLowerCase().includes(q))
                );
            });
        }

        // 6. Ordenamiento
        if (this.sortBy === 'price-asc') {
            list.sort((a, b) => a.precioFinal - b.precioFinal);
        } else if (this.sortBy === 'price-desc') {
            list.sort((a, b) => b.precioFinal - a.precioFinal);
        } else if (this.sortBy === 'name') {
            list.sort((a, b) => a.nombre.localeCompare(b.nombre));
        } else if (this.sortBy === 'featured') {
            // Destacados primero, luego con descuento
            list.sort((a, b) => {
                if (a.destacado && !b.destacado) return -1;
                if (!a.destacado && b.destacado) return 1;
                if (a.descuento > 0 && b.descuento === 0) return -1;
                if (a.descuento === 0 && b.descuento > 0) return 1;
                return 0;
            });
        }

        this.filteredProducts = list;
        this.renderProducts();
    },

    /**
     * Renderiza el grid de productos
     */
    renderProducts() {
        const grid = document.getElementById('products-grid');
        const emptyState = document.getElementById('empty-state');
        const countLabel = document.getElementById('products-count');

        if (!grid) return;

        if (countLabel) {
            countLabel.textContent = `${this.filteredProducts.length} producto${this.filteredProducts.length === 1 ? '' : 's'} encontrado${this.filteredProducts.length === 1 ? '' : 's'}`;
        }

        if (this.filteredProducts.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        grid.innerHTML = this.filteredProducts.map(product => this.createProductCardHtml(product)).join('');

        if (window.lucide) lucide.createIcons();
    },

    /**
     * Crea el HTML de una tarjeta de producto
     */
    createProductCardHtml(p) {
        const isOutOfStock = p.stock <= 0;
        const isLowStock = p.stock > 0 && p.stock <= 3;
        const mainPhoto = p.fotos && p.fotos.length > 0 ? p.fotos[0] : 'https://placehold.co/500x500?text=Sin+Foto';
        const hasMultiplePhotos = p.fotos && p.fotos.length > 1;

        // Badges
        let badgesHtml = '';
        if (p.descuento > 0) {
            badgesHtml += `<span class="discount-badge text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                <i data-lucide="tag" class="w-3 h-3"></i> -${p.descuento}%
            </span>`;
        }
        if (p.destacado) {
            badgesHtml += `<span class="bg-amber-500 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                <i data-lucide="sparkles" class="w-3 h-3"></i> Top
            </span>`;
        }

        // Indicador de Stock
        let stockIndicator = '';
        if (isOutOfStock) {
            stockIndicator = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-700">
                <i data-lucide="x-circle" class="w-3 h-3"></i> Agotado
            </span>`;
        } else if (isLowStock) {
            stockIndicator = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                <i data-lucide="alert-circle" class="w-3 h-3"></i> ¡Últimas ${p.stock} unid.!
            </span>`;
        } else {
            stockIndicator = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-emerald-700 bg-emerald-50">
                <i data-lucide="check" class="w-3 h-3"></i> ${p.stock} disponibles
            </span>`;
        }

        // Tags de marca y color
        let metaTags = [];
        if (p.marca) metaTags.push(`<span class="text-xs text-slate-500 font-medium">${p.marca}</span>`);
        if (p.color) metaTags.push(`<span class="text-xs text-slate-400">• ${p.color}</span>`);

        return `
            <div class="product-card bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex flex-col group relative">
                <!-- Contenedor de Imagen -->
                <div class="product-image-container relative bg-slate-100 cursor-pointer" onclick="App.openProductModal('${p.id}')">
                    <img 
                        src="${mainPhoto}" 
                        alt="${p.nombre}" 
                        loading="lazy" 
                        onerror="this.onerror=null; this.src='https://placehold.co/600x600/f3f4f6/94a3b8?text=Foto+no+disponible';"
                    />

                    <!-- Badges superiores -->
                    <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        ${badgesHtml}
                    </div>

                    <!-- Indicador de fotos múltiples -->
                    ${hasMultiplePhotos ? `
                        <div class="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                            <i data-lucide="images" class="w-3 h-3"></i> ${p.fotos.length}
                        </div>
                    ` : ''}

                    <!-- Overlay sutil al hover -->
                    <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span class="bg-white/90 backdrop-blur text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            <i data-lucide="eye" class="w-3.5 h-3.5"></i> Ver detalles
                        </span>
                    </div>
                </div>

                <!-- Información del Producto -->
                <div class="p-4 md:p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <!-- Categoría y Stock -->
                        <div class="flex items-center justify-between gap-2 mb-1.5">
                            <span class="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                ${p.categoria || 'Catálogo'}
                            </span>
                            ${stockIndicator}
                        </div>

                        <!-- Título -->
                        <h3 class="font-bold text-slate-800 text-base md:text-lg leading-snug line-clamp-2 hover:text-rose-600 transition-colors cursor-pointer" onclick="App.openProductModal('${p.id}')">
                            ${p.nombre}
                        </h3>

                        <!-- Marca / Color -->
                        <div class="flex items-center flex-wrap gap-1 mt-1 mb-2">
                            ${metaTags.join(' ')}
                        </div>

                        <!-- Descripción corta -->
                        ${p.descripcion ? `
                            <p class="text-xs text-slate-500 line-clamp-2 mb-3">
                                ${p.descripcion}
                            </p>
                        ` : ''}
                    </div>

                    <!-- Precios y Acciones -->
                    <div class="pt-3 border-t border-slate-100 mt-2">
                        <div class="flex items-baseline gap-2 mb-3">
                            <span class="text-xl md:text-2xl font-extrabold text-slate-900 font-heading">
                                ${CartService.formatPrice(p.precioFinal)}
                            </span>
                            ${p.descuento > 0 ? `
                                <span class="text-xs md:text-sm text-slate-400 line-through">
                                    ${CartService.formatPrice(p.precio)}
                                </span>
                            ` : ''}
                        </div>

                        <!-- Botones -->
                        <div class="grid grid-cols-5 gap-2">
                            <button 
                                onclick="App.quickAddToCart('${p.id}')"
                                class="col-span-2 py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-900 hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-1.5 ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}"
                                ${isOutOfStock ? 'disabled' : ''}
                                title="Agregar al carrito">
                                <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                <span>Agregar</span>
                            </button>

                            <button 
                                onclick="App.quickBuyWhatsApp('${p.id}')"
                                class="col-span-3 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200"
                                title="Pedir por WhatsApp">
                                <i data-lucide="message-circle" class="w-4 h-4"></i>
                                <span>Pedir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Abre el modal de detalles completos del producto
     */
    openProductModal(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (!product) return;

        this.activeModalProduct = product;
        this.activeModalPhotoIndex = 0;

        const modal = document.getElementById('product-modal');
        const modalBody = document.getElementById('modal-product-content');

        if (!modal || !modalBody) return;

        const isOutOfStock = product.stock <= 0;
        const mainPhoto = product.fotos && product.fotos.length > 0 ? product.fotos[0] : '';

        modalBody.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <!-- Columna 1: Galería de Fotos -->
                <div>
                    <!-- Foto Principal -->
                    <div class="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                        <img 
                            id="modal-main-image"
                            src="${mainPhoto}" 
                            alt="${product.nombre}" 
                            class="w-full h-full object-cover transition-opacity duration-300"
                            onerror="this.onerror=null; this.src='https://placehold.co/600x600/f3f4f6/94a3b8?text=Foto+no+disponible';"
                        />

                        ${product.descuento > 0 ? `
                            <div class="absolute top-3 left-3 discount-badge text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                -${product.descuento}% OFF
                            </div>
                        ` : ''}
                    </div>

                    <!-- Miniaturas de fotos -->
                    ${product.fotos && product.fotos.length > 1 ? `
                        <div class="flex items-center gap-2 mt-3 overflow-x-auto pb-2">
                            ${product.fotos.map((photo, idx) => `
                                <button 
                                    onclick="App.switchModalPhoto(${idx})"
                                    class="w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${idx === 0 ? 'border-rose-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'} modal-thumbnail"
                                    data-thumb-idx="${idx}">
                                    <img src="${photo}" class="w-full h-full object-cover" />
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>

                <!-- Columna 2: Detalles y Acciones -->
                <div class="flex flex-col justify-between">
                    <div>
                        <!-- Categoría y Código -->
                        <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
                            <span class="font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                ${product.categoria}
                            </span>
                            <span class="font-mono bg-slate-100 px-2 py-0.5 rounded">Cód: ${product.id}</span>
                        </div>

                        <!-- Nombre -->
                        <h2 class="text-2xl font-bold text-slate-900 leading-tight mb-2">
                            ${product.nombre}
                        </h2>

                        <!-- Precios -->
                        <div class="flex items-baseline gap-3 my-3">
                            <span class="text-3xl font-extrabold text-slate-900 font-heading">
                                ${CartService.formatPrice(product.precioFinal)}
                            </span>
                            ${product.descuento > 0 ? `
                                <span class="text-base text-slate-400 line-through">
                                    ${CartService.formatPrice(product.precio)}
                                </span>
                                <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                    Ahorras ${CartService.formatPrice(product.ahorro)}
                                </span>
                            ` : ''}
                        </div>

                        <!-- Ficha Técnica -->
                        <div class="space-y-2 py-3 border-y border-slate-100 my-4 text-xs md:text-sm">
                            ${product.marca ? `
                                <div class="flex justify-between py-1">
                                    <span class="text-slate-500">Marca:</span>
                                    <span class="font-semibold text-slate-800">${product.marca}</span>
                                </div>
                            ` : ''}

                            ${product.color ? `
                                <div class="flex justify-between py-1">
                                    <span class="text-slate-500">Color(es):</span>
                                    <span class="font-semibold text-slate-800">${product.color}</span>
                                </div>
                            ` : ''}

                            ${product.talla ? `
                                <div class="flex justify-between py-1">
                                    <span class="text-slate-500">Talla / Medida:</span>
                                    <span class="font-semibold text-slate-800">${product.talla}</span>
                                </div>
                            ` : ''}

                            <div class="flex justify-between py-1">
                                <span class="text-slate-500">Disponibilidad:</span>
                                <span class="font-semibold ${isOutOfStock ? 'text-rose-600' : 'text-emerald-600'}">
                                    ${isOutOfStock ? 'Agotado' : `${product.stock} unidades en stock`}
                                </span>
                            </div>
                        </div>

                        <!-- Descripción -->
                        ${product.descripcion ? `
                            <div class="mb-4">
                                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Descripción:</h4>
                                <p class="text-xs md:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                                    ${product.descripcion}
                                </p>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Controles de Compra -->
                    <div class="pt-4 border-t border-slate-100 space-y-3">
                        <!-- Selector de Cantidad -->
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-semibold text-slate-700">Cantidad:</span>
                            <div class="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                                <button onclick="App.decrementModalQty()" class="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold">-</button>
                                <input id="modal-qty-input" type="number" min="1" max="${product.stock || 1}" value="1" class="w-12 text-center text-sm font-semibold border-x border-slate-300 focus:outline-none py-1" />
                                <button onclick="App.incrementModalQty()" class="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold">+</button>
                            </div>
                        </div>

                        <!-- Botones de Acción -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            <button 
                                onclick="App.addModalToCart()"
                                class="w-full py-3 px-4 rounded-xl border-2 border-slate-800 hover:bg-slate-900 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2 ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}"
                                ${isOutOfStock ? 'disabled' : ''}>
                                <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                <span>Agregar al Pedido</span>
                            </button>

                            <button 
                                onclick="App.buyModalWhatsApp()"
                                class="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-200">
                                <i data-lucide="message-circle" class="w-4 h-4"></i>
                                <span>Consultar por WhatsApp</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    },

    /**
     * Cambia la foto principal dentro del modal
     */
    switchModalPhoto(index) {
        if (!this.activeModalProduct || !this.activeModalProduct.fotos) return;
        const photo = this.activeModalProduct.fotos[index];
        if (!photo) return;

        const mainImg = document.getElementById('modal-main-image');
        if (mainImg) {
            mainImg.style.opacity = '0.4';
            setTimeout(() => {
                mainImg.src = photo;
                mainImg.style.opacity = '1';
            }, 150);
        }

        document.querySelectorAll('.modal-thumbnail').forEach((thumb, idx) => {
            if (idx === index) {
                thumb.classList.add('border-rose-500', 'scale-105');
                thumb.classList.remove('border-transparent', 'opacity-70');
            } else {
                thumb.classList.remove('border-rose-500', 'scale-105');
                thumb.classList.add('border-transparent', 'opacity-70');
            }
        });
    },

    closeProductModal() {
        const modal = document.getElementById('product-modal');
        if (modal) modal.classList.add('hidden');
        this.activeModalProduct = null;
    },

    incrementModalQty() {
        const input = document.getElementById('modal-qty-input');
        if (!input || !this.activeModalProduct) return;
        let current = parseInt(input.value, 10) || 1;
        const max = this.activeModalProduct.stock > 0 ? this.activeModalProduct.stock : 99;
        if (current < max) {
            input.value = current + 1;
        }
    },

    decrementModalQty() {
        const input = document.getElementById('modal-qty-input');
        if (!input) return;
        let current = parseInt(input.value, 10) || 1;
        if (current > 1) {
            input.value = current - 1;
        }
    },

    addModalToCart() {
        if (!this.activeModalProduct) return;
        const input = document.getElementById('modal-qty-input');
        const qty = parseInt(input ? input.value : 1, 10) || 1;

        const result = CartService.addItem(this.activeModalProduct, qty);
        if (result.success) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: result.message,
                showConfirmButton: false,
                timer: 2000
            });
            this.closeProductModal();
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: result.message
            });
        }
    },

    buyModalWhatsApp() {
        if (!this.activeModalProduct) return;
        const input = document.getElementById('modal-qty-input');
        const qty = parseInt(input ? input.value : 1, 10) || 1;
        CartService.inquireProductWhatsApp(this.activeModalProduct, qty);
    },

    quickAddToCart(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (!product) return;

        const result = CartService.addItem(product, 1);
        if (result.success) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: result.message,
                showConfirmButton: false,
                timer: 2000
            });
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: result.message
            });
        }
    },

    quickBuyWhatsApp(productId) {
        const product = this.allProducts.find(p => p.id === productId);
        if (!product) return;
        CartService.inquireProductWhatsApp(product, 1);
    },

    /**
     * Actualiza el badge contador del carrito flotante y en la barra superior
     */
    renderCartCounter() {
        const count = CartService.getTotalCount();
        const badges = document.querySelectorAll('.cart-counter-badge');
        badges.forEach(badge => {
            badge.textContent = count;
            if (count > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        });
    },

    /**
     * Renderiza el contenido del Drawer del Carrito
     */
    renderCartDrawer() {
        const items = CartService.getItems();
        const summary = CartService.getSummary();
        const container = document.getElementById('cart-items-container');
        const emptyView = document.getElementById('cart-empty-view');
        const footerView = document.getElementById('cart-footer-view');

        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = '';
            if (emptyView) emptyView.classList.remove('hidden');
            if (footerView) footerView.classList.add('hidden');
            return;
        }

        if (emptyView) emptyView.classList.add('hidden');
        if (footerView) footerView.classList.remove('hidden');

        container.innerHTML = items.map(item => `
            <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <!-- Foto -->
                <img 
                    src="${item.foto || 'https://placehold.co/100x100?text=Prod'}" 
                    class="w-16 h-16 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                    onerror="this.onerror=null; this.src='https://placehold.co/100x100?text=Foto';"
                />

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <h4 class="text-xs font-bold text-slate-800 truncate">${item.nombre}</h4>
                    <div class="text-[11px] text-slate-500">
                        ${item.color ? `<span>Color: ${item.color}</span>` : ''}
                        ${item.talla ? `<span class="ml-1">| Talla: ${item.talla}</span>` : ''}
                    </div>
                    <div class="flex items-baseline gap-1.5 mt-1">
                        <span class="text-xs font-bold text-slate-900">${CartService.formatPrice(item.precioFinal)}</span>
                        ${item.descuento > 0 ? `<span class="text-[10px] text-slate-400 line-through">${CartService.formatPrice(item.precio)}</span>` : ''}
                    </div>
                </div>

                <!-- Controles Cantidad -->
                <div class="flex flex-col items-end gap-1">
                    <button onclick="CartService.removeItem('${item.itemKey}')" class="text-slate-400 hover:text-rose-500 p-1" title="Eliminar">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <div class="flex items-center border border-slate-200 rounded-md">
                        <button onclick="CartService.updateQuantity('${item.itemKey}', ${item.quantity - 1})" class="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-bold">-</button>
                        <span class="px-2 text-xs font-semibold">${item.quantity}</span>
                        <button onclick="CartService.updateQuantity('${item.itemKey}', ${item.quantity + 1})" class="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-bold">+</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Resumen
        const subtotalEl = document.getElementById('cart-subtotal');
        const discountEl = document.getElementById('cart-discount');
        const totalEl = document.getElementById('cart-total');

        if (subtotalEl) subtotalEl.textContent = CartService.formatPrice(summary.subtotalOriginal);
        if (discountEl) {
            discountEl.textContent = summary.ahorroTotal > 0 ? `-${CartService.formatPrice(summary.ahorroTotal)}` : 'S/ 0.00';
        }
        if (totalEl) totalEl.textContent = CartService.formatPrice(summary.totalFinal);

        if (window.lucide) lucide.createIcons();
    },

    openCartDrawer() {
        const drawer = document.getElementById('cart-drawer');
        if (drawer) {
            this.renderCartDrawer();
            drawer.classList.remove('hidden');
        }
    },

    closeCartDrawer() {
        const drawer = document.getElementById('cart-drawer');
        if (drawer) drawer.classList.add('hidden');
    },

    /**
     * Envía el pedido del carrito a WhatsApp
     */
    checkoutCartWhatsApp() {
        const nameInput = document.getElementById('customer-name');
        const phoneInput = document.getElementById('customer-phone');
        const addressInput = document.getElementById('customer-address');
        const notesInput = document.getElementById('customer-notes');

        const customerData = {
            name: nameInput ? nameInput.value : '',
            phone: phoneInput ? phoneInput.value : '',
            address: addressInput ? addressInput.value : '',
            notes: notesInput ? notesInput.value : ''
        };

        const result = CartService.sendOrderWhatsApp(customerData);
        if (result.success) {
            if (window.confetti) {
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
            this.closeCartDrawer();
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: result.message
            });
        }
    },

    /**
     * Muestra el modal de instrucciones de Google Sheets
     */
    openSheetsModal() {
        const modal = document.getElementById('sheets-config-modal');
        if (modal) {
            const input = document.getElementById('custom-sheet-id-input');
            if (input) {
                input.value = CONFIG.googleSheetId || "";
            }
            modal.classList.remove('hidden');
        }
    },

    closeSheetsModal() {
        const modal = document.getElementById('sheets-config-modal');
        if (modal) modal.classList.add('hidden');
    },

    /**
     * Guarda el ID de hoja ingresado manualmente y recarga
     */
    saveCustomSheetId() {
        const input = document.getElementById('custom-sheet-id-input');
        if (!input) return;
        const val = input.value.trim();

        // Extraer ID si pegó la URL completa
        let cleanId = val;
        const urlMatch = val.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (urlMatch) {
            cleanId = urlMatch[1];
        }

        if (!cleanId) {
            Swal.fire('Atención', 'Por favor ingresa un ID o URL válida de Google Sheets', 'warning');
            return;
        }

        CONFIG.googleSheetId = cleanId;
        try {
            localStorage.setItem('nayely_saved_sheet_id', cleanId);
        } catch (e) {}

        this.closeSheetsModal();
        
        Swal.fire({
            title: 'Cargando productos...',
            text: 'Conectando con tu Google Sheet',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        this.loadProducts().then(() => {
            Swal.close();
            Swal.fire('¡Conexión Exitosa!', `Se cargaron ${this.allProducts.length} productos de tu hoja.`, 'success');
        });
    },

    /**
     * Escuchadores de eventos globales
     */
    setupEventListeners() {
        // Escuchar cambios en el carrito
        window.addEventListener('cart:updated', () => {
            this.renderCartCounter();
            this.renderCartDrawer();
        });

        // Búsqueda en tiempo real
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim();
                this.applyFilters();
            });
        }

        // Selector de marcas
        const brandFilter = document.getElementById('brand-filter');
        if (brandFilter) {
            brandFilter.addEventListener('change', (e) => {
                this.selectedBrand = e.target.value;
                this.applyFilters();
            });
        }

        // Ordenamiento
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        // Checkbox Solo Descuentos
        const discountCheckbox = document.getElementById('filter-discount');
        if (discountCheckbox) {
            discountCheckbox.addEventListener('change', (e) => {
                this.onlyDiscounts = e.target.checked;
                this.applyFilters();
            });
        }

        // Checkbox Solo en Stock
        const stockCheckbox = document.getElementById('filter-stock');
        if (stockCheckbox) {
            stockCheckbox.addEventListener('change', (e) => {
                this.onlyInStock = e.target.checked;
                this.applyFilters();
            });
        }

        // Recargar datos manualmente desde la hoja
        const btnReload = document.getElementById('btn-reload-sheets');
        if (btnReload) {
            btnReload.addEventListener('click', () => {
                const icon = btnReload.querySelector('i');
                if (icon) icon.classList.add('animate-spin');

                this.loadProducts().then(() => {
                    setTimeout(() => {
                        if (icon) icon.classList.remove('animate-spin');
                    }, 400);

                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: `¡Sincronizado!`,
                        text: `${this.allProducts.length} productos cargados desde Google Sheets`,
                        showConfirmButton: false,
                        timer: 2000
                    });
                }).catch(() => {
                    if (icon) icon.classList.remove('animate-spin');
                });
            });
        }

        // Auto-sincronización cuando vuelves a la pestaña de la tienda
        window.addEventListener('focus', () => {
            // Recargar en segundo plano silenciosamente
            this.loadProducts(true);
        });

        // Cerrar modales con tecla ESC
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProductModal();
                this.closeCartDrawer();
                this.closeSheetsModal();
            }
        });
    }
};

// Arrancar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
