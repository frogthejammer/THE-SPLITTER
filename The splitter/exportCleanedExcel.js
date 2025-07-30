document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const cleanedRows = [];

  // Define which columns to normalize across multiple defendants
  const defendantFields = ['age_group', 'sex', 'race_ethnicity', 'residence'];

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

    rows.forEach(row => {
      const combinedValues = Object.values(row)
        .map(v => String(v).toLowerCase().trim())
        .join(' ');

      if (
        combinedValues.includes('access denied') ||
        combinedValues.replace(/xxx/g, '').trim() === '' ||
        combinedValues.includes('test case')
      ) {
        console.warn('Skipping junk row:', row);
        return;
      }

      const normalizedData = {};
      const otherFields = {};

      // Separate and normalize field values
      Object.keys(row).forEach(key => {
        const raw = String(row[key]);
        const splitValues = raw
          .split(/[\r\n;]+/)
          .map(v => v.trim())
          .filter(v => v.length > 0);

        if (defendantFields.includes(key.trim().toLowerCase())) {
          normalizedData[key.trim()] = splitValues;
        } else {
          otherFields[key.trim()] = raw.trim();
        }
      });

      // Determine number of defendants from max array length
      const numDefendants = Math.max(
        1,
        ...Object.values(normalizedData).map(arr => arr.length)
      );

      for (let i = 0; i < numDefendants; i++) {
        const newRow = { ...otherFields };

        // Fill normalized fields per defendant, or empty string if missing
        for (const field of Object.keys(normalizedData)) {
          newRow[field] = normalizedData[field][i] ?? '';
        }

        cleanedRows.push(newRow);
      }
    });
  });

  const newWb = XLSX.utils.book_new();
  const newSheet = XLSX.utils.json_to_sheet(cleanedRows);
  XLSX.utils.book_append_sheet(newWb, newSheet, 'Cleaned Data');
  XLSX.writeFile(newWb, 'cleaned_output.xlsx');
});
