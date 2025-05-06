let weeklyChartInstance = null;
const usageKey = 'usage_history_v1';

function getToday() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split('T')[0];
}

function getWeekStart(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay(); // Sunday = 0, Tuesday = 2
  const offset = (day - 2 + 7) % 7;
  date.setDate(date.getDate() - offset);
  return date;
}

function loadUsage() {
  return JSON.parse(localStorage.getItem(usageKey) || '[]');
}

function saveUsage(history) {
  localStorage.setItem(usageKey, JSON.stringify(history));
}

function getCurrentWeek(history, today) {
  const weekStartStr = getWeekStart(today).toISOString().split('T')[0];
  return history.filter(entry =>
    getWeekStart(entry.date).toISOString().split('T')[0] === weekStartStr
  );
}

function updateUI() {
  const today = getToday();
  const history = loadUsage();
  const thisWeek = getCurrentWeek(history, today);
  const totalYes = thisWeek.filter(e => e.result === "כן").length;
  const todayEntry = history.find(e => e.date === today);

  document.getElementById("summary").innerText = `השבוע עשית ${totalYes} מתוך 4`;
  document.getElementById("message").innerText = todayEntry ? `החלטת: ${todayEntry.result}` : '';

  const historyList = document.getElementById("historyList");
  historyList.innerHTML = '';
  thisWeek.slice().reverse().forEach(entry => {
    const div = document.createElement('div');
    div.innerText = `${entry.date} : ${entry.result}`;
    historyList.appendChild(div);
  });

  document.getElementById("yesBtn").disabled = !!todayEntry;
  document.getElementById("noBtn").disabled = !!todayEntry;
  document.getElementById("decideBtn").disabled = !!todayEntry;
}

function addEntry(result) {
  const today = getToday();
  const history = loadUsage();

  if (history.find(e => e.date === today)) return;

  const thisWeek = getCurrentWeek(history, today);
  const totalYes = thisWeek.filter(e => e.result === "כן").length;
  const lastTwo = thisWeek.slice(-2).map(e => e.result);

  if (result === "כן") {
    if (totalYes >= 4 || lastTwo.every(r => r === "כן")) {
      alert("עברת את מגבלת השימוש השבועית או עשית פעמיים רצוף. אי אפשר היום.");
      return;
    }
  }

  history.push({ date: today, result });
  saveUsage(history);
  updateUI();
  renderChart();
}

function renderChart() {
  if (weeklyChartInstance) weeklyChartInstance.destroy();

  const today = getToday();
  const startOfWeek = getWeekStart(today);
  const history = loadUsage();
  const labels = [];
  const dataYes = [];
  const dataNo = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const label = d.toLocaleDateString('he-IL', { weekday: 'short' });
    const dateStr = d.toISOString().split('T')[0];
    labels.push(label);
    const entry = history.find(e => e.date === dateStr);
    dataYes.push(entry && entry.result === "כן" ? 1 : 0);
    dataNo.push(entry && entry.result === "לא" ? 1 : 0);
  }

  const ctx = document.getElementById('weeklyChart');
  weeklyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'כן',
          data: dataYes,
          backgroundColor: 'rgba(76, 175, 80, 0.7)'
        },
        {
          label: 'לא',
          data: dataNo,
          backgroundColor: 'rgba(244, 67, 54, 0.7)'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
          ticks: {
            callback: function(value) {
              return value === 1 ? 'עשית' : '';
            }
          }
        }
      }
    }
  });
}

document.getElementById("yesBtn").onclick = () => addEntry("כן");
document.getElementById("noBtn").onclick = () => addEntry("לא");
document.getElementById("decideBtn").onclick = () => {
  const today = getToday();
  const history = loadUsage();
  const thisWeek = getCurrentWeek(history, today);
  const totalYes = thisWeek.filter(e => e.result === "כן").length;
  const lastTwo = thisWeek.slice(-2).map(e => e.result);

  if (totalYes >= 4 || lastTwo.every(r => r === "כן")) {
    addEntry("לא");
  } else {
    const result = Math.random() < 0.5 ? "כן" : "לא";
    addEntry(result);
  }
};

updateUI();
renderChart();