# IELTS Vocabulary Library v5

## Scope

The production vocabulary library now contains **2,500 unique IELTS-oriented headwords and phrases** across three learning tiers. These tiers are a learning design, not official IELTS vocabulary bands.

- **Group 1 — Band 3.5-5.0 foundation:** 700 entries. Selected items remain useful around Band 5.5.
- **Group 2 — Band 5.0-6.5 development:** 850 entries. Selected items remain useful around Band 7.0.
- **Group 3 — Band 6.5+ advanced:** 950 entries. Selected items remain useful around Band 7.5 when used accurately and naturally.

Each group contains **15 main topics + 7 supplementary topics**. The library has **66 topic buckets** in total and **no duplicated headword/phrase across groups**.

## Four-skill design

The expansion was designed for all four IELTS skills rather than Writing-only vocabulary.

### Reading

The library includes academic nouns, policy terminology, scientific and social-science concepts, paraphrases and multiword terms that commonly appear in expository texts. Group 3 intentionally contains receptive vocabulary such as `methodological rigour`, `habitat fragmentation`, `information asymmetry`, `transboundary water`, and `supply-chain due diligence`.

### Listening

Group 1 and Group 2 retain a large everyday/service layer for Sections 1-2 and a study/work/academic layer for Sections 3-4. This includes travel, bookings, facilities, schedules, education, workplace language, research and public-service vocabulary.

### Speaking

The database includes natural collocations and phrases that can be used without sounding memorised, for example `spend time together`, `workplace flexibility`, `community sport`, `cultural belonging`, and `career prospects`. Examples are short enough to model spoken use.

### Writing

Groups 2-3 emphasise precise collocations and paraphrases for Task 2 and academic language useful around Task 1 domains, including government, demographics, transport, environment, education, technology, health, economics and science.

The library deliberately avoids treating obscure vocabulary as automatically "high band". Precision, appropriacy, collocation and flexible use matter more than rarity.

## Research basis

Topic selection and expansion were informed by:

- official IELTS guidance on Lexical Resource, which emphasises range, precision, appropriacy, accuracy, spelling/word formation and natural collocation;
- official IELTS test-format guidance showing the need for everyday/familiar language in Speaking and parts of Listening, alongside academic and general-interest material in Academic Reading/Listening;
- IDP topic banks covering recurring themes such as education, health, technology, environment, family, travel, transport, employment, crime, media and consumer life;
- IDP's common Listening-topic guidance, which includes practical service vocabulary as well as education, assessment, public speaking and academic content;
- Cambridge IELTS 15-21 topic patterns used only at the domain level to identify recurring lexical needs across authentic-style Listening, Reading, Writing and Speaking practice.

No Cambridge question, transcript, passage or sample answer is copied into the database. All meanings and example sentences in this project are original learning content.

## Data fields

Every entry contains:

- headword or multiword phrase;
- concise English meaning;
- Vietnamese explanation;
- original IELTS-style example sentence;
- optional synonym/paraphrase list.

Pronunciation uses the existing Web Speech API feature, so newly imported entries receive audio automatically without MP3 storage.

## Maintenance

Core source files:

- `prisma/vocabulary-data/group1.txt`
- `prisma/vocabulary-data/group2.txt`
- `prisma/vocabulary-data/group3.txt`

Four-skill v5 expansion:

- `prisma/vocabulary-data/group1-extra.txt`
- `prisma/vocabulary-data/group2-extra.txt`
- `prisma/vocabulary-data/group3-extra.txt`

Validation commands:

```bash
npm run vocab:validate
npm run vocab:audit
```

`vocab:validate` regenerates `prisma/vocabulary-library.json` and migration `0004_vocab_four_skill_expansion`. It rejects duplicate headwords and verifies the exact 700/850/950 group totals.

`vocab:audit` performs learner-data QA: required fields, duplicates, topic distribution, example punctuation and basic field-length checks.
