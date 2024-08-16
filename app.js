const entries = [];

function addEntry() {
    const grapheme = document.getElementById('grapheme').value.trim();
    const phoneme = document.getElementById('phoneme').value.trim();

    if (grapheme && phoneme) {
        entries.push({ grapheme, phoneme });
        updateEntriesList();
        document.getElementById('inputForm').reset();
    } else {
        alert('Both fields are required.');
    }
}

function updateEntriesList() {
    const entriesList = document.getElementById('entriesList');
    entriesList.innerHTML = '';
    entries.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.grapheme}: ${entry.phoneme}`;
        entriesList.appendChild(li);
    });
}

function generateXML() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<lexicon version="1.0">\n';
    
    entries.forEach(entry => {
        xml += `  <entry>\n`;
        xml += `    <grapheme>${escapeXML(entry.grapheme)}</grapheme>\n`;
        xml += `    <phoneme>${escapeXML(entry.phoneme)}</phoneme>\n`;
        xml += `  </entry>\n`;
    });
    
    xml += '</lexicon>';
    return xml;
}

function escapeXML(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function downloadXML() {
    const xml = generateXML();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lexicon.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
