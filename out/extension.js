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
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const GitService_1 = require("./GitService");
const FileService_1 = require("./FileService");
const AIService_1 = require("./AIService");
const PDFService_1 = require("./PDFService");
/**
 * Main extension activation function
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 */
function activate(context) {
    console.log('Resume Generator for Developers extension is now active!');
    // Register the main command for generating developer resume
    const generateResumeCommand = vscode.commands.registerCommand('resume-generator-for-developers.generateResume', async () => {
        await generateDeveloperResume();
    });
    // Add command to extension subscriptions
    context.subscriptions.push(generateResumeCommand);
    // Register the command for endorsing a skill
    const endorseSkillCommand = vscode.commands.registerCommand('resume-generator-for-developers.endorseSkill', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Please open a workspace or folder to endorse a skill.');
            return;
        }
        const workspaceRoot = workspaceFolder.uri.fsPath;
        const fileService = new FileService_1.FileService(workspaceRoot);
        // Prompt for skill name
        const skill = await vscode.window.showInputBox({
            prompt: 'Enter the skill to endorse (e.g., JavaScript, React)',
            placeHolder: 'Skill name'
        });
        if (!skill) {
            return;
        }
        // Prompt for endorser name
        const endorser = await vscode.window.showInputBox({
            prompt: 'Enter your name (endorser)',
            placeHolder: 'Your name'
        });
        if (!endorser) {
            return;
        }
        // Read existing endorsements
        const endorsements = await fileService.readEndorsements();
        if (!endorsements[skill]) {
            endorsements[skill] = [];
        }
        if (!endorsements[skill].includes(endorser)) {
            endorsements[skill].push(endorser);
        }
        // Write back to .resume-endorsements.json
        const fs = require('fs');
        const path = require('path');
        const endorsementsPath = path.join(workspaceRoot, '.resume-endorsements.json');
        fs.writeFileSync(endorsementsPath, JSON.stringify(endorsements, null, 2), 'utf8');
        vscode.window.showInformationMessage(`Endorsed ${skill} by ${endorser}.`);
    });
    context.subscriptions.push(endorseSkillCommand);
    // Register the command for importing from GitHub
    const importGitHubCommand = vscode.commands.registerCommand('resume-generator-for-developers.importFromGitHub', async () => {
        const username = await vscode.window.showInputBox({
            prompt: 'Enter your GitHub username',
            placeHolder: 'e.g., octocat'
        });
        if (!username) {
            return;
        }
        const profileUrl = `https://api.github.com/users/${username}`;
        const reposUrl = `https://api.github.com/users/${username}/repos?per_page=100`;
        try {
            const profileResp = await fetch(profileUrl);
            const profile = await profileResp.json();
            const reposResp = await fetch(reposUrl);
            const repos = await reposResp.json();
            // Extract languages from repos
            const languages = new Set();
            repos.forEach((repo) => {
                if (repo.language)
                    languages.add(repo.language);
            });
            const githubData = {
                name: profile.name,
                email: profile.email,
                bio: profile.bio,
                company: profile.company,
                location: profile.location,
                blog: profile.blog,
                githubUrl: profile.html_url,
                languages: Array.from(languages),
                repos: repos.map((repo) => ({
                    name: repo.name,
                    description: repo.description,
                    url: repo.html_url,
                    language: repo.language
                }))
            };
            // Store in global state for use in resume generation
            vscode.workspace.getConfiguration().update('resumeGenerator.githubData', githubData, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('GitHub profile imported! It will be used in your next resume generation.');
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to fetch GitHub profile.');
        }
    });
    context.subscriptions.push(importGitHubCommand);
    // Show welcome message
    vscode.window.showInformationMessage('Resume Generator for Developers is ready! Use "Generate Developer Resume" from the Command Palette.');
}
/**
 * Main function to generate developer resume
 */
