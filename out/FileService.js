"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Service for reading and parsing project files
 */
class FileService {
    workspaceRoot;
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Read and parse package.json file
     * @returns Promise<PackageJsonData | null>
     */
    async readPackageJson() {
        try {
            const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                console.log('package.json not found');
                return null;
            }
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            const packageData = JSON.parse(content);
            return {
                name: packageData.name || '',
                version: packageData.version || '',
                description: packageData.description || '',
                dependencies: packageData.dependencies || {},
                devDependencies: packageData.devDependencies || {},
                scripts: packageData.scripts || {},
                keywords: packageData.keywords || [],
                author: packageData.author || '',
                license: packageData.license || '',
                repository: packageData.repository || null
            };
        }
        catch (error) {
            console.error('Error reading package.json:', error);
            return null;
        }
    }
    /**
     * Read and parse README.md file
     * @returns Promise<ReadmeData | null>
     */
    async readReadme() {
        try {
            // Try different README file variations
            const readmeVariations = [
                'README.md',
                'readme.md',
                'README.MD',
                'README.txt',
                'readme.txt',
                'README'
            ];
            let readmePath = null;
            let content = '';
            for (const variation of readmeVariations) {
                const filePath = path.join(this.workspaceRoot, variation);
                if (fs.existsSync(filePath)) {
                    readmePath = filePath;
                    content = fs.readFileSync(filePath, 'utf8');
                    break;
                }
            }
            if (!readmePath) {
                console.log('README file not found');
                return null;
            }
            // Parse README content
            const lines = content.split('\n');
            const title = this.extractTitle(lines);
            const description = this.extractDescription(lines);
            const sections = this.extractSections(lines);
            const technologies = this.extractTechnologies(content);
            const features = this.extractFeatures(lines);
            return {
                content,
                title,
                description,
                sections,
                technologies,
                features
            };
        }
        catch (error) {
            console.error('Error reading README:', error);
            return null;
        }
    }
    /**
     * Read and parse .resume-endorsements.json file
     * @returns Promise<Record<string, string[]>>
     */
    async readEndorsements() {
        try {
            const endorsementsPath = path.join(this.workspaceRoot, '.resume-endorsements.json');
            if (!fs.existsSync(endorsementsPath)) {
                return {};
            }
            const content = fs.readFileSync(endorsementsPath, 'utf8');
            return JSON.parse(content);
        }
        catch (error) {
            console.error('Error reading .resume-endorsements.json:', error);
            return {};
        }
    }
    /**
     * Get comprehensive project file data
     * @returns Promise<ProjectFileData>
     */
    async getProjectFileData() {
        const packageJson = await this.readPackageJson();
        const readme = await this.readReadme();
        const projectName = packageJson?.name ||
            readme?.title ||
            path.basename(this.workspaceRoot);
        return {
            packageJson,
            readme,
            projectName,
            projectPath: this.workspaceRoot
        };
    }
    /**
     * Extract title from README content
     * @param lines Array of README lines
     * @returns string
     */
    extractTitle(lines) {
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) {
                return trimmed.substring(2).trim();
            }
        }
        return '';
    }
    /**
     * Extract description from README content
     * @param lines Array of README lines
     * @returns string
     */
    extractDescription(lines) {
        let foundTitle = false;
        let description = '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) {
                foundTitle = true;
                continue;
            }
            if (foundTitle && trimmed.length > 0 && !trimmed.startsWith('#')) {
                description += trimmed + ' ';
                if (description.length > 200)
                    break; // Limit description length
            }
            if (foundTitle && trimmed.startsWith('## ')) {
                break; // Stop at next section
            }
        }
        return description.trim();
    }
    /**
     * Extract section headers from README
     * @param lines Array of README lines
     * @returns string[]
     */
    extractSections(lines) {
        const sections = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('## ')) {
                sections.push(trimmed.substring(3).trim());
            }
        }
        return sections;
    }
    /**
     * Extract technologies mentioned in README
     * @param content README content
     * @returns string[]
     */
    extractTechnologies(content) {
        const techKeywords = [
            'React', 'Vue', 'Angular', 'Node.js', 'Express', 'TypeScript', 'JavaScript',
            'Python', 'Django', 'Flask', 'Java', 'Spring', 'C#', '.NET', 'PHP', 'Laravel',
            'Ruby', 'Rails', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala', 'C++', 'C',
            'HTML', 'CSS', 'SCSS', 'Sass', 'Bootstrap', 'Tailwind', 'Material-UI',
            'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Elasticsearch',
            'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Heroku', 'Vercel', 'Netlify',
            'Git', 'GitHub', 'GitLab', 'Jenkins', 'Travis CI', 'CircleCI',
            'Webpack', 'Vite', 'Rollup', 'Babel', 'ESLint', 'Prettier',
            'Jest', 'Mocha', 'Cypress', 'Selenium', 'Puppeteer',
            'GraphQL', 'REST API', 'WebSocket', 'gRPC',
            'Machine Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn',
            'Blockchain', 'Ethereum', 'Solidity', 'Web3'
        ];
        const foundTechnologies = [];
        const contentLower = content.toLowerCase();
        for (const tech of techKeywords) {
            if (contentLower.includes(tech.toLowerCase())) {
                foundTechnologies.push(tech);
            }
        }
        return [...new Set(foundTechnologies)]; // Remove duplicates
    }
    /**
     * Extract features from README
     * @param lines Array of README lines
     * @returns string[]
     */
    extractFeatures(lines) {
        const features = [];
        let inFeaturesSection = false;
        for (const line of lines) {
            const trimmed = line.trim();
            // Check if we're entering a features section
            if (trimmed.toLowerCase().includes('feature') && trimmed.startsWith('##')) {
                inFeaturesSection = true;
                continue;
            }
            // Check if we're leaving the features section
            if (inFeaturesSection && trimmed.startsWith('##')) {
                break;
            }
            // Extract bullet points in features section
            if (inFeaturesSection && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
                const feature = trimmed.substring(2).trim();
                if (feature.length > 0) {
                    features.push(feature);
                }
            }
        }
        return features;
    }
    /**
     * Check if a file exists in the workspace
     * @param fileName Name of the file to check
     * @returns boolean
     */
    fileExists(fileName) {
        const filePath = path.join(this.workspaceRoot, fileName);
        return fs.existsSync(filePath);
    }
    /**
     * Get list of all files in the workspace (excluding node_modules, .git, etc.)
     * @returns string[]
     */
    getProjectFiles() {
        try {
            const excludePatterns = [
                'node_modules',
                '.git',
                '.vscode',
                'dist',
                'build',
                'out',
                '.next',
                'coverage',
                '.nyc_output'
            ];
            const files = [];
            const scanDirectory = (dir, relativePath = '') => {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const relativeItemPath = path.join(relativePath, item);
                    if (excludePatterns.some(pattern => relativeItemPath.includes(pattern))) {
                        continue;
                    }
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        scanDirectory(fullPath, relativeItemPath);
                    }
                    else {
                        files.push(relativeItemPath);
                    }
                }
            };
            scanDirectory(this.workspaceRoot);
            return files;
        }
        catch (error) {
            console.error('Error scanning project files:', error);
            return [];
        }
    }
}
exports.FileService = FileService;
//# sourceMappingURL=FileService.js.map