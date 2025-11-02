// ============================================
// CONFIGURATION
// ============================================
// TODO: Replace with your own OpenAI API key
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// ============================================
// DOM ELEMENTS
// ============================================
const analyzeBtn = document.getElementById('analyze-btn');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const resultsDiv = document.getElementById('results');
const summaryContent = document.getElementById('summary-content');
const analysisContent = document.getElementById('analysis-content');
const scoreContent = document.getElementById('score-content');

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Show/hide UI elements
 */
function showLoading() {
  loadingDiv.style.display = 'block';
  errorDiv.style.display = 'none';
  resultsDiv.style.display = 'none';
  analyzeBtn.disabled = true;
}

function hideLoading() {
  loadingDiv.style.display = 'none';
  analyzeBtn.disabled = false;
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  resultsDiv.style.display = 'none';
  hideLoading();
}

function showResults() {
  resultsDiv.style.display = 'block';
  errorDiv.style.display = 'none';
  hideLoading();
}

/**
 * Convert HTML to plain text
 */
function htmlToPlainText(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Get rating class for styling
 */
function getRatingClass(rating) {
  const ratingLower = rating.toLowerCase();
  if (ratingLower.includes('excellent')) return 'excellent';
  if (ratingLower.includes('good')) return 'good';
  if (ratingLower.includes('fair')) return 'fair';
  if (ratingLower.includes('very poor')) return 'very-poor';
  if (ratingLower.includes('poor')) return 'poor';
  return 'fair';
}

// ============================================
// MAIN FUNCTIONALITY
// ============================================

/**
 * Find T&C link on the current page
 */
async function findTCLink() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
    return null;
  } catch (error) {
    console.error('Error executing content script:', error);
    throw new Error('Could not access the current page. Please make sure you have permission to view this page.');
  }
}

/**
 * Fetch the T&C page content
 */
async function fetchTCContent(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch T&C page: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    return htmlToPlainText(html);
  } catch (error) {
    console.error('Error fetching T&C content:', error);
    throw new Error('Could not fetch Terms and Conditions page. It may be blocked by CORS policy.');
  }
}

/**
 * Call OpenAI API to analyze T&C
 */
async function analyzeWithAI(tcText) {
  // Validate API key
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('Please set your OpenAI API key in popup.js');
  }
  
  // Truncate text if too long (OpenAI has token limits)
  const maxLength = 12000; // Approximately 3000 tokens
  const truncatedText = tcText.length > maxLength ? tcText.substring(0, maxLength) + '...' : tcText;
  
  const prompt = `You are analyzing Terms and Conditions text. Please analyze the following Terms and Conditions and provide your response in STRICT JSON format.

The JSON response MUST have this exact structure:
{
  "summary": "A brief, easy-to-understand summary in 150 words or less",
  "analysis": [
    "Description of concerning clause 1",
    "Description of concerning clause 2"
  ],
  "score": 85,
  "rating": "Good"
}

Please analyze for these concerning clauses:
1. User data sharing with third parties
2. Automatic subscription renewals
3. User content ownership (does the company claim ownership of user content?)
4. Liability limitations (is the company limiting their liability excessively?)
5. Mandatory arbitration (are users forced into arbitration instead of court?)

Provide a Trustworthiness Score from 1-100 (where 100 is most trustworthy).
Rating must be one of: "Excellent", "Good", "Fair", "Poor", or "Very Poor"

Terms and Conditions text:
${truncatedText}`;

  try {
    const response = await fetch(OPENAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a legal analyst specializing in Terms and Conditions. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      // Sometimes the AI wraps JSON in markdown code blocks, so let's handle that
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }
      
      const parsedResult = JSON.parse(jsonContent);
      
      // Validate the response structure
      if (!parsedResult.summary || !parsedResult.analysis || 
          typeof parsedResult.score !== 'number' || !parsedResult.rating) {
        throw new Error('Invalid response structure from AI');
      }
      
      return parsedResult;
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response. The AI did not return valid JSON.');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Display the analysis results
 */
function displayResults(results) {
  // Display score
  const scoreHtml = `
    <div class="score-number">${results.score}</div>
    <div class="score-details">
      <div class="score-rating ${getRatingClass(results.rating)}">${results.rating}</div>
      <div class="score-label">out of 100</div>
    </div>
  `;
  scoreContent.innerHTML = scoreHtml;
  
  // Display summary
  summaryContent.textContent = results.summary;
  
  // Display analysis
  if (results.analysis && results.analysis.length > 0) {
    const analysisList = results.analysis.map(item => `<li>${item}</li>`).join('');
    analysisContent.innerHTML = `<ul>${analysisList}</ul>`;
  } else {
    analysisContent.innerHTML = '<p>No concerning clauses found. This appears to be a fair agreement.</p>';
  }
  
  showResults();
}

/**
 * Main analysis workflow
 */
async function analyzeTermsAndConditions() {
  try {
    showLoading();
    
    // Step 1: Find T&C link
    const tcLink = await findTCLink();
    if (!tcLink) {
      showError('Could not find Terms and Conditions link on this page. Please navigate to a page that contains a link to Terms and Conditions.');
      return;
    }
    
    console.log('Found T&C link:', tcLink);
    
    // Step 2: Fetch T&C content
    const tcContent = await fetchTCContent(tcLink);
    if (!tcContent || tcContent.trim().length < 100) {
      showError('Could not extract meaningful content from Terms and Conditions page.');
      return;
    }
    
    console.log('Fetched T&C content, length:', tcContent.length);
    
    // Step 3: Analyze with AI
    const results = await analyzeWithAI(tcContent);
    
    console.log('AI analysis results:', results);
    
    // Step 4: Display results
    displayResults(results);
    
  } catch (error) {
    console.error('Error during analysis:', error);
    showError(error.message || 'An unexpected error occurred. Please try again.');
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
analyzeBtn.addEventListener('click', analyzeTermsAndConditions);

// Initial state
hideLoading();
