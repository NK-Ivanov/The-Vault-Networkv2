// Helper script to extract HTML content from mockup file
// This extracts the body HTML and styles to create a module content structure

const fs = require('fs');
const path = require('path');

const mockupPath = path.join(__dirname, 'mockup 9 (1).html');
const htmlContent = fs.readFileSync(mockupPath, 'utf8');

// Extract style content (lines 7-292)
const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
const styles = styleMatch ? styleMatch[1] : '';

// Extract body content (lines 294-1024)
const bodyMatch = htmlContent.match(/<body>([\s\S]*?)<\/body>/);
const bodyContent = bodyMatch ? bodyMatch[1] : '';

// Create module content structure
const moduleContent = {
  type: 'html',
  styles: styles.trim(),
  html: bodyContent.trim(),
  module_id: 'foundations-of-business-automation',
  module_title: 'Module 1: Foundations of Business Automation',
  module_description: 'Learn how automation saves time, reduces errors, and helps modern businesses scale without adding more staff. This module is built for complete beginners — no coding or tech background needed.'
};

// Output as JSON (this will be stored in the database)
console.log(JSON.stringify(moduleContent, null, 2));

// Write to a file for easy access
fs.writeFileSync(
  path.join(__dirname, 'module-foundations-content.json'),
  JSON.stringify(moduleContent, null, 2)
);

console.log('\n✅ Module content extracted successfully!');
console.log('📄 Saved to: module-foundations-content.json');

