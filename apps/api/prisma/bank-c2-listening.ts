import { Q, sa, sc, withPassage } from "./seed-helpers";

// Original Cambridge C2 Proficiency-style listening items written for this platform.
// Listening is presented as a transcript because the platform has no audio.
// The first option is always correct; the helper rotation shuffles positions.

const r = (stem: string, opts: string[], explanation: string): Q => sc(stem, opts, 0, explanation);

const gap = (stem: string, accepted: string[], explanation: string): Q =>
  sa(`${stem}\n\nWrite a word or short phrase (no more than THREE words).`, accepted, explanation, 5);

const LABELS = ["A", "B", "C", "D", "E"];
const who = (statement: string, correct: string, explanation: string): Q => {
  const opts = [correct, ...LABELS.filter((l) => l !== correct)].map((l) => `Speaker ${l}`);
  return sc(`Which speaker ${statement}`, opts, 0, explanation);
};

export const C2_LISTENING: Q[] = [
  // ---- Part 1: three extracts, two questions each (12) ----
  ...withPassage(
    "Transcript, Extract 1: Two historians discussing a biography\n\nMan: What I found frustrating about the book is that the author seems to have fallen in love with her subject. Every decision he made is presented as far-sighted.\nWoman: I noticed that, but I'd defend her to a degree. Biographers who spend a decade with one person almost inevitably develop some sympathy. The question is whether that sympathy blinds them.\nMan: And you think it doesn't?\nWoman: Not entirely. She does, on two or three occasions, acknowledge his failures, quite starkly. It's just that they're buried in the endnotes, which is telling.",
    [
      r("What criticism does the man make of the biography?", ["It portrays the subject too favourably", "It is too long", "It ignores primary sources", "It is written in an unclear style"], "He says the author seems to have fallen in love with her subject."),
      r("What is the woman's view of the way the author deals with the subject's failures?", ["She admits them but in a way that is easy to overlook", "She hides them completely", "She emphasises them heavily", "She blames others for them"], "The failures are acknowledged, though placed in the endnotes."),
    ],
  ),
  ...withPassage(
    "Transcript, Extract 2: A scientist talking on a podcast about a failed experiment\n\nScientist: We spent eighteen months on that experiment, and the result was, to put it mildly, disappointing. The effect we were looking for simply wasn't there. For a while the team was quite downcast. But looking back, I think it was among the most valuable things we did. Not because we learned what we set out to learn, but because it forced us to reconsider a basic assumption about the equipment. That, in turn, led to an improvement in the design which we now use in everything. Journals rarely publish negative results, which is a pity, since they often teach more than the successes.",
    [
      r("Why does the scientist regard the experiment as valuable?", ["It led them to question an assumption that improved later work", "It produced the result they wanted", "It was published in a leading journal", "It proved their equipment was faulty"], "It forced a rethink of an assumption about equipment, leading to improved design."),
      r("What regret does the scientist express?", ["That negative results seldom get published", "That the experiment took so long", "That the team was disheartened", "That the equipment was expensive"], "Journals rarely publish negative results, which is a pity."),
    ],
  ),
  ...withPassage(
    "Transcript, Extract 3: A theatre director talking about a rehearsal process\n\nDirector: People imagine that a rehearsal room is a place of endless improvisation. In reality, the first week is often spent sitting around a table, reading the text and arguing about what it means. That can be frustrating for actors who want to get on their feet, but in my experience it saves time later. If everyone is clear about what a scene is for, then the movement almost takes care of itself. When I skipped this stage once, we lost days going back to first principles halfway through, and the actors have never let me forget it.",
    [
      r("What does the director say about the early stage of rehearsal?", ["It can be frustrating but ultimately saves time", "It should be skipped", "It is entirely improvised", "It is popular with actors"], "The table work is frustrating but saves time later."),
      r("What happened when the director omitted the table work on one occasion?", ["Time was lost revisiting fundamental questions", "The production received excellent reviews", "The actors preferred it", "The show was cancelled"], "They lost days going back to first principles."),
    ],
  ),
  ...withPassage(
    "Transcript, Extract 4: A student and a lecturer discussing feedback on an essay\n\nStudent: I'm a bit confused by your comment that my argument is 'competent but cautious'. Is that a criticism?\nLecturer: It's an observation, though I'd hope you'd take it as a challenge. The essay is very well structured, but at each point where you could have taken a position, you retreated behind what other scholars have said.\nStudent: I didn't want to make claims I couldn't support.\nLecturer: That's a sound instinct, but the discipline isn't only about caution. Somewhere in the essay I wanted to hear what you think.",
    [
      r("What is the lecturer's main concern about the essay?", ["The student avoids committing to a position", "The structure is confused", "It is too long", "It contains factual errors"], "The student retreated behind other scholars instead of taking a position."),
      r("How does the lecturer respond to the student's explanation?", ["Accepts the instinct but suggests it is not enough", "Rejects it entirely", "Agrees the essay is flawless", "Asks the student to rewrite the whole essay"], "The lecturer calls it a sound instinct but says the discipline is not only about caution."),
    ],
  ),
  ...withPassage(
    "Transcript, Extract 5: A chef talking about running a restaurant\n\nChef: People assume the difficult part of running a restaurant is the cooking. It isn't. Cooking is the part I control. What keeps me awake is the margin: a slight rise in the price of butter, a table that takes an hour longer than expected, a supplier who delivers late. Restaurants operate on thin profits, and the difference between success and failure is often a matter of a percentage point. I've learned to treat the business side with the same care as the kitchen, though I confess I still find the spreadsheets less enjoyable than the stove.",
    [
      r("What does the chef say is the most difficult part of running a restaurant?", ["Managing narrow financial margins", "Cooking the food", "Hiring staff", "Finding a location"], "She says the margin is what keeps her awake."),
      r("How does the chef feel about the business side of the work?", ["She takes it seriously though she enjoys it less", "She dislikes it and avoids it", "She prefers it to cooking", "She has delegated it to others"], "She treats it with care but finds spreadsheets less enjoyable."),
    ],
  ),
  ...withPassage(
    "Transcript, Extract 6: Two friends discussing a decision to sell a family house\n\nMan: I still can't decide whether we're doing the right thing. Selling the house feels like selling my childhood.\nWoman: I understand, but be honest with yourself. Nobody has lived there for six years, and the upkeep is draining you. Your mother would have hated to see it neglected.\nMan: That's true. It's the finality that troubles me, I think. As long as we own it, part of me can pretend the past is still accessible.\nWoman: It is accessible. It's in the photographs, and in the stories you tell your children. A building isn't a memory.",
    [
      r("What troubles the man most about selling the house?", ["The sense that it ends a connection to the past", "The price", "The condition of the building", "His mother's disapproval"], "He says it is the finality that troubles him."),
      r("What point does the woman make?", ["Memories exist independently of the building", "The house should be kept", "The house is worth very little", "He should ask his mother"], "She says a building isn't a memory."),
    ],
  ),
  // ---- Part 2: sentence completion (16) ----
  ...withPassage(
    "Transcript: A lecture on the history of the calendar\n\nGood morning. The calendar we use today is the product of many centuries of adjustment. The Romans originally had a year of ten months, beginning in March, which explains why September, meaning 'seventh', is now the ninth month. Two months were added later, but the system still drifted out of step with the seasons. In 46 BC, Julius Caesar reformed it, introducing a year of 365 days with an extra day every fourth year, to be inserted in February. This was a great improvement, but the Julian year is slightly longer than the true solar year, by about eleven minutes. Over the centuries the error accumulated, and by the sixteenth century the calendar was ten days out of step. Pope Gregory XIII therefore introduced a revised system in 1582. It omitted ten days from the calendar, and stated that century years would be leap years only if divisible by 400. Not every country accepted the change at once. Britain and its colonies did not adopt it until 1752, by which time a difference of eleven days had built up, causing rioting in some places, since people believed they had lost part of their lives.",
    [
      gap("The Romans' original year began in ______.", ["march"], "The year began in March."),
      gap("September means '______' in Latin.", ["seventh"], "It means seventh."),
      gap("Caesar's reform took place in ______ BC.", ["46"], "46 BC."),
      gap("The extra day was inserted in ______.", ["february"], "Every fourth year in February."),
      gap("The Julian year was too long by about ______ minutes.", ["eleven", "11"], "About eleven minutes."),
      gap("By the sixteenth century, the calendar was ______ days out of step.", ["ten", "10"], "Ten days."),
      gap("Century years are leap years only if divisible by ______.", ["400", "four hundred"], "Divisible by 400."),
      gap("Britain did not adopt the change until ______.", ["1752"], "1752."),
    ],
  ),
  ...withPassage(
    "Transcript: A talk on the psychology of decision-making\n\nI'd like to talk about why our decisions are less rational than we like to believe. Psychologists distinguish between two modes of thinking: one fast and intuitive, the other slow and deliberate. Most of the time, we rely on the first, and it serves us well. But it makes us vulnerable to certain systematic errors. One is anchoring: when asked to estimate a quantity, people are heavily influenced by any number they have just heard, even if it is obviously irrelevant. Another is loss aversion, the tendency to feel a loss more strongly than an equivalent gain. Experiments show that people typically need the prospect of winning about twice as much as they might lose before they will accept a gamble. Then there is the sunk cost fallacy, where we continue with a project simply because we have already invested in it. Interestingly, awareness of these biases does not always help us avoid them. What seems to work better is changing the environment in which decisions are made, for example by setting sensible default options. Organisations that automatically enrol employees in pension schemes, with the option to leave, have seen participation rise dramatically.",
    [
      gap("The two modes of thinking are fast and ______.", ["slow", "deliberate", "slow and deliberate"], "One fast and intuitive, the other slow and deliberate."),
      gap("Anchoring means people are influenced by an irrelevant ______.", ["number"], "They are influenced by any number they have just heard."),
      gap("Loss aversion is the tendency to feel a ______ more strongly than a gain.", ["loss"], "A loss is felt more strongly than an equivalent gain."),
      gap("People need the prospect of winning about ______ as much as they might lose.", ["twice"], "About twice as much."),
      gap("The ______ cost fallacy makes us continue with a project because we have invested in it.", ["sunk"], "The sunk cost fallacy."),
      gap("Awareness of biases does not always help us ______ them.", ["avoid"], "Awareness does not always help avoid them."),
      gap("It works better to change the ______ in which decisions are made.", ["environment"], "Changing the environment."),
      gap("Automatic enrolment in ______ schemes has raised participation.", ["pension"], "Pension schemes."),
    ],
  ),
  // ---- Part 3: interviews, multiple choice (12) ----
  ...withPassage(
    "Transcript: An interview with a conductor about her career\n\nInterviewer: You came to conducting relatively late, after a career as a violinist. Was it a difficult transition?\nConductor: Less than people assume. What I hadn't foreseen was how much I'd miss the sound. As a violinist you're inside it. As a conductor you stand outside and shape something that someone else produces. It took me years to accept that my instrument was now the orchestra.\nInterviewer: Do you think conducting can be taught?\nConductor: The technical side certainly. The rest, the ability to make a hundred people want to play in the same way, is harder to define. It has less to do with authority than with clarity. If you know precisely what you want, the players will usually follow. If you don't, no amount of gesture will conceal it.\nInterviewer: Has your view of the role changed?\nConductor: Enormously. I used to think a conductor's job was to impose a vision. Now I think it's to make the vision of the composer audible, and to create the conditions in which the musicians can do their best. There's a paradox in that: the more I try to disappear, the more the performance seems to bear my mark.",
    [
      r("What did the conductor find most unexpected about the transition?", ["She missed being inside the sound", "Learning technique", "Working with a large group", "Leaving her violin"], "She hadn't foreseen how much she would miss the sound."),
      r("What does she mean by saying 'my instrument was now the orchestra'?", ["She had to accept producing music through others", "She had bought a new instrument", "She had lost the ability to play", "She preferred the orchestra to the violin"], "She shapes sound produced by other people."),
      r("According to the conductor, what makes players follow a conductor?", ["Clarity about what is wanted", "Loud gestures", "Seniority", "Charisma"], "She says clarity rather than authority."),
      r("How has her view of the conductor's role changed?", ["From imposing a vision to serving the composer and the players", "From serving the audience to imposing a vision", "From teaching to performing", "It has not changed"], "She now sees it as making the composer's vision audible."),
      r("What paradox does she mention?", ["Trying to disappear makes her influence more evident", "The more she plays, the less she is heard", "The more she rehearses, the less prepared she is", "Conducting is the most physically demanding job"], "The more she tries to disappear, the more the performance bears her mark."),
      r("Which best describes her attitude to teaching conducting?", ["Some aspects can be taught but others are hard to define", "It cannot be taught at all", "It is entirely technical", "It should not be attempted"], "She says technique can be taught but the rest is harder to define."),
    ],
  ),
  ...withPassage(
    "Transcript: An interview with a historian about her book on the plague\n\nInterviewer: Your book challenges the traditional picture of medieval responses to the plague. In what way?\nHistorian: The popular image is of a paralysed society, gripped by superstition and incapable of rational response. In fact, the records show communities taking quite sophisticated measures: quarantine, restrictions on movement, the regulation of markets. These weren't always effective, but they were systematic.\nInterviewer: Why has the older view lasted so long?\nHistorian: Partly because it makes a good story. It flatters us, too, since it lets us feel more enlightened than our ancestors. But I also think it reflects an understandable reluctance to imagine ourselves in their position. It's easier to consider the people of the past foolish than to admit they were doing their best with limited knowledge.\nInterviewer: Did any discovery surprise you?\nHistorian: The letters. Ordinary people wrote to relatives, not about disease as such, but about practicalities: who would look after the children, who would pay for the funeral. The tone is remarkably matter-of-fact. It made the crisis feel very human.",
    [
      r("What does the historian say about the popular image of the medieval response to the plague?", ["It portrays society as helpless and superstitious", "It shows a highly organised society", "It is supported by the records", "It is a recent invention"], "The popular image is of a paralysed society."),
      r("What does the historian say the records show?", ["Communities took systematic if not always effective measures", "People ignored the disease", "Governments did nothing", "Only doctors took action"], "She lists quarantine, restrictions and regulation."),
      r("Why does the older view persist, in her opinion?", ["It makes a good story and flatters modern readers", "It is supported by new evidence", "It is taught in universities", "Historians are unwilling to revise it"], "She says it makes a good story and flatters us."),
      r("What does she suggest is our reason for thinking past people foolish?", ["We are reluctant to imagine ourselves in their position", "We know far more than they did", "Their behaviour was irrational", "Their letters show foolishness"], "It is easier to consider them foolish than admit they did their best."),
      r("What did she find in the letters?", ["A matter-of-fact tone about practical concerns", "Detailed medical advice", "Expressions of religious terror", "Descriptions of the disease"], "Ordinary people wrote about practicalities in a matter-of-fact tone."),
      r("What effect did the letters have on the historian?", ["They made the crisis feel more human", "They shocked her", "They confirmed the popular view", "They bored her"], "She says it made the crisis feel very human."),
    ],
  ),
  // ---- Part 4: five speakers, eight statements each (16) ----
  ...withPassage(
    "Transcript: Five people talking about a skill they learned late in life\n\nSpeaker A: I took up the cello at sixty. My family assumed it would be a passing whim, but I've now played for six years. What the instrument has taught me is that improvement is rarely dramatic; it accumulates in small moments you only notice looking back.\nSpeaker B: I learned to swim at forty-five, having avoided the water all my life out of embarrassment. My instructor, who was half my age, never once made me feel foolish, and that made all the difference.\nSpeaker C: I started painting after retirement, mostly to fill the time. I discovered, to my surprise, that I was rather good, and that a modest local exhibition could give one's confidence a wonderful boost.\nSpeaker D: I decided to learn programming to keep up with my children. It's been humbling, since they pick things up so much faster, but I've stuck at it, and I now enjoy the puzzle-solving more than the results.\nSpeaker E: I studied Spanish in order to talk to my in-laws. I'm not fluent, but even a few clumsy sentences have transformed our relationship. They appreciate the effort more than the accuracy.",
    [
      who("was helped by the patience of a teacher?", "B", "Speaker B's instructor never made them feel foolish."),
      who("found progress hard to perceive at the time?", "A", "Speaker A says improvement is noticed only looking back."),
      who("gained confidence from public recognition?", "C", "Speaker C's confidence was boosted by a local exhibition."),
      who("felt humbled by comparison with younger people?", "D", "Speaker D says their children pick things up faster."),
      who("says the effort matters more than accuracy?", "E", "Speaker E's in-laws appreciate the effort more than accuracy."),
      who("was initially motivated by embarrassment about a lack of ability?", "B", "Speaker B avoided the water out of embarrassment."),
      who("was surprised by their own talent?", "C", "Speaker C found they were rather good."),
      who("values the process of solving problems above the outcome?", "D", "Speaker D enjoys puzzle-solving more than results."),
    ],
  ),
  ...withPassage(
    "Transcript: Five people talking about working from a remote location\n\nSpeaker A: I've worked from a cabin in the mountains for three years. People imagine solitude, but I speak to more colleagues now than I ever did in an office, since every conversation is deliberate.\nSpeaker B: I moved to a fishing village for the quiet. The trouble is that the internet connection fails whenever there's a storm, so I've learned to keep a backup plan and a very understanding manager.\nSpeaker C: I lasted six months. I'd underestimated how much I relied on incidental chats, the ones that happen by the kettle. Without them I felt strangely invisible, and I returned to the city.\nSpeaker D: For me it's about time. I gained two hours a day by not commuting, and I spend them walking on the beach. My productivity hasn't dropped; if anything it's improved.\nSpeaker E: I keep a strict routine, with a separate room and set hours. Without it I'd work all evening. The hardest thing is not laziness, it's switching off.",
    [
      who("thinks remote work has increased contact with colleagues?", "A", "Speaker A says they speak to more colleagues now."),
      who("has problems caused by the weather?", "B", "Speaker B's internet fails during storms."),
      who("gave up remote working?", "C", "Speaker C returned to the city after six months."),
      who("uses the time saved from travelling for exercise?", "D", "Speaker D walks on the beach."),
      who("finds it difficult to stop working?", "E", "Speaker E says the hardest thing is switching off."),
      who("missed unplanned social contact?", "C", "Speaker C missed incidental chats by the kettle."),
      who("has an employer who has to be flexible?", "B", "Speaker B mentions a very understanding manager."),
      who("depends on a firm routine to manage work?", "E", "Speaker E keeps a strict routine with a separate room."),
    ],
  ),
];
