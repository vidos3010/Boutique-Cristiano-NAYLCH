/**
 * ====================================================================
 * GESTOR DE CARRITO DE COMPRAS Y PEDIDOS POR WHATSAPP
 * ====================================================================
 */

const CartService = {
    STORAGE_KEY: "nayely_store_cart_v1",

    /**
     * Obtiene los productos actuales en el carrito desde localStorage
     */
    getItems() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Error al leer carrito de localStorage:", e);
            return [];
        }
    },

    /**
     * Guarda el carrito en localStorage y notifica eventos
     */
    saveItems(items) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
            window.dispatchEvent(new CustomEvent('cart:updated', { detail: { items } }));
        } catch (e) {
            console.error("Error al guardar carrito:", e);
        }
    },

    /**
     * Agrega un producto al carrito respetando el stock disponible
     */
    addItem(product, quantity = 1, selectedColor = "", selectedSize = "") {
        const items = this.getItems();
        
        // Identificador único según ID, color y talla seleccionada
        const itemKey = `${product.id}_${selectedColor || product.color || ''}_${selectedSize || product.talla || ''}`;
        const existingIndex = items.findIndex(item => item.itemKey === itemKey);

        const currentQty = existingIndex > -1 ? items[existingIndex].quantity : 0;
        const requestedTotal = currentQty + quantity;

        // Validar stock disponible
        if (product.stock > 0 && requestedTotal > product.stock) {
            return {
                success: false,
                message: `Solo quedan ${product.stock} unidades disponibles de este producto.`
            };
        }

        if (product.stock <= 0) {
            return {
                success: false,
                message: `Este producto se encuentra actualmente agotado.`
            };
        }

        if (existingIndex > -1) {
            items[existingIndex].quantity = requestedTotal;
        } else {
            items.push({
                itemKey,
                id: product.id,
                nombre: product.nombre,
                precio: product.precio,
                precioFinal: product.precioFinal,
                descuento: product.descuento,
                marca: product.marca,
                color: selectedColor || product.color,
                talla: selectedSize || product.talla,
                foto: product.fotos && product.fotos.length > 0 ? product.fotos[0] : "",
                stockMax: product.stock,
                quantity: quantity
            });
        }

        this.saveItems(items);
        return { success: true, message: `"${product.nombre}" agregado al pedido.` };
    },

    /**
     * Actualiza la cantidad de un producto
     */
    updateQuantity(itemKey, newQuantity) {
        let items = this.getItems();
        const itemIndex = items.findIndex(i => i.itemKey === itemKey);
        if (itemIndex === -1) return;

        if (newQuantity <= 0) {
            items.splice(itemIndex, 1);
        } else {
            const item = items[itemIndex];
            if (item.stockMax > 0 && newQuantity > item.stockMax) {
                newQuantity = item.stockMax;
            }
            item.quantity = newQuantity;
        }

        this.saveItems(items);
    },

    /**
     * Elimina un producto del carrito
     */
    removeItem(itemKey) {
        let items = this.getItems();
        items = items.filter(i => i.itemKey !== itemKey);
        this.saveItems(items);
    },

    /**
     * Vacía completamente el carrito
     */
    clearCart() {
        this.saveItems([]);
    },

    /**
     * Devuelve el total de unidades en el carrito
     */
    getTotalCount() {
        return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
    },

    /**
     * Calcula los totales financieros del carrito
     */
    getSummary() {
        const items = this.getItems();
        let subtotalOriginal = 0;
        let subtotalConDescuentos = 0;

        items.forEach(item => {
            subtotalOriginal += (item.precio * item.quantity);
            subtotalConDescuentos += (item.precioFinal * item.quantity);
        });

        const ahorroTotal = Math.max(0, subtotalOriginal - subtotalConDescuentos);

        return {
            itemCount: this.getTotalCount(),
            subtotalOriginal,
            ahorroTotal,
            totalFinal: subtotalConDescuentos
        };
    },

    /**
     * Formatea un valor monetario según la configuración
     */
    formatPrice(amount) {
        const num = Number(amount || 0).toFixed(2);
        return CONFIG.currencyPosition === "left"
            ? `${CONFIG.currencySymbol} ${num}`
            : `${num} ${CONFIG.currencySymbol}`;
    },

    /**
     * Genera y abre el enlace de WhatsApp con el pedido completo
     */
    sendOrderWhatsApp(customerData = {}) {
        const items = this.getItems();
        if (items.length === 0) {
            return { success: false, message: "El carrito está vacío." };
        }

        const summary = this.getSummary();
        let message = `🛒 *NUEVO PEDIDO - ${CONFIG.storeName.toUpperCase()}*\n`;
        message += `─────────────────────\n`;

        items.forEach((item, index) => {
            message += `*${index + 1}. ${item.nombre}*\n`;
            message += `   • Cantidad: *${item.quantity}* unidad(es)\n`;
            if (item.color) message += `   • Color: ${item.color}\n`;
            if (item.talla) message += `   • Talla/Medida: ${item.talla}\n`;
            if (item.marca) message += `   • Marca: ${item.marca}\n`;
            message += `   • Precio c/u: ${this.formatPrice(item.precioFinal)}`;
            if (item.descuento > 0) {
                message += ` _(${item.descuento}% OFF, antes ${this.formatPrice(item.precio)})_`;
            }
            message += `\n   • Subtotal: *${this.formatPrice(item.precioFinal * item.quantity)}*\n\n`;
        });

        message += `─────────────────────\n`;
        if (summary.ahorroTotal > 0) {
            message += `💰 Subtotal regular: ${this.formatPrice(summary.subtotalOriginal)}\n`;
            message += `🎉 *Ahorro total:* ${this.formatPrice(summary.ahorroTotal)}\n`;
        }
        message += `💵 *TOTAL A PAGAR: ${this.formatPrice(summary.totalFinal)}*\n`;
        message += `─────────────────────\n`;

        // Datos del cliente si los llenó
        if (customerData.name) {
            message += `👤 *Cliente:* ${customerData.name.trim()}\n`;
        }
        if (customerData.phone) {
            message += `📱 *Teléfono de contacto:* ${customerData.phone.trim()}\n`;
        }
        if (customerData.address) {
            message += `📍 *Dirección de entrega:* ${customerData.address.trim()}\n`;
        }
        if (customerData.notes) {
            message += `📝 *Notas adicionales:* ${customerData.notes.trim()}\n`;
        }

        message += `\n¿Me confirman disponibilidad y los métodos de pago? ¡Muchas gracias!`;

        const encodedMsg = encodeURIComponent(message);
        const cleanNumber = CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMsg}`;

        window.open(waUrl, '_blank');
        return { success: true };
    },

    /**
     * Consulta rápida de un solo producto por WhatsApp
     */
    inquireProductWhatsApp(product, quantity = 1, selectedColor = "", selectedSize = "") {
        let msg = `¡Hola *${CONFIG.storeName}*! 👋\n`;
        msg += `Estoy interesado/a en comprar este producto de su catálogo:\n\n`;
        msg += `🛍️ *${product.nombre}*\n`;
        msg += `🏷️ Código: *${product.id}*\n`;
        if (product.marca) msg += `🏷️ Marca: ${product.marca}\n`;
        if (selectedColor || product.color) msg += `🎨 Color: ${selectedColor || product.color}\n`;
        if (selectedSize || product.talla) msg += `📏 Talla/Medida: ${selectedSize || product.talla}\n`;
        msg += `💰 Precio: *${this.formatPrice(product.precioFinal)}*`;
        if (product.descuento > 0) {
            msg += ` _(Tiene ${product.descuento}% de descuento)_`;
        }
        msg += `\n📦 Cantidad que deseo: *${quantity}*\n\n`;
        msg += `¿Tienen stock disponible y cómo es el proceso de entrega?`;

        const encodedMsg = encodeURIComponent(msg);
        const cleanNumber = CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/${cleanNumber}?text=${encodedMsg}`;

        window.open(waUrl, '_blank');
    }
};
