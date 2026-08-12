# Etapa 3 — Mecánicas especiales

## Qué y por qué

Implementar las mecánicas más personales y únicas del juego: el sistema de glucemia, las videollamadas con Seba, las interacciones con Ámbar, el sistema de customización y la ciudad.

## Mecánicas a implementar

### 🩸 Sistema de glucemia completo
- Alerta periódica: "¡Hora de medirse!" 🔔
- Animación de sacar el glucómetro
- Barrita de timing para el pinchazo en el dedo
- Resultado mostrado en pantalla del glucómetro:
  - 🟢 En rango → todo bien
  - 🔴 Baja (≤70) → ir a la cocina a comer algo rápido
  - 🔴 Alta (≥180) → aplicarse insulina
- Si no se mide cuando aparece la alerta → la glucemia sigue subiendo/bajando sin aviso

**Mecánica de insulina:**
1. Aparece la pen de insulina en pantalla
2. Se muestra la dosis indicada según el nivel de glucemia
3. La pen tiene una ventanita con número
4. Girar la parte de atrás (gesto circular) hasta llegar a la dosis indicada
5. Presionar y deslizar hacia abajo (scroll inverso) para inyectar

### 📱 Videollamadas con Seba
- Notificación aleatoria: "¡Seba te está llamando!" 📲
- Pantalla de videollamada: Seba de un lado, Vero del otro
- Expresiones de Seba según el tema: feliz, coqueto, emocionado, hablando
- Opciones de respuesta para Vero (diálogos al azar por tema)
- Temas al azar: gym, programación, Ámbar, trabajo de Vero, Yellowstone, coqueteo, conquista
- Efecto en stats: sube diversión
- Collar compartido: se desbloquea tras 3 videollamadas completadas

### 😺 Interacciones con Ámbar
- Acariciarla (gesto de swipe sobre el sprite)
- Darle de comer (desde el pet shop o la cocina)
- Cambiarle el collar (desde el pet shop)
- Comprarle juguetes (desde el pet shop)
- Ámbar tiene sus propias animaciones: caminar, comer, jugar, dormir

### 👗 Sistema de customización
**Ropa:**
- Capas separadas: ropa interior, ropa superior, ropa inferior, zapatillas
- Cambio de ropa interior con pantalla discreta (penumbra/mampara)
- Ropa se compra en tienda de la ciudad

**Peinados:**
- Paso 1: elegir accesorio (vinchita o gomita)
- Paso 2: elegir peinado (suelto, colita, trenzas, trenzita al costado, rodete, con flequillo)
- Dificultad de desenredar según peinado:
  - Suelto / colita: 1 barra
  - Trenzita al costado: 2 barras
  - Rodete: 2 barras
  - Trenzas completas: 3 barras

**Accesorios:**
- Aritos, pulseras, collares (varios con piedritas de colores)
- Collar compartido (corazón): desbloqueado tras 3 videollamadas, no se compra

### 🚌 Ciudad y compras
**Animación de ida:**
- Vero sale con bolso → sube al bus → el bosque de Yellowstone pasa por la ventana → llega a la ciudad

**Locales:**
| Local | Qué se compra |
|-------|--------------|
| 🛒 Supermercado | Comida e ingredientes |
| 👗 Tienda de ropa | Ropa y accesorios |
| 🌱 Vivero | Semillas para la huerta |
| 🐱 Pet shop | Collares y juguetes para Ámbar, comida de gata |
| 💊 Farmacia | Insulina, insumos médicos (con receta de DAMSU) |

## Criterio de éxito
- El sistema de glucemia alerta, mide e inyecta correctamente
- Las videollamadas aparecen al azar y desbloquean el collar tras 3
- Ámbar responde a las interacciones
- La customización de ropa y peinados funciona con todas sus capas
- La ciudad se puede visitar y los locales venden sus items
