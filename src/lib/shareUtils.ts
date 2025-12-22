// Utility functions for sharing content to X (Twitter)

// Helper to get first complete sentence(s) that fit within limit
const getCompleteSentences = (text: string, maxLength: number): string => {
  // Split by sentence-ending punctuation
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let result = '';
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if ((result + ' ' + trimmedSentence).trim().length <= maxLength) {
      result = (result + ' ' + trimmedSentence).trim();
    } else {
      break;
    }
  }
  
  // If we couldn't fit even one sentence, take the first one anyway
  if (!result && sentences.length > 0) {
    result = sentences[0].trim();
  }
  
  return result;
};

export const shareToX = (text: string) => {
  const encodedText = encodeURIComponent(text);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
  
  window.open(twitterUrl, '_blank', 'width=550,height=420');
};

export const shareBattleResult = (
  winner: string,
  loser: string,
  winnerPower: number,
  loserPower: number
) => {
  const text = `⚔️ ROVER BATTLE RESULTS ⚔️\n\n🏆 ${winner} (${winnerPower} PWR) defeated ${loser} (${loserPower} PWR) in an epic showdown!`;
  shareToX(text);
};

export const shareMission = (roverName: string, mission: string) => {
  // Get complete sentences that fit within Twitter's limit (leaving room for header ~50 chars)
  const missionText = getCompleteSentences(mission, 230);
  const text = `📡 MISSION LOG from ${roverName}:\n\n"${missionText}"`;
  shareToX(text);
};
