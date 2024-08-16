class LexiconGenerator {
    constructor() {
        this.entries = [];
        this.currentPage = 1;
        this.entriesPerPage = 25; // Default entries per page
        this.filteredEntries = [];

        // Initialize the application
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            M.FormSelect.init(document.querySelectorAll('select'), {});
            M.updateTextFields(); // Ensure labels are updated

            this.loadEntriesFromLocalStorage();
            this.setupPagination();
            this.setupSorting();
            this.setupFiltering();
            this.updateEntriesList();
        });

        // Event listeners
        document.getElementById('fileInput').addEventListener('change', (event) => this.handleFileUpload(event));
        document.getElementById('csvFileInput').addEventListener('change', (event) => this.handleCSVUpload(event));
        document.getElementById('fileFormat').addEventListener('change', () => this.updateEntriesList());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadFile());
    }

    addEntry() {
        const grapheme = document.getElementById('grapheme').value.trim();
        const type = document.querySelector('input[name="type"]:checked').value;
        const value = document.getElementById('value').value.trim();

        if (grapheme && value) {
            this.entries.push({ grapheme, type, value });
            this.saveEntriesToLocalStorage();
            this.updateEntriesList();
            document.getElementById('inputForm').reset();
            document.querySelector('input[name="type"][value="phoneme"]').checked = true;
            M.updateTextFields(); // Ensure labels are updated
            M.FormSelect.init(document.querySelectorAll('select'), {}); // Reinitialize select elements
        } else {
            M.toast({html: 'All fields are required.', classes: 'rounded'});
        }
    }

    setupPagination() {
        const paginationSelect = document.getElementById('entriesPerPage');
        paginationSelect.addEventListener('change', () => {
            this.entriesPerPage = parseInt(paginationSelect.value);
            this.currentPage = 1;
            this.updateEntriesList();
        });
    }

    setupFiltering() {
        const searchInput = document.getElementById('searchInput');
        const typeFilter = document.getElementById('typeFilter');

        searchInput.addEventListener('input', () => this.updateEntriesList());
        typeFilter.addEventListener('change', () => this.updateEntriesList());
    }

    setupSorting() {
        const sortSelect = document.getElementById('sortSelect');
        sortSelect.addEventListener('change', () => this.updateEntriesList());
    }

    updateEntriesList() {
        this.filteredEntries = this.entries.filter(entry => {
            const searchQuery = document.getElementById('searchInput').value.toLowerCase();
            const filterType = document.getElementById('typeFilter').value;

            return (entry.grapheme.toLowerCase().includes(searchQuery) ||
                    entry.value.toLowerCase().includes(searchQuery)) &&
                   (filterType === 'all' || entry.type === filterType);
        });

        this.sortEntries();
        this.renderPagination();
        this.renderEntries();
    }

    sortEntries() {
        const sortOption = document.getElementById('sortSelect').value;
        this.filteredEntries.sort((a, b) => {
            if (a[sortOption] < b[sortOption]) return -1;
            if (a[sortOption] > b[sortOption]) return 1;
            return 0;
        });
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredEntries.length / this.entriesPerPage);
        let paginationHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<li class="page-item ${i === this.currentPage ? 'active' : ''}">
                <a href="#!" class="page-link" onclick="lexiconGen.changePage(${i})">${i}</a>
            </li>`;
        }

        document.getElementById('pagination').innerHTML = paginationHTML;
    }

    renderEntries() {
        const startIndex = (this.currentPage - 1) * this.entriesPerPage;
        const endIndex = Math.min(startIndex + this.entriesPerPage, this.filteredEntries.length);
        const entriesList = document.getElementById('entriesList');

        entriesList.innerHTML = '';
        for (let i = startIndex; i < endIndex; i++) {
            const entry = this.filteredEntries[i];
            const li = document.createElement('li');
            li.className = 'collection-item';
            li.innerHTML = `${entry.grapheme}: ${entry.type} - ${entry.value}
                            <a href="#!" class="secondary-content">
                                <i class="material-icons" onclick="lexiconGen.editEntry(${i})">edit</i>
                                <i class="material-icons" onclick="lexiconGen.removeEntry(${i})">delete</i>
                            </a>`;
            entriesList.appendChild(li);
        }
    }

    changePage(page) {
        this.currentPage = page;
        this.renderEntries();
    }

    editEntry(index) {
        const entry = this.filteredEntries[index];
        document.getElementById('grapheme').value = entry.grapheme;
        document.getElementById('value').value = entry.value;
        document.querySelector(`input[name="type"][value="${entry.type}"]`).checked = true;
        M.updateTextFields(); // Ensure labels are updated
        M.FormSelect.init(document.querySelectorAll('select'), {}); // Reinitialize select elements
        this.entries.splice(this.entries.indexOf(this.filteredEntries[index]), 1); // Remove the entry for re-adding with updated details
        this.saveEntriesToLocalStorage();
        this.updateEntriesList();
    }

    removeEntry(index) {
        this.entries.splice(this.entries.indexOf(this.filteredEntries[index]), 1);
        this.saveEntriesToLocalStorage();
        this.updateEntriesList();
    }

    generateXML() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<lexicon version="1.0">\n';

        this.entries.forEach(entry => {
            xml += `  <entry>\n`;
            xml += `    <grapheme>${this.escapeXML(entry.grapheme)}</grapheme>\n`;
            xml += `    <${entry.type}>${this.escapeXML(entry.value)}</${entry.type}>\n`;
            xml += `  </entry>\n`;
        });

        xml += '</lexicon>';
        return xml;
    }

    generatePLS() {
        // For .pls, use the same format as XML content
        return this.generateXML();
    }

    generateCSV() {
        let csv = 'Grapheme,Type,Value\n';

        this.entries.forEach(entry => {
            csv += `${entry.grapheme},${entry.type},${entry.value}\n`;
        });

        return csv;
    }

    escapeXML(unsafe) {
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

    downloadFile() {
        const format = document.getElementById('fileFormat').value;
        let content = '';
        let fileExtension = '';

        switch (format) {
            case 'xml':
                content = this.generateXML();
                fileExtension = 'xml';
                break;
            case 'pls':
                content = this.generatePLS();
                fileExtension = 'pls';
                break;
            case 'csv':
                content = this.generateCSV();
                fileExtension = 'csv';
                break;
        }

        const blob = new Blob([content], { type: `text/${format}` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lexicon.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    saveEntriesToLocalStorage() {
        localStorage.setItem('lexiconEntries', JSON.stringify(this.entries));
    }

    loadEntriesFromLocalStorage() {
        const storedEntries = localStorage.getItem('lexiconEntries');
        if (storedEntries) {
            this.entries.push(...JSON.parse(storedEntries));
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.type === 'application/xml' || file.name.endsWith('.xml')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const xmlString = e.target.result;
                    this.parseXML(xmlString);
                };
                reader.readAsText(file);
            } else {
                M.toast({html: 'Please upload a valid XML file with .xml extension.', classes: 'rounded'});
            }
        } else {
            M.toast({html: 'No file selected.', classes: 'rounded'});
        }
    }

    parseXML(xmlString) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "application/xml");

            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                M.toast({html: 'Invalid XML file. Please upload a correct XML file.', classes: 'rounded'});
                console.error('XML Parsing Error:', parserError.textContent); 
                return;
            }

            const entriesList = xmlDoc.getElementsByTagName("entry");
            this.entries.length = 0;

            for (let i = 0; i < entriesList.length; i++) {
                const entry = entriesList[i];
                const grapheme = entry.getElementsByTagName("grapheme")[0]?.textContent || '';
                const phoneme = entry.getElementsByTagName("phoneme")[0];
                const alias = entry.getElementsByTagName("alias")[0];

                let type = 'phoneme';
                let value = '';
                if (phoneme) {
                    value = phoneme.textContent;
                } else if (alias) {
                    type = 'alias';
                    value = alias.textContent;
                }

                this.entries.push({ grapheme, type, value });
            }

            this.saveEntriesToLocalStorage();
            this.updateEntriesList();
        } catch (error) {
            M.toast({html: 'Error parsing XML file.', classes: 'rounded'});
            console.error('Parsing Error:', error);
        }
    }

    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const csvString = e.target.result;
                    this.parseCSV(csvString);
                };
                reader.readAsText(file);
            } else {
                M.toast({html: 'Please upload a valid CSV file with .csv extension.', classes: 'rounded'});
            }
        } else {
            M.toast({html: 'No file selected.', classes: 'rounded'});
        }
    }

    parseCSV(csvString) {
        const lines = csvString.trim().split('\n');
        const headers = lines.shift().split(',');

        if (headers[0] !== 'Grapheme' || headers[1] !== 'Type' || headers[2] !== 'Value') {
            M.toast({html: 'Invalid CSV format.', classes: 'rounded'});
            return;
        }

        this.entries.length = 0;

        lines.forEach(line => {
            const [grapheme, type, value] = line.split(',');
            if (grapheme && type && value) {
                this.entries.push({ grapheme, type, value });
            }
        });

        this.saveEntriesToLocalStorage();
        this.updateEntriesList();
    }
}

// Instantiate the class
const lexiconGen = new LexiconGenerator();
