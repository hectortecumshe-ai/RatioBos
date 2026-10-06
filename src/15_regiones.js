"use strict";
/* =====================================================================
   3b. REGIONES GANADERAS DE MÉXICO / MEXICAN CATTLE REGIONS
   Clima por temporada (temperatura media, máxima media y humedad relativa) estimado de
   las normales climatológicas del SMN-CONAGUA para las ciudades de referencia; suelos
   según la carta edafológica de INEGI; sistemas y razas según SIAP (2024) y la literatura
   regional. Los factores de precio son estimaciones relativas (producción local, flete e
   importación por la frontera o los puertos): sustitúyelos con tus cotizaciones.
   ===================================================================== */
const TEMPORADAS = {
  seca:{es:'Seca y caliente (abr–jun)',en:'Dry and hot (Apr–Jun)'},
  lluvias:{es:'Lluvias (jul–oct)',en:'Rainy (Jul–Oct)'},
  fresca:{es:'Fresca (nov–mar)',en:'Cool (Nov–Mar)'}
};
const REGIONES = {
  NO:{ n:{es:'Noroeste',en:'Northwest'}, edos:['MX-BCN','MX-BCS','MX-SON','MX-SIN'], color:'#e0a13c', ref:'Culiacán · Hermosillo · Mexicali',
    clima:{es:'Seco muy cálido (BWh, BSh); veranos con 40–45 °C y costa húmeda en Sinaloa.',en:'Very hot and dry (BWh, BSh); summers of 40–45 °C and a humid coast in Sinaloa.'},
    t:{seca:[27,37,35], lluvias:[30,36,70], fresca:[19,28,50]},
    suelo:{es:'Aluviales y vertisoles en los valles de riego; xerosoles y suelos salinos en el desierto. Agua de pozo a veces rica en sulfatos.',en:'Alluvial soils and vertisols in irrigated valleys; xerosols and saline soils in the desert. Well water sometimes high in sulfates.'},
    razas:{es:'Cruzas europeo × cebú, Angus y Hereford (becerro de exportación en Sonora), Charolais, Beefmaster, machos Holstein.',en:'European × zebu crosses, Angus and Hereford (export calves in Sonora), Charolais, Beefmaster, Holstein males.'},
    sistema:{es:'La mayor concentración de engordas intensivas del país (Sinaloa, Sonora): corrales tecnificados con hojueleado al vapor, sombra y carro repartidor. Vaca-becerro en agostadero.',en:'The country’s largest cluster of intensive feedlots (Sinaloa, Sonora): technified pens with steam-flaking, shade and feed trucks. Cow–calf on rangeland.'},
    insumos:{es:'Maíz y sorgo de Sinaloa, trigo de Sonora, semilla de algodón y alfalfa del valle de Mexicali, rastrojo abundante.',en:'Corn and sorghum from Sinaloa, wheat from Sonora, cottonseed and alfalfa from the Mexicali valley, plenty of stover.'},
    retos:{es:'Estrés calórico severo en verano: sombra de 2.5–4 m² por animal o domo con abanicos (Avendaño-Reyes et al., 2025). Revisar sulfatos del agua.',en:'Severe summer heat stress: 2.5–4 m² of shade per head or a dome with fans (Avendaño-Reyes et al., 2025). Check water sulfates.'},
    precio:{maizr:0.93,maizh:0.93,maize:0.93,sorgor:0.95,sorgoh:0.95,trigo:0.92,algodon:0.85,alfalfa:0.90,rastrojo:0.85,soya44:1.00,soya48:1.00,ddgs:0.97,melaza:1.05,pasto:1.20},
    sel:['maizh','sorgor','rastrojo','alfalfa','algodon','soya44','melaza','urea','carbonato','sal','premezcla'], sAgua:400 },
  NN:{ n:{es:'Norte árido',en:'Arid north'}, edos:['MX-CHH','MX-COA','MX-DUR'], color:'#c99b5e', ref:'Chihuahua · Torreón · Durango',
    clima:{es:'Semiárido templado (BSk, BWk): veranos calurosos, inviernos con heladas y gran oscilación diaria.',en:'Temperate semi-arid (BSk, BWk): hot summers, frosty winters and wide daily swings.'},
    t:{seca:[24,33,25], lluvias:[25,32,50], fresca:[12,21,40]},
    suelo:{es:'Calcisoles y xerosoles alcalinos; pastizales de agostadero. Agua con sulfatos y, en La Laguna, arsénico y flúor.',en:'Alkaline calcisols and xerosols; native rangeland. Water with sulfates and, in La Laguna, arsenic and fluoride.'},
    razas:{es:'Angus, Hereford, Charolais, Brangus, Criollo de Rodeo (Chihuahua); machos Holstein en La Laguna.',en:'Angus, Hereford, Charolais, Brangus, Rarámuri Criollo (Chihuahua); Holstein males in La Laguna.'},
    sistema:{es:'Vaca-becerro extensivo y becerro de exportación; engordas en Chihuahua y La Laguna ligadas a la cuenca lechera.',en:'Extensive cow–calf and export calves; feedlots in Chihuahua and La Laguna linked to the dairy basin.'},
    insumos:{es:'Alfalfa, ensilaje de maíz y semilla de algodón de La Laguna; DDGS y pasta de soya importados por la frontera.',en:'Alfalfa, corn silage and cottonseed from La Laguna; DDGS and soybean meal imported across the border.'},
    retos:{es:'Frío invernal (sube el mantenimiento), sequías recurrentes y agua con sales. Suplementar en agostadero en el estiaje.',en:'Winter cold (raises maintenance), recurrent droughts and salty water. Supplement on rangeland in the dry season.'},
    precio:{alfalfa:0.82,ensmaiz:0.88,algodon:0.85,ddgs:0.88,soya44:0.96,soya48:0.96,canola:0.95,maizr:1.00,sorgor:1.00,pasto:1.30,melaza:1.10},
    sel:['maizr','sorgor','alfalfa','ensmaiz','algodon','ddgs','soya44','urea','carbonato','sal','premezcla'], sAgua:600 },
  NE:{ n:{es:'Noreste',en:'Northeast'}, edos:['MX-NLE','MX-TAM'], color:'#d98c4a', ref:'Monterrey · Cd. Victoria · Reynosa',
    clima:{es:'Semiárido a subhúmedo cálido (BSh, Cfa); veranos largos y húmedos cerca del Golfo.',en:'Semi-arid to warm subhumid (BSh, Cfa); long, humid summers near the Gulf.'},
    t:{seca:[27,34,55], lluvias:[28,34,65], fresca:[17,24,65]},
    suelo:{es:'Vertisoles y castañozems profundos: la principal zona sorguera del país (Tamaulipas).',en:'Deep vertisols and kastanozems: the country’s main sorghum belt (Tamaulipas).'},
    razas:{es:'Beefmaster, Brahman, Simbrah, Charbray, Santa Gertrudis, cruzas F1.',en:'Beefmaster, Brahman, Simbrah, Charbray, Santa Gertrudis, F1 crosses.'},
    sistema:{es:'Vaca-becerro en praderas de buffel y engordas medianas; exportación de becerros.',en:'Cow–calf on buffelgrass pastures and mid-size feedlots; calf exports.'},
    insumos:{es:'Sorgo abundante y barato, DDGS y pasta de soya por la frontera.',en:'Plentiful cheap sorghum, DDGS and soybean meal across the border.'},
    retos:{es:'Calor con humedad (ITH alto) de mayo a septiembre; garrapata en la planicie costera.',en:'Humid heat (high THI) from May to September; ticks on the coastal plain.'},
    precio:{sorgor:0.86,sorgoh:0.88,maizr:1.02,ddgs:0.90,soya44:0.97,soya48:0.97,pasto:0.95,melaza:1.00},
    sel:['sorgor','maizr','rastrojo','ensmaiz','ddgs','soya44','melaza','urea','carbonato','sal','premezcla'], sAgua:300 },
  CN:{ n:{es:'Centro-norte (altiplano)',en:'North-central highlands'}, edos:['MX-ZAC','MX-SLP','MX-AGU'], color:'#b5d98b', ref:'Zacatecas · San Luis Potosí · Aguascalientes',
    clima:{es:'Semiárido templado de altura (BSk, 1,800–2,400 m): días templados y noches frías.',en:'Temperate high-altitude semi-arid (BSk, 1,800–2,400 m): mild days and cold nights.'},
    t:{seca:[19,28,30], lluvias:[19,26,60], fresca:[13,22,45]},
    suelo:{es:'Castañozems y xerosoles; agricultura de temporal (frijol, maíz, avena).',en:'Kastanozems and xerosols; rainfed farming (beans, corn, oats).'},
    razas:{es:'Charolais, Angus, Simmental, Criollo y cruzas.',en:'Charolais, Angus, Simmental, Criollo and crosses.'},
    sistema:{es:'Vaca-becerro y engordas medianas; la cuenca lechera de Aguascalientes aporta machos Holstein.',en:'Cow–calf and mid-size feedlots; the Aguascalientes dairy basin supplies Holstein males.'},
    insumos:{es:'Heno y ensilaje de avena, rastrojo de maíz y de frijol, maíz.',en:'Oat hay and silage, corn and bean stover, corn.'},
    retos:{es:'Heladas y escasez de forraje en invierno; poca agua.',en:'Frost and winter forage shortage; little water.'},
    precio:{avena:0.85,ensavena:0.88,rastrojo:0.90,maizr:1.00,sorgor:1.02,soya44:1.02,pasto:1.25,melaza:1.08},
    sel:['maizr','sorgor','avena','rastrojo','ensavena','soya44','urea','carbonato','sal','premezcla'], sAgua:250 },
  OB:{ n:{es:'Occidente y Bajío',en:'West and Bajío'}, edos:['MX-JAL','MX-NAY','MX-COL','MX-MIC','MX-GUA','MX-QUE'], color:'#5f9a4a', ref:'Guadalajara · Querétaro · Celaya · Morelia',
    clima:{es:'Templado subhúmedo en el Bajío (Cwa, ≈ 1,800 m) y cálido subhúmedo en la costa (Aw).',en:'Temperate subhumid in the Bajío (Cwa, ≈ 1,800 m) and warm subhumid on the coast (Aw).'},
    t:{seca:[23,32,30], lluvias:[22,28,70], fresca:[17,26,50]},
    suelo:{es:'Vertisoles fértiles de riego y temporal; luvisoles en la sierra.',en:'Fertile irrigated and rainfed vertisols; luvisols in the sierra.'},
    razas:{es:'Charolais, Simmental, Suizo europeo y americano, cruzas con cebú en la costa.',en:'Charolais, Simmental, Braunvieh and Brown Swiss, zebu crosses on the coast.'},
    sistema:{es:'Jalisco es líder en producción de carne en canal; engordas de todos los tamaños y doble propósito en la costa.',en:'Jalisco leads carcass-beef production; feedlots of every size and dual purpose on the coast.'},
    insumos:{es:'Maíz de Jalisco, sorgo del Bajío, rastrojo, alfalfa, ensilaje y melaza de los ingenios.',en:'Corn from Jalisco, Bajío sorghum, stover, alfalfa, silage and sugar-mill molasses.'},
    retos:{es:'Lodo en temporada de lluvias si los corrales no drenan; calor en la costa.',en:'Mud in the rainy season if pens do not drain; heat on the coast.'},
    precio:{maizr:0.95,maizh:0.95,sorgor:0.92,sorgoh:0.94,rastrojo:0.92,alfalfa:0.95,ensmaiz:0.95,melaza:0.88,soya44:1.00,ddgs:1.00},
    sel:['maizr','sorgor','rastrojo','alfalfa','ensmaiz','soya44','melaza','urea','carbonato','sal','premezcla'], sAgua:150 },
  CE:{ n:{es:'Centro (altiplano)',en:'Central highlands'}, edos:['MX-MEX','MX-DIF','MX-HID','MX-TLA','MX-PUE','MX-MOR'], color:'#8fb3a5', ref:'Toluca · Pachuca · Puebla · Tlaxcala',
    clima:{es:'Templado subhúmedo de altura (Cwb, 2,200–2,600 m): fresco todo el año, heladas invernales.',en:'High-altitude temperate subhumid (Cwb, 2,200–2,600 m): cool all year, winter frost.'},
    t:{seca:[17,25,45], lluvias:[16,22,75], fresca:[13,21,55]},
    suelo:{es:'Andosoles y feozems volcánicos; minifundio agrícola.',en:'Volcanic andosols and phaeozems; smallholder farming.'},
    razas:{es:'Machos Holstein de las cuencas lecheras, Suizo, Charolais y cruzas.',en:'Holstein males from the dairy basins, Brown Swiss, Charolais and crosses.'},
    sistema:{es:'Engordas pequeñas y medianas cerca de los grandes mercados de consumo (Ciudad de México).',en:'Small and mid-size feedlots near the large consumer markets (Mexico City).'},
    insumos:{es:'Avena forrajera, ensilaje de maíz, maíz, alfalfa del Valle del Mezquital.',en:'Forage oats, corn silage, corn, alfalfa from the Mezquital valley.'},
    retos:{es:'Frío y lluvias (lodo); granos más caros que en el norte por el flete.',en:'Cold and rain (mud); grains costlier than in the north due to freight.'},
    precio:{maizr:1.05,maizh:1.05,sorgor:1.05,avena:0.88,ensavena:0.90,ensmaiz:0.95,alfalfa:0.92,soya44:1.02,ddgs:1.04,pasto:1.10,melaza:1.05},
    sel:['maizr','avena','ensmaiz','alfalfa','rastrojo','soya44','urea','carbonato','sal','premezcla'], sAgua:100 },
  GT:{ n:{es:'Golfo (trópico húmedo)',en:'Gulf (humid tropics)'}, edos:['MX-VER','MX-TAB'], color:'#3b6aa0', ref:'Veracruz · Villahermosa · Tuxpan',
    clima:{es:'Cálido húmedo (Am, Af): lluvias abundantes, humedad de 75–90 % y calor todo el año.',en:'Warm humid (Am, Af): heavy rain, 75–90 % humidity and heat all year.'},
    t:{seca:[28,34,75], lluvias:[28,33,85], fresca:[23,28,80]},
    suelo:{es:'Acrisoles y ultisoles ácidos, gleysoles inundables (Tabasco): forrajes pobres en fósforo y calcio.',en:'Acid acrisols and ultisols, flood-prone gleysols (Tabasco): forages low in phosphorus and calcium.'},
    razas:{es:'Cebú (Brahman, Indubrasil, Gyr, Guzerat, Nelore, Sardo Negro), Suizo × cebú de doble propósito, Beefmaster.',en:'Zebu (Brahman, Indubrasil, Gyr, Guzerat, Nellore, Sardo Negro), Brown Swiss × zebu dual purpose, Beefmaster.'},
    sistema:{es:'Veracruz tiene el mayor inventario bovino del país: vaca-becerro y doble propósito en pastoreo; finalización en corral o en pradera con suplemento.',en:'Veracruz holds the country’s largest cattle inventory: cow–calf and dual purpose on pasture; finishing in pens or on pasture with supplement.'},
    insumos:{es:'Pastos (estrella, guinea, brachiarias), caña y melaza de los ingenios, pollinaza; el grano llega de fuera y es más caro.',en:'Grasses (star, guinea, brachiaria), sugarcane and mill molasses, poultry litter; grain comes from elsewhere and costs more.'},
    retos:{es:'Calor húmedo (ITH alto) y lodo en lluvias: prefiere biotipos cebú o cruzas, sombra y corrales con piso firme.',en:'Humid heat (high THI) and mud in the rains: prefer zebu or crossbred biotypes, shade and firm-floored pens.'},
    precio:{maizr:1.12,maizh:1.12,maize:1.10,sorgor:1.10,sorgoh:1.12,trigo:1.12,soya44:1.05,soya48:1.05,ddgs:1.10,alfalfa:1.20,avena:1.20,pasto:0.70,melaza:0.80,pollinaza:0.90,rastrojo:1.10},
    sel:['maizr','sorgor','pasto','melaza','pollinaza','soya44','urea','carbonato','sal','premezcla'], sAgua:50 },
  PS:{ n:{es:'Pacífico Sur',en:'South Pacific'}, edos:['MX-GRO','MX-OAX','MX-CHP'], color:'#9b4f2e', ref:'Acapulco · Oaxaca · Tuxtla Gutiérrez',
    clima:{es:'Cálido subhúmedo (Aw) en costas y valles con una sequía larga de noviembre a mayo; templado en las sierras.',en:'Warm subhumid (Aw) on coasts and valleys with a long dry season from November to May; temperate in the sierras.'},
    t:{seca:[29,35,60], lluvias:[28,33,80], fresca:[26,32,65]},
    suelo:{es:'Regosoles y leptosoles de ladera, luvisoles; pendientes que aumentan el gasto de caminar.',en:'Hillside regosols and leptosols, luvisols; slopes that raise walking costs.'},
    razas:{es:'Cebú, cruzas con Suizo y Simmental, criollos.',en:'Zebu, crosses with Brown Swiss and Simmental, criollos.'},
    sistema:{es:'Extensivo y doble propósito en pastoreo; Chiapas es gran productor de becerros para las engordas del norte y del centro.',en:'Extensive and dual-purpose grazing; Chiapas is a major supplier of calves to northern and central feedlots.'},
    insumos:{es:'Pastos, rastrojo, melaza, pollinaza; concentrados caros por el flete.',en:'Grasses, stover, molasses, poultry litter; costly concentrates due to freight.'},
    retos:{es:'Sequía prolongada (falta forraje), calor y terreno accidentado.',en:'Long drought (forage shortage), heat and rugged terrain.'},
    precio:{maizr:1.08,maizh:1.10,sorgor:1.08,soya44:1.08,soya48:1.08,ddgs:1.12,alfalfa:1.25,pasto:0.75,melaza:0.90,rastrojo:0.95},
    sel:['maizr','sorgor','pasto','rastrojo','melaza','soya44','urea','carbonato','sal','premezcla'], sAgua:50 },
  PY:{ n:{es:'Península de Yucatán',en:'Yucatán Peninsula'}, edos:['MX-CAM','MX-YUC','MX-ROO'], color:'#e8935f', ref:'Mérida · Campeche · Chetumal',
    clima:{es:'Cálido subhúmedo (Aw) con lluvias de verano; calor intenso de abril a septiembre.',en:'Warm subhumid (Aw) with summer rains; intense heat from April to September.'},
    t:{seca:[29,36,60], lluvias:[28,33,80], fresca:[23,29,75]},
    suelo:{es:'Leptosoles kársticos pedregosos y poco profundos: forrajes y suelos pobres en fósforo y cobre.',en:'Shallow, stony karst leptosols: forages and soils low in phosphorus and copper.'},
    razas:{es:'Cebú (Brahman, Nelore), cruzas con Suizo y Charolais, Beefmaster.',en:'Zebu (Brahman, Nellore), crosses with Brown Swiss and Charolais, Beefmaster.'},
    sistema:{es:'Vaca-becerro en pastoreo de guinea y brachiarias; engordas crecientes que aprovechan el sorgo de Campeche y la pollinaza de la avicultura yucateca.',en:'Cow–calf grazing guinea and brachiaria grasses; growing feedlots using Campeche sorghum and Yucatán poultry litter.'},
    insumos:{es:'Sorgo de Campeche, pollinaza, pasta de soya por el puerto de Progreso, pastos.',en:'Campeche sorghum, poultry litter, soybean meal through Progreso port, grasses.'},
    retos:{es:'Calor y humedad, sequía primaveral y deficiencias minerales del suelo kárstico.',en:'Heat and humidity, spring drought and karst-soil mineral deficiencies.'},
    precio:{sorgor:1.00,sorgoh:1.03,maizr:1.10,maizh:1.12,soya44:0.98,soya48:0.98,pollinaza:0.80,pasto:0.75,alfalfa:1.25,melaza:0.95,ddgs:1.10},
    sel:['sorgor','maizr','pasto','pollinaza','soya44','melaza','urea','carbonato','sal','premezcla'], sAgua:150 }
};
const REGION_DE_EDO = Object.fromEntries(Object.entries(REGIONES).flatMap(([k,r])=>r.edos.map(e=>[e,k])));
const NOMBRE_EDO = {'MX-AGU':'Aguascalientes','MX-BCN':'Baja California','MX-BCS':'Baja California Sur','MX-CAM':'Campeche','MX-CHP':'Chiapas','MX-CHH':'Chihuahua','MX-COA':'Coahuila','MX-COL':'Colima','MX-DIF':'Ciudad de México','MX-DUR':'Durango','MX-GUA':'Guanajuato','MX-GRO':'Guerrero','MX-HID':'Hidalgo','MX-JAL':'Jalisco','MX-MEX':'Estado de México','MX-MIC':'Michoacán','MX-MOR':'Morelos','MX-NAY':'Nayarit','MX-NLE':'Nuevo León','MX-OAX':'Oaxaca','MX-PUE':'Puebla','MX-QUE':'Querétaro','MX-ROO':'Quintana Roo','MX-SLP':'San Luis Potosí','MX-SIN':'Sinaloa','MX-SON':'Sonora','MX-TAB':'Tabasco','MX-TAM':'Tamaulipas','MX-TLA':'Tlaxcala','MX-VER':'Veracruz','MX-YUC':'Yucatán','MX-ZAC':'Zacatecas'};

