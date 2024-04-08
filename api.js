async function sendMessageToAPI(message) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'YOUR_API_KEY'
      },
      body: JSON.stringify({ message })
    });

    if (response.ok) {
      const data = await response.json();
      const claudeResponse = data.response;
      
      // Display Claude's response as a chat message
      claude.sendMsg(claudeResponse);

      // Update Claude's character behavior and movement
      claudeAI();
    } else {
      console.error('Error:', response.status);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}