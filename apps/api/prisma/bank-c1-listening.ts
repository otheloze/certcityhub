import { Q, sa, sc, withPassage } from "./seed-helpers";

// Original Cambridge C1 Advanced-style listening items written for this platform.
// Listening is presented as a transcript because the platform has no audio.
// The first option is always correct; the helper rotation shuffles positions.

const r = (stem: string, opts: string[], explanation: string): Q => sc(stem, opts, 0, explanation);

const gap = (stem: string, accepted: string[], explanation: string): Q =>
  sa(`${stem}\n\nWrite a word or short phrase (no more than THREE words).`, accepted, explanation, 4);

const who = (statement: string, correct: "A" | "B" | "C" | "D" | "E", labels: string[], explanation: string): Q => {
  const opts = [correct, ...labels.filter((l) => l !== correct)].map((l) => `Speaker ${l}`);
  return sc(`Which speaker ${statement}`, opts, 0, explanation);
};

export const C1_LISTENING: Q[] = [
  // ---- Part 1: three short extracts, two questions each (12) ----
  ...withPassage(
    "Transcript, Extract 1: Two colleagues discussing a project deadline\n\nMan: I'm not sure we can finish the report by Friday. The data from the regional offices still hasn't arrived.\nWoman: I chased them again this morning. Two of the four have replied, and they say the rest will be sent tomorrow.\nMan: That leaves us very little time to analyse it.\nWoman: True, but I've asked Ravi to help with the charts, so at least the presentation side is taken care of. I'd rather ask for an extension than hand in something rushed.\nMan: The director won't be happy, though.\nWoman: She'd be less happy with mistakes.",
    [
      r("What is the woman's attitude to the deadline?", ["She would prefer a delay to submitting careless work", "She is confident everything will be ready in time", "She thinks the report is unnecessary", "She wants to change the topic of the report"], "She says she would rather ask for an extension than hand in something rushed."),
      r("What has the woman done to help with the problem?", ["Arranged for someone to prepare the charts", "Contacted the director", "Rewritten the data", "Cancelled the report"], "She has asked Ravi to help with the charts."),
    ],
  ),
  ...withPassage(
    "Transcript, Extract 2: A radio presenter talking about a new museum\n\nPresenter: The new maritime museum opens next week, and I was lucky enough to see it before the crowds. What struck me first was the building, an odd, curved thing on the harbour that looks a little like an upturned boat. Inside, the exhibits are surprisingly modern, with lots of interactive screens. Now, I'm usually sceptical about technology in museums, since it tends to distract from the objects themselves, but here it's used sparingly. The real highlight for me was a small room with a hand-written logbook from an eighteenth-century voyage. Nothing digital could compete with that.",
    [
      r("What is the presenter's opinion of the technology in the museum?", ["It is used with restraint and does not overwhelm the exhibits", "It spoils the atmosphere completely", "It is the museum's greatest attraction", "It is out of date"], "He says it is used sparingly."),
      r("What did the presenter enjoy most?", ["A historic handwritten record", "The building's exterior", "The interactive screens", "The harbour views"], "The logbook was the real highlight."),
    ],
  ),
  ...withPassage(
    "Transcript, Extract 3: A student talking to a friend about changing courses\n\nStudent: I've decided to switch from law to environmental science.\nFriend: Really? I thought you'd always wanted to be a lawyer.\nStudent: I did, or rather I thought I did. My parents both work in law and I suppose I never questioned it. It was only when I did a volunteer project on river pollution last summer that I realised what I actually enjoy.\nFriend: What did your parents say?\nStudent: They were surprised, but they've been supportive. My father said he'd rather I did something I care about than something I'm merely good at.",
    [
      r("Why did the student originally choose law?", ["Family influence led to the assumption without much reflection", "A teacher recommended it", "It offered the highest salary", "A friend persuaded the student"], "The student says the parents work in law and they never questioned it."),
      r("How did the student's parents react to the decision?", ["They were surprised but supportive", "They refused to accept it", "They were delighted immediately", "They were angry"], "The student says they were surprised but have been supportive."),
    ],
  ),
  ...withPassage(
    "Transcript, Extract 4: A woman leaving a voicemail message\n\nWoman: Hi Jamie, it's Claire. I'm calling about Saturday. I know I said I'd bring the cake, but the bakery has closed for a family emergency, so I'm going to try to make one myself, which may not be a good idea, given my history in the kitchen. If it goes badly, could you pick something up on your way? Also, the restaurant rang to say they can seat us at seven instead of eight, so we should probably meet earlier. Give me a ring when you get this.",
    [
      r("Why is Claire calling Jamie?", ["To warn him of changed arrangements and ask for a possible favour", "To cancel the dinner", "To invite him to a bakery", "To complain about the restaurant"], "She mentions the cake, a possible backup, and the earlier booking."),
      r("What does Claire say about her cooking?", ["She is not confident of success", "She cooks for a living", "She has recently taken lessons", "She dislikes baking cakes for friends"], "She refers to her history in the kitchen, implying past problems."),
    ],
  ),
  ...withPassage(
    "Transcript, Extract 5: An architect talking about a project\n\nArchitect: When we began the design for the school, the main challenge was noise. It stands next to a motorway, and the client was worried that lessons would be impossible. Our solution wasn't to fight the noise with heavy walls, but to turn the building's back to the road and place classrooms on the far side around a courtyard. The corridors on the road side act as a buffer. It cost less than soundproofing every room would have done and, to be honest, it has turned out to be the more attractive solution as well.",
    [
      r("What was the architects' approach to the noise problem?", ["Arrange the layout so that the classrooms face away from the road", "Build very thick walls", "Move the school", "Plant trees along the motorway"], "They placed classrooms on the far side around a courtyard."),
      r("What does the architect say about the solution's cost?", ["It was cheaper than soundproofing every room", "It was extremely expensive", "It cost the same as any alternative", "It was paid for by the client"], "He says it cost less than soundproofing every room."),
    ],
  ),
  ...withPassage(
    "Transcript, Extract 6: A teacher discussing homework with a parent\n\nTeacher: We've found that the more homework we set in the younger years, the less children seem to enjoy reading.\nParent: That's disappointing. Ella used to love books.\nTeacher: We've therefore reduced written work in the first two years and asked families instead to read together for twenty minutes a day. It's early days, but attitudes seem to be improving.\nParent: I'd be happy with that. Some evenings she's in tears over her worksheets.",
    [
      r("What change has the school made?", ["It has cut written homework in favour of reading together", "It has increased homework", "It has banned reading at home", "It has started testing more often"], "The teacher says written work has been reduced and reading together requested."),
      r("What is the parent's attitude?", ["Approving, because the child has struggled with worksheets", "Opposed to reading at home", "Indifferent", "Angry with the teacher"], "She is happy with the change and mentions Ella's tears."),
    ],
  ),
  // ---- Part 2: sentence completion (16) ----
  ...withPassage(
    "Transcript: A talk by a wildlife photographer\n\nGood evening. I'd like to talk about photographing animals in the wild, and what I've learned over thirty years. I started out with a very basic camera, and my first subjects were the birds in my grandmother's garden. The turning point came when I spent a season in the Arctic, photographing polar bears. The main lesson was patience: I once waited eleven days for a single picture. Cold is also a challenge, because batteries lose their charge quickly, so I keep spares inside my jacket. People often ask about my equipment, but I've come to believe that the most important thing is knowing your subject. I spend months studying an animal's habits before I photograph it. On ethics, I follow one rule: never disturb the animal. If it changes its behaviour because of me, I've gone too close. Finally, I'd encourage anyone starting out to begin close to home. My best-known picture, of a fox in a snowy field, was taken less than a mile from my house.",
    [
      gap("The speaker's first subjects were birds in his ______ garden.", ["grandmother's", "grandmother"], "He began photographing birds in his grandmother's garden."),
      gap("The turning point in his career was a season spent photographing ______.", ["polar bears"], "The Arctic season with polar bears."),
      gap("He once waited ______ days for a single picture.", ["eleven", "11"], "He waited eleven days."),
      gap("In cold weather, ______ lose their charge quickly.", ["batteries"], "Batteries lose charge in the cold."),
      gap("He believes it is most important to know your ______.", ["subject"], "Knowing the subject matters more than equipment."),
      gap("He spends months studying an animal's ______ before he photographs it.", ["habits", "behaviour", "behavior"], "He studies its habits."),
      gap("His golden rule is never to ______ the animal.", ["disturb"], "He follows one rule: never disturb the animal."),
      gap("His best-known picture shows a ______ in a snowy field.", ["fox"], "The photograph of a fox in a snowy field."),
    ],
  ),
  ...withPassage(
    "Transcript: A lecture on the history of the bicycle\n\nToday I'd like to trace the development of the bicycle. The first machine in the story, invented in 1817, had no pedals at all. Riders pushed themselves along with their feet, and it was called the running machine. It was popular for only a short time, partly because roads were rough. Pedals were added in the 1860s, and the resulting machine was nicknamed the 'boneshaker', as it had wooden wheels with iron tyres. The next design featured an enormous front wheel, which allowed greater speed but was dangerous, as riders were seated high above the ground and could easily be thrown forward. The breakthrough came in the 1880s with the safety bicycle, which had two wheels of equal size and a chain to drive the rear wheel. Its invention helped to bring cycling to a wider public, and women in particular found it offered a new kind of independence. Finally, pneumatic tyres, invented soon afterwards, made the ride considerably more comfortable.",
    [
      gap("The earliest machine of 1817 had no ______.", ["pedals"], "It had no pedals."),
      gap("It was popular for only a short time partly because the ______ were rough.", ["roads"], "Roads were rough."),
      gap("The 1860s machine was nicknamed the '______'.", ["boneshaker"], "The nickname was boneshaker."),
      gap("The 1860s machine had wooden wheels with ______ tyres.", ["iron"], "Wooden wheels with iron tyres."),
      gap("The design with an enormous front wheel was dangerous because riders could be thrown ______.", ["forward", "forwards"], "Riders could easily be thrown forward."),
      gap("The breakthrough of the 1880s was called the ______ bicycle.", ["safety"], "The safety bicycle."),
      gap("The safety bicycle used a ______ to drive the rear wheel.", ["chain"], "A chain drove the rear wheel."),
      gap("______ tyres made the ride considerably more comfortable.", ["pneumatic"], "Pneumatic tyres."),
    ],
  ),
  // ---- Part 3: interviews, multiple choice (12) ----
  ...withPassage(
    "Transcript: An interview with a novelist about her writing habits\n\nInterviewer: You've published eight novels in ten years. Do you have a strict routine?\nNovelist: People imagine I'm very disciplined, but I think of it more as stubbornness. I write every morning from six until noon, whether or not I have anything to say. Some days I produce a page and delete it the next day, but the habit matters more than the results. Inspiration, in my experience, arrives once you've started, not before.\nInterviewer: Do you plan your books in advance?\nNovelist: I used to, meticulously, with charts on the wall. But I found that when I knew exactly what would happen, I lost interest in writing it. Now I begin with a character and a situation, and I discover the plot as I go. It's riskier, and I sometimes write myself into corners, but I feel far more engaged.\nInterviewer: What do you do when you get stuck?\nNovelist: I go for a long walk, without my phone. It sounds unremarkable, but the problem often solves itself somewhere around the second hour.",
    [
      r("How does the novelist describe her routine?", ["As stubbornness rather than discipline", "As a source of constant inspiration", "As flexible and unstructured", "As inherited from her teacher"], "She says she thinks of it more as stubbornness."),
      r("What does she say about inspiration?", ["It comes after starting work", "It arrives before she sits down", "It is unnecessary", "It comes from other writers"], "Inspiration arrives once you've started."),
      r("Why did she stop planning her books in detail?", ["She lost interest when she knew what would happen", "Her editors disliked it", "The charts took up too much space", "She could not remember her plans"], "She lost interest in writing what she already knew."),
      r("What is the drawback of her current method?", ["She can write herself into corners", "It takes far longer", "She cannot revise", "It bores her"], "She says it is riskier and she sometimes writes herself into corners."),
      r("What does she do when she is stuck?", ["Takes a long walk without her phone", "Calls her editor", "Deletes the manuscript", "Takes a day off"], "She goes for a long walk without her phone."),
      r("What does she suggest about her solution to being stuck?", ["It works, though it takes some time", "It never works", "It is a waste of time", "It works within minutes"], "The problem often solves itself around the second hour."),
    ],
  ),
  ...withPassage(
    "Transcript: An interview with an engineer who designs bridges\n\nInterviewer: Most of us cross bridges without giving them a thought. Is that a compliment to engineers?\nEngineer: Absolutely. If you notice a bridge, something has probably gone wrong. A good one is invisible in the sense that it simply does its job. That said, I do think we should occasionally consider how much thought goes into them. Every element has to withstand forces that change with the season, the traffic and even the wind.\nInterviewer: What's the biggest challenge in your profession?\nEngineer: Balancing safety with cost. Nobody wants a bridge that might fail, but nobody wants to pay for a design ten times stronger than necessary. The art lies in knowing where the margin should be.\nInterviewer: Has a project ever kept you awake?\nEngineer: Many. The one I remember most is a footbridge over a gorge. It was light and elegant, but during testing it began to sway when people walked in step. We had to add dampers. It was a reminder that models can never capture everything.",
    [
      r("What does the engineer mean by saying a good bridge is 'invisible'?", ["People do not notice it because it works perfectly", "It cannot be seen from a distance", "It is built underground", "It is painted the colour of the sky"], "If you notice a bridge something has gone wrong."),
      r("What does the engineer want people to occasionally appreciate?", ["The thought involved in designing bridges", "The cost of building them", "The age of old bridges", "The appearance of bridges"], "He says we should consider how much thought goes into them."),
      r("What is the biggest challenge in her profession?", ["Balancing safety with cost", "Finding enough workers", "Meeting deadlines", "Obtaining planning permission"], "She states it directly."),
      r("What problem occurred with the footbridge?", ["It swayed when people walked in step", "It cracked during construction", "It was too heavy", "It was too narrow"], "It began to sway during testing."),
      r("How was the problem solved?", ["By adding dampers", "By closing the bridge", "By replacing the bridge", "By limiting pedestrians"], "They added dampers."),
      r("What lesson does the engineer draw from the footbridge?", ["Models cannot capture every real-world behaviour", "Light bridges are dangerous", "Testing is unnecessary", "Pedestrians should be careful"], "She says models can never capture everything."),
    ],
  ),
  // ---- Part 4: multiple matching, two tasks per set (20) ----
  ...withPassage(
    "Transcript: Five people talking about a decision to move to a new city\n\nSpeaker A: The job offer was too good to refuse, but leaving my friends was harder than I'd imagined. I spent the first month ringing them every evening. Eventually I joined a running club, and that made all the difference.\nSpeaker B: I'd wanted to leave the town I grew up in for years. What surprised me was how much I missed the small things: knowing the shopkeepers by name, that sort of thing. The city has more to offer, but it took time to feel I belonged.\nSpeaker C: For me it was purely practical: cheaper housing. I hadn't expected the difference in pace, though. People here seem to have time for a chat, which I find quite refreshing, and I'd be reluctant to go back.\nSpeaker D: My partner was transferred, so I followed, which I resented at first. I've since found work I enjoy far more than my old job, so in the end it worked out better than I could have hoped.\nSpeaker E: I moved for university and expected to return. Ten years later I'm still here. I'm not sure exactly when it became home, but I no longer describe the other place that way.",
    [
      who("moved for financial reasons?", "C", ["A", "B", "C", "D", "E"], "Speaker C says it was purely practical: cheaper housing."),
      who("found that a social activity helped them settle?", "A", ["A", "B", "C", "D", "E"], "Speaker A joined a running club."),
      who("initially felt resentment about the move?", "D", ["A", "B", "C", "D", "E"], "Speaker D resented following a partner."),
      who("has changed their idea of where home is?", "E", ["A", "B", "C", "D", "E"], "Speaker E no longer calls the other place home."),
      who("missed the familiarity of local relationships?", "B", ["A", "B", "C", "D", "E"], "Speaker B missed knowing the shopkeepers."),
      who("was surprised by a slower way of life?", "C", ["A", "B", "C", "D", "E"], "Speaker C mentions people having time for a chat."),
      who("would be unwilling to return to their old home?", "C", ["A", "B", "C", "D", "E"], "Speaker C says they'd be reluctant to go back."),
      who("has ended up better off professionally?", "D", ["A", "B", "C", "D", "E"], "Speaker D found more enjoyable work."),
      who("kept in touch with old friends by phone at first?", "A", ["A", "B", "C", "D", "E"], "Speaker A rang friends every evening."),
      who("had long wanted to leave their home town?", "B", ["A", "B", "C", "D", "E"], "Speaker B had wanted to leave for years."),
    ],
  ),
  ...withPassage(
    "Transcript: Five people talking about learning to drive\n\nSpeaker A: I failed my test three times, always for the same reason: nerves. On the fourth attempt I decided I didn't mind failing, and I passed easily. There's probably a lesson there about expectations.\nSpeaker B: My father taught me in an empty car park. He was endlessly patient, which I didn't appreciate at the time. Looking back, it's the reason I feel so relaxed behind the wheel today.\nSpeaker C: I took lessons only because my job required a licence. I still find driving stressful and avoid motorways whenever I can. If public transport were better, I'd happily give the car up.\nSpeaker D: I passed at seventeen and loved the independence. Since then I've become more aware of the cost, both financial and environmental, and I now cycle whenever I can.\nSpeaker E: I learned in my forties. I'd always been afraid, but my daughter started to drive and I didn't want her to think fear was permanent. That was the push I needed.",
    [
      who("attributes success to a change of attitude?", "A", ["A", "B", "C", "D", "E"], "Speaker A passed after deciding failing didn't matter."),
      who("credits a relative's calm teaching?", "B", ["A", "B", "C", "D", "E"], "Speaker B's father was patient."),
      who("only learned because of work requirements?", "C", ["A", "B", "C", "D", "E"], "Speaker C took lessons because the job required a licence."),
      who("now tries to avoid driving for environmental reasons?", "D", ["A", "B", "C", "D", "E"], "Speaker D cycles whenever possible due to cost and environmental concerns."),
      who("overcame fear in order to set an example?", "E", ["A", "B", "C", "D", "E"], "Speaker E did not want their daughter to think fear was permanent."),
      who("dislikes certain types of road?", "C", ["A", "B", "C", "D", "E"], "Speaker C avoids motorways."),
      who("valued the freedom driving gave them at first?", "D", ["A", "B", "C", "D", "E"], "Speaker D loved the independence."),
      who("had to take the test more than once?", "A", ["A", "B", "C", "D", "E"], "Speaker A failed three times."),
      who("began driving relatively late in life?", "E", ["A", "B", "C", "D", "E"], "Speaker E learned in their forties."),
      who("would prefer better public transport?", "C", ["A", "B", "C", "D", "E"], "Speaker C says they would give up the car if public transport improved."),
    ],
  ),
];
