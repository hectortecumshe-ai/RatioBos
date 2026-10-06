"use strict";
/* =====================================================================
   2. CONFIG — datos de la publicación / publication data
   ===================================================================== */
const CONFIG = {
  app: 'RatioBos',
  version: '1.0.0',
  anio: 2026,
  autores: 'Héctor Tecumshé Mojica Zárate · Luis Ángel Barrera Guzmán',
  citaAutores: {es:'Mojica-Zárate, H. T., y Barrera-Guzmán, L. A.', en:'Mojica-Zárate, H. T., & Barrera-Guzmán, L. A.'},
  titulo: {es:'Formulación guiada de dietas de mínimo costo para bovinos productores de carne', en:'Guided least-cost diet formulation for beef cattle'},
  repo: 'https://github.com/hectortecumshe-ai/RatioBos',
  doi: '10.5281/zenodo.23197134'   // ← cuando Zenodo asigne el DOI, escríbelo aquí
};

/* =====================================================================
   2b. IDIOMA / LANGUAGE — T('es','en'), tx({es,en})
   ===================================================================== */
let LANG = 'es';
try{ LANG = localStorage.getItem('ratiobos_lang') || ((navigator.language||'es').toLowerCase().startsWith('es') ? 'es' : 'en'); }catch(e){}
const T = (es, en) => LANG==='en' ? en : es;
const tx = v => (v && typeof v==='object' && ('es' in v || 'en' in v)) ? (v[LANG] ?? v.es ?? v.en) : v;
const LOC = () => LANG==='en' ? 'en-US' : 'es-MX';
let MODO = 'prod';
try{ MODO = localStorage.getItem('ratiobos_modo')==='cien' ? 'cien' : 'prod'; }catch(e){}
const SCI = () => MODO==='cien';
const minus = s => s ? s.charAt(0).toLowerCase()+s.slice(1) : s;

/* =====================================================================
   3. DATOS / DATA
   Todo en base seca (MS) salvo los precios, que son tal como se ofrece.
   ===================================================================== */
const NUTRIENTES = [
  {k:'NEm',   n:{es:'Energía neta de mantenimiento (ENm)',en:'Net energy for maintenance (NEm)'}, u:'Mcal/kg', d:2},
  {k:'NEg',   n:{es:'Energía neta de ganancia (ENg)',en:'Net energy for gain (NEg)'}, u:'Mcal/kg', d:2},
  {k:'TND',   n:{es:'Nutrientes digestibles totales (TND)',en:'Total digestible nutrients (TDN)'}, u:'%', d:1},
  {k:'PC',    n:{es:'Proteína cruda',en:'Crude protein'}, u:'%', d:2},
  {k:'PM',    n:{es:'Proteína metabolizable',en:'Metabolizable protein'}, u:'g/kg', d:1},
  {k:'PDRb',  n:{es:'Balance de proteína degradable (PDR − PCM)',en:'Degradable protein balance (RDP − MCP)'}, u:'g/kg', d:1},
  {k:'PDR',   n:{es:'Proteína degradable en rumen (PDR)',en:'Rumen-degradable protein (RDP)'}, u:'%', d:2},
  {k:'FDN',   n:{es:'Fibra detergente neutro (FDN)',en:'Neutral detergent fiber (NDF)'}, u:'%', d:1},
  {k:'FDNef', n:{es:'FDN físicamente efectiva (FDNfe)',en:'Physically effective NDF (peNDF)'}, u:'%', d:1},
  {k:'For',   n:{es:'Forraje en la dieta',en:'Forage in the diet'}, u:'%', d:1},
  {k:'EE',    n:{es:'Extracto etéreo (grasa)',en:'Ether extract (fat)'}, u:'%', d:2},
  {k:'Ca',    n:{es:'Calcio',en:'Calcium'}, u:'%', d:3},
  {k:'P',     n:{es:'Fósforo',en:'Phosphorus'}, u:'%', d:3},
  {k:'S',     n:{es:'Azufre',en:'Sulfur'}, u:'%', d:3},
  {k:'Na',    n:{es:'Sodio',en:'Sodium'}, u:'%', d:3}
];
const NUT = Object.fromEntries(NUTRIENTES.map(n=>[n.k,n]));
const KEYN = ['NEm','NEg','PC','PM','For','FDNef','Ca','P'];   // visibles en la vista productor

