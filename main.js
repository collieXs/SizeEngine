let currentDirection = 'LONG';
let currentMode = 'LOT'; // Default mode
const MIN_LOT_SIZE = 0.01;

const inputs = ['accountSize', 'riskAmount', 'rrRatio', 'entryPrice', 'stopLoss'];

document.addEventListener('DOMContentLoaded', () => {
  const savedMode = localStorage.getItem('sizeEngine_mode');
  const modalEl = document.getElementById('modeModal');
  
  if (savedMode) {
    currentMode = savedMode;
    updateSwitcherUI(savedMode);
    modalEl.classList.add('hidden');
  } else {
    modalEl.classList.remove('hidden');
  }
  
  bindInputListeners();
  renderResultStructure();
});

function selectInitialMode(mode) {
  currentMode = mode;
  localStorage.setItem('sizeEngine_mode', mode);
  updateSwitcherUI(mode);
  document.getElementById('modeModal').classList.add('hidden');
  renderResultStructure();
  calculate();
}

function switchEngineMode(mode) {
  currentMode = mode;
  localStorage.setItem('sizeEngine_mode', mode);
  updateSwitcherUI(mode);
  renderResultStructure();
  calculate();
}

function updateSwitcherUI(mode) {
  const lotTab = document.getElementById('lotTab');
  const levTab = document.getElementById('levTab');
  
  if (mode === 'LOT') {
    lotTab.classList.add('active');
    levTab.classList.remove('active');
  } else {
    levTab.classList.add('active');
    lotTab.classList.remove('active');
  }
}

function bindInputListeners() {
  inputs.forEach(id => {
    const inputEl = document.getElementById(id);
    
    inputEl.addEventListener('input', (e) => {
      let cursorPosition = e.target.selectionStart;
      let originalLength = e.target.value.length;
      
      let cleanValue = e.target.value.replace(/,/g, '');
      
      if (cleanValue === '.' || cleanValue.startsWith('.')) {
        cleanValue = '0' + (cleanValue.startsWith('.') ? cleanValue : '.');
      }
      
      if (isNaN(cleanValue)) {
        cleanValue = cleanValue.slice(0, -1);
      }
      
      if (cleanValue !== '') {
        const parts = cleanValue.split('.');
        if (parts[0].length > 14) parts[0] = parts[0].slice(0, 14);
        parts[0] = parseFloat(parts[0]).toLocaleString('en-US');
        e.target.value = parts.join('.');
      } else {
        e.target.value = '';
      }
      
      let newLength = e.target.value.length;
      e.target.setSelectionRange(cursorPosition + (newLength - originalLength), cursorPosition + (newLength - originalLength));
      
      calculate();
    });
  });
}

function setDirection(dir) {
  currentDirection = dir;
  const longBtn = document.getElementById('longBtn');
  const shortBtn = document.getElementById('shortBtn');
  
  if (dir === 'LONG') {
    longBtn.classList.add('active', 'long');
    shortBtn.classList.remove('active', 'short');
  } else {
    shortBtn.classList.add('active', 'short');
    longBtn.classList.remove('active', 'long');
  }
  calculate();
}

function renderResultStructure() {
  const container = document.getElementById('resultsContainer');
  
  if (currentMode === 'LOT') {
    container.innerHTML = `
      <div class="result-row">
        <span class="result-label">Exact Lot to Set:</span>
        <div style="text-align: right;">
          <span class="result-val" id="lotSizeText">-</span>
          <span class="sub-warning" id="minLotWarning"></span>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="result-row">
        <span class="result-label">Exact Leverage to Set:</span>
        <span class="result-val" id="leverageText">-</span>
      </div>
    `;
  }
}

