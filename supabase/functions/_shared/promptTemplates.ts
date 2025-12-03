// Reusable prompt templates for AI processing

export const FEEDBACK_PROMPT_TEMPLATE = `You are a professional HR feedback writer. Given the following transcript and employee context, create a JSON with:
- summary: one-sentence
- strengths: array of 3 items (each a concrete example)
- improvements: array of 3 micro-behaviors + actionable next steps
- mapped_competencies: array
- learning_recs: array (2 items with URLs if available)

Transcript: {transcript}
Employee: {employee_name}, role: {role}, last_review: {summary}
Tone: {tone}
Return valid JSON only.`;

export const FAIRNESS_CHECK_TEMPLATE = `Score the following feedback on fairness (0-1). Flag any gendered, emotional, or culturally loaded phrases. Return: { "fairness":0.87, "issues":["too emotional","vague"] }
Text: {draft_text}`;

export const FAIRNESS_REWRITE_TEMPLATE = `Rewrite the feedback to remove the flagged fairness issues while keeping examples and actionability. Tone: {tone}`;