async function generateDeveloperResume() {
    try {
        // Get current workspace
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Please open a workspace or folder to generate a resume.');
            return;
        }
        const workspaceRoot = workspaceFolder.uri.fsPath;
        // Show progress indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating Developer Resume",
            cancellable: false
        }, async (progress, token) => {
            // Step 1: Initialize services
            progress.report({ increment: 10, message: "Initializing services..." });
            const gitService = new GitService_1.GitService(workspaceRoot);
            const fileService = new FileService_1.FileService(workspaceRoot);
            const aiService = new AIService_1.AIService();
            const pdfService = new PDFService_1.PDFService(workspaceRoot);
            // Step 2: Validate Git repository
            progress.report({ increment: 10, message: "Checking Git repository..." });
            const isGitRepo = await gitService.isGitRepository();
            if (!isGitRepo) {
                vscode.window.showErrorMessage('Current workspace is not a Git repository. Please initialize Git first.');
                return;
            }
            // Step 3: Extract Git data
            progress.report({ increment: 20, message: "Analyzing Git commits..." });
            const gitData = await gitService.getRepositoryData();
            if (gitData.commits.length === 0) {
                vscode.window.showErrorMessage('No Git commits found. Please make some commits first.');
                return;
            }
            // Step 4: Read project files
            progress.report({ increment: 20, message: "Reading project files..." });
            const projectData = await fileService.getProjectFileData();
            // Extract skills from project files
            const extractedSkills = [
                ...(gitData.languages || []),
                ...(extractFrameworks(projectData) || []),
                ...(extractDatabases(projectData) || []),
                ...(projectData.readme?.technologies || []),
                ...(projectData.readme?.features || [])
            ];
            const uniqueExtractedSkills = Array.from(new Set(extractedSkills.filter(Boolean)));
            // Prompt user for additional skills
            const userSkillsInput = await vscode.window.showInputBox({
                prompt: 'Add any additional skills you want to include (comma-separated)',
                placeHolder: 'e.g., Docker, AWS, GraphQL'
            });
            const userSkills = userSkillsInput ? userSkillsInput.split(',').map(s => s.trim()).filter(Boolean) : [];
            // Merge all skills for the resume
            function mergeSkills(original) {
                return Array.from(new Set([
                    ...(original || []),
                    ...uniqueExtractedSkills,
                    ...userSkills
                ]));
            }
            // Read skill endorsements
            const endorsements = await fileService.readEndorsements();
            // Prompt for GitHub username and fetch profile data
            let githubData = undefined;
            let githubUsername = vscode.workspace.getConfiguration().get('resumeGenerator.githubUsername');
            if (!githubUsername) {
                githubUsername = await vscode.window.showInputBox({
                    prompt: 'Enter your GitHub username (optional, press Enter to skip)',
                    placeHolder: 'e.g., octocat'
                });
                if (githubUsername) {
                    await vscode.workspace.getConfiguration().update('resumeGenerator.githubUsername', githubUsername, vscode.ConfigurationTarget.Global);
                }
            }
            if (githubUsername) {
                try {
                    const profileUrl = `https://api.github.com/users/${githubUsername}`;
                    const reposUrl = `https://api.github.com/users/${githubUsername}/repos?per_page=100`;
                    const profileResp = await fetch(profileUrl);
                    const profile = await profileResp.json();
                    const reposResp = await fetch(reposUrl);
                    const repos = await reposResp.json();
                    const languages = new Set();
                    const repoDetails = [];
                    for (const repo of repos) {
                        if (repo.language)
                            languages.add(repo.language);
                        let description = repo.description;
                        if (!description) {
                            try {
                                const readmeResp = await fetch(`https://api.github.com/repos/${githubUsername}/${repo.name}/readme`);
                                if (readmeResp.ok) {
                                    const readmeData = await readmeResp.json();
                                    const content = Buffer.from(readmeData.content, 'base64').toString('utf8');
                                    description = content.split('\n').slice(0, 10).join(' ').slice(0, 200) || 'No description provided.';
                                }
                                else {
                                    description = 'No description provided.';
                                }
                            }
                            catch {
                                description = 'No description provided.';
                            }
                        }
                        repoDetails.push({
                            name: repo.name,
                            description,
                            url: repo.html_url,
                            language: repo.language
                        });
                    }
                    githubData = {
                        name: profile.name,
                        email: profile.email,
                        bio: profile.bio,
                        company: profile.company,
                        location: profile.location,
                        blog: profile.blog,
                        githubUrl: profile.html_url,
                        languages: Array.from(languages),
                        repos: repoDetails
                    };
                }
                catch (error) {
                    vscode.window.showWarningMessage('Failed to fetch GitHub profile.');
                }
            }
            // Step 5: Get user preferences
            progress.report({ increment: 10, message: "Getting user preferences..." });
            const userPreferences = await getUserPreferences();
            if (!userPreferences) {
                return; // User cancelled
            }
            // Step 6: Generate resume content using AI
            progress.report({ increment: 20, message: "Generating resume content with AI..." });
            let resumeData;
            if (aiService.isAvailable()) {
                try {
                    resumeData = await aiService.generateResumeContent(gitData, projectData, userPreferences.userInfo);
                    // Merge skills into resumeData if present
                    if (resumeData.skills) {
                        resumeData.skills.technical = mergeSkills(resumeData.skills.technical);
                    }
                    // Merge GitHub data if available
                    if (githubData) {
                        if (resumeData.personalInfo) {
                            resumeData.personalInfo.name = resumeData.personalInfo.name || githubData.name;
                            resumeData.personalInfo.email = resumeData.personalInfo.email || githubData.email;
                            resumeData.personalInfo.github = resumeData.personalInfo.github || githubData.githubUrl;
                        }
                        if (resumeData.skills) {
                            resumeData.skills.technical = mergeSkills([...resumeData.skills.technical, ...(githubData.languages || [])]);
                        }
                        if (resumeData.projects && githubData.repos) {
                            const ghProjects = githubData.repos.map((repo) => ({
                                name: repo.name,
                                description: repo.description,
                                technologies: repo.language ? [repo.language] : [],
                                highlights: [],
                                url: repo.url
                            }));
                            resumeData.projects = [...resumeData.projects, ...ghProjects];
                        }
                    }
                }
                catch (error) {
                    vscode.window.showWarningMessage(`AI generation failed: ${error}. Using fallback method.`);
                    resumeData = generateFallbackResumeData(gitData, projectData, userPreferences.userInfo);
                    resumeData.skills.technical = mergeSkills(resumeData.skills.technical);
                    if (githubData) {
                        if (resumeData.personalInfo) {
                            resumeData.personalInfo.name = resumeData.personalInfo.name || githubData.name;
                            resumeData.personalInfo.email = resumeData.personalInfo.email || githubData.email;
                            resumeData.personalInfo.github = resumeData.personalInfo.github || githubData.githubUrl;
                        }
                        if (resumeData.skills) {
                            resumeData.skills.technical = mergeSkills([...resumeData.skills.technical, ...(githubData.languages || [])]);
                        }
                        if (resumeData.projects && githubData.repos) {
                            const ghProjects = githubData.repos.map((repo) => ({
                                name: repo.name,
                                description: repo.description,
                                technologies: repo.language ? [repo.language] : [],
                                highlights: [],
                                url: repo.url
                            }));
                            resumeData.projects = [...resumeData.projects, ...ghProjects];
                        }
                    }
                }
            }
            else {
                vscode.window.showWarningMessage('AI service not available. Using fallback method.');
                resumeData = generateFallbackResumeData(gitData, projectData, userPreferences.userInfo);
                resumeData.skills.technical = mergeSkills(resumeData.skills.technical);
                if (githubData) {
                    if (resumeData.personalInfo) {
                        resumeData.personalInfo.name = resumeData.personalInfo.name || githubData.name;
                        resumeData.personalInfo.email = resumeData.personalInfo.email || githubData.email;
                        resumeData.personalInfo.github = resumeData.personalInfo.github || githubData.githubUrl;
                    }
                    if (resumeData.skills) {
                        resumeData.skills.technical = mergeSkills([...resumeData.skills.technical, ...(githubData.languages || [])]);
                    }
                    if (resumeData.projects && githubData.repos) {
                        const ghProjects = githubData.repos.map((repo) => ({
                            name: repo.name,
                            description: repo.description,
                            technologies: repo.language ? [repo.language] : [],
                            highlights: [],
                            url: repo.url
                        }));
                        resumeData.projects = [...resumeData.projects, ...ghProjects];
                    }
                }
            }
            // Step 7: Generate PDF
            progress.report({ increment: 10, message: "Generating PDF..." });
            const outputPath = path.join(workspaceRoot, 'resume.pdf');
            const pdfOptions = {
                style: userPreferences.style,
                outputPath: outputPath,
                format: 'A4',
                includeColors: true
            };
            await pdfService.generatePDF(resumeData, pdfOptions, endorsements);
            // Step 8: Show completion message
            progress.report({ increment: 10, message: "Complete!" });
            const openPDF = 'Open PDF';
            const showPreview = 'Show Preview';
            const result = await vscode.window.showInformationMessage(`Resume generated successfully! Saved to: ${outputPath}`, openPDF, showPreview);
            if (result === openPDF) {
                // Open PDF in default application
                vscode.env.openExternal(vscode.Uri.file(outputPath));
            }
            else if (result === showPreview) {
                // Show preview in VS Code webview
                await showResumePreview(resumeData, userPreferences.style);
            }
        });
    }
    catch (error) {
        console.error('Error generating resume:', error);
        vscode.window.showErrorMessage(`Failed to generate resume: ${error}`);
    }
}
/**
 * Get user preferences for resume generation
 */
