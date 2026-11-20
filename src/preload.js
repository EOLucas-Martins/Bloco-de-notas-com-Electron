// Importa os recursos do Electron usados para comunicar processos.
const { contextBridge, ipcRenderer } = require('electron');

// Expõe uma API limitada ao renderer sem permitir acesso direto ao Node.js.
contextBridge.exposeInMainWorld('notesStore', {
  // Solicita ao processo principal que carregue as anotações.
  load: () => ipcRenderer.invoke('notes:load'),
  // Solicita ao processo principal que salve as anotações.
  save: (notes) => ipcRenderer.invoke('notes:save', notes),
});







