"use client";
import { useEffect, useState } from 'react';

// A simple preview implementation that visually layers text over the image using DOM.
// We also draw to a hidden canvas so it can be downloaded.
export default function MemePreview({ template, captions, canvasRef }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        setImageLoaded(false);
    }, [template.url]);

    // When image loads or captions change, redraw the canvas for downloading
    useEffect(() => {
        if (!imageLoaded || !canvasRef.current || !template) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.crossOrigin = "Anonymous"; // Try to avoid CORS issues with imgflip
        image.src = template.url;

        image.onload = () => {
            // Set canvas dimensions to match image
            canvas.width = image.width;
            canvas.height = image.height;

            // Draw image
            ctx.drawImage(image, 0, 0);

            if (!captions || captions.length === 0) return;

            // Style settings for meme text
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = Math.max(3, canvas.width / 150);
            ctx.textAlign = 'center';

            captions.forEach((text, index) => {
                if (!text) return;

                const box = template.boxes && index < template.boxes.length
                    ? template.boxes[index]
                    : { x: 0, y: index * (100 / template.boxCount), w: 100, h: 100 / template.boxCount };

                const boxX = (box.x / 100) * canvas.width;
                const boxY = (box.y / 100) * canvas.height;
                const boxW = (box.w / 100) * canvas.width;
                const boxH = (box.h / 100) * canvas.height;

                const centerX = boxX + (boxW / 2);

                const charCount = text.length;
                let sizeRatio = 3.5;
                if (charCount > 40) sizeRatio = 6;
                else if (charCount > 20) sizeRatio = 4.5;

                const fontSize = Math.min(Math.floor(boxH / sizeRatio), Math.floor(canvas.width / 15), 50);
                ctx.font = `bold ${fontSize}px Impact, sans-serif`;

                const startY = boxY + (boxH / 2) - fontSize / 4;
                wrapText(ctx, text.toUpperCase(), centerX, startY, boxW - 10, fontSize * 1.1);
            });
        };
    }, [template, captions, imageLoaded, canvasRef]);

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

    return (
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            {/* Visual Preview */}
            <div style={{ position: 'relative', maxWidth: '100%' }}>
                <img
                    src={template.url}
                    alt="Meme Template"
                    onLoad={() => setImageLoaded(true)}
                    style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', display: 'block', borderRadius: '4px' }}
                />

                {imageLoaded && captions.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        pointerEvents: 'none'
                    }}>
                        {captions.map((cap, i) => {
                            const box = template.boxes && i < template.boxes.length
                                ? template.boxes[i]
                                : { x: 0, y: i * (100 / template.boxCount), w: 100, h: 100 / template.boxCount };

                            const charCount = cap ? cap.length : 0;
                            const dynamicFontSize = charCount > 40 ? 'clamp(0.6rem, 1.5vw, 1.2rem)' : charCount > 20 ? 'clamp(0.7rem, 2vw, 1.5rem)' : 'clamp(1rem, 3vw, 2.5rem)';

                            return (
                                <div key={i} style={{
                                    position: 'absolute',
                                    left: `${box.x}%`,
                                    top: `${box.y}%`,
                                    width: `${box.w}%`,
                                    height: `${box.h}%`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '2%'
                                }}>
                                    <p style={{
                                        fontFamily: 'Impact, sans-serif',
                                        fontSize: dynamicFontSize,
                                        color: 'white',
                                        textTransform: 'uppercase',
                                        textAlign: 'center',
                                        margin: 0,
                                        width: '100%',
                                        textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000',
                                        wordBreak: 'break-word',
                                        lineHeight: '1.2'
                                    }}>
                                        {cap}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Hidden Canvas for actual rendering & download */}
            <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
            />
        </div>
    );
}