/* ---- Tipo de animal / production class ---- */
const CATEGORIAS = {
  desarrollo:{ n:{es:'Becerros en desarrollo',en:'Growing calves'}, tipo:'crec', dmi:'becerro', pv:220, adg:0.9, ico:'i-steer', escala:.78,
    desc:{es:'Del destete a ≈ 320 kg. Dieta con forraje abundante para crecer hueso y músculo sin engrasar.',en:'From weaning to ≈ 320 kg. Forage-rich diet to grow frame and muscle without fattening.'},
    lim:{For:[35,null], FDNef:[15,null], EE:[null,6.5], S:[null,0.40], Na:[0.08,null]} },
  engorda:{ n:{es:'Engorda en corral (finalización)',en:'Feedlot finishing'}, tipo:'crec', dmi:'anojo', pv:380, adg:1.35, ico:'i-steer', escala:1,
    desc:{es:'Toretes y novillos en corral hasta el peso de venta. Dietas altas en grano: máxima ganancia con salud ruminal.',en:'Bulls and steers in the feedlot up to market weight. High-grain diets: maximum gain with rumen health.'},
    lim:{For:[8,15], FDNef:[7,null], EE:[null,6.5], S:[null,0.30], PC:[null,15], Na:[0.08,null]} },
  vaquillas:{ n:{es:'Vaquillas de reemplazo',en:'Replacement heifers'}, tipo:'crec', dmi:'anojo', pv:280, adg:0.6, ico:'i-steer', escala:.9,
    desc:{es:'Crecimiento moderado para llegar al empadre con 60–65 % del peso adulto, sin engrasarse.',en:'Moderate growth to reach breeding at 60–65 % of mature weight, without fattening.'},
    lim:{For:[40,null], FDNef:[20,null], EE:[null,6.0], S:[null,0.40], Na:[0.08,null]} },
  gestacion:{ n:{es:'Vacas gestantes',en:'Pregnant cows'}, tipo:'vaca', pv:480, ico:'i-herd', escala:1,
    desc:{es:'Vacas de cría secas en el segundo o último tercio de la gestación. El último tercio decide el peso del becerro y la próxima preñez.',en:'Dry beef cows in mid or late gestation. The last trimester decides calf weight and the next pregnancy.'},
    lim:{For:[50,null], FDNef:[20,null], EE:[null,6.0], S:[null,0.40], Na:[0.06,null]} },
  lactacion:{ n:{es:'Vacas en lactación',en:'Lactating cows'}, tipo:'vaca', pv:450, ico:'i-herd', escala:1,
    desc:{es:'Vacas amamantando a su becerro. La leche dispara la necesidad de energía, proteína y minerales.',en:'Cows nursing their calf. Milk sharply raises energy, protein and mineral needs.'},
    lim:{For:[45,null], FDNef:[20,null], EE:[null,6.0], S:[null,0.40], Na:[0.10,null]} }
};
/* ---- Biotipo / biotype. fNEm: NRC (1996), tabla 2-? de ajustes de mantenimiento ---- */
const BIOTIPOS = {
  britanico:{ n:{es:'Británico',en:'British'}, ej:{es:'Angus, Hereford',en:'Angus, Hereford'}, fNEm:1.00, fDMI:1.00, pf:540, mw:520, pn:33, leche:8, estilo:'--cw:#2b2626;--cl:#2b2626',
    desc:{es:'Maduran temprano, engrasan rápido y marmolean bien. Mantenimiento de referencia (1.00).',en:'Early maturing, fatten quickly and marble well. Reference maintenance (1.00).'} },
  continental:{ n:{es:'Continental',en:'Continental'}, ej:{es:'Charolais, Limousin, Simmental',en:'Charolais, Limousin, Simmental'}, fNEm:1.00, fDMI:1.00, pf:600, mw:620, pn:38, leche:9, estilo:'--cw:#efe3c8;--st:rgba(0,0,0,.22)',
    desc:{es:'Gran tamaño adulto y mucho músculo: más días y más peso para engrasar. Simmental y razas de doble propósito tienen mantenimiento más alto (1.20).',en:'Large mature size and heavy muscling: more days and weight to finish. Simmental and dual-purpose breeds have higher maintenance (1.20).'} },
  cebu:{ n:{es:'Cebú',en:'Zebu (Bos indicus)'}, ej:{es:'Brahman, Nelore, Gyr, Guzerat, Indubrasil, Sardo Negro',en:'Brahman, Nellore, Gyr, Guzerat, Indubrasil, Sardo Negro'}, fNEm:0.90, fDMI:1.00, pf:500, mw:500, pn:31, leche:6, estilo:'--cw:#cfc8bd;--hu:#bdb5a8',
    desc:{es:'Adaptados al trópico: toleran calor y garrapata, con 10 % menos mantenimiento. Crecen más lento y su carne es menos marmoleada.',en:'Tropically adapted: tolerate heat and ticks, with 10 % lower maintenance. Slower growth and less marbling.'} },
  cruza:{ n:{es:'Cruza cebú × europeo',en:'Zebu × European cross'}, ej:{es:'F1, Beefmaster, Brangus, Simbrah, Charbray, Santa Gertrudis, Suizo × cebú',en:'F1, Beefmaster, Brangus, Simbrah, Charbray, Santa Gertrudis, Brown Swiss × zebu'}, fNEm:0.95, fDMI:1.00, pf:540, mw:520, pn:33, leche:7, estilo:'--cw:#9b4f2e;--hu:#8f4628',
    desc:{es:'El ganado más común en las engordas del trópico mexicano: vigor híbrido, rusticidad y buena ganancia. Mantenimiento intermedio (0.95).',en:'The most common feedlot animal in tropical Mexico: hybrid vigor, hardiness and good gain. Intermediate maintenance (0.95).'} },
  criollo:{ n:{es:'Criollo mexicano',en:'Mexican Criollo'}, ej:{es:'Criollo Coreño, Chinampo, Criollo de Rodeo',en:'Coreño, Chinampo, Rarámuri Criollo'}, fNEm:1.00, fDMI:1.00, pf:460, mw:420, pn:28, leche:5, estilo:'--cw:#b5764a;--pa:#efe3c8;--st:rgba(0,0,0,.2)',
    desc:{es:'Descendientes del ganado español del siglo XVI: pequeños, rústicos, resistentes a la sequía y al forraje pobre. Útiles en agostadero y cruzamientos.',en:'Descendants of 16th-century Spanish cattle: small, hardy, tolerant of drought and poor forage. Useful on rangeland and in crossbreeding.'} },
  lechero:{ n:{es:'Lechero',en:'Dairy'}, ej:{es:'Machos Holstein, Suizo pardo',en:'Holstein, Brown Swiss males'}, fNEm:1.20, fDMI:1.08, pf:620, mw:650, pn:40, leche:12, estilo:'--cw:#fbfaf6;--pa:#2b2626;--st:rgba(0,0,0,.3)',
    desc:{es:'Machos de establo lechero engordados para carne: mantenimiento 20 % mayor y 8 % más consumo; esqueleto grande.',en:'Dairy bull calves fed for beef: 20 % higher maintenance and 8 % more intake; large frame.'} }
};
const SEXOS = {
  novillo:{ n:{es:'Novillo (castrado)',en:'Steer'}, fNEm:1.00, fPF:1.00, d:{es:'Referencia del modelo.',en:'Model reference.'} },
  torete: { n:{es:'Torete (entero)',en:'Bull'}, fNEm:1.15, fPF:1.15, d:{es:'Mantenimiento 15 % mayor; más músculo y menos grasa al mismo peso.',en:'15 % higher maintenance; more muscle and less fat at the same weight.'} },
  vaquilla:{ n:{es:'Vaquilla',en:'Heifer'}, fNEm:1.00, fPF:0.82, d:{es:'Engrasa a menor peso: su peso final equivalente es ≈ 18 % menor.',en:'Fattens at a lighter weight: equivalent final weight ≈ 18 % lower.'} }
};
/* Grado de engrasamiento final → peso de referencia estándar (SRW, NASEM 2016) */
const SRW = { 435:{es:'Ligero (25 % grasa corporal)',en:'Light (25 % body fat)'}, 462:{es:'Medio (27 %)',en:'Medium (27 %)'}, 478:{es:'Alto, tipo Choice (28 %)',en:'High, Choice type (28 %)'} };

/* ---- Ingredientes. Composición en base seca (MS), tablas de Beck, Lalman y Moehlenpah (2024),
        Oklahoma State University, ANSI-3018, con valores de NASEM (2016) y Preston. ENm y ENg
        convertidos de Mcal/cwt a Mcal/kg (÷ 45.36). Precios: ejemplo, $ por kg tal como se ofrece. ---- */
