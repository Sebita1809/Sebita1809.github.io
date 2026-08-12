## ADDED Requirements

### Requirement: Escena de la Huerta (área exterior)
La Huerta SHALL renderizar su fondo exterior escalado con los canteros donde se plantan y crecen las semillas.

#### Scenario: Render de la huerta
- **WHEN** se inicia GardenScene
- **THEN** se dibuja el fondo exterior escalado y se muestran los canteros con el estado actual de sus plantas

### Requirement: Comprar semillas
La Huerta SHALL permitir comprar semillas usando monedas.

#### Scenario: Comprar una semilla
- **WHEN** el usuario compra una semilla y tiene monedas suficientes
- **THEN** la semilla queda disponible para plantar y se descuentan las monedas (la economía de monedas y el inventario se definen en design Open Questions)

### Requirement: Plantar en canteros
La Huerta SHALL permitir plantar una semilla disponible en un cantero libre, registrando el momento de plantado.

#### Scenario: Plantar una semilla
- **WHEN** el usuario planta una semilla en un cantero libre
- **THEN** el cantero pasa a estado "creciendo" y se registra el instante de plantado

### Requirement: Regar plantas
La Huerta SHALL permitir regar las plantas.

#### Scenario: Regar una planta
- **WHEN** el usuario riega un cantero con una planta creciendo
- **THEN** la planta queda regada y su estado visual lo refleja

### Requirement: Cosechar cuando la planta está lista
La Huerta SHALL permitir cosechar una planta que alcanzó su tiempo de crecimiento, enviando el producto al inventario de la cocina.

#### Scenario: Cosechar planta madura
- **WHEN** el usuario cosecha un cantero cuya planta ya está lista
- **THEN** el producto se agrega al inventario de la cocina y el cantero queda libre

#### Scenario: No se puede cosechar antes de tiempo
- **WHEN** el usuario intenta cosechar una planta que aún no completó su tiempo de crecimiento
- **THEN** la cosecha no ocurre

### Requirement: Volver a la cabaña desde la huerta
La Huerta SHALL ofrecer un botón para volver a la cabaña.

#### Scenario: Volver
- **WHEN** el usuario toca "← Volver"
- **THEN** se inicia CabinScene y se lanza MapScene
