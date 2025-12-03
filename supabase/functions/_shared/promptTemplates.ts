// Reusable prompt templates for AI processing

export const FEEDBACK_PROMPT_TEMPLATE = `You are an expert HR performance review writer. Analyze the following voice transcript from a manager and create comprehensive, actionable performance feedback.

## Transcript:
{transcript}

## Employee Context:
- Name: {employee_name}
- Role: {role}
- Previous Review Summary: {summary}

## Tone Preference: {tone}
- appreciative: Focus on achievements and positive contributions while gently noting growth areas
- developmental: Balance recognition with clear developmental guidance
- neutral: Objective, balanced assessment with equal weight to strengths and improvements

## Your Task:
Create a detailed performance review in the following JSON structure. Be specific, use examples from the transcript, and ensure all feedback is actionable and bias-free.

Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence executive summary of overall performance against OKRs and KRAs",
  "strengths": [
    {
      "title": "Strength area name",
      "description": "Specific example from transcript showing this strength",
      "impact": "Business impact of this strength"
    }
  ],
  "improvements": [
    {
      "title": "Area needing improvement",
      "description": "Specific behavior observed",
      "actionItem": "Concrete next step the employee can take"
    }
  ],
  "competencies": [
    {
      "name": "Competency name (e.g., Communication, Technical Skills, Leadership)",
      "rating": "Exceeds/Meets/Developing/Below Expectations",
      "evidence": "Specific evidence from transcript supporting this rating"
    }
  ],
  "learningRecommendations": [
    {
      "topic": "Skill or area to develop",
      "priority": "high/medium/low",
      "timeframe": "30/60/90 days",
      "resource": "Suggested course, book, or activity"
    }
  ],
  "growthPath": {
    "shortTerm": "Goals and focus areas for the next 30-60 days",
    "midTerm": "Goals and milestones for the next 3-6 months",
    "longTerm": "Career progression opportunities over 1-2 years",
    "keyMilestones": ["Milestone 1", "Milestone 2", "Milestone 3"]
  }
}

Important guidelines:
- Include exactly 3 strengths with specific examples
- Include exactly 3 improvement areas with actionable next steps
- Include 4-5 competency assessments
- Include 2-3 learning recommendations
- Make the growth path personalized based on the transcript content
- Avoid gendered language, bias words, or vague descriptions
- Use concrete examples and measurable outcomes where possible`;

export const FAIRNESS_CHECK_TEMPLATE = `Score the following feedback on fairness (0-1). Flag any gendered, emotional, or culturally loaded phrases. Return: { "fairness":0.87, "issues":["too emotional","vague"] }
Text: {draft_text}`;

export const FAIRNESS_REWRITE_TEMPLATE = `Rewrite the feedback to remove the flagged fairness issues while keeping examples and actionability. Tone: {tone}`;
