# Etapa 5 — Progresión, cierre y empaquetado

## Qué y por qué

Implementar el sistema de progresión (álbum de fotos), los logros, música, notificaciones, configuración de idioma y finalmente empaquetar el juego como app mobile con Capacitor.

## Qué incluye esta etapa

### 📸 Álbum de fotos (sistema de progresión)
- Álbum físico pixel art con tapas decoradas
- Cada página tiene decoración única según el contexto de la foto
- Las fotos se muestran en **formato pixel art** por defecto
- Efecto **Reveal**: mantener presionada la foto → transición suave pixel art → foto real → soltar → vuelve a pixel
- Las fotos (en formato pixel) las provee el usuario con contexto para definir la decoración de cada página

**Logros que desbloquean fotos:**
| Logro | Descripción |
|-------|-------------|
| 3 videollamadas completadas | + collar compartido desbloqueado |
| Primera cosecha de la huerta | |
| Completar todos los libros en todas las dificultades | + Throne of Glass desbloqueado |
| Completar todos los minijuegos | |
| 30 días jugados | |
| Subir todas las stats al máximo el mismo día | |
| Medirse la glucemia 10 veces | |
| Primera vez que Seba llega en la caja | |
| Tener todos los modos de Hacer Tela completados | |

### 🏆 Sistema de logros
- Pantalla de logros con todos los disponibles
- Indicador de progreso en logros incompletos
- Notificación cuando se desbloquea un logro

### 🪙 Sistema de monedas (revisión final)
- Verificar que todos los puntos de ganancia funcionan:
  - Completar minijuegos ✓
  - Subir una stat al máximo ✓
  - Cosechar de la huerta ✓
- Verificar que todos los puntos de gasto funcionan:
  - Supermercado ✓
  - Tienda de ropa ✓
  - Vivero ✓
  - Pet shop ✓
  - Farmacia (con receta DAMSU) ✓

### 🎵 Música y sonidos
- Música chill de fondo que no sature (loop)
- Efectos de sonido para interacciones principales
- Opción de apagar música/sonidos en configuración

### 🔔 Notificaciones push
- Stat baja → notificación en el celular
- Glucemia fuera de rango → notificación urgente
- Huerta lista para cosechar → notificación
- Llamada de Seba → notificación
- Logro desbloqueado → notificación

### ⚙️ Pantalla de configuración
- Idioma: Español (default) / Inglés
- Música: on/off + volumen
- Sonidos: on/off
- Notificaciones: on/off por tipo

### 📱 Empaquetado con Capacitor
1. Instalar y configurar Capacitor
2. Configurar para Android e iOS
3. Ajustar permisos (notificaciones push, almacenamiento local)
4. Generar APK para Android (para que Vero lo instale)
5. Probar en dispositivo real

## Criterio de éxito
- El álbum de fotos muestra las fotos con el efecto reveal funcionando
- Los logros se desbloquean correctamente y notifican
- La música suena sin saturar
- Las notificaciones push llegan al celular
- El idioma cambia correctamente en toda la UI
- La app se instala en Android y funciona completamente offline
