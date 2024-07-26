document.getElementById("scoreForm").addEventListener("submit", function (e) {
 e.preventDefault();

 const competitor1 = document.getElementById("competitor1").value;
 const competitor2 = document.getElementById("competitor2").value;
 const category = document.getElementById("category").value;
 const stage = document.getElementById("stage").value;
 const score1 = parseFloat(document.getElementById("score1").value);
 const score2 = parseFloat(document.getElementById("score2").value);
 const score3 = parseFloat(document.getElementById("score3").value);
 const jogoScore = (score1 + score2 + score3) / 3;
 const penalizedCompetitor = document.getElementById("penalizedCompetitor")
  .value;
 const penalty1 = parseFloat(document.getElementById("penalty1").value);
 const penalty2 = parseFloat(document.getElementById("penalty2").value);
 const penalty3 = parseFloat(document.getElementById("penalty3").value);
 const totalPenalty = penalty1 + penalty2 + penalty3;

 let totalScore1 = jogoScore;
 let totalScore2 = jogoScore;

 if (penalizedCompetitor === "competitor1") {
  totalScore1 -= totalPenalty;
 } else {
  totalScore2 -= totalPenalty;
 }

 const tableBody = document.getElementById("scoreTableBody");
 const newRow = document.createElement("tr");

 const categoryCell = document.createElement("td");
 categoryCell.textContent = category;
 newRow.appendChild(categoryCell);

 const stageCell = document.createElement("td");
 stageCell.textContent = stage;
 newRow.appendChild(stageCell);

 const competitor1Cell = document.createElement("td");
 competitor1Cell.textContent = competitor1;
 newRow.appendChild(competitor1Cell);

 const competitor2Cell = document.createElement("td");
 competitor2Cell.textContent = competitor2;
 newRow.appendChild(competitor2Cell);

 const jogoScoreCell = document.createElement("td");
 jogoScoreCell.textContent = jogoScore.toFixed(1);
 newRow.appendChild(jogoScoreCell);

 const penalizedCompetitorCell = document.createElement("td");
 penalizedCompetitorCell.textContent =
  penalizedCompetitor === "competitor1" ? competitor1 : competitor2;
 newRow.appendChild(penalizedCompetitorCell);

 const totalScore1Cell = document.createElement("td");
 totalScore1Cell.textContent = totalScore1.toFixed(1);
 newRow.appendChild(totalScore1Cell);

 const totalScore2Cell = document.createElement("td");
 totalScore2Cell.textContent = totalScore2.toFixed(1);
 newRow.appendChild(totalScore2Cell);

 tableBody.appendChild(newRow);

 // Limpiar el formulario
 document.getElementById("scoreForm").reset();
});