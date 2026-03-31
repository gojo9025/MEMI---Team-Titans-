"use client";
import { useState, useRef } from 'react';
import AnnouncementForm from './AnnouncementForm';
import TemplateSelector from './TemplateSelector';
import MemePreview from './MemePreview';
import VideoExporter from './VideoExporter';
import Tesseract from 'tesseract.js';
import { customTemplates } from '../lib/customTemplates';

export const defaultTemplates = [
    {
        id: '1', name: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg', boxCount: 2,
        boxes: [{ x: 50, y: 0, w: 48, h: 50 }, { x: 50, y: 50, w: 48, h: 50 }]
    },
    {
        id: '2', name: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg', boxCount: 3,
        boxes: [{ x: 5, y: 50, w: 30, h: 40 }, { x: 45, y: 40, w: 25, h: 40 }, { x: 75, y: 45, w: 25, h: 40 }]
    },
    {
        id: '3', name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg', boxCount: 2,
        boxes: [{ x: 8, y: 10, w: 35, h: 25 }, { x: 55, y: 8, w: 35, h: 25 }]
    },
    {
        id: '4', name: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg', boxCount: 1,
        boxes: [{ x: 30, y: 55, w: 45, h: 30 }]
    },
    {
        id: '5', name: 'Expanding Brain', url: 'https://i.imgflip.com/1jwhww.jpg', boxCount: 4,
        boxes: [{ x: 2, y: 2, w: 46, h: 22 }, { x: 2, y: 26, w: 46, h: 22 }, { x: 2, y: 51, w: 46, h: 22 }, { x: 2, y: 76, w: 46, h: 22 }]
    },
    {
        id: '6', name: 'Smart Guy (GIF)', url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif', boxCount: 2,
        boxes: [{ x: 5, y: 5, w: 40, h: 30 }, { x: 50, y: 70, w: 45, h: 25 }]
    },
    {
        id: '7', name: 'Confused Math Lady (GIF)', url: 'https://media.giphy.com/media/ne3xrYlWt41s4/giphy.gif', boxCount: 2,
        boxes: [{ x: 2, y: 2, w: 90, h: 25 }, { x: 2, y: 70, w: 90, h: 25 }]
    }
];

