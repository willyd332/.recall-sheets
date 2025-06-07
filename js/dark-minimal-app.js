/**
 * Dark Minimal App - Single Page Application for Recall Sheets
 */

// Initialize handlers
const recallFileHandler = new RecallFileHandler();
const aiHandler = new AIHandler();

// Current state
let currentView = 'landing';
let currentRecallData = null;
let sessionState = {
    active: false,
    currentIndex: undefined,
    currentQuestion: '',
    currentAnswer: ''
};

// Token tracking
let tokenStats = {
    inTokens: parseInt(localStorage.getItem('inTokens') || '0'),
    outTokens: parseInt(localStorage.getItem('outTokens') || '0')
};

// DOM Elements
const elements = {
    apiKeyInput: document.getElementById('apiKeyInput'),
    apiStatus: document.getElementById('apiStatus'),
    mainActions: document.getElementById('mainActions'),
    tokenTracker: document.getElementById('tokenTracker'),
    inTokens: document.getElementById('inTokens'),
    outTokens: document.getElementById('outTokens'),
    processingOverlay: document.getElementById('processingOverlay'),
    views: {
        landing: document.getElementById('landingView'),
        create: document.getElementById('createView'),
        edit: document.getElementById('editView'),
        launch: document.getElementById('launchView')
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Update token display
    updateTokenDisplay();
    
    // Check for existing API key
    const savedKey = localStorage.getItem('apiKey');
    if (savedKey) {
        elements.apiKeyInput.value = savedKey;
        validateAndShowActions();
    }
    
    // API key input handler
    elements.apiKeyInput.addEventListener('input', debounce(handleApiKeyInput, 500));
    
    // File upload handlers
    setupFileHandlers();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);
});

// Token Tracking
function updateTokenDisplay() {
    elements.inTokens.textContent = tokenStats.inTokens.toLocaleString();
    elements.outTokens.textContent = tokenStats.outTokens.toLocaleString();
}

function addTokens(inTokens, outTokens) {
    // Update stats
    tokenStats.inTokens += inTokens;
    tokenStats.outTokens += outTokens;
    
    // Save to localStorage
    localStorage.setItem('inTokens', tokenStats.inTokens.toString());
    localStorage.setItem('outTokens', tokenStats.outTokens.toString());
    
    // Animate update
    elements.inTokens.classList.add('pulse');
    elements.outTokens.classList.add('pulse');
    
    setTimeout(() => {
        elements.inTokens.classList.remove('pulse');
        elements.outTokens.classList.remove('pulse');
    }, 300);
    
    updateTokenDisplay();
}

// API Key Handling
async function handleApiKeyInput() {
    const apiKey = elements.apiKeyInput.value.trim();
    
    if (!apiKey) {
        elements.apiStatus.textContent = '';
        elements.apiStatus.classList.remove('show');
        return;
    }
    
    // Detect provider from key format
    const provider = detectProvider(apiKey);
    if (!provider) {
        elements.apiStatus.textContent = 'invalid key format';
        elements.apiStatus.classList.add('show');
        return;
    }
    
    // Show validating status
    elements.apiStatus.textContent = 'validating...';
    elements.apiStatus.classList.add('show');
    
    // Validate key
    const isValid = await validateApiKey(apiKey, provider);
    
    if (isValid) {
        // Save configuration
        localStorage.setItem('apiKey', apiKey);
        localStorage.setItem('apiProvider', provider.name);
        localStorage.setItem('apiModel', provider.defaultModel);
        
        // Configure AI handler
        aiHandler.configure(provider.name, apiKey, provider.defaultModel);
        
        // Show success and actions
        elements.apiStatus.textContent = '✓ connected';
        
        // Show token tracker
        elements.tokenTracker.classList.add('visible');
        
        setTimeout(() => {
            elements.apiStatus.classList.remove('show');
            showMainActions();
        }, 1000);
    } else {
        elements.apiStatus.textContent = 'connection failed';
    }
}

function detectProvider(apiKey) {
    if (apiKey.startsWith('sk-') && !apiKey.startsWith('sk-ant-')) {
        return { name: 'openai', defaultModel: 'gpt-4o-mini' };
    } else if (apiKey.startsWith('sk-ant-')) {
        return { name: 'anthropic', defaultModel: 'claude-3-5-haiku-20241022' };
    } else if (apiKey.length === 32) { // DeepSeek keys are typically 32 chars
        return { name: 'deepseek', defaultModel: 'deepseek-chat' };
    } else if (apiKey.startsWith('AI')) { // Google API keys
        return { name: 'google', defaultModel: 'gemini-1.5-flash' };
    }
    return null;
}

