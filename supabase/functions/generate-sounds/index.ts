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
  duration?: number // Duration in seconds
}

interface SoundResponse {
  sounds: string[]
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
    const { prompt, count = 4, projectId, duration = 3 } = (await req.json()) as GenerateRequest

    if (!prompt) {
      throw new Error('Missing prompt in request body')
    }

    if (!projectId) {
      throw new Error('Missing projectId in request body')
    }

    if (count < 1 || count > 6) {
      throw new Error('Count must be between 1 and 6')
    }

    if (duration < 1 || duration > 10) {
      throw new Error('Duration must be between 1 and 10 seconds')
    }

    const startTime = Date.now()

    // Get ElevenLabs API key
    const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY')

    if (!elevenLabsKey) {
      throw new Error('ElevenLabs API not configured')
    }

    // Enhance prompt for sound effect generation
    const enhancedPrompt = `${prompt}, high quality sound effect, clean audio, no background noise`

    // Generate multiple sound variations
    const soundPromises = Array.from({ length: count }, async (_, index) => {
      // Add variation to each sound
      const variantPrompt = `${enhancedPrompt}, variation ${index + 1}`

      // Call ElevenLabs Sound Generation API
      // https://api.elevenlabs.io/v1/sound-generation
      const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: variantPrompt,
          duration_seconds: duration,
          prompt_influence: 0.5,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`ElevenLabs API error: ${error}`)
      }

      // Response is audio/mpeg
      const audioBuffer = await response.arrayBuffer()
      return new Uint8Array(audioBuffer)
    })

    const audioBuffers = await Promise.all(soundPromises)

    // Create service role client for storage operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload sounds to Supabase Storage
    const soundUrls = await Promise.all(
      audioBuffers.map(async (audioBuffer, index) => {
        // Generate unique filename
        const timestamp = Date.now()
        const filename = `sound-${timestamp}-${index}.mp3`
        const path = `${user.id}/${projectId}/${filename}`

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('project-sounds')
          .upload(path, audioBuffer, {
            contentType: 'audio/mpeg',
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Failed to upload sound: ${uploadError.message}`)
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from('project-sounds').getPublicUrl(path)

        return publicUrl
      })
    )

    const generationTime = Date.now() - startTime

    const result: SoundResponse = {
      sounds: soundUrls,
      generationTime,
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Sound generation error:', error)

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
