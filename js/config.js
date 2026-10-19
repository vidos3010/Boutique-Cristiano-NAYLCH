/**
 * ====================================================================
 * CONFIGURACIÓN DE TU TIENDA ONLINE
 * ====================================================================
 * Puedes personalizar todos los datos de tu negocio en este archivo.
 */

const CONFIG = {
    // 1. Información del Negocio
    storeName: "Boutique Cristiano NAYLCH",
    storeSlogan: "Moda, elegancia y distinción con propósito",
    storeLogo: "https://drive.google.com/file/d/1zwTblzHGj573u-5-bjp9N1Gjmp4jx2n6/view?usp=sharing",

    // 2. Contacto y WhatsApp (IMPORTANTE: Código de país sin el signo +, ej: 51 para Perú, 52 para México, etc.)
    whatsappNumber: "51987654321", // Reemplaza con tu número de WhatsApp real
    whatsappGreeting: "¡Hola! Visité tu tienda online y me gustaría hacer una consulta.",

    // 3. Moneda y Formato
    currencySymbol: "S/", // Puedes cambiar a "$", "USD", "€", "Bs.", etc.
    currencyPosition: "left", // 'left' para S/ 100 o 'right' para 100 S/

    // 4. Conexión con Google Sheets
    // Coloca aquí el ID de tu Google Sheet (la parte larga entre /d/ y /edit en la URL)
    // Ejemplo: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
    googleSheetId: "1frEdxo_VbBfhKxutKffI523p29-gPLHp", // ID de tu Google Sheet conectado

    // Nombre de la pestaña de la hoja (por defecto suele ser 'Hoja 1' o 'Productos')
    googleSheetTabName: "Productos",

    // 5. Redes Sociales (Opcional, deja vacío si no usas)
    socialLinks: {
        instagram: "https://instagram.com",
        facebook: "https://facebook.com",
        tiktok: "https://tiktok.com"
    },

    // 6. Costo de Envío / Mensaje
    shippingNote: "Envíos a todo el país. Coordinamos la entrega por WhatsApp.",

    // 7. Productos de Demostración (Se muestran si aún no has conectado tu Google Sheet)
    demoProducts: [
        {
            id: "PROD-001",
            nombre: "Vestido Floral de Verano",
            categoria: "Ropa",
            marca: "Zara",
            color: "Azul Floral, Blanco",
            talla: "S, M, L",
            descripcion: "Hermoso vestido de corte evasé con estampado floral suave, tela fresca de lino y algodón. Ideal para días soleados y salidas casuales.",
            precio: 120.00,
            descuento: 25, // 25% de descuento
            stock: 8,
            fotos: [
                "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80"
            ],
            destacado: true,
            estado: "activo"
        },
        {
            id: "PROD-002",
            nombre: "Cartera Elegante de Cuero Sintético",
            categoria: "Accesorios",
            marca: "Michael Kors Style",
            color: "Beige, Negro, Café",
            talla: "Mediana (28x20 cm)",
            descripcion: "Cartera espaciosa con compartimentos internos para celular y maquillaje. Incluye correa ajustable para llevarla al hombro.",
            precio: 150.00,
            descuento: 15,
            stock: 4,
            fotos: [
                "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80"
            ],
            destacado: true,
            estado: "activo"
        },
        {
            id: "PROD-003",
            nombre: "Zapatillas Urbanas Chunky Confort",
            categoria: "Calzado",
            marca: "Puma Style",
            color: "Blanco / Rosa Pastel",
            talla: "36, 37, 38, 39",
            descripcion: "Suela de amortiguación alta, súper livianas y cómodas para caminar todo el día con estilo.",
            precio: 180.00,
            descuento: 0, // Sin descuento
            stock: 12,
            fotos: [
                "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"
            ],
            destacado: false,
            estado: "activo"
        },
        {
            id: "PROD-004",
            nombre: "Set de Brochas Profesionales x12",
            categoria: "Maquillaje",
            marca: "Beauty Glam",
            color: "Oro Rosa",
            talla: "Estuche incluido",
            descripcion: "Cerdas ultra suaves sintéticas, no absorben producto en exceso. Incluye estuche cilíndrico de viaje.",
            precio: 85.00,
            descuento: 20,
            stock: 0, // Agotado
            fotos: [
                "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
            ],
            destacado: false,
            estado: "activo"
        },
        {
            id: "PROD-005",
            nombre: "Gafas de Sol Polarizadas UV400",
            categoria: "Accesorios",
            marca: "Ray Trendy",
            color: "Negro brillante, Carey",
            talla: "Estándar",
            descripcion: "Protección total UV400 contra los rayos solares. Marco resistente y liviano con acabados dorados.",
            precio: 65.00,
            descuento: 10,
            stock: 15,
            fotos: [
                "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80"
            ],
            destacado: true,
            estado: "activo"
        },
        {
            id: "PROD-006",
            nombre: "Casaca Denim Oversize Vintage",
            categoria: "Ropa",
            marca: "Urban Street",
            color: "Azul Celeste Lavado",
            talla: "Única (Oversize)",
            descripcion: "Casaca clásica de jean con bolsillos frontales y botones metálicos de alta durabilidad.",
            precio: 140.00,
            descuento: 0,
            stock: 3,
            fotos: [
                "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80"
            ],
            destacado: false,
            estado: "activo"
        }
    ]
};