/* ---- Infraestructura / infrastructure ---- */
const SOMBRAS = {
  ninguna:{n:{es:'Sin sombra',en:'No shade'}, dITH:0},
  lamina:{n:{es:'Sombra de lámina (≈ 1.3 m²/animal)',en:'Sheet-metal shade (≈ 1.3 m²/head)'}, dITH:2},
  amplia:{n:{es:'Sombra amplia (2.5–4 m²/animal)',en:'Ample shade (2.5–4 m²/head)'}, dITH:4},
  domo:{n:{es:'Domo con ventiladores o aspersores',en:'Dome with fans or sprinklers'}, dITH:6}
};
const PISOS = {
  tierra:{n:{es:'Tierra sin drenaje',en:'Undrained dirt'}, f:1},
  drenado:{n:{es:'Tierra con pendiente y montículos',en:'Sloped dirt with mounds'}, f:0.4},
  firme:{n:{es:'Piso firme o concreto',en:'Firm floor or concrete'}, f:0}
};
const SISTEMAS = {
  corral:{n:{es:'Corral de engorda (estabulado)',en:'Feedlot pen (confined)'}, fAct:1.00},
  semi:{n:{es:'Semiestabulado (corral y potrero)',en:'Semi-confined (pen and paddock)'}, fAct:1.05},
  plano:{n:{es:'Pastoreo en terreno plano',en:'Grazing on flat land'}, fAct:1.10},
  lomerio:{n:{es:'Pastoreo en lomerío o sierra',en:'Grazing on hills or sierra'}, fAct:1.20}
};
/* ITH (NRC, 1971; fórmula usada por Avendaño-Reyes et al., 2025) */
const ITH = (t, hr) => 0.81*t + (hr/100)*(t-14.4) + 46.4;
const CAT_ITH = v => v<75 ? ['ok',{es:'Normal',en:'Normal'}] : v<79 ? ['info',{es:'Alerta',en:'Alert'}] : v<84 ? ['warn',{es:'Peligro',en:'Danger'}] : ['bad',{es:'Emergencia',en:'Emergency'}];
const ADAPT_ITH = {cebu:3, cruza:1.5, criollo:1.5, britanico:0, continental:0, lechero:-1};
/* Aplica región, temporada e infraestructura a las condiciones del modelo */
function aplicarRegion(s){
  const R = REGIONES[s.region||'OB'], t = R.t[s.temporada||'seca'], c = s.cond;
  c.tAct = t[0]; c.hr = t[2];
  const tp = {seca:'fresca', lluvias:'seca', fresca:'lluvias'}[s.temporada||'seca'];
  c.tPrev = R.t[tp][0];
  c.noche = (t[0]-(t[1]-t[0])) < 20;                    // mínima estimada < 20 °C
  const ithMed = ITH(t[0], t[2]), ef = ithMed - (SOMBRAS[c.sombra||'lamina'].dITH) - (ADAPT_ITH[s.biotipo]||0);
  c.ith = Math.round(ithMed*10)/10; c.ithEf = Math.round(ef*10)/10;
  c.jadeo = ef>=84 ? 'abierta' : ef>=79 ? 'rapido' : 'no';
  const lodoBase = s.temporada==='lluvias' ? (['GT','PS','PY'].includes(s.region)?15:8) : s.temporada==='fresca' ? 3 : 0;
  c.lodo = Math.round(lodoBase*PISOS[c.piso||'drenado'].f);
  c.sAgua = R.sAgua;
}
function preciosRegion(s){
  const R = REGIONES[s.region||'OB'];
  s.ingredientes.forEach(i=>{ const r = ING_LIB.find(x=>x[0]===i.id); if(r) i.precio = +(r[4]*(R.precio[i.id]||1)).toFixed(2); });
}

