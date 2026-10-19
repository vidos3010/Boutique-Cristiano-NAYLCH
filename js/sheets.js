/**
 * ====================================================================
 * LECTOR DE GOOGLE SHEETS Y TRANSFORMADOR DE GOOGLE DRIVE
 * ====================================================================
 */

const SheetsService = {
    /**
     * Convierte cualquier URL o ID de Google Drive a una URL directa de imagen que el navegador puede cargar
     */
    convertDriveUrl(url) {
        if (!url || typeof url !== 'string') return '';
        url = url.trim();

        // Si ya es una URL directa (ej. unsplash, imgur, cdn), retornarla
        if (!url.includes('drive.google.com') && !url.includes('docs.google.com') && (url.startsWith('http://') || url.startsWith('https://'))) {
            return url;
        }

        let fileId = null;

        // Caso 1: https://drive.google.com/file/d/FILE_ID/view...
        const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]{25,})/);
        if (fileDMatch) {
            fileId = fileDMatch[1];
        }

        // Caso 2: https://drive.google.com/open?id=FILE_ID o uc?id=FILE_ID
        if (!fileId) {
            const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
            if (idParamMatch) {
                fileId = idParamMatch[1];
            }
        }

        // Caso 3: Es solo el ID directo de Drive (cadena alfanumérica de 25+ caracteres)
        if (!fileId) {
            const rawIdMatch = url.match(/^([a-zA-Z0-9_-]{25,})$/);
            if (rawIdMatch) {
                fileId = rawIdMatch[1];
            }
        }

        // Si encontramos el ID de Google Drive, usamos el enlace CDN de alta velocidad
        if (fileId) {
            // El enlace lh3.googleusercontent.com/d/FILE_ID es el más rápido y confiable para imágenes públicas de Drive
            return `https://lh3.googleusercontent.com/d/${fileId}`;
        }

        return url;
    },

    /**
     * Procesa una cadena de fotos separadas por coma, punto y coma o salto de línea
     */
    parsePhotos(photosString, fallbackTitle = "Producto") {
        if (!photosString || typeof photosString !== 'string') {
            return [`https://placehold.co/600x600/f3f4f6/1f2937?text=${encodeURIComponent(fallbackTitle)}`];
        }

        const items = photosString
            .split(/[\n,;]+/)
            .map(item => item.trim())
            .filter(item => item.length > 0);

        if (items.length === 0) {
            return [`https://placehold.co/600x600/f3f4f6/1f2937?text=${encodeURIComponent(fallbackTitle)}`];
        }

        return items.map(item => this.convertDriveUrl(item));
    },

    /**
     * Limpia y formatea números (precios, stock, descuentos)
     */
    parseNumber(value, defaultValue = 0) {
        if (value === undefined || value === null || value === '') return defaultValue;
        if (typeof value === 'number') return isNaN(value) ? defaultValue : value;

        // Quitar símbolos de moneda, %, comas de miles y espacios
        const cleanStr = String(value)
            .replace(/[^\d.,-]/g, '')
            .replace(',', '.');

        const parsed = parseFloat(cleanStr);
        return isNaN(parsed) ? defaultValue : parsed;
    },

    /**
     * Procesa los datos crudos obtenidos de Google Sheets
     */
    normalizeRow(headers, rowValues, index) {
        const item = {};

        headers.forEach((header, idx) => {
            const cleanHeader = header.toLowerCase().trim();
            const val = rowValues[idx] !== undefined && rowValues[idx] !== null ? rowValues[idx] : '';
            item[cleanHeader] = val;
        });

        // Buscar campos con nombres alternativos posibles
        const id = item.id || item.codigo || item.sku || `PROD-${String(index + 1).padStart(3, '0')}`;
        const nombre = item.nombre || item.producto || item.titulo || item.item || "Producto sin nombre";
        const categoria = item.categoria || item.seccion || item.rubro || "General";
        const marca = item.marca || item.fabricante || "";
        const color = item.color || item.colores || "";
        const talla = item.talla || item.tallas || item.medida || item.tamaño || item.tamano || "";
        const descripcion = item.descripcion || item.detalles || item.detalle || item.informacion || "";
        const precio = this.parseNumber(item.precio || item.costo || item.pvp, 0);
        
        // Manejo de descuentos
        // El usuario puede poner "20%" o "20" (descuento del 20%) o un valor numérico
        let descuento = this.parseNumber(item.descuento || item.rebaja || item.oferta, 0);
        let precioFinal = precio;
        let porcentajeDescuento = 0;

        if (descuento > 0) {
            if (descuento < 100) {
                // Es un porcentaje (ej. 20%)
                porcentajeDescuento = Math.round(descuento);
                precioFinal = Math.max(0, precio - (precio * (porcentajeDescuento / 100)));
            } else if (descuento < precio) {
                // Es el precio promocional final (ej. si precio es 150 y ponen 120)
                precioFinal = descuento;
                porcentajeDescuento = Math.round(((precio - precioFinal) / precio) * 100);
            }
        }

        const stock = parseInt(this.parseNumber(item.stock || item.cantidad || item.disponible || item.cant, 0), 10);
        const fotosRaw = item.fotos || item.foto || item.imagenes || item.imagen || item.drive || item.link || "";
        const fotos = this.parsePhotos(fotosRaw, nombre);
        
        // Estado y destacado
        const estadoRaw = String(item.estado || item.status || "activo").toLowerCase();
        const estado = (estadoRaw === "inactivo" || estadoRaw === "oculto" || estadoRaw === "no") ? "inactivo" : "activo";

        const destacadoRaw = String(item.destacado || item.featured || "").toLowerCase();
        const destacado = destacadoRaw === "si" || destacadoRaw === "sí" || destacadoRaw === "true" || destacadoRaw === "1";

        return {
            id,
            nombre,
            categoria,
            marca,
            color,
            talla,
            descripcion,
            precio,
            descuento: porcentajeDescuento,
            precioFinal,
            ahorro: precio - precioFinal,
            stock,
            fotos,
            destacado,
            estado
        };
    },

    /**
     * Carga datos mediante JSONP (compatible 100% con doble clic en file://, localhost y cualquier servidor)
     * Elimina por completo los bloqueos de CORS en Chrome, Edge y otros navegadores
     */
    fetchJsonp(url, callbackName, timeoutMs = 8000) {
        return new Promise((resolve, reject) => {
            let timer = null;

            const cleanup = () => {
                if (timer) clearTimeout(timer);
                try {
                    delete window[callbackName];
                } catch (e) {
                    window[callbackName] = undefined;
                }
                const scriptEl = document.getElementById(callbackName);
                if (scriptEl && scriptEl.parentNode) {
                    scriptEl.parentNode.removeChild(scriptEl);
                }
            };

            timer = setTimeout(() => {
                cleanup();
                reject(new Error("Tiempo de espera agotado al conectar con Google Sheets"));
            }, timeoutMs);

            window[callbackName] = (response) => {
                cleanup();
                resolve(response);
            };

            const script = document.createElement('script');
            script.id = callbackName;
            script.src = url;
            script.onerror = () => {
                cleanup();
                reject(new Error("Error al cargar script de Google Sheets. Verifica los permisos de acceso público de la hoja."));
            };

            (document.head || document.body || document.documentElement).appendChild(script);
        });
    },

    /**
     * Obtiene los productos directamente desde Google Sheets usando JSONP y Google Visualization
     */
    async fetchFromGoogleSheets(sheetId, tabName = "Productos") {
        if (!sheetId) {
            console.info("SheetsService: No se especificó ID de Google Sheets. Usando productos de demostración.");
            return { success: false, isDemo: true, data: CONFIG.demoProducts };
        }

        const cacheBuster = Date.now();
        const cbName = `gSheetCb_${cacheBuster}_${Math.floor(Math.random() * 10000)}`;
        const encodedTab = tabName ? encodeURIComponent(tabName) : "";
        
        let parsed = null;
        let lastError = null;

        // 1. Intento prioritario con JSONP especificando la pestaña (funciona en file:// sin bloqueo CORS)
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            try {
                const tabParam = encodedTab ? `&sheet=${encodedTab}` : "";
                const jsonpUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${cbName}${tabParam}&t=${cacheBuster}`;
                parsed = await this.fetchJsonp(jsonpUrl, cbName);
            } catch (e1) {
                lastError = e1;
                console.warn("Intento 1 JSONP con pestaña falló, probando primera pestaña por defecto...", e1);
            }

            // 2. Si falló con el nombre de pestaña, reintentar JSONP a la primera pestaña por defecto
            if (!parsed) {
                try {
                    const cbName2 = `gSheetCb2_${cacheBuster}_${Math.floor(Math.random() * 10000)}`;
                    const jsonpUrlDefault = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${cbName2}&t=${cacheBuster}`;
                    parsed = await this.fetchJsonp(jsonpUrlDefault, cbName2);
                } catch (e2) {
                    lastError = e2;
                    console.warn("Intento 2 JSONP por defecto falló, probando con fetch...", e2);
                }
            }
        }

        // 3. Si JSONP no está disponible (ej. Node) o falló, intentar fetch estándar
        if (!parsed) {
            try {
                const tabParam = encodedTab ? `&sheet=${encodedTab}` : "";
                const fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json${tabParam}&t=${cacheBuster}`;
                const response = await fetch(fetchUrl, {
                    cache: 'no-store',
                    headers: {
                        'Pragma': 'no-cache',
                        'Cache-Control': 'no-cache'
                    }
                });

                if (response.ok) {
                    const rawText = await response.text();
                    const jsonMatch = rawText.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
                    if (jsonMatch && jsonMatch[1]) {
                        parsed = JSON.parse(jsonMatch[1]);
                    }
                }
            } catch (e3) {
                lastError = e3;
                console.error("Intento 3 fetch directo falló:", e3);
            }
        }

        if (!parsed) {
            return {
                success: false,
                isDemo: true,
                error: lastError ? lastError.message : "No se pudo conectar con Google Sheets",
                data: CONFIG.demoProducts
            };
        }

        if (parsed.status === "error") {
            const errMsg = parsed.errors ? parsed.errors.map(e => e.message || e.detailed_message).join(", ") : "Error en Google Sheets";
            return {
                success: false,
                isDemo: true,
                error: errMsg,
                data: CONFIG.demoProducts
            };
        }

        const table = parsed.table;
        if (!table || !table.rows || table.rows.length === 0) {
            return { success: true, isDemo: false, data: [] };
        }

        // Los nombres de columnas suelen estar en table.cols o en la primera fila de table.rows
        let headers = [];
        let rowsToProcess = table.rows;

        // Revisamos si los nombres de columna están en table.cols con label definido
        const hasColLabels = table.cols.some(c => c && c.label && c.label.trim() !== "");
        if (hasColLabels) {
            headers = table.cols.map(c => (c && c.label ? c.label.trim() : ""));
        } else {
            // La primera fila contiene los encabezados
            const firstRow = table.rows[0];
            headers = firstRow.c.map(cell => (cell && cell.v !== null && cell.v !== undefined) ? String(cell.v).trim() : "");
            rowsToProcess = table.rows.slice(1);
        }

        const products = [];

        rowsToProcess.forEach((row, idx) => {
            if (!row || !row.c) return;

            // Extraer valores de cada celda
            const values = row.c.map(cell => {
                if (!cell) return "";
                return cell.v !== null && cell.v !== undefined ? cell.v : "";
            });

            // Evitar filas vacías
            const hasContent = values.some(v => v !== null && v !== undefined && String(v).trim() !== "");
            if (hasContent) {
                const normalized = SheetsService.normalizeRow(headers, values, idx);
                if (normalized.estado === "activo") {
                    products.push(normalized);
                }
            }
        });

        return {
            success: true,
            isDemo: false,
            data: products
        };
    }
};
