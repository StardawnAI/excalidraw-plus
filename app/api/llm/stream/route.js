import { NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';
export const runtime = 'edge';

/**
 * POST /api/llm/stream
 * Transparent proxy for LLM requests (frontend constructs complete messages)
 *
 * 两种模式：
 * - 本地配置模式：前端提供完整 config（包含 apiKey），不带访问密码
 * - 访问密码模式：前端通过请求头 x-access-password 证明身份，服务端读取环境变量中的 LLM 配置并自动注入 apiKey
 */
export async function POST(request) {
  try {
    const { config, messages } = await request.json();
    const accessPassword = request.headers.get('x-access-password') || '';
    const usingPassword = !!accessPassword;

    // 基本参数校验（messages 必须存在且为数组）
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing required parameters: messages' },
        { status: 400 },
      );
    }

    let finalConfig = null;

    if (usingPassword) {
      // 访问密码模式：优先使用服务端 LLM 配置，并校验访问密码
      const envPassword = process.env.ACCESS_PASSWORD;
      if (!envPassword) {
        return NextResponse.json(
          { error: 'Server access password not configured' },
          { status: 400 },
        );
      }

      if (accessPassword !== envPassword) {
        return NextResponse.json(
          { error: 'Invalid access password' },
          { status: 401 },
        );
      }

      const serverConfig = {
        type: process.env.SERVER_LLM_TYPE,
        baseUrl: process.env.SERVER_LLM_BASE_URL,
        apiKey: process.env.SERVER_LLM_API_KEY,
        model: process.env.SERVER_LLM_MODEL,
      };

      if (!serverConfig.type || !serverConfig.apiKey) {
        return NextResponse.json(
          { error: 'Incomplete server-side LLM configuration' },
          { status: 500 },
        );
      }

      finalConfig = serverConfig;
    } else {
      // 本地配置模式：必须由前端提供完整 config，包括 apiKey
      if (!config) {
        return NextResponse.json(
          { error: 'Missing required parameter: config' },
          { status: 400 },
        );
      }

      if (!config.type || !config.apiKey) {
        return NextResponse.json(
          { error: 'Invalid config: missing type or apiKey' },
          { status: 400 },
        );
      }

      finalConfig = config;
    }

    // Create SSE stream for transparent forwarding
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await callLLM(finalConfig, messages, (chunk) => {
            // Send each chunk as SSE
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          });

          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error in stream:', error);
          const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in /api/llm/stream:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stream LLM response' },
      { status: 500 },
    );
  }
}
