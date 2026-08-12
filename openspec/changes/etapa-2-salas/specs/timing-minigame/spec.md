## ADDED Requirements

### Requirement: Barra de timing reutilizable
El juego SHALL proveer un componente reutilizable de barra de timing en el que un cursor se desplaza y el jugador debe tocar dentro de una zona objetivo, emitiendo un resultado de éxito o fallo. Lo usan Cocina (cocinar) y Baño (cepillar/enjuagar, tirar cadena, destapar).

#### Scenario: Acierto dentro de la zona objetivo
- **WHEN** el jugador toca mientras el cursor está dentro de la zona objetivo
- **THEN** el componente emite un resultado de éxito

#### Scenario: Fallo fuera de la zona objetivo
- **WHEN** el jugador toca mientras el cursor está fuera de la zona objetivo
- **THEN** el componente emite un resultado de fallo

#### Scenario: Reutilización entre salas
- **WHEN** una sala necesita una mecánica de timing
- **THEN** instancia el mismo componente con sus parámetros (posición, tamaño, zona objetivo, velocidad, callback de resultado) sin duplicar la lógica

### Requirement: Detección de gesto swipe reutilizable
El juego SHALL proveer un detector de gestos de swipe que reconozca dirección y distancia mínima sobre una zona, contando repeticiones o ciclando opciones. Lo usan Baño (frotar shampoo, ciclar peinados en el espejito).

#### Scenario: Swipe válido detectado
- **WHEN** el jugador arrastra el puntero superando la distancia mínima en una dirección
- **THEN** el detector registra el swipe y notifica su dirección

#### Scenario: Ciclar opciones con swipe
- **WHEN** el detector se configura para ciclar opciones y el jugador hace swipe
- **THEN** avanza a la opción siguiente o anterior según la dirección
