import { Q, sa, sc, withPassage } from "./seed-helpers";

// Original Cambridge C2 Proficiency-style Use of English items written for this platform.
// Not taken from any Cambridge exam, practice test or third-party bank.

const mcq = (n: number, opts: string[], explanation: string): Q =>
  sc(`Choose the word that best fits gap ${n}.`, opts, 0, explanation);

const open = (n: number, accepted: string[], explanation: string): Q =>
  sa(`Write ONE word for gap ${n}.`, accepted, explanation, 5);

const form = (n: number, base: string, accepted: string[], explanation: string): Q =>
  sa(`Use the word in capitals (${base}) to form a word that fits gap ${n}. Write ONLY the word.`, accepted, explanation, 5);

const kwt = (original: string, keyword: string, gapped: string, accepted: string[], explanation: string): Q =>
  sa(
    `Complete the second sentence so that it has a similar meaning to the first sentence, using the word given. Do not change the word given. You must use between THREE and SIX words, including the word given.\n\n${original}\n\nKEYWORD: ${keyword}\n\n${gapped}`,
    accepted,
    explanation,
    5,
  );

export const C2_USE_OF_ENGLISH: Q[] = [
  // ---- Part 1: multiple-choice cloze (16) ----
  ...withPassage(
    "The notion that memory is a faithful record of the past has been (1)___ by decades of psychological research. Far from being a recording, memory is a reconstruction, built (2)___ afresh each time it is recalled, and therefore open to subtle distortion. Eyewitnesses are notoriously (3)___ to suggestion: a leading question can give (4)___ to a false detail in an account that was never actually observed. Such findings have profound (5)___ for the legal system, where testimony has traditionally been given (6)___ weight. Some jurisdictions have responded by revising the way witnesses are questioned, although progress has been slower than many had hoped, and critics argue that reform has fallen (7)___ of what the evidence demands. Whether the courts will ever fully adjust remains, (8)___ the best of times, uncertain.",
    [
      mcq(1, ["undermined", "hindered", "obstructed", "hampered"], "A notion is 'undermined' by evidence."),
      mcq(2, ["up", "on", "in", "off"], "'Built up afresh' means constructed anew."),
      mcq(3, ["open", "exposed", "subject", "liable"], "'Open to suggestion' is the fixed expression."),
      mcq(4, ["rise", "way", "birth", "cause"], "'Give rise to' is the fixed expression."),
      mcq(5, ["implications", "involvements", "complications", "deductions"], "'Profound implications' is a standard collocation."),
      mcq(6, ["considerable", "heavy", "large", "grand"], "Weight is described as 'considerable'."),
      mcq(7, ["short", "low", "down", "away"], "'Fall short of' means fail to reach."),
      mcq(8, ["at", "in", "on", "by"], "'At the best of times' is the fixed expression."),
    ],
  ),
  ...withPassage(
    "The skyscraper came (1)___ being in the late nineteenth century, thanks to two developments: the passenger lift and the steel frame. Architects were quick to take (2)___ of the new possibilities, and by the 1930s the race for height had taken on a momentum of its (3)___. Yet the towers were not universally admired. Critics complained that they plunged the streets (4)___ permanent shadow, and that the pursuit of prestige had come at the (5)___ of human scale. Attempts to regulate height met with stiff resistance from developers, who argued that restrictions would (6)___ investment. Nevertheless, most cities eventually adopted rules requiring upper storeys to be set back, an approach that, (7)___ imperfect, at least allowed light to reach the pavement. It remains, in the end, a compromise between ambition and (8)___.",
    [
      mcq(1, ["into", "in", "to", "by"], "'Come into being' means begin to exist."),
      mcq(2, ["advantage", "benefit", "profit", "gain"], "'Take advantage of' is the fixed expression."),
      mcq(3, ["own", "self", "very", "proper"], "'A momentum of its own' is the fixed expression."),
      mcq(4, ["into", "at", "with", "on"], "'Plunge into shadow'."),
      mcq(5, ["expense", "sacrifice", "detriment", "damage"], "'At the expense of' is the fixed expression."),
      mcq(6, ["deter", "deprive", "deny", "dismiss"], "Restrictions would 'deter' investment."),
      mcq(7, ["albeit", "despite", "however", "whereas"], "'Albeit imperfect' means although imperfect."),
      mcq(8, ["restraint", "restriction", "reserve", "refusal"], "The noun contrasts naturally with 'ambition': 'restraint'."),
    ],
  ),
  // ---- Part 2: open cloze (16) ----
  ...withPassage(
    "It is a curious feature of modern life that the more information we have (1)___ our disposal, the less able we seem to be to make use of it. Not so (2)___ ago, a well-read person could reasonably hope to keep abreast of new developments in their field. Today such a hope would be (3)___ short of absurd. The sheer volume of publications means that even specialists must, (4)___ necessity, rely on summaries prepared by others. This has not, (5)___, prevented the growth of a widespread belief that more is always better. (6)___ we to stop and reflect, we might conclude that what we actually need is not more information (7)___ better filters. Such filters, (8)___ they to exist, would be of immense value.",
    [
      open(1, ["at"], "'At our disposal' is the fixed expression."),
      open(2, ["long"], "'Not so long ago'."),
      open(3, ["little", "nothing"], "'Little short of' or 'nothing short of' absurd."),
      open(4, ["by", "of"], "'By necessity' or 'of necessity'."),
      open(5, ["however", "though", "nevertheless", "nonetheless"], "A contrastive adverbial."),
      open(6, ["were"], "Inversion: 'Were we to stop and reflect'."),
      open(7, ["but"], "'Not ... but ...' contrasts the two items."),
      open(8, ["were"], "Inversion: 'Were they to exist'."),
    ],
  ),
  ...withPassage(
    "The history of medicine is (1)___ of stories of remedies that worked for reasons nobody understood. Willow bark, (2)___ example, had been used to relieve pain for centuries (3)___ anyone identified the compound responsible. Yet folk knowledge was as likely to mislead (4)___ to inform, and many traditional cures were, (5)___ put it bluntly, useless. It was only with the development of controlled trials that doctors were able to distinguish (6)___ genuine benefit and coincidence. Even today, patients (7)___ improve after a treatment may credit it wrongly. Much (8)___ the progress of modern medicine lies in learning to resist that natural temptation.",
    [
      open(1, ["full"], "'Full of stories'."),
      open(2, ["for"], "'For example'."),
      open(3, ["before"], "The remedy was used centuries before anyone identified the compound."),
      open(4, ["as"], "'As likely to mislead as to inform'."),
      open(5, ["to"], "'To put it bluntly'."),
      open(6, ["between"], "'Distinguish between X and Y'."),
      open(7, ["who", "that"], "A relative pronoun referring to patients."),
      open(8, ["of"], "'Much of the progress'."),
    ],
  ),
  // ---- Part 3: word formation (16) ----
  ...withPassage(
    "Few linguists dispute that the (1)___ of a language represents an irreplaceable loss. Each language embodies a unique (2)___ of the world. Yet the pace of loss is (3)___: linguists estimate that roughly one tongue vanishes every fortnight, a (4)___ statistic. Efforts at (5)___ have had mixed success. Where communities are (6)___ and resources adequate, the results can be (7)___. Ultimately, however, success depends on the (8)___ of younger speakers to use the language in daily life.",
    [
      form(1, "APPEAR", ["disappearance"], "A noun with the prefix dis- and suffix -ance."),
      form(2, "PERCEIVE", ["perception"], "A noun meaning a way of seeing."),
      form(3, "ALARM", ["alarming"], "An adjective describing the pace."),
      form(4, "DEVASTATE", ["devastating"], "An adjective before 'statistic'."),
      form(5, "REVIVE", ["revival"], "A noun after the preposition 'at'."),
      form(6, "DETERMINE", ["determined"], "An adjective describing communities."),
      form(7, "MARK", ["remarkable"], "An adjective after 'can be'."),
      form(8, "WILL", ["willingness"], "A noun after 'the' and before 'of'."),
    ],
  ),
  ...withPassage(
    "Changing careers in mid-life is often portrayed as a (1)___ act of rebellion, yet the reality is usually far more (2)___. Most people who change direction do so after a long period of quiet (3)___ and after taking (4)___ steps such as retraining. Those who succeed tend to be (5)___ about the sacrifices involved: they accept a (6)___ drop in income and show a real (7)___ to learning. The rewards, when they come, are often (8)___.",
    [
      form(1, "DRAMA", ["dramatic"], "An adjective before 'act'."),
      form(2, "INCREMENT", ["incremental"], "An adjective meaning happening in small stages."),
      form(3, "SATISFY", ["dissatisfaction"], "A negative noun after 'quiet'."),
      form(4, "PRACTISE", ["practical"], "An adjective before 'steps'."),
      form(5, "REAL", ["realistic"], "An adjective after 'be'."),
      form(6, "SUBSTANCE", ["substantial"], "An adjective before 'drop'."),
      form(7, "COMMIT", ["commitment"], "A noun after 'real'."),
      form(8, "MEASURE", ["immeasurable"], "A negative adjective after 'are often'."),
    ],
  ),
  // ---- Part 4: key word transformations (8) ----
  kwt("It doesn't matter to me which restaurant we choose.", "DIFFERENCE", "It ________ to me which restaurant we choose.", ["makes no difference"], "'Makes no difference' means it doesn't matter."),
  kwt("However hard she tried, she could not persuade him.", "MATTER", "________, she could not persuade him.", ["no matter how hard she tried", "no matter how much she tried"], "'No matter how' expresses concession."),
  kwt("The manager was very close to resigning.", "VERGE", "The manager was ________ resigning.", ["on the verge of"], "'On the verge of' means very close to."),
  kwt("I regret that I didn't listen to my parents' advice.", "HEEDED", "I wish ________ my parents' advice.", ["i had heeded", "i'd heeded"], "'Wish + past perfect' expresses regret about the past."),
  kwt("They only realised the danger when it was too late.", "DAWN", "The danger ________ them until it was too late.", ["did not dawn on", "didn't dawn on"], "'Dawn on someone' means to become clear to them."),
  kwt("He is thought to be the best player of his generation.", "REGARDED", "He ________ the best player of his generation.", ["is regarded as", "is widely regarded as", "is generally regarded as"], "The passive 'is regarded as' expresses opinion."),
  kwt("Sales have fallen dramatically this year.", "DRAMATIC", "There has been ________ sales this year.", ["a dramatic fall in", "a dramatic drop in", "a dramatic decline in", "a dramatic decrease in"], "A noun phrase with 'dramatic' replaces the adverb."),
  kwt("I'm sure he didn't intend to insult you.", "MEANT", "He ________ insult you.", ["can't have meant to", "cannot have meant to", "couldn't have meant to", "could not have meant to"], "A modal of deduction in the past."),
];
