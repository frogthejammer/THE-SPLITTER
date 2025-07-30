document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const allRows = [];

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

    rows.forEach(row => {
  // Combine all cell values into a single string
  const combinedValues = Object.values(row)
    .map(v => String(v).toLowerCase().trim())
    .join(' ');

  // Skip if it contains 'access denied' or mostly 'xxx'
  if (
    combinedValues.includes('access denied') ||
    combinedValues.replace(/xxx/g, '').trim() === ''
    
  ) {
    console.warn('Skipping junk row:', row);
    return;
    }

  // Otherwise, parse normally
  const parsedRow = { sheet: sheetName };

  Object.keys(row).forEach(key => {
    const raw = row[key];
    const values = String(raw)
      .split(/\r?\n/)
      .map(v => v.trim())
      .filter(v => v.length > 0);

    parsedRow[key.trim()] = values.length > 1 ? values : values[0];
  });

  allRows.push(parsedRow);
});

  });

  console.log(allRows); // You’ll see this in the browser console
});
