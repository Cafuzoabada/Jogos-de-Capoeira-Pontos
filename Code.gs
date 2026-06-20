// ═══════════════════════════════════════════════════════════
// JOGOS IBÉRICOS 2026 · Apps Script Backend v4.0
// ═══════════════════════════════════════════════════════════

function getSS() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ── Servir páginas web ──────────────────────────────────────
function doGet(e) {
  if (e.parameter.action) return _apiHandler(e);

  var page = (e.parameter.page || 'juez').toLowerCase();
  var tmpl;
  if (page === 'mesa') {
    tmpl = HtmlService.createTemplateFromFile('mesa');
  } else {
    tmpl = HtmlService.createTemplateFromFile('juez');
    tmpl.juezNum = e.parameter.juez || '0';
  }
  return tmpl.evaluate()
    .setTitle(page === 'mesa' ? 'Mesa · Jogos Ibéricos 2026' : 'Juez · Jogos Ibéricos 2026')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0');
}

function _apiHandler(e) {
  var result;
  try {
    switch (e.parameter.action) {
      case 'getJogoActivo':
        result = getJogoActivo(); break;
      case 'getAllCategorias':
        result = getAllCategorias(); break;
      case 'getJogosPorCategoria':
        result = getJogosPorCategoria(e.parameter.hoja); break;
      case 'getResultadoJogo':
        result = getResultadoJogo(e.parameter.jogoId); break;
      case 'submitPuntuacion':
        result = submitPuntuacion(
          e.parameter.jogoId,
          parseInt(e.parameter.juez),
          parseFloat(e.parameter.nota),
          parseFloat(e.parameter.restaA),
          parseFloat(e.parameter.restaB)
        ); break;
      case 'activarJogo':
        result = activarJogo(JSON.parse(e.parameter.jogo)); break;
      case 'confirmarGanador':
        result = confirmarGanador(e.parameter.jogoId, e.parameter.ganador); break;
      case 'reactivarJogo':
        result = reactivarJogo(e.parameter.jogoId); break;
      case 'desactivarJogo':
        result = desactivarJogo(e.parameter.jogoId); break;
      case 'getJogosActivos':
        result = getJogosActivos(); break;
      case 'generarParejasPorJuego':
        result = generarParejasPorJuego(e.parameter.hoja, e.parameter.juegoKey); break;
      case 'getJuegosDeCategoria':
        result = getJuegosDeCategoria(e.parameter.hoja); break;
      case 'getSiguienteFaseInfo':
        result = getSiguienteFaseInfo(e.parameter.hoja); break;
      case 'iniciarSiguienteFase':
        result = iniciarSiguienteFase(e.parameter.hoja); break;
      case 'iniciarFaseDirecta':
        result = iniciarFaseDirecta(e.parameter.hoja, e.parameter.fase); break;
      case 'agregarParejaImpar':
        result = agregarParejaImpar(e.parameter.hoja, e.parameter.juegoKey); break;
      default:
        result = { error: 'Accion desconocida' };
    }
  } catch(err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Setup ───────────────────────────────────────────────────
function setupRapido() {
  var ss = getSS();
  var s1 = ss.getSheetByName('APP_CONTROL');
  if (!s1) {
    s1 = ss.insertSheet('APP_CONTROL');
    s1.appendRow(['jogo_id','ronda','num','categoria','codigo_a','codigo_b',
                  'nombre_a','nombre_b','juego','estado','ganador','timestamp']);
    s1.setFrozenRows(1);
  }
  var s2 = ss.getSheetByName('APP_PUNTUACIONES');
  if (!s2) {
    s2 = ss.insertSheet('APP_PUNTUACIONES');
    s2.appendRow(['jogo_id','juez','nota','resta_a','resta_b','timestamp']);
    s2.setFrozenRows(1);
  }
  Logger.log('Setup completado');
}

function _getOrCreate(name, headers) {
  var ss = getSS();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); }
  return sh;
}

// ══════════════════════════════════════════════════════════════
// NOMBRES: resolución de códigos → nombres reales
// ══════════════════════════════════════════════════════════════

function _getJogadoresPorLlave() {
  var sh = getSS().getSheetByName('INSCRITOS_FORM');
  if (!sh) return {};
  var rows    = sh.getDataRange().getValues();
  var byLlave = {};

  var cordaRank = {
    'Crua':1,'Crua/Amarela':2,'Amarela':3,'Amarela/Laranja':4,
    'Laranja':5,'Laranja/Azul':6,'Azul':7,'Azul/Verde':8,
    'Verde':9,'Verde/Roxa':10,'Roxa':11,'Roxa/Marrom':12,
    'Marrom':13,'Marrom/Vermelha':14
  };

  for (var i = 4; i < rows.length; i++) {
    var nome  = String(rows[i][6]  || '').trim();
    var llave = String(rows[i][19] || '').trim();
    var corda = String(rows[i][11] || '').trim();
    if (!nome || !llave) continue;
    if (!byLlave[llave]) byLlave[llave] = [];
    byLlave[llave].push({ nome: nome, rank: cordaRank[corda] || 0 });
  }

  for (var ll in byLlave) {
    byLlave[ll].sort(function(a, b) { return b.rank - a.rank; });
  }
  return byLlave;
}

function _getClasifLlaveMap() {
  var sh = getSS().getSheetByName('LLAVES_INDEX');
  if (!sh) return {};
  var rows = sh.getDataRange().getValues();
  var map  = {};

  var equiv = {
    'Adulto-A · Masculino':        'CLASIF_A_M',
    'Adulto-A · Femenino':         'CLASIF_A_F',
    'Adulto-B · Masculino':        'CLASIF_B_M',
    'Adulto-B · Femenino':         'CLASIF_B_F',
    'Adulto-C · Masculino':        'CLASIF_C_M',
    'Adulto-C · Femenino':         'CLASIF_C_F',
    'Adulto-D · Masculino':        'CLASIF_D_M',
    'Adulto-D · Femenino':         'CLASIF_D_F',
    'Adulto-E · Masculino':        'CLASIF_E_M',
    'Adulto-E · Femenino':         'CLASIF_E_F',
    'Baobá-Graduados+ · Masculino':'CLASIF_Baobá_M',
    'Baobá-Graduados+ · Femenino': 'CLASIF_Baobá_F',
    'Baobá-Alumnos · Masculino':   'CLASIF_Baobá_M',
    'Baobá-Alumnos · Femenino':    'CLASIF_Baobá_F',
    'Juvenil · Masculino':         'CLASIF_Juvenil_M',
    'Juvenil · Femenino':          'CLASIF_Juvenil_F',
    'Infantil · Masculino':        'CLASIF_INF',
    'Infantil · Femenino':         'CLASIF_INF'
  };

  for (var i = 0; i < rows.length; i++) {
    var llId = String(rows[i][0] || '').trim();
    var cat  = String(rows[i][1] || '').trim();
    if (llId.indexOf('L') !== 0 || !cat) continue;
    var clasifNombre = equiv[cat];
    if (clasifNombre) map[clasifNombre] = llId;
  }
  return map;
}

