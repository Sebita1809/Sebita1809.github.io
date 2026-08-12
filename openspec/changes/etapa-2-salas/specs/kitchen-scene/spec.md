## ADDED Requirements

### Requirement: Escena de la Cocina con fondo y ventana dinámica
La Cocina SHALL renderizar su fondo ilustrado escalado a la altura de la pantalla y una ventana cuyo color simula el cielo según la hora real del dispositivo. El fondo NO SHALL tener productos de comida dibujados sobre la mesada (mesada despejada), porque los productos se representan como datos del inventario, no como sprites fijos del fondo.

#### Scenario: Render del fondo
- **WHEN** se inicia KitchenScene
- **THEN** se dibuja `cocina_fondo` escalado por la altura de la pantalla y centrado horizontalmente
- **AND** la mesada se muestra despejada, sin productos de comida dibujados encima

#### Scenario: Cielo de día
- **WHEN** la hora del dispositivo está entre las 6 y las 18
- **THEN** la ventana muestra un celeste diurno

#### Scenario: Cielo de atardecer
- **WHEN** la hora del dispositivo está entre las 18 y las 22
- **THEN** la ventana muestra un naranja de atardecer

#### Scenario: Cielo de noche
- **WHEN** la hora del dispositivo está entre las 22 y las 6
- **THEN** la ventana muestra un azul nocturno

#### Scenario: Refresco periódico del cielo
- **WHEN** transcurre el intervalo de actualización mientras la Cocina está activa
- **THEN** el color de la ventana se recalcula según la hora actual

### Requirement: Accesos interactivos a Heladera, Alacena y Recetario
La Cocina SHALL reutilizar sus 3 zonas interactivas existentes (heladera, mercadería/estantes, hornito) con feedback de hover, cada una abriendo un panel modal sobre el inventario de datos compartido: la heladera abre el inventario de categoría `heladera`, la mercadería el de categoría `alacena`, y el hornito el Recetario.

#### Scenario: Feedback de hover
- **WHEN** el puntero entra sobre una zona interactiva con acción
- **THEN** la zona crece de forma sutil con una animación y muestra cursor de mano
- **AND** vuelve a su tamaño original cuando el puntero sale

#### Scenario: Abrir el inventario de la heladera
- **WHEN** el usuario toca la heladera
- **THEN** se abre un panel modal (overlay oscuro + panel redondeado + botón cerrar) que lista los productos del inventario de categoría `heladera` con su ícono, nombre y cantidad

#### Scenario: Abrir el inventario de la alacena
- **WHEN** el usuario toca la mercadería/estantes
- **THEN** se abre un panel modal que lista los productos del inventario de categoría `alacena` con su ícono, nombre y cantidad

#### Scenario: Abrir el Recetario
- **WHEN** el usuario toca el hornito
- **THEN** se abre el Recetario como panel modal con las 5 recetas del catálogo

#### Scenario: Cerrar un panel modal
- **WHEN** el usuario toca el botón cerrar del panel o el overlay oscuro
- **THEN** el panel se cierra y vuelve la escena de la cocina

### Requirement: Recetario con cocinar según inventario
El Recetario SHALL mostrar las 5 recetas con sus ingredientes marcados como disponibles (verde) o faltantes (gris) según el inventario, y habilitar el botón "Cocinar" de una receta solo cuando todos sus ingredientes estén completos. Cocinar SHALL dispararse con una única barra de timing: al acertar se consume 1 unidad de cada ingrediente y sube el hambre según la receta; al fallar no se consume nada.

#### Scenario: Ingredientes disponibles vs. faltantes
- **WHEN** se muestra una receta en el Recetario
- **THEN** cada ingrediente se marca en verde si hay stock suficiente en el inventario y en gris si falta

#### Scenario: Botón Cocinar habilitado
- **WHEN** todos los ingredientes de una receta están disponibles
- **THEN** el botón "Cocinar" de esa receta está habilitado

#### Scenario: Botón Cocinar deshabilitado
- **WHEN** a una receta le falta al menos un ingrediente
- **THEN** el botón "Cocinar" de esa receta está deshabilitado

#### Scenario: Cocinar con timing exitoso
- **WHEN** el usuario cocina una receta y acierta la barra de timing
- **THEN** se consume 1 unidad de cada ingrediente de la receta
- **AND** el hambre sube según el valor de la receta (más que comer rápido)

#### Scenario: Cocinar con timing fallido
- **WHEN** el usuario cocina una receta y falla la barra de timing
- **THEN** no se consume ningún ingrediente
- **AND** el hambre no cambia

### Requirement: Panel fijo de comer rápido
La Cocina SHALL mostrar un panel fijo (siempre visible, no modal) con flechas `◀ ▶` para ciclar entre los productos del inventario marcados como comestibles directos, mostrando el ícono grande del producto actual y un botón "Comer" que consume 1 unidad, sube el hambre poco, aplica un cooldown corto y muestra un texto flotante.

#### Scenario: Ciclar productos con las flechas
- **WHEN** el usuario toca `◀` o `▶` en el panel de comer rápido
- **THEN** el panel avanza al producto anterior/siguiente del inventario comestible directo y muestra su ícono grande

#### Scenario: Comer un producto
- **WHEN** el usuario toca "Comer" y no hay cooldown activo y hay stock del producto actual
- **THEN** se consume 1 unidad del producto, el hambre sube poco y aparece un texto flotante (p.ej. "+8 🍽️") que se desvanece hacia arriba
- **AND** se aplica un cooldown corto antes de poder volver a comer

#### Scenario: Sin productos comestibles disponibles
- **WHEN** no hay ningún producto comestible directo con stock en el inventario
- **THEN** el panel de comer rápido indica que no hay nada para comer y el botón "Comer" queda deshabilitado

### Requirement: Catálogo cerrado de productos y recetas
La Cocina SHALL apoyarse en un catálogo cerrado de 24 productos y 5 recetas definido como datos, donde cada producto declara su categoría (`heladera`, `alacena`, `cosecha`, `plato`) y si es comestible directo o ingrediente de receta. El inventario de productos es compartido con la Huerta (lo cosechado cae al mismo inventario).

#### Scenario: Producto comestible directo vs. ingrediente de receta
- **WHEN** un producto está marcado como comestible directo (p.ej. Yogur, Manzana, Galletitas)
- **THEN** aparece disponible en el panel de comer rápido
- **AND** un producto marcado solo como ingrediente de receta (p.ej. Huevos, Hamburguesas crudas) NO aparece en el panel de comer rápido

#### Scenario: Los platos preparados no son stock comprable
- **WHEN** se cocina una receta
- **THEN** el plato preparado (categoría `plato`) se genera y se consume al servírselo a Vero, sin acumularse como stock en el inventario

### Requirement: Ámbar duerme sobre la heladera
La Cocina SHALL mostrar a Ámbar durmiendo siempre sobre la heladera.

#### Scenario: Ámbar presente
- **WHEN** se inicia KitchenScene
- **THEN** el sprite `ambar_dormida` aparece apoyado sobre la parte visible de la heladera

### Requirement: Volver a la cabaña desde la cocina
La Cocina SHALL ofrecer un botón para volver a la cabaña.

#### Scenario: Volver
- **WHEN** el usuario toca "← Volver"
- **THEN** se inicia CabinScene y se lanza MapScene