async function validateApiKey(apiKey, provider) {
    try {
        aiHandler.configure(provider.name, apiKey, provider.defaultModel);
        return await aiHandler.testConnection();
    } catch (error) {
        console.error('API validation error:', error);
        return false;
    }
}

function validateAndShowActions() {
    const apiKey = elements.apiKeyInput.value.trim();
    if (apiKey) {
        handleApiKeyInput();
    }
}

function showMainActions() {
    elements.mainActions.classList.remove('hidden');
    setTimeout(() => {
        elements.mainActions.classList.add('show');
    }, 50);
}

// View Management
window.showView = function(viewName) {
    // Hide all views
    Object.values(elements.views).forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    setTimeout(() => {
        elements.views[viewName].classList.add('active');
        currentView = viewName;
    }, 300);
};

// Create View Functions
window.downloadRecall = function() {
    const title = document.getElementById('createTitle').value.trim() || 'untitled';
    const context = document.getElementById('createContext').value.trim();
    const ingest = document.getElementById('createIngest').value.trim();
    const digest = document.getElementById('createDigest').value.trim();
    
    if (!context || !ingest || !digest) {
        alert('Please fill in all fields');
        return;
    }
    
    // Create recall data
    const recallData = recallFileHandler.createNewRecallData(title);
    recallData.contextPrompt = context;
    recallData.inputPrompt = ingest;
    recallData.outputPrompt = digest;
    
    // Save file
    const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    recallFileHandler.saveToFile(recallData, filename);
    
    // Load into edit view
    currentRecallData = recallData;
    loadIntoEditView(recallData);
    showView('edit');
};

// Edit View Functions
function setupFileHandlers() {
    // Edit upload
    const editZone = document.getElementById('editUploadZone');
    const editInput = document.getElementById('editFileInput');
    
    editZone.addEventListener('click', () => editInput.click());
    editZone.addEventListener('dragover', handleDragOver);
    editZone.addEventListener('dragleave', handleDragLeave);
    editZone.addEventListener('drop', (e) => handleDrop(e, 'edit'));
    editInput.addEventListener('change', (e) => handleFileSelect(e, 'edit'));
    
    // Launch upload
    const launchZone = document.getElementById('launchUpload');
    const launchInput = document.getElementById('launchFileInput');
    
    launchZone.addEventListener('click', () => launchInput.click());
    launchZone.addEventListener('dragover', handleDragOver);
    launchZone.addEventListener('dragleave', handleDragLeave);
    launchZone.addEventListener('drop', (e) => handleDrop(e, 'launch'));
    launchInput.addEventListener('change', (e) => handleFileSelect(e, 'launch'));
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'var(--accent)';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'var(--border)';
}

function handleDrop(e, mode) {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'var(--border)';
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.recall')) {
        readRecallFile(file, mode);
    }
}

function handleFileSelect(e, mode) {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.recall')) {
        readRecallFile(file, mode);
    }
}

function readRecallFile(file, mode) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const recallData = recallFileHandler.parseRecallFile(content);
            currentRecallData = recallData;
            
            if (mode === 'edit') {
                loadIntoEditView(recallData);
            } else if (mode === 'launch') {
                loadIntoLaunchView(recallData);
            }
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function loadIntoEditView(recallData) {
    const editUploadZone = document.getElementById('editUploadZone');
    const editContent = document.getElementById('editContent');
    
    // Hide upload zone and show edit content
    editUploadZone.style.display = 'none';
    editContent.style.display = 'block';
    editContent.classList.remove('hidden');
    editContent.classList.add('show');
    
    // Populate fields
    document.getElementById('editTitle').value = recallData.title;
    document.getElementById('editContext').value = recallData.contextPrompt;
    document.getElementById('editIngest').value = recallData.inputPrompt;
    document.getElementById('editDigest').value = recallData.outputPrompt;
    
    // Show existing blocks
    renderInfoBlocks();
    
    // Show info blocks container if there are blocks, but keep collapsed
    const container = document.querySelector('.info-blocks-container');
    const infoBlocks = document.getElementById('infoBlocks');
    const collapseBtn = document.getElementById('collapseBtn');
    
    if (recallData.information && recallData.information.length > 0) {
        container.style.display = 'block';
        // Ensure blocks start collapsed
        infoBlocks.style.display = 'none';
        collapseBtn.classList.add('collapsed');
        collapseBtn.textContent = '▶';
    } else {
        container.style.display = 'none';
    }
}

