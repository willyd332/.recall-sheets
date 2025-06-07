/**
 * RecallFileHandler - Manages .recall file operations
 * Handles parsing, creating, saving, and loading .recall files
 */

class RecallFileHandler {
    constructor() {
        this.currentRecallData = null;
        this.defaultPrompts = {
            context: "This recall sheet contains information for practicing active recall. Active recall is the process of actively retrieving information from memory, rather than passively recognizing it. This strengthens neural pathways and improves long-term retention. The information in this sheet should be used to generate questions that require genuine thought and synthesis, not mere recognition.",
            input: "New information should be parsed into discrete, atomic ideas. Each piece of information should be clear, concise, and self-contained, typically no more than one paragraph. Information should be organized so that related concepts are grouped together. Focus on key concepts, relationships, and understanding rather than rote memorization.",
            output: "Generate questions that promote active recall rather than recognition. Instead of asking for definitions or simple facts, create questions that require the learner to explain, apply, synthesize, or analyze the information. Questions should encourage deep understanding and the ability to connect ideas. For example, instead of 'What is X?', ask 'How would you explain X to someone unfamiliar with the topic?' or 'What would happen if X were different?'"
        };
    }

    /**
     * Creates a new recall file structure with default or custom prompts
     * @param {string} title - The title of the recall sheet
     * @param {Object} prompts - Optional custom prompts
     * @returns {Object} New recall data structure
     */
    createNewRecallData(title, prompts = {}) {
        const now = new Date().toISOString();
        return {
            title: title || "Untitled Recall Sheet",
            dateLastEdited: now,
            contextPrompt: prompts.context || this.defaultPrompts.context,
            inputPrompt: prompts.input || this.defaultPrompts.input,
            outputPrompt: prompts.output || this.defaultPrompts.output,
            information: []
        };
    }

