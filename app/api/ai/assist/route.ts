import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { generateAIActionPreview, generateAIAssistance } from "@/lib/ai/assistant";
import { validateAIActionRequest, validateAIAssistRequest } from "@/lib/ai/schemas";
import { getProfileAccess } from "@/lib/billing";
import { getBusinessProfile, getProfileIndustryLabel } from "@/lib/business-profile";

type AIBusinessContext = {
  businessName: string | null;
  industry: string | null;
  customIndustry: string | null;
  servicesOffered: string | null;
  defaultQuoteType: string | null;
  defaultInvoiceType: string | null;
};

function isSimpleAssistRequest(body: unknown): body is { message: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof (body as { message?: unknown }).message === "string"
  );
}

function isActionAssistRequest(body: unknown): body is { mode: "action"; message: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    "mode" in body &&
    (body as { mode?: unknown }).mode === "action"
  );
}

async function generateSimpleAnswer(
  message: string,
  businessContext?: AIBusinessContext
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("AI is not configured.");
  }

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are the Unified Steele AI Assistant for a service-business dashboard. Help service pros with practical, concise guidance for invoices, leads, follow-ups, sales mapping, route planning, customer communication, and daily priorities. Avoid legal, tax, or financial advice beyond general business organization. Keep answers actionable and easy to use. Use the user's business profile when it helps tailor service wording, quote/invoice context, lead suggestions, and customer communication.",
          },
        ],
      },
      ...(businessContext
        ? [
            {
              role: "system" as const,
              content: [
                {
                  type: "input_text" as const,
                  text: `Business profile context: ${JSON.stringify(businessContext)}`,
                },
              ],
            },
          ]
        : []),
      {
        role: "user",
        content: [{ type: "input_text", text: message }],
      },
    ],
    max_output_tokens: 900,
  });

  return response.output_text?.trim() || "I couldn't generate an answer.";
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const access = await getProfileAccess(supabase, user);

    if (!access.hasAiAccess) {
      return NextResponse.json(
        {
          ok: false,
          error: "AI Assistant unlocks after your paid subscription begins.",
        },
        { status: 403 }
      );
    }

    const { data: allowed, error: usageError } = await supabase.rpc(
      "use_ai_request",
      { user_id: user.id }
    );

    if (usageError) {
      return NextResponse.json(
        { error: "Usage check failed." },
        { status: 500 }
      );
    }

    if (allowed === false) {
      return NextResponse.json(
        { error: "AI usage limit reached. Try again next month." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const businessProfile = await getBusinessProfile(supabase, user).catch(() => null);
    const businessContext = businessProfile
      ? {
          businessName: businessProfile.business_name,
          industry: getProfileIndustryLabel(businessProfile),
          customIndustry: businessProfile.custom_industry,
          servicesOffered: businessProfile.services_offered,
          defaultQuoteType: businessProfile.default_quote_type,
          defaultInvoiceType: businessProfile.default_invoice_type,
        }
      : undefined;

    if (isActionAssistRequest(body)) {
      const validated = validateAIActionRequest(body);

      if (!validated.ok) {
        return NextResponse.json(
          { ok: false, error: validated.error },
          { status: 400 }
        );
      }

      const result = await generateAIActionPreview({
        ...validated.data,
        context: {
          ...(validated.data.context || {}),
          businessProfile: businessContext,
        },
      });
      return NextResponse.json(result);
    }

    if (isSimpleAssistRequest(body)) {
      const message = body.message.trim().slice(0, 2000);

      if (!message) {
        return NextResponse.json(
          { error: "Message is required." },
          { status: 400 }
        );
      }

      const answer = await generateSimpleAnswer(message, businessContext);
      return NextResponse.json({ answer });
    }

    const validated = validateAIAssistRequest(body);

    if (!validated.ok) {
      return NextResponse.json(
        { ok: false, error: validated.error },
        { status: 400 }
      );
    }

    const result = await generateAIAssistance({
      ...validated.data,
      context: {
        ...(validated.data.context || {}),
        businessProfile: businessContext,
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI request failed.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