function _resolverNombre(codigo, llaveMap, jogadoresPorLlave) {
  var parts = codigo.split('_');
  if (parts.length < 4) return codigo;

  var lado       = parts[0];
  var matchStr   = parts[parts.length - 1];
  var sizeStr    = parts[parts.length - 2];
  var catPartes  = parts.slice(1, parts.length - 2);
  var clasifName = 'CLASIF_' + catPartes.join('_');

  var matchNum   = parseInt(matchStr.replace('P', '')) || 1;
  var size       = parseInt(sizeStr) || 32;
  var llaveId    = llaveMap[clasifName];

  if (!llaveId) {
    var pos0 = lado === 'A' ? matchNum : (size + 1 - matchNum);
    return 'Jogador ' + pos0;
  }

  var jogadores  = jogadoresPorLlave[llaveId] || [];
  if (jogadores.length === 0) return codigo;

  var pos = lado === 'A' ? matchNum : (size + 1 - matchNum);
  if (pos < 1 || pos > jogadores.length) return 'BYE';
  return jogadores[pos - 1].nome || codigo;
}

// ══════════════════════════════════════════════════════════════
// API — CATEGORÍAS
// ══════════════════════════════════════════════════════════════

function getAllCategorias() {
  var sheets = getSS().getSheets();
  var cats   = [];
  for (var i = 0; i < sheets.length; i++) {
    var nombre = sheets[i].getName();
    if (nombre.indexOf('CLASIF_') !== 0) continue;
    var titulo    = String(sheets[i].getRange(1, 1).getValue() || '');
    var partes    = titulo.split(' · ');
    var categoria = partes.length > 1 ? partes[1].trim() : nombre.replace('CLASIF_', '');
    cats.push({ id: nombre, categoria: categoria });
  }
  return cats;
}

// ══════════════════════════════════════════════════════════════
// API — JOGOS
// ══════════════════════════════════════════════════════════════

function getJuegosDeCategoria(hoja) {
  return _getJuegosParaHoja(hoja).map(function(k) {
    return { key: k, nombre: _nombreJuego(k) };
  });
}

function generarParejasPorJuego(hoja, juegoKey) {
  var ss       = getSS();
  var clasifSh = ss.getSheetByName(hoja);
  if (!clasifSh) return { error: 'Hoja no encontrada: ' + hoja };

  var juegosValidos = _getJuegosParaHoja(hoja);
  if (juegosValidos.indexOf(juegoKey) < 0)
    return { error: 'Juego "' + juegoKey + '" no es válido para esta categoría' };

  var rows      = clasifSh.getDataRange().getValues();
  var jugadores = [];
  for (var r = 4; r < rows.length; r++) {
    var nombre = String(rows[r][0] || '').trim();
    var puntos = Number(rows[r][1] || 0);
    if (!nombre || nombre === 'Jogador' || nombre === 'Código' || nombre === 'Competidor') continue;
    if (nombre.indexOf('_P') >= 0 || nombre.startsWith('BYE')) continue;
    jugadores.push({ nombre: nombre, puntos: puntos });
  }
  if (jugadores.length < 2) return { error: 'No hay suficientes jugadores en ' + hoja };

  var ctrl = ss.getSheetByName('APP_CONTROL');
  var matchId = hoja + '_' + juegoKey;
  if (ctrl) {
    var ctrlRows = ctrl.getDataRange().getValues();
    for (var i = 1; i < ctrlRows.length; i++) {
      if (String(ctrlRows[i][13] || '') === matchId)
        return { error: 'Ya existen parejas para ' + _nombreJuego(juegoKey) + '. Usa resetSimulacion para empezar de cero.' };
    }
  }

  jugadores.sort(function(a, b) {
    return b.puntos !== a.puntos ? b.puntos - a.puntos : a.nombre.localeCompare(b.nombre);
  });

  var n        = jugadores.length;
  var tituloA1 = String(rows[0][0] || '');
  var partesCat = tituloA1.split(' · ');
  var categoria = partesCat.length > 1 ? partesCat[1].trim() : hoja.replace('CLASIF_', '').replace(/_/g, ' ');
  var nombreJuego = _nombreJuego(juegoKey);
  var newRows = [];

  var totalPares = Math.floor(n / 2);
  for (var p = 0; p < totalPares; p++) {
    var pA = jugadores[p];
    var pB = jugadores[n - 1 - p];
    var jogoId = hoja + '_' + juegoKey + '_P' + (p + 1);
    newRows.push([
      jogoId, 'Eliminatoria', p + 1, categoria,
      pA.nombre, pB.nombre, pA.nombre, pB.nombre,
      nombreJuego, 'pendiente', '', new Date(), hoja, matchId
    ]);
  }

  // ── CORRECCIÓN: partido extra marcado con _EXTRA para que el cliente
  //    lo reconozca y solo sume puntos al jugador sin pareja (playerA).
  if (n % 2 !== 0) {
    var oddPlayer     = jugadores[totalPares]; // el del centro (sin pareja)
    var extraOponente = jugadores[0];          // top seed, juega dos veces
    var extraId       = hoja + '_' + juegoKey + '_EXTRA';
    newRows.push([
      extraId, 'Eliminatoria', totalPares + 1, categoria,
      oddPlayer.nombre, extraOponente.nombre,
      oddPlayer.nombre, extraOponente.nombre,
      nombreJuego, 'pendiente', '', new Date(), hoja, extraId
    ]);
  }

  var sh = _getOrCreate('APP_CONTROL',
    ['jogo_id','ronda','num','categoria','codigo_a','codigo_b',
     'nombre_a','nombre_b','juego','estado','ganador','timestamp','hoja','matchId']);
  sh.getRange(sh.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  SpreadsheetApp.flush();
  return { success: true, total: newRows.length };
}

function getJogosPorCategoria(hojaClasif) {
  var sh = getSS().getSheetByName('APP_CONTROL');
  if (sh) {
    var rows = sh.getDataRange().getValues();
    var dinamicos = {};
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][12] || '') !== hojaClasif) continue;
      var jogoId = String(rows[i][0] || '');
      if (!jogoId) continue;
      dinamicos[jogoId] = {
        id:          jogoId,
        matchId:     String(rows[i][13] || jogoId),
        ronda:       String(rows[i][1]  || ''),
        num:         rows[i][2],
        categoria:   String(rows[i][3]  || ''),
        jugadorA:    String(rows[i][6]  || ''),
        jugadorB:    String(rows[i][7]  || ''),
        juego:       String(rows[i][8]  || ''),
        estado:      String(rows[i][9]  || 'pendiente'),
        hoja:        hojaClasif,
        totalJuegos: 1,
        juegoNum:    1
      };
    }
    var keys = Object.keys(dinamicos);
    if (keys.length > 0) {
      var result = keys.map(function(k) { return dinamicos[k]; });
      result.sort(function(a, b) {
        if (a.matchId < b.matchId) return -1;
        if (a.matchId > b.matchId) return 1;
        return (a.num || 0) - (b.num || 0);
      });
      return result;
    }
  }
  return _leerJogosDeCLASIF(hojaClasif);
}

