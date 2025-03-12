import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset', // For macOS style
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize default templates
function initializeDefaultTemplates() {
  try {
    const userDataPath = app.getPath('userData');
    const templatesDir = path.join(userDataPath, 'templates');
    
    // Create templates directory if it doesn't exist
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    const templatesFile = path.join(templatesDir, 'templates.json');
    
    // Default templates
    const defaultTemplates = [
      {
        title: '通用助手',
        content: '你是一个有用的AI助手，请回答我的问题：{{question}}',
        link: 'https://www.google.com'
      },
      // {
      //   title: '代码助手',
      //   content: '你是一个编程专家，请帮我解决以下代码问题：\n\n语言：{{language}}\n\n问题：{{problem}}',
      //   link: 'https://www.google.com'
      // },
      // {
      //   title: '翻译助手',
      //   content: '请将以下{{sourceLanguage}}文本翻译成{{targetLanguage}}：\n\n{{text}}',
      //   link: 'https://www.google.com'
      // }
    ];

    // Add unique id for each template
    defaultTemplates.forEach((template: any) => {
      template.id = crypto.randomUUID();
    });
    
    // Write default templates to file
    fs.writeFileSync(templatesFile, JSON.stringify(defaultTemplates, null, 2));
    
    console.log('Default templates initialized');
  } catch (error) {
    console.error('Error initializing default templates:', error);
  }
}

// Create window when Electron is ready
app.whenReady().then(() => {
  // initializeDefaultTemplates(); // for debug

  createWindow();

  app.on('activate', () => {
    // On macOS, recreate window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  
});

app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') || url.startsWith('https')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC messages for template operations
ipcMain.handle('save-template', async (event, template) => {
  try {
    const userDataPath = app.getPath('userData');
    const templatesDir = path.join(userDataPath, 'templates');
    
    // Create templates directory if it doesn't exist
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    const templatesFile = path.join(templatesDir, 'templates.json');
    let templates = [];
    
    // Read existing templates if file exists
    if (fs.existsSync(templatesFile)) {
      const data = fs.readFileSync(templatesFile, 'utf8');
      templates = JSON.parse(data);
    }
    
    // Check if template already exists (for update)
    const index = templates.findIndex((t: any) => t.id === template.id);
    if (index !== -1) {
      templates[index] = template;
    } else {
      // Add new template with unique ID
      template.id = crypto.randomUUID();
      templates.push(template);
    }
    
    // Save templates to file
    fs.writeFileSync(templatesFile, JSON.stringify(templates, null, 2));
    
    return { success: true, template };
  } catch (error) {
    console.error('Error saving template:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-templates', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const templatesFile = path.join(userDataPath, 'templates', 'templates.json');
    
    if (fs.existsSync(templatesFile)) {
      const data = fs.readFileSync(templatesFile, 'utf8');
      return { success: true, templates: JSON.parse(data) };
    }
    
    return { success: true, templates: [] };
  } catch (error) {
    console.error('Error getting templates:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('delete-template', async (event, templateId) => {
  try {
    const userDataPath = app.getPath('userData');
    const templatesFile = path.join(userDataPath, 'templates', 'templates.json');
    
    if (fs.existsSync(templatesFile)) {
      const data = fs.readFileSync(templatesFile, 'utf8');
      let templates = JSON.parse(data);
      
      // Filter out the template to delete
      templates = templates.filter((t: any) => t.id !== templateId);
      
      // Save updated templates to file
      fs.writeFileSync(templatesFile, JSON.stringify(templates, null, 2));
      
      return { success: true };
    }
    
    return { success: false, error: 'Templates file not found' };
  } catch (error) {
    console.error('Error deleting template:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Import/Export functionality
ipcMain.handle('export-templates', async () => {
  try {
    if (!mainWindow) return { success: false, error: 'Main window not available' };
    
    const userDataPath = app.getPath('userData');
    const templatesFile = path.join(userDataPath, 'templates', 'templates.json');
    
    if (!fs.existsSync(templatesFile)) {
      return { success: false, error: 'No templates to export' };
    }
    
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Templates',
      defaultPath: 'ai-prompt-templates.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });
    
    if (!filePath) return { success: false, error: 'Export cancelled' };
    
    const data = fs.readFileSync(templatesFile, 'utf8');
    fs.writeFileSync(filePath, data);
    
    const templatesData = JSON.parse(data);
    return { success: true, count: templatesData.length, path: filePath };
  } catch (error) {
    console.error('Error exporting templates:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('import-templates', async () => {
  try {
    if (!mainWindow) return { success: false, error: 'Main window not available' };
    
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Templates',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile'],
    });
    
    if (!filePaths || filePaths.length === 0) {
      return { success: false, error: 'Import cancelled' };
    }
    
    const importedData = fs.readFileSync(filePaths[0], 'utf8');
    const importedTemplates = JSON.parse(importedData);
    // Add unique id for imported templates that don't have one
    importedTemplates.forEach((template: any) => {
      if (!template.id) {
        template.id = crypto.randomUUID();
      }
    });
    
    const userDataPath = app.getPath('userData');
    const templatesDir = path.join(userDataPath, 'templates');
    
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    const templatesFile = path.join(templatesDir, 'templates.json');
    let existingTemplates: any[] = [];
    
    if (fs.existsSync(templatesFile)) {
      const data = fs.readFileSync(templatesFile, 'utf8');
      existingTemplates = JSON.parse(data);
    }
    
    // Merge templates, avoiding duplicates by ID
    const mergedTemplates = [...existingTemplates];
    for (const template of importedTemplates) {
      const index = mergedTemplates.findIndex((t: any) => t.id === template.id);
      if (index !== -1) {
        mergedTemplates[index] = template;
      } else {
        mergedTemplates.push(template);
      }
    }
    
    fs.writeFileSync(templatesFile, JSON.stringify(mergedTemplates, null, 2));
    
    return { success: true, templates: mergedTemplates };
  } catch (error) {
    console.error('Error importing templates:', error);
    return { success: false, error: (error as Error).message };
  }
}); 