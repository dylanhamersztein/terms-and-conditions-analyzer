// This script finds Terms and Conditions links on the current page
(function() {
  // Keywords to search for (prioritize Terms over Privacy)
  const termsKeywords = [
    'terms of service',
    'terms and conditions',
    'terms & conditions',
    'terms of use',
    'user agreement',
    'terms'
  ];
  
  const otherKeywords = [
    'privacy policy',
    'legal',
    'legal information'
  ];
  
  // Function to check if a link matches any keywords
  function matchesKeywords(text, keywords) {
    const lowerText = text.toLowerCase().trim();
    return keywords.some(keyword => lowerText.includes(keyword));
  }
  
  // Get all links on the page
  const allLinks = document.querySelectorAll('a[href]');
  
  let termsLink = null;
  let otherLink = null;
  
  // Search through all links
  for (const link of allLinks) {
    const linkText = link.textContent || link.innerText || '';
    const linkTitle = link.getAttribute('title') || '';
    const linkHref = link.getAttribute('href') || '';
    const combinedText = `${linkText} ${linkTitle} ${linkHref}`;
    
    // Check for terms keywords first (higher priority)
    if (!termsLink && matchesKeywords(combinedText, termsKeywords)) {
      termsLink = link.href;
      break; // Found terms link, stop searching
    }
    
    // Check for other keywords as fallback
    if (!otherLink && matchesKeywords(combinedText, otherKeywords)) {
      otherLink = link.href;
    }
  }
  
  // Return the best match found (prioritize terms over other links)
  return termsLink || otherLink || null;
})();
