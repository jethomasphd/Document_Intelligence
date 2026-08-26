# The Shape of What You've Written

*You have more documents than you can read. Here is how to see all of them at once — and how to write into the spaces between them.*

**J. E. Thomas** · There is a working version of everything described here. It runs in your browser: [document-intelligence.pages.dev](https://document-intelligence.pages.dev)

---

## The pile

Somewhere in your files there is a folder you avoid opening.

Maybe it holds a year of marketing emails. Maybe it holds every product description in your catalog, or every customer review you've ever received, or ten years of grant abstracts, or the chapters of a book you keep circling. Each document in that folder exists because someone sat down and made it. Each one was, briefly, the most important thing on somebody's screen.

And now they form a pile, and the pile keeps a secret.

The secret is not in any single document — you've read those, or you could. The secret is in the *relationships*: which documents are quietly saying the same thing in different words, which one is unlike all the others, what your best work has in common, and what nobody has written yet. Those are the questions that actually matter to you. And they are exactly the questions a pile refuses to answer, because you can only read one document at a time, and the relationships live between them.

Search doesn't help as much as it should. Search is a flashlight: it finds what you already know to name. The pattern you've never named — the thing your five best emails share that your fifty average ones don't — stays in the dark, not because it's hidden, but because no one has ever been able to stand far enough back to see it.

This is the story of a tool built for standing back.

## A strange fact about meaning

In the last few years, language models quietly learned to do something that still feels like a card trick: they can turn a piece of writing into a **location**.

Feed one of these models a sentence, a paragraph, a whole chapter — it hands you back a point in space. Not a summary, not a keyword list. Coordinates. A thousand and twenty-four of them, which is a space no human can picture, and the good news is that you never have to. Only one property of that space matters, and it is the whole trick:

**Texts that mean similar things land close together.**

Not texts that share words. Texts that share *meaning*. An email about "fiscal Q3 performance" and one about "quarterly revenue results" have almost no vocabulary in common, and they land side by side anyway, because the model has read enough of the world to know they are the same thought wearing different clothes. A complaint written in fury and a complaint written in icy politeness land in the same neighborhood, because underneath the manners they are the same complaint.

Meaning, it turns out, has geography.

Which raises an obvious, slightly vertiginous question: if every document you've ever written has a location — what does the map look like?

## The map

Document Intelligence exists to answer that question, and it insists on doing it in the least ceremonial way possible: in a browser tab.

You bring a spreadsheet. One row per document, one column holding the text — subject lines, descriptions, reviews, abstracts, whatever your pile is made of. You drop it in. The tool sends each row out to be measured, gets back each document's coordinates, and then does the thing you actually came for: it flattens that unpicturable thousand-dimensional space down to two dimensions, carefully, so that near things stay near. (The flattening is done by a pair of techniques with wonderful names — principal component analysis and UMAP — and you are free to never think about either of them again.)

Then the dots settle onto your screen, and you are looking at something genuinely new: **every document you gave it, all at once, arranged by what they mean.**

The first time, people tend to just look for a while. It reads like an aerial photograph of a city you've been living in at street level:

- **Neighborhoods.** Dots bunch into clusters — documents that share a theme, a tone, a move. You didn't tag them. Nobody sorted them. They found each other.
- **Borders.** Where two clusters blur into each other live your bridge documents — the ones that belong to two conversations at once. These are often your most interesting pieces, and the map finds them for free.
- **Empty lots.** And between the neighborhoods: open space. Regions adjacent to everything you do, where nothing you've written currently lives. Hold that thought. The empty space turns out to be the most valuable real estate on the map.

Every dot is still a real document. Click one and it opens — full text, and beside it the twenty-five documents nearest to it in meaning, ranked, including the ones you would never have shelved together. The map is not a diagram *about* your writing. It *is* your writing, standing in formation for the first time.

## Two thousand subject lines

Here is the story I tell people when they ask what this is for.

A marketing team has two thousand email subject lines from the past year. They know the open rate of every single one — that part they've always had. Some lines were hits, most were fine, a few sank. And every Monday, someone on that team writes new subject lines the way everyone writes them: by feel, by memory of what worked, by staring at the ceiling.

They give the pile to the map. It takes about a minute. They tag their hits — the top of the open-rate table — as **Top Performers**, and everything else as **Other**, so the winners show up in gold.

The map loads, and the room goes quiet, because the gold is not sprinkled evenly across the picture. It has *condensed*. Two tight islands.

One island is urgency: deadlines, closing windows, tonight. The other island, across a stretch of open water, is curiosity: the unopened box, the question mark, the one thing nobody tells you. Around and between the islands, the fifteen hundred average subject lines hang like fog — a little of everything, committed to nothing.

A year of intuition, confirmed and sharpened in one glance: *this team's audience opens two kinds of email.* Not a slide of quarterly guesswork. A shape.

But the shape holds one more thing, and it's the part that changes behavior. Between the two gold islands — between urgency and curiosity, bordering both — there is an empty lot. A region where a subject line would carry a deadline's pressure *and* a secret's pull.

Nobody on the team has ever written that line. The map doesn't just show them what works.

It shows them what's missing.

![The map that showed the gap — and the drafts that landed in it](figures/figure4_story_map.svg)

*Left: two thousand subject lines arranged by meaning — the winners condensed into two islands, with an empty region between them. Right: ten generated drafts, measured and placed on the same map; five landed where the team pointed.*

## Asking why

A map that only made you say *huh* would be a poster. This one takes questions.

You can put any two groups side by side and ask how they actually relate. The tool takes every document in the first group, finds its closest relatives in the second, and lays out the whole pattern of kinship as a distribution — not one bland average but a shape, with peaks where the groups echo each other and a tail where they don't. Five-star reviews against one-star reviews. This year's proposals against the ones that got funded. Your team's writing against the competitor pages you admire.

And when you want the pattern in words, you can ask for that too. The tool hands real samples from both groups to a language model and has it report back, in a few plain paragraphs, what distinguishes them — a narrator with the documents open in front of it, describing what it sees. You stay the judge. But you no longer have to be the one reading two thousand documents to get a verdict.

## Writing into the gap

Everything so far, some very good tools can approximate. Here is the part that feels different.

On this map, you can *point*.

The team from our story circles the empty lot between their two winning islands. The tool quietly gathers the ten real subject lines nearest that spot — the true natives of the region — and hands them, along with one sentence of intent from the team, to a language model with a precise brief: *write ten new lines that belong exactly here.*

Ten candidates come back. And now the tool does the thing that makes this more than a toy.

**It doesn't take the writer's word for it.**

Each new line is sent out and measured — turned into coordinates by the same instrument that measured the original two thousand — scored against the center of the target, and then dropped onto the map in front of you. Five gold stars for the candidates that landed closest to where you pointed. Gray circles for the ones that drifted.

Sit with how unusual that is. The generator makes a claim — *this belongs there* — and the map, which was built before the generator ever spoke, checks the claim and shows you the result. When a star lands inside your circle, that's not the AI grading its own homework; it's an independent measurement. And when a candidate lands wide, that's not a failure — it's information. The miss shows you the difference between what you asked for and what that region actually contains, which is sometimes the most useful thing you learn all day.

The new drafts never contaminate your originals; they export as their own file, scores attached. Your corpus stays a record of what you actually wrote. The map stays honest.

You've stopped asking *"write me something good."* You've started saying ***"write me something that lives here"*** — and checking the address.

## Yours

A quiet fact about all of this, easy to miss and worth saying plainly: **your documents stay with you.**

There is no account. There is no company database with your pile in it. The corpus — text, coordinates, map — lives in your own browser's storage, on your own machine. Text leaves only in the moment of being measured or written, passing through a relay that holds the service keys and keeps nothing: no storage, no logs. Delete a corpus and it is simply gone, because there was never another copy anywhere to chase down.

And one honest note about the picture itself, because this tool would rather be trusted than impressive: the 2-D map is a flattening of something far bigger, and flattenings distort — trust the neighborhoods, not millimeters of distance. That's exactly why every number you're ever shown — every neighbor ranking, every comparison, every gold star — is measured back in the full space, where nothing was flattened. The map is where you look.

The measurements are where you stand.

## Ten minutes

Here's how small the barrier actually is.

You need a spreadsheet with a column of text in it. That's the whole entry fee. Subject lines, product descriptions, reviews, abstracts, chapters, job postings, docstrings, song lyrics — if it can be pasted into a cell, it can be a dot on a map.

1. Open **[document-intelligence.pages.dev](https://document-intelligence.pages.dev)** and choose **New Corpus**.
2. Drop in the file, and point the tool at your text column. If you can, add a category column — even just *"Best"* and *"Other"* is enough to make your winners glow.
3. Give it a minute. Watch the dots settle.

Then try the three moves, in order:

- **Find the loner.** Click the dot sitting far from everything. Read it. There's usually a story.
- **Compare your best against the rest.** Look at the shape of the difference — you're seeing what your intuition has been trying to tell you for years.
- **Find the empty lot next to your best work.** Circle it. Ask for ten drafts that belong there, and watch where the stars land.

You've been building a territory for years, one document at a time, always at street level.

Come see it from above.

---

*The tool described here is free and open source (MIT). Code: [github.com/jethomasphd/Document_Intelligence](https://github.com/jethomasphd/Document_Intelligence). For the technical account of the same system — architecture, projection mathematics, and the generate-and-verify loop — see the companion whitepaper in this directory.*
