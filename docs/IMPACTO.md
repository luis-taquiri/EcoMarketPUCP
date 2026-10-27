# Metodología del impacto ecológico

## Fuente y alcance

Se utiliza la columna de fabricación de la mezcla actual de entradas del Exhibit 3-1, capítulo 3, de EPA (2006): `-0,28 MTCE/ton` para papel de oficina y `-0,60 MTCE/ton` para libros de texto. Los valores se contrastaron con el PDF original, no solo con el resumen proporcionado. No se suma el componente forestal ni se aplican factores a otros materiales.

Fuente primaria: [EPA, Source Reduction and Recycling, Exhibit 3-1](https://archive.epa.gov/epawaste/conserve/tools/warm/pdfs/chapter3.pdf).

Es una estimación educativa estadounidense histórica, no una medición de emisiones peruanas. Supone que el material recibido sustituye uno nuevo. No incluye desplazamientos ni la impresión original, y depende de declaraciones no verificadas de los participantes. No representa compensaciones certificadas.

## Cálculo

Conversión: `abs(MTCE) × (44 / 12) × 1000 / 907,18474`.

- Papel: factor redondeado a `1,13 kg CO₂e/kg`.
- Libro de texto: factor redondeado a `2,43 kg CO₂e/kg`.
- Hoja A4 de 80 g/m²: `0,210 × 0,297 × 80 = 4,9896 gramos`.
- Resultado: `peso en gramos × factor` produce gramos de CO₂e. Se redondea una vez al gramo más cercano y se almacena como entero; la pantalla muestra kg con dos decimales.

Ejemplo: 120 hojas A4 equivalen a 598,752 g. `598,752 × 1,13 = 676,58976 g CO₂e`, almacenados como 677 g y mostrados como aproximadamente 0,68 kg CO₂e.

En papel se declara un número de hojas físicas o peso, no ambos. Cuando se declara peso, las hojas equivalentes se calculan dividiendo por 4,9896 y tomando la parte entera. En libros solo se utiliza peso; no se inventan hojas a partir de páginas, tamaños o títulos. La cifra de hojas del panel no incluye libros.

## Cuándo se registra

Solo en `Trade → COMPLETED`, después de ambas confirmaciones. `ImpactEntry` se crea en la misma transacción que marca la entrega. El índice único de `listingId`, el upsert sin actualizaciones y la comprobación del estado completado impiden repetir el registro.

Se atribuye a quien entrega el material. Un trueque puede producir dos entradas, una para cada objeto y propietario. Una donación produce como máximo una. No se acredita otra vez al receptor ni al aceptar una propuesta, publicar, cancelar o dar una primera confirmación. El historial conserva peso, hojas, factor, resultado, método y fecha, sin recalcular con versiones futuras.

Los registros anteriores sin datos siguen sin estimación. No se inventan pesos para el catálogo existente. El seed incluye cantidades ficticias solo para publicaciones nuevas; no altera ejemplos ya existentes.

## Nivel de participación

- Semilla: cero hojas equivalentes registradas.
- Brote: de 1 a 199; meta Árbol en 200.
- Árbol: de 200 a 999; meta Bosque en 1000.
- Bosque: 1000 o más, progreso máximo.

Es una escala de participación, no una equivalencia con árboles. Para Brote se muestra el porcentaje sobre 200 hojas; 145 hojas son 72 % y faltan 55. El impacto de libros puede aumentar CO₂e sin aumentar hojas o nivel, porque no se convierten sus páginas a hojas A4.

El historial es privado de cada usuario. El número de intercambios completados incluye trueques y donaciones en los que participó, mientras que las estimaciones solo corresponden a materiales que entregó.

## Despliegue

La migración `20261027000300_material_impact` añade tres campos de publicación y una tabla; no borra usuarios, imágenes ni acuerdos existentes. No se modifican constantes para simular que el pasado tenía datos que nunca se recogieron.

Por indicación del usuario, no se ejecutaron pruebas de esta ampliación.
