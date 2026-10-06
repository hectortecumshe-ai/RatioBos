<p align="center"><img src="logo.svg" width="96" alt="RatioBos"></p>

# RatioBos

**La razón al servicio del ganado · Reason in the service of cattle**

👉 **App:** https://hectortecumshe-ai.github.io/RatioBos/ (botón **ES / EN** para cambiar de idioma)

*Ratio* (latín): razón, cálculo, origen de la palabra «ración». *Bos*: bovino.

---

## Español

RatioBos formula raciones de **mínimo costo para bovinos productores de carne** en México: becerros en desarrollo, engorda en corral, vaquillas de reemplazo, vacas gestantes y vacas en lactancia. Es un solo archivo HTML que funciona en el navegador. No necesita instalación ni servidor, ningún dato sale de la computadora del usuario y no usa bibliotecas, fuentes ni mapas de terceros.

**Modelo nutricional**
- Sistema de energía neta de California, con las ecuaciones de NASEM (2016) y los ajustes de NRC (1996):
  - consumo;
  - energía de mantenimiento con raza, actividad y aclimatación;
  - energía retenida y proteína neta de ganancia;
  - proteína metabolizable (proteína microbiana + proteína no degradable);
  - gestación, lactancia, calcio y fósforo.
- Programación lineal (símplex en dos fases con certificado de dualidad).
- Ajuste iterativo de la energía y el consumo: la ENm supuesta debe coincidir con la de la ración.

**México por región**
- Mapa propio de las 32 entidades agrupadas en 9 regiones ganaderas.
- Datos por región:
  - clima por temporada;
  - suelos, razas, sistemas e insumos típicos;
  - precios regionales;
  - sulfatos del agua.
- Índice de temperatura y humedad, con sombra, piso y lodo.
- Adaptación del biotipo: británico, continental, cebú, cruza, criollo y lechero.

**Para el productor**
- Hoja del carro mezclador tal como se ofrece.
- Ganancia esperada y semáforo ruminal.
- Programa de engorda día a día, con utilidad, beneficio : costo y precio de equilibrio.
- Tablero con gráficas animadas:
  - parámetros logrados (GDP, eficiencia, conversión y B : C);
  - la ganancia que deja más dinero;
  - el mismo animal en las 9 regiones;
  - sensibilidad al precio del grano.

**Sostenibilidad (FAO)**
- Huella de la ración:
  - gases de efecto invernadero (IPCC 2019, GWP del AR6);
  - agua usada y agua gris;
  - tierra para producir el alimento;
  - superficie para aplicar el estiércol;
  - amoniaco;
  - medicamentos clasificados según la OMS.
- Formulación con precio al carbono y frontera costo–huella.

**Dos vistas**
- **Productor:** lenguaje sencillo.
- **Científico:**
  - modelo de programación lineal, precios sombra y costos reducidos;
  - iteraciones del ajuste de energía;
  - validación y referencias;
  - exportación del modelo en JSON.

**Validación**
- 9 artículos (2017–2025), 19 dietas publicadas y 27 grupos de animales.
- Errores medios frente a lo publicado:

  | Indicador | Error medio |
  |---|---|
  | Energía neta | 3.0 % |
  | Proteína cruda | 2.1 % |
  | Energía neta observada (método de Zinn) | 0.5 % |
  | Economía | 0.2 % |

- El optimizador iguala o abarata las 19 dietas publicadas.
- Coincide con HiGHS (SciPy) en 500 de 500 problemas aleatorios (carpeta [`pruebas`](pruebas)).
- Estudios regionales: CIPES Sonora, Sinaloa, Chihuahua, Zacatecas, Veracruz, Baja California y el grupo de Zinn en El Centro, California.

## English

RatioBos formulates **least-cost rations for beef cattle** in Mexico: growing calves, feedlot cattle, replacement heifers, pregnant cows and lactating cows. It is a single HTML file running in the browser. It needs no installation or server, no data leaves the user's computer, and it uses no third-party libraries, fonts or maps.

**Nutrition model**
- California Net Energy System, with NASEM (2016) equations and NRC (1996) adjustments:
  - intake;
  - maintenance energy with breed, activity and acclimation;
  - retained energy and net protein for gain;
  - metabolizable protein (microbial protein + rumen-undegradable protein);
  - pregnancy, lactation, calcium and phosphorus.
- Linear programming (two-phase simplex with a duality certificate).
- Iterative energy–intake adjustment: the assumed NEm must match the ration's own NEm.

**Mexico by region**
- Own map of the 32 states grouped into 9 cattle regions.
- Data for each region:
  - seasonal climate;
  - soils, breeds, systems and typical inputs;
  - regional prices;
  - water sulfates.
- Temperature-humidity index, with shade, pen floor and mud.
- Biotype adaptation: British, Continental, Zebu, crossbred, Criollo and dairy.

**For producers**
- As-fed mixer sheet.
- Expected gain and rumen traffic light.
- Day-by-day feeding program, with profit, benefit : cost and break-even price.
- Animated dashboard:
  - achieved performance (ADG, feed efficiency, feed conversion and B : C);
  - the most profitable gain;
  - the same animal in all 9 regions;
  - grain-price sensitivity.

**Sustainability (FAO)**
- Footprint of the ration:
  - greenhouse gases (IPCC 2019, AR6 GWP);
  - water use and grey water;
  - land to grow the feed;
  - land to spread manure;
  - ammonia;
  - medicines classified by WHO category.
- Formulation with a carbon price and a cost–footprint frontier.

**Two views**
- **Producer:** plain language.
- **Scientist:**
  - linear-programming model, shadow prices and reduced costs;
  - iterations of the energy adjustment;
  - validation and references;
  - JSON export of the model.

**Validation**
- 9 papers (2017–2025), 19 published diets and 27 animal groups.
- Mean errors against published values:

  | Indicator | Mean error |
  |---|---|
  | Net energy | 3.0 % |
  | Crude protein | 2.1 % |
  | Observed net energy (Zinn method) | 0.5 % |
  | Economics | 0.2 % |

- The optimizer matches or lowers the cost of all 19 published diets.
- Agrees with HiGHS (SciPy) on 500 of 500 random problems ([`pruebas`](pruebas) folder).
- Regional studies: CIPES Sonora, Sinaloa, Chihuahua, Zacatecas, Veracruz, Baja California and Zinn's group at El Centro, California.

## Desarrollo · Development

The sources are in `src/`. `build.ps1` joins them into `index.html`:

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1
```

## Cómo citar · How to cite

Mojica-Zárate, H. T., & Barrera-Guzmán, L. A. (2026). *RatioBos: Guided least-cost diet formulation for beef cattle* (Version 1.0.0) [Software]. https://github.com/hectortecumshe-ai/RatioBos

## Autores · Authors

Héctor Tecumshé Mojica Zárate · Luis Ángel Barrera Guzmán. MIT License.

> Herramienta de apoyo; los resultados deben ser revisados por un profesional en nutrición animal. · Decision-support tool; results should be reviewed by a qualified animal nutritionist.
