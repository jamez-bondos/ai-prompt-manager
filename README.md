# AI Prompt Template Manager

A macOS desktop application for managing AI LLM prompt templates and generating prompts based on templates with variable substitution.

## Features

- Create, edit, and delete prompt templates
- Automatic variable detection in templates (using {{variableName}} syntax)
- Real-time preview of the generated prompt with variable substitution
- Search functionality for finding templates
- Dark/light theme support
- Local storage of templates
- Import/export functionality for templates

## Development

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Build the application:

```bash
npm run build
```

4. Start the application:

```bash
npm start
```

### Development Scripts

- `npm run build` - Build the application
- `npm run dev` - Build and start the application
- `npm run watch` - Watch for changes and rebuild
- `npm run package` - Package the application for distribution

## Usage

1. **Adding a Template**
   - Click the "Add Template" button in the left sidebar
   - Enter a name and content for your template
   - Use {{variableName}} syntax for variables in your template

2. **Editing a Template**
   - Select a template from the list
   - Edit the name or content
   - Click "Save" to save your changes

3. **Using a Template**
   - Select a template from the list
   - Fill in the variables in the right panel
   - The preview will update in real-time
   - Click "Copy" to copy the generated prompt to your clipboard

4. **Searching Templates**
   - Use the search box at the top of the template list
   - Search matches template names and content

## License

ISC 