const ING_COLS = ['MS','TND','NEm','NEg','PC','PDR','FDN','pef','EE','Ca','P','S','Na'];
const CAT = {
  for:{es:'Forrajes secos',en:'Dry forages'}, ens:{es:'Ensilajes y forrajes verdes',en:'Silages and fresh forages'}, gra:{es:'Granos',en:'Grains'},
  sub:{es:'Subproductos energéticos',en:'Energy by-products'}, pro:{es:'Proteicos',en:'Protein sources'}, nnp:{es:'Nitrógeno no proteico',en:'Non-protein nitrogen'},
  gras:{es:'Grasas',en:'Fats'}, min:{es:'Minerales',en:'Minerals'}, adi:{es:'Premezclas y aditivos',en:'Premixes and additives'}, per:{es:'Personalizados',en:'Custom'}
};
const CATS = Object.keys(CAT);
const ES_FORRAJE = cat => cat==='for' || cat==='ens';
const ING_LIB = [
 ['alfalfa',{es:'Heno de alfalfa (media floración)',en:'Alfalfa hay (mid-bloom)'},'for',[88,60,1.32,0.75,18,80,46,0.8,2.6,1.35,0.27,0.29,0],5.5,0,null,{es:'Ca, P y S de la alfalfa fresca de la misma tabla.',en:'Ca, P and S from fresh alfalfa in the same table.'},true],
 ['avena',{es:'Heno de avena',en:'Oat hay'},'for',[91,59,1.17,0.62,9,75,59,0.8,2.3,0.48,0.35,0.22,0],4.2,0,null,{es:'Minerales del forraje verde de avena.',en:'Minerals from fresh oat forage.'},false],
 ['sudan',{es:'Heno de pasto sudán',en:'Sudangrass hay'},'for',[91,58,1.19,0.57,9,70,67,0.8,2.6,0.48,0.30,0.18,0],3.5,0,null,{es:'Etapa de embuche.',en:'Boot stage.'},false],
 ['bermuda',{es:'Heno de pasto bermuda o estrella',en:'Bermudagrass or stargrass hay'},'for',[90,53,1.08,0.53,10,72,75,0.8,1.9,0.59,0.28,0.30,0],3.2,0,null,{es:'Inicio de floración; la calidad cae rápido con la madurez.',en:'Early bloom; quality drops fast with maturity.'},false],
 ['rastrojo',{es:'Rastrojo de maíz',en:'Corn stover'},'for',[85,50,0.97,0.42,6,70,67,1.0,1.3,0.33,0.16,0.08,0],1.8,0,50,{es:'Fibra barata y muy efectiva; pobre en energía y proteína.',en:'Cheap, highly effective fiber; poor in energy and protein.'},true],
 ['ensmaiz',{es:'Ensilaje de maíz',en:'Corn silage'},'ens',[34,71,1.61,1.01,8,72,44,0.8,3.3,0.25,0.24,0.10,0],1.3,0,null,{es:'Bien elotado. 34 % de MS: pesa casi tres veces más tal como se ofrece.',en:'Well eared. 34 % DM: weighs almost three times more as fed.'},true],
 ['enssorgo',{es:'Ensilaje de sorgo',en:'Sorghum silage'},'ens',[36,58,1.17,0.62,10,71,58,0.8,3.0,0.48,0.24,0.14,0],1.1,0,null,{es:'Inicio de floración.',en:'Early bloom.'},false],
 ['ensavena',{es:'Ensilaje de avena',en:'Oat silage'},'ens',[35,60,1.23,0.66,13,79,59,0.8,3.7,0.52,0.33,0.19,0],1.3,0,null,{es:'',en:''},false],
 ['pasto',{es:'Pasto bermuda o estrella verde (corte)',en:'Fresh bermuda or stargrass (cut)'},'ens',[30,65,1.48,0.88,16,85,68,0.8,3.0,0.46,0.31,0.33,0],0.7,0,null,{es:'Vegetativo. Útil para vacas y desarrollo en el trópico.',en:'Vegetative. Useful for cows and growers in the tropics.'},false],
 ['maizr',{es:'Maíz rolado',en:'Dry-rolled corn'},'gra',[88,88,2.16,1.43,9,46,10,0.2,4.2,0.02,0.30,0.14,0],5.3,0,null,{es:'Base energética más común. Almidón de fermentación moderada.',en:'Most common energy base. Moderately fermentable starch.'},true],
 ['maizh',{es:'Maíz hojueleado al vapor',en:'Steam-flaked corn'},'gra',[87,93,2.29,1.57,9,41,9,0.25,3.6,0.03,0.24,0.09,0],5.9,0,null,{es:'≈ 15 % más energía que el rolado. Exige buen manejo del comedero (acidosis).',en:'≈ 15 % more energy than dry-rolled. Needs good bunk management (acidosis).'},false],
 ['maize',{es:'Maíz entero',en:'Whole corn'},'gra',[88,88,2.18,1.43,9,42,9,0.35,4.3,0.02,0.30,0.12,0],5.0,0,null,{es:'',en:''},false],
 ['sorgor',{es:'Sorgo rolado',en:'Dry-rolled sorghum'},'gra',[90,84,2.05,1.39,11,45,16,0.35,3.4,0.15,0.36,0.11,0],4.6,0,null,{es:'Debe ir rolado o molido: entero pasa sin digerirse.',en:'Must be rolled or ground: whole grain passes undigested.'},true],
 ['sorgoh',{es:'Sorgo hojueleado al vapor',en:'Steam-flaked sorghum'},'gra',[82,90,2.25,1.54,11,38,20,0.1,3.1,0.04,0.28,0.14,0],5.2,0,null,{es:'',en:''},false],
 ['trigo',{es:'Trigo',en:'Wheat'},'gra',[89,84,2.05,1.39,14,77,13,0.15,2.0,0.12,0.39,0.15,0],5.6,0,30,{es:'Almidón muy rápido: limitar para evitar acidosis.',en:'Very fast starch: limit to avoid acidosis.'},false],
 ['hominy',{es:'Hominy (subproducto de maíz)',en:'Hominy feed'},'sub',[89,86,2.18,1.50,10,52,17,0.2,6.9,0.04,0.55,0.12,0],4.6,0,null,{es:'',en:''},false],
 ['melaza',{es:'Melaza de caña',en:'Cane molasses'},'sub',[73,72,1.70,1.08,9,100,1,0.1,2.3,1.00,0.25,1.00,0],3.8,0,10,{es:'Palatable, reduce el polvo. Rica en azúcar y potasio.',en:'Palatable, reduces dust. Rich in sugar and potassium.'},true],
 ['salvado',{es:'Salvado de trigo',en:'Wheat bran'},'sub',[90,72,1.68,1.06,18,72,40,0.2,4.5,0.16,1.08,0.18,0],4.4,0,30,{es:'Alto en fósforo.',en:'High in phosphorus.'},false],
 ['glutenf',{es:'Gluten feed de maíz (seco)',en:'Corn gluten feed (dry)'},'sub',[89,73,1.72,1.10,24,75,36,0.4,4.1,0.11,1.04,0.50,0],4.8,0,30,{es:'Fibra digestible: diluye el almidón sin bajar mucho la energía.',en:'Digestible fiber: dilutes starch without losing much energy.'},false],
 ['cascsoya',{es:'Cascarilla de soya',en:'Soybean hulls'},'sub',[91,63,1.32,0.73,14,47,63,0.4,3.3,0.64,0.18,0.13,0],4.2,0,30,{es:'',en:''},false],
 ['ddgs',{es:'Granos de destilería con solubles (DDGS)',en:'Distillers grains with solubles (DDGS)'},'pro',[89,89,2.20,1.52,31,50,33,0.35,13.0,0.07,0.87,0.65,0],5.4,0,30,{es:'Energía y proteína sobrepasante. Ojo con el azufre y la grasa.',en:'Energy and bypass protein. Watch sulfur and fat.'},true],
 ['algodon',{es:'Semilla de algodón entera',en:'Whole cottonseed'},'pro',[91,77,2.05,1.39,24,62,53,0.8,19.9,0.19,0.69,0.23,0],6.0,0,15,{es:'Grasa, proteína y fibra efectiva a la vez. Gosipol: no más de 15 %.',en:'Fat, protein and effective fiber at once. Gossypol: no more than 15 %.'},false],
 ['harinolina',{es:'Harinolina (pasta de algodón)',en:'Cottonseed meal'},'pro',[91,70,1.63,1.04,43,73,32,0.25,5.7,0.31,1.20,0.43,0],7.2,0,15,{es:'',en:''},false],
 ['soya44',{es:'Pasta de soya 44 %',en:'Soybean meal 44 %'},'pro',[89,84,2.03,1.34,49,65,15,0.15,1.5,0.36,0.70,0.41,0],8.6,0,null,{es:'44 % de proteína tal como se ofrece (49 % en base seca).',en:'44 % protein as fed (49 % on a DM basis).'},true],
 ['soya48',{es:'Pasta de soya 48 %',en:'Soybean meal 48 %'},'pro',[91,87,2.16,1.48,54,64,9,0.15,1.2,0.28,0.70,0.47,0],9.4,0,null,{es:'',en:''},false],
 ['canola',{es:'Pasta de canola',en:'Canola meal'},'pro',[91,69,1.61,0.99,40,71,30,0.25,7.4,0.74,1.10,0.71,0],7.4,0,20,{es:'',en:''},false],
 ['pollinaza',{es:'Pollinaza',en:'Poultry litter'},'pro',[94,57,1.17,0.64,25,90,38,0.5,2.5,2.56,1.44,0.52,0],2.0,0,20,{es:'Usar solo tratada (ensilada o calentada) y retirar 3 semanas antes del sacrificio.',en:'Use only treated (ensiled or heated) and withdraw 3 weeks before slaughter.'},false],
 ['pescado',{es:'Harina de pescado',en:'Fish meal'},'pro',[92,77,2.01,1.37,61,40,23,0.15,12.1,5.04,2.90,0.84,0],26.0,0,3,{es:'Proteína sobrepasante de alta calidad; cara.',en:'High-quality bypass protein; expensive.'},false],
 ['urea',{es:'Urea (46 % N)',en:'Urea (46 % N)'},'nnp',[99,0,0,0,288,100,0,0,0,0,0,0,0],9.5,0,1.0,{es:'Proteína degradable barata. Máximo ≈ 1 % de la MS y siempre bien mezclada.',en:'Cheap degradable protein. Maximum ≈ 1 % of DM, always well mixed.'},true],
 ['grasa',{es:'Grasa amarilla o sebo',en:'Yellow grease or tallow'},'gras',[99,195,6.28,5.07,0,0,0,0,99,0,0,0,0],20.0,0,4,{es:'Energía concentrada. Más de 6–7 % de grasa total frena la digestión de la fibra.',en:'Concentrated energy. Over 6–7 % total fat depresses fiber digestion.'},false],
 ['carbonato',{es:'Carbonato de calcio',en:'Calcium carbonate'},'min',[99,0,0,0,0,0,0,0,0,38,0.04,0.01,0],1.6,0,2.0,{es:'Fuente de calcio, no relleno: más de ≈ 2 % de la MS baja la palatabilidad y el consumo.',en:'Calcium source, not a filler: over ≈ 2 % of DM lowers palatability and intake.'},true],
 ['dical',{es:'Fosfato dicálcico',en:'Dicalcium phosphate'},'min',[99,0,0,0,0,0,0,0,0,22,19.3,1.14,0],16.0,0,2.0,{es:'',en:''},false],
 ['sal',{es:'Sal común (NaCl)',en:'Salt (NaCl)'},'min',[99,0,0,0,0,0,0,0,0,0,0,0,39.3],3.2,0,0.6,{es:'',en:''},true],
 ['bicarb',{es:'Bicarbonato de sodio',en:'Sodium bicarbonate'},'min',[99,0,0,0,0,0,0,0,0,0,0,0,27],11.0,0,1.0,{es:'Amortiguador ruminal en dietas altas en grano.',en:'Rumen buffer in high-grain diets.'},false],
 ['mgo',{es:'Óxido de magnesio',en:'Magnesium oxide'},'min',[99,0,0,0,0,0,0,0,0,0,0,0,0],16.0,0,0.3,{es:'56 % de Mg. Previene la tetania de los pastos en vacas.',en:'56 % Mg. Prevents grass tetany in cows.'},false],
 ['premezcla',{es:'Premezcla de microminerales y vitaminas',en:'Trace-mineral and vitamin premix'},'adi',[95,0,0,0,0,0,0,0,0,0,0,0,0],28.0,0.3,0.3,{es:'Inclusión fija según el fabricante (Co, Cu, I, Mn, Se, Zn y vitaminas A, D, E).',en:'Fixed inclusion as per manufacturer (Co, Cu, I, Mn, Se, Zn and vitamins A, D, E).'},true],
 ['otros',{es:'Otros aditivos (ionóforo, levaduras…)',en:'Other additives (ionophore, yeast…)'},'adi',[95,0,0,0,0,0,0,0,0,0,0,0,0],0,0,0,{es:'Sin aporte nutricional en la matriz. Úsalo para completar fórmulas.',en:'No nutrient contribution in the matrix. Use it to complete formulas.'},false]
];
function ingDesdeLib(r){
  const comp = {}; ING_COLS.forEach((k,i)=>comp[k]=r[3][i]||0);
  return {id:r[0], nombre:r[1], cat:r[2], comp, precio:r[4], min:r[5], max:r[6], nota:r[7], custom:false, env:envDe(r[0])};
}
const ingNombre = (id, extra) => { const r = ING_LIB.find(x=>x[0]===id); if(r) return tx(r[1]); const e=(extra||[]).find(x=>x.id===id); return e?tx(e.nombre):id; };

