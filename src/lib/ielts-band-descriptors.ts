export type IeltsTaskType = "TASK_1" | "TASK_2";

const shared = `
SCORING PRINCIPLE
- Judge each criterion independently against the official IELTS Writing Band Descriptors (Updated May 2023).
- A response should only receive a band when it fits the positive features at that level. Limiting negative features at a lower level must cap the score when they clearly apply.
- Use 0.5 only when the evidence genuinely falls between two adjacent descriptor levels. Never inflate a score because the essay sounds fluent overall.
- Band 1 applies to responses of 20 words or fewer. Band 0 is reserved for no meaningful attempt, English not used throughout, or proven totally memorised responses.

COHERENCE AND COHESION (CC)
9: Effortless to follow; cohesion is unobtrusive; lapses are minimal; paragraphing is skilfully managed.
8: Easy to follow; ideas are logically sequenced; cohesion is well managed; only occasional lapses; paragraphing is sufficient and appropriate.
7: Clear logical organisation and progression; cohesive devices/reference/substitution are flexible but may have minor inaccuracies or over/under-use; paragraphing supports coherence.
6: Generally coherent with clear overall progression; cohesive devices work to some good effect but can be mechanical/faulty; reference/substitution may lack flexibility; paragraphing may not always be logical.
5: Organisation is evident but not wholly logical; progression may be weak; links between sentences are not fluent; cohesive devices may be limited/overused/inaccurate; repetition may occur; paragraphing may be inadequate.
4: Ideas are not arranged coherently and there is no clear progression; relationships are unclear; basic cohesive devices may be inaccurate/repetitive; referencing is weak; paragraphing may be absent or unclear.
3: No apparent logical organisation; ideas are difficult to relate; minimal sequencing/cohesive devices; referencing is difficult; paragraphing attempts are unhelpful.
2: Little evidence of organisational control.
1: The writing fails to communicate a message and appears to be by a virtual non-writer.

LEXICAL RESOURCE (LR)
9: Very wide, precise, natural and sophisticated vocabulary control; spelling/word-formation errors are extremely rare and have minimal impact.
8: Wide, fluent and flexible vocabulary for precise meaning; skilful uncommon/idiomatic use; occasional word-choice/collocation/spelling errors have minimal impact.
7: Sufficient range for flexibility and precision; some less common/idiomatic items; awareness of style/collocation; only a few spelling/word-formation errors that do not reduce clarity.
6: Generally adequate and appropriate vocabulary; meaning remains clear despite restricted range or lack of precision; some spelling/word-formation errors do not impede communication.
5: Limited but minimally adequate vocabulary; simple vocabulary may be accurate but expression lacks variation; frequent inappropriate choices/simplification/repetition; spelling/word-formation errors may cause some difficulty.
4: Limited and inadequate or unrelated vocabulary; basic/repetitive wording; possible memorised/formulaic chunks; word-choice/spelling/word-formation errors may impede meaning.
3: Inadequate vocabulary, possible over-dependence on input/memorised language; word-choice/spelling errors predominate and may severely impede meaning.
2: Extremely limited vocabulary with only a few recognisable strings.
1: No resource beyond a few isolated words.

GRAMMATICAL RANGE AND ACCURACY (GRA)
9: Wide range of structures used with full flexibility/control; grammar and punctuation appropriate throughout; errors are extremely rare and minimally consequential.
8: Wide range used flexibly and accurately; majority of sentences are error-free; punctuation well managed; occasional non-systematic errors have minimal impact.
7: Variety of complex structures with some flexibility/accuracy; grammar and punctuation generally controlled; error-free sentences are frequent; a few persistent errors do not impede communication.
6: Mix of simple and complex forms but limited flexibility; complex structures are less accurate than simple ones; grammar/punctuation errors occur but rarely impede communication.
5: Limited/repetitive structures; complex attempts are often faulty and simple sentences are most accurate; frequent grammar errors may cause difficulty; punctuation may be faulty.
4: Very limited structures; subordinate clauses are rare and simple sentences predominate; frequent grammar errors may impede meaning; punctuation is often faulty/inadequate.
3: Sentence forms are attempted but grammar/punctuation errors predominate and prevent much meaning from coming through; length may be insufficient to show control.
2: Little or no evidence of sentence forms apart from memorised phrases.
1: No rateable language is evident.
`;

const task1 = `
TASK 1 - TASK ACHIEVEMENT (TA)
Apply Academic descriptors when the prompt is a chart/graph/table/map/process/diagram; apply General Training descriptors when it is a letter.
9: All task requirements are fully and appropriately satisfied; content lapses are extremely rare.
8: Requirements are covered appropriately, relevantly and sufficiently; Academic key features are skilfully selected, clearly presented/highlighted/illustrated; GT bullet points are clearly presented and extended; only occasional omissions/lapses.
7: Requirements are covered; content is relevant and accurate with only a few omissions/lapses; Academic response has a clear overview, appropriate categorisation and identifies main trends/differences; key features are highlighted but could be more fully illustrated; GT purpose/tone are clear and appropriate with all bullet points covered.
6: Response focuses on requirements and uses an appropriate format; Academic key features are adequately highlighted and a relevant overview is attempted with selected figures/data; GT bullet points are adequately covered and purpose generally clear; some detail may be missing/excessive/irrelevant/inaccurate.
5: Requirements are generally addressed but key features/bullet points are not adequately covered; detail may be mechanical, the bigger picture may be weak, data support may be missing, and irrelevant/inaccurate material may detract; extension is limited.
4: There is an attempt to address the task but few key features/bullet points are covered; format/tone may be inappropriate; presented content may be irrelevant, repetitive or inaccurate.
3: Requirements are not addressed, possibly because the task/visual is misunderstood; selected key features are largely irrelevant; only limited repetitive information is given.
2: Content barely relates to the task and carries little relevant message.
1: Response is 20 words or fewer or wholly unrelated to the task; copied rubric must be discounted.
0: No attempt, non-English throughout, or proof the answer is totally memorised.
`;

const task2 = `
TASK 2 - TASK RESPONSE (TR)
9: Prompt is appropriately addressed and explored in depth; position is clear and fully developed; ideas are relevant, fully extended and well supported; lapses are extremely rare.
8: Prompt is appropriately and sufficiently addressed; clear, well-developed position; ideas are relevant, well extended and supported; only occasional omissions/lapses.
7: Main parts of the prompt are appropriately addressed; clear developed position; main ideas are extended and supported, though there may be over-generalisation or some lack of focus/precision in support.
6: Main parts are addressed and format is appropriate; position is relevant but conclusions may be unclear/unjustified/repetitive; main ideas are relevant but some are insufficiently developed or supported.
5: Main parts are incompletely addressed; position exists but development is not always clear; ideas are limited/insufficiently developed and may contain irrelevant detail or repetition.
4: Prompt is tackled minimally or tangentially; position is only discernible with effort; main ideas are difficult to identify and may lack relevance, clarity or support; repetition may be substantial.
3: No part is adequately addressed or the prompt is misunderstood; no relevant position can be identified; few ideas are presented and they may be irrelevant or insufficiently developed.
2: Content is barely related to the prompt; no position can be identified; only glimpses of undeveloped ideas appear.
1: Response is 20 words or fewer or wholly unrelated to the prompt; copied rubric must be discounted.
0: No attempt, non-English throughout, or proof the answer is totally memorised.
`;

export function getIeltsBandDescriptorPrompt(taskType: IeltsTaskType) {
  return `${taskType === "TASK_1" ? task1 : task2}\n${shared}`.trim();
}
