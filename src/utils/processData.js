import * as xlsx from 'xlsx';

export async function processExcelFile(filePath) {
  // Fetch the file using the provided path
  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();

  // Read the file as a workbook
  const workbook = xlsx.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert the sheet to JSON
  const jsonData = xlsx.utils.sheet_to_json(sheet);

  // Filter required columns
  const filteredData = jsonData.map((row) => ({
    Display: row['Display'],
    Locomotion: row['Locomotion'],
    'Body Movement Type': row['Body Movement Type'],
    'Locus of control': row['Locus of control'],
    'Encoding Channel': row['Encoding Channel'],
    Anchor: row['Anchor'],
    'Visual Mark': row['Visual Mark'],
    'Skipping Tool': row['Skipping Tool'],
    Overview: row['Overview'],
  }));
//   console.log('Processed Data:', filteredData);
  return filteredData;
}