/* ---- Dietas publicadas para la validación / Published diets used for validation ----
   f: fórmula (% MS); rep: análisis calculado que reporta el artículo (base seca);
   perf: desempeño observado (peso inicial y final, días, GDP, CMS) y energía neta observada
   que publican los autores con el método de Zinn y Shen (1998); em: coeficiente de mantenimiento usado. */
const VALIDACION = [
  { id:'ea2022', pais:{es:'México',en:'Mexico'}, bandera:'MX', animal:{es:'Toretes cruzados (≈ 50 % cebú)',en:'Crossbred bulls (≈ 50 % zebu)'},
    cita:'Estrada-Angulo, A., Mendoza-Cortez, D. A., Ramos-Méndez, J. L., Arteaga-Wences, Y. J., Urías-Estrada, J. D., Castro-Pérez, B. I., Ríos-Rincón, F. G., Rodríguez-Gaxiola, M. A., Barreras, A., Zinn, R. A., & Plascencia, A. (2022). Comparing blend of essential oils plus 25-hydroxy-vit-D3 versus monensin plus virginiamycin combination in finishing feedlot cattle: Growth performance, dietary energetics, and carcass traits. Animals, 12(13), 1715.',
    corta:'Estrada-Angulo et al. (2022) · Animals (MDPI)', doi:'10.3390/ani12131715',
    nota:{es:'Engorda en Culiacán, Sinaloa (Universidad Autónoma de Sinaloa). Dieta basal de maíz hojueleado (tabla 1). Agromix SP y la premezcla se capturaron con la composición que da el artículo.',en:'Feedlot in Culiacán, Sinaloa (Autonomous University of Sinaloa). Steam-flaked corn basal diet (table 1). Agromix SP and the premix were entered with the composition given in the paper.'},
    extra:[
      {id:'agromix', nombre:{es:'Agromix SP (suplemento comercial)',en:'Agromix SP (commercial supplement)'}, cat:'adi', comp:{MS:95,TND:0,NEm:0,NEg:0,PC:53,PDR:100,FDN:0,pef:0,EE:0,Ca:13.6,P:0.40,S:0,Na:5.9}},
      {id:'premixea', nombre:{es:'Premezcla diluida con aditivo',en:'Diluted premix with additive'}, cat:'adi', comp:{MS:95,TND:0,NEm:0,NEg:0,PC:0,PDR:0,FDN:0,pef:0,EE:0,Ca:20.9,P:3.9,S:0,Na:0}}],
    fases:[
      {nombre:{es:'Finalización (87 d)',en:'Finishing (87 d)'}, f:[['rastrojo',12],['maizh',67.8],['soya44',6],['premixea',1.5],['melaza',7.5],['grasa',2.7],['agromix',2.5]],
        rep:{NEm:2.14,NEg:1.46,PC:11.80,FDN:15.36,Ca:0.81,P:0.30}, excl:{},
        perf:[{trat:{es:'Monensina + virginiamicina',en:'Monensin + virginiamycin'},pvI:349.43,pvF:472.80,dias:87,adg:1.418,dmi:7.855,nemObs:2.26,negObs:1.57,em:0.077},
              {trat:{es:'Aceites esenciales + 25-OH-D₃',en:'Essential oils + 25-OH-D₃'},pvI:349.74,pvF:474.41,dias:87,adg:1.433,dmi:7.965,nemObs:2.25,negObs:1.56,em:0.077}]}
    ]},
  { id:'pl2022', pais:{es:'EUA · México',en:'USA · Mexico'}, bandera:'US', animal:{es:'Becerros Holstein (125 kg)',en:'Holstein calves (125 kg)'},
    cita:'Plascencia, A., Latack, B. C., Carvalho, P. H. V., & Zinn, R. A. (2022). Feeding value of supplemental fat as a partial replacement for steam-flaked corn in diets for Holstein calves during the early growing phase. Translational Animal Science, 6(2), txac048.',
    corta:'Plascencia et al. (2022) · Translational Animal Science', doi:'10.1093/tas/txac048',
    nota:{es:'Dos dietas de desarrollo con 0 y 3.5 % de grasa amarilla (tabla 1). La sal mineralizada se tomó como sal común.',en:'Two growing diets with 0 and 3.5 % yellow grease (table 1). Trace-mineral salt was taken as plain salt.'},
    extra:[],
    fases:[
      {nombre:{es:'Sin grasa añadida',en:'No added fat'}, f:[['sudan',8],['alfalfa',4],['melaza',4],['maizh',72.39],['pescado',2.5],['canola',6],['urea',1],['carbonato',1.55],['mgo',0.16],['sal',0.40]],
        rep:{NEm:2.07,NEg:1.42,PC:15.56,EE:3.85,FDN:15.36,Ca:0.87,P:0.41,S:0.22}, excl:{},
        perf:[{trat:{es:'0 % grasa',en:'0 % fat'},pvI:125.97,pvF:204.76,dias:63,adg:1.251,dmi:4.773,nemObs:1.89,negObs:1.25,em:0.084}]},
      {nombre:{es:'3.5 % de grasa amarilla',en:'3.5 % yellow grease'}, f:[['sudan',8],['alfalfa',4],['grasa',3.5],['melaza',4],['maizh',68.89],['pescado',2.5],['canola',6],['urea',1],['carbonato',1.55],['mgo',0.16],['sal',0.40]],
        rep:{NEm:2.20,NEg:1.53,PC:15.27,EE:7.17,FDN:15.05,Ca:0.88,P:0.41,S:0.21}, excl:{},
        perf:[{trat:{es:'3.5 % grasa',en:'3.5 % fat'},pvI:129.51,pvF:212.18,dias:63,adg:1.312,dmi:4.717,nemObs:1.97,negObs:1.32,em:0.084}]}
    ]},
  { id:'ra2018', pais:{es:'EUA · México',en:'USA · Mexico'}, bandera:'US', animal:{es:'Novillos Holstein (128–592 kg)',en:'Holstein steers (128–592 kg)'},
    cita:'Ramos-Aviña, D., Plascencia, A., & Zinn, R. A. (2018). Influence of dietary nonstructural carbohydrate concentration on growth performance and carcass characteristics of Holstein steers. Asian-Australasian Journal of Animal Sciences, 31(6), 859.',
    corta:'Ramos-Aviña et al. (2018) · Asian-Australas. J. Anim. Sci.', doi:'10.5713/ajas.17.0425',
    nota:{es:'Dietas con más fibra (15 % de DDGS) y con menos fibra (tabla 1). Desempeño del periodo de 1 a 112 días.',en:'Higher-fiber (15 % DDGS) and lower-fiber diets (table 1). Performance for days 1 to 112.'},
    extra:[],
    fases:[
      {nombre:{es:'Más fibra (51 % CNE)',en:'Higher fiber (51 % NSC)'}, f:[['alfalfa',14],['sudan',6],['maizh',54.65],['ddgs',15],['grasa',2],['melaza',6],['carbonato',1.0],['urea',0.5],['sal',0.4],['mgo',0.15],['dical',0.3]],
        rep:{NEm:2.11,NEg:1.45,PC:14.6,FDN:21.7,EE:6.39,Ca:0.81,P:0.41}, excl:{},
        perf:[{trat:{es:'1–112 d',en:'1–112 d'},pvI:127.5,pvF:280.0,dias:112,adg:1.36,dmi:5.66,nemObs:1.93,negObs:1.29,em:0.084}]},
      {nombre:{es:'Menos fibra (64 % CNE)',en:'Lower fiber (64 % NSC)'}, f:[['alfalfa',6],['sudan',6],['maizh',76.23],['grasa',2],['melaza',6],['carbonato',1.27],['urea',1.3],['sal',0.4],['mgo',0.15],['dical',0.65]],
        rep:{NEm:2.19,NEg:1.53,PC:12.9,FDN:13.3,EE:5.54,Ca:0.80,P:0.40}, excl:{},
        perf:[{trat:{es:'1–112 d',en:'1–112 d'},pvI:131.2,pvF:270.3,dias:112,adg:1.24,dmi:5.62,nemObs:1.83,negObs:1.20,em:0.084}]}
    ]},
  { id:'cp2020', pais:{es:'México (Sinaloa)',en:'Mexico (Sinaloa)'}, bandera:'MX', animal:{es:'Toretes de engorda comercial, clima tropical (ITH 80.9)',en:'Commercial feedlot bulls, tropical climate (THI 80.9)'},
    cita:'Castro-Pérez, B. I., Estrada-Angulo, A., Ríos-Rincón, F. G., Núñez-Benítez, V. H., Rivera-Méndez, C. R., Urías-Estrada, J. D., Zinn, R. A., Barreras, A., & Plascencia, A. (2020). The influence of shade allocation or total shade plus overhead fan on growth performance, efficiency of dietary energy utilization, and carcass characteristics of feedlot cattle under tropical ambient conditions. Asian-Australasian Journal of Animal Sciences, 33(6), 1034.',
    corta:'Castro-Pérez et al. (2020) · Asian-Australas. J. Anim. Sci.', doi:'10.5713/ajas.19.0112',
    nota:{es:'1,560 toretes en 24 corrales durante 172 días, con cuatro niveles de sombra. Programa de tres raciones de maíz hojueleado (tabla 1); el trigo rolado al vapor se tomó como trigo de la tabla. Desempeño de todo el periodo.',en:'1,560 bulls in 24 pens for 172 days, with four shade levels. Three-ration steam-flaked corn program (table 1); steam-rolled wheat was taken as table wheat. Whole-period performance.'},
    extra:[],
    fases:[
      {nombre:{es:'Adaptación',en:'Adaptation'}, f:[['maizh',28.64],['alfalfa',20.59],['rastrojo',24.40],['melaza',13.40],['soya44',9.90],['grasa',1.51],['urea',0.50],['carbonato',0.50],['sal',0.56]],
        rep:{NEm:1.63,NEg:1.02,PC:14.42,Ca:0.81,P:0.24}, excl:{}, perf:[]},
      {nombre:{es:'Transición',en:'Transition'}, f:[['maizh',46.70],['alfalfa',9.72],['rastrojo',21.81],['melaza',11.96],['soya44',4.78],['grasa',2.87],['urea',0.80],['carbonato',0.80],['sal',0.56]],
        rep:{NEm:1.87,NEg:1.23,PC:12.40,Ca:0.76,P:0.23}, excl:{}, perf:[]},
      {nombre:{es:'Finalización',en:'Finishing'}, f:[['maizh',42.83],['trigo',26.81],['rastrojo',12.29],['melaza',9.64],['soya44',1.93],['grasa',3.50],['urea',1.20],['carbonato',1.30],['sal',0.50]],
        rep:{NEm:2.14,NEg:1.43,PC:12.54,Ca:0.76,P:0.25}, excl:{},
        perf:[{trat:{es:'Sombra 1.2 m²',en:'Shade 1.2 m²'},pvI:286.5,pvF:482.9,dias:172,adg:1.15,dmi:7.06,nemObs:2.00,negObs:1.34,em:0.077,eg:0.0493},
              {trat:{es:'Sombra 2.4 m²',en:'Shade 2.4 m²'},pvI:286.8,pvF:490.7,dias:172,adg:1.19,dmi:7.59,nemObs:1.93,negObs:1.28,em:0.077,eg:0.0493},
              {trat:{es:'Sombra total (9 m²)',en:'Total shade (9 m²)'},pvI:287.1,pvF:492.8,dias:172,adg:1.20,dmi:7.49,nemObs:1.97,negObs:1.32,em:0.077,eg:0.0493},
              {trat:{es:'Sombra total + ventilador',en:'Total shade + fan'},pvI:287.2,pvF:512.4,dias:172,adg:1.32,dmi:7.62,nemObs:2.07,negObs:1.40,em:0.077,eg:0.0493}]}
    ]},
  { id:'rc2025', pais:{es:'México (Zacatecas)',en:'Mexico (Zacatecas)'}, bandera:'MX', animal:{es:'Becerros enteros de alto riesgo a la llegada (153 kg)',en:'High-risk bull calves on arrival (153 kg)'},
    cita:'Rodríguez-Cordero, D., Carrillo-Muro, O., Hernández-Briano, P., Correa-Aguado, P. I., Rivera-Villegas, A., Barreras, A., Lazalde-Cruz, R., Zinn, R. A., & Plascencia, A. (2025). Optimal period of calcium propionate supplementation in arrival high-risk bull calves: Growth performance, body fat reserves, and serum metabolites. Animals, 15(8), 1170.',
    corta:'Rodríguez-Cordero et al. (2025) · Animals (MDPI)', doi:'10.3390/ani15081170',
    nota:{es:'Ración de recepción con 50 % de forraje para becerros cruzados (continental × británico) en un centro de preacondicionamiento de Zacatecas. PC, EE y FDN fueron analizadas en laboratorio; ENm, ENg, Ca y P son de tabla. El artículo publica costos e ingresos, que sirven para validar la economía.',en:'50 % forage receiving ration for crossbred (continental × British) calves at a Zacatecas preconditioning center. CP, EE and NDF were lab-analyzed; NEm, NEg, Ca and P are tabular. The paper publishes costs and income, used to validate the economics.'},
    extra:[
      {id:'alfalfa_mad', nombre:{es:'Heno de alfalfa madura',en:'Mature alfalfa hay'}, cat:'for', comp:{MS:88,TND:52,NEm:1.04,NEg:0.49,PC:14,PDR:75,FDN:47,pef:0.9,EE:1.3,Ca:1.35,P:0.27,S:0.29,Na:0}},
      {id:'sesqui', nombre:{es:'Sesquicarbonato de sodio',en:'Sodium sesquicarbonate'}, cat:'min', comp:{MS:99,TND:0,NEm:0,NEg:0,PC:0,PDR:0,FDN:0,pef:0,EE:0,Ca:0,P:0,S:0,Na:30.5}},
      {id:'bentonita', nombre:{es:'Bentonita sódica',en:'Sodium bentonite'}, cat:'adi', comp:{MS:95,TND:0,NEm:0,NEg:0,PC:0,PDR:0,FDN:0,pef:0,EE:0,Ca:0,P:0,S:0,Na:0}},
      {id:'monocal', nombre:{es:'Fosfato monocálcico',en:'Monocalcium phosphate'}, cat:'min', comp:{MS:99,TND:0,NEm:0,NEg:0,PC:0,PDR:0,FDN:0,pef:0,EE:0,Ca:16.4,P:21.6,S:1.2,Na:0}}],
    fases:[
      {nombre:{es:'Recepción (56 d)',en:'Receiving (56 d)'}, f:[['alfalfa_mad',25],['avena',25],['maizr',28],['soya44',10.5],['melaza',5],['grasa',2.15],['bentonita',0.75],['sesqui',1.5],['carbonato',0.8],['monocal',0.2],['urea',0.5],['sal',0.5],['premezcla',0.1]],
        rep:{NEm:1.57,NEg:0.98,PC:14.88,EE:4.36,FDN:34.84,Ca:0.93,P:0.29}, excl:{},
        perf:[{trat:{es:'Testigo',en:'Control'},pvI:153.17,pvF:221.33,dias:56,adg:1.217,dmi:4.888,nemObs:1.883,negObs:1.249,em:0.077, econ:{precioAlim:0.349, extra:0, otros:3.82, precioPV:3.62, pub:{alim:95.57, total:99.39, ingreso:246.74, ckg:1.46}, moneda:'USD'}},
              {trat:{es:'Propionato 14 d',en:'Propionate 14 d'},pvI:157.00,pvF:228.25,dias:56,adg:1.272,dmi:4.964,nemObs:1.936,negObs:1.288,em:0.077},
              {trat:{es:'Propionato 28 d',en:'Propionate 28 d'},pvI:159.62,pvF:231.63,dias:56,adg:1.286,dmi:4.958,nemObs:1.969,negObs:1.317,em:0.077},
              {trat:{es:'Propionato 42 d',en:'Propionate 42 d'},pvI:154.12,pvF:233.88,dias:56,adg:1.424,dmi:4.966,nemObs:2.072,negObs:1.407,em:0.077, econ:{precioAlim:0.349, extra:1.76, otros:3.82, precioPV:3.62, pub:{alim:98.90, total:102.72, ingreso:288.73, ckg:1.29}, moneda:'USD'}},
              {trat:{es:'Propionato 56 d',en:'Propionate 56 d'},pvI:157.87,pvF:229.88,dias:56,adg:1.286,dmi:4.898,nemObs:1.979,negObs:1.326,em:0.077}]}
    ]},
  { id:'gv2017', pais:{es:'México · EUA',en:'Mexico · USA'}, bandera:'MX', animal:{es:'Novillos cruzados (251 kg)',en:'Crossbred steers (251 kg)'},
    cita:'González-Vizcarra, V. M., Plascencia, A., Ramos-Aviña, D., & Zinn, R. A. (2017). Influence of substituting steam-flaked corn for dry rolled corn on feedlot cattle growth performance when cattle are allowed either ad libitum or restricted access to the finishing diet. Asian-Australasian Journal of Animal Sciences, 30(11), 1563.',
    corta:'González-Vizcarra et al. (2017) · Asian-Australas. J. Anim. Sci.', doi:'10.5713/ajas.17.0185',
    nota:{es:'Maíz rolado en seco contra maíz hojueleado al vapor (77.1 % de la MS), con acceso al comedero libre o de 2 h. Prueba directa del valor energético del procesamiento del grano. La paja de arroz se capturó con la tabla de Beck et al. (2024).',en:'Dry-rolled versus steam-flaked corn (77.1 % of DM), with free or 2-h bunk access. Direct test of the energy value of grain processing. Rice straw was entered from Beck et al. (2024).'},
    extra:[{id:'paja_arroz', nombre:{es:'Paja de arroz',en:'Rice straw'}, cat:'for', comp:{MS:91,TND:40,NEm:0.93,NEg:0,PC:4,PDR:100,FDN:72,pef:1.0,EE:1.4,Ca:0,P:0,S:0,Na:0}}],
    fases:[
      {nombre:{es:'Maíz rolado en seco',en:'Dry-rolled corn'}, f:[['maizr',77.10],['paja_arroz',5],['alfalfa',5],['grasa',3.5],['melaza',5],['pescado',1.5],['urea',0.6],['carbonato',1.34],['dical',0.36],['mgo',0.2],['sal',0.4]],
        rep:{NEm:2.10,NEg:1.44,PC:11.5,FDN:13.4,Ca:0.80,P:0.38}, excl:{},
        perf:[{trat:{es:'Libre acceso',en:'Free access'},pvI:252.1,pvF:319.0,dias:56,adg:1.19,dmi:5.99,nemObs:2.05,negObs:1.39,em:0.077},
              {trat:{es:'Acceso de 2 h',en:'2-h access'},pvI:252.8,pvF:296.7,dias:56,adg:0.78,dmi:4.85,nemObs:1.96,negObs:1.31,em:0.077}]},
      {nombre:{es:'Maíz hojueleado al vapor',en:'Steam-flaked corn'}, f:[['maizh',77.10],['paja_arroz',5],['alfalfa',5],['grasa',3.5],['melaza',5],['urea',1.0],['carbonato',1.5],['dical',0.5],['mgo',0.2],['sal',0.4]],
        rep:{NEm:2.24,NEg:1.57,PC:11.5,FDN:13.45,Ca:0.80,P:0.36}, excl:{},
        perf:[{trat:{es:'Libre acceso',en:'Free access'},pvI:251.9,pvF:327.1,dias:56,adg:1.34,dmi:6.10,nemObs:2.18,negObs:1.50,em:0.077},
              {trat:{es:'Acceso de 2 h',en:'2-h access'},pvI:249.0,pvF:308.1,dias:56,adg:1.06,dmi:5.01,nemObs:2.22,negObs:1.54,em:0.077}]}
    ]},
  { id:'mo2023', pais:{es:'EUA · México',en:'USA · Mexico'}, bandera:'US', animal:{es:'Novillos Holstein (136 kg)',en:'Holstein steers (136 kg)'},
    cita:'Montano, M. F., Carvalho, P. H. V., Ferraz Junior, M. V. C., Latack, B. C., & Zinn, R. A. (2023). Influence of level of dried distillers grains plus solubles substitution for steam-flaked corn on characteristics of growth performance, and dietary energetics of calf-fed Holstein steers during the initial 16-week growing phase: Metabolizable protein versus metabolizable amino acids. Translational Animal Science, 7(1), txad024.',
    corta:'Montano et al. (2023) · Translational Animal Science', doi:'10.1093/tas/txad024',
    nota:{es:'Cuatro niveles de DDGS (10–25 % de la MS) en sustitución del maíz hojueleado. Los autores publican también qué porcentaje del requerimiento de proteína metabolizable cubría cada ración.',en:'Four DDGS levels (10–25 % of DM) replacing steam-flaked corn. The authors also publish what percentage of the metabolizable-protein requirement each ration covered.'},
    extra:[],
    fases:[[10,68.41,1.10,{NEm:2.21,NEg:1.54,PC:14.2,EE:6.71,FDN:17.7,Ca:0.76,P:0.33,S:0.18},[136.1,294.8,1.43,5.97,1.97,1.32,93]],
           [15,63.66,0.85,{NEm:2.21,NEg:1.54,PC:14.5,EE:7.02,FDN:19.6,Ca:0.77,P:0.36,S:0.19},[136.0,294.5,1.43,5.76,2.03,1.37,96]],
           [20,58.91,0.60,{NEm:2.21,NEg:1.54,PC:14.9,EE:7.33,FDN:21.5,Ca:0.79,P:0.39,S:0.21},[135.9,292.7,1.41,5.82,1.99,1.34,98]],
           [25,54.11,0.40,{NEm:2.20,NEg:1.53,PC:15.3,EE:7.64,FDN:23.3,Ca:0.80,P:0.41,S:0.22},[134.7,295.8,1.45,5.85,2.02,1.36,100]]]
      .map(([d,m,u,rep,p])=>({nombre:{es:`${d} % de DDGS`,en:`${d} % DDGS`}, f:[['sudan',8],['alfalfa',4],['grasa',2.5],['melaza',4],['ddgs',d],['maizh',m],['urea',u],['carbonato',1.6],['mgo',0.09],['sal',0.30],['otros',0.018]],
        rep, excl:{}, perf:[{trat:{es:'1–111 d',en:'1–111 d'},pvI:p[0],pvF:p[1],dias:111,adg:p[2],dmi:p[3],nemObs:p[4],negObs:p[5],em:0.084,mpPct:p[6],holstein:true}]}))},
  { id:'sc2024', pais:{es:'EUA · México',en:'USA · Mexico'}, bandera:'US', animal:{es:'Becerros Holstein (122 kg)',en:'Holstein calves (122 kg)'},
    cita:'Salinas-Chavira, J., Carvalho, P. H. V., Latack, B. C., Ferraz Junior, M. V. C., Montano, M., & Zinn, R. A. (2024). Influence of metabolizable protein and methionine supplementation on growth-performance of Holstein steer calves during the initial 112-d feedlot growing phase. Translational Animal Science, 8, txae003.',
    corta:'Salinas-Chavira et al. (2024) · Translational Animal Science', doi:'10.1093/tas/txae003',
    nota:{es:'Ración testigo y ración con 3 % de harina de sangre para cubrir la proteína metabolizable (tabla 1). La harina de sangre se capturó con la tabla de Beck et al. (2024).',en:'Control ration and ration with 3 % blood meal to cover metabolizable protein (table 1). Blood meal was entered from Beck et al. (2024).'},
    extra:[{id:'sangre', nombre:{es:'Harina de sangre',en:'Blood meal'}, cat:'pro', comp:{MS:90,TND:72,NEm:1.70,NEg:1.10,PC:100,PDR:40,FDN:2,pef:0.1,EE:1.1,Ca:0.18,P:0.20,S:0.56,Na:0}}],
    fases:[
      {nombre:{es:'Testigo',en:'Control'}, f:[['sudan',8],['alfalfa',4],['grasa',2.5],['melaza',4],['ddgs',7],['maizh',70.99],['urea',1.15],['carbonato',1.68],['dical',0.10],['mgo',0.15],['sal',0.40]],
        rep:{NEm:2.21,NEg:1.54,PC:13.7,EE:6.5,FDN:16.6,Ca:0.80,P:0.34,S:0.17}, excl:{},
        perf:[{trat:{es:'1–112 d',en:'1–112 d'},pvI:122,pvF:250,dias:112,adg:1.14,dmi:5.18,nemObs:1.78,negObs:1.15,em:0.084}]},
      {nombre:{es:'Más proteína metabolizable',en:'More metabolizable protein'}, f:[['sudan',8],['alfalfa',4],['grasa',2.5],['melaza',4],['ddgs',7],['sangre',3],['maizh',67.99],['urea',1.15],['carbonato',1.68],['dical',0.10],['mgo',0.15],['sal',0.40]],
        rep:{NEm:2.18,NEg:1.52,PC:16.2,EE:6.4,FDN:16.3,Ca:0.81,P:0.34,S:0.19}, excl:{},
        perf:[{trat:{es:'1–112 d',en:'1–112 d'},pvI:122,pvF:260,dias:112,adg:1.23,dmi:5.31,nemObs:1.84,negObs:1.21,em:0.084}]}
    ]},
  { id:'ca2022', pais:{es:'EUA · México',en:'USA · Mexico'}, bandera:'US', animal:{es:'Novillos Holstein (131 kg)',en:'Holstein steers (131 kg)'},
    cita:'Carvalho, P. H. V., Latack, B. C., Flores, R., Montano, M. F., & Zinn, R. A. (2022). Interaction of early metabolizable protein supplementation and virginiamycin on feedlot growth performance and carcass characteristics of calf-fed Holstein steers. Translational Animal Science, 6(1), txab228.',
    corta:'Carvalho et al. (2022) · Translational Animal Science', doi:'10.1093/tas/txab228',
    nota:{es:'Ración convencional con 10 % de DDGS y ración con harina de sangre (tabla 1). Desempeño de 1 a 112 días sin virginiamicina.',en:'Conventional ration with 10 % DDGS and ration with blood meal (table 1). Performance days 1–112 without virginiamycin.'},
    extra:[{id:'sangre', nombre:{es:'Harina de sangre',en:'Blood meal'}, cat:'pro', comp:{MS:90,TND:72,NEm:1.70,NEg:1.10,PC:100,PDR:40,FDN:2,pef:0.1,EE:1.1,Ca:0.18,P:0.20,S:0.56,Na:0}}],
    fases:[
      {nombre:{es:'Convencional',en:'Conventional'}, f:[['sudan',8],['alfalfa',4],['grasa',2.5],['melaza',4],['ddgs',10],['maizh',68.09],['urea',1.15],['carbonato',1.68],['dical',0.10],['mgo',0.15],['sal',0.30]],
        rep:{NEm:2.21,NEg:1.54,PC:14.3,EE:6.7,FDN:17.7,Ca:0.80,P:0.35}, excl:{},
        perf:[{trat:{es:'1–112 d',en:'1–112 d'},pvI:131.3,pvF:275.7,dias:112,adg:1.29,dmi:5.80,nemObs:1.84,negObs:1.21,em:0.084}]},
      {nombre:{es:'Con harina de sangre',en:'With blood meal'}, f:[['sudan',8],['alfalfa',4],['grasa',2.5],['melaza',4],['ddgs',7],['sangre',3],['maizh',68.09],['urea',1.15],['carbonato',1.68],['dical',0.10],['mgo',0.15],['sal',0.30]],
        rep:{NEm:2.19,NEg:1.52,PC:16.2,EE:6.4,FDN:16.3,Ca:0.81,P:0.34}, excl:{},
        perf:[{trat:{es:'1–112 d',en:'1–112 d'},pvI:131.2,pvF:284.2,dias:112,adg:1.37,dmi:5.93,nemObs:1.89,negObs:1.25,em:0.084}]}
    ]}
];

