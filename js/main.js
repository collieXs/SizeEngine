let currentDirection = 'LONG';
const inputs = ['accountSize', 'riskAmount', 'rrRatio', 'entryPrice', 'stopLoss'];

inputs.forEach(id => {
  const inputEl = document.getElementById(id);
  
  inputEl.addEventListener('input', (e) => {
    let cursorPosition = e.target.selectionStart;
    let originalLength = e.target.value.length;
    
    let cleanValue = e.target.value.replace(/,/g, '');
    
    // Instant normalization: If user inputs just a dot or a dot-first string, convert it to 0. right away
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

function resetResults() {
  const levEl = document.getElementById('leverageText');
  document.getElementById('positionSizeText').innerText = "-";
  levEl.innerText = "-";
  levEl.className = "result-val";
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
  
  const levEl = document.getElementById('leverageText');
  let dynamicErrorFound = false;
  
  // Catch explicitly typed 0 values instantly
  inputs.forEach(id => {
    const val = getCleanFloat(id);
    if (val === 0) {
      document.getElementById(id).classList.add('input-error');
      dynamicErrorFound = true;
    }
  });
  
  // Check 1: Account Size vs Risk
  if (!isNaN(accountSize) && !isNaN(riskAmount) && accountSize > 0 && riskAmount > 0) {
    if (riskAmount > accountSize) {
      document.getElementById('riskAmount').classList.add('input-error');
      dynamicErrorFound = true;
    }
  }
  
  // Check 2: Structural Stop Loss alignment
  if (!isNaN(entryPrice) && !isNaN(stopLoss) && entryPrice > 0 && stopLoss > 0) {
    if ((currentDirection === 'LONG' && stopLoss >= entryPrice) || (currentDirection === 'SHORT' && stopLoss <= entryPrice)) {
      document.getElementById('entryPrice').classList.add('input-error');
      document.getElementById('stopLoss').classList.add('input-error');
      dynamicErrorFound = true;
    }
  }
  
  if (dynamicErrorFound) {
    resetResults();
    levEl.innerText = "INVALID";
    levEl.className = "result-val warning-red";
    return;
  }
  
  if (isNaN(accountSize) || isNaN(riskAmount) || isNaN(rrRatio) || isNaN(entryPrice) || isNaN(stopLoss) ||
    accountSize <= 0 || riskAmount <= 0 || rrRatio <= 0 || entryPrice <= 0 || stopLoss <= 0) {
    resetResults();
    return;
  }
  
  const priceDistance = Math.abs(entryPrice - stopLoss);
  const pctDistance = priceDistance / entryPrice;
  
  const positionSize = riskAmount / pctDistance;
  const requiredLeverage = positionSize / accountSize;
  
  document.getElementById('positionSizeText').innerText = `$${positionSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  levEl.innerText = `${requiredLeverage.toFixed(1)}x`;
  levEl.className = "result-val highlight-green";
}