/* ---- Resultados publicados por región (referencias para el productor) ----
   gdp en kg/d; ca = conversión (kg de alimento por kg ganado, tal como se reporta). */
const ESTUDIOS = [
  {r:'NO', cita:'Gómez-Alarcón, R., Limón-Navarro, J. E., & Arellanes-Ayala, J. (1989). Nutrición animal: 20 años de investigación pecuaria en el CIPES. Centro de Investigaciones Pecuarias del Estado de Sonora.', corta:'CIPES · Gómez-Alarcón et al. (1989)', lugar:'Sonora',
    filas:[[{es:'Vaquillas en zacate buffel, sin suplemento',en:'Heifers on buffelgrass, no supplement'},0.19,null],[{es:'Vaquillas en buffel con suplemento proteico (secas)',en:'Heifers on buffel with protein supplement (dry season)'},0.645,null],[{es:'Engorda con 45 % de melaza y 5 % de proteína sobrepasante',en:'Feeding 45 % molasses with 5 % bypass protein'},1.27,6.87],[{es:'Engorda 30 % melaza : 20 % grano (270 kg, 114 d)',en:'Feeding 30 % molasses : 20 % grain (270 kg, 114 d)'},1.26,9.40],[{es:'Ensilaje de sorgo + suplemento (140 kg)',en:'Sorghum silage + supplement (140 kg)'},0.79,null]],
    nota:{es:'Implantes: +15–20 % de ganancia y 10–15 % mejor conversión en engorda. La proteína sobrepasante mejora el aprovechamiento de dietas de melaza.',en:'Implants: +15–20 % gain and 10–15 % better conversion in feedlots. Bypass protein improves the use of molasses diets.'}},
  {r:'NO', cita:'Zambrano, R., & Salcedo, M. (1973). Comparación de cuatro forrajes toscos en la engorda de vaquillas en corral. Centro de Investigaciones Pecuarias del Estado de Sonora (F73003).', corta:'CIPES · Zambrano y Salcedo (1973)', lugar:'Sonora',
    filas:[[{es:'Vaquillas cebú cruzadas, heno de alfalfa',en:'Zebu-cross heifers, alfalfa hay'},0.784,11.85],[{es:'Esquilmo de algodón + pasta de cártamo',en:'Cotton gin trash + safflower meal'},0.777,12.58],[{es:'Forraje de sorgo + pasta de cártamo',en:'Sorghum forage + safflower meal'},0.774,13.60],[{es:'Paja de trigo + pasta de cártamo',en:'Wheat straw + safflower meal'},0.630,15.44]],
    nota:{es:'El esquilmo de algodón con cártamo dio la mayor utilidad: un forraje barato puede ganarle a la alfalfa.',en:'Cotton gin trash with safflower gave the highest profit: a cheap roughage can beat alfalfa.'}},
  {r:'NO', cita:'Castro-Pérez, B. I., et al. (2020). Asian-Australasian Journal of Animal Sciences, 33(6), 1034. https://doi.org/10.5713/ajas.19.0112', corta:'Castro-Pérez et al. (2020)', lugar:'Sinaloa',
    filas:[[{es:'Toretes, sombra de 1.2 m² por animal',en:'Bulls, 1.2 m² shade per head'},1.15,6.13],[{es:'Sombra total con ventilador',en:'Total shade with fan'},1.32,5.71]],
    nota:{es:'1,560 toretes, ITH medio 80.9: la sombra total con ventilador subió 15 % la ganancia.',en:'1,560 bulls, mean THI 80.9: total shade with a fan raised gain 15 %.'}},
  {r:'NO', cita:'Mejía-Turcios, S. E., Rotz, A., McGlone, J. J., Rivera, C., & Mitloehner, F. M. (2024). Journal of Animal Science, 102(Suppl. 3), 664–665. https://doi.org/10.1093/jas/skae234.754', corta:'Mejía-Turcios et al. (2024)', lugar:'Sinaloa',
    filas:[[{es:'Domo con ventiladores vs. sombra convencional',en:'Dome with fans vs. conventional shade'},null,null]],
    nota:{es:'+22 kg de peso final, +29.66 USD por animal y 3–8 % menos GEI y amoniaco por kg de carne en una engorda de 209,700 animales al año.',en:'+22 kg final weight, +29.66 USD per head and 3–8 % less GHG and ammonia per kg of beef in a feedlot of 209,700 head a year.'}},
  {r:'NO', cita:'Estrada-Angulo, A., et al. (2022). Animals, 12(13), 1715. https://doi.org/10.3390/ani12131715', corta:'Estrada-Angulo et al. (2022)', lugar:'Sinaloa',
    filas:[[{es:'Toretes cruzados, maíz hojueleado',en:'Crossbred bulls, steam-flaked corn'},1.42,5.52]], nota:{es:'Finalización de 87 días con 12 % de rastrojo.',en:'87-day finishing with 12 % stover.'}},
  {r:'NN', cita:'Floriano-López, A., et al. (2024). Journal of Animal Science, 102(Suppl. 3), 456–457. https://doi.org/10.1093/jas/skae234.516', corta:'Floriano-López et al. (2024)', lugar:'Chihuahua',
    filas:[[{es:'Vacas Criollo Rarámuri, Angus × Criollo y Hereford × Angus en agostadero',en:'Rarámuri Criollo, Angus × Criollo and Hereford × Angus cows on rangeland'},null,null]],
    nota:{es:'Las vacas Angus × Criollo destetaron más kilos por kg de vaca y las cruzas con Criollo tuvieron mejor preñez que Hereford × Angus en un sistema de bajos insumos.',en:'Angus × Criollo cows weaned the most kilos per kg of cow, and Criollo crosses had better pregnancy than Hereford × Angus in a low-input system.'}},
  {r:'CN', cita:'Rodríguez-Cordero, D., et al. (2025). Animals, 15(8), 1170. https://doi.org/10.3390/ani15081170', corta:'Rodríguez-Cordero et al. (2025)', lugar:'Zacatecas',
    filas:[[{es:'Becerros de alto riesgo, recepción con 50 % de forraje',en:'High-risk calves, 50 % forage receiving diet'},1.22,4.02],[{es:'+ propionato de calcio 42 d',en:'+ calcium propionate 42 d'},1.42,3.49]],
    nota:{es:'Costo por kg ganado de 1.29–1.46 USD; relación beneficio : costo ≈ 2.5–2.8 en 56 días de recepción.',en:'Cost per kg gained 1.29–1.46 USD; benefit : cost ≈ 2.5–2.8 over a 56-day receiving period.'}},
  {r:'GT', cita:'Sánchez-Arroyo, E., Vargas-Romero, J. M., Rosendo-Ponce, A., Hernández-Mendo, O., Pérez-Chabela, M. L., Pro-Martínez, A., & Becerril-Pérez, C. M. (2023). Tropical Animal Health and Production, 55, 62. https://doi.org/10.1007/s11250-023-03469-8', corta:'Sánchez-Arroyo et al. (2023)', lugar:'Veracruz',
    filas:[[{es:'Toros Criollo Lechero Tropical: dieta de 2.9 vs. 2.2 Mcal EM/kg',en:'Tropical Milking Criollo bulls: 2.9 vs. 2.2 Mcal ME/kg diet'},null,null]],
    nota:{es:'La dieta de mayor energía mejoró ganancia, consumo, conversión y rendimiento en canal en las tres etapas: el ganado criollo del trópico responde a la finalización intensiva.',en:'The higher-energy diet improved gain, intake, conversion and carcass yield in all three stages: tropical criollo cattle respond to intensive finishing.'}},
  {r:'US', cita:'Carvalho, P. H. V., et al. (2022); Montano, M. F., et al. (2023); Salinas-Chavira, J., et al. (2024). Translational Animal Science (Universidad de California, Davis, Valle Imperial).', corta:'Zinn y colaboradores (2022–2024)', lugar:{es:'California, EUA (frontera con Baja California)',en:'California, USA (Baja California border)'},
    filas:[[{es:'Becerros Holstein de 125–300 kg, maíz hojueleado',en:'Holstein calves 125–300 kg, steam-flaked corn'},1.35,4.3]],
    nota:{es:'Referencia para la engorda de machos lecheros del noroeste: 7–25 % de DDGS sin afectar la ganancia.',en:'Benchmark for northwestern dairy-male feeding: 7–25 % DDGS without affecting gain.'}}
];
