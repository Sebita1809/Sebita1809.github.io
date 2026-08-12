## ADDED Requirements

### Requirement: Personaje de Vero con set de expresiones
El sistema SHALL definir el personaje de Vero como sprite con un conjunto de expresiones: feliz, cansada, aburrida, débil, colorada y sorprendida, además de la pose idle.

#### Scenario: Generación de expresiones
- **WHEN** se solicita una expresión de Vero
- **THEN** existe una textura correspondiente (idle, feliz, cansada, aburrida, debil, colorada, sorprendida)

### Requirement: Selección de expresión según stats
El sistema SHALL determinar la expresión prioritaria de Vero a partir del estado de las stats.

#### Scenario: Prioridad de expresión
- **WHEN** se consulta la expresión según las stats
- **THEN** glucemia≤32 devuelve 'colorada', si no Sueño bajo devuelve 'cansada', si no Hambre baja 'debil', si no Diversión baja 'aburrida'
- **AND** si todas las stats están bien devuelve idle (sin expresión de alerta)

### Requirement: Vero visible en la cabaña con expresión reactiva
La cabaña SHALL mostrar el sprite de Vero en pantalla y actualizar su expresión automáticamente según el estado de las stats.

#### Scenario: Vero en pantalla
- **WHEN** se inicia la cabaña
- **THEN** el sprite de Vero es visible en la escena

#### Scenario: Cambio automático de expresión
- **WHEN** una stat cruza su umbral de alerta
- **THEN** la expresión de Vero mostrada cambia a la expresión prioritaria correspondiente
