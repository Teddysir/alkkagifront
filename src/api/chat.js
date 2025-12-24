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
        let token = localStorage.getItem('Authorization');
        if (!token) throw new Error('No authorization token found');

        // 🟢 수정 포인트 1: Bearer 중복 방지 로직
        // 토큰 자체가 'Bearer '로 시작하면 그대로 쓰고, 아니면 앞에 붙여줍니다.
        const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

        const response = await fetch(`${BASE_URL}/chats/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader // 🟢 수정됨
            },
            body: JSON.stringify({
                userInput,
                requestType
            })
        });

        if (!response.ok) {
            // 401이나 500 에러 발생 시 로그 확인을 위해 상태 코드 포함
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data:')) {
                    const content = trimmed.substring(5);

                    // User Request: If content is empty/whitespace, treat as double newline
                    if (!content.trim()) {
                        if (onChunk) onChunk('\n\n');
                    } else {
                        if (onChunk) onChunk(content);
                    }
                }
            }
        }

        if (onComplete) onComplete();

    } catch (error) {
        console.error('Chat Stream Error:', error);
        if (onError) onError(error);
    }
}