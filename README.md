# Recall Sheets  
*Mnemonic craft for a post-AI world*

> "Memory is not a storage problem—it is a condition of thought."

## 1. The Problem
Large-language models can summon any fact, yet our own recall withers.  
The result is a generation that **knows everything and remembers nothing**.  
Recall Sheets is a small, dark-mode web app that trains the ancient art of active recall rather than surrendering it to the cloud.

## 2. The Idea
* **AI-First Filetype** – A `.recall` file is not inert data.  It *talks back*.  Open it in the app and the file itself tells the model *how* to ingest new notes and *how* to quiz you.
* **Shareable & Hackable** – Drop a `.recall` in chat or GitHub and anyone can study it. No server, no secrets—just a portable text file.
* **Practice, not Storage** – Inspired by the medieval memory arts (see [The Lost Art of Memory](https://open.substack.com/pub/secondvoice/p/the-lost-art-of-memory?r=29z3a7&utm_medium=ios)), Recall Sheets treats knowledge as a muscle: you strengthen it by lifting, not archiving.

## 3. How It Works
1. **Create** – Describe a topic and define three prompts
   * Context – what this sheet is about
   * Ingest – how raw text should be sliced into blocks
   * Digest – how questions should be generated
2. **Edit** – Paste new material, click *Process*. The AI obeys the Ingest prompt and appends clean blocks.
3. **Launch** – The AI chooses a block, creates a question/answer pair per the Digest prompt, and types it onto the screen. Press ↵ to reveal, ↵ again for the next.

## 4. .recall Format
```
Title
YYYY-MM-DD
=======
<Context prompt>
=======
<Ingest prompt>
=======
<Digest prompt>
=======
[ JSON array of information blocks ]
```
A human can read it, an AI can parse it. Nothing else required.

## 5. Quick Start (GitHub Pages)
```bash
# clone and open
git clone https://github.com/YOUR_USERNAME/chamber_of_recollection.git
cd chamber_of_recollection
# open index.html in your browser or push to the gh-pages branch
```
1. Paste your API key (OpenAI, Anthropic, DeepSeek or Google).  
2. Create / Edit / Launch.

## 5. Writing Effective Prompts
A `.recall` file lives or dies by three short instructions.  Think of them as the *interface* between raw text and the way you want to practice.

### Context  
*What is this sheet about?*  
Give the model a 1-2 sentence overview.  It will be prepended to every request.

> **Default** – “This sheet covers the core ideas, arguments, dates and people relevant to *SUBJECT*. Assume the reader wants to *remember*, not merely look things up.”

### Ingest  
*How should raw text be cleaned and chunked?*  
Tell the model where to cut, summarise, and tag.

> **Default** – “Break the input into **atomic** blocks, one concept per block, ≤150 words each. Use plain prose. Strip citations. Keep equations intact. Preserve ordering.”

Variations: chronological ordering, hierarchy, add metadata tags, keep original wording, etc.

### Digest  
*How should questions be generated?*  
Describe the style of retrieval you want.

> **Default** – “Create open-ended, active-recall questions (no MCQ). Vary phrasing: _explain_, _compare_, _give an example_. Include a full answer paragraph.”

Variations: Socratic dialogue, fill-in-the-blank, code review, situational role-play, etc.

Use these three prompts to bend the same source material into wildly different drills—history timelines, proof sketches, or fictional moral dilemmas.

---

## 6. Contributing
Send pull requests, share `.recall` bundles, or open issues. Every improvement helps keep human memory alive.

## 7. License
MIT – use it, fork it, tempt oblivion.
