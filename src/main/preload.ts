import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    saveTemplate: (template: any) => ipcRenderer.invoke('save-template', template),
    getTemplates: () => ipcRenderer.invoke('get-templates'),
    deleteTemplate: (templateId: string) => ipcRenderer.invoke('delete-template', templateId),
    exportTemplates: () => ipcRenderer.invoke('export-templates'),
    importTemplates: () => ipcRenderer.invoke('import-templates'),
    sendChatMessage: (message: string, model: string) => ipcRenderer.invoke('send-chat-message', message, model),
    saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
    getSettings: () => ipcRenderer.invoke('get-settings'),
  }
); 