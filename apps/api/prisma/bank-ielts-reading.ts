import { QuestionType } from "@prisma/client";
import { Q, sa, sc, withPassage } from "./seed-helpers";

// Original Academic-style passages and questions written for this platform.
// Not taken from any IELTS test, Cambridge practice book or third-party bank.

const tfng = (stem: string, answer: "True" | "False" | "Not Given", explanation: string): Q => ({
  type: QuestionType.SINGLE_CHOICE,
  stem: `${stem}\n\nTrue if the statement agrees with the passage. False if it contradicts the passage. Not Given if there is no information about it.`,
  explanation,
  answerSchema: { allowPartialCredit: false },
  options: ["True", "False", "Not Given"].map((label) => ({ label, text: label, isCorrect: label === answer })),
  difficulty: 3,
});

const ynng = (stem: string, answer: "Yes" | "No" | "Not Given", explanation: string): Q => ({
  type: QuestionType.SINGLE_CHOICE,
  stem: `${stem}\n\nYes if the statement agrees with the writer's views. No if it contradicts them. Not Given if it is impossible to say what the writer thinks.`,
  explanation,
  answerSchema: { allowPartialCredit: false },
  options: ["Yes", "No", "Not Given"].map((label) => ({ label, text: label, isCorrect: label === answer })),
  difficulty: 4,
});

const gap = (stem: string, accepted: string[], explanation: string): Q =>
  sa(`${stem}\n\nWrite NO MORE THAN TWO WORDS from the passage.`, accepted, explanation, 3);

