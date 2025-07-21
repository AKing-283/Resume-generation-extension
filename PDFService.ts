import * as vscode from 'vscode';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { ResumeData } from './AIService';

/**
 * Resume style options
 */
export enum ResumeStyle {
    MODERN = 'modern',
    CLASSIC = 'classic',
    MINIMAL = 'minimal',
    DEVELOPER = 'developer'
}

/**
 * PDF generation options
 */
export interface PDFOptions {
    style: ResumeStyle;
    outputPath: string;
    format: 'A4' | 'Letter';
    includeColors: boolean;
}

/**
 * Service for generating PDF resumes using Puppeteer and HTML/CSS
 */
export class PDFService {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Generate PDF resume from resume data
     * @param resumeData Resume data structure
     * @param options PDF generation options
     * @returns Promise<string> Path to generated PDF
     */
    async generatePDF(resumeData: ResumeData, options: PDFOptions, endorsements?: Record<string, string[]>): Promise<string> {
        let browser: puppeteer.Browser | null = null;

        try {
            // Launch Puppeteer browser
            browser = await puppeteer.launch({
                headless: true,
                executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // Generate HTML content
            const htmlContent = this.generateHTML(resumeData, options.style, endorsements);

            // Set page content
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            // Generate PDF
            const pdfBuffer = await page.pdf({
                format: options.format,
                printBackground: options.includeColors,
                margin: {
                    top: '0.5in',
                    right: '0.5in',
                    bottom: '0.5in',
                    left: '0.5in'
                }
            });

            // Ensure output directory exists
            const outputDir = path.dirname(options.outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Write PDF to file
            fs.writeFileSync(options.outputPath, pdfBuffer);

            return options.outputPath;

        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error(`Failed to generate PDF: ${error}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Generate HTML content for the resume
     * @param resumeData Resume data
     * @param style Resume style
     * @returns string HTML content
     */
    private generateHTML(resumeData: ResumeData, style: ResumeStyle, endorsements?: Record<string, string[]>): string {
        const css = this.getCSS(style);
        const html = this.getHTMLTemplate(resumeData, endorsements);

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resumeData.personalInfo.name} - Resume</title>
    <style>
        ${css}
    </style>
</head>
<body>
    ${html}
</body>
</html>
        `;
    }

    /**
     * Get CSS styles based on resume style
     * @param style Resume style
     * @returns string CSS content
     */
    private getCSS(style: ResumeStyle): string {
        const baseCSS = `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 8.5in;
                margin: 0 auto;
                padding: 0.5in;
            }

            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #eee;
            }

            .name {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 5px;
            }

            .title {
                font-size: 18px;
                color: #666;
                margin-bottom: 10px;
            }

            .contact {
                font-size: 14px;
                color: #555;
            }

            .section {
                margin-bottom: 25px;
            }

            .section-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
                padding-bottom: 5px;
                border-bottom: 1px solid #ddd;
            }

            .summary {
                font-size: 14px;
                line-height: 1.7;
                text-align: justify;
            }

            .skills-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }

            .skill-category {
                margin-bottom: 10px;
            }

            .skill-category-title {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 5px;
            }

            .skill-list {
                font-size: 13px;
                color: #555;
            }

            .experience-item, .project-item {
                margin-bottom: 20px;
                page-break-inside: avoid;
            }

            .item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .item-title {
                font-weight: bold;
                font-size: 16px;
            }

            .item-duration {
                font-size: 13px;
                color: #666;
                font-style: italic;
            }

            .item-description {
                font-size: 14px;
                margin-bottom: 8px;
                color: #555;
            }

            .achievements, .highlights {
                list-style: none;
                padding-left: 0;
            }

            .achievements li, .highlights li {
                font-size: 13px;
                margin-bottom: 4px;
                padding-left: 15px;
                position: relative;
            }

            .achievements li:before, .highlights li:before {
                content: "•";
                position: absolute;
                left: 0;
                color: #666;
            }

            .technologies {
                font-size: 12px;
                color: #666;
                margin-top: 8px;
                font-style: italic;
            }

            @media print {
                body {
                    padding: 0;
                }
                
                .section {
                    page-break-inside: avoid;
                }
            }
        `;

        switch (style) {
            case ResumeStyle.MODERN:
                return baseCSS + `
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        margin: -0.5in -0.5in 30px -0.5in;
                        border-bottom: none;
                    }

                    .section-title {
                        color: #667eea;
                        border-bottom-color: #667eea;
                    }

                    .achievements li:before, .highlights li:before {
                        color: #667eea;
                    }
                `;

            case ResumeStyle.CLASSIC:
                return baseCSS + `
                    body {
                        font-family: 'Times New Roman', serif;
                    }

                    .header {
                        border-bottom: 3px double #333;
                    }

                    .section-title {
                        font-family: 'Times New Roman', serif;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                `;

            case ResumeStyle.MINIMAL:
                return baseCSS + `
                    .header {
                        border-bottom: 1px solid #333;
                    }

                    .section-title {
                        border-bottom: none;
                        font-weight: normal;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        font-size: 16px;
                    }

                    .achievements li:before, .highlights li:before {
                        content: "—";
                    }
                `;

            case ResumeStyle.DEVELOPER:
                return baseCSS + `
                    body {
                        font-family: 'Courier New', monospace;
                        background: #f8f9fa;
                    }

                    .header {
                        background: #2d3748;
                        color: #e2e8f0;
                        padding: 20px;
                        margin: -0.5in -0.5in 30px -0.5in;
                        border-bottom: none;
                        font-family: 'Courier New', monospace;
                    }

                    .section-title {
                        color: #2d3748;
                        border-bottom-color: #2d3748;
                        font-family: 'Courier New', monospace;
                    }

                    .technologies {
                        background: #e2e8f0;
                        padding: 5px 10px;
                        border-radius: 3px;
                        display: inline-block;
                        margin-top: 5px;
                    }
                `;

            default:
                return baseCSS;
        }
    }

    /**
     * Get HTML template for the resume
     * @param resumeData Resume data
     * @returns string HTML content
     */
    private getHTMLTemplate(resumeData: ResumeData, endorsements?: Record<string, string[]>): string {
        return `
            <div class="resume">
                <!-- Header Section -->
                <div class="header">
                    <div class="name">${resumeData.personalInfo.name}</div>
                    <div class="title">${resumeData.personalInfo.title}</div>
                    <div class="contact">
                        ${resumeData.personalInfo.email}
                        ${resumeData.personalInfo.github ? ` | ${resumeData.personalInfo.github}` : ''}
                    </div>
                </div>

                <!-- Summary Section -->
                <div class="section">
                    <div class="section-title">Professional Summary</div>
                    <div class="summary">${resumeData.summary}</div>
                </div>

                <!-- Skills Section -->
                <div class="section">
                    <div class="section-title">Technical Skills</div>
                    <div class="skills-grid">
                        ${this.generateSkillsHTML(resumeData.skills, endorsements)}
                    </div>
                </div>

                <!-- Experience Section -->
                <div class="section">
                    <div class="section-title">Professional Experience</div>
                    ${(resumeData.experience || []).map(exp => this.generateExperienceHTML(exp)).join('')}
                </div>

                <!-- Projects Section -->
                <div class="section">
                    <div class="section-title">Notable Projects</div>
                    ${(resumeData.projects || []).map(project => this.generateProjectHTML(project)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Generate HTML for skills section
     * @param skills Skills data
     * @returns string HTML content
     */
    private generateSkillsHTML(skills: ResumeData['skills'], endorsements?: Record<string, string[]>): string {
        const categories = [
            { title: 'Programming Languages', items: skills?.technical || [] },
            { title: 'Frameworks & Libraries', items: skills?.frameworks || [] },
            { title: 'Tools & Technologies', items: skills?.tools || [] },
            { title: 'Databases', items: skills?.databases || [] }
        ];

        return categories
            .filter(category => Array.isArray(category.items) && category.items.length > 0)
            .map(category => {
                const itemsWithEndorsements = category.items.map(skill => {
                    const endorsers = endorsements && endorsements[skill];
                    if (endorsers && endorsers.length > 0) {
                        return `${skill} <span title="Endorsed by: ${endorsers.join(', ')}">⭐ (${endorsers.length})</span>`;
                    }
                    return skill;
                });
                return `
                <div class="skill-category">
                    <div class="skill-category-title">${category.title}</div>
                    <div class="skill-list">${itemsWithEndorsements.join(', ')}</div>
                </div>
                `;
            }).join('');
    }

    /**
     * Generate HTML for experience item
     * @param experience Experience data
     * @returns string HTML content
     */
    private generateExperienceHTML(experience: ResumeData['experience'][0]): string {
        return `
            <div class="experience-item">
                <div class="item-header">
                    <div class="item-title">${experience.projectName}</div>
                    <div class="item-duration">${experience.duration}</div>
                </div>
                <div class="item-description">${experience.description}</div>
                <ul class="achievements">
                    ${(experience.achievements || []).map(achievement => `<li>${achievement}</li>`).join('')}
                </ul>
                ${(Array.isArray(experience.technologies) && experience.technologies.length > 0) ? 
                    `<div class="technologies">Technologies: ${experience.technologies.join(', ')}</div>` : 
                    ''
                }
            </div>
        `;
    }

    /**
     * Generate HTML for project item
     * @param project Project data
     * @returns string HTML content
     */
    private generateProjectHTML(project: ResumeData['projects'][0]): string {
        return `
            <div class="project-item">
                <div class="item-header">
                    <div class="item-title">${project.name}</div>
                    ${project.url ? `<div class="item-duration">${project.url}</div>` : ''}
                </div>
                <div class="item-description">${project.description}</div>
                <ul class="highlights">
                    ${(project.highlights || []).map(highlight => `<li>${highlight}</li>`).join('')}
                </ul>
                ${(Array.isArray(project.technologies) && project.technologies.length > 0) ? 
                    `<div class="technologies">Technologies: ${project.technologies.join(', ')}</div>` : 
                    ''
                }
            </div>
        `;
    }

    /**
     * Generate resume preview HTML (for display in VS Code webview)
     * @param resumeData Resume data
     * @param style Resume style
     * @returns string HTML content for preview
     */
    generatePreviewHTML(resumeData: ResumeData, style: ResumeStyle): string {
        const css = this.getCSS(style);
        const html = this.getHTMLTemplate(resumeData);

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume Preview</title>
    <style>
        ${css}
        body {
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin: 20px auto;
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>
        `;
    }

    /**
     * Get available resume styles
     * @returns ResumeStyle[]
     */
    getAvailableStyles(): ResumeStyle[] {
        return Object.values(ResumeStyle);
    }

    /**
     * Validate PDF generation requirements
     * @returns Promise<boolean>
     */
    async validateRequirements(): Promise<boolean> {
        try {
            // Test Puppeteer availability
            const browser = await puppeteer.launch({ headless: true });
            await browser.close();
            return true;
        } catch (error) {
            console.error('PDF generation requirements not met:', error);
            return false;
        }
    }
}

