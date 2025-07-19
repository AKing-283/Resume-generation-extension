# Resume Generator for Developers

Generate professional resumes from Git commits, README files, and project data using AI.

## Features

🚀 **Automated Resume Generation**: Extract data from your Git repository and project files to create professional resumes

🤖 **AI-Powered Content**: Uses Google Gemini AI to generate compelling resume content, summaries, and achievements

📊 **Smart Analysis**: Analyzes Git commits, README.md, and package.json to identify:
- Programming languages and technologies used
- Project contributions and achievements
- Skills and frameworks
- Development timeline and experience

🎨 **Multiple Resume Styles**: Choose from 4 professional resume templates:
- **Modern**: Colorful gradient header with modern styling
- **Classic**: Traditional serif fonts with formal styling  
- **Minimal**: Clean and simple design with minimal elements
- **Developer**: Monospace fonts with tech-focused styling

📄 **PDF Output**: Generates high-quality PDF resumes using Puppeteer

🔍 **Preview Support**: View your resume in VS Code before generating the final PDF

## Requirements

- VS Code 1.102.0 or higher
- Git repository with commit history
- Node.js and npm (for dependencies)
- Optional: Google Gemini API key for AI-powered content generation

## Installation

### From VS Code Marketplace (Coming Soon)
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Resume Generator for Developers"
4. Click Install

### Manual Installation
1. Download the `.vsix` file from releases
2. Open VS Code
3. Press `Ctrl+Shift+P` to open Command Palette
4. Type "Extensions: Install from VSIX"
5. Select the downloaded `.vsix` file

## Setup

### Optional: Configure AI Integration
For enhanced resume content generation, set up Google Gemini API:

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. In VS Code, go to Settings (Ctrl+,)
3. Search for "Resume Generator"
4. Enter your API key in the "Gemini API Key" field

Alternatively, set the environment variable:
```bash
export GEMINI_API_KEY=your_api_key_here
```

## Usage

### Basic Usage
1. Open a Git repository in VS Code
2. Press `Ctrl+Shift+P` to open Command Palette
3. Type "Generate Developer Resume"
4. Follow the prompts to:
   - Select resume style
   - Enter personal information (optional)
5. Wait for the resume to be generated
6. Choose to open the PDF or preview in VS Code

### What Gets Analyzed
The extension analyzes:
- **Git Commits**: Recent commit messages, file changes, and contribution timeline
- **README.md**: Project description, features, and technologies
- **package.json**: Dependencies, scripts, and project metadata
- **File Extensions**: Programming languages and technologies used

### Generated Resume Sections
- **Professional Summary**: AI-generated summary based on your projects
- **Technical Skills**: Categorized by programming languages, frameworks, tools, and databases
- **Professional Experience**: Project-based experience with achievements
- **Notable Projects**: Highlighted projects with key features and technologies

## Configuration

### VS Code Settings
- `resumeGenerator.geminiApiKey`: Your Google Gemini API key for AI content generation

### Supported File Types
- Git repositories with commit history
- README.md, readme.md, README.txt files
- package.json (Node.js projects)
- Various programming language files for skill detection

## Troubleshooting

### Common Issues

**"Not a Git repository" error**
- Ensure your workspace is a Git repository
- Run `git init` if needed

**"No commits found" error**  
- Make sure you have committed changes to your repository
- Run `git log` to verify commit history

**AI content generation fails**
- Check your Gemini API key configuration
- The extension will use fallback content generation if AI is unavailable

**PDF generation fails**
- Ensure you have sufficient disk space
- Check that the workspace folder is writable

### Getting Help
- Check the VS Code Developer Console (Help > Toggle Developer Tools) for detailed error messages
- Ensure all dependencies are properly installed
- Verify your Git repository has recent commits

## Development

### Building from Source
```bash
# Clone the repository
git clone <repository-url>
cd resume-generator-for-developers

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension
npm run package
```

### Project Structure
```
src/
├── extension.ts          # Main extension entry point
└── services/
    ├── GitService.ts     # Git data extraction
    ├── FileService.ts    # File reading and parsing
    ├── AIService.ts      # AI content generation
    └── PDFService.ts     # PDF generation and styling
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

### 0.0.1
- Initial release
- Git commit analysis
- README and package.json parsing
- AI-powered content generation
- Multiple resume styles
- PDF generation with Puppeteer
- VS Code integration

## Support

If you find this extension helpful, please:
- ⭐ Star the repository
- 🐛 Report bugs via GitHub issues
- 💡 Suggest features via GitHub discussions
- 📝 Leave a review on the VS Code Marketplace

---

**Made with ❤️ for developers by developers**

