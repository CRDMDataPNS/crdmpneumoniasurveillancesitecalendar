// --- Date helpers ---
const MS_DAY = 24 * 60 * 60 * 1000;

function startOfDay(d){
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d, n){
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a, b){
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function colIndexMonFirst(date){
  return (date.getDay() + 6) % 7;
}

function getStartOfISOWeek(date){
  const d = startOfDay(date);
  const day = d.getDay() || 7;
  return addDays(d, -(day - 1));
}

function getISOWeek(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / MS_DAY) + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

function epiInfo(date){
  const d = startOfDay(date);
  const iso = getISOWeek(d);
  const weekStart = getStartOfISOWeek(d);
  const weekEnd = addDays(weekStart, 6);

  return {
    epiYear: iso.year,
    epiWeek: iso.week,
    weekStart,
    weekEnd
  };
}

function isThursday(date){
  return (date.getDay() || 7) === 4;
}

function formatDate(date){
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatLongDate(date){
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatMonthLabel(date){
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function getReportingThursdayForWeek(date){
  return addDays(getStartOfISOWeek(date), 3);
}

function admissionsReportingInfo(reportingDate){
  const reportThursday = startOfDay(reportingDate);
  const reportWeekStart = getStartOfISOWeek(reportThursday);
  const admissionsWeekStart = addDays(reportWeekStart, -7);
  const admissionsWeekEnd = addDays(reportWeekStart, -1);
  const admissionsEpi = epiInfo(admissionsWeekStart);

  return {
    reportThursday,
    admissionsWeekStart,
    admissionsWeekEnd,
    admissionsEpiYear: admissionsEpi.epiYear,
    admissionsEpiWeek: admissionsEpi.epiWeek
  };
}

function admissionsReportingMessage(reportingDate){
  const info = admissionsReportingInfo(reportingDate);
  return `Admissions reporting day: ${formatLongDate(info.reportThursday)}<br><br>Please enter admissions for Site Week ${info.admissionsEpiWeek} of Site Year ${info.admissionsEpiYear}.<br>Admission week runs ${formatDate(info.admissionsWeekStart)} to ${formatDate(info.admissionsWeekEnd)}.`;
}

let viewDate = startOfDay(new Date());

const gridEl = document.getElementById("grid");
const monthLabelEl = document.getElementById("monthLabel");
const subTitleEl = document.getElementById("subTitle");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");
const yearSelect = document.getElementById("yearSelect");

const backdrop = document.getElementById("modalBackdrop");
const modalText = document.getElementById("modalText");
const modalCloseBtn = document.getElementById("modalCloseBtn");

function openModal(text){
  modalText.innerHTML = text;
  backdrop.classList.remove("hidden");
}

function closeModal(){
  backdrop.classList.add("hidden");
}

modalCloseBtn.addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});

function populateYearSelect(startYear = 2023, endYear = 2027){
  yearSelect.innerHTML = "";
  for(let y = startYear; y <= endYear; y++){
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    yearSelect.appendChild(opt);
  }
}

function setViewToMonth(year, monthIndex){
  viewDate = new Date(year, monthIndex, 1);
  render();
}

function render(){
  const today = startOfDay(new Date());
  const infoToday = epiInfo(today);
  const currentWeekStart = getStartOfISOWeek(today);
  const currentReportingThursday = getReportingThursdayForWeek(today);
  const currentReporting = admissionsReportingInfo(currentReportingThursday);

  subTitleEl.textContent =
    `Today: Site Week ${infoToday.epiWeek} (Site Year ${infoToday.epiYear}) • Week runs ${formatDate(infoToday.weekStart)} → ${formatDate(infoToday.weekEnd)} • Current reporting Thursday: ${formatDate(currentReporting.reportThursday)} for Week ${currentReporting.admissionsEpiWeek}`;

  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  const firstOfMonth = new Date(y, m, 1);

  monthLabelEl.textContent = formatMonthLabel(firstOfMonth);
  yearSelect.value = String(y);

  const start = getStartOfISOWeek(firstOfMonth);

  gridEl.innerHTML = "";

  for(let i = 0; i < 42; i++){
    const d = addDays(start, i);
    const inMonth = d.getMonth() === m;
    const epi = epiInfo(d);
    const weekStart = getStartOfISOWeek(d);
    const inCurrentReportingWeek = sameDay(weekStart, currentWeekStart);
    const isCurrentReportingThursday = sameDay(d, currentReportingThursday);

    const cell = document.createElement("div");
    cell.className = "day" + (inMonth ? "" : " muted") + (sameDay(d, today) ? " today" : "");

    if (inCurrentReportingWeek){
      cell.style.background = inMonth ? "#eff6ff" : "#f8fafc";
      cell.style.border = "2px solid #bfdbfe";
    }

    if (isCurrentReportingThursday){
      cell.style.background = "#dbeafe";
      cell.style.border = "2px solid #2563eb";
      cell.style.boxShadow = "0 0 0 2px rgba(37, 99, 235, 0.12) inset";
    }

    const top = document.createElement("div");
    top.className = "topRow";

    const dateNum = document.createElement("div");
    dateNum.className = "dateNum";
    dateNum.textContent = String(d.getDate());

    const weekBadge = document.createElement("div");
    weekBadge.className = "badge week";
    weekBadge.textContent = `W${epi.epiWeek}`;

    top.appendChild(dateNum);
    top.appendChild(weekBadge);

    if ((d.getDay() || 7) === 7){
      const endBadge = document.createElement("div");
      endBadge.className = "badge end";
      endBadge.textContent = "End";
      top.appendChild(endBadge);
    }

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `Site Year ${epi.epiYear}`;

    cell.appendChild(top);
    cell.appendChild(meta);

    if (isThursday(d)){
      const reporting = admissionsReportingInfo(d);

      const admissionsBadge = document.createElement("button");
      admissionsBadge.type = "button";
      admissionsBadge.className = "badge admissions";
      admissionsBadge.textContent = "Admissions for previous week";
      admissionsBadge.style.display = "inline-block";
      admissionsBadge.style.marginTop = "8px";
      admissionsBadge.style.padding = "4px 8px";
      admissionsBadge.style.borderRadius = "999px";
      admissionsBadge.style.border = "1px solid #c4b5fd";
      admissionsBadge.style.background = "#ede9fe";
      admissionsBadge.style.color = "#5b21b6";
      admissionsBadge.style.fontSize = "11px";
      admissionsBadge.style.fontWeight = "700";
      admissionsBadge.style.lineHeight = "1.2";
      admissionsBadge.style.cursor = "pointer";
      admissionsBadge.style.whiteSpace = "normal";

      admissionsBadge.addEventListener("click", (e) => {
        e.stopPropagation();
        openModal(admissionsReportingMessage(d));
      });

      cell.style.cursor = "pointer";
      cell.title = `Enter admissions for Week ${reporting.admissionsEpiWeek} (${formatDate(reporting.admissionsWeekStart)} to ${formatDate(reporting.admissionsWeekEnd)}) on ${formatDate(reporting.reportThursday)}`;
      cell.addEventListener("click", () => {
        openModal(admissionsReportingMessage(d));
      });

      cell.appendChild(admissionsBadge);

      if (isCurrentReportingThursday){
        const currentBadge = document.createElement("div");
        currentBadge.className = "badge";
        currentBadge.textContent = "Current reporting week";
        currentBadge.style.display = "inline-block";
        currentBadge.style.marginTop = "6px";
        currentBadge.style.padding = "4px 8px";
        currentBadge.style.borderRadius = "999px";
        currentBadge.style.border = "1px solid #93c5fd";
        currentBadge.style.background = "#2563eb";
        currentBadge.style.color = "#ffffff";
        currentBadge.style.fontSize = "11px";
        currentBadge.style.fontWeight = "700";
        cell.appendChild(currentBadge);
      }
    }

    gridEl.appendChild(cell);
  }
}

prevBtn.addEventListener("click", () => {
  setViewToMonth(viewDate.getFullYear(), viewDate.getMonth() - 1);
});

nextBtn.addEventListener("click", () => {
  setViewToMonth(viewDate.getFullYear(), viewDate.getMonth() + 1);
});

todayBtn.addEventListener("click", () => {
  const t = new Date();
  setViewToMonth(t.getFullYear(), t.getMonth());
});

yearSelect.addEventListener("change", () => {
  const y = Number(yearSelect.value);
  setViewToMonth(y, viewDate.getMonth());
});

function showPopupIfNeeded(){
  const d = startOfDay(new Date());
  const epi = epiInfo(d);
  const dow = d.getDay() || 7;

  if (dow === 1){
    openModal(`Happy Monday!! Today is the beginning of week ${epi.epiWeek} of the year! Please check and resolve any outstanding queries.`);
  } else if (dow === 4){
    openModal(admissionsReportingMessage(d));
  } else if (dow === 7){
    openModal(`Today is the last day of week ${epi.epiWeek}. Please make sure that all queries for the week are resolved and that all enrolled cases for the week, that are fully completed, are marked as complete. Please also make sure that all admissions and enrollments are entered on REDCap.`);
  }
}

populateYearSelect(2023, 2027);
setViewToMonth(viewDate.getFullYear(), viewDate.getMonth());
showPopupIfNeeded();






