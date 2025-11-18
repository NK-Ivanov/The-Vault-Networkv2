// Module Configuration System
// Maps module IDs to their HTML file paths and metadata

export interface ModuleConfig {
  id: string;
  title: string;
  description: string;
  htmlFile: string;
  imageDir: string;
  order: number;
}

// Module configurations - add new modules here
export const MODULE_CONFIGS: ModuleConfig[] = [
  {
    id: 'module-1-foundations',
    title: 'Foundations of Business Automation',
    description: 'Learn how automation saves time, reduces errors, and helps modern businesses scale without adding more staff. This module is built for complete beginners — no coding or tech background needed.',
    htmlFile: '/modules/Module 1/index.html',
    imageDir: '/modules/Module 1',
    order: 1,
  },
  // Add more modules here as they're created
];

// Get module config by ID
export function getModuleConfig(moduleId: string): ModuleConfig | undefined {
  return MODULE_CONFIGS.find(m => m.id === moduleId);
}

// Get all module configs
export function getAllModuleConfigs(): ModuleConfig[] {
  return MODULE_CONFIGS.sort((a, b) => a.order - b.order);
}

// Load module HTML content
export async function loadModuleHTML(moduleId: string): Promise<string | null> {
  const config = getModuleConfig(moduleId);
  if (!config) {
    console.error(`Module config not found for ID: ${moduleId}`);
    return null;
  }

  try {
    // Load HTML from public directory
    const response = await fetch(config.htmlFile);
    if (!response.ok) {
      throw new Error(`Failed to load module HTML: ${response.statusText}`);
    }
    let html = await response.text();
    
    // Fix image paths in HTML - replace file:// paths with relative paths
    // Pattern 1: file:///C:/Users/.../Module 1/filename.png
    html = html.replace(
      /src="file:\/\/\/[^"]*\/Module 1\/([^"]+)"/gi,
      (match, filename) => {
        return `src="${config.imageDir}/${filename}"`;
      }
    );
    
    // Pattern 2: file:///C:/Users/.../filename.png (in Module 1 directory)
    html = html.replace(
      /src="file:\/\/\/[^"]*\/([^\/]+\.(png|jpg|jpeg|gif|svg))"/gi,
      (match, filename) => {
        // Only replace if it's likely an image from the module directory
        if (filename.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
          return `src="${config.imageDir}/${filename}"`;
        }
        return match;
      }
    );
    
    return html;
  } catch (error) {
    console.error(`Error loading module HTML for ${moduleId}:`, error);
    return null;
  }
}

// Extract module metadata from HTML
export function extractModuleMetadata(html: string): {
  title: string;
  description: string;
  styles: string;
  body: string;
} {
  // Extract title from <title> tag or h1
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                     html.match(/<h1[^>]*class="cover-title"[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Module';

  // Extract description from meta description or subtitle
  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                    html.match(/<p[^>]*class="cover-subtitle"[^>]*>([^<]+)<\/p>/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract styles
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const styles = styleMatch ? styleMatch[1] : '';

  // Extract body content (everything between <body> and </body>)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;

  return { title, description, styles, body };
}

