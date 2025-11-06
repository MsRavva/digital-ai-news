const { chromium } = require('playwright');

async function inspectCodeStyles() {
  console.log('Starting Playwright script to inspect code element styles...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the local development server
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check if we're on the login page
    const loginHeading = await page.$('text=Вход');
    if (loginHeading) {
      console.log('On login page. Please log in manually in the browser window...');
      console.log('After logging in, navigate back to this script and press Enter to continue...');
      
      // Wait for user input
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      await new Promise((resolve) => {
        process.stdin.once('data', () => {
          process.stdin.pause();
          resolve();
        });
      });
      
      // Wait a bit for the page to load after login
      await page.waitForTimeout(3000);
    }
    
    // Check if we're on the main page now
    const createPostButton = await page.$('text=Создать публикацию');
    if (createPostButton) {
      console.log('Logged in successfully.');
    } else {
      console.log('Still not logged in. Please ensure you are logged in and on the main page.');
      console.log('Press Enter to continue anyway...');
      
      // Wait for user input
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      await new Promise((resolve) => {
        process.stdin.once('data', () => {
          process.stdin.pause();
          resolve();
        });
      });
    }
    
    // Look for existing posts
    console.log('Checking for existing posts...');
    const postElements = await page.$$('.post-card');
    
    if (postElements.length === 0) {
      console.log('No posts found. Please create a test post with code elements manually.');
      console.log('After creating a post, press Enter to continue...');
      
      // Wait for user input
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      await new Promise((resolve) => {
        process.stdin.once('data', () => {
          process.stdin.pause();
          resolve();
        });
      });
      
      // Refresh the page to see the new post
      await page.reload();
      await page.waitForTimeout(2000);
    }
    
    // Check again for posts
    const updatedPostElements = await page.$$('.post-card');
    if (updatedPostElements.length > 0) {
      console.log(`Found ${updatedPostElements.length} posts. Using the first one.`);
      
      // Click on the first post
      await updatedPostElements[0].click();
      await page.waitForTimeout(2000);
    } else {
      console.log('Still no posts found. Creating a simple test page...');
      
      // Navigate to a page that might have code elements
      // Let's check if there's a create page
      const createButton = await page.$('text=Создать публикацию');
      if (createButton) {
        await createButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Inspect code elements on the page
    console.log('Inspecting code elements...');
    
    // Look for code blocks
    const codeBlocks = await page.$$('pre code');
    console.log(`Found ${codeBlocks.length} code blocks`);
    
    for (let i = 0; i < codeBlocks.length; i++) {
      const block = codeBlocks[i];
      const textContent = await block.textContent();
      console.log(`Code block ${i + 1}:`, textContent.substring(0, 100) + '...');
      
      // Get computed styles
      const styles = await page.evaluate(el => {
        const computedStyles = window.getComputedStyle(el.parentElement);
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
      }, block);
      
      console.log(`Styles for code block ${i + 1}:`, styles);
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
      
      console.log(`Styles for inline code ${i + 1}:`, styles);
    }
    
    // Check for any conflicting styles
    console.log('Checking for potential style conflicts...');
    
    // Look for elements with class names related to code
    const codeRelatedElements = await page.$$('.code-block, .language-*, pre, code');
    console.log(`Found ${codeRelatedElements.length} code-related elements`);
    
    // Check if there are multiple styles applied
    for (let i = 0; i < Math.min(3, codeRelatedElements.length); i++) {
      const element = codeRelatedElements[i];
      const tagName = await element.evaluate(el => el.tagName);
      const className = await element.getAttribute('class');
      
      console.log(`Element ${i + 1}: ${tagName} with classes: ${className}`);
      
      // Get all CSS rules applied to this element
      const cssRules = await page.evaluate(el => {
        const sheets = document.styleSheets;
        const rules = [];
        
        for (let sheet of sheets) {
          try {
            const rulesList = sheet.cssRules || sheet.rules;
            for (let rule of rulesList) {
              if (rule.selectorText && el.matches(rule.selectorText)) {
                rules.push({
                  selector: rule.selectorText,
                  cssText: rule.style.cssText
                });
              }
            }
          } catch (e) {
            // Skip cross-origin stylesheets
            continue;
          }
        }
        
        return rules;
      }, element);
      
      console.log(`CSS rules for element ${i + 1}:`, JSON.stringify(cssRules, null, 2));
    }
    
    console.log('Script completed successfully!');
    console.log('Browser will remain open for manual inspection. Close it manually when done.');
    
  } catch (error) {
    console.error('Error during script execution:', error);
  } finally {
    // Keep the browser open for inspection
    // await browser.close(); // Commented out to keep browser open
  }
}

// Run the script
inspectCodeStyles().catch(console.error);