function collapsePromptCards() {
    document.getElementById('contextCard').classList.add('collapsed');
    document.getElementById('ingestCard').classList.add('collapsed');
    document.getElementById('digestCard').classList.add('collapsed');
}

function expandPromptCards() {
    document.getElementById('contextCard').classList.remove('collapsed');
    document.getElementById('ingestCard').classList.remove('collapsed');
    document.getElementById('digestCard').classList.remove('collapsed');
}

window.processInfo = async function() {
    const information = document.getElementById('ingestInfo').value.trim();
    if (!information) return;
    
    // Collapse cards and show processing overlay
    collapsePromptCards();
    showProcessingOverlay('Ingesting information...');
    
    try {
        // Estimate tokens for input
        const inputLength = information.length + currentRecallData.inputPrompt.length + currentRecallData.contextPrompt.length;
        const estimatedInTokens = Math.ceil(inputLength / 4);
        
        const processedBlocks = await aiHandler.processInformation(
            information,
            currentRecallData.inputPrompt,
            currentRecallData.contextPrompt
        );
        
        // Estimate output tokens
        const outputLength = processedBlocks.reduce((sum, block) => sum + block.content.length, 0);
        const estimatedOutTokens = Math.ceil(outputLength / 4);
        
        // Update token tracking
        addTokens(estimatedInTokens, estimatedOutTokens);
        
        // Add to recall data
        processedBlocks.forEach(block => {
            currentRecallData.information.push({
                id: Date.now() + Math.random(),
                content: block.content
            });
        });
        
        // Clear input and render
        document.getElementById('ingestInfo').value = '';
        renderInfoBlocks();
        
        // Auto-expand when NEW blocks are added
        const infoBlocks = document.getElementById('infoBlocks');
        if (infoBlocks.style.display === 'none') {
            toggleInfoBlocks();
        }
        
    } catch (error) {
        alert('Processing error: ' + error.message);
    } finally {
        // Hide processing overlay and expand cards
        hideProcessingOverlay();
        expandPromptCards();
    }
};

// Toggle info blocks visibility
window.toggleInfoBlocks = function() {
    const infoBlocks = document.getElementById('infoBlocks');
    const collapseBtn = document.getElementById('collapseBtn');
    
    if (infoBlocks.style.display === 'none') {
        infoBlocks.style.display = 'grid';
        collapseBtn.classList.remove('collapsed');
        collapseBtn.textContent = '▼';
    } else {
        infoBlocks.style.display = 'none';
        collapseBtn.classList.add('collapsed');
        collapseBtn.textContent = '▶';
    }
};

function renderInfoBlocks() {
    const container = document.getElementById('infoBlocks');
    const containerWrapper = document.querySelector('.info-blocks-container');
    const blocks = currentRecallData?.information || [];
    
    container.innerHTML = blocks.map((block, index) => `
        <div class="info-block" style="animation-delay: ${index * 0.1}s">
            ${block.content}
            <button onclick="removeBlock(${block.id})">×</button>
        </div>
    `).join('');
    
    // Show/hide container based on blocks
    if (blocks.length > 0) {
        containerWrapper.style.display = 'block';
        // Don't auto-expand - let user decide when to open
    } else {
        containerWrapper.style.display = 'none';
    }
}

window.removeBlock = function(blockId) {
    currentRecallData.information = currentRecallData.information.filter(b => b.id != blockId);
    renderInfoBlocks();
};

window.downloadEdited = function() {
    // Update data
    currentRecallData.title = document.getElementById('editTitle').value;
    currentRecallData.contextPrompt = document.getElementById('editContext').value;
    currentRecallData.inputPrompt = document.getElementById('editIngest').value;
    currentRecallData.outputPrompt = document.getElementById('editDigest').value;
    currentRecallData.dateLastEdited = new Date().toISOString();
    
    // Save file
    const filename = currentRecallData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    recallFileHandler.saveToFile(currentRecallData, filename);
};

window.launchFromEdit = function() {
    loadIntoLaunchView(currentRecallData);
    showView('launch');
};

// Launch View Functions
function loadIntoLaunchView(recallData) {
    const uploadZone = document.getElementById('launchUpload');
    const launchReady = document.getElementById('launchReady');
    
    uploadZone.classList.add('has-file');
    uploadZone.querySelector('p').textContent = recallData.title;
    
    setTimeout(() => {
        uploadZone.classList.add('hidden');
        launchReady.classList.remove('hidden');
        launchReady.style.display = 'block';
    }, 800);
}

