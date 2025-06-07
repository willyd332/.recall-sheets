/**
 * AIHandler - Manages interactions with various AI APIs
 * Supports OpenAI, Anthropic, DeepSeek, and Google Gemini
 */

class AIHandler {
    constructor() {
        this.apiKey = null;
        this.provider = null;
        this.model = null;
        this.endpoints = {
            openai: 'https://api.openai.com/v1/chat/completions',
            anthropic: 'https://api.anthropic.com/v1/messages',
            deepseek: 'https://api.deepseek.com/v1/chat/completions',
            google: 'https://generativelanguage.googleapis.com/v1beta/models'
        };
    }

    /**
     * Sets the API configuration
     * @param {string} provider - The AI provider
     * @param {string} apiKey - The API key
     * @param {string} model - The model to use
     */
    configure(provider, apiKey, model) {
        this.provider = provider;
        this.apiKey = apiKey;
        this.model = model;
    }

    /**
     * Processes raw information into structured blocks
     * @param {string} information - Raw information to process
     * @param {string} inputPrompt - How to process the information
     * @param {string} contextPrompt - Context about the recall sheet
     * @returns {Promise<Array>} Array of processed information blocks
     */
    async processInformation(information, inputPrompt, contextPrompt) {
        const systemPrompt = `${contextPrompt}\n\nProcessing Instructions: ${inputPrompt}`;
        const userPrompt = `Process the following information according to the instructions. Break it into discrete, well-organized blocks of information. Return ONLY a valid JSON array where each element is a string containing one information block. No additional text or explanation.\n\nInformation to process:\n${information}`;
        
        const response = await this._makeAPICall(systemPrompt, userPrompt, true);
        
        try {
            // Clean the response - remove any markdown code blocks
            let cleanedResponse = response.trim();
            if (cleanedResponse.includes('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```/g, '');
            }
            if (cleanedResponse.includes('```')) {
                cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
            }
            
            // Parse the JSON array
            let blocks;
            try {
                blocks = JSON.parse(cleanedResponse);
            } catch (parseError) {
                // If parsing fails, try to extract JSON from the response
                const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    blocks = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Could not find valid JSON array in response');
                }
            }
            
            // Ensure it's an array
            if (!Array.isArray(blocks)) {
                throw new Error('Response is not an array');
            }
            
            // Convert to the expected format
            return blocks.map((content, index) => ({
                content: typeof content === 'string' ? content.trim() : JSON.stringify(content),
                metadata: {
                    createdAt: new Date().toISOString(),
                    index: index
                }
            }));
        } catch (error) {
            console.error('Error parsing AI response:', error);
            console.error('Raw response:', response);
            
            // Fallback: treat the entire response as a single block
            return [{
                content: response.trim(),
                metadata: {
                    createdAt: new Date().toISOString(),
                    index: 0
                }
            }];
        }
    }
    
    /**
     * Generates a question and answer from an information block
     * @param {Object} blockWithContext - Information block with surrounding context
     * @param {string} outputPrompt - How to generate questions
     * @param {string} contextPrompt - Context about the recall sheet
     * @returns {Promise<Object>} Object with question and answer
     */
    async generateQuestionAnswer(blockWithContext, outputPrompt, contextPrompt) {
        const systemPrompt = `${contextPrompt}\n\nQuestion Generation Instructions: ${outputPrompt}`;
        
        let contextInfo = '';
        if (blockWithContext.contextBefore.length > 0) {
            contextInfo += '\nPrevious context:\n' + blockWithContext.contextBefore.map(b => b.content).join('\n');
        }
        if (blockWithContext.contextAfter.length > 0) {
            contextInfo += '\nFollowing context:\n' + blockWithContext.contextAfter.map(b => b.content).join('\n');
        }
        
        const userPrompt = `Generate an active recall question and comprehensive answer based on the following information.${contextInfo}\n\nMain information:\n${blockWithContext.mainBlock.content}\n\nReturn ONLY valid JSON with the structure: {"question": "...", "answer": "..."}`;
        
        const response = await this._makeAPICall(systemPrompt, userPrompt, true);
        
        try {
            // Clean the response - remove any markdown code blocks
            let cleanedResponse = response.trim();
            if (cleanedResponse.includes('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```/g, '');
            }
            if (cleanedResponse.includes('```')) {
                cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
            }
            
            // Parse the JSON
            let qa;
            try {
                qa = JSON.parse(cleanedResponse);
            } catch (parseError) {
                // Try to extract JSON from the response
                const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    qa = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Could not find valid JSON in response');
                }
            }
            
            // Validate the response has required fields
            if (!qa.question || !qa.answer) {
                throw new Error('Response missing question or answer fields');
            }
            
            return qa;
        } catch (error) {
            console.error('Error parsing AI response:', error);
            console.error('Raw response:', response);
            
            // Fallback: create a simple question/answer
            return {
                question: "Can you explain the following concept in your own words: " + blockWithContext.mainBlock.content.substring(0, 100) + "...?",
                answer: blockWithContext.mainBlock.content
            };
        }
    }

