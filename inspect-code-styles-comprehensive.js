const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function inspectCodeStyles() {
  console.log('Starting Playwright script to inspect code element styles...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: true }); // Run in headless mode for automation
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Read the CSS files from the project
    const codeBlocksCss = fs.readFileSync(path.join(__dirname, 'styles', 'code-blocks.css'), 'utf8');
    const componentsCss = fs.readFileSync(path.join(__dirname, 'styles', 'components.css'), 'utf8');
    const variablesCss = fs.readFileSync(path.join(__dirname, 'styles', 'variables.css'), 'utf8');
    
    // Create a comprehensive HTML page with code elements to test
    const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Code Elements</title>
      <style>
        /* Import variables first */
        ${variablesCss}
        
        /* Import code blocks styles */
        ${codeBlocksCss}
        
        /* Import components styles */
        ${componentsCss}
        
        /* Additional test styles */
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
      </style>
    </head>
    <body>
      <h1>Test Page for Code Element Styles</h1>
      
      <p>This is a paragraph with <code>inline code</code> in it.</p>
      
      <div class="code-block">
        <div class="language-label">javascript</div>
        <pre><code class="language-javascript">function helloWorld() {
  console.log("Hello, world!");
  return true;
}</code></pre>
      </div>
      
      <div class="code-block">
        <div class="language-label">python</div>
        <pre><code class="language-python">def hello_world():
    print("Hello, world!")
    return True</code></pre>
      </div>
      
      <div class="code-block">
        <div class="language-label">css</div>
        <pre><code class="language-css">.code-block {
  background-color: var(--code-bg);
  border: 1px solid var(--code-border);
  border-radius: 0.375rem;
}</code></pre>
      </div>
      
      <!-- Test dark theme -->
      <div class="dark">
        <h2>Dark Theme Test</h2>
        <div class="code-block">
          <div class="language-label">javascript</div>
          <pre><code class="language-javascript">function helloWorld() {
  console.log("Hello, world!");
  return true;
}</code></pre>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Set the content directly
    await page.setContent(testHtml);
    
    // Inspect code elements on the page
    console.log('Inspecting code elements...');
    
    // Look for code blocks
    const codeBlocks = await page.$$('.code-block');
    console.log(`Found ${codeBlocks.length} code blocks`);
    
    for (let i = 0; i < codeBlocks.length; i++) {
      const block = codeBlocks[i];
      const isDark = await block.evaluate(el => el.closest('.dark') !== null);
      const languageLabel = await block.$('.language-label');
      const language = languageLabel ? await languageLabel.textContent() : 'unknown';
      
      const codeElement = await block.$('code');
      if (codeElement) {
        const textContent = await codeElement.textContent();
        console.log(`Code block ${i + 1} (${language}${isDark ? ', dark theme' : ''}):`, textContent.substring(0, 50) + '...');
        
        // Get computed styles for the pre element
        const preElement = await block.$('pre');
        if (preElement) {
          const styles = await page.evaluate(el => {
            const computedStyles = window.getComputedStyle(el);
            return {
              backgroundColor: computedStyles.backgroundColor,
              color: computedStyles.color,
              fontFamily: computedStyles.fontFamily,
              fontSize: computedStyles.fontSize,
              padding: computedStyles.padding,
              border: computedStyles.border,
              borderRadius: computedStyles.borderRadius,
              overflowX: computedStyles.overflowX,
              margin: computedStyles.margin
            };
          }, preElement);
          
          console.log(`Styles for code block ${i + 1}:`, JSON.stringify(styles, null, 2));
        }
      }
    }
    
    // Look for inline code elements
    const inlineCodes = await page.$$('code:not(pre code)');
    console.log(`Found ${inlineCodes.length} inline code elements`);
    
    for (let i = 0; i < inlineCodes.length; i++) {
      const inlineCode = inlineCodes[i];
      const textContent = await inlineCode.textContent();
      console.log(`Inline code ${i + 1}:`, textContent);
      
      // Get computed styles
      const styles = await page.evaluate(el => {
        const computedStyles = window.getComputedStyle(el);
        return {
          backgroundColor: computedStyles.backgroundColor,
          color: computedStyles.color,
          fontFamily: computedStyles.fontFamily,
          fontSize: computedStyles.fontSize,
          padding: computedStyles.padding,
          border: computedStyles.border,
          borderRadius: computedStyles.borderRadius,
          display: computedStyles.display
        };
      }, inlineCode);
      
      console.log(`Styles for inline code ${i + 1}:`, JSON.stringify(styles, null, 2));
    }
    
    // Check for any conflicting styles
    console.log('Checking for potential style conflicts...');
    
    // Look for elements with class names related to code
    const codeRelatedElements = await page.$$('.code-block, pre, code');
    console.log(`Found ${codeRelatedElements.length} code-related elements`);
    
    // Check specificity of CSS rules
    for (let i = 0; i < Math.min(3, codeRelatedElements.length); i++) {
      const element = codeRelatedElements[i];
      const tagName = await element.evaluate(el => el.tagName);
      const className = await element.getAttribute('class');
      
      console.log(`Element ${i + 1}: ${tagName} with classes: ${className}`);
    }
    
    console.log('Script completed successfully!');
    
  } catch (error) {
    console.error('Error during script execution:', error);
  } finally {
    await browser.close();
  }
}

// Run the script
inspectCodeStyles().catch(console.error);