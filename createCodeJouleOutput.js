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
            .on('end', () => {
                // Sortiere die Ergebnisse nach Job_ID
                results.sort((a, b) => parseInt(a.Job_ID) - parseInt(b.Job_ID));
                resolve(results);
            })
            .on('error', (error) => reject(error));
    });
}

function createJSONLEntry(code, joule, seconds) {
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
                content: `Der Energieverbrauch für dieses Stück Code beträgt: ${joule} Joule, die Prozesszeit beträgt ${seconds} Sekunden`
            }
        ]
    });
}

async function createJSONLFile(codeDir, jouleFile, outputFile) {
    console.log('Starte Verarbeitung...');
    const jouleData = await readJouleCSV(jouleFile);
    console.log(`Gelesene und sortierte Joule-Einträge: ${jouleData.length}`);

    const fileStream = fsSync.createWriteStream(outputFile);

    const codeFiles = await fs.readdir(codeDir);
    console.log(`Gefundene Code-Dateien: ${codeFiles.length}`);

    let processedEntries = 0;
    let missingFiles = 0;

    for (const jouleEntry of jouleData) {
        const codeFileName = `${jouleEntry.Job_ID}.txt`;
        const filePath = path.join(codeDir, codeFileName);
        
        if (codeFiles.includes(codeFileName)) {
            console.log(`Verarbeite Datei: ${codeFileName} (${jouleEntry.Job_Name})`);
            try {
                const code = await readCodeFile(filePath);
                if (code !== null) {
                    const jsonlEntry = createJSONLEntry(code, jouleEntry.Joule, jouleEntry.Seconds);
                    fileStream.write(jsonlEntry + '\n');
                    console.log(`  Path: ${jouleEntry.Path}`);
                    console.log(`  Joule-Wert: ${jouleEntry.Joule}`);
                    console.log(`  Sekunden: ${jouleEntry.Seconds}`);
                    processedEntries++;
                } else {
                    console.log(`Datei ${codeFileName} (${jouleEntry.Job_Name}) ist leer oder konnte nicht gelesen werden.`);
                    console.log(`  Path: ${jouleEntry.Path}`);
                    missingFiles++;
                }
            } catch (error) {
                console.error(`Fehler beim Verarbeiten der Datei ${codeFileName} (${jouleEntry.Job_Name}):`, error);
                console.log(`  Path: ${jouleEntry.Path}`);
                missingFiles++;
            }
        } else {
            console.log(`Keine übereinstimmende Datei für Job-ID ${jouleEntry.Job_ID} (${jouleEntry.Job_Name}) gefunden.`);
            console.log(`  Path: ${jouleEntry.Path}`);
            missingFiles++;
        }
    }

    fileStream.end();
    console.log(`JSONL-Datei ${outputFile} wurde erstellt.`);
    console.log(`Verarbeitete Einträge: ${processedEntries}`);
    console.log(`Fehlende oder nicht verarbeitbare Dateien: ${missingFiles}`);
}

const codeDirectory = './code_snippets';
const jouleFile = './joule_values.csv';
const outputFile = 'outputCodeJoules.jsonl';

console.log('Skript gestartet');
createJSONLFile(codeDirectory, jouleFile, outputFile)
    .then(() => console.log('Skript erfolgreich beendet'))
    .catch(error => console.error('Fehler beim Erstellen der JSONL-Datei:', error));