function getListaJogos() {
  var sheets = getSS().getSheets();
  var todos  = [];
  var llaveMap   = _getClasifLlaveMap();
  var jogByLlave = _getJogadoresPorLlave();

  for (var i = 0; i < sheets.length; i++) {
    var nombre = sheets[i].getName();
    if (nombre.indexOf('CLASIF_') !== 0) continue;
    var jogos = _leerJogosDeCLASIF(nombre, llaveMap, jogByLlave);
    if (Array.isArray(jogos)) {
      for (var j = 0; j < jogos.length; j++) todos.push(jogos[j]);
    }
  }
  return todos;
}

function _leerJogosDeCLASIF(nombreHoja, llaveMap, jogByLlave) {
  var sh = getSS().getSheetByName(nombreHoja);
  if (!sh) return [];

  if (!llaveMap)   llaveMap   = _getClasifLlaveMap();
  if (!jogByLlave) jogByLlave = _getJogadoresPorLlave();

  var rows     = sh.getDataRange().getValues();
  var titulo   = String(rows[0][0] || '');
  var partes   = titulo.split(' · ');
  var categoria = partes.length > 1 ? partes[1].trim() : nombreHoja.replace('CLASIF_', '');

  var ctrl  = _mapaControl();
  var pares = {};

  for (var i = 3; i < rows.length; i++) {
    var colA  = String(rows[i][0] || '').trim();
    var colC  = String(rows[i][2] || '').trim();
    var comp  = (colC && colC.indexOf('_P') >= 0) ? colC : colA;
    if (!comp || comp === 'Competidor' || comp === 'Jogador' || comp === 'Código') continue;
    var p     = comp.split('_');
    var lado  = p[0];
    var match = p[p.length - 1];
    if (lado !== 'A' && lado !== 'B') continue;
    if (!pares[match]) pares[match] = {};
    pares[match][lado] = comp;
  }

  var jogos       = [];
  var listaJuegos = _getJuegosParaHoja(nombreHoja);
  var matches = Object.keys(pares).sort(function(a, b) {
    return parseInt(a.replace('P','')) - parseInt(b.replace('P',''));
  });

  for (var k = 0; k < matches.length; k++) {
    var pNum    = matches[k];
    var par     = pares[pNum];
    var codA    = par['A'] || '';
    var codB    = par['B'] || '';
    if (!codA || !codB) continue;

    var nomA    = _resolverNombre(codA, llaveMap, jogByLlave);
    var nomB    = _resolverNombre(codB, llaveMap, jogByLlave);
    var n       = parseInt(pNum.replace('P', ''));
    var matchId = nombreHoja + '_' + pNum;

    for (var g = 0; g < listaJuegos.length; g++) {
      var juegoKey = listaJuegos[g];
      var jogoId   = matchId + '_' + juegoKey;
      var estado   = ctrl[jogoId] || 'pendiente';

      jogos.push({
        id:          jogoId,
        matchId:     matchId,
        codigoA:     codA,
        codigoB:     codB,
        ronda:       _getRonda(n),
        num:         n,
        juegoNum:    g + 1,
        totalJuegos: listaJuegos.length,
        categoria:   categoria,
        jugadorA:    nomA,
        jugadorB:    nomB,
        juego:       _nombreJuego(juegoKey),
        estado:      estado
      });
    }
  }
  return jogos;
}

// ══════════════════════════════════════════════════════════════
// API — SIGUIENTE FASE
// ══════════════════════════════════════════════════════════════

var FASES_ORDEN_GS = ['Eliminatoria', 'Octavos', 'Cuartos', 'Semifinal', 'Final'];

function getSiguienteFaseInfo(hoja) {
  var ctrl = getSS().getSheetByName('APP_CONTROL');
  if (!ctrl) return { sinJogos: true, todoCompleto: false };

  var rows = ctrl.getDataRange().getValues();
  var jogosDeHoja = [];
  for (var i = 1; i < rows.length; i++) {
    var colM   = String(rows[i][12] || '');
    var jogoId = String(rows[i][0]  || '');
    if (colM !== hoja && !(colM === '' && jogoId.indexOf(hoja + '_') === 0)) continue;
    jogosDeHoja.push({
      estado:  String(rows[i][9]  || ''),
      ronda:   String(rows[i][1]  || ''),
      nombreA: String(rows[i][6]  || ''),
      nombreB: String(rows[i][7]  || '')
    });
  }
  if (jogosDeHoja.length === 0) return { sinJogos: true, todoCompleto: false };

  var todoCompleto = jogosDeHoja.every(function(j) { return j.estado === 'completado'; });
  if (!todoCompleto) return { todoCompleto: false };

  var ultimaFase = 'Eliminatoria';
  var ultimaIdx  = 0;
  jogosDeHoja.forEach(function(j) {
    var idx = FASES_ORDEN_GS.indexOf(j.ronda);
    if (idx > ultimaIdx) { ultimaIdx = idx; ultimaFase = j.ronda; }
  });

  var jugadores = {};
  jogosDeHoja.forEach(function(j) {
    var isUltima = j.ronda === ultimaFase ||
      (ultimaFase === 'Eliminatoria' && FASES_ORDEN_GS.indexOf(j.ronda) < 0);
    if (!isUltima) return;
    if (j.nombreA) jugadores[j.nombreA] = true;
    if (j.nombreB) jugadores[j.nombreB] = true;
  });

  var numJugadores = Object.keys(jugadores).length;
  var numClasif    = Math.floor(numJugadores / 2);

  var siguienteFase = null;
  if (numClasif >= 2) {
    var nextIdx = ultimaIdx + 1;
    if (nextIdx < FASES_ORDEN_GS.length) siguienteFase = FASES_ORDEN_GS[nextIdx];
  }

  return {
    todoCompleto:    true,
    ultimaFase:      ultimaFase,
    numJugadores:    numJugadores,
    numClasificados: numClasif,
    siguienteFase:   siguienteFase
  };
}

