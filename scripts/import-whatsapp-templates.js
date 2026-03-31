const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\GOUSHIK\\Desktop\\MEMI\\Templates';
const destDir = path.join(__dirname, 'public/custom_templates');
const outJs = path.join(__dirname, 'src/lib/customTemplates.js');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(srcDir);
const jpegFiles = files.filter(f => f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'));

const templateObjects = [];
let idCounter = 100;

jpegFiles.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const cleanName = encodeURIComponent(file.replace(/ /g, '_'));
    const destPath = path.join(destDir, file.replace(/ /g, '_')); // Save without spaces
    
    fs.copyFileSync(srcPath, destPath);
    
    templateObjects.push({
        id: (idCounter++).toString(),
        name: `Local: ${file.replace(/\.(jpeg|jpg|png)$/i, '')}`,
        url: `/custom_templates/${file.replace(/ /g, '_')}`, // Reference clean path
        boxCount: 2,
        boxes: [
            { x: 5, y: 5, w: 90, h: 25 }, // Top box
            { x: 5, y: 70, w: 90, h: 25 } // Bottom box
        ]
    });
});

const content = `export const customTemplates = ${JSON.stringify(templateObjects, null, 4)};\n`;

const libDir = path.dirname(outJs);
if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });
fs.writeFileSync(outJs, content);

console.log(`Successfully imported ${jpegFiles.length} local templates and generated ${outJs}`);
