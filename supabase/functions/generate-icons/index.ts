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
        // Decode base64 to bytes
        const binaryString = atob(base64Image)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Generate unique filename
        const timestamp = Date.now()
        const filename = `icon-${timestamp}-${index}.png`
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
