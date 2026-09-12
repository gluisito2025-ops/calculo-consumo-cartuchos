(function () {
  const dailyRate = 1.37;
  const cartridgeCapacity = 125;
  const capacityPerEquipment = 250;
  const VALID_AF_SET = new Set([
    'AF155709-10', 'AF155710-10', 'AF155711-10', 'AF155713-10', 'AF155715-10',
    'AF076158-10', 'AF095702-10', 'AF095701-10', 'AF128334-10', 'AF128335-10', 'AF130947-10',
    'AF130946-10', 'AF145965-10', 'AF145963-10', 'AF145964-10', 'AF002751-48', 'AF149273-10', 'AF149272-10'
  ]);
  const INVALID_AF_SET = new Set(['AF155714-10']);
  const cartridgeCountFor = item => item.af === 'AF076158-10' ? 3 : 2;
  const capacityFor = item => cartridgeCountFor(item) * cartridgeCapacity;
  const dayMs = 86400000;
  const rows = document.getElementById('rows');
  const search = document.getElementById('search');
  const state = document.getElementById('state');
  const dateFilter = document.getElementById('dateFilter');
  const tableHeader = document.querySelector('.grid thead tr');
  const style = document.createElement('style');
  style.textContent += `
    :root {
      --panel-glow: rgba(31, 212, 255, 0.25);
      --panel-soft: rgba(13, 24, 35, 0.9);
      --panel-alt: rgba(18, 34, 47, 0.9);
      --line-soft: rgba(132, 182, 220, 0.2);
      --text-strong: #ecf7ff;
      --text-soft: #afcbe0;
      --shadow-strong: 0 18px 45px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(116, 180, 255, 0.08);
      --shadow-glow: 0 0 0 1px rgba(110, 185, 255, 0.18), 0 18px 34px rgba(16, 120, 220, 0.18);
    }

    body {
      background:
        radial-gradient(circle at 12% 10%, rgba(78, 155, 255, 0.24), transparent 22%),
        radial-gradient(circle at 90% 0%, rgba(19, 202, 198, 0.16), transparent 24%),
        linear-gradient(145deg, #071018 0%, #0d1723 38%, #0b1017 100%);
    }

    .app {
      background: rgba(7, 13, 19, 0.12);
    }

    .side {
      background: linear-gradient(180deg, rgba(11, 18, 26, 0.96) 0%, rgba(17, 25, 35, 0.94) 100%);
      border-right: 1px solid var(--line-soft);
      box-shadow: inset -1px 0 0 rgba(255,255,255,0.02);
    }

    .brand-mark {
      box-shadow: 0 0 24px rgba(24, 138, 255, 0.6), inset 0 1px 0 rgba(255,255,255,0.18);
      border: 1px solid rgba(159, 210, 255, 0.2);
    }

    .nav button {
      position: relative;
      border: 1px solid transparent;
      transition: all 0.22s ease;
      letter-spacing: 0.02em;
    }

    .nav button:hover,
    .nav button.active {
      background: linear-gradient(135deg, rgba(39, 72, 98, 0.9), rgba(17, 35, 52, 0.95));
      border-color: rgba(122, 197, 255, 0.28);
      box-shadow: var(--shadow-glow);
      color: var(--text-strong);
      transform: translateX(3px);
    }

    .main {
      padding-top: 30px;
    }

    .top {
      padding: 6px 4px 0;
    }

    .title {
      text-shadow: 0 0 18px rgba(106, 196, 255, 0.2);
    }

    .kpi,
    .panel,
    .table-wrap,
    .hero,
    .equipment-dialog {
      background: linear-gradient(180deg, rgba(18, 29, 39, 0.94), rgba(12, 22, 30, 0.92));
      border: 1px solid var(--line-soft);
      box-shadow: var(--shadow-strong);
      backdrop-filter: blur(8px);
    }

    .kpi {
      border-radius: 18px;
      overflow: hidden;
      position: relative;
    }

    .kpi::before,
    .panel::before,
    .table-wrap::before,
    .equipment-dialog::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.06), transparent 35%, transparent 70%, rgba(110, 203, 255, 0.04));
      pointer-events: none;
    }

    .panel {
      border-radius: 18px;
      overflow: visible;
      background: linear-gradient(180deg, rgba(15, 27, 36, 0.96), rgba(12, 19, 28, 0.96));
    }

    .panel-head {
      position: relative;
      z-index: 2;
      background: linear-gradient(180deg, rgba(24, 42, 59, 0.78), rgba(17, 27, 37, 0.8));
      border-bottom: 1px solid var(--line-soft);
      padding: 16px 18px;
      overflow: visible;
    }

    .tools .btn,
    .btn {
      background: linear-gradient(180deg, #1b2d3d, #132433);
      border: 1px solid rgba(142, 196, 255, 0.18);
      box-shadow: 0 8px 18px rgba(7, 19, 32, 0.26);
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 22px rgba(11, 81, 124, 0.28);
      border-color: rgba(110, 195, 255, 0.4);
    }

    .btn.primary {
      background: linear-gradient(135deg, #0d9be6, #0b5cb0);
      box-shadow: 0 10px 20px rgba(9, 118, 189, 0.42);
    }

    .table-wrap {
      border-radius: 16px;
      overflow: hidden;
      background: rgba(13, 22, 31, 0.9);
    }

    .grid {
      border-spacing: 0;
      width: 100%;
      min-width: 920px;
    }

    .grid th {
      background: rgba(24, 36, 46, 0.85);
      border-bottom: 1px solid var(--line-soft);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-size: 11px;
      color: #9bb8ce;
      padding: 12px 14px;
    }

    .grid td {
      background: rgba(13, 24, 33, 0.45);
      border-bottom: 1px solid rgba(110, 145, 170, 0.12);
      padding: 12px 14px;
      transition: background 0.18s ease, transform 0.18s ease;
    }

    .grid tbody tr:hover td {
      background: rgba(18, 41, 57, 0.6);
      transform: translateY(-1px);
    }

    .editable,
    .tools input,
    .tools select,
    .equipment-form input,
    .equipment-form textarea,
    .grid input[type="date"],
    .grid input[type="number"],
    .grid input[type="text"],
    .grid textarea,
    .grid select,
    input[type="date"],
    input[type="number"],
    input[type="text"],
    textarea,
    select {
      background: linear-gradient(180deg, rgba(219, 233, 242, 0.95), rgba(198, 214, 227, 0.82));
      color: #0b1722;
      border: 1px solid rgba(134, 181, 218, 0.32);
      border-radius: 10px;
      padding: 9px 10px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.42), 0 1px 0 rgba(0,0,0,0.16), 0 0 0 1px rgba(100, 176, 255, 0.08);
      transition: all 0.18s ease;
    }

    .editable:focus,
    .tools input:focus,
    .tools select:focus,
    .equipment-form input:focus,
    .equipment-form textarea:focus,
    .grid input:focus,
    .grid textarea:focus,
    .grid select:focus,
    input:focus,
    textarea:focus,
    select:focus {
      outline: none;
      border-color: rgba(20, 126, 214, 0.7);
      box-shadow: 0 0 0 3px rgba(41, 154, 255, 0.18), inset 0 1px 0 rgba(255,255,255,0.42), 0 0 18px rgba(41, 154, 255, 0.14);
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      border: 1px solid transparent;
      background: rgba(255,255,255,0.04);
    }

    .status.green {
      color: #7ff0c4;
      background: rgba(36, 197, 134, 0.12);
      border-color: rgba(36, 197, 134, 0.22);
    }

    .status.yellow {
      color: #ffdb80;
      background: rgba(242, 184, 75, 0.12);
      border-color: rgba(242, 184, 75, 0.22);
    }

    .status.red {
      color: #ff9aa3;
      background: rgba(239, 102, 112, 0.11);
      border-color: rgba(239, 102, 112, 0.22);
    }

    .status .dot {
      box-shadow: 0 0 12px currentColor;
    }

    .util-meter {
      height: 10px;
      border-radius: 999px;
      background: rgba(146, 169, 188, 0.18);
      overflow: hidden;
      border: 1px solid rgba(170, 203, 224, 0.18);
      position: relative;
    }

    .util-meter i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #2ab6d9 0%, #4de09b 52%, #ffbf6a 78%, #ff7d79 100%);
      box-shadow: 0 0 12px rgba(50, 184, 255, 0.4);
    }

    .bar-fill {
      background: linear-gradient(90deg, rgba(81, 165, 255, 0.9), rgba(0, 230, 196, 0.9));
      box-shadow: 0 0 16px rgba(43, 150, 255, 0.38);
    }

    .bar-row {
      padding: 8px 0;
    }

    .hero {
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(18, 35, 48, 0.9), rgba(10, 17, 25, 0.9));
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      min-height: 220px;
      box-shadow: var(--shadow-strong);
      border: 1px solid var(--line-soft);
    }

    .hero img {
      display: block;
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      margin: 0 auto;
      object-fit: contain;
      object-position: center;
      filter: drop-shadow(0 12px 26px rgba(3, 12, 18, 0.7)) saturate(1.1);
      transition: transform 0.2s ease, opacity 0.2s ease;
      opacity: 0;
    }

    .hero.has-image img {
      opacity: 1;
      transform: scale(1.02);
    }

    .hero .placeholder {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      color: rgba(227, 240, 250, 0.8);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 700;
      font-size: 11px;
      opacity: 1;
      transition: opacity 0.2s ease;
    }

    .hero.has-image .placeholder {
      opacity: 0;
      pointer-events: none;
    }

    .upload-btn {
      position: absolute;
      left: 16px;
      bottom: 16px;
      z-index: 2;
      padding: 10px 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, #1d9fe5, #0a5fae);
      color: white;
      font-weight: 700;
      box-shadow: 0 12px 24px rgba(7, 90, 170, 0.4);
      border: 1px solid rgba(158, 213, 255, 0.25);
      cursor: pointer;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .upload-btn:hover {
      transform: translateY(-1px);
    }

    .hero.has-image .upload-btn {
      display: none !important;
    }

    .equipment-modal {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(2, 8, 14, 0.78);
      backdrop-filter: blur(10px);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      z-index: 100;
    }

    .equipment-modal.open {
      opacity: 1;
      visibility: visible;
    }

    .equipment-dialog {
      width: min(1150px, calc(100% - 32px));
      border-radius: 22px;
      padding: 26px 24px 18px;
      position: relative;
      transform: translateY(14px) scale(0.98);
      transition: transform 0.2s ease;
      box-shadow: 0 28px 80px rgba(0,0,0,0.48), 0 0 0 1px rgba(125, 198, 255, 0.12), 0 0 40px rgba(25, 140, 255, 0.14);
      background: linear-gradient(180deg, rgba(11, 19, 28, 0.98), rgba(9, 15, 22, 0.98));
      border: 1px solid rgba(134, 177, 224, 0.2);
    }

    .equipment-modal.open .equipment-dialog {
      transform: translateY(0) scale(1);
    }

    .equipment-dialog header {
      margin-bottom: 18px;
    }

    .equipment-dialog h2 {
      margin: 0 0 8px;
      font-size: 28px;
      letter-spacing: -0.02em;
      color: #edf7ff;
      text-shadow: 0 0 18px rgba(122, 198, 255, 0.14);
    }

    .equipment-dialog p {
      margin: 0;
      color: var(--text-soft);
      line-height: 1.5;
    }

    .equipment-form {
      display: grid;
      grid-template-columns: repeat(6, minmax(120px, 1fr));
      gap: 14px 16px;
      align-items: end;
    }

    .equipment-form label {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 12px;
      color: var(--text-soft);
      font-weight: 600;
      min-width: 0;
    }

    .equipment-form label:nth-child(1),
    .equipment-form label:nth-child(2),
    .equipment-form label:nth-child(3),
    .equipment-form label:nth-child(4),
    .equipment-form label:nth-child(5),
    .equipment-form label:nth-child(6) {
      grid-column: span 1;
    }

    .equipment-form .wide {
      grid-column: 1 / -1;
    }

    .equipment-form input,
    .equipment-form textarea {
      min-height: 44px;
      border-radius: 12px;
      border: 1px solid rgba(144, 192, 232, 0.28);
      background: linear-gradient(180deg, rgba(221, 233, 242, 0.96), rgba(197, 214, 227, 0.82));
      color: #0b1722;
      padding: 10px 12px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 0 0 1px rgba(89, 157, 255, 0.08);
      transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
    }

    .equipment-form textarea {
      resize: vertical;
      min-height: 82px;
    }

    .equipment-form input:focus,
    .equipment-form textarea:focus {
      outline: none;
      border-color: rgba(29, 150, 255, 0.9);
      box-shadow: 0 0 0 3px rgba(42, 144, 255, 0.18), inset 0 1px 0 rgba(255,255,255,0.5);
    }

    .equipment-dialog footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid var(--line-soft);
    }

    .equipment-dialog .cancel,
    .equipment-dialog .save {
      min-width: 136px;
      min-height: 42px;
      border-radius: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
      border: 1px solid rgba(144, 190, 227, 0.2);
      box-shadow: 0 10px 22px rgba(10, 20, 35, 0.28);
    }

    .equipment-dialog .cancel {
      background: linear-gradient(180deg, rgba(34, 46, 60, 0.95), rgba(18, 28, 37, 0.95));
      color: #e8f4ff;
    }

    .equipment-dialog .save {
      background: linear-gradient(135deg, #16a2df, #0c68bf);
      color: white;
      box-shadow: 0 14px 26px rgba(18, 110, 185, 0.38);
    }

    .help {
      color: #8ba9c5;
      font-size: 11px;
    }

    .donut-info {
      position: fixed;
      z-index: 30;
      pointer-events: none;
      display: none;
      padding: 10px 12px;
      background: rgba(12, 21, 29, 0.92);
      border: 1px solid rgba(121, 183, 255, 0.3);
      border-radius: 10px;
      color: #edf4f8;
      font-size: 12px;
      box-shadow: 0 18px 30px rgba(0, 0, 0, 0.34), 0 0 18px rgba(36, 147, 255, 0.15);
    }

    .donut-info strong {
      color: #66d6ff;
    }

    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, rgba(80, 136, 192, 0.8), rgba(42, 76, 113, 0.8));
      border-radius: 999px;
      border: 2px solid rgba(7, 14, 20, 0.7);
    }
  `;
  document.head.append(style);
  const formatNumber = value => Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 1 });
  const dateInputValue = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  };
  const normalizeDateValue = value => {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';

    const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
    if (isoMatch) return trimmed;

    const localeMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (!localeMatch) return trimmed;

    let [, dayPart, monthPart, yearPart] = localeMatch;
    let year = Number(yearPart);
    if (yearPart.length === 2) year = year > 30 ? 1900 + year : 2000 + year;

    const date = new Date(Number(year), Number(monthPart) - 1, Number(dayPart));
    if (Number.isNaN(date.getTime())) return trimmed;
    return dateInputValue(date);
  };
  const parseDate = value => new Date(value + 'T00:00:00');
  const currentGrease = item => {
    const itemCapacity = capacityFor(item);
    if (Number.isFinite(Number(item.grease))) return Math.max(0, Math.min(itemCapacity, Number(item.grease)));
    const elapsed = Math.max(0, Math.floor((Date.now() - parseDate(item.date)) / dayMs));
    return Math.min(itemCapacity, elapsed * dailyRate);
  };
  const calculate = item => {
    const grease = currentGrease(item);
    const itemCapacity = capacityFor(item);
    const remain = Math.max(0, itemCapacity - grease);
    const percent = grease / itemCapacity * 100;
    const daysRemaining = Math.max(0, Math.ceil(remain / dailyRate));
    const changeDate = new Date();
    changeDate.setHours(12, 0, 0, 0);
    changeDate.setDate(changeDate.getDate() + daysRemaining);
    return { grease, remain, percent, daysRemaining, changeDate };
  };
  const syncItem = item => {
    item.grease = Number(currentGrease(item).toFixed(2));
    const remaining = Math.max(0, capacityFor(item) - item.grease);
    const hasCartridgeValues = item.cartridge1 !== '' && item.cartridge2 !== '' && Number.isFinite(Number(item.cartridge1)) && Number.isFinite(Number(item.cartridge2));
    if (!hasCartridgeValues) {
      item.cartridge1 = Number(Math.min(cartridgeCapacity, remaining / cartridgeCountFor(item)).toFixed(1));
      item.cartridge2 = Number(Math.min(cartridgeCapacity, remaining / cartridgeCountFor(item)).toFixed(1));
      if (cartridgeCountFor(item) === 3) item.cartridge3 = item.cartridge1;
    }
    if (item.observations === undefined) item.observations = '';
  };
  const statusName = calculation => calculation.percent > 90 ? 'red' : calculation.percent > 70 ? 'yellow' : 'green';
  const statusLabel = { green: 'Normal', yellow: 'Próximo cambio', red: 'Vencido' };
  const renderDonut = (percent, used, capacity) => {
    const donut = document.getElementById('donut');
    const donutText = document.getElementById('donutText');
    if (donut) donut.setAttribute('stroke-dasharray', Math.min(333, percent / 100 * 333) + ' 333');
    if (donutText) donutText.textContent = formatNumber(percent) + '%';
    const chart = donut?.closest('svg');
    if (!chart) return;
    const available = Math.max(0, capacity - used);
    const darkArc = [...chart.querySelectorAll('circle')].find(circle => circle !== donut);
    const info = document.querySelector('.donut-info') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'donut-info' }));
    const showInfo = (event, label, value, color) => { info.innerHTML = label + ': <strong style="color:' + color + '">' + formatNumber(value) + ' ml</strong>'; info.style.left = Math.min(window.innerWidth - 190, event.clientX + 12) + 'px'; info.style.top = Math.max(8, event.clientY - 42) + 'px'; info.style.display = 'block'; };
    const hideInfo = () => { info.style.display = 'none'; };
    if (!donut.dataset.interactive) {
      donut.dataset.interactive = 'true';
      donut.addEventListener('pointermove', event => showInfo(event, 'Consumido', Number(donut.dataset.used), '#2fa9e6'));
      donut.addEventListener('pointerenter', event => showInfo(event, 'Consumido', Number(donut.dataset.used), '#2fa9e6'));
      donut.addEventListener('pointerleave', hideInfo);
      darkArc?.addEventListener('pointermove', event => showInfo(event, 'Disponible', Number(darkArc.dataset.available), '#8fa2b3'));
      darkArc?.addEventListener('pointerenter', event => showInfo(event, 'Disponible', Number(darkArc.dataset.available), '#8fa2b3'));
      darkArc?.addEventListener('pointerleave', hideInfo);
    }
    donut.dataset.used = used;
    if (darkArc) darkArc.dataset.available = available;
  };
  const renderCharts = calculations => {
    const bars = document.getElementById('bars');
    if (!bars) return;
    const highest = Math.max(1, ...calculations.map(entry => entry.calculation.grease));
    bars.innerHTML = calculations.slice().sort((a, b) => b.calculation.grease - a.calculation.grease).slice(0, 10).map(entry => {
      const width = entry.calculation.grease / highest * 100;
      return '<div class="bar-row"><div class="bar-label"><span>' + entry.item.af + '</span><span>' + formatNumber(entry.calculation.grease) + ' ml</span></div><div class="bar-track"><div class="bar-fill" style="width:' + width + '%"></div></div></div>';
    }).join('');
  };
  const render = () => {
    data.forEach(syncItem);
    if (tableHeader) tableHeader.innerHTML = '<th>Activo / AF</th><th>Instalación</th><th>Operador</th><th>Lubricador 1 (ml)</th><th>Lubricador 2 (ml)</th><th>Lubricador 3 (ml)</th><th>Observaciones</th><th>Consumo</th><th>Utilización</th><th>Estado</th><th>Días restantes</th><th>Fecha cambio</th><th>Lubricador</th><th></th>';
    const query = (search?.value || '').toLowerCase();
    const calculations = data.map(item => ({ item, calculation: calculate(item) }));
    const visible = calculations.filter(entry => {
      const item = entry.item;
      const currentStatus = statusName(entry.calculation);
      return (!query || item.af.toLowerCase().includes(query) || item.name.toLowerCase().includes(query)) &&
        (!dateFilter?.value || item.date === dateFilter.value) &&
        (!state || state.value === 'all' || state.value === currentStatus);
    });
    rows.innerHTML = visible.map(entry => {
      const item = entry.item;
      const calculation = entry.calculation;
      const currentStatus = statusName(calculation);
      return '<tr>' +
        '<td><strong>' + item.af + '</strong><br>' + item.name + '</td>' +
        '<td><input class="editable date-edit" data-af="' + item.af + '" type="text" inputmode="numeric" pattern="\\d{4}-\\d{2}-\\d{2}" placeholder="aaaa-mm-dd" value="' + item.date + '"></td>' +
        '<td><input class="editable operator-edit" data-af="' + item.af + '" value="' + (item.operator || '') + '" placeholder="Operador"></td>' +
        '<td><input class="editable cartridge-edit cartridge1-edit" data-af="' + item.af + '" type="number" min="0" max="125" step="0.1" value="' + Number(item.cartridge1).toFixed(1) + '"></td>' +
        '<td><input class="editable cartridge-edit cartridge2-edit" data-af="' + item.af + '" type="number" min="0" max="125" step="0.1" value="' + Number(item.cartridge2).toFixed(1) + '"></td>' +
        '<td>' + (cartridgeCountFor(item) === 3 ? '<input class="editable cartridge-edit cartridge3-edit" data-af="' + item.af + '" type="number" min="0" max="125" step="0.1" value="' + Number(item.cartridge3 || 0).toFixed(1) + '">' : '<span class="muted">No aplica</span>') + '</td>' +
        '<td><input class="editable observation-edit observations-edit" data-af="' + item.af + '" value="' + (item.observations || '') + '" placeholder="Añadir observación"></td>' +
        '<td><input class="editable grease-edit" data-af="' + item.af + '" type="number" min="0" max="250" step="0.1" value="' + calculation.grease.toFixed(1) + '"> ml</td>' +
        '<td><div class="util-cell"><span class="util-value">' + formatNumber(calculation.percent) + '%</span><div class="util-meter ' + currentStatus + '"><i style="width:' + Math.min(100, calculation.percent) + '%"></i></div></div></td>' +
        '<td><span class="status ' + currentStatus + '"><i class="dot"></i>' + statusLabel[currentStatus] + '</span></td>' +
        '<td>' + calculation.daysRemaining + '</td>' +
        '<td>' + dateText(calculation.changeDate) + '</td>' +
        '<td><input class="editable point-edit" data-af="' + item.af + '" value="' + (item.point || 'Doble punto') + '"></td>' +
        '<td><div class="row-actions"><button class="btn" data-edit="' + item.af + '">Modificar</button><button class="btn" data-remove="' + item.af + '">Eliminar</button></div></td>' +
        '</tr>';
    }).join('');
    const totalGrease = calculations.reduce((sum, entry) => sum + entry.calculation.grease, 0);
    const totalCapacity = data.reduce((sum, item) => sum + capacityFor(item), 0);
    const totalPercent = totalCapacity ? totalGrease / totalCapacity * 100 : 0;
    document.getElementById('totalUsed').textContent = formatNumber(totalGrease) + ' ml';
    document.getElementById('totalRemain').textContent = formatNumber(totalCapacity - totalGrease) + ' ml';
    document.getElementById('installed').textContent = 'Capacidad instalada: ' + formatNumber(totalCapacity) + ' ml';
    document.getElementById('plantUsage').textContent = formatNumber(totalPercent) + '% de utilización planta';
    document.getElementById('upcoming').textContent = calculations.filter(entry => entry.calculation.daysRemaining <= 30 && entry.calculation.daysRemaining > 0).length;
    document.getElementById('expired').textContent = calculations.filter(entry => entry.calculation.daysRemaining === 0).length;
    document.getElementById('healthy').textContent = data.length + ' equipos en control';
    const indicatorsPanel = [...document.querySelectorAll('.panel')].find(panel => panel.querySelector('h2')?.textContent.includes('Indicadores operativos'));
    const indicatorValues = indicatorsPanel?.querySelectorAll('.tech strong');
    if (indicatorValues?.length >= 3) {
      indicatorValues[0].textContent = data.length;
      const totalCartridges = data.reduce((sum, item) => sum + cartridgeCountFor(item), 0);
      indicatorValues[1].textContent = totalCartridges;
      indicatorValues[2].textContent = formatNumber(totalCapacity) + ' ml';
    }
    renderDonut(totalPercent, totalGrease, totalCapacity);
    renderCharts(calculations);
    maybeAutoSendWhatsappAlert();
  };
  const findItem = af => data.find(item => item.af === af);
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(data)); toast(); };
  const sanitizeData = items => {
    if (!Array.isArray(items)) return [];
    const validItems = items.filter(item => item && typeof item === 'object' && item.af && !INVALID_AF_SET.has(item.af) && VALID_AF_SET.has(item.af));
    const byAf = new Map();
    validItems.forEach(item => byAf.set(item.af, { ...item, name: item.name || item.af }));
    const seeded = [...VALID_AF_SET].filter(af => !byAf.has(af)).map(af => ({
      af,
      name: `${af.startsWith('AF155') ? 'LAVADORA METODOZONE' : 'LAVADORA TONELLO'} ${af.replace(/AF|-/g, '').slice(-2) || '1'}`,
      date: dateInputValue(new Date(Date.now() - ((Math.random() * 120) | 0) * dayMs)),
      operator: '',
      notes: '',
      point: 'Doble punto'
    }));
    seeded.forEach(item => byAf.set(item.af, item));
    return [...byAf.values()].sort((a, b) => a.af.localeCompare(b.af));
  };
  data = sanitizeData(data);
  if (!data.length) {
    const fallback = sanitizeData(JSON.parse(localStorage.getItem(KEY) || 'null') || []);
    data = fallback.length ? fallback : sanitizeData(JSON.parse(localStorage.getItem('skf-real-data') || 'null') || []);
  }
  if (data.length !== sanitizeData(JSON.parse(localStorage.getItem(KEY) || 'null') || []).length) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  const updateDate = input => {
    const item = findItem(input.dataset.af);
    if (!item) return;
    const normalized = normalizeDateValue(input.value);
    if (!normalized) return;
    item.date = normalized;
    item.grease = Number(currentGrease({ date: item.date }).toFixed(2));
    item.cartridge1 = Number(Math.min(cartridgeCapacity, (capacityFor(item) - item.grease) / cartridgeCountFor(item)).toFixed(1));
    item.cartridge2 = item.cartridge1;
    if (cartridgeCountFor(item) === 3) item.cartridge3 = item.cartridge1;
    persist();
    render();
  };
  const updateGrease = input => {
    const item = findItem(input.dataset.af);
    if (!item) return;
    item.grease = Math.max(0, Math.min(capacityFor(item), Number(input.value) || 0));
    item.date = dateInputValue(new Date(Date.now() - item.grease / dailyRate * dayMs));
    item.cartridge1 = Number(Math.min(cartridgeCapacity, (capacityFor(item) - item.grease) / cartridgeCountFor(item)).toFixed(1));
    item.cartridge2 = item.cartridge1;
    if (cartridgeCountFor(item) === 3) item.cartridge3 = item.cartridge1;
    persist();
    render();
  };
  const updateCartridges = input => {
    const item = findItem(input.dataset.af);
    if (!item) return;
    const cartridgeField = input.matches('.cartridge1-edit') ? 'cartridge1' : input.matches('.cartridge2-edit') ? 'cartridge2' : 'cartridge3';
    item[cartridgeField] = Math.max(0, Math.min(cartridgeCapacity, Number(input.value) || 0));
    const remaining = Number(item.cartridge1 || 0) + Number(item.cartridge2 || 0) + Number(item.cartridge3 || 0);
    item.grease = Math.max(0, Math.min(capacityFor(item), capacityFor(item) - remaining));
    item.date = dateInputValue(new Date(Date.now() - item.grease / dailyRate * dayMs));
    persist();
    render();
  };
  rows.addEventListener('change', event => {
    const input = event.target;
    if (input.matches('.date-edit')) updateDate(input);
    if (input.matches('.grease-edit')) updateGrease(input);
    if (input.matches('.cartridge1-edit, .cartridge2-edit, .cartridge3-edit')) updateCartridges(input);
    if (input.matches('.operator-edit, .cartridge1-edit, .cartridge2-edit, .cartridge3-edit, .observations-edit, .point-edit')) {
      const item = findItem(input.dataset.af);
      if (item) {
        if (input.matches('.operator-edit')) item.operator = input.value;
        if (input.matches('.cartridge1-edit')) item.cartridge1 = input.value;
        if (input.matches('.cartridge2-edit')) item.cartridge2 = input.value;
        if (input.matches('.cartridge3-edit')) item.cartridge3 = input.value;
        if (input.matches('.observations-edit')) item.observations = input.value;
        if (input.matches('.point-edit')) item.point = input.value;
        persist();
      }
    }
  });
  rows.addEventListener('click', event => {
    const editButton = event.target.closest('[data-edit]');
    if (editButton) {
      const row = editButton.closest('tr');
      row.classList.add('row-editing');
      row.querySelector('.date-edit')?.focus();
      toast();
      return;
    }
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    data = data.filter(item => item.af !== button.dataset.remove);
    persist();
    render();
  });
  [search, state, dateFilter].forEach(control => control?.addEventListener('input', render));
  const tableWrap = document.querySelector('.table-wrap');
  if (tableWrap) tableWrap.style.maxHeight = '380px';
  const addButton = document.getElementById('add');
  const whatsappButton = document.getElementById('whatsapp');
  const AUTO_ALERT_KEY = 'skf-system24-whatsapp-alert-last';
  const WHATSAPP_NUMBER = '573151787639';
  const buildWhatsappMessage = () => {
    const alerts = data
      .map(item => ({ item, calculation: calculate(item) }))
      .filter(entry => entry.calculation.daysRemaining <= 50)
      .sort((a, b) => a.calculation.daysRemaining - b.calculation.daysRemaining);

    const lines = alerts.length
      ? alerts.map(entry => {
          const { item, calculation } = entry;
          return `- ${item.af} | ${item.name} | ${calculation.daysRemaining} días restantes`;
        }).join('\n')
      : 'No hay equipos con 50 días o menos de grasa restante.';

    return 'ALERTA SKF SYSTEM 24\n\nEquipos con 50 días o menos de grasa restante:\n' + lines;
  };
  const sendWhatsappAlert = (silent = false) => {
    const message = buildWhatsappMessage();
    const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener');
    if (!silent) {
      toast();
    }
  };
  const maybeAutoSendWhatsappAlert = () => {
    const alerts = data
      .map(item => ({ item, calculation: calculate(item) }))
      .filter(entry => entry.calculation.daysRemaining <= 50);

    if (!alerts.length) return;

    const now = Date.now();
    const lastSent = Number(localStorage.getItem(AUTO_ALERT_KEY) || '0');
    const twelveHoursMs = 12 * 60 * 60 * 1000;

    if (now - lastSent < twelveHoursMs) return;

    localStorage.setItem(AUTO_ALERT_KEY, String(now));
    sendWhatsappAlert(true);
  };
  const modal = document.createElement('div');
  modal.className = 'equipment-modal';
  modal.innerHTML = '<div class="equipment-dialog" role="dialog" aria-modal="true" aria-labelledby="equipment-title"><header><h2 id="equipment-title">Agregar equipo</h2><p>Completa los datos del equipo. Puedes usar la fecha o las cantidades de grasa para calcular el resto.</p></header><form class="equipment-form"><label>Código AF<input name="af" required placeholder="AF000000-00"></label><label>Nombre del equipo<input name="name" required placeholder="Nombre del equipo"></label><label>Fecha de instalación<input name="date" type="text" inputmode="numeric" pattern="\\d{4}-\\d{2}-\\d{2}" required placeholder="aaaa-mm-dd" lang="es-CO"></label><label>Operador<input name="operator" placeholder="Operador"></label><label>Lubricador 1 (ml)<input name="cartridge1" type="number" min="0" max="125" step="0.1" placeholder="Opcional"></label><label>Lubricador 2 (ml)<input name="cartridge2" type="number" min="0" max="125" step="0.1" placeholder="Opcional"></label><label>Lubricador / punto<input name="point" value="Doble punto"></label><label class="wide">Observaciones<textarea name="observations" rows="3" placeholder="Añadir observaciones"></textarea><span class="help">Cada lubricador tiene una capacidad máxima de 125 ml.</span></label></form><footer><button type="button" class="btn cancel">Cancelar</button><button type="button" class="btn save">Guardar equipo</button></footer></div>';
  document.body.append(modal);
  const form = modal.querySelector('form');
  const closeModal = () => modal.classList.remove('open');
  modal.querySelector('.cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  modal.querySelector('.save').addEventListener('click', () => {
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const normalizedDate = normalizeDateValue(values.date);
    const hasQuantities = values.cartridge1 !== '' || values.cartridge2 !== '';
    const cartridge1 = hasQuantities ? Math.min(cartridgeCapacity, Math.max(0, Number(values.cartridge1) || 0)) : 0;
    const cartridge2 = hasQuantities ? Math.min(cartridgeCapacity, Math.max(0, Number(values.cartridge2) || 0)) : 0;
    const dateBasedGrease = currentGrease({ date: normalizedDate || values.date });
    const grease = hasQuantities ? capacityPerEquipment - cartridge1 - cartridge2 : dateBasedGrease;
    const remaining = hasQuantities ? cartridge1 + cartridge2 : capacityPerEquipment - grease;
    const item = { af: values.af.trim(), name: values.name.trim(), date: normalizedDate || values.date, operator: values.operator, cartridge1: hasQuantities ? cartridge1 : Number((remaining / 2).toFixed(1)), cartridge2: hasQuantities ? cartridge2 : Number((remaining / 2).toFixed(1)), observations: values.observations, point: values.point || 'Doble punto', grease };
    if (hasQuantities) item.date = dateInputValue(new Date(Date.now() - grease / dailyRate * dayMs));
    data.push(item); persist(); render(); form.reset(); closeModal();
  });
  addButton?.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    form.date.value = dateInputValue(new Date());
    modal.classList.add('open');
    form.af.focus();
  }, true);
  whatsappButton?.addEventListener('click', () => {
    sendWhatsappAlert();
  });
  const ensureImageSection = () => {
    let imageHero = document.getElementById('hero');
    let imageInput = document.getElementById('imageInput');
    let productImage = document.getElementById('productImage');

    if (!imageHero) {
      imageHero = document.createElement('div');
      imageHero.id = 'hero';
      imageHero.className = 'hero';
      imageHero.innerHTML = '<img id="productImage" alt="Imagen del lubricador" /><div class="placeholder">Sin imagen</div><input id="imageInput" type="file" accept="image/*" hidden /><label class="upload-btn" for="imageInput">Cargar imagen</label>';
      const target = document.querySelector('.right .panel') || document.querySelector('.right') || document.body;
      target.appendChild(imageHero);
    }

    imageHero.style.display = 'flex';
    imageHero.style.alignItems = 'center';
    imageHero.style.justifyContent = 'center';
    imageHero.style.position = 'relative';
    imageHero.style.minHeight = '220px';

    imageInput = document.getElementById('imageInput');
    productImage = document.getElementById('productImage');
    if (productImage) {
      productImage.style.display = 'block';
      productImage.style.margin = '0 auto';
      productImage.style.maxWidth = '100%';
      productImage.style.maxHeight = '100%';
      productImage.style.objectFit = 'contain';
      productImage.style.objectPosition = 'center';
    }

    const uploadButton = document.querySelector('.upload-btn');
    if (uploadButton) {
      uploadButton.style.display = 'inline-flex';
      uploadButton.style.alignItems = 'center';
      uploadButton.style.justifyContent = 'center';
      uploadButton.style.position = 'absolute';
      uploadButton.style.bottom = '16px';
      uploadButton.style.left = '16px';
    }

    if (imageInput && uploadButton) {
      imageInput.onchange = event => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
          showProductImage(reader.result);
          localStorage.setItem('skf-image', reader.result);
        };
        reader.readAsDataURL(file);
      };
    }

    return { imageHero, imageInput, productImage };
  };

  const { imageHero, imageInput, productImage } = ensureImageSection();
  const showProductImage = imageData => {
    const currentHero = document.getElementById('hero') || imageHero;
    const currentImage = document.getElementById('productImage') || productImage;
    if (!imageData || !currentImage || !currentHero) return;
    currentImage.src = imageData;
    currentHero.classList.add('has-image');
    const uploadButton = document.querySelector('.upload-btn');
    if (uploadButton) uploadButton.style.display = 'none';
  };

  const savedImage = localStorage.getItem('skf-image');
  if (savedImage) showProductImage(savedImage);
  else if (imageHero) imageHero.classList.remove('has-image');

  imageInput?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      showProductImage(reader.result);
      localStorage.setItem('skf-image', reader.result);
    };
    reader.readAsDataURL(file);
  });
  data.forEach(syncItem);
  render();
  setInterval(render, 60000);
})();
