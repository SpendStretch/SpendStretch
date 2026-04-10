import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { pdf_base64, file_name } = await req.json();

    if (!pdf_base64) {
      return new Response(JSON.stringify({ error: 'pdf_base64 is required' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdf_base64,
              },
            },
            {
              type: 'text',
              text: `Extract the following information from this credit card statement PDF.
Return ONLY a JSON object with these fields, no explanation or markdown:
{
  "card_name": "name of the credit card product",
  "bank_name": "issuing bank name",
  "last_four": "last 4 digits of card number as a string",
  "statement_close_date": "YYYY-MM-DD",
  "payment_due_date": "YYYY-MM-DD",
  "statement_balance": 0.00,
  "minimum_payment": 0.00,
  "credit_limit": 0.00
}
If any field cannot be determined, use null for that field.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Strip any markdown code fences if present
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.error('parse-statement error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
