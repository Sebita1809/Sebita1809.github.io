## ADDED Requirements

### Requirement: Cuatro stats con decaimiento temporal
El sistema SHALL modelar cuatro stats — Sueño, Hambre, Diversión y Glucemia — que disminuyen con el tiempo real transcurrido, acumulando el delta de cada frame.

#### Scenario: Decaimiento de Sueño, Hambre y Diversión
- **WHEN** transcurre el tiempo con el juego activo
- **THEN** Sueño baja 1 punto cada ~30s, Hambre 1 punto cada ~25s y Diversión 1 punto cada ~40s
- **AND** ninguna de estas stats baja de 0

#### Scenario: Independencia del framerate
- **WHEN** el update se llama con distintos deltas por frame
- **THEN** el ritmo de decaimiento depende del tiempo transcurrido acumulado, no de la cantidad de frames

### Requirement: Glucemia con rango acotado
La Glucemia SHALL fluctuar dentro de un rango acotado, sin llegar nunca a 0: con piso de 32 y techo de 200.

#### Scenario: Fluctuación con piso
- **WHEN** transcurre el tiempo
- **THEN** la Glucemia deriva levemente cada ~20s
- **AND** su valor nunca es menor a 32 ni mayor a 200

#### Scenario: Modificación externa acotada
- **WHEN** otro sistema ajusta la glucemia con `setGlucemia`
- **THEN** el valor resultante se limita al rango [32, 200]

### Requirement: UI de stats en pantalla
La cabaña SHALL mostrar las cuatro stats con un ícono y un indicador visual de nivel proporcional a su valor, actualizado en cada frame.

#### Scenario: Indicadores de nivel
- **WHEN** la cabaña está activa
- **THEN** cada stat muestra su ícono y un anillo de relleno proporcional a su valor
- **AND** el indicador de glucemia cambia de color según la zona (verde/amarillo/rojo)

### Requirement: Temblor de UI por glucemia baja
La UI SHALL temblar levemente cuando la glucemia está en su mínimo (≤32) para alertar al usuario.

#### Scenario: Temblor por glucemia crítica
- **WHEN** la glucemia es ≤32
- **THEN** el ícono de glucemia tiembla brevemente
