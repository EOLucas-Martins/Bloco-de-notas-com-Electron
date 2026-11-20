// Elementos da interface usados para exibir e editar as anotações.
const notesList = document.getElementById('notes-list');
const noteCount = document.getElementById('note-count');
const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const noteMeta = document.getElementById('note-meta');
const editor = document.getElementById('editor');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptyDescription = document.getElementById('empty-description');
const emptyAction = document.getElementById('empty-action');
const deleteButton = document.getElementById('delete-note');
const saveStatus = document.getElementById('save-status');
const statusMessage = saveStatus.querySelector('span:last-child');

let notes = []; // Lista de todas as anotações em memória.
let selectedId = null; // ID da anotação atualmente aberta.
let saveTimer; // Temporizador usado para agrupar os salvamentos.
let saveVersion = 0; // Versão usada para evitar respostas antigas sobrescreverem o status atual.

function makeId() {
  // Gera um identificador único para cada nova anotação.
  return globalThis.crypto.randomUUID();
}

function formatDate(value) {
  // Converte a data armazenada para um formato legível em português.
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function selectedNote() {
  // Retorna a anotação correspondente ao ID selecionado.
  return notes.find((note) => note.id === selectedId);
}

function renderList() {
  // Atualiza a lista mostrando as anotações mais recentes primeiro.
  const sortedNotes = [...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  noteCount.textContent = String(notes.length);
  notesList.replaceChildren();

  for (const note of sortedNotes) {
    // Cria um botão na lista para cada anotação.
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `item-anotacao${note.id === selectedId ? ' selecionado' : ''}`;
    button.setAttribute('aria-current', note.id === selectedId ? 'true' : 'false');
    button.addEventListener('click', () => selectNote(note.id));

    const title = document.createElement('div');
    title.className = 'titulo-item-anotacao';
    title.textContent = note.title.trim() || 'Sem título';
    const preview = document.createElement('div');
    preview.className = 'resumo-item-anotacao';
    preview.textContent = note.content.trim() || 'Anotação vazia';
    const date = document.createElement('div');
    date.className = 'data-item-anotacao';
    date.textContent = formatDate(note.updatedAt);
    button.append(title, preview, date);
    notesList.append(button);
  }
}

function renderEditor() {
  // Decide se deve mostrar o editor ou o estado vazio.
  const note = selectedNote();
  const hasNotes = notes.length > 0;
  editor.hidden = !note;
  emptyState.hidden = Boolean(note);
  deleteButton.disabled = !note;

  if (note) {
    if (titleInput.value !== note.title) titleInput.value = note.title;
    if (contentInput.value !== note.content) contentInput.value = note.content;
    noteMeta.textContent = `Última edição em ${formatDate(note.updatedAt)}`;
    return;
  }

  emptyTitle.textContent = hasNotes ? 'Escolha uma anotação para editar.' : 'Tudo começa com uma anotação.';
  emptyDescription.textContent = hasNotes
    ? 'Selecione uma nota na lista ou crie uma nova.'
    : 'Registre uma ideia, um plano ou qualquer coisa que queira lembrar.';
  emptyAction.hidden = false;
}

function render() {
  renderList();
  renderEditor();
}

function selectNote(id) {
  // Troca a anotação selecionada e atualiza a interface.
  selectedId = id;
  render();
}

function setStatus(state, message) {
  saveStatus.classList.toggle('salvando', state === 'saving');
  saveStatus.classList.toggle('erro', state === 'error');
  statusMessage.textContent = message;
}

async function persistNotes(version) {
  // Envia as anotações para o armazenamento e atualiza o status do salvamento.
  try {
    await window.notesStore.save(notes);
    if (version === saveVersion) {
      setStatus('saved', 'Salvo automaticamente');
    }
  } catch (error) {
    console.error('Não foi possível salvar as anotações:', error);
    if (version === saveVersion) {
      setStatus('error', 'Erro ao salvar. Tente novamente.');
    }
  }
}

function scheduleSave() {
  // Aguarda uma pausa na edição antes de salvar, evitando várias gravações seguidas.
  clearTimeout(saveTimer);
  const version = ++saveVersion;
  setStatus('saving', 'Salvando...');
  saveTimer = setTimeout(() => persistNotes(version), 350);
}

function updateSelectedNote() {
  // Atualiza os dados da anotação aberta conforme o usuário digita.
  const note = selectedNote();
  if (!note) return;
  note.title = titleInput.value;
  note.content = contentInput.value;
  note.updatedAt = new Date().toISOString();
  noteMeta.textContent = `Última edição em ${formatDate(note.updatedAt)}`;
  renderList();
  scheduleSave();
}

function createNote() {
  // Cria uma nova anotação vazia e a seleciona imediatamente.
  const now = new Date().toISOString();
  const note = { id: makeId(), title: '', content: '', updatedAt: now };
  notes.unshift(note);
  selectedId = note.id;
  render();
  titleInput.focus();
  scheduleSave();
}

function deleteSelectedNote() {
  // Remove a anotação atual e seleciona a anotação mais próxima restante.
  if (!selectedNote()) return;
  const currentIndex = notes.findIndex((note) => note.id === selectedId);
  notes = notes.filter((note) => note.id !== selectedId);
  const nextNote = notes[Math.min(currentIndex, notes.length - 1)];
  selectedId = nextNote ? nextNote.id : null;
  render();
  scheduleSave();
}

titleInput.addEventListener('input', updateSelectedNote);
contentInput.addEventListener('input', updateSelectedNote);
document.getElementById('new-note').addEventListener('click', createNote);
emptyAction.addEventListener('click', createNote);
deleteButton.addEventListener('click', deleteSelectedNote);

document.addEventListener('keydown', (event) => {
  // Permite criar uma anotação com Ctrl+N ou Cmd+N.
  const modifier = event.ctrlKey || event.metaKey;
  if (!modifier) return;

  if (event.key.toLowerCase() === 'n') {
    event.preventDefault();
    createNote();
  }
});

async function initialize() {
  // Carrega as anotações salvas assim que o aplicativo é iniciado.
  try {
    const loadedNotes = await window.notesStore.load();
    notes = Array.isArray(loadedNotes) ? loadedNotes.filter((note) =>
      note &&
      typeof note.id === 'string' &&
      typeof note.title === 'string' &&
      typeof note.content === 'string' &&
      typeof note.updatedAt === 'string'
    ) : [];
    render();
    setStatus('saved', 'Suas notas são salvas automaticamente');
  } catch (error) {
    console.error('Não foi possível carregar as anotações:', error);
    render();
    setStatus('error', 'Erro ao carregar as anotações.');
  }
}

initialize();