export default function MemeGenerator() {
    const allTemplates = [...defaultTemplates, ...customTemplates];
    const [mode, setMode] = useState('study'); // 'study' | 'announcement'

    // Multiple file states for NotebookLM Style
    const [sources, setSources] = useState([]);
    const [focusTopic, setFocusTopic] = useState('');
    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);

    // Web Scraper State
    const [urlInput, setUrlInput] = useState('');
    const [isScraping, setIsScraping] = useState(false);

    // Announcement state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        category: 'Event'
    });

    const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplates[0]);
    const [captions, setCaptions] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef(null);

    // Multilingual support
    const [language, setLanguage] = useState('English');
    const availableLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Spanish', 'French', 'Gen-Z Slang (English)'];

    // StudyTok Feed State
    const [isFeedMode, setIsFeedMode] = useState(false);
    const [feedMemes, setFeedMemes] = useState([]); // [{ id, template, captions, status }]

    // Sidebar Upload Logic
    const supportedTypes = [
        "application/pdf", "text/plain", "image/png", "image/jpeg",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];

    const handleFileAdded = async (filesArray) => {
        const validFiles = Array.from(filesArray).filter(f =>
            supportedTypes.includes(f.type) || f.name.endsWith('.docx') || f.name.endsWith('.ppt') || f.name.endsWith('.pptx') || f.name.endsWith('.txt')
        );
        if (validFiles.length < filesArray.length) {
            alert("Some files were rejected. Please upload PDF, Word, PPTX, TXT, or Image files.");
        }

        // Push raw files directly for immediate UI feedback.
        // We will do a state update loop to replace images with OCR text in the background.
        setSources(prev => [...prev, ...validFiles]);

        for (const f of validFiles) {
            if (f.type.startsWith('image/')) {
                try {
                    console.log(`Running in-browser OCR on ${f.name}...`);
                    const { data: { text } } = await Tesseract.recognize(f, 'eng');
                    if (text && text.trim().length > 0) {
                        const textFile = new File([text], `${f.name}-ocr.txt`, { type: 'text/plain' });
                        setSources(prev => prev.map(src => src === f ? textFile : src));
                        console.log(`Swapped image ${f.name} for extracted text buffer.`);
                    }
                } catch (e) {
                    console.error("Client OCR failed:", e);
                }
            }
        }
    };

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files) handleFileAdded(e.dataTransfer.files);
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files) handleFileAdded(e.target.files);
    };

    const removeSource = (index) => {
        setSources(prev => prev.filter((_, i) => i !== index));
    };

    // Web Scraper Logic
    const handleUrlScrape = async () => {
        if (!urlInput.trim()) return;
        setIsScraping(true);
        try {
            const res = await fetch('/api/scrape-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urlInput })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Convert scraped text to a virtual file object
            const textFile = new File([data.text], `🌐 ${data.title}.txt`, { type: 'text/plain' });
            setSources(prev => [...prev, textFile]);
            setUrlInput('');
            console.log(`✅ Scraped "${data.title}" — ${data.text.length} chars added to Knowledge Base`);
        } catch (e) {
            console.error(e);
            alert(`Scraping failed: ${e.message}`);
        } finally {
            setIsScraping(false);
        }
    };

    // Generation Logic
    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const formDataApi = new FormData();
            formDataApi.append('mode', mode);
            formDataApi.append('templateName', selectedTemplate.name);
            formDataApi.append('boxCount', selectedTemplate.boxCount.toString());
            formDataApi.append('language', language);

            if (mode === 'study') {
                sources.forEach(source => formDataApi.append('files', source));
                formDataApi.append('focusTopic', focusTopic);
            } else {
                formDataApi.append('title', formData.title);
                formDataApi.append('description', formData.description);
                formDataApi.append('date', formData.date);
                formDataApi.append('category', formData.category);
            }

            const response = await fetch('/api/generate-caption', {
                method: 'POST',
                body: formDataApi
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to generate');
            }

            const data = await response.json();
            setCaptions(data.captions);
        } catch (error) {
            console.error(error);
            alert(`Error generating meme: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateFeed = () => {
        setIsFeedMode(true);
        const feedTemplates = [defaultTemplates[0], defaultTemplates[2], defaultTemplates[4]]; // Drake, Two Buttons, Expanding Brain
        const initialFeed = feedTemplates.map(t => ({ id: Math.random(), template: t, captions: [], status: 'loading' }));
        setFeedMemes(initialFeed);

        initialFeed.forEach(async (feedItem, index) => {
            try {
                const formDataApi = new FormData();
                formDataApi.append('mode', 'study');
                formDataApi.append('templateName', feedItem.template.name);
                formDataApi.append('boxCount', feedItem.template.boxCount.toString());
                formDataApi.append('language', language);
                sources.forEach(source => formDataApi.append('files', source));
                formDataApi.append('focusTopic', "Generate a meme summarizing a random key concept from the uploaded lesson.");

                const response = await fetch('/api/generate-caption', { method: 'POST', body: formDataApi });
                if (!response.ok) throw new Error('Failed to generate');
                const data = await response.json();

                setFeedMemes(prev => {
                    const newFeed = [...prev];
                    newFeed[index] = { ...newFeed[index], status: 'done', captions: data.captions };
                    return newFeed;
                });
            } catch (error) {
                console.error(error);
                setFeedMemes(prev => {
                    const newFeed = [...prev];
                    newFeed[index] = { ...newFeed[index], status: 'error' };
                    return newFeed;
                });
            }
        });
    };

    const handleDownload = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.download = `titans-meme-${new Date().getTime()}.jpg`;
        link.href = dataUrl;
        link.click();
    };

    const isGenerateDisabled = isGenerating || (mode === 'study' ? sources.length === 0 : !formData.description);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Mode Toggle */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.3rem', alignSelf: 'center', width: '100%', maxWidth: '600px' }}>
                <button
                    style={{ flex: 1, padding: '0.8rem', border: 'none', background: mode === 'study' ? 'var(--gradient-primary)' : 'transparent', color: mode === 'study' ? 'white' : 'var(--text-secondary)', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
                    onClick={() => { setMode('study'); setCaptions([]); }}
                >
                    📚 NotebookLM Studio
                </button>
                <button
                    style={{ flex: 1, padding: '0.8rem', border: 'none', background: mode === 'announcement' ? 'var(--gradient-primary)' : 'transparent', color: mode === 'announcement' ? 'white' : 'var(--text-secondary)', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
                    onClick={() => { setMode('announcement'); setCaptions([]); }}
                >
                    📢 Announcement Mode
                </button>
            </div>

            {mode === 'study' ? (
                /* STUDY MODE - NOTEBOOKLM LAYOUT */
                <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
                    {/* LEFT SIDEBAR: SOURCES */}
                    <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Sources</span>
                            <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>{sources.length}</span>
                        </h3>

                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {sources.length === 0 && (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 1rem', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                    Upload documents to build your knowledge base.
                                </div>
                            )}
                            {sources.map((src, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', color: 'var(--foreground)' }}>
                                        <span style={{ marginRight: '0.5rem' }}>📄</span>{src.name}
                                    </div>
                                    <button onClick={() => removeSource(i)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}>×</button>
                                </div>
                            ))}
                        </div>

                        {/* Web Scraper URL Input */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input 
                                type="url" 
                                placeholder="Paste Web URL & Scrape..." 
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }}
                                onKeyDown={(e) => e.key === 'Enter' && handleUrlScrape()}
                            />
                            <button 
                                onClick={handleUrlScrape} 
                                disabled={isScraping || !urlInput.trim()}
                                style={{ background: 'var(--glass)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.8rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '45px' }}
                            >
                                {isScraping ? '↻' : '➕'}
                            </button>
                        </div>

                        <div
                            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                            onClick={() => fileInputRef.current.click()}
                            style={{
                                border: `2px dashed ${dragActive ? 'var(--accent-blue)' : 'var(--panel-border)'}`,
                                borderRadius: '12px', padding: '1.5rem 1rem', textAlign: 'center',
                                background: dragActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                cursor: 'pointer', transition: 'all 0.2s ease', position: 'sticky', bottom: '0'
                            }}
                        >
                            <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx" onChange={handleChange} style={{ display: 'none' }} />
                            <span style={{ fontSize: '1.5rem' }}>+</span>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Add Source</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PDF, PPTX, Doc, TXT</p>
                        </div>
                    </div>

                    {/* MAIN STUDIO AREA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Meme Studio Prompt</h2>
                            <textarea
                                value={focusTopic}
                                onChange={(e) => setFocusTopic(e.target.value)}
                                placeholder="e.g. Help me memorize the difference between Mitosis and Meiosis using my uploaded class notes..."
                                rows={4}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '12px',
                                    border: '1px solid var(--panel-border)', background: 'rgba(0, 0, 0, 0.2)',
                                    color: 'var(--foreground)', fontSize: '1rem', fontFamily: 'inherit',
                                    outline: 'none', resize: 'vertical', marginBottom: '1.5rem'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Meme Language:</h3>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', color: 'white', outline: 'none' }}
                                    >
                                        {availableLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>

                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Select Visual Style:</h3>
                            <TemplateSelector templates={[...defaultTemplates, ...customTemplates]} selectedTemplate={selectedTemplate} setSelectedTemplate={(t) => { setSelectedTemplate(t); setCaptions([]); }} />

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn btn-primary" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }} onClick={() => { setIsFeedMode(false); handleGenerate(); }} disabled={isGenerateDisabled}>
                                    {isGenerating ? '🪄 Generating...' : '🪄 Generate Single Meme'}
                                </button>
                                <button className="btn btn-secondary" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(45deg, #ec4899, #8b5cf6)', color: 'white', border: 'none' }} onClick={handleGenerateFeed} disabled={isGenerating || sources.length === 0}>
                                    📱 Generate StudyTok Chapter
                                </button>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Output Preview</h2>

                            {!isFeedMode ? (
                                <>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', padding: '1rem' }}>
                                        <MemePreview template={selectedTemplate} captions={captions} canvasRef={canvasRef} />
                                    </div>
                                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                        <button className="btn btn-secondary" onClick={() => setCaptions([])}>Clear Array</button>
                                        <button className="btn btn-primary" onClick={handleDownload} disabled={captions.length === 0}>
                                            📥 Download Image
                                        </button>
                                        <VideoExporter feedMemes={[]} singleMeme={captions.length > 0 ? { template: selectedTemplate, captions } : null} />
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '600px', overflowY: 'auto', paddingRight: '1rem', scrollSnapType: 'y mandatory' }}>
                                    {feedMemes.map((item, idx) => (
                                        <div key={item.id} style={{ scrollSnapAlign: 'start', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem', position: 'relative' }}>
                                            <h3 style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chapter #{idx + 1}</h3>
                                            {item.status === 'loading' ? (
                                                <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p className="animate-pulse">Loading AI Context...</p></div>
                                            ) : item.status === 'error' ? (
                                                <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}><p>Generation Failed</p></div>
                                            ) : (
                                                <MemePreview template={item.template} captions={item.captions} />
                                            )}
                                        </div>
                                    ))}
                                    {feedMemes.length > 0 && feedMemes.every(m => m.status === 'done' || m.status === 'error') && (
                                        <div style={{ scrollSnapAlign: 'start', display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                            <VideoExporter feedMemes={feedMemes} singleMeme={null} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* ANNOUNCEMENT MODE - CLASSIC GRID LAYOUT */
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>1. Announcement Details</h2>
                            <AnnouncementForm formData={formData} setFormData={setFormData} />
                            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem' }} onClick={handleGenerate} disabled={isGenerateDisabled}>
                                {isGenerating ? '🪄 Generating...' : '🪄 Generate Meme Captions (AI)'}
                            </button>
                        </div>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>2. Language & Output Template</h2>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', color: 'white', outline: 'none' }}
                                >
                                    {availableLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <TemplateSelector templates={allTemplates} selectedTemplate={selectedTemplate} setSelectedTemplate={(t) => { setSelectedTemplate(t); setCaptions([]); }} />
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', position: 'sticky', top: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>3. Preview & Output</h2>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', padding: '1rem' }}>
                            <MemePreview template={selectedTemplate} captions={captions} canvasRef={canvasRef} />
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setCaptions([])}>Reset Captions</button>
                            <button className="btn btn-primary" onClick={handleDownload} disabled={captions.length === 0}>
                                📥 Download Meme
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