async function getUserPreferences() {
    try {
        // Get resume style preference
        const styleOptions = [
            { label: 'Modern', description: 'Colorful gradient header with modern styling', value: PDFService_1.ResumeStyle.MODERN },
            { label: 'Classic', description: 'Traditional serif fonts with formal styling', value: PDFService_1.ResumeStyle.CLASSIC },
            { label: 'Minimal', description: 'Clean and simple design with minimal elements', value: PDFService_1.ResumeStyle.MINIMAL },
            { label: 'Developer', description: 'Monospace fonts with tech-focused styling', value: PDFService_1.ResumeStyle.DEVELOPER }
        ];
        const selectedStyle = await vscode.window.showQuickPick(styleOptions, {
            placeHolder: 'Select resume style'
        });
        if (!selectedStyle) {
            return null; // User cancelled
        }
        // Get user information
        const name = await vscode.window.showInputBox({
            prompt: 'Enter your full name (optional - will use Git author if empty)',
            placeHolder: 'John Doe'
        });
        const email = await vscode.window.showInputBox({
            prompt: 'Enter your email (optional - will use Git email if empty)',
            placeHolder: 'john.doe@example.com'
        });
        const title = await vscode.window.showInputBox({
            prompt: 'Enter your professional title (optional)',
            placeHolder: 'Software Developer',
            value: 'Software Developer'
        });
        return {
            style: selectedStyle.value,
            userInfo: { name, email, title }
        };
    }
    catch (error) {
        console.error('Error getting user preferences:', error);
        return null;
    }
}
/**
 * Generate fallback resume data when AI is not available
 */