export const IELTS_READING: Q[] = [
  ...withPassage(
    "The Return of the Wetland Beaver\n\nA. Beavers were once common across the northern hemisphere, but intensive hunting for their fur and scent glands reduced them to a few isolated populations by the early twentieth century. In Britain the animal had been extinct for around four hundred years. Recent decades have seen a cautious reintroduction, and the results have surprised many sceptics.\n\nB. The reason is that beavers are what ecologists call ecosystem engineers. By felling trees and building dams, they create ponds that slow the movement of water through a landscape. Studies of one reintroduction site recorded a marked drop in flood peaks downstream, since the dams held back water during storms and released it gradually.\n\nC. The ponds also improve water quality, as sediment settles before the water moves on. Fish, amphibians and insects colonise the new habitat, and the birds that feed on them follow. Some farmers, however, worry about flooded fields and lost timber, and compensation schemes have been proposed to address their concerns.\n\nD. Scientists stress that beavers are not a universal remedy. Their effects depend on the local terrain, and in narrow valleys their dams can cause damage that must be managed. Even so, the animals are increasingly viewed as partners rather than pests in efforts to restore rivers.",
    [
      tfng("Beavers had been absent from Britain for several centuries before their reintroduction.", "True", "Paragraph A says the animal had been extinct in Britain for around four hundred years."),
      tfng("The first reintroduction of beavers in Britain was funded by farmers.", "Not Given", "The passage does not say who funded the reintroduction."),
      tfng("Beaver dams cause flood peaks downstream to increase.", "False", "Paragraph B reports a marked drop in flood peaks downstream."),
      tfng("Sediment settles in beaver ponds before the water flows on.", "True", "Paragraph C says sediment settles, improving water quality."),
      ynng("The writer believes beavers should be introduced to every river valley.", "No", "Paragraph D says beavers are not a universal remedy and can cause damage in narrow valleys."),
      sc("Which paragraph mentions concerns from people who work the land?", ["Paragraph C", "Paragraph A", "Paragraph B", "Paragraph D"], 0, "Farmers' worries about flooded fields and lost timber are in paragraph C."),
      sc("What is the main purpose of paragraph B?", ["To explain how beavers change the movement of water", "To describe how beavers were hunted", "To list threats to fish", "To propose compensation for farmers"], 0, "Paragraph B explains ecosystem engineering by dams and its effect on floods."),
      gap("Beavers were hunted for their fur and their _____ glands.", ["scent"], "Paragraph A: hunting for their fur and scent glands."),
      gap("Ecologists describe beavers as ecosystem _____.", ["engineers"], "Paragraph B: 'ecosystem engineers'."),
      gap("Compensation _____ have been proposed to help farmers.", ["schemes"], "Paragraph C: 'compensation schemes have been proposed'."),
    ],
  ),
  ...withPassage(
    "The Psychology of Queuing\n\nA. Nobody enjoys waiting in line, yet the experience of a wait depends less on its length than on how it feels. Psychologists studying queues have found that an unoccupied wait seems longer than an occupied one. This is why airports place baggage carousels far from the arrival gates: passengers who walk for six minutes and wait for two experience less frustration than those who wait for eight without moving.\n\nB. Uncertainty also makes waiting harder. A traveler told that a train will arrive in ten minutes is generally calmer than one who is told nothing, even if the true delay is longer. Fairness matters too. People tolerate long waits in a single line that serves all customers, but become agitated when a neighboring line moves faster. For this reason many banks now use one queue feeding several counters.\n\nC. Some businesses go further, using mirrors near elevators or screens showing news in waiting areas. These devices do not shorten the wait at all; they merely shift attention. Critics regard such tricks as manipulative, but supporters argue that reducing stress is a genuine service to customers.",
    [
      tfng("An unoccupied wait tends to feel longer than an occupied one.", "True", "Paragraph A states this directly."),
      tfng("Passengers at airports prefer to wait for their baggage without walking.", "False", "Paragraph A says those who walk and wait less experience less frustration."),
      tfng("Uncertainty about a delay can make waiting more stressful.", "True", "Paragraph B says uncertainty makes waiting harder."),
      tfng("Banks that use a single queue have shorter average waiting times than those with several queues.", "Not Given", "The passage says people accept a single queue; it gives no data about average time."),
      ynng("The writer regards the use of screens in waiting areas as manipulative.", "Not Given", "The writer reports critics' and supporters' views but gives no personal opinion."),
      sc("What is the main idea of paragraph B?", ["Uncertainty and unfairness make waits feel worse", "Trains are usually late", "Banks should hire more staff", "Airports are poorly designed"], 0, "Paragraph B covers uncertainty and perceived fairness."),
      sc("According to paragraph C, what do mirrors near elevators do?", ["Shift people's attention without shortening the wait", "Shorten the wait", "Reduce the number of passengers", "Provide news"], 0, "The devices do not shorten the wait; they shift attention."),
      gap("Baggage carousels are placed far from the arrival _____.", ["gates"], "Paragraph A."),
      gap("Many banks now use one queue that feeds several _____.", ["counters"], "Paragraph B."),
      gap("Supporters say reducing _____ is a genuine service.", ["stress"], "Paragraph C: 'reducing stress is a genuine service to customers'."),
    ],
  ),
  ...withPassage(
    "Bioluminescence in the Deep Sea\n\nA. Below about 200 meters, sunlight fades, and in the deep sea the only light comes from living creatures. Bioluminescence, the ability to produce light through chemical reactions, is found in an estimated three quarters of animals living in the open ocean. The light is usually blue-green, because these wavelengths travel farthest through water.\n\nB. Deep-sea animals use their lights in different ways. Anglerfish dangle a glowing lure to attract prey, while some squid release a luminous cloud to confuse predators, much as other squid release ink. Certain fish carry rows of light-producing organs along their undersides. By matching the faint light from above, they remove their shadow and become almost invisible to predators looking upward, a strategy known as counter-illumination.\n\nC. Studying these animals is difficult. Many die or lose their glow when brought to the surface, and the pressure and cold of their habitat are hard to reproduce in a laboratory. Consequently, researchers increasingly rely on remotely operated vehicles fitted with sensitive cameras, which have captured previously unseen behavior in recent years.",
    [
      tfng("Sunlight reaches all parts of the deep sea.", "False", "Paragraph A says sunlight fades below about 200 meters."),
      tfng("Most bioluminescent light is blue-green.", "True", "Paragraph A says the light is usually blue-green."),
      tfng("Anglerfish are the most common bioluminescent animal.", "Not Given", "No comparison of numbers between species is given."),
      tfng("Counter-illumination helps some fish avoid being seen from below.", "True", "Paragraph B: they remove their shadow and become almost invisible to predators looking upward."),
      tfng("Bioluminescent animals survive well when brought to the surface.", "False", "Paragraph C says many die or lose their glow."),
      sc("Why is blue-green light common in the deep sea?", ["Those wavelengths travel farthest through water", "They are the brightest wavelengths", "Animals prefer these colors", "They attract more prey"], 0, "Paragraph A gives this reason."),
      sc("Which paragraph describes the difficulties scientists face?", ["Paragraph C", "Paragraph A", "Paragraph B", "None of them"], 0, "Paragraph C discusses the difficulties of studying the animals."),
      gap("Anglerfish dangle a glowing _____ to attract prey.", ["lure"], "Paragraph B."),
      gap("Some squid release a luminous _____ to confuse predators.", ["cloud"], "Paragraph B."),
      gap("Researchers increasingly use remotely operated _____ fitted with cameras.", ["vehicles"], "Paragraph C."),
    ],
  ),
  ...withPassage(
    "Rethinking the Open-Plan Office\n\nA. Open-plan offices spread rapidly from the 1960s, promoted as a way to encourage collaboration and reduce the cost of walls. Proponents argued that removing barriers would lead to more spontaneous conversation and a more democratic workplace.\n\nB. Recent studies, however, have questioned these claims. One study that tracked employees before and after a move to an open plan found that face-to-face interaction fell by roughly a third, while email and messaging increased. Workers appeared to protect their privacy by withdrawing, wearing headphones and using electronic channels instead.\n\nC. Noise is a further complaint. Even quiet background speech can reduce performance on tasks that require concentration, since the brain is difficult to switch off to language. Employees also report that a lack of control over their surroundings leads to stress.\n\nD. This does not mean that traditional private offices are the answer. Many organizations now experiment with mixed environments, offering open areas for teamwork alongside quiet rooms for focused work. The most successful of these allow staff to choose where they work depending on the task.",
    [
      ynng("The writer believes open-plan offices have never been beneficial.", "No", "The writer questions the claims but does not say they were never beneficial, and D recommends mixed spaces."),
      tfng("Open-plan offices were introduced partly because they cost less to build.", "True", "Paragraph A mentions reducing the cost of walls."),
      tfng("The study in paragraph B found face-to-face interaction increased after the move.", "False", "It fell by roughly a third."),
      tfng("Employees who wear headphones are more productive.", "Not Given", "Headphones are mentioned as a way of withdrawing; productivity is not discussed."),
      tfng("Quiet background speech can harm tasks that require concentration.", "True", "Paragraph C states this."),
      sc("What does paragraph D recommend?", ["Environments that offer a choice of spaces", "A return to fully private offices", "Removing all walls", "Banning headphones"], 0, "Paragraph D favors mixed environments allowing staff to choose."),
      sc("In paragraph B, why did workers use electronic channels more?", ["To protect their privacy", "Because email is faster", "Because managers required it", "To reduce noise for others"], 0, "The paragraph says they withdrew to protect privacy."),
      gap("Proponents argued that removing barriers would create a more _____ workplace.", ["democratic"], "Paragraph A."),
      gap("Lack of _____ over their surroundings leads to stress.", ["control"], "Paragraph C."),
      gap("Mixed environments offer quiet rooms for _____ work.", ["focused"], "Paragraph D: 'quiet rooms for focused work'."),
    ],
  ),
  ...withPassage(
    "The Origins of Zoos\n\nA. The keeping of wild animals is ancient. Rulers in several early civilizations assembled collections of exotic creatures as symbols of power, and such collections were displayed to impress visitors rather than to educate them. The public zoo, open to ordinary citizens, emerged only in the eighteenth and nineteenth centuries, when scientific societies began to see living collections as a tool for study.\n\nB. Early public zoos were often crowded, with animals kept in small barred cages arranged by species like objects in a museum. Mortality was high, and many animals survived only a few years. Growing public unease, together with advances in biology, gradually led to changes.\n\nC. In the early twentieth century, a new style of exhibit was introduced that replaced bars with hidden ditches and rock walls, so that visitors saw animals in surroundings resembling their natural habitats. Reformers hoped that this would improve animal welfare and change how people related to wildlife.\n\nD. Today many zoos describe conservation as their central purpose, taking part in breeding programs for endangered species. Critics question whether captive breeding can restore wild populations and argue that the money might be better spent protecting habitats. Supporters reply that zoos also raise public awareness, which is difficult to achieve in any other way.",
    [
      tfng("The earliest collections of wild animals were designed mainly to educate visitors.", "False", "Paragraph A says they impressed visitors rather than educated them."),
      tfng("Public zoos appeared before the eighteenth century.", "False", "Paragraph A says the public zoo emerged in the eighteenth and nineteenth centuries."),
      tfng("Animals in early public zoos generally lived long lives.", "False", "Paragraph B says mortality was high and many survived only a few years."),
      tfng("Ditches and rock walls were first used in zoos in Germany.", "Not Given", "The passage does not name a country."),
      tfng("Some critics think money spent on captive breeding could be used to protect habitats instead.", "True", "Paragraph D reports this criticism."),
      sc("Which paragraph describes a change in how animals were displayed?", ["Paragraph C", "Paragraph A", "Paragraph B", "Paragraph D"], 0, "Paragraph C describes hidden ditches and rock walls replacing bars."),
      sc("What is the main purpose of paragraph D?", ["To present current purposes and debates about zoos", "To describe early collections", "To criticize reformers", "To explain animal welfare laws"], 0, "It covers conservation claims and the arguments for and against."),
      gap("Early collections were symbols of _____.", ["power"], "Paragraph A."),
      gap("Early public zoos arranged animals in barred _____.", ["cages"], "Paragraph B."),
      gap("Supporters say zoos raise public _____.", ["awareness"], "Paragraph D."),
    ],
  ),
  ...withPassage(
    "Language and Thought\n\nA. Does the language we speak shape the way we think? The idea, sometimes called linguistic relativity, has divided scholars for a century. Its strongest form, that language determines what thoughts are possible, has few defenders today. Weaker versions, however, have attracted new experimental interest.\n\nB. One area of study is color. Languages divide the spectrum differently: some have separate words for light blue and dark blue, while others use a single term. In experiments, speakers of the first type were quicker to distinguish shades that straddle the boundary between the two words. The effect was small, and it disappeared when participants were asked to repeat a string of digits while performing the task, suggesting that language helps only when it is available to the mind.\n\nC. Another area concerns space. Speakers of some languages describe locations using compass directions rather than left and right, and they appear to keep a more accurate sense of orientation even in unfamiliar places. Researchers point out that habits of talking may simply train habits of attention.\n\nD. Many scholars conclude that language influences thought in modest ways without confining it. The debate now focuses less on whether an influence exists than on how large it is and under what conditions it operates.",
    [
      tfng("Most scholars today accept that language completely determines thought.", "False", "Paragraph A says the strongest form has few defenders."),
      tfng("Speakers of all languages divide the color spectrum in exactly the same way.", "False", "Paragraph B says languages divide it differently."),
      tfng("The color-discrimination effect persisted when participants repeated digits.", "False", "It disappeared under that condition."),
      tfng("Speakers of compass-direction languages always perform better in unfamiliar places.", "Not Given", "The passage says they appear to keep a more accurate sense, not always."),
      ynng("The writer suggests the debate is now mostly about the size of language's influence.", "Yes", "Paragraph D states the debate focuses on how large it is."),
      sc("What is the main point of paragraph B?", ["An experiment suggests language can affect perception slightly, but only when available to the mind", "Color words are the same everywhere", "Speakers of all languages are equally fast", "Repeating digits improves accuracy"], 0, "The effect was small and vanished with the digit task."),
      sc("What do researchers suggest in paragraph C?", ["Habits of speech may train habits of attention", "Compass directions are hard to learn", "Left and right are natural for all humans", "Orientation is fixed at birth"], 0, "Paragraph C states this possibility."),
      gap("The idea is called linguistic _____.", ["relativity"], "Paragraph A."),
      gap("Some languages have separate words for light and dark _____.", ["blue"], "Paragraph B."),
      gap("Many scholars conclude language influences thought in _____ ways.", ["modest"], "Paragraph D."),
    ],
  ),
  ...withPassage(
    "Renewable Energy Storage\n\nA. As wind and solar power supply a growing share of electricity, a challenge arises: the sun does not always shine, nor the wind blow, when demand is greatest. Storage technologies that absorb surplus energy and release it later are therefore central to any low-carbon grid.\n\nB. The most established method is pumped hydro storage, in which surplus electricity is used to pump water uphill to a reservoir. When demand rises, the water flows back down through turbines. Pumped hydro accounts for the large majority of stored grid energy worldwide, but it requires suitable geography and takes years to build.\n\nC. Batteries offer greater flexibility. Lithium-ion systems can be installed almost anywhere and respond within fractions of a second, and their costs have fallen sharply over the past decade. However, they typically store energy for a few hours rather than days, and concerns remain about the mining of the materials they require.\n\nD. Researchers are also exploring options for longer storage, including the production of hydrogen from surplus electricity and heat stored in molten salt. None of these has yet reached the scale needed, and most experts expect the future grid to rely on a combination of technologies rather than a single solution.",
    [
      tfng("Wind and solar generation always coincides with peak demand.", "False", "Paragraph A says the sun does not always shine nor the wind blow when demand is greatest."),
      tfng("Pumped hydro storage accounts for most stored grid energy worldwide.", "True", "Paragraph B says it accounts for the large majority."),
      tfng("Pumped hydro plants can be built quickly in any location.", "False", "Paragraph B says it requires suitable geography and takes years."),
      tfng("Lithium-ion batteries are cheaper than pumped hydro.", "Not Given", "No cost comparison with pumped hydro is given."),
      ynng("The writer expects a single technology to solve the storage problem.", "No", "Paragraph D says experts expect a combination of technologies."),
      sc("What is one limitation of batteries given in paragraph C?", ["They typically store energy for hours rather than days", "They respond too slowly", "They can only be installed near reservoirs", "They are becoming more expensive"], 0, "Paragraph C states this."),
      sc("Which paragraph introduces longer-term storage options still being researched?", ["Paragraph D", "Paragraph A", "Paragraph B", "Paragraph C"], 0, "Paragraph D discusses hydrogen and molten salt."),
      gap("Pumped hydro uses surplus electricity to pump water _____.", ["uphill"], "Paragraph B."),
      gap("Lithium-ion systems respond within fractions of a _____.", ["second"], "Paragraph C."),
      gap("Heat can be stored in molten _____.", ["salt"], "Paragraph D."),
    ],
  ),
  ...withPassage(
    "The Decline of Handwriting\n\nA. In many countries, children now spend more time typing than writing by hand, and some educators have questioned whether handwriting should continue to be taught. Supporters of keyboards point to speed and legibility, and to the fact that most adult writing is done on screens.\n\nB. Yet research suggests that the physical act of forming letters may benefit learning. In one study, young children who practiced letters by hand later recognized them more accurately than those who typed them. Brain scans of the two groups showed greater activity in areas associated with reading among the handwriting group.\n\nC. Among older students, note-taking has attracted attention. Students who take notes by hand tend to summarize in their own words because they cannot write as fast as a lecturer speaks, and this may improve understanding. Those who type often record more words but process them less deeply. Some later studies have failed to reproduce the difference, however, and the finding remains contested.\n\nD. Whatever the outcome, few experts propose abandoning keyboards. The more common recommendation is that schools should teach both skills, treating handwriting not as a rival to typing but as a foundation for literacy.",
    [
      tfng("Some educators have questioned whether handwriting should still be taught.", "True", "Paragraph A states this."),
      tfng("In the study in paragraph B, typing children recognized letters better than handwriting children.", "False", "The handwriting group recognized them more accurately."),
      tfng("Handwriting students in the study showed more activity in areas linked to reading.", "True", "Paragraph B."),
      tfng("Students who type notes always understand lectures better.", "False", "Paragraph C suggests those who handwrite may understand more, and the finding is contested."),
      ynng("The writer believes schools should stop teaching typing.", "No", "Paragraph D says few experts propose abandoning keyboards and recommends teaching both."),
      sc("Why do handwriting note-takers summarize more, according to paragraph C?", ["They cannot write as fast as the lecturer speaks", "They prefer short lectures", "They use better pens", "They review notes twice"], 0, "Paragraph C gives this reason."),
      sc("What does paragraph C say about later studies?", ["Some failed to reproduce the difference", "All confirmed the finding", "None were carried out", "They involved younger children"], 0, "The finding remains contested."),
      gap("Supporters of keyboards point to speed and _____.", ["legibility"], "Paragraph A."),
      gap("Typing students often record more _____.", ["words"], "Paragraph C."),
      gap("Handwriting is described as a foundation for _____.", ["literacy"], "Paragraph D."),
    ],
  ),
];
