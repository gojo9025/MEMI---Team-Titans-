import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        let validUrl;
        try {
            validUrl = new URL(url);
        } catch (_) {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        const response = await fetch(validUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Strip noisy elements
        $('script, style, noscript, nav, footer, header, form, iframe, xmp, .menu, .sidebar, .ad, .cookie, .popup, .modal').remove();

        const title = $('title').text().trim() || validUrl.hostname;
        
        // Content Extraction Strategy
        let textContent = '';
        const smartSelectors = ['article', 'main', '.content', '.post', '.article-body'];
        
        for (const selector of smartSelectors) {
            const el = $(selector);
            if (el.length > 0) {
                textContent = el.text();
                break;
            }
        }
        
        if (!textContent || textContent.trim().length < 100) {
            const paragraphs = [];
            $('p').each((_, el) => {
                const text = $(el).text().trim();
                if (text.length > 20) paragraphs.push(text);
            });
            textContent = paragraphs.join('\n');
        }
        
        if (!textContent || textContent.trim().length < 50) {
            textContent = $('body').text();
        }

        // Clean formatting and cap length for AI processing limits
        textContent = textContent.replace(/\s+/g, ' ').trim();
        const MAX_CHARS = 5000;
        if (textContent.length > MAX_CHARS) {
            textContent = textContent.substring(0, MAX_CHARS) + '...';
        }

        if (!textContent || textContent.length < 10) {
            throw new Error('No readable text content found.');
        }

        return NextResponse.json({ title: title || 'Scraped URL', text: textContent });

    } catch (error) {
        return NextResponse.json({ error: error.message || 'Failed to scrape URL' }, { status: 500 });
    }
}
