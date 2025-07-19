import * as vscode from 'vscode';
import simpleGit, { SimpleGit, LogResult } from 'simple-git';
import * as path from 'path';

/**
 * Interface for Git commit data
 */
export interface GitCommitData {
    hash: string;
    date: string;
    message: string;
    author: string;
    files: string[];
}

/**
 * Interface for Git repository summary
 */
export interface GitRepositoryData {
    commits: GitCommitData[];
    totalCommits: number;
    dateRange: {
        from: string;
        to: string;
    };
    authors: string[];
    languages: string[];
}

/**
 * Service for extracting Git repository data and commit information
 */
export class GitService {
    private git: SimpleGit;
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.git = simpleGit(workspaceRoot);
    }

    /**
     * Get recent commits from the repository
     * @param limit Number of commits to retrieve (default: 50)
     * @returns Promise<GitCommitData[]>
     */
    async getRecentCommits(limit: number = 50): Promise<GitCommitData[]> {
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

            const commits: GitCommitData[] = [];
            
            for (let i = 0; i < log.all.length; i++) {
                const commit = log.all[i];
                let files: string[] = [];
                // Only get diff if not the first commit (has a parent)
                if (i < log.all.length - 1) {
                    const parentHash = log.all[i + 1].hash;
                    const diffSummary = await this.git.diffSummary([parentHash, commit.hash]);
                    files = diffSummary.files.map((file: { file: string }) => file.file);
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
        } catch (error) {
            vscode.window.showErrorMessage(`Error reading Git commits: ${error}`);
            return [];
        }
    }

    /**
     * Get comprehensive repository data for resume generation
     * @param commitLimit Number of recent commits to analyze
     * @returns Promise<GitRepositoryData>
     */
    async getRepositoryData(commitLimit: number = 100): Promise<GitRepositoryData> {
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
            
            const languageMap: { [key: string]: string } = {
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

            const languages = [...new Set(
                extensions
                    .map(ext => languageMap[ext])
                    .filter(lang => lang !== undefined)
            )];

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

        } catch (error) {
            vscode.window.showErrorMessage(`Error analyzing repository: ${error}`);
            throw error;
        }
    }

    /**
     * Check if the current workspace is a Git repository
     * @returns Promise<boolean>
     */
    async isGitRepository(): Promise<boolean> {
        try {
            await this.git.status();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the current branch name
     * @returns Promise<string>
     */
    async getCurrentBranch(): Promise<string> {
        try {
            const status = await this.git.status();
            return status.current || 'main';
        } catch (error) {
            return 'main';
        }
    }

    /**
     * Get repository remote URL (for identifying the project)
     * @returns Promise<string | null>
     */
    async getRemoteUrl(): Promise<string | null> {
        try {
            const remotes = await this.git.getRemotes(true);
            const origin = remotes.find((remote: { name: string }) => remote.name === 'origin');
            return origin?.refs?.fetch || null;
        } catch (error) {
            return null;
        }
    }
}

