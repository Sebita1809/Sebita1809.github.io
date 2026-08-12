## ADDED Requirements

### Requirement: Runtime de Phaser mobile-first
El juego SHALL inicializarse con Phaser 3 en una resolución vertical de 390×844 px, con escalado FIT y centrado, y renderizado en modo pixel art (sin antialiasing).

#### Scenario: Arranque del juego
- **WHEN** se carga `index.html` en un navegador
- **THEN** se crea una instancia de `Phaser.Game` con `width: 390`, `height: 844`, `scale.mode: FIT`, `render.pixelArt: true`
- **AND** el canvas se centra y escala manteniendo la proporción vertical

#### Scenario: Escenas registradas
- **WHEN** se construye la configuración del juego
- **THEN** se registran las escenas BootScene, CabinScene, MapScene, SettingsScene, KitchenScene, BedroomScene, BathroomScene, ActivityScene y GardenScene
- **AND** BootScene es la primera escena en ejecutarse

### Requirement: Carga centralizada de assets
El sistema SHALL cargar todos los assets (fondos, íconos de stats, UI, sprites de personajes) en un único punto de precarga antes de iniciar el juego.

#### Scenario: Precarga con barra de progreso
- **WHEN** BootScene ejecuta su fase `preload`
- **THEN** se muestra una barra de carga que avanza según el progreso
- **AND** al completarse la carga, se instancia el StatsSystem en el registry y se inicia CabinScene

#### Scenario: Filtro de textura por tipo de asset
- **WHEN** BootScene termina de cargar
- **THEN** los fondos e íconos de alta resolución quedan con filtro LINEAR (suavizado)
- **AND** los sprites de pixel art quedan con filtro NEAREST

### Requirement: Estado compartido entre escenas
El sistema SHALL exponer el estado de stats como un objeto único compartido entre todas las escenas mediante el registry de Phaser.

#### Scenario: Recuperar stats en una escena
- **WHEN** cualquier escena necesita leer o modificar las stats
- **THEN** obtiene la misma instancia de StatsSystem con `this.registry.get('stats')`
- **AND** los cambios son visibles para las demás escenas
