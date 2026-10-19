# 🛍️ Boutique Cristiano NAYLCH - Tienda Online

Catálogo web moderno, elegante y totalmente interactivo para la venta de productos, sincronizado en tiempo real con **Google Sheets** (gestión de inventario, precios, descuentos y stock) y **Google Drive** (almacenamiento de fotos de alta resolución).

---

## ✨ Características Principales

- **Gestión 100% en la Nube:** Administra productos, precios, colores, marcas y stock desde tu hoja de cálculo de Google Sheets.
- **Slider de Productos Destacados:** Carrusel interactivo automático que resalta las mejores ofertas y productos estrella.
- **Cuadrícula Visual de 3 Columnas:** Visualización espaciosa adaptada para móviles y computadoras.
- **Control de Inventario en Tiempo Real:** Muestra badges de disponibilidad (*"X disponibles"*, *"¡Últimas unidades!"* o *"Agotado"*).
- **Cálculo Automático de Descuentos:** Descuentos porcentuales con insignia de oferta, precio anterior tachado y ahorro calculado.
- **Galería Multi-Foto:** Permite una o varias fotos por producto almacenadas directamente en Google Drive.
- **Pedidos Directos por WhatsApp:**
  - Consulta rápida e individual por cada producto.
  - Carrito de compras ("Mi Pedido") con cálculo automático de totales y formulario de entrega.
- **Sin Dependencias de Servidor:** Funciona como Single Page Application (HTML5, Tailwind CSS, Lucide Icons y Vanilla JS).

---

## 📁 Estructura del Proyecto

```text
├── index.html                   # Página principal de la tienda
├── css/
│   └── styles.css               # Estilos personalizados y animaciones
├── js/
│   ├── config.js                # Configuración de WhatsApp, nombre y Sheet ID
│   ├── sheets.js                # Lector JSONP de Google Sheets y CDN de Drive
│   ├── cart.js                  # Gestor de carrito y generador de pedidos WhatsApp
│   └── app.js                   # Lógica de interfaz, filtros y slider
├── Productos_Nayely_Store.xlsx  # Plantilla Excel lista para subir a Google Drive
├── plantilla_productos.csv      # Plantilla en formato CSV
└── INSTRUCCIONES_GOOGLE_SHEETS.md # Guía paso a paso de uso
```

---

## 🚀 Despliegue Gratis con GitHub Pages

Puedes activar tu tienda en internet gratis usando **GitHub Pages**:

1. En tu repositorio de GitHub, ve a **Settings** (Configuración).
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. En **Build and deployment** &rarr; **Branch**, selecciona la rama `main` (carpeta `/root`).
4. Haz clic en **Save** (Guardar).
5. En unos segundos tendrás tu enlace público listo para compartir con tus clientes.

---

© 2026 Boutique Cristiano NAYLCH. Todos los derechos reservados.