function _shuffleArray(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function iniciarSiguienteFase(hoja) {
  var ss = getSS();
  var clasifSh = ss.getSheetByName(hoja);
  if (!clasifSh) return { error: 'Hoja no encontrada: ' + hoja };

  var info = getSiguienteFaseInfo(hoja);
  if (!info.todoCompleto)   return { error: 'Hay jogos sin completar en esta categoría.' };
  if (!info.siguienteFase)  return { error: 'El torneo ha finalizado o no hay clasificados suficientes.' };

  var fase       = info.siguienteFase;
  var ultimaFase = info.ultimaFase;

  var ctrl     = ss.getSheetByName('APP_CONTROL');
  var ctrlRows = ctrl.getDataRange().getValues();
  var jugadoresActuales = {};
  for (var i = 1; i < ctrlRows.length; i++) {
    var colM2   = String(ctrlRows[i][12] || '');
    var jogoId2 = String(ctrlRows[i][0]  || '');
    if (colM2 !== hoja && !(colM2 === '' && jogoId2.indexOf(hoja + '_') === 0)) continue;
    var ronda = String(ctrlRows[i][1] || '');
    var isUltima = ronda === ultimaFase ||
      (ultimaFase === 'Eliminatoria' && FASES_ORDEN_GS.indexOf(ronda) < 0);
    if (!isUltima) continue;
    var nA = String(ctrlRows[i][6] || '').trim();
    var nB = String(ctrlRows[i][7] || '').trim();
    if (nA) jugadoresActuales[nA] = true;
    if (nB) jugadoresActuales[nB] = true;
  }

  var existingMatchIds = {};
  for (var ci = 1; ci < ctrlRows.length; ci++) {
    existingMatchIds[String(ctrlRows[ci][13] || '')] = true;
  }
  var juegos = _getJuegosParaHoja(hoja);
  for (var gx = 0; gx < juegos.length; gx++) {
    if (existingMatchIds[hoja + '_' + fase + '_' + juegos[gx]]) {
      return { error: 'La fase ' + fase + ' ya fue generada para esta categoría.' };
    }
  }

  var cRows = clasifSh.getDataRange().getValues();
  var clasificados = [];
  for (var r = 4; r < cRows.length; r++) {
    var nom = String(cRows[r][0] || '').trim();
    if (!nom || !jugadoresActuales[nom]) continue;
    clasificados.push({ nombre: nom, puntos: Number(cRows[r][1] || 0) });
  }

  if (clasificados.length < 2)
    return { error: 'No hay suficientes clasificados (' + clasificados.length + ')' };

  clasificados.sort(function(a, b) {
    return b.puntos !== a.puntos ? b.puntos - a.puntos : a.nombre.localeCompare(b.nombre);
  });
  var numClasif = Math.floor(clasificados.length / 2);
  clasificados = clasificados.slice(0, numClasif);

  var tituloA1  = String(cRows[0][0] || '');
  var partesCat = tituloA1.split(' · ');
  var categoria = partesCat.length > 1 ? partesCat[1].trim() : hoja.replace('CLASIF_', '').replace(/_/g, ' ');

  _shuffleArray(clasificados);
  var isOdd_sf     = clasificados.length % 2 !== 0;
  var oddPlayer_sf = isOdd_sf ? clasificados.pop() : null;

  var ctrlSheet = _getOrCreate('APP_CONTROL',
    ['jogo_id','ronda','num','categoria','codigo_a','codigo_b',
     'nombre_a','nombre_b','juego','estado','ganador','timestamp','hoja','matchId']);
  var newRows = [];
  var n = clasificados.length;

  for (var g = 0; g < juegos.length; g++) {
    var juegoKey = juegos[g];
    var matchId  = hoja + '_' + fase + '_' + juegoKey;
    for (var p = 0; p < n / 2; p++) {
      var pA = clasificados[p * 2];
      var pB = clasificados[p * 2 + 1];
      newRows.push([
        matchId + '_P' + (p + 1),
        fase, p + 1, categoria,
        pA.nombre, pB.nombre, pA.nombre, pB.nombre,
        _nombreJuego(juegoKey), 'pendiente', '',
        new Date(), hoja, matchId
      ]);
    }
    if (oddPlayer_sf) {
      var dIdx_sf = Math.floor(Math.random() * n);
      var dbl_sf  = clasificados[dIdx_sf];
      var extraId_sf = hoja + '_' + fase + '_' + juegoKey + '_EXTRA';
      newRows.push([
        extraId_sf, fase, n / 2 + 1, categoria,
        oddPlayer_sf.nombre, dbl_sf.nombre, oddPlayer_sf.nombre, dbl_sf.nombre,
        _nombreJuego(juegoKey), 'pendiente', '', new Date(), hoja, extraId_sf
      ]);
    }
  }

  if (newRows.length > 0) {
    ctrlSheet.getRange(ctrlSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    SpreadsheetApp.flush();
  }

  return { success: true, fase: fase, totalJogos: newRows.length, numClasificados: n };
}

function _getRonda(n) {
  if (n <= 16) return 'Eliminatoria';
  if (n <= 24) return 'Octavos';
  if (n <= 28) return 'Cuartos';
  if (n <= 30) return 'Semifinal';
  return 'Final';
}

function iniciarFaseDirecta(hoja, fase) {
  if (FASES_ORDEN_GS.indexOf(fase) < 0) return { error: 'Fase no válida: ' + fase };
  var ss = getSS();
  var clasifSh = ss.getSheetByName(hoja);
  if (!clasifSh) return { error: 'Hoja no encontrada: ' + hoja };

  var ctrlSheet = _getOrCreate('APP_CONTROL',
    ['jogo_id','ronda','num','categoria','codigo_a','codigo_b',
     'nombre_a','nombre_b','juego','estado','ganador','timestamp','hoja','matchId']);
  var juegosList = _getJuegosParaHoja(hoja);
  var existingRows = ctrlSheet.getDataRange().getValues();
  for (var gi = 0; gi < juegosList.length; gi++) {
    var checkId = hoja + '_' + fase + '_' + juegosList[gi];
    for (var ci = 1; ci < existingRows.length; ci++) {
      if (String(existingRows[ci][13] || '') === checkId)
        return { error: 'La fase ' + fase + ' ya fue generada.' };
    }
  }

  var cRows = clasifSh.getDataRange().getValues();
  var jugadores = [];
  for (var r = 4; r < cRows.length; r++) {
    var nom = String(cRows[r][0] || '').trim();
    var pts = Number(cRows[r][1] || 0);
    if (nom) jugadores.push({ nombre: nom, puntos: pts });
  }
  jugadores.sort(function(a, b) {
    return b.puntos !== a.puntos ? b.puntos - a.puntos : a.nombre.localeCompare(b.nombre);
  });

  var numJug;
  if      (fase === 'Final')     numJug = 4;
  else if (fase === 'Semifinal') numJug = 8;
  else if (fase === 'Cuartos')   numJug = 8;
  else if (fase === 'Octavos')   numJug = 16;
  else                           numJug = jugadores.length;

  var clasificados = jugadores.slice(0, numJug);
  if (clasificados.length < 2)
    return { error: 'No hay suficientes jugadores (' + clasificados.length + ') para ' + fase + '.' };

  var tituloA1  = String(cRows[0][0] || '');
  var partesCat = tituloA1.split(' · ');
  var categoria = partesCat.length > 1 ? partesCat[1].trim() : hoja.replace('CLASIF_','').replace(/_/g,' ');

  _shuffleArray(clasificados);
  var isOdd_fd     = clasificados.length % 2 !== 0;
  var oddPlayer_fd = isOdd_fd ? clasificados.pop() : null;

  var n = clasificados.length;
  var newRows = [];
  for (var g = 0; g < juegosList.length; g++) {
    var juegoKey = juegosList[g];
    var matchId  = hoja + '_' + fase + '_' + juegoKey;
    for (var p = 0; p < n / 2; p++) {
      var pA = clasificados[p * 2];
      var pB = clasificados[p * 2 + 1];
      newRows.push([
        matchId + '_P' + (p+1), fase, p+1, categoria,
        pA.nombre, pB.nombre, pA.nombre, pB.nombre,
        _nombreJuego(juegoKey), 'pendiente', '', new Date(), hoja, matchId
      ]);
    }
    if (oddPlayer_fd) {
      var dIdx_fd = Math.floor(Math.random() * n);
      var dbl_fd  = clasificados[dIdx_fd];
      var extraId_fd = hoja + '_' + fase + '_' + juegoKey + '_EXTRA';
      newRows.push([
        extraId_fd, fase, n / 2 + 1, categoria,
        oddPlayer_fd.nombre, dbl_fd.nombre, oddPlayer_fd.nombre, dbl_fd.nombre,
        _nombreJuego(juegoKey), 'pendiente', '', new Date(), hoja, extraId_fd
      ]);
    }
  }
  ctrlSheet.getRange(ctrlSheet.getLastRow()+1, 1, newRows.length, newRows[0].length).setValues(newRows);
  SpreadsheetApp.flush();
  return { success: true, total: newRows.length, fase: fase, jugadores: n };
}

function _getJuegosParaHoja(nombreHoja) {
  if (nombreHoja.indexOf('INF') >= 0) return ['SaoBento'];
  if (/_(A|B|C)_/.test(nombreHoja) || nombreHoja.indexOf('Baob') >= 0)
    return ['Benguela', 'SaoBento', 'Siriuna'];
  return ['Benguela', 'SaoBento'];
}

function _nombreJuego(key) {
  var n = { Benguela: 'Benguela', SaoBento: 'São Bento da Abadá', Siriuna: 'Siriúna' };
  return n[key] || key;
}

// ══════════════════════════════════════════════════════════════
// API — JUEZ
// ══════════════════════════════════════════════════════════════

function getJogoActivo() {
  var sh = getSS().getSheetByName('APP_CONTROL');
  if (!sh) return { jogo_id: null, mensaje: 'Esperando jogo activo…' };
  var rows = sh.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][9] === 'activo') {
      var jogoId = rows[i][0];
      return {
        jogo_id:   jogoId,
        ronda:     rows[i][1],
        num:       rows[i][2],
        categoria: rows[i][3],
        codigoA:   rows[i][4],
        codigoB:   rows[i][5],
        jugadorA:  rows[i][6],
        jugadorB:  rows[i][7],
        juego:     rows[i][8],
        estado:    _estadoPuntuaciones(jogoId)
      };
    }
  }
  return { jogo_id: null, mensaje: 'Esperando jogo activo desde la Mesa…' };
}

