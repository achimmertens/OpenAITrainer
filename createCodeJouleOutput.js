const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

async function readCodeFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content.trim();
    } catch (error) {
        console.error(`Fehler beim Lesen der Datei ${filePath}:`, error);
        return null;
    }
}

async function readJouleFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content.split('\n').map(line => parseFloat(line.trim()));
    } catch (error) {
        console.error(`Fehler beim Lesen der Joule-Datei ${filePath}:`, error);
        return [];
    }
}

function createJSONLEntry(code, joule) {
    return JSON.stringify({
        messages: [
            {
                role: "system",
                content: "Your name is GreenCodeBot. You answer always polite. Your audience are software developers. Give them correct and factual answers."
            },
            {
                role: "user",
                content: code
            },
            {
                role: "assistant",
                content: `Die Joule-Zahl beträgt: ${joule}`
            }
        ]
    });
}

async function createJSONLFile(codeDir, jouleFile, outputFile) {
    const joules = await readJouleFile(jouleFile);
    console.log(`Gelesene Joule-Werte: ${joules.length}`);

    const fileStream = fsSync.createWriteStream(outputFile);

    const codeFiles = await fs.readdir(codeDir);
    console.log(`Gefundene Code-Dateien: ${codeFiles.length}`);

    for (let i = 0; i < codeFiles.length && i < joules.length; i++) {
        const codeFile = codeFiles[i];
        console.log(`Verarbeite Datei: ${codeFile}`);
        const filePath = path.join(codeDir, codeFile);
        console.log(`Vollständiger Dateipfad: ${filePath}`);
        
        try {
            const code = await readCodeFile(filePath);
            if (code !== null) {
                const jsonlEntry = createJSONLEntry(code, joules[i]);
                fileStream.write(jsonlEntry + '\n');
                console.log(`JSONL-Eintrag für ${codeFile} geschrieben. Joule-Wert: ${joules[i]}`);
            } else {
                console.log(`Datei ${codeFile} ist leer oder konnte nicht gelesen werden.`);
            }
        } catch (error) {
            console.error(`Fehler beim Verarbeiten der Datei ${codeFile}:`, error);
        }
    }

    fileStream.end();
    console.log(`JSONL-Datei ${outputFile} wurde erstellt.`);
}

const codeDirectory = './code_snippets';
const jouleFile = './joule_values.txt';
const outputFile = 'outputCodeJoules.jsonl';

createJSONLFile(codeDirectory, jouleFile, outputFile)
    .catch(error => console.error('Fehler beim Erstellen der JSONL-Datei:', error));

