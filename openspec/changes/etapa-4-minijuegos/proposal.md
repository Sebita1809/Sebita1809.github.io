# Etapa 4 — Minijuegos

## Qué y por qué

Implementar todos los minijuegos del juego. Se implementan uno por uno, testeando cada uno antes de pasar al siguiente. Todos se acceden desde la sala de actividades a través del ícono de juego de mesa.

## Minijuegos a implementar

### 1. 🔢 Sudoku
- Grilla clásica de 9x9
- Distintas dificultades (fácil, medio, difícil)
- Recompensa: monedas al completar

### 2. 💣 Buscaminas
- Grilla clásica con banderas y celdas
- Distintos tamaños/dificultades
- Recompensa: monedas al completar

### 3. ✝️ Crucigrama
- Palabras en español
- Distintas dificultades
- Recompensa: monedas al completar

### 4. 🔤 Sopa de letras
- Palabras ocultas en grilla de letras
- Distintas dificultades
- Recompensa: monedas al completar

### 5. 🎨 Pintar
- Lienzo con dibujo para colorear
- Paleta de colores
- Recompensa: monedas al completar

### 6. 🦌 Encuentra los bisontes y alces (Yellowstone)
**Escenario:** Vero en cabina de guardabosques con binoculares y cámara

**Mecánica:**
- Escanear el bosque deslizando la vista con los binoculares
- Bisontes y alces se mueven lentamente entre los árboles
- Tocar un animal para sacarle foto ✅
- Objetivo: fotografiar X bisontes + X alces

**Amenazas:**
1. Oso en el bosque que te ve → alerta 🚨 + cuenta regresiva → tocar máscara de oso para cubrirse 🐻 → si no reaccionás a tiempo: -1 corazón
2. Oso disfrazado de bisonte/alce → al hacerle zoom, gira la cabeza lentamente → si le sacás foto: flash te delata → -1 corazón
3. Sistema de 2 corazones

### 7. 🍔 El Buffet de Vero (cocina americana)
**Dinámica:** 1-2 pedidos simultáneos, comidas con múltiples pasos

**Platos:**
| Plato | Pasos |
|-------|-------|
| Hamburguesa | Cocinar carne → ensamblar toppings pedidos |
| Salchicha | Cocinar → pan → condimentos pedidos |
| Pizza | Armar masa → toppings → hornear → cortar porción |
| Ensalada | Lavar vegetales → cortar → armar con ingredientes pedidos |
| Bebida/postre | Seleccionar el correcto |

**Tiempos por plato:**
- Ensalada: ~60 seg
- Salchicha: ~90 seg
- Hamburguesa: ~2 min
- Pizza: ~3 min
- (Tiempo realista + margen cómodo)

**Peligro:** carne/salchicha se quema si se deja demasiado en la parrilla

### 8. 📚 Atrapada en el Libro
**Pantalla de selección:** Vero sentada en biblioteca con:
- Plantitas
- Taza de té con leche
- Ámbar con animaciones idle (dormir, estirarse, caminar)
- Estantería con libros disponibles
- Throne of Glass con candado dorado 🔒

**Libros disponibles:**
| Libro | Estado |
|-------|--------|
| 🐉 Fantasía (caballera vs dragón) | Disponible, fácil → difícil |
| 🔍 Misterio | Disponible, fácil → difícil |
| 🚀 Ciencia ficción | Disponible, fácil → difícil |
| 🏴‍☠️ Piratas | Disponible, fácil → difícil |
| 👑 Throne of Glass | 🔒 Desbloqueable al completar todos en todas las dificultades |

**Mecánica en-libro:**
- Momentos de acción (QTE): texto describe lo que pasa → ejecutar acción correcta antes del tiempo
- Momentos de decisión: 2-3 opciones → distintos finales
- Throne of Glass: libro más largo, más decisiones, Celaena como personaje acompañante

### 9. 🎀 Hacer Tela (tela acrobática)
**Modos de juego** (Vero elige al entrar):
| Modo | Mecánica |
|------|----------|
| 🎵 Ritmo | Tocar en el momento justo al ritmo de la música |
| 👆 Gestos | Swipes para subir, girar, enroscarse, poses |
| 🧠 Secuencia | Memorizar y repetir la serie de movimientos |
| ⚖️ Balance | Mantener equilibrio mientras ejecuta poses |
| 🎲 Libre | Mezcla aleatoria de los modos anteriores |

## Recompensas generales
- Monedas al completar cualquier minijuego
- Bonus por completar en dificultad alta
- Foto para el álbum al completar todos los libros (Etapa 5)

## Criterio de éxito
- Los 9 minijuegos son jugables y funcionales
- Cada uno tiene al menos 2 niveles de dificultad
- Recompensan monedas al completarse
- El acceso desde la sala de actividades funciona correctamente
