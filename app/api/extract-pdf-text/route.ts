import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }
    
    if (file.size > 1 * 1024 * 1024) { // 1MB limit
      console.error('❌ File too large:', `${(file.size / 1024).toFixed(0)}KB`);
      throw new Error('File size must be less than 1MB');
    }
    
    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Try to use pdf-parse with proper error handling
    let extractedText = '';
    
    try {
      // Dynamic import to avoid build issues
      const pdf = await import('pdf-parse').then(module => module.default || module);
      const data = await pdf(buffer);
      extractedText = data.text;
    } catch (pdfParseError) {
      console.error('pdf-parse failed:', pdfParseError);
      
      // Fallback to basic text extraction
      try {
        extractedText = await extractTextBasic(buffer);
      } catch (fallbackError) {
        console.error('Fallback extraction failed:', fallbackError);
        return NextResponse.json({ 
          error: 'PDF text extraction failed. This PDF may contain images or be password-protected.' 
        }, { status: 400 });
      }
    }
    
    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({ 
        error: 'No readable text found in PDF. This may be an image-based PDF.' 
      }, { status: 400 });
    }
    
    // Clean up text
    const cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    return NextResponse.json({ 
      text: cleanedText,
      length: cleanedText.length 
    });
    
  } catch (error) {
    console.error('PDF extraction API error:', error);
    return NextResponse.json({ 
      error: `PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

// Basic text extraction as fallback
async function extractTextBasic(buffer: Buffer): Promise<string> {
  const pdfString = buffer.toString('binary');
  let text = '';
  
  // Look for text in PDF streams
  const streamRegex = /stream\s*\n([\s\S]*?)\nendstream/g;
  let match;
  
  while ((match = streamRegex.exec(pdfString)) !== null) {
    const streamContent = match[1];
    
    // Try to extract readable text from stream
    const textRegex = /\((.*?)\)/g;
    let textMatch;
    
    while ((textMatch = textRegex.exec(streamContent)) !== null) {
      const textContent = textMatch[1];
      if (textContent && textContent.length > 0) {
        // Decode basic PDF text encoding
        const decodedText = textContent
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\(/g, '(')
          .replace(/\\)/g, ')')
          .replace(/\\\\/g, '\\');
        
        text += decodedText + ' ';
      }
    }
  }
  
  // If no text found in streams, try alternative patterns
  if (!text || text.trim().length < 10) {
    const textPatterns = [
      /BT\s+(.*?)\s+ET/gs,
      /Tj\s*\[(.*?)\]/gs,
      /TJ\s*\[(.*?)\]/gs
    ];
    
    for (const pattern of textPatterns) {
      const matches = pdfString.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match
            .replace(/BT|ET|Tj|TJ|\d+\.?\d*\s+/g, '')
            .replace(/[\[\]]/g, '')
            .trim();
          
          if (cleanMatch.length > 0) {
            text += cleanMatch + ' ';
          }
        });
      }
    }
  }
  
  if (!text || text.trim().length < 10) {
    throw new Error('Could not extract readable text from PDF');
  }
  
  return text.trim();
}
