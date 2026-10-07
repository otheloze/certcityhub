import { ExamSeed } from "./seed-helpers";
import { NVIDIA_LLM_FUNDAMENTALS, NVIDIA_CUSTOMISATION_FINETUNING } from "./bank-nvidia-genai";
import { NVIDIA_DEPLOYMENT_EVALUATION } from "./bank-nvidia-genai-deploy";
import { AIGP_FOUNDATIONS, AIGP_LAWS_STANDARDS, AIGP_RISK_LIFECYCLE } from "./bank-iapp-aigp";
import { AI900_WORKLOADS_RESPONSIBLE_AI, AI900_ML_COMPUTER_VISION, AI900_LANGUAGE_GENERATIVE } from "./bank-ai-900";
import { IBMAI_ML_WITH_PYTHON, IBMAI_DEEP_LEARNING, IBMAI_BUILDING_DEPLOYING } from "./bank-ibm-ai-engineering";
import { MLSPEC_SUPERVISED_LEARNING, MLSPEC_ADVANCED_ALGORITHMS, MLSPEC_UNSUPERVISED_RECOMMENDERS } from "./bank-ml-specialization";
import { CLAUDEARCH_ARCHITECTURE_MODEL_SELECTION, CLAUDEARCH_TOOLS_AGENTS_CONTEXT, CLAUDEARCH_EVALUATION_SAFETY_OPERATIONS } from "./bank-claude-architect";
import { CLAUDEASSOC_BASICS, CLAUDEASSOC_PROMPTING, CLAUDEASSOC_SAFE_EFFECTIVE_USE } from "./bank-claude-associate";

// Original practice content. Not affiliated with or endorsed by NVIDIA, IAPP,
// Microsoft, IBM, DeepLearning.AI or Coursera.

const base = { category: "AI", durationMinutes: 20 };