function _estadoPuntuaciones(jogoId) {
  var sh = getSS().getSheetByName('APP_PUNTUACIONES');
  if (!sh) return { j1: false, j2: false, j3: false };
  var rows = sh.getDataRange().getValues();
  var s    = { j1: false, j2: false, j3: false };
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(jogoId)) s['j' + rows[i][1]] = true;
  }
  return s;
}

function submitPuntuacion(jogoId, juezNum, nota, restaA, restaB) {
  var sh   = _getOrCreate('APP_PUNTUACIONES',
    ['jogo_id','juez','nota','resta_a','resta_b','timestamp']);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(jogoId) && rows[i][1] === juezNum) {
      sh.getRange(i + 1, 3, 1, 4).setValues([[nota, restaA, restaB, new Date()]]);
      return { success: true, updated: true, estado: _estadoPuntuaciones(jogoId) };
    }
  }
  sh.appendRow([jogoId, juezNum, nota, restaA, restaB, new Date()]);
  return { success: true, updated: false, estado: _estadoPuntuaciones(jogoId) };
}

// ══════════════════════════════════════════════════════════════
// API — MESA
// ══════════════════════════════════════════════════════════════

function _mapaControl() {
  var sh = getSS().getSheetByName('APP_CONTROL');
  if (!sh) return {};
  var rows = sh.getDataRange().getValues();
  var m    = {};
  for (var i = 1; i < rows.length; i++) {
    var id     = rows[i][0];
    var estado = rows[i][9];
    if (!m[id] || m[id] !== 'completado') m[id] = estado;
  }
  return m;
}

function activarJogo(jogo) {
  var sh   = _getOrCreate('APP_CONTROL',
    ['jogo_id','ronda','num','categoria','codigo_a','codigo_b',
     'nombre_a','nombre_b','juego','estado','ganador','timestamp','hoja','matchId']);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(jogo.id)) {
      sh.getRange(i + 1, 10).setValue('activo');
      sh.getRange(i + 1, 12).setValue(new Date());
      if (jogo.hoja    && !rows[i][12]) sh.getRange(i + 1, 13).setValue(jogo.hoja);
      if (jogo.matchId && !rows[i][13]) sh.getRange(i + 1, 14).setValue(jogo.matchId);
      return { success: true };
    }
  }
  sh.appendRow([
    jogo.id, jogo.ronda, jogo.num, jogo.categoria || '',
    jogo.codigoA || jogo.jugadorA, jogo.codigoB || jogo.jugadorB,
    jogo.jugadorA, jogo.jugadorB,
    jogo.juego || 'Benguela',
    'activo', '', new Date(),
    jogo.hoja || '', jogo.matchId || ''
  ]);
  return { success: true };
}

