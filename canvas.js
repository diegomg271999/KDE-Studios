/* =========================================================
   ÓRBITAS DE LUZ · Arte generativo con Canvas
   Concepto: un hexágono (el "sol" de KDE Studios) rodeado de
   anillos, con figuras flotantes y líneas de constelación.
   ========================================================= */

// ---------- 1. VARIABLES GLOBALES ----------
const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");

const ANCHO = lienzo.width;   // 1000
const ALTO = lienzo.height;   // 640

// Zona reservada para el texto (abajo a la izquierda): ahí no se dibujan figuras
const ZONA_TEXTO = { x: 0, y: ALTO - 240, ancho: 600, alto: 240 };

// ---------- 2. ARREGLOS: PALETAS DE COLOR ----------
// fondo: 3 colores del degradado | colores: 5 colores para las figuras
const paletas = [
  {
    nombre: "Aurora",
    fondo: ["#2a1b6b", "#0d0b1f", "#5a2340"],
    colores: ["#6c63ff", "#22e0d0", "#3bb8e8", "#ff5d8f", "#e9e4ff"]
  },
  {
    nombre: "Atardecer",
    fondo: ["#3b1020", "#120a14", "#7a3b12"],
    colores: ["#ff8a3d", "#ffd166", "#ff4d6d", "#c77dff", "#fff1d6"]
  },
  {
    nombre: "Bosque neón",
    fondo: ["#062a2a", "#07100f", "#1b4d2e"],
    colores: ["#3cff9e", "#00d4c8", "#b8ff5a", "#4dabf7", "#eafff4"]
  }
];

let paletaActual = 0;   // índice de la paleta en uso
let composicion = null; // datos de la composición (posiciones, tamaños...)

// ---------- 3. FUNCIONES AUXILIARES ----------
function aleatorio(min, max) {
  return min + Math.random() * (max - min);
}

function colorDe(indice) {
  const colores = paletas[paletaActual].colores;
  return colores[indice % colores.length];
}

// Convierte "#rrggbb" a "rgba(r,g,b,alfa)" para manejar transparencias
function conAlfa(hex, alfa) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return "rgba(" + r + "," + g + "," + b + "," + alfa + ")";
}

function enZonaTexto(x, y, margen) {
  return (
    x < ZONA_TEXTO.x + ZONA_TEXTO.ancho + margen &&
    y > ZONA_TEXTO.y - margen
  );
}

// ---------- 4. GENERAR LOS DATOS DE UNA COMPOSICIÓN NUEVA ----------
// Se guardan índices de color (no colores) para poder cambiar de paleta
// sin alterar la distribución de las figuras.
function crearComposicion() {
  const datos = {
    // Hexágono central con sus anillos
    sol: {
      x: aleatorio(640, 800),
      y: aleatorio(210, 340),
      radio: aleatorio(58, 82),
      anillos: Math.floor(aleatorio(5, 9)),
      separacion: aleatorio(24, 34),
      giro: aleatorio(0, Math.PI / 3)
    },
    figuras: [],
    estrellas: [],
    constelacion: []
  };

  // 40 figuras flotantes (bucle for)
  for (let i = 0; i < 40; i++) {
    let x, y;
    do {
      x = aleatorio(30, ANCHO - 30);
      y = aleatorio(30, ALTO - 30);
    } while (enZonaTexto(x, y, 20));

    // Condicional: se elige el tipo de figura al azar
    let tipo;
    const azar = Math.random();
    if (azar < 0.4) {
      tipo = "circulo";
    } else if (azar < 0.7) {
      tipo = "triangulo";
    } else {
      tipo = "cuadrado";
    }

    datos.figuras.push({
      tipo: tipo,
      x: x,
      y: y,
      tamano: aleatorio(8, 30),
      giro: aleatorio(0, Math.PI * 2),
      color: Math.floor(aleatorio(0, 5)),
      relleno: Math.random() < 0.6 // true = sólido, false = solo contorno
    });
  }

  // 90 estrellas pequeñas
  for (let i = 0; i < 90; i++) {
    datos.estrellas.push({
      x: aleatorio(0, ANCHO),
      y: aleatorio(0, ALTO),
      radio: aleatorio(0.5, 1.8),
      brillo: aleatorio(0.3, 0.9)
    });
  }

  // 9 puntos unidos por líneas (constelación)
  for (let i = 0; i < 9; i++) {
    let x, y;
    do {
      x = aleatorio(40, ANCHO - 40);
      y = aleatorio(40, ALTO - 40);
    } while (enZonaTexto(x, y, 30));
    datos.constelacion.push({ x: x, y: y });
  }

  return datos;
}

