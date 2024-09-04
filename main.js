const responses = await Promise.all(specificAttributes.map(async attr => {
    const Source = attr.Source;
    const name = attr.name; 
  
    const prompt = `Please visit the following URL: ${Source} and provide a concise summary of the content on that webpage. Focus on the key points, main arguments, and any relevant details or conclusions. The summary should be clear and easy to understand.` ///Prompt for GPT-3
  
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS ?? '512'),
        messages: [{ role: 'user', content: prompt }],
      });
      const gptOutput = response.choices[0].message.content; // Define gptOutput here
  
      const result = await db.createDocument(
        DB_ID,
        COLLECTION_ID_POSTS,
        ID.unique(),
        {
          creator: '66d79ff1003613b53ce1',
          caption: gptOutput,
          location: Source,
        }
      );
      return result; // Return the entire response object
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return { ok: false, error: 'Internal Server Error' }
    }
  }));