import { Q, sc, withPassage } from "./seed-helpers";

// Original ACT-style English items written for this platform.
// Not taken from any ACT test, prep book or third-party bank.

// The first option is always the correct one; the helper rotation shuffles positions.
const en = (sentence: string, opts: string[], explanation: string): Q =>
  sc(`Choose the best version of the bracketed portion.\n\n${sentence}`, opts, 0, explanation);

const CONVENTIONS: Q[] = [
  // ---- Subject-verb agreement ----
  en("The collection of antique maps [are] displayed on the second floor.", ["is", "are", "were", "have been"], "The subject is 'collection', which is singular, so the verb is 'is'."),
  en("Neither the coach nor the players [was] aware of the schedule change.", ["were", "was", "is", "has been"], "With 'neither...nor' the verb agrees with the nearer subject, 'players', which is plural."),
  en("Each of the volunteers [receive] a certificate at the end of the season.", ["receives", "receive", "are receiving", "have received"], "'Each' is singular and takes a singular verb."),
  en("The number of applicants [have] increased every year since 2015.", ["has", "have", "are", "were"], "'The number' is singular. 'A number of' would be plural."),
  en("There [is] several good reasons to expect the delay to end soon.", ["are", "is", "was", "has been"], "The subject 'reasons' is plural, so the verb must be 'are'."),
  en("A team of researchers [are] studying the effects of noise on sleep.", ["is", "are", "were", "have been"], "The team is treated as one unit, so a singular verb is used."),
  en("Either the manager or the assistants [is] responsible for locking the office.", ["are", "is", "was", "has been"], "The verb agrees with the nearer subject, 'assistants', which is plural."),
  en("The news about the merger [were] a surprise to most employees.", ["was", "were", "are", "have been"], "'News' is singular despite ending in -s."),
  // ---- Pronouns and word forms ----
  en("Between you and [I], the plan is far riskier than it appears.", ["me", "I", "myself", "mine"], "After the preposition 'between', the object form 'me' is required."),
  en("The person [who] we selected for the position begins on Monday.", ["whom", "who", "which", "whose"], "'Whom' is the object of 'selected'."),
  en("The scientist [whom] discovered the compound received several awards.", ["who", "whom", "which", "whomever"], "'Who' is the subject of 'discovered'."),
  en("The award was presented jointly to Ana and [I].", ["me", "I", "myself", "we"], "'Me' is the object of the preposition 'to'."),
  en("The company changed [it's] policy on remote work last spring.", ["its", "it's", "its'", "their"], "'Its' is the possessive. 'It's' means 'it is'."),
  en("[Him and I] volunteered to organize the event.", ["He and I", "Him and I", "He and me", "Me and him"], "The compound subject needs subject-case pronouns: 'He and I'."),
  // ---- Verb tense and mood ----
  en("By the time the rescue team arrived, the hikers [already spent] two nights in the cold.", ["had already spent", "already spent", "have already spent", "will already spend"], "The past perfect shows an action completed before another past action."),
  en("Yesterday, the mayor [announces] a new plan to repair the bridge.", ["announced", "announces", "will announce", "has announced"], "'Yesterday' requires the simple past."),
  en("If I [was] you, I would apply for the scholarship immediately.", ["were", "was", "am", "will be"], "A hypothetical condition uses the subjunctive 'were'."),
  en("Since 2010, the museum [attracted] more visitors each year.", ["has attracted", "attracted", "will attract", "was attracting"], "'Since 2010' with an ongoing pattern calls for the present perfect."),
  en("If the bridge [would be] closed, drivers would need to take a longer route.", ["were", "would be", "will be", "had been"], "In an 'if' clause of a present hypothetical, use the past subjunctive 'were'."),
  en("When the alarm sounded, the students [leave] the building quietly and in order.", ["left", "leave", "will leave", "are leaving"], "A completed past action after 'when the alarm sounded' uses the simple past."),
  // ---- Punctuation ----
  en("The experiment failed[,] the team tried again the following week.", ["; ", ", ", " which", " because"], "Two independent clauses cannot be joined by a comma alone (a comma splice). A semicolon correctly joins them."),
  en("The film was long[, however] it held my attention.", ["; however,", ", however", ": however", " however"], "A conjunctive adverb joining two independent clauses needs a semicolon before it and a comma after."),
  en("Marie Curie[ who won two Nobel Prizes] was born in Warsaw.", [", who won two Nobel Prizes,", " who won two Nobel Prizes,", ", who won two Nobel Prizes", " who won two Nobel Prizes"], "The clause adds extra information about a named person, so it is set off by a pair of commas."),
  en("She packed[: a map, a compass, and a flashlight].", [" a map, a compass, and a flashlight", ": a map, a compass, and a flashlight", "; a map, a compass, and a flashlight", " - a map, a compass, and a flashlight"], "Do not put a colon between a verb and its objects."),
  en("The [childrens'] toys were scattered across the living room floor.", ["children's", "childrens'", "childrens", "childrens's"], "'Children' is already plural, so the possessive is 'children's'."),
  en("She bought three items at the market[:] apples, bread, and cheese.", [":", ",", ";", " and"], "A colon can follow a complete independent clause to introduce a list."),
  en("The dog, [which was barking loudly] woke the entire neighborhood.", ["which was barking loudly,", "which was barking loudly", "that was barking loudly,", "barking loudly"], "The nonrestrictive clause needs a comma after it as well as before."),
  en("The tallest player on the team[, was] injured in the first game.", ["was", ", was", "; was", ": was"], "Do not separate a subject from its verb with a comma."),
  en("The old[, wooden] bridge was closed for repairs.", [" wooden", ", wooden", "; wooden", " and, wooden"], "Old and wooden are cumulative adjectives here, so no comma separates them."),
  en("Although the weather was terrible[;] the game went ahead as planned.", [",", ";", ":", " and"], "A dependent clause followed by an independent clause is joined with a comma."),
  en("The students [studied hard, and passed] the final examination.", ["studied hard and passed", "studied hard, and passed", "studied, hard and passed", "studied hard; and passed"], "A compound predicate with a shared subject takes no comma."),
  en("Please bring [the following: passports, tickets, and visas] to the airport.", ["the following: passports, tickets, and visas", "the following, passports, tickets, and visas", "the following; passports, tickets, and visas", "the following passports tickets and visas"], "A colon introduces a list after a complete phrase such as 'the following'."),
  en("The second design was cheaper [then] the first one.", ["than", "then", "that", "when"], "Comparisons use 'than'; 'then' refers to time."),
  en("It was a [dark, stormy] night.", ["dark, stormy", "dark stormy", "dark and, stormy", "dark; stormy"], "'Dark' and 'stormy' are coordinate adjectives, so they are separated by a comma."),
  en("The teacher asked, [\"Who has finished the assignment?\"]", ["\"Who has finished the assignment?\"", "\"who has finished the assignment\".", "'Who has finished the assignment.'", "\"Who has finished the assignment\"?"], "The question mark belongs inside the quotation marks because the quoted words are a question."),
  en("The Joneses [invited us to their] house.", ["invited us to their", "invited us to there", "invited us to they're", "invited us to theirs"], "'Their' is the possessive pronoun before 'house'."),
  // ---- Modifiers, parallelism, comparison ----
  en("[Running through the park, the rain began to fall on Sam.]", ["Running through the park, Sam felt the rain begin to fall.", "Running through the park, the rain began to fall on Sam.", "The rain began, running through the park, on Sam.", "Sam, the rain began to fall running through the park."], "The opening phrase must modify the person running, so the subject must be 'Sam'."),
  en("She enjoys hiking, swimming, and [to ride bicycles].", ["riding bicycles", "to ride bicycles", "she rides bicycles", "bicycles"], "Items in a series need parallel form: hiking, swimming, riding."),
  en("Of the two candidates, Kim is [the most qualified].", ["the more qualified", "the most qualified", "more qualifieder", "most qualified"], "Comparing two things uses the comparative 'more'."),
  en("There were [less] cars on the road than usual this morning.", ["fewer", "less", "lesser", "little"], "'Fewer' is used for countable nouns like cars."),
  en("The city's transit system is [more efficient than any city] in the region.", ["more efficient than any other city's", "more efficient than any city", "the most efficient of any city", "more efficient than the city"], "Compare like with like and exclude the subject itself: 'any other city's'."),
  en("He is not only a talented musician [but he also] a gifted teacher.", ["but also", "but he also", "and also being", "also"], "'Not only ... but also' should be followed by parallel structures."),
  en("My brother is different [than] mine in every respect.", ["from", "than", "with", "to"], "The standard idiom is 'different from'."),
  en("The committee is capable [to make] its own decisions.", ["of making", "to make", "for making", "in making"], "The idiom is 'capable of' followed by a gerund."),
  en("Many students prefer studying alone [than] in groups.", ["to studying", "than", "over to", "as"], "The idiom is 'prefer X to Y'."),
  en("The teacher insisted [for us to] arrive before eight.", ["that we", "for us to", "on us to", "us to"], "The correct construction is 'insisted that we arrive'."),
  en("[Because it was late, we left.]", ["Because it was late, we left.", "Because it being late we left.", "Being late because, we left.", "It was late because we left."], "The sentence is complete and clear as written."),
  en("The pilot, along with the crew members, [were] briefed before takeoff.", ["was", "were", "are", "have been"], "'Along with the crew members' does not change the singular subject 'pilot'."),
  // ---- Word choice and concision ----
  en("The new policy will [effect] many employees in the sales department.", ["affect", "effect", "affects", "effects"], "'Affect' is the verb meaning to influence. 'Effect' is usually a noun."),
  en("[Their] going to the airport at noon, so we should leave now.", ["They're", "Their", "There", "Theirs"], "'They're' is the contraction of 'they are'."),
  en("The two friends [cooperated together to finish] the project ahead of schedule.", ["cooperated to finish", "cooperated together to finish", "cooperated together for finishing", "cooperated together so finishing"], "'Cooperated' already implies 'together', so the word is redundant."),
  en("The reason for the delay [is because] the shipment was lost.", ["is that", "is because", "is since", "was on account that"], "'The reason ... is that' is the standard construction; 'is because' is redundant."),
  en("The tourists [past] through the gate and entered the garden.", ["passed", "past", "pasted", "have past"], "'Passed' is the past tense of the verb 'pass'."),
  en("The [principal] cause of the accident was excessive speed.", ["principal", "principle", "principals", "principled"], "'Principal' as an adjective means main. 'Principle' is a rule."),
  en("Please [accept] my apologies for the mistake in your order.", ["accept", "except", "expect", "excepted"], "'Accept' means to receive. 'Except' means excluding."),
  en("The scientist's discovery had a profound [affect] on the field of medicine.", ["effect", "affect", "effected", "affection"], "'Effect' is the noun meaning result."),
  en("The [library's] new hours will begin in September.", ["library's", "libraries", "librarys'", "librarie's"], "The possessive singular of 'library' is 'library's'."),
  en("He was accused [for] stealing the necklace.", ["of", "for", "with", "by"], "The idiom is 'accused of'."),
  en("The bakery is famous [with] its fresh bread and pastries.", ["for", "with", "of", "at"], "The idiom is 'famous for'."),
  en("Neither the report nor the charts [was] complete when the meeting began.", ["were", "was", "is", "has been"], "The verb agrees with the nearer subject, 'charts', which is plural."),
];

