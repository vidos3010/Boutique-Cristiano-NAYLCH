# 📋 Guía Completa: Cómo usar Google Sheets y Google Drive para tu Tienda Online

Esta guía te explica paso a paso cómo gestionar todos tus productos, precios, ofertas, inventario y fotos usando únicamente **Google Sheets** y **Google Drive**.

---

## 🚀 Paso 1: Crear tu Hoja en Google Sheets

1. Abre tu navegador y ve a [Google Sheets (Hojas de cálculo de Google)](https://sheets.google.com).
2. Crea una nueva hoja en blanco llamada por ejemplo: `Inventario Nayely Store`.
3. **Importar la plantilla lista:**
   - Haz clic en **Archivo** &rarr; **Importar** &rarr; pestaña **Subir**.
   - Selecciona el archivo `plantilla_productos.csv` que está en esta carpeta.
   - Elige *"Reemplazar hoja de cálculo"* y haz clic en *"Importar datos"*.

### 📌 Columnas Requeridas y qué significa cada una:

| Columna | Descripción | Ejemplo |
| :--- | :--- | :--- |
| **id** | Código único de tu producto (SKU) | `PROD-001`, `VEST-01` |
| **nombre** | Nombre comercial que verá el cliente | `Vestido Floral de Verano` |
| **categoria** | Categoría para agrupar y filtrar automáticamente | `Ropa`, `Calzado`, `Accesorios` |
| **marca** | Marca del producto | `Zara`, `Nike`, `Propia` |
| **color** | Colores disponibles | `Blanco, Negro, Rosa pastel` |
| **talla** | Tallas o dimensiones | `S, M, L` o `36, 37, 38` |
| **descripcion** | Detalles, material y beneficios | `Tela fresca 100% algodón...` |
| **precio** | Precio regular (solo números y punto) | `120.00` |
| **descuento** | Porcentaje de descuento (0 si no tiene) | `20` (calcula el 20% OFF automáticamente) |
| **stock** | Cantidad de unidades disponibles | `5` (Si es `0`, se muestra como "Agotado") |
| **fotos** | Enlace(s) de Google Drive separados por comas | `https://drive.google.com/file/d/1ABC.../view` |
| **destacado** | Si quieres resaltarlo como oferta Top | `SI` o `NO` |
| **estado** | Para mostrarlo u ocultarlo temporalmente | `activo` o `inactivo` |

---

## 📷 Paso 2: Cómo Subir y Obtener las Fotos en Google Drive

La página web convierte automáticamente los enlaces de Google Drive en imágenes visibles en alta calidad. Para que funcione correctamente, sigue estos pasos:

1. Ve a tu [Google Drive](https://drive.google.com/).
2. Crea una carpeta llamada `Fotos Productos Tienda`.
3. **Permiso Público para las fotos (¡MUY IMPORTANTE!):**
   - Haz clic derecho en la carpeta `Fotos Productos Tienda` &rarr; selecciona **Compartir** &rarr; **Compartir**.
   - En *Acceso general*, cambia de *"Restringido"* a:  
     👉 **"Cualquier persona con el enlace"** con rol **"Lector"**.
   - Haz clic en **Hecho**. *(Al hacer pública la carpeta, todas las fotos que subas dentro serán visibles automáticamente).*
4. Sube las fotos de tus productos a esa carpeta.
5. Para cada foto:
   - Haz clic derecho sobre la imagen en Drive &rarr; **Compartir** &rarr; **Copiar enlace**.
   - El enlace será algo como:  
     `https://drive.google.com/file/d/1h7A9Z_exampleID12345/view?usp=sharing`
6. Pega ese enlace en la columna **`fotos`** de tu hoja de cálculo.
   - **¿Tiene más de una foto el producto?** Simplemente pega los enlaces separados por una coma `,`:
     ```text
     https://drive.google.com/file/d/ID_FOTO_1/view, https://drive.google.com/file/d/ID_FOTO_2/view
     ```
   - La página creará automáticamente una galería deslizable para que el cliente vea todas las fotos.

---

## 🔗 Paso 3: Compartir la Hoja de Google Sheets

Para que la página web pueda leer los productos en tiempo real:

1. En tu hoja de Google Sheets, haz clic en el botón verde **Compartir** (esquina superior derecha).
2. En la sección **Acceso general**, cambia de *"Restringido"* a:  
   👉 **"Cualquier persona con el enlace"** con rol **"Lector"**.
3. Haz clic en **Copiar enlace**.

El enlace tendrá una estructura como esta:
```text
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing
```
El ID de tu hoja es la parte entre `/d/` y `/edit`:  
👉 `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

---

## ⚙️ Paso 4: Conectar la Hoja con tu Página Web

Tienes dos formas súper fáciles de conectarlo:

### Opción A (Desde la misma página web - Recomendada):
1. Abre tu página web (`index.html`).
2. En la barra superior, haz clic en el botón verde **Google Sheets**.
3. Pega el enlace o el ID de tu hoja.
4. Presiona **"Guardar y Cargar Productos"**. ¡Listo!

### Opción B (En el archivo `js/config.js`):
1. Abre el archivo `js/config.js` con cualquier editor de texto o código.
2. Busca la línea:
   ```javascript
   googleSheetId: "",
   ```
3. Coloca el ID de tu hoja entre las comillas:
   ```javascript
   googleSheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
   ```
4. También puedes cambiar tu número de WhatsApp en la línea:
   ```javascript
   whatsappNumber: "51931670843", // Tu número de WhatsApp (+51 931 670 843)
   ```
5. Guarda el archivo y refresca tu navegador.

---

## 🔄 ¿Cómo Actualizar Precios o Stock en el Día a Día?

- Cuando cambies un precio, apliques una oferta o se termine el stock de un producto, **solo edita tu Google Sheet**.
- En tu página web, presiona el botón **Recargar (icono de flechas circulares)** o actualiza la página y verás los cambios reflejados al instante, sin tener que tocar ningún código.

---

## 📲 Pedidos por WhatsApp

- Los clientes pueden añadir múltiples productos al carrito y pulsar **"Enviar Pedido a WhatsApp"**.
- El sistema les genera un mensaje con el detalle de los productos, cantidades, colores, precios con descuento, total calculado y sus datos de entrega.
- También tienen el botón directo **"Consultar por WhatsApp"** en cada producto si desean preguntar por una unidad en particular.
