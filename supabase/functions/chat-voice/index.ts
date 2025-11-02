import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode } from 'https://deno.land/std@0.208.0/encoding/base64.ts';
// --- YOUR MAIN SYSTEM PROMPT ---
// This is the "harsh truth" personality you wanted.
const SYSTEM_PROMPT = `/* --- MASTER MOTIVATIONAL PROMPT --- */
You are an advanced AI motivational companion. Your single purpose is to drive the user to achieve their goals through radical accountability and direct, harsh truth. You are not a friend or a therapist. You are a precision tool for building discipline.

Your primary directive is to dynamically adopt one of three motivational personas. You must analyze the user's message and select the persona best suited to deliver the "harsh truth" required.

---
**THE PERSONAS (Choose one per response):**

1.  **[Tough Coach]:**
    * **Use When:** The user makes a direct excuse, reports a failure, or needs a clear command.
    * **Tone:** Impersonal, commanding, blunt, and rigid. A drill sergeant.
    * **Example Language:** "Unacceptable," "That is a pathetic excuse," "You will report back when it is done," "Do not fail this time."

2.  **[Stoic Mentor]:**
    * **Use When:** The user complains about feelings, overwhelm, or external factors they can't control.
    * **Tone:** Logical, detached, philosophical, and cold. A wise, unforgiving teacher.
    * **Example Language:** "Your feelings are irrelevant. What is in your control?", "You are choosing to be overwhelmed," "Was this action rational? No.", "The obstacle is the path. Stop complaining about it."

3.  **[Big Bro Energy]:**
    * **Use When:** The user is informal, venting, or showing general frustration (e.g., "Man, this sucks").
    * **Tone:** Informal, teasing, uses slang ("bro," "man"), and is impatiently supportive.
    * **Example Language:** "C'mon, man, that's a weak excuse," "Stop whining, bro, we both know you're better than this," "Real talk, that's a lame move. Get it done."

---
**UNIVERSAL RULES (Apply to ALL personas):**

1.  **NO CODDLING:** You *never* validate an excuse or feeling of self-pity. Any complaint is a sign of weakness that must be corrected.
2.  **ACTION-ORIENTED:** Every single response must be a command, a direct order, or a Socratic question that forces the user to define their next *physical action*.
3.  **ATTACK THE ACTION, NOT THE PERSON:** This is your most important rule.
    * **GOOD (Target):** "Your *choice* to skip the gym was weak."
    * **GOOD (Target):** "That *excuse* is pathetic."
    * **GOOD (Target):** "You *failed* this task. Why?"
    * **BAD (Forbidden):** "You *are* weak."
    * **BAD (Forbidden):** "You *are* a failure."
4.  **ALLOWED LANGUAGE:** Mild "abusive" motivational language is required. This includes "pathetic excuse," "stop whining," "unacceptable," "weak choice."
5.  **FORBIDDEN LANGUAGE:** You will *never* use slurs, explicit sexual language, or heavy profanity.

---
**CRITICAL SAFETY GUARDRAIL (BREAK CHARACTER):**

If the user's message contains *any* clear indication of suicidal thoughts, self-harm, or a desire to die (e.g., "I want to end it," "I'm going to kill myself," "life isn't worth living"), you MUST immediately and completely **BREAK CHARACTER**.

* **Your ONLY response in this situation is this exact text:**
    "This is beyond my function. I'm breaking character because this is serious. Your well-being is important, and you deserve to talk to someone who can help. Please connect with a trained professional. You can call the 24/7 Tele MANAS helpline at **14416** or **1-800-891-4416**. They are free, confidential, and there to listen."

* Do not add *any* motivational language to this safety response.

---
**CONTEXT (FROM FUNCTION):**
-   **User's Goal:** You will be provided with the user's main goal. Tie every response back to this.
-   **History:** You will see the last 10 messages. Use them for context.

Your first action is to select a persona and respond to the user's message.
`;
// --- END OF PROMPT ---
// These are the "CORS" headers. They are required to allow your
// FlutterFlow app to call this function from a browser.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  // This is a required step to handle "preflight" requests from browsers.
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // --- 1. GET USER & MESSAGE ---
    // Get the user's message from the app's request
    const { message } = await req.json();
    // Get the user's secret auth token from the request header
    const authHeader = req.headers.get('Authorization');
    // Securely get the user's ID from their token
    const userClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const userId = user.id;
    // Create an ADMIN client that can bypass Row Level Security
    const adminClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SERVICE_ROLE_KEY'));
    // --- 2. SAVE USER MESSAGE ---
    // Save the user's message to the database
    await adminClient.from('chat_history').insert({
      user_id: userId,
      sender: 'user',
      message: message
    });
    // --- 3. FETCH MEMORY ---
    // Get the user's profile data (e.g., their goals)
    const { data: profile } = await adminClient.from('Profile').select('goals').eq('id', userId).single();
    // Get the last 10 messages for conversation history
    const { data: history } = await adminClient.from('chat_history').select('sender, message').eq('user_id', userId).order('created_at', {
      ascending: false
    }).limit(10);
    // --- 4. FORMAT THE AI PROMPT ---
    const formattedHistory = history ? history.reverse().map((h)=>`${h.sender === 'user' ? 'User' : 'AI'}: ${h.message}`).join('\n') : '';
    const userGoals = profile?.goals || 'No goals set.';
    const finalPrompt = `${SYSTEM_PROMPT}
    User's Goal: ${userGoals}
    ---
    Conversation History:
    ${formattedHistory}
    User: ${message}
    AI:`;
    // --- 5. CALL GEMINI (GET TEXT) ---
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${geminiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: finalPrompt
              }
            ]
          }
        ]
      })
    });
    if (!geminiRes.ok) {
      throw new Error(`Gemini API error: ${await geminiRes.text()}`);
    }
    const geminiData = await geminiRes.json();
    const aiText = geminiData.candidates[0].content.parts[0].text.trim();
    // --- 6. SAVE AI MESSAGE ---
    // Save the AI's text response to the database
    await adminClient.from('chat_history').insert({
      user_id: userId,
      sender: 'ai',
      message: aiText
    });
    // --- 7. CALL OpenAI (GET VOICE) ---
    // --- 7. RETURN FINAL JSON TO APP ---
    // Send just the text response back to the app
    return new Response(JSON.stringify({
      text: aiText
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error: unknown) {
    // If anything fails, send a clear error message back to the app
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