function getResultadoJogo(jogoId) {
  var sh = getSS().getSheetByName('APP_PUNTUACIONES');
  if (!sh) return null;
  var rows = sh.getDataRange().getValues();
  var pts  = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(jogoId)) {
      pts.push({ juez: rows[i][1], nota: rows[i][2], restaA: rows[i][3], restaB: rows[i][4] });
    }
  }
  if (pts.length === 0) return { juecesListos: 0 };
  var totA = 0, totB = 0, notaTot = 0;
  for (var k = 0; k < pts.length; k++) {
    totA    += Number(pts[k].restaA);
    totB    += Number(pts[k].restaB);
    notaTot += Number(pts[k].nota);
  }
  return {
    juecesListos: pts.length,
    puntuaciones: pts,
    totalRestaA:  totA.toFixed(1),
    totalRestaB:  totB.toFixed(1),
    notaMedia:    (notaTot / pts.length).toFixed(1),
    ganador:      totA > totB ? 'B' : totB > totA ? 'A' : 'EMPATE'
  };
}

function confirmarGanador(jogoId, ganador) {
  var ss   = getSS();
  var sh   = ss.getSheetByName('APP_CONTROL');
  var rows = sh.getDataRange().getValues();
  var jogoData = null;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(jogoId)) {
      sh.getRange(i + 1, 10).setValue('completado');
      sh.getRange(i + 1, 11).setValue(ganador);
      if (!jogoData) jogoData = rows[i];
    }
  }

  if (jogoData) {
    var codigoA  = String(jogoData[4] || '');
    var codigoB  = String(jogoData[5] || '');
    var resultado = getResultadoJogo(jogoId);

    if (resultado && resultado.juecesListos > 0) {
      var pts = resultado.puntuaciones;
      var totNota = 0, totRestaA = 0, totRestaB = 0;
      for (var k = 0; k < pts.length; k++) {
        totNota   += Number(pts[k].nota);
        totRestaA += Number(pts[k].restaA);
        totRestaB += Number(pts[k].restaB);
      }
      var scoreA = totNota - totRestaA;
      var scoreB = totNota - totRestaB;

      var clasifNombre = String(jogoData[12] || '') || jogoId.split('_P')[0];
      var clasifSh     = ss.getSheetByName(clasifNombre);

      if (clasifSh) {
        var isExtraMatch = String(jogoId).indexOf('_EXTRA') >= 0;
        var cRows = clasifSh.getDataRange().getValues();
        for (var j = 4; j < cRows.length; j++) {
          var colA   = String(cRows[j][0] || '').trim();
          var colC   = String(cRows[j][2] || '').trim();
          var compCod = (colC && colC.indexOf('_P') >= 0) ? colC : colA;
          if (!compCod) continue;
          if (compCod === codigoA || colA === codigoA) {
            clasifSh.getRange(j + 1, 2).setValue(Number(cRows[j][1] || 0) + scoreA);
          } else if (!isExtraMatch && (compCod === codigoB || colA === codigoB)) {
            clasifSh.getRange(j + 1, 2).setValue(Number(cRows[j][1] || 0) + scoreB);
          }
        }

        var dataActual   = clasifSh.getDataRange().getValues();
        var competidores = [];
        for (var r = 4; r < dataActual.length; r++) {
          var colA2  = String(dataActual[r][0] || '').trim();
          var colC2  = String(dataActual[r][2] || '').trim();
          var cod2   = (colC2 && colC2.indexOf('_P') >= 0) ? colC2 : colA2;
          if (!cod2 || cod2 === 'Jogador' || cod2 === 'Código') continue;
          competidores.push({ codigo: cod2, nombre: colA2, puntos: Number(dataActual[r][1] || 0) });
        }
        competidores.sort(function(a, b) { return b.puntos - a.puntos; });

        var llaveMap    = _getClasifLlaveMap();
        var jogByLlave  = _getJogadoresPorLlave();
        var nombresRank = [];
        for (var s = 0; s < competidores.length; s++) {
          var nomShow = competidores[s].nombre.indexOf('_P') >= 0
            ? _resolverNombre(competidores[s].nombre, llaveMap, jogByLlave)
            : competidores[s].nombre;
          clasifSh.getRange(s + 5, 5).setValue(s + 1);
          clasifSh.getRange(s + 5, 6).setValue(nomShow);
          clasifSh.getRange(s + 5, 7).setValue(competidores[s].puntos);
          nombresRank.push(nomShow);
        }
        _aplicarClasificacion(clasifSh, nombresRank);
      }
    }
  }
  return { success: true };
}

function desactivarJogo(jogoId) {
  var ctrl = getSS().getSheetByName('APP_CONTROL');
  if (!ctrl) return { success: false };
  var rows = ctrl.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(jogoId) && rows[i][9] === 'activo') {
      ctrl.getRange(i + 1, 10).setValue('en_espera');
    }
  }
  return { success: true };
}

