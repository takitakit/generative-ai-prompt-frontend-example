import Anthropic from '@anthropic-ai/sdk';
import { AnthropicStream, StreamingTextResponse } from 'ai';
 
// Create an Anthropic API client (that's edge friendly)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});
 
// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const { messages }: {messages: Anthropic.Messages.MessageParam[]} = await req.json();

  let system = '';
  const filteredMessages = messages.filter((m, index) => {
    const isTargetRole = m.role === 'user' || m.role === 'assistant';
    // 削除対象であればsystemにそのcontentを保持しますが、
    // 最後に該当するものだけが必要なため、毎回更新します。
    if (!isTargetRole) {
      system = m.content as string;
    }
    return isTargetRole;
  });

  // Ask Claude for a streaming chat completion given the prompt
  const response = await anthropic.messages.create({
    messages: filteredMessages,
    system,
    model: 'claude-3-opus-20240229',
    stream: true,
    max_tokens: 2000,
  });

  console.log('claude-sonnet response', system, messages);
 
  // Convert the response into a friendly text-stream
  const stream = AnthropicStream(response);
 
  // Respond with the stream
  return new StreamingTextResponse(stream);
}