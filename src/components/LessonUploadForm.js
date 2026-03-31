"use client";
import { useState, useRef } from 'react';

export default function LessonUploadForm({ file, setFile, focusTopic, setFocusTopic }) {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);

    const supportedTypes = [
        "application/pdf",
        "text/plain",
        "image/png",
        "image/jpeg",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];

    const handleDrag = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = function (e) {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (uploadedFile) => {
        // Basic format validation
        if (!supportedTypes.includes(uploadedFile.type) && !uploadedFile.name.endsWith('.docx') && !uploadedFile.name.endsWith('.ppt') && !uploadedFile.name.endsWith('.pptx') && !uploadedFile.name.endsWith('.txt')) {
            alert("Please upload a PDF, Word, PPTX, TXT, or Image file.");
            return;
        }
        setFile(uploadedFile);
    };

    const onButtonClick = () => {
        inputRef.current.click();
    };

    const inputStyle = {
        width: '100%',
        padding: '0.8rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--panel-border)',
        background: 'rgba(0, 0, 0, 0.2)',
        color: 'var(--foreground)',
        fontSize: '1rem',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.2s',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    Upload Lesson Notes (PDF, DOCX, PPTX, TXT, Image)
                </label>

                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={onButtonClick}
                    style={{
                        border: `2px dashed ${dragActive ? 'var(--accent-blue)' : 'var(--panel-border)'}`,
                        borderRadius: '12px',
                        padding: '2rem 1rem',
                        textAlign: 'center',
                        background: dragActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf,.txt,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx"
                        onChange={handleChange}
                        style={{ display: 'none' }}
                    />
                    {file ? (
                        <div>
                            <span style={{ fontSize: '2rem' }}>📄</span>
                            <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{file.name}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click to change file</p>
                        </div>
                    ) : (
                        <div>
                            <span style={{ fontSize: '2rem' }}>☁️</span>
                            <p style={{ marginTop: '0.5rem' }}>Drag & drop your lesson file here</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>or click to browse</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    Focus Topic (Optional)
                </label>
                <input
                    type="text"
                    value={focusTopic}
                    onChange={(e) => setFocusTopic(e.target.value)}
                    placeholder="e.g. Mitochondria, Supply and Demand..."
                    style={inputStyle}
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Leave blank to let the AI pick the most important concept in the document.
                </p>
            </div>

        </div>
    );
}
