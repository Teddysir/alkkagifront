const BASE_URL = 'https://alkkagiback.shop/api/v1'

/**
 * Stream Chat with OpenAI via Backend
 * POST /chats/stream
 */
export const streamChat = async ({
    userInput,
    requestType,
    onChunk,
    onError,
    onComplete
}) => {
    try {
        const token = localStorage.getItem('Authorization')
        if (!token) throw new Error('No authorization token found')

        const response = await fetch(`${BASE_URL}/chats/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userInput,
                requestType
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            // Process buffer line by line
            const lines = buffer.split('\n')

            // Allow the last line to remain in buffer if incomplete
            // Note: In typical SSE, lines end with \n\n, but here we scan for data:
            buffer = lines.pop()

            for (const line of lines) {
                const trimmed = line.trim()
                if (trimmed.startsWith('data:')) {
                    // Extract content after "data:"
                    const content = trimmed.substring(5) // Remove "data:"
                    // Verify if there is a leading space to remove
                    // Backend example: "data: 케" -> content " 케"
                    // If we want exact text, we might strip the first space if present?
                    // Let's assume standard TextEventStream format "data: <content>"

                    if (onChunk) onChunk(content)
                }
            }
        }

        // Final flush if any
        if (buffer.trim().startsWith('data:')) {
            if (onChunk) onChunk(buffer.trim().substring(5))
        }

        if (onComplete) onComplete()

    } catch (error) {
        console.error('Chat Stream Error:', error)
        if (onError) onError(error)
    }
}