window.startSession = function() {
    // Get elements
    const launchReadyDiv = document.getElementById('launchReady');
    const sessionContent = document.getElementById('sessionContent');
    
    // Immediately hide the launch button container
    launchReadyDiv.style.display = 'none';
    
    // Show session content
    sessionContent.classList.remove('hidden');
    
    // Show processing overlay with custom message
    showProcessingOverlay('Creating question...');
    
    // Start session
    sessionState.active = true;
    
    // Run async question generation
    setTimeout(() => {
        nextQuestion();
    }, 100); // Small delay to ensure UI updates
};

async function nextQuestion() {
    // Clear previous question
    const questionEl = document.getElementById('questionText');
    const sessionHint = document.getElementById('sessionHint');
    
    // Hide hint initially
    sessionHint.classList.remove('visible');
    
    // Clear typing class from previous question
    questionEl.classList.remove('typing');
    questionEl.textContent = '';
    
    // Show processing overlay for subsequent questions
    if (sessionState.currentIndex !== undefined) {
        showProcessingOverlay('Creating question...');
    }
    
    // Get random block
    const blocks = currentRecallData.information;
    if (!blocks.length) return;
    
    sessionState.currentIndex = Math.floor(Math.random() * blocks.length);
    const block = blocks[sessionState.currentIndex];
    
    // Get context
    const context = {
        mainBlock: block,
        contextBefore: blocks.slice(Math.max(0, sessionState.currentIndex - 2), sessionState.currentIndex),
        contextAfter: blocks.slice(sessionState.currentIndex + 1, sessionState.currentIndex + 3)
    };
    
    // Generate Q&A
    try {
        // Estimate tokens
        const contextLength = JSON.stringify(context).length + currentRecallData.outputPrompt.length + currentRecallData.contextPrompt.length;
        const estimatedInTokens = Math.ceil(contextLength / 4);
        
        const qa = await aiHandler.generateQuestionAnswer(
            context,
            currentRecallData.outputPrompt,
            currentRecallData.contextPrompt
        );
        
        // Estimate output tokens
        const estimatedOutTokens = Math.ceil((qa.question.length + qa.answer.length) / 4);
        
        // Update token tracking
        addTokens(estimatedInTokens, estimatedOutTokens);
        
        sessionState.currentQuestion = qa.question;
        sessionState.currentAnswer = qa.answer;
        
        // Hide processing overlay before typing
        hideProcessingOverlay();
        
        // Type out question
        await typeText(qa.question, 'questionText');
        
        // Show hint after text appears
        sessionHint.classList.add('visible');
        
    } catch (error) {
        console.error('Question generation error:', error);
        hideProcessingOverlay();
        questionEl.textContent = 'Error generating question. Press Enter to try another.';
        questionEl.classList.add('typing'); // Add typing class for error state too
        sessionHint.classList.add('visible');
    }
}

async function typeText(text, elementId) {
    const element = document.getElementById(elementId);
    element.textContent = '';
    element.classList.add('typing');
    
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
        element.textContent += (i > 0 ? ' ' : '') + words[i];
        await sleep(50 + Math.random() * 50); // Variable typing speed
    }
}

// Keyboard handling
function handleKeyPress(e) {
    if (currentView === 'launch' && sessionState.active && e.key === 'Enter') {
        // Only respond to Enter if text has been typed
        const questionEl = document.getElementById('questionText');
        if (questionEl.classList.contains('typing')) {
            const answerBox = document.getElementById('answerBox');
            
            if (answerBox.classList.contains('hidden')) {
                // Show answer
                document.getElementById('answerText').textContent = sessionState.currentAnswer;
                answerBox.classList.remove('hidden');
                setTimeout(() => answerBox.classList.add('show'), 50);
            } else {
                // Next question
                answerBox.classList.remove('show');
                answerBox.classList.add('hidden');
                nextQuestion();
            }
        }
    }
}

// Utilities
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Processing overlay helpers
function showProcessingOverlay(message) {
    const overlay = elements.processingOverlay;
    overlay.innerHTML = `
        <div class="processing-content">
            ${message ? `<div class="processing-message">${message}</div>` : ''}
            <div class="glowing-bar"></div>
        </div>
    `;
    overlay.classList.add('active');
}

function hideProcessingOverlay() {
    elements.processingOverlay.classList.remove('active');
} 