## ADDED Requirements

### Requirement: Escena de la Sala de actividades con decoración
La Sala de actividades SHALL renderizar su fondo escalado con decoración fija no clickeable (estantería de libros, caballete con pinturas, computadora/tablet, tela colgando del techo, binoculares y cámara en repisa, minicarrito de food truck).

#### Scenario: Render de la sala de actividades
- **WHEN** se inicia ActivityScene
- **THEN** se dibuja el fondo escalado y se muestra la decoración fija sin que los objetos decorativos sean clickeables individualmente

### Requirement: Acceso a los minijuegos
La Sala de actividades SHALL presentar un ícono de juego de mesa que abre el menú de minijuegos; los minijuegos en sí corresponden a la Etapa 4.

#### Scenario: Abrir el menú de minijuegos
- **WHEN** el usuario toca el ícono de juego de mesa
- **THEN** se abre el menú de minijuegos (los minijuegos se implementan en Etapa 4; el menú puede quedar como acceso "próximamente")

### Requirement: Volver a la cabaña desde la sala de actividades
La Sala de actividades SHALL ofrecer un botón para volver a la cabaña.

#### Scenario: Volver
- **WHEN** el usuario toca "← Volver"
- **THEN** se inicia CabinScene y se lanza MapScene
