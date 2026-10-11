# Arma index.html (un solo archivo autocontenido) a partir de las partes de src/.
$ErrorActionPreference = 'Stop'
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $d 'src'
$u8 = New-Object Text.UTF8Encoding $false
function Leer($n){ [IO.File]::ReadAllText((Join-Path $src $n), [Text.Encoding]::UTF8) }

# Símbolos propios reutilizados de RatioAvis (mismos autores)
$avis = Leer 'ref_sprite_avis.svg'
$ids = 'i-corn','i-soy','i-sack','i-dna','i-climate','i-price','i-scale','i-calendar','i-report','i-check','i-book','i-prod','i-cien','i-spark'
$sim = foreach($i in $ids){ $m = [regex]::Match($avis, '(?s)<symbol id="' + $i + '".*?</symbol>'); if(-not $m.Success){ throw "Falta $i" }; $m.Value }
$sim = ($sim -join "`n").Replace('font-family="Georgia,serif"','font-family="Palatino Linotype,Palatino,serif"')
$defs = '<defs>' +
  '<linearGradient id="lg-logo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6b5a"/><stop offset="1" stop-color="#173a31"/></linearGradient>' +
  '<linearGradient id="lg-corn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7d25c"/><stop offset="1" stop-color="#e9ad2f"/></linearGradient>' +
  '<linearGradient id="lg-sack" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6c48c"/><stop offset="1" stop-color="#c99b5e"/></linearGradient>' +
  '<clipPath id="cp-corn"><ellipse cx="40" cy="54" rx="15" ry="40"/></clipPath></defs>'
$sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">' + $defs + "`n" + (Leer '03_sprite_bos.svg') + "`n" + $sim + "`n</svg>"

$logo = [IO.File]::ReadAllText((Join-Path $d 'logo.svg')).Trim()
$fav = 'data:image/svg+xml,' + [Uri]::EscapeDataString($logo)

# Enlaces a las demás apps de la familia Ratio
$familia = Leer '90_familia.html'

$head = @"
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RatioBos — Formulación de raciones para bovinos de carne · Beef cattle ration formulation</title>
<meta name="description" content="RatioBos: formulación guiada de raciones de mínimo costo para bovinos productores de carne, con requerimientos NASEM (2016), regiones de México y huella ambiental / guided least-cost ration formulation for beef cattle. ES/EN.">
<link rel="icon" href="$fav">
<!--
  =====================================================================
  RatioBos — «Ratio» (latín: razón, cálculo; origen de «ración») + «Bos» (bovino)
  Formulación de raciones de mínimo costo para bovinos productores de carne · Bilingüe ES/EN
  Un solo archivo (HTML + CSS + JavaScript). Sin servidor, sin instalación, sin recursos de terceros.
  Autores: Héctor Tecumshé Mojica Zárate · Luis Ángel Barrera Guzmán

  MAPA DEL ARCHIVO / FILE MAP
    1. <style>      diseño visual (Palatino; colores en :root; claro y oscuro)
    2. SVG sprite   logotipo e ilustraciones vectoriales originales (animadas)
    3. DATOS        configuración, idioma, nutrientes, animales, ingredientes, validación
    3b. REGIONES    mapa de México, clima, suelos, precios e infraestructura
    4. AYUDA        signos «?» con concepto y escala de decisión
    5. MOTOR        ecuaciones NASEM (2016) + programación lineal con certificado dual
    6. BLOQUES      animal, región, requerimientos, manejo, ingredientes, precios,
                    formulación, programa, tablero, sostenibilidad e informe
    7. VALIDACIÓN, TEORÍA y NAVEGACIÓN
  =====================================================================
-->
<style>
$(Leer '01_estilo_base.css')
$(Leer '02_estilo_bos.css')
</style>
</head>
<body>
$sprite
<header class="bar">
  <div class="bar-top">
    <button class="brand" data-ir="inicio" aria-label="RatioBos">
      <span class="brand-ico"><svg viewBox="0 0 64 64"><use href="#i-logo"/></svg></span>
      <span><span class="brand-name">Ratio<i>Bos</i></span> <span class="brand-sub" id="brandSub"></span></span>
    </button>
    <span class="sp"></span>
    <span class="ibtn no-print" id="pill"><span class="lbl" id="pillTxt"></span></span>
    <div class="langsw no-print" role="group" aria-label="Idioma / Language"><button data-lang="es">ES</button><button data-lang="en">EN</button></div>
    <div class="langsw modesw no-print" role="group" id="modesw" aria-label="Vista / View"><button data-vista="prod" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21v-9M12 12C12 7.5 9 5 4.5 5c0 4.5 3 7 7.5 7zM12 14c0-3.8 2.6-6.5 7.5-6.5 0 4.2-2.9 6.5-7.5 6.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span id="lblProd">Productor</span></button><button data-vista="cien" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6L4.6 18.6A1.6 1.6 0 0 0 6 21h12a1.6 1.6 0 0 0 1.4-2.4L14 9V3M7.2 15h9.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span id="lblCien">Científico</span></button></div>
    <button class="ibtn round" id="btnTema" aria-label="Tema / Theme">☀</button>
    <button class="ibtn round" id="btnAyuda" aria-label="Ayuda / Help">?</button>
  </div>
  <nav class="steps-nav" id="nav"></nav>
  <div class="progress no-print"><span id="progTxt"></span><div class="track"><div class="fill" id="progFill"></div></div></div>
</header>
<main id="main"></main>
$familia<footer class="pie" id="pie"></footer>
<div class="toast" id="toast"></div>
<dialog id="dlgAyuda"></dialog>
"@
$js = '10_datos.js','12_mapa.js','15_regiones.js','20_ayuda.js','30_motor.js','40_bloques_a.js','45_region.js','50_bloques_b.js','55_tablero.js','57_sostenible.js','60_valid_teoria.js'
$cuerpo = ($js | ForEach-Object { "<script>`n" + (Leer $_) + "`n</script>" }) -join "`n"
$html = $head + "`n" + $cuerpo + "`n</body>`n</html>`n"
[IO.File]::WriteAllText((Join-Path $d 'index.html'), $html, $u8)
"index.html  {0:N0} KB" -f ((Get-Item (Join-Path $d 'index.html')).Length/1KB)
