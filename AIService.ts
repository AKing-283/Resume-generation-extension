import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GitRepositoryData } from './GitService';
import { ProjectFileData } from './FileService';

/**
 * Interface for resume data structure
 */
export interface ResumeData {
    personalInfo: {
        name: string;
        title: string;
        email: string;
        github: string;
    };
    summary: string;
    skills: {
        technical: string[];
        frameworks: string[];
        tools: string[];
        databases: string[];
    };
    experience: {
        projectName: string;
        description: string;
        achievements: string[];
        technologies: string[];
        duration: string;
    }[];
    projects: {
        name: string;
        description: string;
        technologies: string[];
        highlights: string[];
        url?: string;
    }[];
}

/**
 * Service for AI-powered resume content generation using Google Gemini
 */
export class AIService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    constructor() {
        this.initializeAI();
    }

    /**
     * Initialize Google Generative AI
     */
    private async initializeAI(): Promise<void> {
        try {
            // Get API key from VS Code settings or environment
            const config = vscode.workspace.getConfiguration('resumeGenerator');
            let apiKey = config.get<string>('geminiApiKey');

            if (!apiKey) {
                // Fallback to environment variable
                apiKey = process.env.GEMINI_API_KEY;
            }

            if (!apiKey) {
                vscode.window.showWarningMessage(
                    'Gemini API key not found. Please set it in VS Code settings or environment variables.'
                );
                return;
            }

            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            
        } catch (error) {
            console.error('Error initializing AI service:', error);
            vscode.window.showErrorMessage(`Failed to initialize AI service: ${error}`);
        }
    }

    /**
     * Generate resume content from Git and project data
     * @param gitData Git repository data
     * @param projectData Project file data
     * @param userInfo Optional user information
     * @returns Promise<ResumeData>
     */
    async generateResumeContent(
        gitData: GitRepositoryData,
        projectData: ProjectFileData,
        userInfo?: { name?: string; email?: string; title?: string }
    ): Promise<ResumeData> {
        try {
            if (!this.model) {
                throw new Error('AI service not initialized. Please check your Gemini API key.');
            }

            // Prepare context for AI
            const context = this.prepareContext(gitData, projectData);
            
            // Generate different sections
            const summary = await this.generateSummary(context);
            const skills = await this.extractSkills(context);
            const experience = await this.generateExperience(context, gitData);
            const projects = await this.generateProjects(context, projectData);

            // Extract personal info
            const personalInfo = this.extractPersonalInfo(gitData, projectData, userInfo);

            return {
                personalInfo,
                summary,
                skills,
                experience,
                projects
            };

        } catch (error) {
            console.error('Error generating resume content:', error);
            throw new Error(`Failed to generate resume content: ${error}`);
        }
    }

    /**
     * Prepare context string for AI prompts
     * @param gitData Git repository data
     * @param projectData Project file data
     * @returns string
     */
    private prepareContext(gitData: GitRepositoryData, projectData: ProjectFileData): string {
        let context = '';

        // Add project information
        if (projectData.packageJson) {
            context += `Project: ${projectData.packageJson.name}\n`;
            context += `Description: ${projectData.packageJson.description}\n`;
            context += `Dependencies: ${Object.keys(projectData.packageJson.dependencies).join(', ')}\n`;
        }

        if (projectData.readme) {
            context += `README Title: ${projectData.readme.title}\n`;
            context += `README Description: ${projectData.readme.description}\n`;
            context += `Technologies: ${projectData.readme.technologies.join(', ')}\n`;
            context += `Features: ${projectData.readme.features.join(', ')}\n`;
        }

        // Add Git information
        context += `Programming Languages: ${gitData.languages.join(', ')}\n`;
        context += `Total Commits: ${gitData.totalCommits}\n`;
        context += `Development Period: ${gitData.dateRange.from} to ${gitData.dateRange.to}\n`;

        // Add recent commit messages (sample)
        const recentCommits = gitData.commits.slice(0, 10);
        context += `Recent Commit Messages:\n`;
        recentCommits.forEach(commit => {
            context += `- ${commit.message}\n`;
        });

        return context;
    }

    /**
     * Generate professional summary
     * @param context Project context
     * @returns Promise<string>
     */
    private async generateSummary(context: string): Promise<string> {
        const prompt = `
Based on the following project information, generate a professional summary for a developer's resume. 
The summary should be 2-3 sentences, highlighting key skills and experience.

Project Information:
${context}

Generate a professional summary that:
1. Highlights the developer's technical expertise
2. Mentions key technologies and frameworks
3. Emphasizes problem-solving and development skills
4. Is concise and impactful

Return only the summary text, no additional formatting.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error('Error generating summary:', error);
            return 'Experienced software developer with expertise in modern web technologies and a passion for creating efficient, scalable solutions.';
        }
    }

    /**
     * Extract and categorize skills
     * @param context Project context
     * @returns Promise<ResumeData['skills']>
     */
    private async extractSkills(context: string): Promise<ResumeData['skills']> {
        const prompt = `
Based on the following project information, extract and categorize technical skills into:
1. Programming Languages
2. Frameworks & Libraries
3. Tools & Technologies
4. Databases & Storage

Project Information:
${context}

Return the response in JSON format:
{
  "technical": ["language1", "language2"],
  "frameworks": ["framework1", "framework2"],
  "tools": ["tool1", "tool2"],
  "databases": ["db1", "db2"]
}

Only include skills that are clearly evident from the project data.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            
            // Try to parse JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Fallback if JSON parsing fails
            return this.extractSkillsFallback(context);
            
        } catch (error) {
            console.error('Error extracting skills:', error);
            return this.extractSkillsFallback(context);
        }
    }

    /**
     * Fallback method for skill extraction
     * @param context Project context
     * @returns ResumeData['skills']
     */
    private extractSkillsFallback(context: string): ResumeData['skills'] {
        const technical: string[] = [];
        const frameworks: string[] = [];
        const tools: string[] = [];
        const databases: string[] = [];

        const contextLower = context.toLowerCase();

        // Technical skills mapping
        const skillMappings = {
            technical: ['javascript', 'typescript', 'python', 'java', 'c#', 'php', 'ruby', 'go', 'rust', 'swift'],
            frameworks: ['react', 'vue', 'angular', 'express', 'django', 'flask', 'spring', 'laravel', 'rails'],
            tools: ['git', 'docker', 'kubernetes', 'webpack', 'babel', 'eslint', 'jest', 'cypress'],
            databases: ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'sqlite']
        };

        for (const [category, skills] of Object.entries(skillMappings)) {
            for (const skill of skills) {
                if (contextLower.includes(skill)) {
                    switch (category) {
                        case 'technical':
                            technical.push(skill.charAt(0).toUpperCase() + skill.slice(1));
                            break;
                        case 'frameworks':
                            frameworks.push(skill.charAt(0).toUpperCase() + skill.slice(1));
                            break;
                        case 'tools':
                            tools.push(skill.charAt(0).toUpperCase() + skill.slice(1));
                            break;
                        case 'databases':
                            databases.push(skill.charAt(0).toUpperCase() + skill.slice(1));
                            break;
                    }
                }
            }
        }

        return { technical, frameworks, tools, databases };
    }

    /**
     * Generate experience section
     * @param context Project context
     * @param gitData Git data for duration calculation
     * @returns Promise<ResumeData['experience']>
     */
    private async generateExperience(context: string, gitData: GitRepositoryData): Promise<ResumeData['experience']> {
        const prompt = `
Based on the following project information and Git history, generate professional experience entries.
Each entry should include achievements and contributions.

Project Information:
${context}

Generate 2-3 experience entries in JSON format:
[
  {
    "projectName": "Project Name",
    "description": "Brief project description",
    "achievements": ["achievement1", "achievement2", "achievement3"],
    "technologies": ["tech1", "tech2"],
    "duration": "MM/YYYY - MM/YYYY"
  }
]

Focus on:
1. Quantifiable achievements
2. Technical contributions
3. Problem-solving examples
4. Impact and results
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return this.generateExperienceFallback(gitData);
            
        } catch (error) {
            console.error('Error generating experience:', error);
            return this.generateExperienceFallback(gitData);
        }
    }

    /**
     * Fallback method for experience generation
     * @param gitData Git repository data
     * @returns ResumeData['experience']
     */
    private generateExperienceFallback(gitData: GitRepositoryData): ResumeData['experience'] {
        return [{
            projectName: "Software Development Project",
            description: "Contributed to software development with focus on code quality and feature implementation",
            achievements: [
                `Implemented ${gitData.totalCommits} commits over ${gitData.languages.length} programming languages`,
                "Collaborated on version control and code review processes",
                "Developed features using modern development practices"
            ],
            technologies: gitData.languages,
            duration: `${gitData.dateRange.from} - ${gitData.dateRange.to}`
        }];
    }

    /**
     * Generate projects section
     * @param context Project context
     * @param projectData Project file data
     * @returns Promise<ResumeData['projects']>
     */
    private async generateProjects(context: string, projectData: ProjectFileData): Promise<ResumeData['projects']> {
        const prompt = `
Based on the following project information, generate a projects section for a resume.

Project Information:
${context}

Generate 1-2 project entries in JSON format:
[
  {
    "name": "Project Name",
    "description": "Project description",
    "technologies": ["tech1", "tech2"],
    "highlights": ["highlight1", "highlight2", "highlight3"]
  }
]

Focus on:
1. Technical implementation details
2. Key features and functionality
3. Technologies and tools used
4. Notable achievements or challenges solved
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return this.generateProjectsFallback(projectData);
            
        } catch (error) {
            console.error('Error generating projects:', error);
            return this.generateProjectsFallback(projectData);
        }
    }

    /**
     * Fallback method for projects generation
     * @param projectData Project file data
     * @returns ResumeData['projects']
     */
    private generateProjectsFallback(projectData: ProjectFileData): ResumeData['projects'] {
        return [{
            name: projectData.projectName,
            description: projectData.readme?.description || projectData.packageJson?.description || "Software development project",
            technologies: projectData.readme?.technologies || [],
            highlights: projectData.readme?.features || ["Implemented core functionality", "Applied best practices", "Maintained code quality"]
        }];
    }

    /**
     * Extract personal information
     * @param gitData Git repository data
     * @param projectData Project file data
     * @param userInfo Optional user information
     * @returns ResumeData['personalInfo']
     */
    private extractPersonalInfo(
        gitData: GitRepositoryData,
        projectData: ProjectFileData,
        userInfo?: { name?: string; email?: string; title?: string }
    ): ResumeData['personalInfo'] {
        // Extract name from Git commits (first author)
        const gitAuthor = gitData.authors[0] || '';
        const nameMatch = gitAuthor.match(/^([^<]+)/);
        const gitName = nameMatch ? nameMatch[1].trim() : '';

        // Extract email from Git commits
        const emailMatch = gitAuthor.match(/<([^>]+)>/);
        const gitEmail = emailMatch ? emailMatch[1].trim() : '';

        // Extract GitHub URL from package.json or Git remote
        let github = '';
        if (projectData.packageJson?.repository) {
            const repo = projectData.packageJson.repository;
            if (typeof repo === 'string' && repo.includes('github.com')) {
                github = repo;
            } else if (repo.url && repo.url.includes('github.com')) {
                github = repo.url;
            }
        }

        return {
            name: userInfo?.name || gitName || 'Developer Name',
            title: userInfo?.title || 'Software Developer',
            email: userInfo?.email || gitEmail || 'developer@example.com',
            github: github
        };
    }

    /**
     * Check if AI service is available
     * @returns boolean
     */
    isAvailable(): boolean {
        return this.model !== null;
    }
}