export const AI_EXAMS: ExamSeed[] = [
  {
    ...base,
    slug: "nvidia-generative-ai-llms",
    title: "NVIDIA Generative AI & LLMs Practice",
    shortCode: "NCA-GENL",
    provider: "NVIDIA (unofficial)",
    level: "Associate",
    sortOrder: 20,
    durationMinutes: 60,
    blueprint: { questionCount: 55, randomize: true },
    description:
      "Practice questions in the style of the NVIDIA generative AI and large language model associate certification. Independent content, not affiliated with or endorsed by NVIDIA.",
    topics: [
      { title: "LLM Fundamentals", questions: NVIDIA_LLM_FUNDAMENTALS },
      { title: "Customisation & Fine-tuning", questions: NVIDIA_CUSTOMISATION_FINETUNING },
      { title: "Deployment & Evaluation", questions: NVIDIA_DEPLOYMENT_EVALUATION },
    ],
  },
  {
    ...base,
    slug: "iapp-aigp",
    title: "AI Governance Professional Practice",
    shortCode: "AIGP",
    provider: "IAPP (unofficial)",
    level: "Professional",
    sortOrder: 21,
    durationMinutes: 180,
    blueprint: { questionCount: 60, randomize: true },
    description:
      "Practice questions in the style of the IAPP AI Governance Professional (AIGP) certification. Independent content, not affiliated with or endorsed by IAPP.",
    topics: [
      { title: "Foundations of AI Governance", questions: AIGP_FOUNDATIONS },
      { title: "Laws & Standards", questions: AIGP_LAWS_STANDARDS },
      { title: "Risk & Lifecycle Governance", questions: AIGP_RISK_LIFECYCLE },
    ],
  },
  {
    ...base,
    slug: "azure-ai-fundamentals",
    title: "Azure AI Fundamentals Practice",
    shortCode: "AI-900",
    provider: "Microsoft Azure (unofficial)",
    level: "Foundational",
    sortOrder: 22,
    durationMinutes: 45,
    blueprint: { questionCount: 50, randomize: true },
    description:
      "Practice questions in the style of Microsoft Azure AI Fundamentals (AI-900 and its successor versions). Independent content, not affiliated with or endorsed by Microsoft.",
    topics: [
      { title: "AI Workloads & Responsible AI", questions: AI900_WORKLOADS_RESPONSIBLE_AI },
      { title: "Machine Learning & Computer Vision", questions: AI900_ML_COMPUTER_VISION },
      { title: "Language & Generative AI", questions: AI900_LANGUAGE_GENERATIVE },
    ],
  },
  {
    ...base,
    slug: "ibm-ai-engineering",
    title: "IBM AI Engineering Practice",
    shortCode: "IBM-AI",
    provider: "IBM (unofficial)",
    level: "Professional certificate",
    sortOrder: 23,
    description:
      "Practice questions covering topics from the IBM AI Engineering Professional Certificate: machine learning, deep learning and applied AI. Independent content, not affiliated with or endorsed by IBM or Coursera.",
    topics: [
      { title: "Machine Learning with Python", questions: IBMAI_ML_WITH_PYTHON },
      { title: "Deep Learning & Neural Networks", questions: IBMAI_DEEP_LEARNING },
      { title: "Building & Deploying AI Applications", questions: IBMAI_BUILDING_DEPLOYING },
    ],
  },
  {
    ...base,
    slug: "deeplearning-ai-machine-learning",
    title: "Machine Learning Specialization Practice",
    shortCode: "ML-SPEC",
    provider: "DeepLearning.AI (unofficial)",
    level: "Specialization",
    sortOrder: 24,
    description:
      "Practice questions covering topics from the DeepLearning.AI Machine Learning Specialization: supervised learning, neural networks and unsupervised learning. Independent content, not affiliated with or endorsed by DeepLearning.AI or Stanford.",
    topics: [
      { title: "Supervised Learning", questions: MLSPEC_SUPERVISED_LEARNING },
      { title: "Advanced Learning Algorithms", questions: MLSPEC_ADVANCED_ALGORITHMS },
      { title: "Unsupervised Learning & Recommenders", questions: MLSPEC_UNSUPERVISED_RECOMMENDERS },
    ],
  },
  {
    ...base,
    slug: "claude-certified-architect-foundations",
    title: "Claude Certified Architect - Foundations Practice",
    shortCode: "CCAR-F",
    provider: "Anthropic (unofficial)",
    level: "Foundations",
    sortOrder: 25,
    durationMinutes: 120,
    blueprint: { questionCount: 60, randomize: true },
    description:
      "Unofficial practice on designing applications with Claude: model choice, tools and agents, evaluation and safety. Independent content based on general knowledge, not an official Anthropic exam blueprint. Not affiliated with or endorsed by Anthropic.",
    topics: [
      { title: "Architecture & Model Selection", questions: CLAUDEARCH_ARCHITECTURE_MODEL_SELECTION },
      { title: "Tools, Agents & Context", questions: CLAUDEARCH_TOOLS_AGENTS_CONTEXT },
      { title: "Evaluation, Safety & Operations", questions: CLAUDEARCH_EVALUATION_SAFETY_OPERATIONS },
    ],
  },
  {
    ...base,
    slug: "claude-certified-associate-foundations",
    title: "Claude Certified Associate - Foundations Practice",
    shortCode: "CCAO-F",
    provider: "Anthropic (unofficial)",
    level: "Foundations",
    sortOrder: 26,
    durationMinutes: 120,
    blueprint: { questionCount: 60, randomize: true },
    description:
      "Unofficial practice on using Claude effectively and safely: basics, prompting and responsible use. Independent content based on general knowledge, not an official Anthropic exam blueprint. Not affiliated with or endorsed by Anthropic.",
    topics: [
      { title: "Claude Basics", questions: CLAUDEASSOC_BASICS },
      { title: "Prompting Techniques", questions: CLAUDEASSOC_PROMPTING },
      { title: "Safe & Effective Use", questions: CLAUDEASSOC_SAFE_EFFECTIVE_USE },
    ],
  },
];
