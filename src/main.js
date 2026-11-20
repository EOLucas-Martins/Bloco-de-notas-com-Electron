// Importa os módulos do Electron e os recursos necessários do Node.js.
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

// Define o caminho do arquivo onde as anotações serão armazenadas.
const notesPath = () => path.join(app.getPath('userData'), 'notes.json');
// Mantém uma fila para garantir que os salvamentos sejam feitos na ordem correta.
let saveQueue = Promise.resolve();

async function readNotes() {
  try {
    // Lê o arquivo de anotações em formato JSON.
    const contents = await fs.readFile(notesPath(), 'utf8');
    const notes = JSON.parse(contents);
    return Array.isArray(notes) ? notes : [];
  } catch (error) {
    // Quando o arquivo ainda não existe, considera que não há anotações.
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

// Permite que o renderer solicite o carregamento das anotações.
ipcMain.handle('notes:load', readNotes);

// Recebe as anotações enviadas pelo renderer e valida antes de salvar.
ipcMain.handle('notes:save', (_event, notes) => {
  if (!Array.isArray(notes)) {
    throw new TypeError('O formato das anotações é inválido.');
  }

  // Remove campos inesperados e valida os dados de cada anotação.
  const safeNotes = notes.map((note) => {
    if (
      !note ||
      typeof note.id !== 'string' ||
      typeof note.title !== 'string' ||
      typeof note.content !== 'string' ||
      typeof note.updatedAt !== 'string'
    ) {
      throw new TypeError('Uma das anotações possui dados inválidos.');
    }

    return {
      id: note.id,
      title: note.title,
      content: note.content,
      updatedAt: note.updatedAt,
    };
  });

  // Adiciona a gravação à fila e usa um arquivo temporário para evitar arquivos quebrados.
  const write = saveQueue.then(async () => {
    const filePath = notesPath();
    const temporaryPath = `${filePath}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(safeNotes, null, 2), 'utf8');
    await fs.rename(temporaryPath, filePath);
    return true;
  });
  saveQueue = write.then(() => undefined, () => undefined);
  return write;
});

function createWindow() {
  // Configura o tamanho e as opções de segurança da janela principal.
  const window = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 720,
    minHeight: 520,
    backgroundColor: '#f7f7f5',
    title: 'Bloco de notas',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Carrega a interface HTML dentro da janela.
  window.loadFile(path.join(__dirname, 'index.html'));
}

// Cria a janela após o Electron terminar de inicializar.
app.whenReady().then(() => {
  createWindow();
  // No macOS, recria a janela quando o ícone do aplicativo é clicado.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});



