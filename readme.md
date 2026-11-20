# Bloco de notas

Aplicativo desktop para criar, editar e organizar anotações. As alterações são
salvas automaticamente no armazenamento local do aplicativo.

## Tecnologias e framework

O aplicativo usa **Electron** para criar uma aplicação desktop com tecnologias
web. Não utiliza um framework de interface adicional, como React ou Vue.

- **Electron**: cria a janela desktop e conecta a interface às APIs do sistema.
- **HTML** (`src/index.html`): estrutura da interface.
- **CSS** (`src/styles.css`): estilos e tema visual.
- **JavaScript** (`src/renderer.js`): comportamento da interface, edição e lista de notas.
- **Node.js** (`src/main.js`): processo principal do Electron; cria a janela e lê/salva as notas.
- **Preload** (`src/preload.js`): disponibiliza à interface uma API limitada para carregar e salvar notas.

### Como a aplicação funciona

O Electron executa dois contextos principais:

1. O **processo principal** (`main.js`) controla o ciclo de vida do aplicativo,
   cria a janela e acessa o sistema de arquivos.
2. O **processo de renderização** carrega o HTML, CSS e JavaScript da interface.
   Ele não acessa diretamente o Node.js.
3. O **preload** conecta esses contextos com uma API restrita (`notesStore`).
   As operações de carregar e salvar são enviadas ao processo principal por IPC
   (comunicação entre processos do Electron).
4. As anotações são armazenadas em `notes.json` na pasta de dados do usuário
   definida pelo Electron.

O isolamento de contexto está ativado, e a integração direta do Node.js na
interface está desativada.

## Requisitos

- Windows, macOS ou Linux
- Node.js 22.12 ou superior
- npm (instalado junto com o Node.js)

Confira se estão instalados:

```bash
node --version
npm --version
```

## Instalação e execução

1. Abra um terminal na pasta do projeto. No Windows, por exemplo:

   ```powershell
   cd "C:\Users\Teste\Downloads\Projeto"
   ```

2. Instale as dependências:

   ```powershell
   npm.cmd install
   ```

   No Prompt de Comando do Windows, macOS ou Linux, também é possível usar
   `npm install`.

3. Inicie o aplicativo:

   ```powershell
   npm.cmd start
   ```

   No Prompt de Comando do Windows, macOS ou Linux, use `npm start`.

O comando `start` executa `electron .`, configurado no `package.json`.

## Recursos

- Criar, editar e excluir anotações
- Salvamento automático durante a edição
- Atalho `Ctrl+N` para criar uma anotação
- No macOS, use `⌘+N` no lugar de `Ctrl+N`
