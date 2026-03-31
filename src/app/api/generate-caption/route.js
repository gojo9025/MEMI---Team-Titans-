import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { parseOffice } from 'officeparser';
import { PDFParse } from 'pdf-parse';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const mode = formData.get('mode') || 'study'; // 'study' or 'announcement'
        const templateName = formData.get('templateName');
        const boxCount = parseInt(formData.get('boxCount'), 10);
        const language = formData.get('language') || 'English';

        let finalPrompt = "";
        let promptImages = [];

        if (mode === 'study') {
            const files = formData.getAll('files');
            const focusTopic = formData.get('focusTopic') || 'the most important overarching concept';

            if (!files || files.length === 0) {
                return NextResponse.json({ error: 'At least one file is required for NotebookLM study mode' }, { status: 400 });
            }

            let extractedText = "";

            for (const file of files) {
                const buffer = await file.arrayBuffer();
                const fileType = file.type;
                const fileName = file.name || "";

                if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                    try {
                        const parser = new PDFParse({ data: Buffer.from(buffer) });
                        const result = await parser.getText();
                        extractedText += `\n\n--- Content from ${fileName} ---\n` + result.text;
                    } catch (e) {
                        console.error("PDF parse error:", e);
                    }
                } else if (fileType === 'image/jpeg' || fileType === 'image/png') {
                    const base64Data = Buffer.from(buffer).toString('base64');
                    promptImages.push(base64Data);
                    // Image OCR removed due to Next.js Web Worker incompatibility
                } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
                    extractedText += `\n\n--- Content from ${fileName} ---\n` + Buffer.from(buffer).toString('utf-8');
                } else if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    try {
                        const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
                        extractedText += `\n\n--- Content from ${fileName} ---\n` + result.value;
                    } catch (e) {
                        console.error("Docx parse error:", e);
                    }
                } else if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt') || fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                    const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}-${fileName}`);
                    await fs.writeFile(tempFilePath, Buffer.from(buffer));
                    try {
                        let ast = await parseOffice(tempFilePath);
                        const parsedText = ast && ast.toText ? ast.toText() : JSON.stringify(ast);
                        extractedText += `\n\n--- Content from ${fileName} ---\n` + parsedText;
                    } catch (e) {
                        console.error("Parse error for pptx:", e);
                    }
                    await fs.unlink(tempFilePath).catch(e => console.error("Temp file cleanup error:", e));
                } else {
                    console.warn(`Unsupported file format skipped: ${fileName}`);
                }
            }

            finalPrompt = `
You are an expert educational meme creator helping a student study their lesson material.
I am providing you with the student's lesson notes/material.

TEXT CONTENT EXTRACTED FROM FILE:
${extractedText ? extractedText : "(No text extracted, refer to images if any)"}

STUDENT REQUEST / PROMPT:
Prompt: "${focusTopic}"
Meme Template Context: The student wants to make a "${templateName}" meme.
Number of text boxes required: ${boxCount}

TASK:
1. Read the provided lesson material entirely.
2. Identify a key concept related to the Prompt (or the most important concept overall if no focus is given).
3. Write EXACTLY ${boxCount} short, highly motivating and funny phrases that fit the "${templateName}" meme format AND teach/reinforce the concept you identified.
4. Keep the text extremely short (max 10 words per phrase).
5. Emphasize learning or motivation.
6. MUST OUTPUT ENTIRELY NATIVELY IN: ${language}. Translate the phrases directly into ${language}.

FORMAT:
Return ONLY a valid JSON array of strings, with exactly ${boxCount} items.
Example: ["Hard concept text", "Funny motivating punchline"]
Do not wrap in markdown tags or add any other text at all. ONLY JSON.
`;

        } else if (mode === 'announcement') {
            const title = formData.get('title');
            const description = formData.get('description');
            const category = formData.get('category');
            const date = formData.get('date');

            if (!description) {
                return NextResponse.json({ error: 'Description is required for announcement mode' }, { status: 400 });
            }

            finalPrompt = `
You are an expert Gen-Z meme creator working for an educational institution.
Your job is to convert formal announcements into a funny, relatable meme caption that students will actually read.

ANNOUNCEMENT DETAILS:
Title: ${title || 'N/A'}
Category: ${category}
Deadline/Date: ${date || 'N/A'}
Context: ${description}

MEME TEMPLATE CONTEXT:
Template Name: ${templateName}
Number of text boxes required: ${boxCount}

TASK:
Write exactly ${boxCount} short, punchy phrases that fit the context of the "${templateName}" meme based on the announcement details.
Make it hilarious and relatable to high school/college students so they don't ignore it. Keep text short (max 10 words per phrase).
MUST OUTPUT ENTIRELY NATIVELY IN: ${language}. Translate the phrases directly into ${language}.

FORMAT:
Return ONLY a valid JSON array of strings, with exactly ${boxCount} items.
Example: ["First box text", "Second box text"]
Do not wrap in markdown tags or add any other text at all. ONLY JSON.
`;
        } else {
            return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
        }

        // Hit Local Ollama Instance
        const ollamaModel = process.env.OLLAMA_MODEL || 'qwen3:8b';
        const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

        const requestBody = {
            model: ollamaModel,
            prompt: finalPrompt,
            stream: false,
            // Only ask for json format if strictly needed, some ollama models ignore it, but standard llama3 supports it
            format: 'json',
            options: {
                temperature: 0.7
            }
        };

        if (promptImages.length > 0) {
            requestBody.images = promptImages;
        }

        const ollamaRes = await fetch(`${ollamaHost}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!ollamaRes.ok) {
            let errorText = await ollamaRes.text();
            throw new Error(`Ollama Error ${ollamaRes.status}: ${errorText}`);
        }

        const ollamaData = await ollamaRes.json();
        const output = ollamaData.response.trim();

        // Attempt to parse JSON
        let captions = [];
        try {
            const cleanedOutput = output.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanedOutput);
            if (Array.isArray(parsed)) {
                captions = parsed;
            } else if (parsed && parsed.captions && Array.isArray(parsed.captions)) {
                captions = parsed.captions;
            } else if (parsed && parsed.phrases && Array.isArray(parsed.phrases)) {
                captions = parsed.phrases;
            } else if (typeof parsed === 'object' && parsed !== null) {
                // If it returns {"1": "joke", "2": "joke2"} or {"item1": "joke"}
                captions = Object.values(parsed).filter(val => typeof val === 'string' && val.length > 3);
            } else {
                throw new Error("Parsed JSON is not an array");
            }
        } catch (e) {
            console.error("Failed to parse Ollama output. Raw output:", output);
            captions = output.split('\n').filter(line => line.trim().length > 0).slice(0, boxCount);
        }

        if (!Array.isArray(captions)) captions = [];

        while (captions.length < boxCount) {
            captions.push('...');
        }
        captions = captions.slice(0, boxCount);

        return NextResponse.json({ captions });

    } catch (error) {
        console.error("Local Ollama Generation Error:", error);
        return NextResponse.json({ error: 'Failed to generate meme via Ollama: ' + error.message }, { status: 500 });
    }
}