function reactivarJogo(jogoId) {
  var ss   = getSS();
  var ctrl = ss.getSheetByName('APP_CONTROL');

  var jogoData      = null;
  var wasConfirmado = false;
  if (ctrl) {
    var ctrlRows = ctrl.getDataRange().getValues();
    for (var i = 1; i < ctrlRows.length; i++) {
      if (String(ctrlRows[i][0]) === String(jogoId)) {
        if (ctrlRows[i][9] === 'completado') wasConfirmado = true;
        if (!jogoData) jogoData = ctrlRows[i];
      }
    }
  }

  if (wasConfirmado && jogoData) {
    var codigoA  = String(jogoData[4] || '');
    var codigoB  = String(jogoData[5] || '');
    var resultado = getResultadoJogo(jogoId);

    if (resultado && resultado.juecesListos > 0) {
      var pts2 = resultado.puntuaciones;
      var totNota = 0, totRestaA = 0, totRestaB = 0;
      for (var k = 0; k < pts2.length; k++) {
        totNota   += Number(pts2[k].nota);
        totRestaA += Number(pts2[k].restaA);
        totRestaB += Number(pts2[k].restaB);
      }
      var scoreA = totNota - totRestaA;
      var scoreB = totNota - totRestaB;

      var clasifNombre = String(jogoData[12] || '') || jogoId.split('_P')[0];
      var clasifSh     = ss.getSheetByName(clasifNombre);

      if (clasifSh) {
        var isExtraMatch2 = String(jogoId).indexOf('_EXTRA') >= 0;
        var cRows = clasifSh.getDataRange().getValues();
        for (var j = 4; j < cRows.length; j++) {
          var cA   = String(cRows[j][0] || '').trim();
          var cC   = String(cRows[j][2] || '').trim();
          var comp = (cC && cC.indexOf('_P') >= 0) ? cC : cA;
          if (!comp) continue;
          if (comp === codigoA || cA === codigoA) {
            clasifSh.getRange(j + 1, 2).setValue(Math.max(0, Number(cRows[j][1] || 0) - scoreA));
          } else if (!isExtraMatch2 && (comp === codigoB || cA === codigoB)) {
            clasifSh.getRange(j + 1, 2).setValue(Math.max(0, Number(cRows[j][1] || 0) - scoreB));
          }
        }

        var dataActual   = clasifSh.getDataRange().getValues();
        var competidores = [];
        for (var r = 4; r < dataActual.length; r++) {
          var cA2  = String(dataActual[r][0] || '').trim();
          var cC2  = String(dataActual[r][2] || '').trim();
          var cod2 = (cC2 && cC2.indexOf('_P') >= 0) ? cC2 : cA2;
          if (!cod2 || cod2 === 'Jogador' || cod2 === 'Código') continue;
          competidores.push({ nombre: cA2, puntos: Number(dataActual[r][1] || 0) });
        }
        competidores.sort(function(a, b) { return b.puntos - a.puntos; });

        var llaveMap   = _getClasifLlaveMap();
        var jogByLlave = _getJogadoresPorLlave();
        for (var s = 0; s < competidores.length; s++) {
          var nomShow = competidores[s].nombre.indexOf('_P') >= 0
            ? _resolverNombre(competidores[s].nombre, llaveMap, jogByLlave)
            : competidores[s].nombre;
          clasifSh.getRange(s + 5, 5).setValue(s + 1);
          clasifSh.getRange(s + 5, 6).setValue(nomShow);
          clasifSh.getRange(s + 5, 7).setValue(competidores[s].puntos);
        }
      }
    }
  }

  if (ctrl) {
    var ctrlRows2 = ctrl.getDataRange().getValues();
    for (var i2 = 1; i2 < ctrlRows2.length; i2++) {
      if (String(ctrlRows2[i2][0]) === String(jogoId)) {
        ctrl.getRange(i2 + 1, 10).setValue('pendiente');
        ctrl.getRange(i2 + 1, 11).setValue('');
      }
    }
  }

  var pts = ss.getSheetByName('APP_PUNTUACIONES');
  if (pts) {
    var pRows = pts.getDataRange().getValues();
    for (var j2 = pRows.length - 1; j2 >= 1; j2--) {
      if (String(pRows[j2][0]) === String(jogoId)) pts.deleteRow(j2 + 1);
    }
  }

  return { success: true };
}

// ── Inicializar nombres en todas las hojas CLASIF ──────────
function inicializarNombresEnClasif() {
  var ss         = getSS();
  var llaveMap   = _getClasifLlaveMap();
  var jogByLlave = _getJogadoresPorLlave();
  var sheets     = ss.getSheets();
  var actualizadas = 0;

  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    if (sh.getName().indexOf('CLASIF_') !== 0) continue;
    var rows = sh.getDataRange().getValues();
    var competidores = [];

    sh.getRange(4, 1).setValue('Jogador');
    sh.getRange(4, 3).setValue('Código');

    for (var r = 4; r < rows.length; r++) {
      var codigo = String(rows[r][0] || '').trim();
      if (codigo && codigo.indexOf('_P') < 0 && codigo !== 'Competidor' && codigo !== 'Jogador') {
        var codC = String(rows[r][2] || '').trim();
        if (codC && codC.indexOf('_P') >= 0) codigo = codC;
      }
      if (!codigo || codigo === 'Competidor' || codigo === 'Jogador' || codigo === 'Código') continue;
      var nombre = _resolverNombre(codigo, llaveMap, jogByLlave);
      var puntos = Number(rows[r][1] || 0);
      competidores.push({ codigo: codigo, nombre: nombre, puntos: puntos, fila: r + 1 });
    }

    for (var c = 0; c < competidores.length; c++) {
      sh.getRange(competidores[c].fila, 1).setValue(competidores[c].nombre);
      sh.getRange(competidores[c].fila, 3).setValue(competidores[c].codigo);
    }

    competidores.sort(function(a, b) {
      return b.puntos !== a.puntos ? b.puntos - a.puntos : a.nombre.localeCompare(b.nombre);
    });

    sh.getRange(4, 5).setValue('Puesto');
    sh.getRange(4, 6).setValue('Jogador');
    sh.getRange(4, 7).setValue('Puntos');

    var nombresRankInit = [];
    for (var s = 0; s < competidores.length; s++) {
      sh.getRange(s + 5, 5).setValue(s + 1);
      sh.getRange(s + 5, 6).setValue(competidores[s].nombre);
      sh.getRange(s + 5, 7).setValue(competidores[s].puntos);
      nombresRankInit.push(competidores[s].nombre);
    }
    _aplicarClasificacion(sh, nombresRankInit);
    actualizadas++;
    SpreadsheetApp.flush();
  }
  Logger.log('Hojas CLASIF actualizadas: ' + actualizadas);
}

// ── Reset para simulacros ───────────────────────────────────
function resetSimulacion() {
  var ss = getSS();

  var ctrl = ss.getSheetByName('APP_CONTROL');
  if (ctrl && ctrl.getLastRow() > 1) ctrl.deleteRows(2, ctrl.getLastRow() - 1);

  var pts = ss.getSheetByName('APP_PUNTUACIONES');
  if (pts && pts.getLastRow() > 1) pts.deleteRows(2, pts.getLastRow() - 1);

  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    if (sh.getName().indexOf('CLASIF_') !== 0) continue;
    var rows = sh.getDataRange().getValues();
    for (var r = 4; r < rows.length; r++) {
      sh.getRange(r + 1, 2).setValue(0);
    }
    var numComp = rows.length - 4;
    if (numComp > 0) {
      sh.getRange(5, 5, numComp, 3).clearContent();
      sh.getRange(5, 5, numComp, 4).setBackground(null);
      sh.getRange(5, 10, numComp, 1).clearContent();
    }
  }

  SpreadsheetApp.flush();
  Logger.log('Simulación reiniciada. APP_CONTROL y APP_PUNTUACIONES vaciadas, puntos a 0.');
}

