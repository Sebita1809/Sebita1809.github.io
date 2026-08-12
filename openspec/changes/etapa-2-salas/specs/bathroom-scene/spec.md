## ADDED Requirements

### Requirement: Escena del Baño con objetos y decoración
El Baño SHALL renderizar su fondo escalado con objetos interactivos (bañera, inodoro, espejito) y decoración fija (plantitas, luz cálida).

#### Scenario: Render del baño
- **WHEN** se inicia BathroomScene
- **THEN** se dibuja el fondo del baño escalado y se muestran bañera, inodoro y espejito como objetos interactivos, más la decoración fija

### Requirement: Bañarse en tres pasos
Bañarse SHALL constar de tres pasos —cepillar el pelo para desenredar (N barras de timing según el peinado), frotar shampoo (gesto swipe) y el resto del baño (barra de timing)— y subir la higiene al completarse.

#### Scenario: Cepillar el pelo
- **WHEN** el usuario inicia el baño
- **THEN** se presentan N barras de timing de cepillado según el peinado actual

#### Scenario: Frotar shampoo con swipe
- **WHEN** el usuario pasa la etapa de cepillado
- **THEN** el shampoo se frota mediante gestos de swipe sobre el pelo

#### Scenario: Baño completo sube la higiene
- **WHEN** el usuario completa el cepillado, el shampoo y la barra de timing final
- **THEN** la stat de higiene aumenta (depende de resolver la stat de higiene — ver design Open Questions)

### Requirement: Uso del inodoro
El inodoro SHALL permitir sentarse (con animación, carita colorada si corresponde), tirar la cadena (barra de timing) y, si se tapa, destaparlo con la sopapa (barra de timing).

#### Scenario: Sentarse en el inodoro
- **WHEN** el usuario toca el inodoro y elige sentarse
- **THEN** se reproduce la animación correspondiente (con carita colorada 😳 cuando aplica)

#### Scenario: Tirar la cadena
- **WHEN** el usuario tira la cadena
- **THEN** se resuelve con una barra de timing

#### Scenario: Destapar el inodoro
- **WHEN** el inodoro se tapa
- **THEN** aparece la sopapa y se destapa mediante una barra de timing

### Requirement: Elegir peinado en el espejito
El espejito SHALL permitir seleccionar un peinado ciclando opciones con gestos de swipe.

#### Scenario: Ciclar peinados
- **WHEN** el usuario hace swipe sobre el espejito
- **THEN** el peinado seleccionado cambia a la siguiente/anterior opción del ciclo

### Requirement: Volver a la cabaña desde el baño
El Baño SHALL ofrecer un botón para volver a la cabaña.

#### Scenario: Volver
- **WHEN** el usuario toca "← Volver"
- **THEN** se inicia CabinScene y se lanza MapScene
