import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  prompt: string
  count?: number
  projectId: string
}

interface IconResponse {
  icons: string[]
  generationTime: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request
    const { prompt, count = 6, projectId } = (await req.json()) as GenerateRequest

    if (!prompt) {
      throw new Error('Missing prompt in request body')
    }

    if (!projectId) {
      throw new Error('Missing projectId in request body')
    }

    if (count < 1 || count > 9) {
      throw new Error('Count must be between 1 and 9')
    }

    const startTime = Date.now()

    // Get AI image generation API key
    const imageApiKey = Deno.env.get('IMAGE_GENERATION_API_KEY')
    const imageApiUrl = Deno.env.get('IMAGE_GENERATION_API_URL')

    if (!imageApiKey || !imageApiUrl) {
      throw new Error('Image generation API not configured')
    }

    // Enhance prompt for app icon generation
    const enhancedPrompt = `app icon, ${prompt}, minimal design, flat style, centered, clean, professional, transparent background, 1024x1024`

    // Call image generation API
    // This is a generic implementation that can be adapted to any API (DALL-E, Stability AI, etc.)
    const response = await fetch(imageApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${imageApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        n: count,
        size: '1024x1024',
        response_format: 'b64_json', // Base64 encoded
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Image generation API error: ${error}`)
    }

    const apiResponse = await response.json()

    // Extract images (format varies by API provider)
    const images = apiResponse.data?.map((item: any) => item.b64_json) || apiResponse.images || []

    if (!images || images.length === 0) {
      throw new Error('No images returned from API')
    }

    // Create service role client for storage operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload icons to Supabase Storage
    const iconUrls = await Promise.all(
      images.map(async (base64Image: string, index: number) => {
        // Validate base64 format
        if (!base64Image || typeof base64Image !== 'string') {
          throw new Error('Invalid base64 image data')
        }

        // Check for valid base64 characters
        if (!/^[A-Za-z0-9+/=]+$/.test(base64Image)) {
          throw new Error('Invalid base64 format: contains invalid characters')
        }

        // Enforce size limit (10MB max for base64, ~7.3MB decoded)
        const maxBase64Size = 10 * 1024 * 1024 * 1.37 // base64 is ~1.37x larger
        if (base64Image.length > maxBase64Size) {
          throw new Error(`Image too large: max ${Math.floor(maxBase64Size / 1024 / 1024)}MB`)
        }

        // Decode base64 to bytes with error handling
        let bytes: Uint8Array
        try {
          const binaryString = atob(base64Image)
          bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
        } catch (error) {
          throw new Error('Failed to decode base64 image: ' + (error instanceof Error ? error.message : 'Unknown error'))
        }

        // Validate PNG signature (first 8 bytes: 89 50 4E 47 0D 0A 1A 0A)
        const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
        if (bytes.length < 8 || !pngSignature.every((byte, i) => bytes[i] === byte)) {
          throw new Error('Invalid image format: must be PNG')
        }

        // Generate unique filename with sanitization
        const timestamp = Date.now()
        const safeIndex = Math.max(0, Math.min(999, index)) // Sanitize index
        const filename = `icon-${timestamp}-${safeIndex}.png`
        const path = `${user.id}/${projectId}/${filename}`

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('project-icons')
          .upload(path, bytes, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Failed to upload icon: ${uploadError.message}`)
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from('project-icons').getPublicUrl(path)

        return publicUrl
      })
    )

    const generationTime = Date.now() - startTime

    const result: IconResponse = {
      icons: iconUrls,
      generationTime,
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Icon generation error:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
      }
    )
  }
})
