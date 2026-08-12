## ADDED Requirements

### Requirement: Crecimiento de plantas en tiempo real
El sistema SHALL modelar el crecimiento de cada especie con su tiempo real (Lechuga 30 min, Zanahoria 1 h, Tomate 2 h, Remolacha 2 h, Frutilla 3 h, Choclo 4 h, Mandarina 6 h, Naranja 6 h, Manzana 8 h, Sandía 12 h) derivando la madurez por comparación contra el reloj real.

#### Scenario: Madurez derivada del reloj real
- **WHEN** se consulta el estado de una planta
- **THEN** la planta está lista si el tiempo transcurrido desde el instante de plantado alcanza o supera el tiempo de crecimiento de su especie

#### Scenario: Tiempos por especie
- **WHEN** se planta una especie
- **THEN** su tiempo de crecimiento corresponde al de la tabla del proposal

### Requirement: Persistencia del estado de la huerta
El sistema SHALL persistir el estado de los canteros (especie, instante de plantado, estado de riego, tiempo de crecimiento) de forma que sobreviva al cierre de la app, y crecer aunque la app haya estado cerrada.

#### Scenario: El progreso sobrevive al cierre
- **WHEN** el usuario cierra la app con plantas creciendo y vuelve a abrirla después
- **THEN** el estado de cada cantero se recupera y la madurez se recalcula contra el reloj actual (una planta puede haber quedado lista mientras la app estaba cerrada)

### Requirement: Aviso de planta lista
El sistema SHALL exponer qué plantas están listas para cosechar, de modo que puedan señalarse al usuario (aviso in-game en esta etapa; notificación push nativa diferida a Etapa 5).

#### Scenario: Consulta de plantas listas
- **WHEN** se consultan las plantas listas
- **THEN** se devuelven todos los canteros cuya planta alcanzó su tiempo de crecimiento
