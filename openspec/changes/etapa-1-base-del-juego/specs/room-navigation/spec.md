## ADDED Requirements

### Requirement: Mapita de navegación entre salas
El sistema SHALL ofrecer un mapita modal desde la cabaña que liste las salas de la casa y permita navegar a cada una.

#### Scenario: Abrir el mapita
- **WHEN** el usuario toca el cartel de la casa en la cabaña
- **THEN** la cabaña se pausa y se abre MapScene como overlay modal
- **AND** se listan las salas: Cocina, Dormitorio, Baño, Sala de actividades y Huerta

#### Scenario: Navegar a una sala
- **WHEN** el usuario selecciona una sala del mapita
- **THEN** se aplica una transición de fade y se inicia la escena de esa sala
- **AND** la cabaña y el mapita se detienen

#### Scenario: Cerrar el mapita
- **WHEN** el usuario toca el botón de cerrar del mapita
- **THEN** MapScene se detiene y la cabaña se reanuda en el estado en que estaba

### Requirement: Botón "Ir a la ciudad" deshabilitado
El mapita SHALL mostrar un acceso "Ir a la ciudad" visualmente deshabilitado, indicando que llega en una etapa posterior.

#### Scenario: Ciudad próximamente
- **WHEN** se muestra el mapita
- **THEN** el botón "Ir a la ciudad" aparece atenuado con la leyenda "(próximamente)"
- **AND** no navega a ninguna escena al tocarlo

### Requirement: Animación de Vero caminando al elegir sala
Al seleccionar una sala, el sistema SHALL reproducir una animación de Vero caminando antes de la transición a la sala.

#### Scenario: Caminata previa a la transición
- **WHEN** el usuario selecciona una sala en el mapita
- **THEN** Vero reproduce la animación de caminata (frames vero_walk)
- **AND** al terminar la animación se realiza la transición a la sala
