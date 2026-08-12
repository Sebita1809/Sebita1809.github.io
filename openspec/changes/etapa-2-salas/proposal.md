# Etapa 2 — Salas

## Qué y por qué

Implementar las 5 áreas de la cabaña con sus objetos, decoración y mecánicas de interacción. Cada sala afecta las stats de Vero de una forma diferente.

## Salas a implementar

### 🍳 Cocina
**Objetos interactivos:**
- Heladera (con Ámbar durmiendo encima siempre)
- Hornito
- Microondas
- Cafetera
- Estantes de mercadería (se vacían con el uso, señal de ir a comprar)
- Ventana con luz dinámica

**Mecánicas:**
- Comer rápido: agarrar algo directo de la heladera/estantes → sube hambre
- Cocinar: seleccionar plato → barrita de timing por cada paso → sube hambre mejor que comer rápido
- Platos disponibles: según ingredientes en estantes
- La carne/salchicha se puede quemar si se deja demasiado tiempo

### 🛏️ Dormitorio
**Objetos interactivos:**
- Cama
- Armario (puerta abierta, se ve ropa colgada)
- Espejo
- Bultito de ropa sucia (acumulación baja higiene)

**Decoración fija:**
- Escritorio
- Estantería llena de libros
- Ventana con luz solar dinámica
- Cuadrito en la pared: hipopótamo con tutú bailando ballet

**Mecánicas:**
- Dormir sola → Vero se acuesta → Ámbar sube a los pies de la cama → sube stat de sueño
- Dormir con Seba → dron aparece con caja 📦 (estampilla + banderita argentina 🇦🇷) → caja se rompe → aparece Seba → se abrazan → sube sueño + diversión
- Armario → sistema de customización de ropa (ver Etapa 3)

### 🚿 Baño
**Objetos interactivos:**
- Bañera
- Inodoro
- Espejito

**Decoración fija:**
- Plantitas
- Luz cálida

**Mecánicas:**
- Bañarse:
  1. Cepillar el pelo para desenredar (N barras según peinado)
  2. Frotar shampoo en el pelo (gesto swipe)
  3. Resto del baño (barrita de timing)
  → sube higiene
- Inodoro:
  - Sentarse → animación (si hace popó: carita colorada 😳)
  - Tirar cadena → barrita de timing
  - Si se tapa → aparece sopapa → barrita de timing para destapar
- Espejito → seleccionar peinado (swipe para ciclar opciones)

### 🎮 Sala de actividades
**Objetos decorativos** (no clickeables individualmente):
- Estantería de libros
- Caballete con pinturas
- Computadora/tablet
- Tela colgando del techo
- Binoculares y cámara en repisa
- Minicarrito de food truck (juguete)

**Objeto interactivo:**
- Ícono de juego de mesa → abre menú de minijuegos (implementados en Etapa 4)

### 🌱 Huerta (área exterior)
**Mecánicas:**
- Comprar semillas (con monedas)
- Plantar en canteros
- Regar plantas
- Cosechar cuando estén listas → va al inventario de la cocina

**Tiempos de crecimiento:**
| Planta | Tiempo |
|--------|--------|
| Lechuga | 30 min |
| Zanahoria | 1 hora |
| Tomate | 2 horas |
| Remolacha | 2 horas |
| Frutilla | 3 horas |
| Choclo | 4 horas |
| Mandarina | 6 horas |
| Naranja | 6 horas |
| Manzana | 8 horas |
| Sandía | 12 horas |

- Notificación push cuando una planta está lista para cosechar

## Criterio de éxito
- Todas las salas se pueden visitar y tienen sus objetos
- Las mecánicas básicas de cada sala funcionan y afectan las stats
- Ámbar aparece en la cocina y en la escena de dormir
- La huerta planta, crece y cosecha correctamente