    /**
     * Makes an API call to the configured provider
     * @private
     */
    async _makeAPICall(systemPrompt, userPrompt, extractContent = false) {
        if (!this.apiKey || !this.provider || !this.model) {
            throw new Error('AI Handler not configured');
        }

        switch (this.provider) {
            case 'openai':
                return this._callOpenAI(systemPrompt, userPrompt, extractContent);
            case 'anthropic':
                return this._callAnthropic(systemPrompt, userPrompt, extractContent);
            case 'deepseek':
                return this._callDeepSeek(systemPrompt, userPrompt, extractContent);
            case 'google':
                return this._callGoogle(systemPrompt, userPrompt, extractContent);
            default:
                throw new Error(`Unsupported provider: ${this.provider}`);
        }
    }

    /**
     * OpenAI API call
     * @private
     */
    async _callOpenAI(systemPrompt, userPrompt, extractContent = false) {
        const response = await fetch(this.endpoints.openai, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${error}`);
        }

        const data = await response.json();
        return extractContent ? data.choices[0].message.content : data;
    }

    /**
     * Anthropic API call
     * @private
     */
    async _callAnthropic(systemPrompt, userPrompt, extractContent = false) {
        const response = await fetch(this.endpoints.anthropic, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userPrompt + '\n\nPlease respond with valid JSON only.' }
                ],
                max_tokens: 4096,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error: ${error}`);
        }

        const data = await response.json();
        return extractContent ? data.content[0].text : data;
    }

    /**
     * DeepSeek API call
     * @private
     */
    async _callDeepSeek(systemPrompt, userPrompt, extractContent = false) {
        const response = await fetch(this.endpoints.deepseek, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`DeepSeek API error: ${error}`);
        }

        const data = await response.json();
        return extractContent ? data.choices[0].message.content : data;
    }

    /**
     * Google Gemini API call
     * @private
     */
    async _callGoogle(systemPrompt, userPrompt, extractContent = false) {
        const endpoint = `${this.endpoints.google}/${this.model}:generateContent?key=${this.apiKey}`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\n${userPrompt}\n\nRespond with valid JSON only.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Google API error: ${error}`);
        }

        const data = await response.json();
        return extractContent ? data.candidates[0].content.parts[0].text : data;
    }

    /**
     * Tests the API connection
     * @returns {Promise<boolean>} Whether the connection is successful
     */
    async testConnection() {
        try {
            const response = await this._makeAPICall(
                'You are a helpful assistant.',
                'Respond with JSON: {"status": "connected"}',
                true
            );
            
            // Clean the response - remove any markdown code blocks
            let cleanedResponse = response.trim();
            if (cleanedResponse.includes('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```/g, '');
            }
            if (cleanedResponse.includes('```')) {
                cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
            }
            
            // Try to parse the JSON
            let result;
            try {
                result = JSON.parse(cleanedResponse);
            } catch (parseError) {
                // Try to extract JSON from the response
                const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    result = JSON.parse(jsonMatch[0]);
                } else {
                    return false; // No valid JSON found
                }
            }
            
            return result.status === 'connected';
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
}

// Export for use in other scripts
window.AIHandler = AIHandler; 