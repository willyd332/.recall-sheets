# [.recall](https://willyd332.github.io/.recall-sheets/)

> "Without memory, thought disperses, becoming thin and shallow. So, we read and reread, not just to retain but to reawaken a mode of thinking grounded in memory, and so a deeper continuity with a different type of attention. We enter a richer world through this deeper engagement."
> –— From [The Lost Art of Memory](https://open.substack.com/pub/secondvoice/p/the-lost-art-of-memory)

## 1. The Problem

Google Search, AI Models, Apple Notes — in the face of such immense utility, our own cognition is at risk of withering.  
Wisdom is reduced to knowledge is reduced to information.
Yet, just as we still go to the gym for physical health, we ought to have a mental gym for cognitive health.
Archive all you want, but remember: knowledge as a muscle, and you can strengthen it by lifting.
Enter .recall: a memory/study trainer that uses AI to help you excercise your **active recall** rather than surrendering it to the cloud.

## 2. The Idea

* **AI-First Filetype** – A `.recall` file is basically just a json list and 3 text prompts to instruct the AI on how to interact with the json block. The idea is that it is shareable, and useable with this app so that anyone can 1) gather information sets, 2) create cool and unique instructions, and 3) share it with others to be used in this app.
* **The Prompts** – There are three: Context, Ingest, and Digest. Open a .recall file in this app and the file itself tells the model how to *ingest* new notes, how to *digest* it's own notes when it is time to quiz you on them, and the general *context* of the notes.
* **The JSON block** – This is just a list of text created with the *ingest* prompt. Nothing fancy. The AI gets access to one block for each question, and parses it according to the *digest* prompt. It can be as large as you want it to be.
* **Shareable & Hackable** – Chare a `.recall` and anyone can study it. No server, no secrets—just a portable text file.

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

## 5. Writing Effective Prompts

**The best way to learn** is to look at the examples in `/example_recall_sheets` and play with them in the app. These are just some random ideas I have to demonstrate how this can work.

A `.recall` file lives or dies by three short instructions.  Think of them as the *interface* between raw text and the way you want to practice.

### Context  

*What is this particular sheet about?*  

In a .recall sheet, the model will only read one bit of information at a time. It does NOT have access to the full set of information. Thus, the Context prompt is what will allow it to know the bigger picture. This can change wildly depending on the particular use case. Just some examples:

* Perhpas it is a .recall sheet for an undergraduate Math course, and you want to GPT to understand the scope of the topics covered.

* Perhaps it is a .recall sheet for a history book. You might want to include a summary/timeline/overall argument in the context prompt so that it is able to conextualized assorted bits of information.

> **Default Example:** – “This sheet covers the core ideas, arguments, dates and people relevant to *SUBJECT*. Assume the reader wants to *remember*, not merely look things up.”

### Ingest  

*How should raw text be cleaned and chunked?* 

When you "ingest" information, you will likely be pasting in large chunks of info — full chapters of a book, notes from a class, articles, etc. This is where you describe the specifics of how you want it to clean/organize that information. Maybe you want these information bits to be highly granular and short; maybe you want them to be broad and long. You decide.

> **Default Example** – “Break the input into **atomic** blocks, one concept per block, ≤150 words each. Use plain prose. Strip citations. Keep equations intact. Preserve ordering.”

Variations: chronological ordering, hierarchy, add metadata tags, keep original wording, etc.

### Digest  

*How should questions be generated?*  

The .recall sheet will read one of the ingested bits and genearate a Q/A pair for you; essentially like a flashcard. However, since it is AI you can be as creative as you want. 

For example: if you are studying a language and your .recall information is a list of vocabulary, you could specificy in the digest that you want the AI to generate a short story or complete sentence using the word in question, so that you can study it in context. Or, for example, if you are studying mathemetics, you could have the AI generate a sample problem that, to solve, would require using the concept listed on the information block. Or, for example, if you were feeling creative and studying history, you could instruct the AI to imitate a historical newspaper, and write a short (perhaps clozed) column about a particular event and have you fill in the blanks.

> **Default Example** – “Create open-ended, active-recall questions (no MCQ). Vary phrasing: _explain_, _compare_, _give an example_.”

Possiblities are endless. These prompts are an art, not a science. What's nice is that, if you come up with a good one, you can just share the .recall file and other people will be able to use it and adapt it.

---

## 6. Contributing

Send pull requests.

## 7. License

MIT – use it, fork it, tempt oblivion.
