// ── Generador de parejas ──────────────────────────────────────────────────────

/**
 * Genera las parejas para una ronda.
 *
 * Con número IMPAR de competidores:
 *  - Se forman floor(N/2) parejas normales con los primeros N-1 competidores.
 *  - El competidor sin pareja juega un partido extra AL FINAL contra uno de los
 *    jugadores del primer partido (el que lleva más tiempo de descanso).
 *  - El partido extra SOLO PUNTÚA para el competidor que no había jugado;
 *    el que juega por segunda vez actúa como rival de cortesía (sin puntos).
 */
function generatePairs(competitors) {
    const n = competitors.length;
    const pairs = [];

    // Parejas normales: (0,1), (2,3), (4,5)…
    for (let i = 0; i + 1 < n; i += 2) {
        pairs.push({
            a: competitors[i],
            b: competitors[i + 1],
            isExtra: false
        });
    }

    // Número impar → partido extra al final
    if (n % 2 === 1) {
        const sinPareja = competitors[n - 1];      // el que no tenía pareja
        const rivalCortesia = competitors[0];       // del primer partido, más descanso
        pairs.push({
            a: sinPareja,
            b: rivalCortesia,
            isExtra: true,
            soloSuma: sinPareja   // único que puntúa en este partido
        });
    }

    return pairs;
}

function renderPairs(pairs) {
    const container = document.getElementById('pairsContainer');
    container.innerHTML = '';

    if (pairs.length === 0) return;

    const header = document.createElement('h3');
    header.textContent = `${pairs.length} jogo(s) generado(s)`;
    container.appendChild(header);

    pairs.forEach((pair, idx) => {
        const card = document.createElement('div');
        card.className = 'pair-card' + (pair.isExtra ? ' pair-extra' : '');

        const extraBadge = pair.isExtra
            ? '<span class="extra-badge">Partido extra</span>'
            : '';

        const extraNote = pair.isExtra
            ? `<p class="extra-note">
                 Solo puntúa: <strong>${pair.soloSuma}</strong> —
                 <em>${pair.b}</em> juega como rival de cortesía (sin puntos)
               </p>`
            : '';

        card.innerHTML = `
            <div class="pair-header">
                <span class="pair-num">Jogo ${idx + 1}</span>
                ${extraBadge}
            </div>
            <p class="pair-vs"><strong>${pair.a}</strong> vs <strong>${pair.b}</strong></p>
            ${extraNote}
            <button class="btn-score"
                    data-a="${pair.a}"
                    data-b="${pair.b}">
                Puntuar este jogo →
            </button>
        `;
        container.appendChild(card);
    });

    // Al pulsar "Puntuar este jogo" se rellenan los campos del formulario
    container.querySelectorAll('.btn-score').forEach(btn => {
        btn.addEventListener('click', function () {
            document.getElementById('competitor1').value = this.dataset.a;
            document.getElementById('competitor2').value = this.dataset.b;
            // Sincronizar categoría y fase
            const cat = document.getElementById('pg-category').value;
            const stage = document.getElementById('pg-stage').value;
            document.getElementById('category').value = cat;
            document.getElementById('stage').value = stage;
            document.querySelector('#scoreForm').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

document.getElementById('generatePairsBtn').addEventListener('click', function () {
    const raw = document.getElementById('competitorList').value.trim();
    if (!raw) {
        alert('Introduce al menos dos competidores (uno por línea).');
        return;
    }
    const competitors = raw.split('\n').map(s => s.trim()).filter(Boolean);
    if (competitors.length < 2) {
        alert('Necesitas al menos 2 competidores.');
        return;
    }
    const pairs = generatePairs(competitors);
    renderPairs(pairs);
    document.getElementById('pairsContainer').scrollIntoView({ behavior: 'smooth' });
});


// ── Formulario de puntuación ──────────────────────────────────────────────────

document.getElementById('scoreForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const competitor1 = document.getElementById('competitor1').value.trim();
    const competitor2 = document.getElementById('competitor2').value.trim();
    const category    = document.getElementById('category').value;
    const stage       = document.getElementById('stage').value;

    const score1 = parseFloat(document.getElementById('score1').value) || 0;
    const score2 = parseFloat(document.getElementById('score2').value) || 0;
    const score3 = parseFloat(document.getElementById('score3').value) || 0;
    const jogoScore = (score1 + score2 + score3) / 3;

    const penalizedCompetitor = document.getElementById('penalizedCompetitor').value;
    const penalty1 = parseFloat(document.getElementById('penalty1').value) || 0;
    const penalty2 = parseFloat(document.getElementById('penalty2').value) || 0;
    const penalty3 = parseFloat(document.getElementById('penalty3').value) || 0;
    const totalPenalty = penalty1 + penalty2 + penalty3;

    let totalScore1 = jogoScore;
    let totalScore2 = jogoScore;

    if (penalizedCompetitor === 'competitor1') {
        totalScore1 -= totalPenalty;
    } else if (penalizedCompetitor === 'competitor2') {
        totalScore2 -= totalPenalty;
    }

    const tableBody = document.getElementById('scoreTableBody');
    const row = document.createElement('tr');

    [
        category,
        stage,
        competitor1,
        competitor2,
        jogoScore.toFixed(2),
        penalizedCompetitor === 'none'
            ? '—'
            : penalizedCompetitor === 'competitor1' ? competitor1 : competitor2,
        totalScore1.toFixed(2),
        totalScore2.toFixed(2)
    ].forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        row.appendChild(td);
    });

    tableBody.appendChild(row);
    this.reset();
});