// ---- Rhetorical skills: short passages with organization, purpose and style questions ----
const RHETORICAL: Q[] = [
  ...withPassage(
    "[1] Beekeeping has become increasingly popular in cities. [2] Rooftop hives can be found on hotels, offices, and apartment buildings. [3] Urban bees often produce more honey than their rural relatives, because cities offer a wide variety of flowers in parks and gardens throughout the growing season. [4] Some beekeepers sell the honey to local restaurants.",
    [
      sc("The writer wants to add a sentence after Sentence 1 that introduces the specific location described next. Which choice best does this?", ["Hives have appeared in some unexpected places.", "Bees are insects.", "Honey is sweet.", "Many people dislike insects."], 0, "The added sentence should lead to the description of rooftop hives in sentence 2."),
      sc("According to Sentence 3, which choice best explains why urban bees may be productive?", ["A wide variety of flowers grows in parks and gardens throughout the season", "City bees are much larger than rural bees", "Rural areas have fewer flowers than deserts", "Cities have no traffic noise"], 0, "The passage says cities offer a wide variety of flowers through the growing season."),
      sc("The writer is considering deleting Sentence 4. Should the sentence be kept or deleted?", ["Kept, because it gives an example of how the honey is used", "Kept, because it changes the subject of the paragraph", "Deleted, because it repeats sentence 3", "Deleted, because it contradicts sentence 2"], 0, "It adds a relevant detail about the honey and does not conflict with other sentences."),
      sc("Which choice would be the most effective final sentence for the paragraph?", ["City beekeeping shows that even crowded places can support natural food production.", "Bees are fast.", "The end.", "Many hotels are tall."], 0, "A concluding sentence should connect to the paragraph's main idea."),
    ],
  ),
  ...withPassage(
    "[1] The discovery of penicillin is often described as an accident. [2] In 1928, Alexander Fleming noticed that mold had contaminated one of his bacteria dishes. [3] The bacteria near the mold had died. [4] Fleming recognized the significance of this observation. [5] It took another decade before other scientists developed the drug into a useful treatment.",
    [
      sc("Which choice most effectively combines Sentences 2 and 3?", ["In 1928, Alexander Fleming noticed that bacteria near mold contaminating one of his dishes had died.", "In 1928, Alexander Fleming noticed mold, and bacteria, and a dish, and they died.", "In 1928, Fleming, mold, died.", "Mold contaminated, bacteria died, in 1928."], 0, "The combined sentence keeps all key information in a clear, concise structure."),
      sc("Where should the sentence 'Many lives have since been saved.' be placed for best effect?", ["After Sentence 5", "Before Sentence 1", "After Sentence 2", "Between Sentences 3 and 4"], 0, "It is a concluding comment on the drug's impact."),
      sc("Which transition would best begin Sentence 5?", ["However,", "Meanwhile,", "For example,", "Similarly,"], 0, "Sentence 5 contrasts the initial discovery with the long development that followed."),
      sc("The writer wants to emphasize the importance of Fleming's alertness. Which choice does this best in Sentence 4?", ["Fleming recognized the significance of this observation and investigated it further.", "Fleming saw something.", "The observation happened.", "Fleming disliked mold."], 0, "The added clause emphasizes his active response."),
    ],
  ),
  ...withPassage(
    "[1] Many people assume that the best way to learn a language is to live abroad. [2] Immersion does help, but it is not the only path. [3] Regular practice, even in short sessions, can produce steady progress. [4] Learners who speak with native speakers online, for instance, gain conversation skills without leaving home.",
    [
      sc("The writer wants a transition at the start of Sentence 2 that signals a partial concession. Which choice is best?", ["Certainly, immersion does help, but it is not the only path.", "Instead, immersion is not the only path.", "Therefore, immersion is not the only path.", "Likewise, immersion is not the only path."], 0, "'Certainly ... but' acknowledges the belief before qualifying it."),
      sc("Which choice best fits the paragraph's purpose in Sentence 3?", ["Consistent practice, even in short sessions, can produce steady progress.", "Practice is difficult.", "Languages vary.", "Sessions are short."], 0, "It supports the paragraph's claim that there are alternatives to living abroad."),
      sc("What is the function of Sentence 4?", ["It provides a specific example supporting Sentence 3", "It contradicts Sentence 2", "It introduces an unrelated topic", "It repeats Sentence 1"], 0, "The phrase 'for instance' shows it is an example."),
      sc("The writer wants to conclude the paragraph with a statement that returns to the opening idea. Which is best?", ["So, living abroad is helpful, but it is far from essential.", "Living abroad is expensive.", "Online is fun.", "Native speakers are kind."], 0, "It circles back to the assumption in Sentence 1 and summarizes the argument."),
    ],
  ),
  ...withPassage(
    "[1] The Great Lakes contain roughly one fifth of the world's surface fresh water. [2] Lake Superior alone holds enough water to cover all of North and South America to a depth of about a foot. [3] The lakes support a large shipping industry. [4] Shipping on the lakes carries iron ore, grain, and coal. [5] However, invasive species carried in ships' ballast water have damaged native ecosystems.",
    [
      sc("Which choice most effectively combines Sentences 3 and 4?", ["The lakes support a large shipping industry that carries iron ore, grain, and coal.", "The lakes support, and shipping, iron ore, grain and coal.", "Shipping supports the lakes carrying.", "The lakes, iron ore, grain, and a large shipping industry."], 0, "The combined version is clear and avoids repetition."),
      sc("The writer wants to add specific support for Sentence 2. Which addition would be best?", ["The lake is also the largest of the Great Lakes by surface area.", "Lakes are wet.", "Some people swim there.", "Water is essential."], 0, "It adds a relevant, factual detail about the lake."),
      sc("What is the effect of 'However,' at the start of Sentence 5?", ["It introduces a negative consequence that contrasts with the economic benefits", "It adds a further benefit", "It restates the previous sentence", "It introduces a definition"], 0, "The sentence turns to a problem after describing benefits."),
      sc("The writer wants to add a final sentence about solutions. Which is most appropriate?", ["Regulations now require ships to treat ballast water before releasing it.", "Ships are large.", "The lakes are cold.", "Fish live in water."], 0, "It offers a relevant response to the problem raised in Sentence 5."),
    ],
  ),
  ...withPassage(
    "[1] When I first started running, I could barely make it around the block. [2] Every step felt heavy, and I was convinced I would never improve. [3] My neighbor, a retired coach, suggested that I run slowly and increase my distance gradually. [4] Within three months, I completed my first five-kilometer race.",
    [
      sc("The writer wants to add detail that makes the opening more vivid. Which choice is best for Sentence 1?", ["When I first started running, I could barely make it around the block without stopping to catch my breath.", "When I started, I ran.", "I ran around the block.", "Running was new to me."], 0, "The added detail conveys the struggle more vividly."),
      sc("Which sentence would be best to add after Sentence 3?", ["I followed her advice, adding just a few minutes each week.", "Coaches are older.", "Neighbors are helpful.", "Distance is measured in kilometers."], 0, "It connects the advice to the result in Sentence 4."),
      sc("The tone of the passage is best described as", ["Personal and encouraging", "Formal and technical", "Humorous and sarcastic", "Detached and scientific"], 0, "First-person narration and a story of progress create a personal, encouraging tone."),
      sc("Which choice best conveys pride in the accomplishment in Sentence 4?", ["Within three months, I proudly crossed the finish line of my first five-kilometer race.", "Within three months, I ran.", "I finished a race in three months, apparently.", "A race was completed."], 0, "It adds emotional emphasis consistent with the story."),
    ],
  ),
  ...withPassage(
    "[1] Coral reefs cover less than one percent of the ocean floor. [2] They support about a quarter of all marine species. [3] Rising water temperatures cause corals to lose the algae that give them color and food. [4] Scientists are testing methods to grow more heat-tolerant corals.",
    [
      sc("Which choice best introduces the paragraph's focus in Sentence 1?", ["Though small in area, coral reefs are among the most important ecosystems in the ocean.", "Coral reefs are cool.", "The ocean floor is large.", "Fish live in the sea."], 0, "It sets up the contrast between their size and importance."),
      sc("The writer wants to add a transition between Sentences 2 and 3. Which is best?", ["Yet these ecosystems are under serious threat.", "Furthermore, reefs are pretty.", "For example, divers like them.", "Similarly, forests exist."], 0, "'Yet' introduces the shift from importance to threat."),
      sc("Which choice best concludes the paragraph after Sentence 4?", ["Their success could help protect reefs and the species that depend on them.", "Corals are fascinating.", "Science is hard.", "Temperature is measured in degrees."], 0, "It links the research to the paragraph's central concern."),
      sc("Is Sentence 2 relevant to the paragraph?", ["Yes, because it emphasizes why reefs matter", "No, because it repeats Sentence 1", "No, because it introduces temperatures", "Yes, because it defines algae"], 0, "It supports the importance of reefs, the paragraph's premise."),
    ],
  ),
  ...withPassage(
    "[1] Public libraries were once mainly places to borrow books. [2] Today, many also lend tools, seeds, and even musical instruments. [3] Some offer classes in coding and job skills. [4] Librarians say the changes reflect what their communities need. [5] A library in one town recently opened a recording studio for local musicians.",
    [
      sc("The writer wants to place Sentence 5 to give an illustration of Sentence 2's idea. Where should it go?", ["After Sentence 2", "Before Sentence 1", "After Sentence 4", "It should remain where it is"], 0, "It serves as a concrete example of the expanding services described in Sentence 2."),
      sc("Which choice best combines Sentences 2 and 3 without losing meaning?", ["Today, many lend tools, seeds, and instruments, and some also offer classes in coding and job skills.", "Today lend tools seeds classes.", "Tools are lent, classes offered, today many.", "Coding, job skills, tools today."], 0, "It joins the ideas smoothly."),
      sc("What is the main purpose of the passage?", ["To describe how libraries have expanded their services", "To argue that libraries should close", "To explain how books are printed", "To criticize librarians"], 0, "The passage traces the shift from lending books to broader community services."),
      sc("Which choice would provide the best support for Sentence 4?", ["Surveys of residents often lead libraries to add new services.", "Libraries have shelves.", "Some people read quickly.", "Books are heavy."], 0, "It links the claim about community needs to a concrete practice."),
    ],
  ),
  ...withPassage(
    "[1] The Roman aqueducts were remarkable feats of engineering. [2] They carried water from distant springs to cities using only gravity. [3] Engineers had to maintain a gentle, constant downward slope over many kilometers. [4] Some sections ran underground, while others crossed valleys on tall stone arches. [5] Several aqueducts are still standing today.",
    [
      sc("Which choice best explains why maintaining the slope was difficult?", ["Surveying tools of the time were simple, and the terrain varied greatly.", "Romans disliked water.", "The slope was steep.", "Arches are round."], 0, "It gives a plausible, relevant reason for the difficulty."),
      sc("Which word best replaces 'remarkable' in Sentence 1 without changing the meaning?", ["extraordinary", "ordinary", "unfortunate", "uncertain"], 0, "'Extraordinary' is a synonym of 'remarkable'."),
      sc("The writer wants to emphasize how long the aqueducts lasted. Which addition to Sentence 5 is best?", ["Several aqueducts are still standing today, nearly two thousand years after they were built.", "Several are standing.", "Aqueducts are old.", "Some are somewhere."], 0, "It highlights their durability with a specific detail."),
      sc("What is the purpose of Sentence 4?", ["To describe the different structures used to carry the water", "To explain gravity", "To introduce a new topic", "To contradict Sentence 3"], 0, "It details underground sections and arches."),
    ],
  ),
  ...withPassage(
    "[1] Thomas had never been on a stage before. [2] His heart pounded as the curtain rose. [3] He looked out at the rows of unfamiliar faces. [4] Then he remembered his teacher's words: breathe, and speak to just one person. [5] He found a friendly face near the back and began.",
    [
      sc("Which choice best adds suspense in Sentence 2?", ["His heart pounded so loudly that he was sure the audience could hear it as the curtain rose.", "His heart was in his body.", "The curtain rose.", "Thomas felt fine."], 0, "It heightens tension through vivid detail."),
      sc("What is the effect of Sentence 4?", ["It shows how a piece of advice helps Thomas cope", "It introduces a new character", "It ends the story", "It describes the stage"], 0, "The teacher's words provide the strategy he uses."),
      sc("Which choice would best conclude the passage?", ["By the end of the first line, his voice was steady.", "The curtain was made of cloth.", "The audience had faces.", "The teacher was old."], 0, "It resolves the tension and completes the arc."),
      sc("The point of view of the passage is", ["Third person, focused on one character", "First person plural", "Second person", "An objective report"], 0, "The narrator describes Thomas from outside using 'he'."),
    ],
  ),
  ...withPassage(
    "[1] Many cities are experimenting with rooftop solar panels. [2] The panels convert sunlight into electricity and can lower a building's energy costs. [3] They also reduce the demand on traditional power plants. [4] Critics point out that installation is expensive. [5] Supporters counter that the panels usually pay for themselves within a decade.",
    [
      sc("Which choice best signals the contrast at the start of Sentence 4?", ["Nevertheless, critics point out that installation is expensive.", "Also, critics point out that installation is expensive.", "Therefore, critics point out that installation is expensive.", "For instance, critics point out that installation is expensive."], 0, "The sentence introduces an objection after the benefits."),
      sc("The writer wants to add evidence for Sentence 5. Which is best?", ["A recent study found that panels in sunny regions recovered their cost in as little as seven years.", "Sunlight is bright.", "Cities have many roofs.", "Power plants are big."], 0, "It offers specific supporting evidence."),
      sc("The writer wants to shorten Sentence 2 without losing meaning. Which is best?", ["The panels turn sunlight into electricity and cut a building's energy costs.", "The panels are things that convert sunlight to electricity in order to lower the energy costs of buildings.", "Panels, sunlight, electricity, costs.", "Sunlight panels convert it."], 0, "It is concise and complete."),
      sc("What is the main idea of the paragraph?", ["Rooftop solar panels have benefits and drawbacks that cities are weighing", "Solar panels are ugly", "Power plants are efficient", "Buildings need roofs"], 0, "The paragraph presents advantages and criticism."),
    ],
  ),
  ...withPassage(
    "[1] The discovery of a new species often depends on patient fieldwork. [2] Researchers may spend weeks in remote forests, recording sounds and collecting samples. [3] Sometimes a new species is found in a museum drawer, where it was misidentified decades ago. [4] Both kinds of discovery expand our understanding of biodiversity.",
    [
      sc("Which sentence would best precede Sentence 3 to prepare for the contrast?", ["Not all discoveries, however, happen in the field.", "Forests are green.", "Museums close on Mondays.", "Sounds are recorded."], 0, "It sets up the contrast between field and museum discoveries."),
      sc("What is the function of Sentence 4?", ["It draws a conclusion about both examples", "It introduces a new species", "It describes a museum", "It contradicts Sentence 1"], 0, "It summarizes the significance of both discovery methods."),
      sc("Which word best replaces 'expand' in Sentence 4?", ["broaden", "reduce", "confuse", "hide"], 0, "'Broaden' is a close synonym."),
      sc("The writer wants to add a detail to Sentence 2. Which is best?", ["Researchers may spend weeks in remote forests, recording animal calls at night and collecting samples by day.", "Researchers may go places.", "Forests are remote.", "Sample collecting is a job."], 0, "It adds vivid, relevant detail about the fieldwork."),
    ],
  ),
];

export const ACT_ENGLISH: Q[] = [...CONVENTIONS, ...RHETORICAL];
