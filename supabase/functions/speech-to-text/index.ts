import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SpeechRequest {
  audioContent: string // Base64-encoded audio
  languageCode?: string
  sampleRateHertz?: number
  encoding?: string
}

interface SpeechResponse {
  transcript: string
  confidence?: number
  languageCode: string
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
    const { audioContent, languageCode = 'en-US', sampleRateHertz = 16000, encoding = 'LINEAR16' } =
      (await req.json()) as SpeechRequest

    if (!audioContent) {
      throw new Error('Missing audioContent in request body')
    }

    // Call Google Cloud Speech-to-Text API
    const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY')
    if (!googleApiKey) {
      throw new Error('Google Cloud API key not configured')
    }

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding,
            sampleRateHertz,
            languageCode,
            enableAutomaticPunctuation: true,
            model: 'default',
            useEnhanced: true,
          },
          audio: {
            content: audioContent,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Speech API error: ${error}`)
    }

    const data = await response.json()

    // Extract transcript and confidence
    const results = data.results || []
    const transcript = results
      .map((result: any) => result.alternatives?.[0]?.transcript || '')
      .join(' ')
      .trim()

    const confidence = results[0]?.alternatives?.[0]?.confidence

    const result: SpeechResponse = {
      transcript,
      confidence,
      languageCode,
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Speech-to-text error:', error)

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
