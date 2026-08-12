## ADDED Requirements

### Requirement: Escena del Dormitorio con objetos y decoración
El Dormitorio SHALL renderizar su fondo escalado con objetos interactivos (cama, armario con puerta abierta, espejo, bultito de ropa sucia) y decoración fija (escritorio, estantería con libros, ventana con luz dinámica, cuadrito del hipopótamo con tutú).

#### Scenario: Render del dormitorio
- **WHEN** se inicia BedroomScene
- **THEN** se dibuja el fondo del dormitorio escalado y se muestran cama, armario, espejo y ropa sucia como objetos, más la decoración fija

#### Scenario: Ventana con luz dinámica
- **WHEN** cambia la hora real del dispositivo
- **THEN** la ventana del dormitorio ajusta su luz solar de forma acorde

### Requirement: Ropa sucia baja la higiene
El bultito de ropa sucia SHALL representar acumulación que reduce la higiene mientras esté presente.

#### Scenario: Ropa sucia acumulada
- **WHEN** hay ropa sucia acumulada en el dormitorio
- **THEN** la stat de higiene se ve afectada negativamente (depende de resolver la stat de higiene — ver design Open Questions)

### Requirement: Dormir sola
El Dormitorio SHALL permitir a Vero dormir sola: Vero se acuesta y Ámbar sube a los pies de la cama, subiendo la stat de sueño.

#### Scenario: Dormir sola sube el sueño
- **WHEN** el usuario elige dormir sola
- **THEN** Vero se acuesta en la cama y Ámbar aparece a los pies
- **AND** la stat de sueño aumenta

### Requirement: Dormir con Seba
El Dormitorio SHALL ofrecer dormir con Seba mediante una secuencia guionada (un dron aparece con una caja con estampilla y banderita argentina, la caja se rompe, aparece Seba, se abrazan), subiendo sueño y diversión.

#### Scenario: Secuencia de dormir con Seba
- **WHEN** el usuario elige dormir con Seba
- **THEN** se reproduce la secuencia del dron con la caja, la caja se rompe y aparece Seba
- **AND** Vero y Seba se abrazan
- **AND** aumentan las stats de sueño y de diversión

### Requirement: Acceso al armario (customización de ropa)
El armario SHALL ser el punto de acceso al sistema de customización de ropa, cuyo desarrollo corresponde a la Etapa 3.

#### Scenario: Abrir el armario
- **WHEN** el usuario toca el armario
- **THEN** se abre el acceso a la customización de ropa (funcionalidad completa diferida a Etapa 3)

### Requirement: Volver a la cabaña desde el dormitorio
El Dormitorio SHALL ofrecer un botón para volver a la cabaña.

#### Scenario: Volver
- **WHEN** el usuario toca "← Volver"
- **THEN** se inicia CabinScene y se lanza MapScene
