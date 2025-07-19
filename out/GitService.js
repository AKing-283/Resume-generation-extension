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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitService = void 0;
const vscode = __importStar(require("vscode"));
const simple_git_1 = __importDefault(require("simple-git"));
const path = __importStar(require("path"));
/**
 * Service for extracting Git repository data and commit information
 */
class GitService {
    git;
    workspaceRoot;
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.git = (0, simple_git_1.default)(workspaceRoot);
    }
    /**
     * Get recent commits from the repository
     * @param limit Number of commits to retrieve (default: 50)
     * @returns Promise<GitCommitData[]>
     */
    async getRecentCommits(limit = 50) {
        try {
            const log = await this.git.log({
                maxCount: limit,
                format: {
                    hash: '%H',
                    date: '%ai',
                    message: '%s',
                    author_name: '%an',
                    author_email: '%ae'
                }
            });
            const commits = [];
            for (let i = 0; i < log.all.length; i++) {
                const commit = log.all[i];
                let files = [];
                // Only get diff if not the first commit (has a parent)
                if (i < log.all.length - 1) {
                    const parentHash = log.all[i + 1].hash;
                    const diffSummary = await this.git.diffSummary([parentHash, commit.hash]);
                    files = diffSummary.files.map((file) => file.file);
                }
                // For the first commit, files can be empty or you can use another method to get added files
                commits.push({
                    hash: commit.hash,
                    date: commit.date,
                    message: commit.message,
                    author: `${commit.author_name} <${commit.author_email}>`,
                    files: files
                });
            }
            return commits;
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error reading Git commits: ${error}`);
            return [];
        }
    }
    /**
     * Get comprehensive repository data for resume generation
     * @param commitLimit Number of recent commits to analyze
     * @returns Promise<GitRepositoryData>
     */
    async getRepositoryData(commitLimit = 100) {
        try {
            const commits = await this.getRecentCommits(commitLimit);
            if (commits.length === 0) {
                throw new Error('No commits found in repository');
            }
            // Extract unique authors
            const authors = [...new Set(commits.map(commit => commit.author))];
            // Determine date range
            const dates = commits.map(commit => new Date(commit.date));
            const fromDate = new Date(Math.min(...dates.map(d => d.getTime())));
            const toDate = new Date(Math.max(...dates.map(d => d.getTime())));
            // Extract programming languages from file extensions
            const allFiles = commits.flatMap(commit => commit.files);
            const extensions = allFiles
                .map(file => path.extname(file).toLowerCase())
                .filter(ext => ext.length > 0);
            const languageMap = {
                '.js': 'JavaScript',
                '.ts': 'TypeScript',
                '.py': 'Python',
                '.java': 'Java',
                '.cpp': 'C++',
                '.c': 'C',
                '.cs': 'C#',
                '.php': 'PHP',
                '.rb': 'Ruby',
                '.go': 'Go',
                '.rs': 'Rust',
                '.swift': 'Swift',
                '.kt': 'Kotlin',
                '.scala': 'Scala',
                '.html': 'HTML',
                '.css': 'CSS',
                '.scss': 'SCSS',
                '.sass': 'Sass',
                '.less': 'Less',
                '.vue': 'Vue.js',
                '.jsx': 'React',
                '.tsx': 'React TypeScript',
                '.json': 'JSON',
                '.xml': 'XML',
                '.yaml': 'YAML',
                '.yml': 'YAML',
                '.sql': 'SQL',
                '.sh': 'Shell Script',
                '.dockerfile': 'Docker',
                '.md': 'Markdown'
            };
            const languages = [...new Set(extensions
                    .map(ext => languageMap[ext])
                    .filter(lang => lang !== undefined))];
            return {
                commits,
                totalCommits: commits.length,
                dateRange: {
                    from: fromDate.toISOString().split('T')[0],
                    to: toDate.toISOString().split('T')[0]
                },
                authors,
                languages
            };
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error analyzing repository: ${error}`);
            throw error;
        }
    }
    /**
     * Check if the current workspace is a Git repository
     * @returns Promise<boolean>
     */
    async isGitRepository() {
        try {
            await this.git.status();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get the current branch name
     * @returns Promise<string>
     */
    async getCurrentBranch() {
        try {
            const status = await this.git.status();
            return status.current || 'main';
        }
        catch (error) {
            return 'main';
        }
    }
    /**
     * Get repository remote URL (for identifying the project)
     * @returns Promise<string | null>
     */
    async getRemoteUrl() {
        try {
            const remotes = await this.git.getRemotes(true);
            const origin = remotes.find((remote) => remote.name === 'origin');
            return origin?.refs?.fetch || null;
        }
        catch (error) {
            return null;
        }
    }
}
exports.GitService = GitService;
//# sourceMappingURL=GitService.js.map