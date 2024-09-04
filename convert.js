// Dieses Script convertiert eine Input,output.csv Datei in das jsonl Format, welches für https://platform.openai.com/finetune gebraucht wird.
// Written by Achim Mertens (with perplexity) in September 2024
// $ npm install csv-parser
// $ node convert.js
const fs = require('fs');
const csv = require('csv-parser');
// Funktion zum Erstellen eines JSONL-Eintrags
function createJSONLEntry(input, output) {
  return JSON.stringify({
    messages: [
      {
        role: "system",
        content: "Your name is GreenCodeBot. You answer always polite. Your audience are software developers. Give them correct and factual answers."
      },
      {
        role: "user",
        content: input
      },
      {
        role: "assistant",
        content: output
      }
    ]
  });
}
// Hauptfunktion zur Konvertierung
function convertCSVtoJSONL(inputFile, outputFile) {
  const writeStream = fs.createWriteStream(outputFile);
  
  fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (row) => {
      const jsonlEntry = createJSONLEntry(row.input, row.output);
      writeStream.write(jsonlEntry + '\n');
    })
    .on('end', () => {
      writeStream.end();
      console.log('CSV to JSONL conversion completed.');
    });
}
// Beispielaufruf
const inputFile = 'inputOutput.csv';
const outputFile = 'output.jsonl';
convertCSVtoJSONL(inputFile, outputFile);