// ---------- 5. FUNCIONES DE DIBUJO ----------

// 5.1 Fondo con degradado lineal + dos resplandores radiales
function dibujarFondo() {
  const p = paletas[paletaActual];

  const degradado = ctx.createLinearGradient(0, 0, ANCHO, ALTO);
  degradado.addColorStop(0, p.fondo[0]);
  degradado.addColorStop(0.5, p.fondo[1]);
  degradado.addColorStop(1, p.fondo[2]);
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Resplandor detrás del hexágono
  const sol = composicion.sol;
  const brillo = ctx.createRadialGradient(sol.x, sol.y, 10, sol.x, sol.y, 380);
  brillo.addColorStop(0, conAlfa(p.colores[0], 0.35));
  brillo.addColorStop(1, conAlfa(p.colores[0], 0));
  ctx.fillStyle = brillo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
}

// 5.2 Estrellas (círculos pequeños)
function dibujarEstrellas() {
  const blanco = paletas[paletaActual].colores[4];
  for (let i = 0; i < composicion.estrellas.length; i++) {
    const e = composicion.estrellas[i];
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radio, 0, Math.PI * 2);
    ctx.fillStyle = conAlfa(blanco, e.brillo);
    ctx.fill();
  }
}

// 5.3 Líneas de constelación (moveTo / lineTo)
function dibujarConstelacion() {
  const puntos = composicion.constelacion;
  const color = colorDe(1);

  ctx.beginPath();
  ctx.moveTo(puntos[0].x, puntos[0].y);
  for (let i = 1; i < puntos.length; i++) {
    ctx.lineTo(puntos[i].x, puntos[i].y);
  }
  ctx.strokeStyle = conAlfa(color, 0.45);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Nodos brillantes en cada punto
  for (let i = 0; i < puntos.length; i++) {
    ctx.beginPath();
    ctx.arc(puntos[i].x, puntos[i].y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// 5.4 Anillos concéntricos (arc con solo contorno)
function dibujarAnillos() {
  const sol = composicion.sol;
  const color = colorDe(1);

  for (let i = 1; i <= sol.anillos; i++) {
    const radio = sol.radio + i * sol.separacion;
    ctx.beginPath();
    ctx.arc(sol.x, sol.y, radio, 0, Math.PI * 2);
    ctx.strokeStyle = conAlfa(color, 0.75 - i * 0.07);
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }
}

// 5.5 Hexágono central con degradado y resplandor
function dibujarHexagono() {
  const sol = composicion.sol;
  const relleno = ctx.createLinearGradient(
    sol.x - sol.radio, sol.y - sol.radio,
    sol.x + sol.radio, sol.y + sol.radio
  );
  relleno.addColorStop(0, colorDe(0));
  relleno.addColorStop(1, colorDe(2));

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angulo = sol.giro + (Math.PI / 3) * i;
    const x = sol.x + Math.cos(angulo) * sol.radio;
    const y = sol.y + Math.sin(angulo) * sol.radio;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = relleno;
  ctx.shadowColor = colorDe(0);
  ctx.shadowBlur = 35;
  ctx.fill();
  ctx.shadowBlur = 0;
}

// 5.6 Figuras flotantes: el if / else decide qué figura dibujar
function dibujarFiguras() {
  for (let i = 0; i < composicion.figuras.length; i++) {
    const f = composicion.figuras[i];
    const color = colorDe(f.color);

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.giro);
    ctx.fillStyle = conAlfa(color, 0.85);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;

    if (f.tipo === "circulo") {
      ctx.beginPath();
      ctx.arc(0, 0, f.tamano / 2, 0, Math.PI * 2);
    } else if (f.tipo === "triangulo") {
      ctx.beginPath();
      ctx.moveTo(0, -f.tamano / 2);
      ctx.lineTo(f.tamano / 2, f.tamano / 2);
      ctx.lineTo(-f.tamano / 2, f.tamano / 2);
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.rect(-f.tamano / 2, -f.tamano / 2, f.tamano, f.tamano);
    }

    if (f.relleno) {
      ctx.fill();
    } else {
      ctx.stroke();
    }
    ctx.restore();
  }
}

// 5.7 Título y subtítulo dibujados con fillText()
function dibujarTextos() {
  const p = paletas[paletaActual];
  const x = 60;

  // Franja suave detrás del texto para mantener la legibilidad
  const velo = ctx.createLinearGradient(0, ALTO - 230, 0, ALTO);
  velo.addColorStop(0, "rgba(0,0,0,0)");
  velo.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = velo;
  ctx.fillRect(0, ALTO - 230, ANCHO, 230);

  ctx.textBaseline = "alphabetic";

  // Título con degradado de texto
  ctx.font = '800 76px "Syne", "Arial Black", sans-serif';
  const gradTitulo = ctx.createLinearGradient(x, 0, x + 520, 0);
  gradTitulo.addColorStop(0, p.colores[4]);
  gradTitulo.addColorStop(1, p.colores[1]);
  ctx.fillStyle = gradTitulo;
  ctx.fillText("Órbitas", x, ALTO - 125);
  ctx.fillText("de luz", x, ALTO - 55);

  // Subtítulo
  ctx.font = '500 20px "Inter", Arial, sans-serif';
  ctx.fillStyle = conAlfa(p.colores[4], 0.85);
  ctx.fillText("Un universo geométrico creado con código", x + 270, ALTO - 55);
}

// ---------- 6. FUNCIÓN PRINCIPAL DE DIBUJO ----------
// Dibuja todo en orden: de lo más lejano a lo más cercano.
function dibujarComposicion() {
  ctx.clearRect(0, 0, ANCHO, ALTO);
  dibujarFondo();
  dibujarEstrellas();
  dibujarConstelacion();
  dibujarAnillos();
  dibujarHexagono();
  dibujarFiguras();
  dibujarTextos();
}

// ---------- 7. ACCIONES DE LOS BOTONES ----------
function generarNueva() {
  composicion = crearComposicion(); // nuevas posiciones y tamaños aleatorios
  dibujarComposicion();
}

function cambiarPaleta(indice) {
  paletaActual = indice;            // misma distribución, nuevos colores
  dibujarComposicion();

  const botones = document.querySelectorAll(".btn-paleta");
  botones.forEach(function (boton) {
    boton.classList.toggle("activa", Number(boton.dataset.paleta) === indice);
  });
}

function guardarPNG() {
  const enlace = document.createElement("a");
  enlace.download = "orbitas-de-luz-" + paletas[paletaActual].nombre.toLowerCase().replace(/\s+/g, "-") + ".png";
  enlace.href = lienzo.toDataURL("image/png");
  enlace.click();
}

// ---------- 8. EVENTOS (addEventListener) ----------
document.getElementById("btnGenerar").addEventListener("click", generarNueva);
document.getElementById("btnGuardar").addEventListener("click", guardarPNG);

document.querySelectorAll(".btn-paleta").forEach(function (boton) {
  boton.addEventListener("click", function () {
    cambiarPaleta(Number(boton.dataset.paleta));
  });
});

// ---------- 9. INICIO: la composición aparece al cargar la página ----------
generarNueva();

// Cuando las tipografías terminan de cargar, se redibuja para que el texto
// del Canvas use Syne e Inter (y no la fuente de respaldo).
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(dibujarComposicion);
}