function resetResults() {
  if (currentMode === 'LOT') {
    const lotEl = document.getElementById('lotSizeText');
    const warningEl = document.getElementById('minLotWarning');
    if (warningEl) warningEl.innerText = "";
    if (lotEl) {
      lotEl.innerText = "-";
      lotEl.className = "result-val";
    }
  } else {
    const levEl = document.getElementById('leverageText');
    if (levEl) {
      levEl.innerText = "-";
      levEl.className = "result-val";
    }
  }
}

function clearInputErrors() {
  inputs.forEach(id => {
    document.getElementById(id).classList.remove('input-error');
  });
}

const getCleanFloat = (id) => {
  let val = document.getElementById(id).value.replace(/,/g, '');
  return val === '' ? NaN : parseFloat(val);
};

function calculate() {
  clearInputErrors();
  
  const accountSize = getCleanFloat('accountSize');
  const riskAmount = getCleanFloat('riskAmount');
  const rrRatio = getCleanFloat('rrRatio');
  const entryPrice = getCleanFloat('entryPrice');
  const stopLoss = getCleanFloat('stopLoss');
  
  let dynamicErrorFound = false;
  
  inputs.forEach(id => {
    const val = getCleanFloat(id);
    if (val === 0) {
      document.getElementById(id).classList.add('input-error');
      dynamicErrorFound = true;
    }
  });
  
  if (!isNaN(accountSize) && !isNaN(riskAmount) && accountSize > 0 && riskAmount > 0) {
    if (riskAmount > accountSize) {
      document.getElementById('riskAmount').classList.add('input-error');
      dynamicErrorFound = true;
    }
  }
  
  if (!isNaN(entryPrice) && !isNaN(stopLoss) && entryPrice > 0 && stopLoss > 0) {
    if ((currentDirection === 'LONG' && stopLoss >= entryPrice) || (currentDirection === 'SHORT' && stopLoss <= entryPrice)) {
      document.getElementById('entryPrice').classList.add('input-error');
      document.getElementById('stopLoss').classList.add('input-error');
      dynamicErrorFound = true;
    }
  }
  
  if (dynamicErrorFound) {
    resetResults();
    if (currentMode === 'LOT') {
      const lotEl = document.getElementById('lotSizeText');
      if (lotEl) {
        lotEl.innerText = "INVALID";
        lotEl.className = "result-val warning-red";
      }
    } else {
      const levEl = document.getElementById('leverageText');
      if (levEl) {
        levEl.innerText = "INVALID";
        levEl.className = "result-val warning-red";
      }
    }
    return;
  }
  
  if (isNaN(accountSize) || isNaN(riskAmount) || isNaN(rrRatio) || isNaN(entryPrice) || isNaN(stopLoss) ||
    accountSize <= 0 || riskAmount <= 0 || rrRatio <= 0 || entryPrice <= 0 || stopLoss <= 0) {
    resetResults();
    return;
  }
  
  const priceDistance = Math.abs(entryPrice - stopLoss);
  
  if (currentMode === 'LOT') {
    let calculatedLot = riskAmount / priceDistance;
    const lotEl = document.getElementById('lotSizeText');
    const warningEl = document.getElementById('minLotWarning');
    
    if (calculatedLot < MIN_LOT_SIZE) {
      const actualRiskWithMinLot = MIN_LOT_SIZE * priceDistance;
      lotEl.innerText = `${MIN_LOT_SIZE}`;
      lotEl.className = "result-val warning-red";
      warningEl.innerText = `Below Min! Actual Risk: $${actualRiskWithMinLot.toFixed(2)}`;
    } else {
      lotEl.innerText = calculatedLot.toFixed(3);
      lotEl.className = "result-val highlight-green";
      warningEl.innerText = "";
    }
  } else {
    const pctDistance = priceDistance / entryPrice;
    const positionSize = riskAmount / pctDistance;
    const requiredLeverage = positionSize / accountSize;
    
    const levEl = document.getElementById('leverageText');
    levEl.innerText = `${requiredLeverage.toFixed(1)}x`;
    levEl.className = "result-val highlight-green";
  }
}
