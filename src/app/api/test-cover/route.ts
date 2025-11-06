import { NextResponse } from 'next/server'

export async function GET() {
  // Create a simple test base64 image (1x1 red pixel)
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
  
  return NextResponse.json({
    success: true,
    testImage: testImage,
    message: 'This is a test base64 image - a 1x1 red pixel'
  })
}