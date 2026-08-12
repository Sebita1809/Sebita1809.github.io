## ADDED Requirements

### Requirement: Pantalla principal de la cabaña
El sistema SHALL mostrar la cabaña como pantalla principal del juego, con su fondo ilustrado, los botones de navegación, la UI de stats y el acceso a configuración.

#### Scenario: Render de la cabaña
- **WHEN** se inicia CabinScene
- **THEN** se dibuja el fondo de la cabaña escalado a la altura de la pantalla
- **AND** se muestran los botones de navegación (cartel casa, cartel huerta), la UI de stats y el botón de engranaje

#### Scenario: Acceso a configuración
- **WHEN** el usuario toca el botón de engranaje
- **THEN** el engranaje gira 360° y se abre SettingsScene

### Requirement: Luz dinámica según la hora real
La cabaña SHALL ajustar su iluminación mediante un overlay de color según la hora real del dispositivo, actualizándose periódicamente.

#### Scenario: Iluminación diurna
- **WHEN** la hora del dispositivo está entre las 6 y las 18
- **THEN** el overlay aplica un tinte cálido tenue (baja opacidad)

#### Scenario: Iluminación de atardecer
- **WHEN** la hora del dispositivo está entre las 18 y las 22
- **THEN** el overlay aplica un tinte naranja de opacidad media

#### Scenario: Iluminación nocturna
- **WHEN** la hora del dispositivo está entre las 22 y las 6
- **THEN** el overlay aplica un tinte azul oscuro de mayor opacidad

#### Scenario: Refresco periódico
- **WHEN** transcurre el intervalo de actualización mientras la cabaña está activa
- **THEN** el overlay se recalcula según la hora actual sin recargar la escena
