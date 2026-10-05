import { Q, sa, sc, withPassage } from "./seed-helpers";

// Original Cambridge C1 Advanced-style Use of English items written for this platform.
// Not taken from any Cambridge exam, practice test or third-party bank.

// Multiple-choice cloze item: the first option is correct (rotation shuffles positions).
const mcq = (n: number, opts: string[], explanation: string): Q =>
  sc(`Choose the word that best fits gap ${n}.`, opts, 0, explanation);

const open = (n: number, accepted: string[], explanation: string): Q =>
  sa(`Write ONE word for gap ${n}.`, accepted, explanation, 4);

const form = (n: number, base: string, accepted: string[], explanation: string): Q =>
  sa(`Use the word in capitals (${base}) to form a word that fits gap ${n}. Write ONLY the word.`, accepted, explanation, 4);

const kwt = (original: string, keyword: string, gapped: string, accepted: string[], explanation: string): Q =>
  sa(
    `Complete the second sentence so that it has a similar meaning to the first sentence, using the word given. Do not change the word given. You must use between THREE and SIX words, including the word given.\n\n${original}\n\nKEYWORD: ${keyword}\n\n${gapped}`,
    accepted,
    explanation,
    4,
  );

export const C1_USE_OF_ENGLISH: Q[] = [
  // ---- Part 1: multiple-choice cloze (16) ----
  ...withPassage(
    "Working from home has firmly (1)___ root in many people's lives. For some, the freedom of avoiding a long commute outweighs the loneliness that can go (2)___ working alone. Employers, meanwhile, have discovered that trust is (3)___ more important than constant supervision. Yet not everyone is enthusiastic (4)___ the change. Younger employees, in particular, often miss (5)___ on the informal learning that (6)___ place naturally in an office. Many companies are therefore experimenting (7)___ hybrid arrangements designed to (8)___ the need for flexibility with the value of face-to-face contact.",
    [
      mcq(1, ["taken", "put", "made", "set"], "The fixed expression is 'take root'."),
      mcq(2, ["with", "to", "by", "for"], "'Go with' means to accompany or be associated with."),
      mcq(3, ["far", "so", "very", "quite"], "'Far more important' is the correct intensified comparative."),
      mcq(4, ["about", "for", "of", "at"], "The adjective 'enthusiastic' is followed by 'about'."),
      mcq(5, ["out", "up", "off", "away"], "The phrasal verb is 'miss out on'."),
      mcq(6, ["takes", "makes", "does", "has"], "The collocation is 'take place'."),
      mcq(7, ["with", "on", "for", "at"], "We 'experiment with' something."),
      mcq(8, ["balance", "weigh", "measure", "level"], "'Balance one need with another' fits the sense."),
    ],
  ),
  ...withPassage(
    "Urban foxes are (1)___ longer a rare sight in European cities. Once shy creatures of the countryside, they have taken (2)___ life among people with remarkable ease. Scientists believe the animals were not put (3)___ by the noise of traffic; on the contrary, the food scraps and the shelter offered by gardens and sheds gave them all they needed to thrive. Some residents welcome the visitors, while others take a (4)___ view of them as pests. Researchers who have followed the animals for many years have (5)___ that urban foxes are smaller and bolder than their rural cousins. As numbers grow, so (6)___ the risk of disease. Experts are sharply divided (7)___ whether the population should be controlled, and no consensus has yet (8)___.",
    [
      mcq(1, ["no", "not", "never", "none"], "'No longer' is the fixed expression."),
      mcq(2, ["to", "in", "on", "up"], "'Take to' means to adapt quickly to something."),
      mcq(3, ["off", "away", "out", "down"], "The phrasal verb is 'put off', meaning discourage."),
      mcq(4, ["dim", "faint", "weak", "low"], "'Take a dim view of' means to disapprove of."),
      mcq(5, ["concluded", "decided", "resolved", "intended"], "Researchers 'conclude that' something is the case."),
      mcq(6, ["does", "is", "has", "will"], "'So does the risk' is the inversion used for parallel change."),
      mcq(7, ["over", "at", "by", "from"], "People are 'divided over' an issue."),
      mcq(8, ["emerged", "occurred", "happened", "resulted"], "'A consensus emerges' is the standard collocation."),
    ],
  ),
  // ---- Part 2: open cloze (16) ----
  ...withPassage(
    "Most people assume that the ability to concentrate is something we are simply born (1)___, like height or eye colour. In fact, research suggests that attention can be trained, (2)___ as a muscle can be strengthened through exercise. (3)___ regular practice, people of any age can learn to resist distraction. The techniques are surprisingly simple. One involves setting aside short periods (4)___ which all devices are switched off. Another requires people to notice, (5)___ judging, when their mind wanders and to bring it back gently. (6)___ these methods sound straightforward, they take patience, and few people notice results (7)___ the first few weeks. Those who persevere, (8)___, often report a lasting improvement in their ability to focus.",
    [
      open(1, ["with"], "We are 'born with' an ability."),
      open(2, ["just", "much"], "'Just as' introduces a comparison."),
      open(3, ["with", "through", "by"], "'With regular practice' means by practising regularly."),
      open(4, ["during", "in"], "'During which' or 'in which' relates to the periods of time."),
      open(5, ["without"], "'Without judging' means not judging."),
      open(6, ["although", "while", "though", "whilst"], "A concessive conjunction is needed."),
      open(7, ["within", "in", "during"], "Results are noticed within the first few weeks."),
      open(8, ["however"], "A contrastive adverb links to the earlier sentence."),
    ],
  ),
  ...withPassage(
    "The invention of the paperback in the 1930s is often credited (1)___ transforming reading habits. Before then, books were expensive objects, bought (2)___ the wealthy and borrowed by everyone else. Cheap paperbacks changed this, (3)___ readers could now afford to build a library of their own. Not all publishers welcomed the trend, (4)___. Some feared that readers would no longer value books if they were so easily replaced. (5)___ their doubts, sales continued to climb, and by the end of the decade the format had won (6)___ acceptance. Today, (7)___ e-books threaten to replace paper altogether, paperbacks remain (8)___ popular as ever.",
    [
      open(1, ["with"], "Something is 'credited with' an achievement."),
      open(2, ["by"], "The agent of buying: 'bought by the wealthy'."),
      open(3, ["as", "since", "because"], "The clause gives the reason for the change."),
      open(4, ["however", "though"], "A contrastive adverb at the end of the sentence."),
      open(5, ["despite", "notwithstanding"], "'Despite their doubts' introduces the contrast."),
      open(6, ["wide", "widespread", "general", "broad"], "'Won wide acceptance' is a collocation."),
      open(7, ["although", "though", "while", "whilst"], "A concessive conjunction is required."),
      open(8, ["as"], "'As popular as ever' is the comparative structure."),
    ],
  ),
  // ---- Part 3: word formation (16) ----
  ...withPassage(
    "The science of sleep has advanced (1)___ over the past fifty years. Researchers once believed that the brain simply switched off at night, but the (2)___ of modern scanning technology has shown that the sleeping brain is highly active. Different stages of sleep appear to serve different (3)___ functions, from repairing tissue to consolidating memories. Chronic lack of sleep is now linked to a number of (4)___ conditions, including heart disease. Many people are (5)___ of just how much sleep they need, and the amount varies greatly between individuals. Doctors therefore avoid offering a single (6)___ figure. They do, however, stress that a regular routine is (7)___ for a good night's rest, and that screens should be avoided in the evening, as bright light can cause (8)___ to the body's internal clock.",
    [
      form(1, "CONSIDER", ["considerably"], "An adverb modifying 'advanced'."),
      form(2, "ARRIVE", ["arrival"], "A noun after 'the' and before 'of'."),
      form(3, "BIOLOGY", ["biological"], "An adjective before 'functions'."),
      form(4, "MEDICINE", ["medical"], "An adjective before 'conditions'."),
      form(5, "AWARE", ["unaware"], "The negative adjective fits 'of just how much sleep they need'."),
      form(6, "UNIVERSE", ["universal"], "An adjective meaning applying to everyone."),
      form(7, "ESSENCE", ["essential"], "An adjective after 'is'."),
      form(8, "DISRUPT", ["disruption"], "A noun after 'cause' and before 'to'."),
    ],
  ),
  ...withPassage(
    "Anyone who has tried to learn a musical instrument as an adult knows how (1)___ the process can be. Children appear to pick up new skills with little (2)___, while adults are often held back by a fear of making mistakes. Music teachers, however, insist that adult learners have real (3)___: they are more disciplined, they understand the value of (4)___ and they usually choose to study out of (5)___ rather than obligation. The key, teachers say, is to set realistic (6)___ and to accept that progress will be gradual. Learners who are (7)___ for quick results tend to give up early, whereas those who enjoy the process itself are more likely to be (8)___ and to keep going for years.",
    [
      form(1, "FRUSTRATE", ["frustrating"], "An adjective describing the process."),
      form(2, "DIFFICULT", ["difficulty"], "A noun after 'little'."),
      form(3, "STRONG", ["strengths"], "A plural noun after 'real'; the colon introduces examples of strengths."),
      form(4, "PRACTISE", ["practice", "practise"], "A noun after 'value of'."),
      form(5, "ENJOY", ["enjoyment"], "A noun after 'out of'."),
      form(6, "EXPECT", ["expectations"], "A plural noun after the adjective 'realistic'."),
      form(7, "PATIENCE", ["impatient"], "The negative adjective describing someone who wants quick results."),
      form(8, "PERSIST", ["persistent"], "An adjective after 'be'."),
    ],
  ),
  // ---- Part 4: key word transformations (12) ----
  kwt("It was a mistake to leave the house without checking the weather forecast.", "SHOULD", "You ________ the house without checking the weather forecast.", ["should not have left", "shouldn't have left"], "The past modal of criticism is 'should not have left'."),
  kwt("It is expected that the company will announce a new product next month.", "EXPECTED", "The company ________ a new product next month.", ["is expected to announce"], "The impersonal passive becomes 'is expected to announce'."),
  kwt("I am still not used to the noise in the city.", "ACCUSTOMED", "I have not ________ the noise in the city.", ["become accustomed to", "yet become accustomed to"], "'Become accustomed to' means get used to."),
  kwt("She started working here five years ago.", "BEEN", "She ________ here for five years.", ["has been working"], "The present perfect continuous is used with 'for'."),
  kwt("Although he was tired, he finished the report.", "DESPITE", "He finished the report ________ tired.", ["despite being", "despite feeling"], "'Despite being tired' is the reduced concession."),
  kwt("The firm did not realise how serious the problem was until then.", "ONLY", "________ how serious the problem was.", ["only then did the firm realise", "only then did the firm realize"], "Inversion follows a negative or restrictive adverbial at the start."),
  kwt("I would prefer you not to smoke in here.", "RATHER", "I would ________ in here.", ["rather you didn't smoke", "rather you did not smoke"], "'Would rather + subject + past simple' expresses a preference about someone else."),
  kwt("It was such a boring film that we left early.", "SO", "The film ________ we left early.", ["was so boring that"], "'So + adjective + that' matches 'such a ... that'."),
  kwt("Unless you apologise, she won't forgive you.", "LONG", "She won't forgive you ________ apologise.", ["as long as you don't", "so long as you don't", "as long as you do not", "so long as you do not"], "'As long as you don't' keeps the condition."),
  kwt("It is said that the painting is worth millions.", "SAID", "The painting ________ worth millions.", ["is said to be"], "The impersonal passive becomes 'is said to be'."),
  kwt("He regrets not having studied harder at school.", "WISHES", "He ________ harder at school.", ["wishes he had studied", "wishes he'd studied"], "'Wish + past perfect' expresses regret about the past."),
  kwt("The exam was much more difficult than I had expected.", "EASIER", "I had expected the exam ________.", ["to be much easier", "to be a lot easier", "to be far easier"], "The comparative expresses the contrast with expectation."),
];