function generateFallbackResumeData(gitData, projectData, userInfo) {
    // Extract personal info
    const gitAuthor = gitData.authors[0] || '';
    const nameMatch = gitAuthor.match(/^([^<]+)/);
    const gitName = nameMatch ? nameMatch[1].trim() : '';
    const emailMatch = gitAuthor.match(/<([^>]+)>/);
    const gitEmail = emailMatch ? emailMatch[1].trim() : '';
    return {
        personalInfo: {
            name: userInfo?.name || gitName || 'Developer Name',
            title: userInfo?.title || 'Software Developer',
            email: userInfo?.email || gitEmail || 'developer@example.com',
            github: projectData.packageJson?.repository?.url || ''
        },
        summary: 'Experienced software developer with expertise in modern web technologies and a passion for creating efficient, scalable solutions. Demonstrated ability to work with version control systems and collaborative development practices.',
        skills: {
            technical: gitData.languages.slice(0, 6),
            frameworks: extractFrameworks(projectData),
            tools: ['Git', 'VS Code', 'npm'],
            databases: extractDatabases(projectData)
        },
        experience: [{
                projectName: projectData.projectName,
                description: projectData.readme?.description || projectData.packageJson?.description || 'Software development project',
                achievements: [
                    `Implemented ${gitData.totalCommits} commits across ${gitData.languages.length} programming languages`,
                    'Collaborated on version control and code review processes',
                    'Developed features using modern development practices'
                ],
                technologies: gitData.languages,
                duration: `${gitData.dateRange.from} - ${gitData.dateRange.to}`
            }],
        projects: [{
                name: projectData.projectName,
                description: projectData.readme?.description || projectData.packageJson?.description || 'Software development project',
                technologies: gitData.languages,
                highlights: projectData.readme?.features || [
                    'Implemented core functionality',
                    'Applied best practices',
                    'Maintained code quality'
                ]
            }]
    };
}
/**
 * Extract frameworks from project data
 */
function extractFrameworks(projectData) {
    const frameworks = [];
    const dependencies = {
        ...projectData.packageJson?.dependencies,
        ...projectData.packageJson?.devDependencies
    };
    const frameworkMap = {
        'react': 'React',
        'vue': 'Vue.js',
        'angular': 'Angular',
        'express': 'Express.js',
        'next': 'Next.js',
        'nuxt': 'Nuxt.js',
        'svelte': 'Svelte'
    };
    for (const [dep, framework] of Object.entries(frameworkMap)) {
        if (dependencies && dependencies[dep]) {
            frameworks.push(framework);
        }
    }
    return frameworks;
}
/**
 * Extract databases from project data
 */
function extractDatabases(projectData) {
    const databases = [];
    const dependencies = {
        ...projectData.packageJson?.dependencies,
        ...projectData.packageJson?.devDependencies
    };
    const dbMap = {
        'mongodb': 'MongoDB',
        'mongoose': 'MongoDB',
        'pg': 'PostgreSQL',
        'mysql': 'MySQL',
        'sqlite3': 'SQLite',
        'redis': 'Redis'
    };
    for (const [dep, db] of Object.entries(dbMap)) {
        if (dependencies && dependencies[dep]) {
            databases.push(db);
        }
    }
    return databases;
}
/**
 * Show resume preview in VS Code webview
 */
async function showResumePreview(resumeData, style) {
    try {
        const panel = vscode.window.createWebviewPanel('resumePreview', 'Resume Preview', vscode.ViewColumn.One, {
            enableScripts: false,
            retainContextWhenHidden: true
        });
        const pdfService = new PDFService_1.PDFService('');
        const htmlContent = pdfService.generatePreviewHTML(resumeData, style);
        panel.webview.html = htmlContent;
    }
    catch (error) {
        console.error('Error showing preview:', error);
        vscode.window.showErrorMessage(`Failed to show preview: ${error}`);
    }
}
/**
 * This method is called when your extension is deactivated
 */
function deactivate() {
    console.log('Resume Generator for Developers extension deactivated.');
}
//# sourceMappingURL=extension.js.map