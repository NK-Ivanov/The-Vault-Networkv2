// n8n Template Library Configuration

export interface N8NTemplate {
  id: string;
  name: string;
  category: string;
  businessUseCase: string;
  description: string;
  setupComplexity: 'Low' | 'Medium' | 'High';
  fileName: string;
}

export const N8N_TEMPLATES: N8NTemplate[] = [
  {
    id: 'T01',
    name: 'Gmail Campaign Sender + Auto Follow-up',
    category: 'Lead Generation / Sales Outreach',
    businessUseCase: 'Automates bulk email campaigns and follows up with prospects who don\'t reply, helping businesses scale outreach without extra tools.',
    description: 'This n8n template scrapes business emails from Google Maps using core nodes, stores results in Google Sheets, and sends automated campaigns via Gmail. It includes follow-up sequences if recipients don\'t respond. Designed for sales, marketing, freelancers, and small agencies to generate leads cost-effectively.',
    setupComplexity: 'Medium',
    fileName: 'Gmail campaign sender_ Bulk-send emails and follow up automatically if no reply .json'
  },
  {
    id: 'T02',
    name: 'Lead Magnet Agent – Deep Research & Content Generation',
    category: 'Content Marketing / Lead Generation',
    businessUseCase: 'Automates creation of in-depth, research-backed lead magnet articles for LinkedIn or other platforms, helping businesses showcase expertise and attract qualified leads.',
    description: 'This n8n template uses multiple AI agents (Claude, OpenRouter) with Perplexity and company knowledge hub integration to turn a user-submitted topic into a polished, research-backed Google Doc. It generates structured research queries, conducts web and knowledge base research, builds an outline, writes chapters via a team of AI assistants, edits content for LinkedIn-ready style, and delivers a shareable Google Doc automatically.',
    setupComplexity: 'High',
    fileName: 'Deep Research - Sales Lead Magnet Agent.json'
  },
  {
    id: 'T03',
    name: 'Generate AI Viral Videos with VEO3 and Auto-Publish to TikTok',
    category: 'Social Media Automation / Content Creation',
    businessUseCase: 'Automates end-to-end viral video production and posting, helping creators and marketers scale short-form content without manual editing or uploading.',
    description: 'This workflow generates daily viral video ideas with GPT-5, creates structured cinematic prompts, renders 9:16 videos using VEO3, logs metadata in Google Sheets, and auto-uploads to TikTok via Blotato. It supports customization for posting frequency, creative style, and platform extensions (YouTube Shorts, Instagram Reels).',
    setupComplexity: 'High',
    fileName: 'Generate AI Viral Videos with VEO 3 and Upload to TikTok .json'
  },
  {
    id: 'T04',
    name: 'AI-Powered WhatsApp Chatbot with RAG for Text, Voice, Images & PDFs',
    category: 'Customer Support / Knowledge Management',
    businessUseCase: 'Automates product support by ingesting docs, chunking into embeddings, and enabling AI-powered retrieval-augmented answers over WhatsApp.',
    description: 'Two connected workflows: (1) Document ingestion from Google Docs → splits & embeds content into MongoDB Atlas for semantic search; (2) WhatsApp chatbot listens for text, audio, image, or PDF queries → converts input, searches embeddings, and generates context-aware answers via GPT-4o-mini with conversation memory.',
    setupComplexity: 'High',
    fileName: 'AI-Powered WhatsApp Chatbot for Text, Voice, Images, and PDF with RAG 2.json'
  },
  {
    id: 'T05',
    name: 'AI Resume Screening & Evaluation with Gemini AI, Google Sheets & Drive',
    category: 'HR Automation / Recruitment',
    businessUseCase: 'Automates candidate screening with AI, extracting data from CVs, scoring applicants against job role profiles, and saving structured results to Google Sheets and Drive.',
    description: 'Workflow accepts CV uploads via form → extracts qualifications, skills, job history & personal data → summarizes candidate profile → compares against role criteria in Google Sheets → generates HR-style evaluation & numeric score (1–10) → stores results + uploads CV to Drive.',
    setupComplexity: 'High',
    fileName: 'Resume Screening & Evaluation System with Gemini AI, Google Sheets & Drive for HR .json'
  },
  {
    id: 'T06',
    name: 'Automated Job Applications & Status Tracking with LinkedIn, Indeed & Google Sheets',
    category: 'Job Automation / Career Tools',
    businessUseCase: 'Automates the full job application process from Google Sheets, including applying with personalized cover letters, tracking status, and sending updates.',
    description: 'Workflow runs daily to apply to jobs from a Google Sheet (LinkedIn, Indeed, others), auto-fills cover letters & resume, updates application IDs & status, checks applied jobs every 2 days, and sends email notifications on progress. Includes priority filtering, duplicate prevention, and customizable logic.',
    setupComplexity: 'High',
    fileName: 'Automated Job Applications & Status Tracking with LinkedIn, Indeed & Google Sheets.json'
  },
  {
    id: 'T07',
    name: 'AI-Powered Weekly MS Teams Channel Summaries',
    category: 'Team Productivity / Remote Collaboration',
    businessUseCase: 'Generates weekly reports from MS Teams chat activity, summarizing wins, challenges, and highlights for individuals and the team.',
    description: 'Scheduled every Monday at 6am, this workflow fetches the past week\'s MS Teams messages, groups by user, and uses AI to create individual and team-wide reports. Summaries are posted back to the channel, keeping everyone aligned and preventing important discussions from being forgotten.',
    setupComplexity: 'Medium',
    fileName: 'Summarise MS Teams Channel Activity for Weekly Reports with AI.json'
  },
  {
    id: 'T08',
    name: 'AI-Powered Stock Analysis Assistant with Telegram, Claude & GPT-4o',
    category: 'Virtual Assistant / Finance Automation',
    businessUseCase: 'Provides retail traders with AI-driven technical stock analysis, delivering charts, insights, and buy/hold/sell recommendations directly via Telegram.',
    description: 'This workflow integrates Telegram with AI agents (Claude & GPT-4o Vision). Users send a stock ticker; the bot fetches TradingView charts, analyzes candlesticks/MACD/volume/support-resistance, and delivers a verdict (BUY/SELL/HOLD) with explanations.',
    setupComplexity: 'High',
    fileName: 'AI-Powered Stock Analysis Assistant with Telegram, Claude & GPT-4O Vision.json'
  },
  {
    id: 'T09',
    name: 'Auto-Categorise Outlook Emails with AI',
    category: 'Email Productivity / Business Automation',
    businessUseCase: 'Automates email organisation by categorising incoming Outlook emails with AI and moving them to the correct folders.',
    description: 'The workflow fetches new Outlook emails, sanitises the body, and runs them through an AI model (Ollama) to classify as Action, Junk, Receipt, SaaS, Business, Community, or Other. It then updates Outlook categories and moves emails into the right folders.',
    setupComplexity: 'Medium',
    fileName: 'Auto Categorise Outlook Emails with AI.json'
  },
  {
    id: 'T10',
    name: 'Automatic Monitoring of Multiple URLs with Downtime Alerts',
    category: 'System Monitoring / IT Automation',
    businessUseCase: 'Automates uptime checks for multiple websites, logging results and sending alerts if downtime is detected.',
    description: 'Add URLs, run manually or on a schedule. Each URL is checked via HTTP request, results are logged in Google Sheets, and failed URLs trigger a Gmail alert. Includes bilingual (EN/ES) instructions.',
    setupComplexity: 'Medium',
    fileName: 'Automatic monitoring of multiple URLs with downtime alerts.json'
  },
  {
    id: 'T11',
    name: 'Scrape Recent News About a Company Before a Call',
    category: 'Sales Intelligence / Meeting Preparation',
    businessUseCase: 'Automates pre-call research by fetching the latest company news for scheduled meetings.',
    description: 'Each morning, scans Google Calendar for meetings titled "Meeting with/Call with," extracts the company name, fetches recent news via NewsAPI, and sends a curated digest to Gmail.',
    setupComplexity: 'Medium',
    fileName: 'Scrape recent news about a company before a call.json'
  },
  {
    id: 'T12',
    name: 'Automate Lead Capture with AI Personalized WhatsApp Messages via Unipile & Google Sheets CRM',
    category: 'Sales / Lead Generation',
    businessUseCase: 'Automates lead capture and first contact by sending AI-personalized WhatsApp messages and logging results in Google Sheets.',
    description: 'Triggered by a form submission, collects lead details, uses OpenAI to craft a personalized message, and sends via Unipile\'s WhatsApp API. Successes and failures are logged in separate Google Sheet tabs.',
    setupComplexity: 'High',
    fileName: 'Automate Lead Capture with AI Personalized WhatsApp Messages via Unipile & Google Sheets CRM.json'
  },
  {
    id: 'T13',
    name: 'Gmail → Google Sheets Lead Logger',
    category: 'Simple CRM / Lead Capture',
    businessUseCase: 'Log inbound leads or inquiries from Gmail into a structured Google Sheet automatically.',
    description: 'Monitors Gmail for new messages that match simple rules (e.g., subject contains "Inquiry"); extracts sender, subject, snippet and appends a new row in Google Sheets for tracking.',
    setupComplexity: 'Low',
    fileName: 'Log New Gmail Messages Automatically in Google Sheets.json'
  },
  {
    id: 'T14',
    name: 'Parse Email Body to JSON',
    category: 'Data Processing / Email Parsing',
    businessUseCase: 'Extract key fields from raw email bodies to JSON for downstream use.',
    description: 'Receives or fetches email content, applies parsing rules/regex and outputs clean JSON ready for storing in Sheets/DB or sending to Slack/Telegram.',
    setupComplexity: 'Low',
    fileName: 'Parse Email Body Message.json'
  },
  {
    id: 'T15',
    name: 'Post New Articles from Feeds to Slack',
    category: 'Content Distribution / Community Updates',
    businessUseCase: 'Auto-shares new posts from chosen RSS/Atom feeds to a Slack channel.',
    description: 'Polls one or more feeds on a schedule, de-duplicates items, and posts titles + links into a Slack updates channel.',
    setupComplexity: 'Low',
    fileName: 'Post New Articles from Feeds to Slack Channel.json'
  },
  {
    id: 'T16',
    name: 'Automated Website Uptime Monitor + Status Page',
    category: 'Ops / IT Monitoring',
    businessUseCase: 'Monitor websites and publish a lightweight public status page.',
    description: 'Checks website uptime on a schedule; on failure sends email alert and updates a GitHub Pages–hosted status page.',
    setupComplexity: 'Medium',
    fileName: 'Automated Website Uptime Monitor with Email Alerts & GitHub Status Page Update.json'
  },
  {
    id: 'T17',
    name: 'Gmail → Todoist Tasks',
    category: 'Productivity / Personal Workflow',
    businessUseCase: 'Convert incoming emails into actionable Todoist tasks.',
    description: 'Parses Gmail for starred/labelled emails, creates Todoist tasks with due dates/labels, and adds the email permalink in task notes.',
    setupComplexity: 'Medium',
    fileName: 'Send a daily summary of your Google Calendar events to Slack.json'
  },
  {
    id: 'T18',
    name: 'Get a Slack Alert When a Workflow Fails',
    category: 'Ops / Team Alerts',
    businessUseCase: 'Get notified when n8n workflows fail.',
    description: 'Monitors n8n workflow executions and sends Slack alerts when a workflow fails, helping teams react quickly to issues.',
    setupComplexity: 'Medium',
    fileName: 'Get a Slack alert when a workflow went wrong.json'
  },
  {
    id: 'T19',
    name: 'Publish HTML via GitHub Gist (Instant Share Link)',
    category: 'Content Ops / Reporting',
    businessUseCase: 'Publish lightweight reports or AI-generated pages via a quick Gist link.',
    description: 'Takes HTML (e.g., an AI summary or report), creates a private GitHub Gist, and returns a public share URL for clients/teams without any hosting.',
    setupComplexity: 'Low',
    fileName: 'Publish HTML Content with GitHub Gist and HTML Preview.json'
  },
  {
    id: 'T20',
    name: 'Reddit → Discord (with image extraction)',
    category: 'Content Curation / Community Engagement',
    businessUseCase: 'Auto-curate interesting subreddit posts into a Discord channel.',
    description: 'Fetches top/new posts from selected subreddits, pulls preview images when available, filters by score/keywords, and posts neatly into Discord with links.',
    setupComplexity: 'Low',
    fileName: 'Automatically Post Latest Reddit Content to Discord with Image Extraction.json'
  },
  {
    id: 'T21',
    name: 'Email → Telegram + Temporary HTML Preview',
    category: 'Notifications / Team Alerts',
    businessUseCase: 'Forward important emails to a Telegram channel/group with a clean preview page.',
    description: 'Sends an email summary to Telegram and publishes a temporary HTML of the full message via GitHub Gist for easy reading, then cleans up if configured.',
    setupComplexity: 'Low',
    fileName: 'Email Notifications to Telegram using Temporary HTML URL Hosting via GitHub Gist.json'
  },
  {
    id: 'T22',
    name: 'Brand Mentions from X (Twitter) → Slack',
    category: 'Social Listening / Brand Monitoring',
    businessUseCase: 'Track brand or keyword mentions and alert your Slack channel.',
    description: 'Searches X for chosen keywords/mentions at intervals and posts concise alerts to a Slack channel with the tweet link for quick action.',
    setupComplexity: 'Medium',
    fileName: 'Monitor Cybersecurity Brand Mentions on X and Send Alerts to Slack.json'
  },
  {
    id: 'T23',
    name: 'New Shopify Orders → Slack',
    category: 'Commerce / Sales Ops',
    businessUseCase: 'Instant Slack alerts for new Shopify orders.',
    description: 'Listens for Shopify order events and posts order info (items, total, customer) to Slack so teams can react fast.',
    setupComplexity: 'Medium',
    fileName: 'Send Real-time Notifications for New Shopify Orders to Slack.json'
  },
  {
    id: 'T24',
    name: 'Stripe Payments → Google Sheets Ledger',
    category: 'Finance Ops / Bookkeeping',
    businessUseCase: 'Build a simple payment ledger and quick revenue tracker.',
    description: 'Grabs new paid invoices/charges in Stripe and appends a normalized row in Google Sheets for reconciliation and reporting.',
    setupComplexity: 'Medium',
    fileName: 'Automate Payment Receipts_ Email, Archive, and Track with Stripe and Google Workspace.json'
  },
  {
    id: 'T25',
    name: 'Daily Google Calendar Summary → Slack',
    category: 'Productivity / Team Comms',
    businessUseCase: 'Send a friendly daily agenda to Slack every morning.',
    description: 'Collects today\'s calendar events, formats a morning digest, and posts to a Slack channel at a set time (e.g., 8am).',
    setupComplexity: 'Low',
    fileName: 'Send a daily summary of your Google Calendar events to Slack.json'
  },
  {
    id: 'T26',
    name: '7-Day Forecast → Slack (Discord-ready)',
    category: 'Community / Engagement',
    businessUseCase: 'Schedule daily or on-demand weather updates in your channel.',
    description: 'Queries a weather API and posts concise 7-day summaries; the same pattern can post to Discord by swapping the Slack node to Discord.',
    setupComplexity: 'Low',
    fileName: 'National Weather Service 7-Day Forecast in Slack.json'
  },
  {
    id: 'T27',
    name: 'Gmail AI Email Manager',
    category: 'Email Productivity / AI Assistant',
    businessUseCase: 'Summarize, label and triage Gmail with AI to save time.',
    description: 'Fetches new emails, summarizes with AI, suggests actions/labels, and can auto-reply or route to Slack/Telegram for follow-up.',
    setupComplexity: 'Medium',
    fileName: 'Gmail AI Email Manager (1).json'
  },
  {
    id: 'T28',
    name: 'AI-Powered Gmail MCP Server',
    category: 'Email Automation / Power Users',
    businessUseCase: 'Drive Gmail tasks through a model control plane (MCP).',
    description: 'Expose Gmail actions as MCP tools for advanced AI agents; create, read, reply, label and orchestrate workflows via a single control interface.',
    setupComplexity: 'High',
    fileName: 'AI-Powered Gmail MCP Server.json'
  },
  {
    id: 'T29',
    name: 'Automate Instagram Posts from Google Drive',
    category: 'Social Media / Creators',
    businessUseCase: 'Set and forget: drop content in Drive and let n8n post to Instagram.',
    description: 'Watches a Drive folder for new images/captions, applies optional AI captioning, and posts to Instagram via Facebook API with scheduling options.',
    setupComplexity: 'Medium',
    fileName: 'Automate Instagram Posts with Google Drive, AI Captions & Facebook API.json'
  },
  {
    id: 'T30',
    name: 'Email → Telegram + GitHub Gist + Cleanup',
    category: 'Notifications / Team Alerts',
    businessUseCase: 'Share important emails to Telegram and keep a neat archive.',
    description: 'Summarizes emails, posts to Telegram, creates a Gist for the full body, and optionally deletes/archives the email for inbox hygiene.',
    setupComplexity: 'Low',
    fileName: 'Email Notifications to Telegram using Temporary HTML URL Hosting via GitHub Gist (1).json'
  },
  {
    id: 'T31',
    name: 'AI Prompt Generator',
    category: 'AI Tools / Content Generation',
    businessUseCase: 'Automatically generate high-quality AI prompts for ChatGPT, Claude, or other LLMs.',
    description: 'This workflow helps create, refine, and organize prompts by leveraging AI and automation, so you can quickly produce better instructions for any AI model.',
    setupComplexity: 'Medium',
    fileName: '' // This one might not have a file yet
  }
];

// Get template file URL
export function getTemplateFileUrl(fileName: string): string {
  if (!fileName) return '';
  return `/Automation Packs/Foundation Pack/${encodeURIComponent(fileName)}`;
}

// Get templates by category
export function getTemplatesByCategory(): Record<string, N8NTemplate[]> {
  const categories: Record<string, N8NTemplate[]> = {};
  
  N8N_TEMPLATES.forEach(template => {
    if (!categories[template.category]) {
      categories[template.category] = [];
    }
    categories[template.category].push(template);
  });
  
  return categories;
}

// Get complexity badge color
export function getComplexityBadgeColor(complexity: 'Low' | 'Medium' | 'High'): string {
  switch (complexity) {
    case 'Low':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'Medium':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'High':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

