import { NextResponse } from 'next/server';
export const runtime = 'edge';

/**
 * POST /api/llm/config
 * Validate access password and return **sanitized** server-side LLM configuration
 * - 前端只需要类型 / 基础 URL / 模型等非敏感信息
 * - apiKey 仅在服务端使用，不会返回给前端
 */
export async function POST(request) {
  try {
    const accessPassword = request.headers.get('x-access-password');

    // 1. Check if access password is configured on server
    const envPassword = process.env.ACCESS_PASSWORD;
    if (!envPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server access password not configured'
        },
        { status: 400 }
      );
    }

    // 2. Validate access password
    if (!accessPassword || accessPassword !== envPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid access password'
        },
        { status: 401 }
      );
    }

    // 3. Build server-side LLM configuration（包含敏感字段，仅供服务端内部使用）
    const serverConfig = {
      type: process.env.SERVER_LLM_TYPE,
      baseUrl: process.env.SERVER_LLM_BASE_URL,
      apiKey: process.env.SERVER_LLM_API_KEY,
      model: process.env.SERVER_LLM_MODEL,
    };

    // 4. Validate configuration completeness（至少保证类型与密钥存在）
    if (!serverConfig.type || !serverConfig.apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incomplete LLM configuration'
        },
        { status: 500 }
      );
    }

    // 5. 返回脱敏后的配置给前端（不包含 apiKey）
    const publicConfig = {
      type: serverConfig.type,
      baseUrl: serverConfig.baseUrl,
      model: serverConfig.model,
    };

    return NextResponse.json({
      success: true,
      config: publicConfig,
    });
  } catch (error) {
    console.error('Error in /api/llm/config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get LLM config'
      },
      { status: 500 }
    );
  }
}
