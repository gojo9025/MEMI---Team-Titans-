"use client";
import { useState, useRef } from 'react';

export default function VideoExporter({ feedMemes, singleMeme }) {
    const [isExporting, setIsExporting] = useState(false);
    const canvasRef = useRef(null);

    // Determines if we have anything to export
    const memesToExport = feedMemes && feedMemes.length > 0 
        ? feedMemes.filter(m => m.status === 'done' || m.captions.length > 0)
        : singleMeme && singleMeme.captions.length > 0 ? [singleMeme] : [];

    const handleExport = async () => {
        if (memesToExport.length === 0) return;
        setIsExporting(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Standard TikTok/Reel Resolution ratio, but landscape memes work better as standard 1080p
        canvas.width = 1080;
        canvas.height = 1080; 

        // Try getting a WebM or MP4 recorder depending on browser support
        const stream = canvas.captureStream(30);
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';
        
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks = [];
        
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `studytok_chapter_${new Date().getTime()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            setIsExporting(false);
        };

        recorder.start();

        // Let's preload all images first so they instantly render when their frame is called
        const loadedImages = await Promise.all(
            memesToExport.map(item => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.src = item.template.url;
                    img.onload = () => resolve({ img, item });
                    img.onerror = () => resolve(null); // skip bad images
                });
            })
        );
        
        const validFrames = loadedImages.filter(Boolean);

        // Animation Loop logic
        const SECONDS_PER_SLIDE = 4;
        const FPS = 30;
        const framesPerSlide = SECONDS_PER_SLIDE * FPS;
        const totalSlides = validFrames.length;
        const totalFrames = framesPerSlide * totalSlides;

        let currentFrame = 0;

        const drawFrame = () => {
            if (currentFrame >= totalFrames) {
                recorder.stop();
                return;
            }

            const slideIndex = Math.floor(currentFrame / framesPerSlide);
            const frameInSlide = currentFrame % framesPerSlide;
            const progress = frameInSlide / framesPerSlide; // 0 to 1

            const frameData = validFrames[slideIndex];
            
            // Clear black screen
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (frameData) {
                const { img, item } = frameData;
                const { template, captions } = item;

                // Simple Ken Burns zoom effect (scale from 1.0 to 1.1)
                const scale = 1.0 + (progress * 0.1);

                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.scale(scale, scale);
                ctx.translate(-canvas.width / 2, -canvas.height / 2);

                // Draw centered image maintaining aspect ratio
                const hRatio = canvas.width / img.width;
                const vRatio = canvas.height / img.height;
                const ratio = Math.min(hRatio, vRatio);
                const centerShift_x = (canvas.width - img.width * ratio) / 2;
                const centerShift_y = (canvas.height - img.height * ratio) / 2;
                
                ctx.drawImage(img, 0, 0, img.width, img.height,
                    centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
                ctx.restore();

                // Draw Text statically on top (no scale to remain readable)
                if (captions && captions.length > 0) {
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 12; // Much thicker stroke for 1080p canvas
                    ctx.textAlign = 'center';

                    captions.forEach((text, index) => {
                        if (!text) return;
        
                        const box = template.boxes && index < template.boxes.length 
                            ? template.boxes[index] 
                            : { x: 0, y: index * (100 / template.boxCount), w: 100, h: 100 / template.boxCount };
        
                        // Math against the 1080x1080 centered draw area, not the raw canvas edge
                        // Since image is centered taking ratio space, text boxes should map to that!
                        const imgRenderWidth = img.width * ratio;
                        const imgRenderHeight = img.height * ratio;
                        const imgX = centerShift_x;
                        const imgY = centerShift_y;

                        const boxX = imgX + (box.x / 100) * imgRenderWidth;
                        const boxY = imgY + (box.y / 100) * imgRenderHeight;
                        const boxW = (box.w / 100) * imgRenderWidth;
                        const boxH = (box.h / 100) * imgRenderHeight;
        
                        const centerX = boxX + (boxW / 2);
                        
                        const charCount = text.length;
                        let sizeRatio = 3.5;
                        if (charCount > 40) sizeRatio = 6;
                        else if (charCount > 20) sizeRatio = 4.5;
                        
                        // Font scaling specifically for 1080p scale
                        const fontSize = Math.min(Math.floor(boxH / sizeRatio), Math.floor(canvas.width / 15), 180);
                        ctx.font = `bold ${fontSize}px Impact, sans-serif`;
        
                        const startY = boxY + (boxH / 2) - fontSize/4;
                        wrapText(ctx, text.toUpperCase(), centerX, startY, boxW - 20, fontSize * 1.1);
                    });
                }
            }

            currentFrame++;
            requestAnimationFrame(drawFrame);
        };

        // Helper function to wrap text on canvas
        const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
            const words = text.split(' ');
            let line = '';

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;

                if (testWidth > maxWidth && n > 0) {
                    context.strokeText(line, x, y);
                    context.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            context.strokeText(line, x, y);
            context.fillText(line, x, y);
        }

        // Start animation sequence
        drawFrame();
    };

    return (
        <>
            <button 
                className="btn btn-secondary" 
                style={{ background: 'linear-gradient(45deg, #f59e0b, #ec4899)', color: 'white', border: 'none', padding: '0.8rem 1.5rem', fontWeight: 'bold' }} 
                onClick={handleExport} 
                disabled={isExporting || memesToExport.length === 0}
            >
                {isExporting ? '🎥 Rendering Video...' : '🎬 Export as Video'}
            </button>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
    );
}
