const documents = response.documents;

const specificAttributes = documents.map(doc => ({
    Source: doc.Source,
    name: doc.Name,
}));

const responses = await Promise.all(specificAttributes.map(async attr => {
    const Source = attr.Source;
    const name = attr.name;

    const prompt = `Please visit the following URL: ${Source} and provide a concise summary of the content on that webpage. Focus on the key points, main arguments, and any relevant details or conclusions. The summary should be clear and easy to understand.`; /// Prompt for GPT-3

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
        });

        console.log('OpenAI API response:', response); // Log the response from OpenAI API

        // Check if the response structure is as expected
        if (response.choices && response.choices.length > 0 && response.choices[0].message && response.choices[0].message.content) {
            const gptOutput = response.choices[0].message.content;

            // Insert the summary into the new collection
            const document = await db.createDocument(DB_ID, COLLECTION_ID_SUMMARIES, 'unique()', {
                userId: userId,
                Source: Source,
                name: name,
                summary: gptOutput,
            });

            console.log('Document created in Appwrite:', document); // Log the document creation response

            return { ok: true, completion: gptOutput }; /// Return the completion
        } else {
            console.error('Unexpected response structure from OpenAI API:', response);
            return { ok: false, error: 'Unexpected response structure from OpenAI API', details: response };
        }
    } catch (error) {
        console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message); // Log detailed error from OpenAI API
        return { ok: false, error: 'Error calling OpenAI API', details: error.response ? error.response.data : error.message };
    }
}));