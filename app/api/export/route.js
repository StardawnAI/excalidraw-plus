import { NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '@/lib/prompts';
import puppeteer from 'puppeteer';
import path from 'path';

/**
 * POST /api/export
 * Generate diagram and export as PNG image
 */
export async function POST(request) {
  try {
    const { config, userInput, chartType } = await request.json();
    const accessPassword = request.headers.get('x-access-password');

    // Check if using server-side config with access password
    let finalConfig = config;
    if (accessPassword) {
      const envPassword = process.env.ACCESS_PASSWORD;
      if (!envPassword) {
        return NextResponse.json(
          { error: 'Server access password not configured' },
          { status: 400 }
        );
      }
      if (accessPassword !== envPassword) {
        return NextResponse.json(
          { error: 'Invalid access password' },
          { status: 401 }
        );
      }
      // Use server-side config
      finalConfig = {
        type: process.env.SERVER_LLM_TYPE,
        baseUrl: process.env.SERVER_LLM_BASE_URL,
        apiKey: process.env.SERVER_LLM_API_KEY,
        model: process.env.SERVER_LLM_MODEL,
      };
      if (!finalConfig.type || !finalConfig.apiKey) {
        return NextResponse.json(
          { error: 'Incomplete server LLM configuration' },
          { status: 500 }
        );
      }
    } else if (!config || !userInput) {
      return NextResponse.json(
        { error: 'Missing required parameters: config, userInput' },
        { status: 400 }
      );
    }

    // Build messages array
    let userMessage;

    // Handle different input types
    if (typeof userInput === 'object' && userInput.image) {
      const { text, image } = userInput;
      userMessage = {
        role: 'user',
        content: USER_PROMPT_TEMPLATE(text, chartType),
        image: {
          data: image.data,
          mimeType: image.mimeType
        }
      };
    } else {
      userMessage = {
        role: 'user',
        content: USER_PROMPT_TEMPLATE(userInput, chartType)
      };
    }

    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      userMessage
    ];

    // Generate Excalidraw elements using LLM
    let generatedCode = '';
    await callLLM(finalConfig, fullMessages, (chunk) => {
      generatedCode += chunk;
    });

    // Extract JSON from code blocks if present
    let elementsData = generatedCode.trim();
    if (elementsData.includes('```')) {
      const match = elementsData.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (match) {
        elementsData = match[1];
      }
    }

    // Parse the elements
    const elements = JSON.parse(elementsData);

    // Render to PNG using Puppeteer
    const imageBuffer = await renderToPNG(elements);

    // Return image
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="diagram.png"',
      },
    });
  } catch (error) {
    console.error('Error exporting diagram:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export diagram' },
      { status: 500 }
    );
  }
}

async function renderToPNG(elements) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Load the render template
    const renderPath = path.join(process.cwd(), 'public', 'render.html');
    await page.goto(`file://${renderPath}`);

    // Inject elements and render
    await page.evaluate((els) => {
      window.renderElements(els);
    }, elements);

    // Wait for render to complete
    await page.waitForFunction(() => window.renderComplete === true, {
      timeout: 5000,
    });

    // Take screenshot of canvas only
    const canvas = await page.$('#canvas');
    const screenshot = await canvas.screenshot({
      type: 'png',
    });

    return screenshot;
  } finally {
    await browser.close();
  }
}
