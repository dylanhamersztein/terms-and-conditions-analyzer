// ============================================
// CONFIGURATION
// ============================================
const API_KEY_STORAGE_KEY = 'openai_api_key';
const MODEL_STORAGE_KEY = 'selected_model';
const DEFAULT_MODEL = 'gpt-3.5-turbo';

// Cross-browser API compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// ============================================
// MODEL INFORMATION
// ============================================
const MODEL_INFO = {
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    maxTokens: 16385,
    contextWindow: 16385,
    description: 'Fast and affordable model, suitable for most T&C analysis tasks. Best for quick responses.',
    recommended: true
  },
  'gpt-4': {
    name: 'GPT-4',
    maxTokens: 8192,
    contextWindow: 8192,
    description: 'Most capable model with superior reasoning. Better for complex T&C with nuanced legal language.',
    recommended: false
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    maxTokens: 128000,
    contextWindow: 128000,
    description: 'Balanced option with large context window. Ideal for analyzing very long T&C documents.',
    recommended: true
  },
  'gpt-4o': {
    name: 'GPT-4o',
    maxTokens: 128000,
    contextWindow: 128000,
    description: 'Newest flagship model with improved performance. Excellent for comprehensive analysis.',
    recommended: true
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    maxTokens: 128000,
    contextWindow: 128000,
    description: 'Efficient and cost-effective. Good balance between speed and capability.',
    recommended: false
  }
};

// ============================================
// DOM ELEMENTS
// ============================================
const backBtn = document.getElementById('back-btn');
const apiKeyInput = document.getElementById('settings-api-key-input');
const showKeyBtn = document.getElementById('settings-show-key-btn');
const updateKeyBtn = document.getElementById('update-key-btn');
const removeKeyBtn = document.getElementById('remove-key-btn');
const modelSelect = document.getElementById('model-select');
const modelInfo = document.getElementById('model-info');

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Get API key from storage
 */
async function getApiKey() {
  try {
    const result = await browserAPI.storage.local.get(API_KEY_STORAGE_KEY);
    return result[API_KEY_STORAGE_KEY] || null;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return null;
  }
}

/**
 * Save API key to storage
 */
async function saveApiKey(apiKey) {
  try {
    await browserAPI.storage.local.set({ [API_KEY_STORAGE_KEY]: apiKey });
    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
}

/**
 * Remove API key from storage
 */
async function removeApiKey() {
  try {
    await browserAPI.storage.local.remove(API_KEY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error removing API key:', error);
    return false;
  }
}

/**
 * Get selected model from storage
 */
async function getSelectedModel() {
  try {
    const result = await browserAPI.storage.local.get(MODEL_STORAGE_KEY);
    return result[MODEL_STORAGE_KEY] || DEFAULT_MODEL;
  } catch (error) {
    console.error('Error retrieving model:', error);
    return DEFAULT_MODEL;
  }
}

/**
 * Save selected model to storage
 */
async function saveSelectedModel(model) {
  try {
    await browserAPI.storage.local.set({ [MODEL_STORAGE_KEY]: model });
    return true;
  } catch (error) {
    console.error('Error saving model:', error);
    return false;
  }
}

// ============================================
// UI FUNCTIONS
// ============================================

/**
 * Display model information
 */
function displayModelInfo(modelId) {
  const info = MODEL_INFO[modelId];
  if (!info) return;
  
  const html = `
    <h4>${info.name}</h4>
    <p><strong>Context Window:</strong> ${info.contextWindow.toLocaleString()} tokens</p>
    <p><strong>Max Output:</strong> ${info.maxTokens.toLocaleString()} tokens</p>
    <p>${info.description}</p>
  `;
  
  modelInfo.innerHTML = html;
  modelInfo.style.display = 'block';
}

/**
 * Load current settings
 */
async function loadSettings() {
  // Load API key (masked)
  const apiKey = await getApiKey();
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }
  
  // Load selected model
  const selectedModel = await getSelectedModel();
  modelSelect.value = selectedModel;
  displayModelInfo(selectedModel);
}

// ============================================
// EVENT LISTENERS
// ============================================

// Back button
backBtn.addEventListener('click', () => {
  window.location.href = 'popup.html';
});

// Show/hide API key
showKeyBtn.addEventListener('click', () => {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    showKeyBtn.textContent = '🙈';
  } else {
    apiKeyInput.type = 'password';
    showKeyBtn.textContent = '👁️';
  }
});

// Update API key
updateKeyBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    alert('Please enter an API key.');
    return;
  }
  
  if (!apiKey.startsWith('sk-')) {
    alert('Invalid API key format. OpenAI API keys start with "sk-".');
    return;
  }
  
  updateKeyBtn.disabled = true;
  updateKeyBtn.textContent = 'Updating...';
  
  const success = await saveApiKey(apiKey);
  if (success) {
    alert('API key updated successfully!');
  } else {
    alert('Failed to update API key. Please try again.');
  }
  
  updateKeyBtn.disabled = false;
  updateKeyBtn.textContent = 'Update API Key';
});

// Remove API key
removeKeyBtn.addEventListener('click', async () => {
  const confirm = window.confirm('Are you sure you want to remove your API key? You will need to enter it again to use the extension.');
  
  if (!confirm) return;
  
  removeKeyBtn.disabled = true;
  removeKeyBtn.textContent = 'Removing...';
  
  const success = await removeApiKey();
  if (success) {
    apiKeyInput.value = '';
    alert('API key removed successfully!');
  } else {
    alert('Failed to remove API key. Please try again.');
  }
  
  removeKeyBtn.disabled = false;
  removeKeyBtn.textContent = 'Remove API Key';
});

// Model selection change
modelSelect.addEventListener('change', async (e) => {
  const selectedModel = e.target.value;
  displayModelInfo(selectedModel);
  
  const success = await saveSelectedModel(selectedModel);
  if (success) {
    console.log('Model saved:', selectedModel);
  }
});

// ============================================
// INITIALIZATION
// ============================================
loadSettings();
