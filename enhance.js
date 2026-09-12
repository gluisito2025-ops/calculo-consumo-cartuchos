(function () {
  const dailyRate = 1.37;
  const capacityPerEquipment = 250;
  const dayMs = 86400000;
  const rows = document.getElementById('rows');
  const search = document.getElementById('search');
  const state = document.getElementById('state');
  const dateFilter = document.getElementById('dateFilter');
  const tableHeader = document.querySelector('.grid thead tr');
  const style = document.createElement('style');
  style.textContent = '.grid th{white-space:nowrap}.editable{width:100%;min-width:116px;padding:9px 10px;background:#101b27;border:1px solid #304355;border-radius:6px;color:#edf4f8}.editable::placeholder{color:#8fa2b3}.cartridge-edit{min-width:94px}.observation-edit{min-width:140px}';
  document.head.append(style);
  const formatNumber = value => Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 1 });
  const dateInputValue = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  };
  const parseDate = value => new Date(value + 'T00:00:00');
  const currentGrease = item => {
    if (Number.isFinite(Number(item.grease))) return Math.max(0, Math.min(capacityPerEquipment, Number(item.grease)));
    const elapsed = Math.max(0, Math.floor((Date.now() - parseDate(item.date)) / dayMs));
    return Math.min(capacityPerEquipment, elapsed * dailyRate);
  };
  const calculate = item => {
    const grease = currentGrease(item);
    const remain = Math.max(0, capacityPerEquipment - grease);
    const percent = grease / capacityPerEquipment * 100;
    const daysRemaining = Math.max(0, Math.ceil(remain / dailyRate));
    const changeDate = new Date();
    changeDate.setHours(12, 0, 0, 0);
    changeDate.setDate(changeDate.getDate() + daysRemaining);
    return { grease, remain, percent, daysRemaining, changeDate };
  };
  const syncItem = item => {
    item.grease = Number(currentGrease(item).toFixed(2));
    if (item.cartridge1 === undefined) item.cartridge1 = '';
    if (item.cartridge2 === undefined) item.cartridge2 = '';
    if (item.observations === undefined) item.observations = '';
  };
  const statusName = calculation => calculation.percent > 90 ? 'red' : calculation.percent > 70 ? 'yellow' : 'green';
  const statusLabel = { green: 'Normal', yellow: 'Próximo cambio', red: 'Vencido' };
  const renderDonut = percent => {
    const donut = document.getElementById('donut');
    const donutText = document.getElementById('donutText');
    if (donut) donut.setAttribute('stroke-dasharray', Math.min(333, percent / 100 * 333) + ' 333');
    if (donutText) donutText.textContent = formatNumber(percent) + '%';
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
    if (tableHeader) tableHeader.innerHTML = '<th>Activo / AF</th><th>Instalación</th><th>Operador</th><th>Cartucho 1</th><th>Cartucho 2</th><th>Observaciones</th><th>Consumo</th><th>Utilización</th><th>Estado</th><th>Días restantes</th><th>Fecha cambio</th><th>Lubricador</th><th></th>';
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
        '<td><input class="editable date-edit" data-af="' + item.af + '" type="date" value="' + item.date + '"></td>' +
        '<td><input class="editable operator-edit" data-af="' + item.af + '" value="' + (item.operator || '') + '" placeholder="Operador"></td>' +
        '<td><input class="editable cartridge-edit cartridge1-edit" data-af="' + item.af + '" value="' + (item.cartridge1 || '') + '" placeholder="Cartucho 1"></td>' +
        '<td><input class="editable cartridge-edit cartridge2-edit" data-af="' + item.af + '" value="' + (item.cartridge2 || '') + '" placeholder="Cartucho 2"></td>' +
        '<td><input class="editable observation-edit observations-edit" data-af="' + item.af + '" value="' + (item.observations || '') + '" placeholder="Añadir observación"></td>' +
        '<td><input class="editable grease-edit" data-af="' + item.af + '" type="number" min="0" max="250" step="0.1" value="' + calculation.grease.toFixed(1) + '"> ml</td>' +
        '<td>' + formatNumber(calculation.percent) + '%</td>' +
        '<td><span class="status ' + currentStatus + '"><i class="dot"></i>' + statusLabel[currentStatus] + '</span></td>' +
        '<td>' + calculation.daysRemaining + '</td>' +
        '<td>' + dateText(calculation.changeDate) + '</td>' +
        '<td><input class="editable point-edit" data-af="' + item.af + '" value="' + (item.point || 'Doble punto') + '"></td>' +
        '<td><button class="btn" data-remove="' + item.af + '">Eliminar</button></td>' +
        '</tr>';
    }).join('');
    const totalGrease = calculations.reduce((sum, entry) => sum + entry.calculation.grease, 0);
    const totalCapacity = data.length * capacityPerEquipment;
    const totalPercent = totalCapacity ? totalGrease / totalCapacity * 100 : 0;
    document.getElementById('totalUsed').textContent = formatNumber(totalGrease) + ' ml';
    document.getElementById('totalRemain').textContent = formatNumber(totalCapacity - totalGrease) + ' ml';
    document.getElementById('installed').textContent = 'Capacidad instalada: ' + formatNumber(totalCapacity) + ' ml';
    document.getElementById('plantUsage').textContent = formatNumber(totalPercent) + '% de utilización planta';
    document.getElementById('upcoming').textContent = calculations.filter(entry => entry.calculation.daysRemaining <= 30 && entry.calculation.daysRemaining > 0).length;
    document.getElementById('expired').textContent = calculations.filter(entry => entry.calculation.daysRemaining === 0).length;
    document.getElementById('healthy').textContent = data.length + ' equipos en control';
    renderDonut(totalPercent);
    renderCharts(calculations);
  };
  const findItem = af => data.find(item => item.af === af);
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(data)); toast(); };
  const updateDate = input => {
    const item = findItem(input.dataset.af);
    if (!item || !input.value) return;
    item.date = input.value;
    item.grease = Number(currentGrease({ date: item.date }).toFixed(2));
    persist();
    render();
  };
  const updateGrease = input => {
    const item = findItem(input.dataset.af);
    if (!item) return;
    item.grease = Math.max(0, Math.min(capacityPerEquipment, Number(input.value) || 0));
    item.date = dateInputValue(new Date(Date.now() - item.grease / dailyRate * dayMs));
    persist();
    render();
  };
  rows.addEventListener('change', event => {
    const input = event.target;
    if (input.matches('.date-edit')) updateDate(input);
    if (input.matches('.grease-edit')) updateGrease(input);
    if (input.matches('.operator-edit, .cartridge1-edit, .cartridge2-edit, .observations-edit, .point-edit')) {
      const item = findItem(input.dataset.af);
      if (item) {
        if (input.matches('.operator-edit')) item.operator = input.value;
        if (input.matches('.cartridge1-edit')) item.cartridge1 = input.value;
        if (input.matches('.cartridge2-edit')) item.cartridge2 = input.value;
        if (input.matches('.observations-edit')) item.observations = input.value;
        if (input.matches('.point-edit')) item.point = input.value;
        persist();
      }
    }
  });
  rows.addEventListener('click', event => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    data = data.filter(item => item.af !== button.dataset.remove);
    persist();
    render();
  });
  [search, state, dateFilter].forEach(control => control?.addEventListener('input', render));
  const tableWrap = document.querySelector('.table-wrap');
  if (tableWrap) tableWrap.style.maxHeight = '460px';
  data.forEach(syncItem);
  render();
  setInterval(render, 60000);
})();
