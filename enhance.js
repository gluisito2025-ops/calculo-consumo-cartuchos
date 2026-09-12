(function () {
  const dailyRate = 1.37;
  const cartridgeCapacity = 125;
  const capacityPerEquipment = 250;
  const cartridgeCountFor = item => item.af === 'AF076158-10' ? 3 : 2;
  const capacityFor = item => cartridgeCountFor(item) * cartridgeCapacity;
  const dayMs = 86400000;
  const rows = document.getElementById('rows');
  const search = document.getElementById('search');
  const state = document.getElementById('state');
  const dateFilter = document.getElementById('dateFilter');
  const tableHeader = document.querySelector('.grid thead tr');
  const style = document.createElement('style');
  style.textContent = '.grid th{white-space:nowrap}.editable{width:100%;min-width:116px;padding:9px 10px;background:#101b27;border:1px solid #304355;border-radius:6px;color:#edf4f8;transition:border-color .2s,box-shadow .2s,transform .2s}.editable:hover,.editable:focus{border-color:#2fa9e6;box-shadow:0 0 0 3px #2fa9e622,0 0 18px #2fa9e633;outline:0;transform:translateY(-1px)}.editable::placeholder{color:#8fa2b3}.cartridge-edit{min-width:94px}.observation-edit{min-width:140px}.muted{color:#64788a;font-size:11px}.status{font-weight:600}.status.green{color:#24c586}.status.yellow{color:#f2b84b}.status.red{color:#ef6670}.util-cell{min-width:92px}.util-value{display:block;margin-bottom:5px}.util-meter{height:7px;background:#263746;border-radius:6px;overflow:hidden;box-shadow:inset 0 1px 3px #0008}.util-meter i{display:block;height:100%;border-radius:6px;box-shadow:0 0 10px currentColor}.util-meter.green i{background:#24c586;color:#24c586}.util-meter.yellow i{background:#f2b84b;color:#f2b84b}.util-meter.red i{background:#ef6670;color:#ef6670}.row-actions{display:flex;gap:5px}.row-actions .btn{padding:7px 9px;transition:box-shadow .2s,transform .2s}.row-actions .btn:hover{box-shadow:0 0 14px #2fa9e666;transform:translateY(-1px)}.row-editing{outline:1px solid #2fa9e6;outline-offset:-1px;box-shadow:inset 0 0 24px #2fa9e60d}.grid tbody tr{transition:background .2s,box-shadow .2s}.grid tbody tr:hover{background:#19304766;box-shadow:inset 3px 0 #2fa9e6}.kpi,.panel{transition:border-color .2s,box-shadow .2s}.kpi:hover,.panel:hover{border-color:#376078;box-shadow:0 18px 45px #0008,0 0 20px #2fa9e61c}.hero{display:flex!important;align-items:center;justify-content:center}.hero img{object-fit:contain;object-position:center center}.hero.has-image .upload{display:none!important}';
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
    if (tableHeader) tableHeader.innerHTML = '<th>Activo / AF</th><th>Instalación</th><th>Operador</th><th>Cartucho 1 (ml)</th><th>Cartucho 2 (ml)</th><th>Cartucho 3 (ml)</th><th>Observaciones</th><th>Consumo</th><th>Utilización</th><th>Estado</th><th>Días restantes</th><th>Fecha cambio</th><th>Lubricador</th><th></th>';
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
    if (indicatorValues?.length >= 4) {
      indicatorValues[0].textContent = data.length;
      const totalCartridges = data.reduce((sum, item) => sum + cartridgeCountFor(item), 0);
      indicatorValues[1].textContent = totalCartridges;
      indicatorValues[2].textContent = totalCartridges;
      indicatorValues[3].textContent = formatNumber(totalCapacity) + ' ml';
    }
    renderDonut(totalPercent);
    renderCharts(calculations);
  };
  const findItem = af => data.find(item => item.af === af);
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(data)); toast(); };
  if (!data.some(item => item.af === 'AF155714-10')) {
    data.push({ af: 'AF155714-10', name: 'LAVADORA METODOZONE 5', date: dateInputValue(new Date()), operator: '', notes: '', point: 'Doble punto' });
  }
  const updateDate = input => {
    const item = findItem(input.dataset.af);
    if (!item || !input.value) return;
    item.date = input.value;
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
  if (tableWrap) tableWrap.style.maxHeight = '460px';
  const addButton = document.getElementById('add');
  addButton?.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const af = prompt('Código AF');
    if (!af) return;
    const name = prompt('Nombre del equipo', 'Nuevo equipo');
    if (!name) return;
    const date = prompt('Fecha de instalación (AAAA-MM-DD)', dateInputValue(new Date()));
    if (!date) return;
    const operator = prompt('Operador', '');
    const cartridge1Input = prompt('Cantidad Cartucho 1 (0 a 125 ml). Deja vacío para calcular desde la fecha', '');
    const cartridge2Input = prompt('Cantidad Cartucho 2 (0 a 125 ml). Deja vacío para calcular desde la fecha', '');
    const observations = prompt('Observaciones', '');
    const point = prompt('Lubricador / punto', 'Doble punto');
    const hasQuantities = cartridge1Input.trim() !== '' || cartridge2Input.trim() !== '';
    const cartridge1 = hasQuantities ? Math.min(cartridgeCapacity, Math.max(0, Number(cartridge1Input) || 0)) : 0;
    const cartridge2 = hasQuantities ? Math.min(cartridgeCapacity, Math.max(0, Number(cartridge2Input) || 0)) : 0;
    const dateBasedGrease = currentGrease({ date });
    const grease = hasQuantities ? capacityPerEquipment - cartridge1 - cartridge2 : dateBasedGrease;
    const remaining = hasQuantities ? cartridge1 + cartridge2 : capacityPerEquipment - grease;
    const item = { af, name, date, operator: operator || '', cartridge1: hasQuantities ? cartridge1 : Number((remaining / 2).toFixed(1)), cartridge2: hasQuantities ? cartridge2 : Number((remaining / 2).toFixed(1)), observations: observations || '', point: point || 'Doble punto', grease };
    if (hasQuantities) item.date = dateInputValue(new Date(Date.now() - grease / dailyRate * dayMs));
    data.push(item);
    persist();
    render();
  }, true);
  const imageInput = document.getElementById('imageInput');
  const productImage = document.getElementById('productImage');
  const imageHero = document.getElementById('hero');
  const showProductImage = imageData => {
    if (!imageData || !productImage || !imageHero) return;
    productImage.src = imageData;
    imageHero.classList.add('has-image');
  };
  showProductImage(localStorage.getItem('skf-image'));
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
