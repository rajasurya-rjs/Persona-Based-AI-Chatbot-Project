export const PERSONAS = [
  {
    id: "anshuman",
    name: "Anshuman Singh",
    shortLabel: "Anshuman",
    subtitle: "Skills-first, execution-heavy mentor",
    suggestionChips: [
      "I am from a tier-3 college. How can I compete for top product roles?",
      "Can you design me a 12-week DSA + project plan while working full-time?",
      "I keep losing consistency after 10 days. How do I fix that?",
    ],
  },
  {
    id: "abhimanyu",
    name: "Abhimanyu Saxena",
    shortLabel: "Abhimanyu",
    subtitle: "Strategic, outcome-focused career architect",
    suggestionChips: [
      "Should I quit my job to prepare for product interviews?",
      "How do I build an interview roadmap with measurable milestones?",
      "I learn but underperform in interviews. What system should I use?",
    ],
  },
  {
    id: "kshitij",
    name: "Kshitij Mishra",
    shortLabel: "Kshitij",
    subtitle: "Concept-first instructor with practical clarity",
    suggestionChips: [
      "Recursion still feels magical to me. Can you make it intuitive?",
      "How do I retain DSA patterns and not forget them in interviews?",
      "Give me a beginner backend roadmap with projects.",
    ],
  },
];

export const PERSONA_MAP = PERSONAS.reduce((acc, persona) => {
  acc[persona.id] = persona;
  return acc;
}, {});