    /**
     * Parses a .recall file content into structured data
     * @param {string} fileContent - The raw content of the .recall file
     * @returns {Object} Parsed recall data
     */
    parseRecallFile(fileContent) {
        try {
            const lines = fileContent.split('\n');
            const data = {
                title: '',
                dateLastEdited: '',
                contextPrompt: '',
                inputPrompt: '',
                outputPrompt: '',
                information: []
            };

            let currentSection = '';
            let sectionContent = [];
            let foundSeparator = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // First line is title
                if (i === 0) {
                    data.title = line;
                    continue;
                }

                // Second line is date
                if (i === 1) {
                    data.dateLastEdited = line;
                    continue;
                }

                // Look for section separators
                if (line === '=======') {
                    if (!foundSeparator) {
                        foundSeparator = true;
                        currentSection = 'context';
                    } else {
                        // Save previous section content
                        this._saveSection(data, currentSection, sectionContent.join('\n'));
                        sectionContent = [];

                        // Determine next section
                        if (currentSection === 'context') currentSection = 'input';
                        else if (currentSection === 'input') currentSection = 'output';
                        else if (currentSection === 'output') currentSection = 'json';
                    }
                    continue;
                }

                // Collect section content
                if (foundSeparator) {
                    sectionContent.push(lines[i]); // Keep original formatting
                }
            }

            // Save the last section
            if (sectionContent.length > 0) {
                this._saveSection(data, currentSection, sectionContent.join('\n'));
            }

            this.currentRecallData = data;
            return data;
        } catch (error) {
            console.error('Error parsing recall file:', error);
            throw new Error('Invalid .recall file format');
        }
    }

    /**
     * Helper method to save section content to the appropriate field
     * @private
     */
    _saveSection(data, section, content) {
        switch (section) {
            case 'context':
                data.contextPrompt = content.trim();
                break;
            case 'input':
                data.inputPrompt = content.trim();
                break;
            case 'output':
                data.outputPrompt = content.trim();
                break;
            case 'json':
                try {
                    data.information = JSON.parse(content.trim());
                } catch (e) {
                    console.error('Error parsing JSON information:', e);
                    data.information = [];
                }
                break;
        }
    }

    /**
     * Formats recall data into .recall file format
     * @param {Object} recallData - The recall data to format
     * @returns {string} Formatted .recall file content
     */
    formatRecallFile(recallData) {
        const parts = [
            recallData.title,
            recallData.dateLastEdited || new Date().toISOString(),
            '=======',
            recallData.contextPrompt,
            '=======',
            recallData.inputPrompt,
            '=======',
            recallData.outputPrompt,
            '=======',
            JSON.stringify(recallData.information, null, 2)
        ];

        return parts.join('\n');
    }

    /**
     * Adds a new information block to the current recall data
     * @param {Object} infoBlock - The information block to add
     */
    addInformationBlock(infoBlock) {
        if (!this.currentRecallData) {
            throw new Error('No recall data loaded');
        }

        const newBlock = {
            id: Date.now(), // Simple ID generation
            content: infoBlock.content,
            metadata: infoBlock.metadata || {}
        };

        this.currentRecallData.information.push(newBlock);
        this.currentRecallData.dateLastEdited = new Date().toISOString();
    }

    /**
     * Removes an information block by ID
     * @param {number} blockId - The ID of the block to remove
     */
    removeInformationBlock(blockId) {
        if (!this.currentRecallData) {
            throw new Error('No recall data loaded');
        }

        this.currentRecallData.information = this.currentRecallData.information
            .filter(block => block.id !== blockId);
        this.currentRecallData.dateLastEdited = new Date().toISOString();
    }

    /**
     * Duplicates the current recall structure without the information
     * @returns {Object} Duplicated structure with empty information array
     */
    duplicateStructure() {
        if (!this.currentRecallData) {
            throw new Error('No recall data loaded');
        }

        return {
            title: this.currentRecallData.title + " (Copy)",
            dateLastEdited: new Date().toISOString(),
            contextPrompt: this.currentRecallData.contextPrompt,
            inputPrompt: this.currentRecallData.inputPrompt,
            outputPrompt: this.currentRecallData.outputPrompt,
            information: []
        };
    }

    /**
     * Saves recall data as a .recall file
     * @param {Object} recallData - The recall data to save
     * @param {string} filename - The filename (without extension)
     */
    saveToFile(recallData, filename) {
        const content = this.formatRecallFile(recallData);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.recall`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Validates recall data structure
     * @param {Object} data - The data to validate
     * @returns {boolean} Whether the data is valid
     */
    validateRecallData(data) {
        return data &&
            typeof data.title === 'string' &&
            typeof data.contextPrompt === 'string' &&
            typeof data.inputPrompt === 'string' &&
            typeof data.outputPrompt === 'string' &&
            Array.isArray(data.information);
    }

    /**
     * Gets a random information block from the current recall data
     * @returns {Object} Random information block with index
     */
    getRandomInformationBlock() {
        if (!this.currentRecallData || this.currentRecallData.information.length === 0) {
            return null;
        }

        const index = Math.floor(Math.random() * this.currentRecallData.information.length);
        return {
            block: this.currentRecallData.information[index],
            index: index,
            total: this.currentRecallData.information.length
        };
    }

    /**
     * Gets an information block by index with surrounding context
     * @param {number} index - The index of the block to retrieve
     * @param {number} contextSize - Number of surrounding blocks to include
     * @returns {Object} Information block with context
     */
    getInformationBlockWithContext(index, contextSize = 2) {
        if (!this.currentRecallData || index >= this.currentRecallData.information.length) {
            return null;
        }

        const info = this.currentRecallData.information;
        const startIdx = Math.max(0, index - contextSize);
        const endIdx = Math.min(info.length - 1, index + contextSize);

        return {
            mainBlock: info[index],
            contextBefore: info.slice(startIdx, index),
            contextAfter: info.slice(index + 1, endIdx + 1),
            index: index,
            total: info.length
        };
    }
}

// Export for use in other scripts
window.RecallFileHandler = RecallFileHandler; 