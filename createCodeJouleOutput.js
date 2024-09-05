const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function readCodeFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content.trim();
    } catch (error) {
        console.error(`Fehler beim Lesen der Datei ${filePath}:`, error);
        return null;
    }
}

function readJouleCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fsSync.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
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
                content: `Der Energieverbrauch für dieses Stück Code beträgt: ${joule} Joule`
            }
        ]
    });
}

async function createJSONLFile(codeDir, jouleFile, outputFile) {
    const jouleData = await readJouleCSV(jouleFile);
    console.log(`Gelesene Joule-Einträge: ${jouleData.length}`);

    const fileStream = fsSync.createWriteStream(outputFile);

    const codeFiles = await fs.readdir(codeDir);
    console.log(`Gefundene Code-Dateien: ${codeFiles.length}`);

    for (const jouleEntry of jouleData) {
        const codeFileName = `${jouleEntry.Job_ID}.txt`;
        const filePath = path.join(codeDir, codeFileName);
        
        if (codeFiles.includes(codeFileName)) {
            console.log(`Verarbeite Datei: ${codeFileName}`);
            try {
                const code = await readCodeFile(filePath);
                if (code !== null) {
                    const jsonlEntry = createJSONLEntry(code, jouleEntry.Joule);
                    fileStream.write(jsonlEntry + '\n');
                    console.log(`JSONL-Eintrag für ${codeFileName} geschrieben. Joule-Wert: ${jouleEntry.Joule}`);
                } else {
                    console.log(`Datei ${codeFileName} ist leer oder konnte nicht gelesen werden.`);
                }
            } catch (error) {
                console.error(`Fehler beim Verarbeiten der Datei ${codeFileName}:`, error);
            }
        } else {
            console.log(`Keine übereinstimmende Datei für Job-ID ${jouleEntry.Job_ID} gefunden.`);
        }
    }

    fileStream.end();
    console.log(`JSONL-Datei ${outputFile} wurde erstellt.`);
}

const codeDirectory = './code_snippets';
const jouleFile = './joule_values.csv';
const outputFile = 'outputCodeJoules.jsonl';

createJSONLFile(codeDirectory, jouleFile, outputFile)
    .catch(error => console.error('Fehler beim Erstellen der JSONL-Datei:', error));