/* =====================================================================
   4. ESTADO / STATE (autosaved in this browser)
   ===================================================================== */
const CLAVE = 'ratiobos_v1';
let S = null;
function animalInicial(cat, bio, sexo){
  const C = CATEGORIAS[cat], B = BIOTIPOS[bio], X = SEXOS[sexo]||SEXOS.novillo;
  const vaca = C.tipo==='vaca';
  return { pv: C.pv, pf: vaca ? B.mw : Math.round(B.pf*(cat==='vaquillas'?1:X.fPF)/10)*10, mw:B.mw, adg: C.adg||0, srw:478, dmi:null,
    diasGest: cat==='gestacion'?240:60, pn:B.pn, leche: cat==='lactacion'?B.leche:0, grasaL:4.0, protL:3.4, nemSup: ({desarrollo:1.65,engorda:2.05,vaquillas:1.35,gestacion:1.15,lactacion:1.30})[cat] };
}
function estadoInicial(){
  const s = {
    version:1, bloque:'inicio',
    cat:'engorda', biotipo:'cruza', sexo:'torete',
    region:'OB', temporada:'seca', edo:'MX-JAL',
    animal:null,
    cond:{tPrev:22, tAct:24, hr:40, noche:true, jadeo:'no', lodo:0, sombra:'lamina', piso:'drenado', sistema:'corral', sAgua:150, ith:0, ithEf:0,
          implante:true, ionoforo:true, cabezas:100, mezcla:3000, comprakg:62, ventakg:58, otrosDia:9,
          med:{ionDosis:30, antib:'ninguno', antibDosis:11, beta:'ninguno', betaDosis:6.5, betaDias:30, implantes:1, desparas:1, vacunas:2}},
    req:null, reqEditado:false, base:'ms',
    ingredientes: ING_LIB.map(ingDesdeLib),
    sel: Object.fromEntries(ING_LIB.map(r=>[r[0], !!r[8]])),
    moneda:'$', proyecto:{nombre:'', autor:'', rancho:''},
    resultado:null, programa:null, prog:null, evaluar:{}, visitados:{}, valCaso:'ea2022'
  };
  s.animal = animalInicial(s.cat, s.biotipo, s.sexo);
  aplicarRegion(s); preciosRegion(s);
  return s;
}
function guardar(){ try{ localStorage.setItem(CLAVE, JSON.stringify(S)); }catch(e){} actualizarPill(); }
function completarEstado(s){
  const base = estadoInicial();
  for(const k in base) if(s[k]===undefined) s[k]=base[k];
  for(const k in base.cond) if(s.cond[k]===undefined) s.cond[k]=base.cond[k];
  for(const k in base.cond.med) if(s.cond.med[k]===undefined) s.cond.med[k]=base.cond.med[k];
  if(!REGIONES[s.region]) s.region='OB';
  s.ingredientes.forEach(i=>{ if(!i.env) i.env = envDe(i.id); });
  if(!CATEGORIAS[s.cat]) s.cat='engorda';
  if(!BIOTIPOS[s.biotipo]) s.biotipo='cruza';
  if(!SEXOS[s.sexo]) s.sexo='novillo';
  const a0 = animalInicial(s.cat, s.biotipo, s.sexo); s.animal = s.animal||a0; for(const k in a0) if(s.animal[k]===undefined) s.animal[k]=a0[k];
  ING_LIB.forEach(r=>{ if(!s.ingredientes.find(i=>i.id===r[0])){ s.ingredientes.push(ingDesdeLib(r)); s.sel[r[0]]=false; } });
  if(!s.req) cargarRequerimientos(s);
  NUTRIENTES.forEach(n=>{ if(!s.req[n.k]) s.req[n.k]=[null,null]; });
  return s;
}
function cargar(){
  try{ const t = localStorage.getItem(CLAVE); if(t){ const s = JSON.parse(t); if(s && s.version===1 && s.animal) return completarEstado(s); } }catch(e){}
  const s = estadoInicial(); cargarRequerimientos(s); return s;
}