// ── Clasificación: fondo verde top-mitad + col J ────────────
function _aplicarClasificacion(sh, nombresRanking) {
  var total = nombresRanking.length;
  if (total === 0) return;
  var n = Math.floor(total / 2);
  sh.getRange(4, 10).setValue('Clasificados');
  if (n > 0) {
    sh.getRange(5, 5, n, 4).setBackground('#b7e1cd');
    var datos = nombresRanking.slice(0, n).map(function(nom) { return [nom]; });
    sh.getRange(5, 10, n, 1).setValues(datos);
  }
  if (total - n > 0) {
    sh.getRange(5 + n, 5, total - n, 4).setBackground(null);
    sh.getRange(5 + n, 10, total - n, 1).clearContent();
  }
}

// ── Todos los jogos activos simultáneamente ──────────────────
function getJogosActivos() {
  var sh = getSS().getSheetByName('APP_CONTROL');
  if (!sh) return [];
  var rows    = sh.getDataRange().getValues();
  var activos = [];
  var vistos  = {};
  for (var i = rows.length - 1; i >= 1; i--) {
    var id = String(rows[i][0]);
    if (rows[i][9] === 'activo' && !vistos[id]) {
      vistos[id] = true;
      activos.push({
        jogo_id:   id,
        ronda:     rows[i][1],
        num:       rows[i][2],
        categoria: rows[i][3],
        codigoA:   rows[i][4],
        codigoB:   rows[i][5],
        jugadorA:  rows[i][6],
        jugadorB:  rows[i][7],
        juego:     rows[i][8],
        estado:    _estadoPuntuaciones(id)
      });
    }
  }
  return activos;
}

// ── Parche: añade la pareja extra del jugador impar ─────────
function agregarParejaImpar(hoja, juegoKey) {
  var ss       = getSS();
  var clasifSh = ss.getSheetByName(hoja);
  if (!clasifSh) return { error: 'Hoja no encontrada: ' + hoja };

  var matchId  = hoja + '_' + juegoKey;
  var ctrl     = ss.getSheetByName('APP_CONTROL');
  if (!ctrl) return { error: 'No hay APP_CONTROL' };

  var ctrlRows      = ctrl.getDataRange().getValues();
  var yaEmparejados = {};
  var maxNum        = 0;
  for (var i = 1; i < ctrlRows.length; i++) {
    if (String(ctrlRows[i][13] || '') !== matchId) continue;
    var nA = String(ctrlRows[i][6] || '').trim();
    var nB = String(ctrlRows[i][7] || '').trim();
    if (nA) yaEmparejados[nA] = true;
    if (nB) yaEmparejados[nB] = true;
    var num = Number(ctrlRows[i][2] || 0);
    if (num > maxNum) maxNum = num;
  }
  if (maxNum === 0) return { error: 'No hay parejas previas para ' + matchId + '. Usa GENERAR primero.' };

  var rows      = clasifSh.getDataRange().getValues();
  var jugadores = [];
  for (var r = 4; r < rows.length; r++) {
    var nombre = String(rows[r][0] || '').trim();
    var puntos = Number(rows[r][1] || 0);
    if (!nombre || nombre === 'Jogador' || nombre === 'Código' || nombre === 'Competidor') continue;
    if (nombre.indexOf('_P') >= 0 || nombre.startsWith('BYE')) continue;
    jugadores.push({ nombre: nombre, puntos: puntos });
  }

  var sinPareja = jugadores.filter(function(j) { return !yaEmparejados[j.nombre]; });
  if (sinPareja.length === 0) return { error: 'Todos los jugadores ya tienen pareja en ' + matchId };
  if (sinPareja.length > 1)  return { error: 'Hay ' + sinPareja.length + ' jugadores sin pareja: ' + sinPareja.map(function(j){return j.nombre;}).join(', ') };

  var oddPlayer = sinPareja[0];

  jugadores.sort(function(a, b) {
    return b.puntos !== a.puntos ? b.puntos - a.puntos : a.nombre.localeCompare(b.nombre);
  });
  var extraOponente = jugadores[0];

  var tituloA1  = String(rows[0][0] || '');
  var partesCat = tituloA1.split(' · ');
  var categoria = partesCat.length > 1 ? partesCat[1].trim() : hoja.replace('CLASIF_','').replace(/_/g,' ');

  // ── CORRECCIÓN: usar _EXTRA en el ID para que el cliente lo reconozca
  //    como partido extra que solo suma puntos al jugador sin pareja.
  var extraId = hoja + '_' + juegoKey + '_EXTRA';
  var ctrlSheet = _getOrCreate('APP_CONTROL',
    ['jogo_id','ronda','num','categoria','codigo_a','codigo_b',
     'nombre_a','nombre_b','juego','estado','ganador','timestamp','hoja','matchId']);
  ctrlSheet.appendRow([
    extraId,
    'Eliminatoria', maxNum + 1, categoria,
    oddPlayer.nombre, extraOponente.nombre,
    oddPlayer.nombre, extraOponente.nombre,
    _nombreJuego(juegoKey), 'pendiente', '', new Date(), hoja, extraId
  ]);
  SpreadsheetApp.flush();
  return { success: true, jugadorImpar: oddPlayer.nombre, oponente: extraOponente.nombre };
}

// ── Debug ───────────────────────────────────────────────────
function debugNombres() {
  var llaveMap   = _getClasifLlaveMap();
  var jogByLlave = _getJogadoresPorLlave();
  Logger.log('Llaves mapeadas: ' + JSON.stringify(Object.keys(llaveMap)));
  var test = _resolverNombre('A_C_M_32_P1', llaveMap, jogByLlave);
  Logger.log('A_C_M_32_P1 → ' + test);
  var test2 = _resolverNombre('B_C_M_32_P1', llaveMap, jogByLlave);
  Logger.log('B_C_M_32_P1 → ' + test2);
}

function debug() {
  var jogos = getListaJogos();
  Logger.log('Total jogos: ' + jogos.length);
  for (var i = 0; i < Math.min(3, jogos.length); i++) {
    Logger.log(JSON.stringify(jogos[i]));
  }
}

function debugJogoActivo() {
  var res = getJogoActivo();
  Logger.log('Jogo activo: ' + JSON.stringify(res));
  var jogos = getListaJogos();
  if (jogos.length > 0) Logger.log('Primer jogo lista: ' + JSON.stringify(jogos[0]));
}
